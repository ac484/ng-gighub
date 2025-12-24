import { Component, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ContextType } from '@core';
import { SettingsService, User, ModalHelper } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { WorkspaceContextService, MenuManagementService } from '@shared';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { HeaderNotifyComponent } from './widgets/communication/notify.component';
import { HeaderTaskComponent } from './widgets/communication/task.component';
import { HeaderContextSwitcherComponent } from './widgets/account-switcher/context-switcher.component';
import { HeaderI18nComponent } from './widgets/locale/i18n.component';
import { HeaderClearStorageComponent } from './widgets/system/clear-storage.component';
import { HeaderFullScreenComponent } from './widgets/system/fullscreen.component';
import { HeaderRTLComponent } from './widgets/system/rtl.component';
import { HeaderUserComponent } from './widgets/account-switcher/user.component';
import { HeaderIconComponent } from './widgets/utility/icon.component';
import { HeaderSearchComponent } from './widgets/utility/search.component';
import { CreateOrganizationComponent } from '../../shared/components/create-organization/create-organization.component';
import { CreateTeamModalComponent } from '../../shared/components/create-team-modal/create-team-modal.component';

@Component({
  selector: 'layout-basic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <layout-default [options]="options" [asideUser]="asideUserTpl" [content]="contentTpl" [customError]="null">
      <layout-default-header-item direction="left">
        <a layout-default-header-item-trigger href="//github.com/7Spade/GigHub" target="_blank">
          <i nz-icon nzType="github"></i>
        </a>
      </layout-default-header-item>
      <layout-default-header-item direction="left" hidden="mobile">
        <a layout-default-header-item-trigger routerLink="/passport/lock">
          <i nz-icon nzType="lock"></i>
        </a>
      </layout-default-header-item>
      <layout-default-header-item direction="left" hidden="pc">
        <div layout-default-header-item-trigger (click)="searchToggleStatus = !searchToggleStatus">
          <i nz-icon nzType="search"></i>
        </div>
      </layout-default-header-item>
      <layout-default-header-item direction="middle">
        <header-search class="alain-default__search" [(toggleChange)]="searchToggleStatus" />
      </layout-default-header-item>
      <layout-default-header-item direction="right">
        <header-notify />
      </layout-default-header-item>
      <layout-default-header-item direction="right" hidden="mobile">
        <header-task />
      </layout-default-header-item>
      <layout-default-header-item direction="right" hidden="mobile">
        <header-icon />
      </layout-default-header-item>
      <layout-default-header-item direction="right" hidden="mobile">
        <div layout-default-header-item-trigger nz-dropdown [nzDropdownMenu]="settingsMenu" nzTrigger="click" nzPlacement="bottomRight">
          <i nz-icon nzType="setting"></i>
        </div>
        <nz-dropdown-menu #settingsMenu="nzDropdownMenu">
          <div nz-menu style="width: 200px;">
            <div nz-menu-item>
              <header-rtl />
            </div>
            <div nz-menu-item>
              <header-fullscreen />
            </div>
            <div nz-menu-item>
              <header-clear-storage />
            </div>
            <div nz-menu-item>
              <header-i18n />
            </div>
          </div>
        </nz-dropdown-menu>
      </layout-default-header-item>
      <layout-default-header-item direction="right">
        <header-user />
      </layout-default-header-item>
      <ng-template #asideUserTpl>
        @if (user) {
          <div nz-dropdown nzTrigger="click" [nzDropdownMenu]="userMenu" class="alain-default__aside-user">
            <nz-avatar class="alain-default__aside-user-avatar" [nzSrc]="user.avatar" />
            <div class="alain-default__aside-user-info">
              <strong>{{ user.name }}</strong>
              <p class="mb0">{{ user.email }}</p>
            </div>
          </div>
          <nz-dropdown-menu #userMenu="nzDropdownMenu">
            <ul nz-menu>
              <!-- 上下文切換器區域 -->
              <li nz-menu-item [nzDisabled]="true" style="cursor: default; opacity: 1; background: transparent;">
                <div style="font-weight: 600; margin-bottom: 4px;">切換工作區</div>
              </li>
              <li style="padding: 0;">
                <header-context-switcher />
              </li>
              <li nz-menu-divider></li>

              <!-- Create Organization/Team buttons -->
              <li nz-menu-item (click)="openCreateOrganization()">
                <i nz-icon nzType="plus-circle" class="mr-sm"></i>
                <span>建立組織</span>
              </li>
              @if (isOrganizationContext()) {
                <li nz-menu-item (click)="openCreateTeam()">
                  <i nz-icon nzType="usergroup-add" class="mr-sm"></i>
                  <span>建立團隊</span>
                </li>
              }
              <li nz-menu-divider></li>
            </ul>
          </nz-dropdown-menu>
        } @else {
          <!-- Loading state or default avatar when user is not yet loaded -->
          <div class="alain-default__aside-user">
            <nz-avatar class="alain-default__aside-user-avatar" nzIcon="user" />
            <div class="alain-default__aside-user-info">
              <strong>載入中...</strong>
              <p class="mb0">--</p>
            </div>
          </div>
        }
      </ng-template>
      <ng-template #contentTpl>
        <router-outlet />
      </ng-template>
    </layout-default>
  `,
  imports: [
    RouterOutlet,
    RouterLink,
    LayoutDefaultModule,
    NzIconModule,
    NzMenuModule,
    NzDropDownModule,
    NzAvatarModule,
    HeaderSearchComponent,
    HeaderNotifyComponent,
    HeaderTaskComponent,
    HeaderIconComponent,
    HeaderRTLComponent,
    HeaderI18nComponent,
    HeaderClearStorageComponent,
    HeaderFullScreenComponent,
    HeaderUserComponent,
    HeaderContextSwitcherComponent
  ]
})
export class LayoutBasicComponent {
  private readonly settings = inject(SettingsService);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly menuManagement = inject(MenuManagementService);
  private readonly modal = inject(ModalHelper);

  options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-full.svg`,
    logoCollapsed: `./assets/logo.svg`
  };
  searchToggleStatus = false;

  constructor() {
    // Load menu configuration asynchronously
    this.menuManagement.loadConfig().then(() => {
      console.log('[LayoutBasicComponent] Menu config loaded, setting initial menu');
      // Set initial menu based on current context
      this.menuManagement.updateMenu(this.workspaceContext.contextType());
    });

    // Update menu when context changes (but skip the first emission since we handle it above)
    let isFirstEmission = true;
    effect(() => {
      const contextType = this.workspaceContext.contextType();

      if (isFirstEmission) {
        isFirstEmission = false;
        return;
      }

      console.log('[LayoutBasicComponent] Context changed:', contextType);
      this.menuManagement.updateMenu(contextType);
    });
  }

  get user(): User {
    return this.settings.user;
  }

  /**
   * Check if current context is organization
   */
  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  /**
   * Open create organization modal
   */
  openCreateOrganization(): void {
    this.modal.create(CreateOrganizationComponent, {}, { size: 'md' }).subscribe(result => {
      if (result) {
        console.log('Organization created:', result);
      }
    });
  }

  /**
   * Open create team modal
   */
  openCreateTeam(): void {
    const currentOrgId = this.workspaceContext.contextId();
    if (!currentOrgId) {
      console.warn('No organization selected');
      return;
    }

    this.modal.create(CreateTeamModalComponent, { organizationId: currentOrgId }, { size: 'md' }).subscribe(result => {
      if (result) {
        console.log('Team created:', result);
      }
    });
  }
}
