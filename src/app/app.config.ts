import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { default as ngLang } from '@angular/common/locales/zh';
import { ApplicationConfig, EnvironmentProviders, Provider } from '@angular/core';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck } from '@angular/fire/app-check';
import { getAuth, provideAuth as provideAuth_alias } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import {
  initializeFirestore,
  provideFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore
} from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withHashLocation,
  RouterFeatures,
  withViewTransitions
} from '@angular/router';
import { I18NService, defaultInterceptor, provideBindAuthRefresh, provideStartup } from '@core';
import { provideCellWidgets } from '@delon/abc/cell';
import { provideSTWidgets } from '@delon/abc/st';
import { authSimpleInterceptor, provideAuth } from '@delon/auth';
import { provideSFConfig } from '@delon/form';
import { AlainProvideLang, provideAlain, zh_CN as delonLang } from '@delon/theme';
import { AlainConfig } from '@delon/util/config';
import { environment } from '@env/environment';
import { CELL_WIDGETS, SF_WIDGETS, ST_WIDGETS } from '@shared';
import { zhCN as dateLang } from 'date-fns/locale';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { zh_CN as zorroLang } from 'ng-zorro-antd/i18n';

import { ICONS } from '../style-icons';
import { ICONS_AUTO } from '../style-icons-auto';
import { routes } from './routes/routes';

const defaultLang: AlainProvideLang = {
  abbr: 'zh-CN',
  ng: ngLang,
  zorro: zorroLang,
  date: dateLang,
  delon: delonLang
};

const alainConfig: AlainConfig = {
  st: { modal: { size: 'lg' } },
  pageHeader: { homeI18n: 'home' },
  lodop: {
    license: `A59B099A586B3851E0F0D7FDBF37B603`,
    licenseA: `C94CEE276DB2187AE6B65D56B3FC2848`
  },
  auth: { login_url: '/passport/login' }
};

// ============================================
// Xuanwu Theme Configuration
// 玄武主題配置
// ============================================
// Based on ng-zorro-antd 20.3.1+ API
// References:
// - https://ng.ant.design/docs/customize-theme-variable/en
// - Context7 Documentation: /ng-zorro/ng-zorro-antd
const ngZorroConfig: NzConfig = {
  // ============================================
  // Theme Configuration (Runtime Dynamic Theming)
  // 主題配置（運行時動態主題）
  // ============================================
  // Note: Runtime theme changes via NzConfigService.set('theme', {...})
  theme: {
    primaryColor: '#1E3A8A', // Xuanwu Navy (玄武深藍) - Main brand color
    successColor: '#0D9488', // Deep Teal (深青綠) - Success states
    warningColor: '#F59E0B', // Amber Yellow (琥珀黃) - Warning states
    errorColor: '#EF4444', // Crimson Red (赤紅) - Error states
    infoColor: '#64748B' // Steel Blue (鋼藍) - Info states
  },

  // ============================================
  // Message Component Configuration
  // 消息組件配置
  // ============================================
  message: {
    nzTop: 24, // Distance from top (px)
    nzDuration: 3000, // Display duration (ms)
    nzMaxStack: 7, // Maximum number of messages
    nzPauseOnHover: true, // Pause timeout on hover
    nzAnimate: true // Enable animations
  },

  // ============================================
  // Notification Component Configuration
  // 通知組件配置
  // ============================================
  notification: {
    nzTop: 24, // Distance from top (px)
    nzBottom: 24, // Distance from bottom (px)
    nzPlacement: 'topRight', // Placement position
    nzDuration: 4500, // Display duration (ms)
    nzMaxStack: 8, // Maximum number of notifications
    nzPauseOnHover: true, // Pause timeout on hover
    nzAnimate: true // Enable animations
  },

  // ============================================
  // Modal Component Configuration
  // 模態框組件配置
  // ============================================
  modal: {
    nzMaskClosable: false // Click mask to close (disabled for safety)
  },

  // ============================================
  // Empty State Configuration
  // 空狀態配置
  // ============================================
  empty: {
    nzDefaultEmptyContent: '暫無數據' // Default empty text (Traditional Chinese)
  }
};

const routerFeatures: RouterFeatures[] = [
  withComponentInputBinding(),
  withViewTransitions(),
  withInMemoryScrolling({ scrollPositionRestoration: 'top' })
];
if (environment.useHash) routerFeatures.push(withHashLocation());

const providers: Array<Provider | EnvironmentProviders> = [
  provideHttpClient(withInterceptors([...(environment.interceptorFns ?? []), authSimpleInterceptor, defaultInterceptor])),
  provideAnimations(),
  provideRouter(routes, ...routerFeatures),
  provideAlain({ config: alainConfig, defaultLang, i18nClass: I18NService, icons: [...ICONS_AUTO, ...ICONS] }),
  provideNzConfig(ngZorroConfig),
  provideAuth(),
  provideCellWidgets(...CELL_WIDGETS),
  provideSTWidgets(...ST_WIDGETS),
  provideSFConfig({ widgets: SF_WIDGETS }),
  provideStartup(),
  ...(environment.providers || [])
];

// If you use `@delon/auth` to refresh the token, additional registration `provideBindAuthRefresh` is required
if (environment.api?.refreshTokenEnabled && environment.api.refreshTokenType === 'auth-refresh') {
  providers.push(provideBindAuthRefresh());
}

// Firebase configuration
// 啟用 Firestore 離線持久化 (Enable Firestore Offline Persistence)
// 使用 multi-tab IndexedDB 持久化，支援多分頁同步
const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  provideFirebaseApp(() =>
    initializeApp({
      apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
      authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
      projectId: 'elite-chiller-455712-c4',
      storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
      messagingSenderId: '7807661688',
      appId: '1:7807661688:web:5f96a5fe30b799f31d1f8d',
      measurementId: 'G-5KJJ3DD2G7'
    })
  ),
  provideAuth_alias(() => getAuth()),
  provideAnalytics(() => getAnalytics()),
  ScreenTrackingService,
  UserTrackingService,
  provideAppCheck(() => {
    const provider = new ReCaptchaEnterpriseProvider('6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc');
    return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  }),
  // 使用 initializeFirestore 啟用持久化，而非 getFirestore
  // Use initializeFirestore with persistence enabled instead of getFirestore
  // 參考文檔: https://firebase.google.com/docs/firestore/manage-data/enable-offline
  provideFirestore((): Firestore => {
    // 獲取已初始化的 Firebase App 實例
    // Get the already initialized Firebase App instance
    const app = getApp();

    // 啟用多分頁 IndexedDB 持久化
    // Enable multi-tab IndexedDB persistence for offline data caching
    // This allows data to persist across page refreshes and be accessible offline
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  }),
  provideDatabase(() => getDatabase()),
  provideFunctions(() => getFunctions(getApp(), 'asia-east1')),
  provideMessaging(() => getMessaging()),
  providePerformance(() => getPerformance()),
  provideStorage(() => getStorage()),
  provideRemoteConfig(() => getRemoteConfig()),
  // TODO: Migrate to Firebase AI SDK when stable (getVertexAI is deprecated)
  provideVertexAI(() => getVertexAI())
];

export const appConfig: ApplicationConfig = {
  providers: [...providers, ...firebaseProviders]
};
