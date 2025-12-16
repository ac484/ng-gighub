import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, Injectable, Provider, inject, provideAppInitializer } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger/logger.service';
import { PushMessagingService } from '@core/services/push-messaging.service';
import { ACLService } from '@delon/acl';
import { ALAIN_I18N_TOKEN, MenuService, SettingsService, TitleService } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { Observable, zip, catchError, map } from 'rxjs';

import { I18NService } from '../i18n/i18n.service';

/**
 * Used for application startup
 * Generally used to get the basic data of the application, like: Menu Data, User Data, etc.
 */
export function provideStartup(): Array<Provider | EnvironmentProviders> {
  return [
    StartupService,
    provideAppInitializer(() => {
      const initializerFn = (
        (startupService: StartupService) => () =>
          startupService.load()
      )(inject(StartupService));
      return initializerFn();
    })
  ];
}

@Injectable()
export class StartupService {
  private menuService = inject(MenuService);
  private settingService = inject(SettingsService);
  private aclService = inject(ACLService);
  private titleService = inject(TitleService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private firebase = inject(FirebaseService);
  private pushMessaging = inject(PushMessagingService);
  private logger = inject(LoggerService);

  load(): Observable<void> {
    const defaultLang = this.i18n.defaultLang;
    // If http request allows anonymous access, you need to add `ALLOW_ANONYMOUS`:
    // this.httpClient.get('/app', { context: new HttpContext().set(ALLOW_ANONYMOUS, this.tokenService.get()?.token ? false : true) })
    return zip(this.i18n.loadLangData(defaultLang), this.httpClient.get('./assets/tmp/app-data.json')).pipe(
      // 接收其他拦截器后产生的异常消息
      catchError(res => {
        console.warn(`StartupService.load: Network request failed`, res);
        setTimeout(() => this.router.navigateByUrl(`/exception/500`));
        return [];
      }),
      map(([langData, appData]: [Record<string, string>, NzSafeAny]) => {
        // setting language data
        this.i18n.use(defaultLang, langData);

        // 应用信息：包括站点名、描述、年份
        this.settingService.setApp(appData.app);
        // 用户信息：包括姓名、头像、邮箱地址
        this.settingService.setUser(appData.user);
        // ACL：设置权限为全量
        this.aclService.setFull(true);
        // 初始化菜单
        this.menuService.add(appData.menu);
        // 设置页面标题的后缀
        this.titleService.default = '';
        this.titleService.suffix = appData.app.name;

        // Initialize push notifications if user is authenticated
        this.initializePushNotifications();
      })
    );
  }

  /**
   * Initialize push notifications for authenticated users
   *
   * This method attempts to initialize FCM push notifications
   * after the app has been bootstrapped. It's a non-blocking
   * operation that won't fail the app startup if it encounters errors.
   */
  private async initializePushNotifications(): Promise<void> {
    try {
      const userId = this.firebase.getCurrentUserId();

      if (!userId) {
        this.logger.info('[StartupService]', 'Skipping push notification init: user not authenticated');
        return;
      }

      // Initialize push notifications in background
      // Use setTimeout to avoid blocking startup
      setTimeout(async () => {
        try {
          await this.pushMessaging.init(userId);

          if (this.pushMessaging.isReady()) {
            this.logger.info('[StartupService]', 'Push notifications initialized successfully');
          } else {
            this.logger.warn('[StartupService]', 'Push notifications initialized but not ready', {
              hasPermission: this.pushMessaging.hasPermission(),
              isSupported: this.pushMessaging.isSupported()
            });
          }
        } catch (error) {
          this.logger.error('[StartupService]', 'Failed to initialize push notifications', error as Error);
          // Don't throw - push notifications are non-critical
        }
      }, 1000); // Delay 1 second to let the app fully initialize first
    } catch (error) {
      this.logger.error('[StartupService]', 'Push notification init error', error as Error);
      // Don't throw - this is non-critical
    }
  }
}
