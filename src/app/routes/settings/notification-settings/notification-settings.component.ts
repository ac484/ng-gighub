/**
 * Notification Settings Component
 *
 * Allows users to configure push notification preferences.
 *
 * @architecture
 * - UI Layer: Presentation and user interaction
 * - Uses PushMessagingService for push notification management
 * - Uses NotificationStore for state management
 * - Follows Angular 20 modern patterns (Signals, Standalone, OnPush)
 *
 * @features
 * - Enable/disable push notifications
 * - View current permission status
 * - Request permissions with clear UI
 * - Display FCM token for debugging
 * - Handle all permission states (granted, denied, default, unsupported)
 *
 * @usage
 * Add to routing configuration:
 * ```typescript
 * {
 *   path: 'notification-settings',
 *   component: NotificationSettingsComponent
 * }
 * ```
 */
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger/logger.service';
import { PushMessagingService } from '@core/services/push-messaging.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card nzTitle="推送通知設定" [nzLoading]="loading()">
      @if (error()) {
        <nz-alert
          nzType="error"
          [nzMessage]="'發生錯誤'"
          [nzDescription]="error()?.message ?? '未知錯誤'"
          nzShowIcon
          nzCloseable
          (nzOnClose)="clearError()"
          class="mb-3"
        />
      }

      <!-- Permission Status -->
      <nz-descriptions nzBordered [nzColumn]="1">
        <nz-descriptions-item nzTitle="瀏覽器支援">
          <nz-tag [nzColor]="isSupported() ? 'success' : 'error'">
            {{ isSupported() ? '支援' : '不支援' }}
          </nz-tag>
        </nz-descriptions-item>

        <nz-descriptions-item nzTitle="通知權限">
          <nz-tag [nzColor]="permissionColor()">
            {{ permissionText() }}
          </nz-tag>
        </nz-descriptions-item>

        <nz-descriptions-item nzTitle="初始化狀態">
          <nz-tag [nzColor]="initialized() ? 'success' : 'default'">
            {{ initialized() ? '已初始化' : '未初始化' }}
          </nz-tag>
        </nz-descriptions-item>

        <nz-descriptions-item nzTitle="準備狀態">
          <nz-tag [nzColor]="isReady() ? 'success' : 'warning'">
            {{ isReady() ? '就緒' : '未就緒' }}
          </nz-tag>
        </nz-descriptions-item>
      </nz-descriptions>

      <!-- Actions -->
      <div class="mt-4">
        <nz-space>
          <!-- Request Permission Button -->
          @if (canRequestPermission()) {
            <button *nzSpaceItem nz-button nzType="primary" [nzLoading]="loading()" (click)="requestPermission()">
              <span nz-icon nzType="bell" nzTheme="outline"></span>
              請求通知權限
            </button>
          }

          <!-- Initialize Button -->
          @if (!initialized() && hasPermission()) {
            <button *nzSpaceItem nz-button nzType="primary" [nzLoading]="loading()" (click)="initialize()">
              <span nz-icon nzType="rocket" nzTheme="outline"></span>
              初始化推送通知
            </button>
          }

          <!-- Refresh Token Button -->
          @if (initialized() && hasPermission()) {
            <button *nzSpaceItem nz-button [nzLoading]="loading()" (click)="refreshToken()">
              <span nz-icon nzType="sync" nzTheme="outline"></span>
              刷新 Token
            </button>
          }

          <!-- Test Notification Button -->
          @if (isReady()) {
            <button *nzSpaceItem nz-button [nzLoading]="loading()" (click)="sendTestNotification()">
              <span nz-icon nzType="notification" nzTheme="outline"></span>
              發送測試通知
            </button>
          }
        </nz-space>
      </div>

      <!-- FCM Token Display (for debugging) -->
      @if (pushToken()) {
        <nz-divider />
        <div>
          <h4>FCM Token (開發用)</h4>
          <nz-input-group [nzSuffix]="copyTpl">
            <input nz-input [value]="pushToken()" readonly style="font-family: monospace; font-size: 12px;" />
          </nz-input-group>
          <ng-template #copyTpl>
            <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="複製 Token" (click)="copyToken()">
              <span nz-icon nzType="copy" nzTheme="outline"></span>
            </button>
          </ng-template>
          <p class="text-muted mt-2">
            <small>此 Token 用於後端發送推送通知。請勿公開分享。</small>
          </p>
        </div>
      }

      <!-- Help Information -->
      <nz-divider />
      <nz-alert
        nzType="info"
        nzMessage="關於推送通知"
        nzDescription="推送通知需要瀏覽器支援和用戶授權。如果您封鎖了通知權限，請在瀏覽器設定中手動啟用。"
        nzShowIcon
      />

      <!-- Browser Instructions -->
      @if (permission() === 'denied') {
        <nz-alert nzType="warning" nzMessage="如何啟用通知權限" class="mt-3" nzShowIcon>
          <ng-container *nzAlertDescription>
            <ul>
              <li><strong>Chrome/Edge:</strong> 點擊網址列左側的鎖頭圖示 → 網站設定 → 通知 → 允許</li>
              <li><strong>Firefox:</strong> 點擊網址列左側的鎖頭圖示 → 更多資訊 → 權限 → 通知 → 允許</li>
              <li><strong>Safari:</strong> Safari → 偏好設定 → 網站 → 通知 → 允許</li>
            </ul>
          </ng-container>
        </nz-alert>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 24px;
      }

      .text-muted {
        color: rgba(0, 0, 0, 0.45);
      }

      .mb-3 {
        margin-bottom: 16px;
      }

      .mt-2 {
        margin-top: 8px;
      }

      .mt-3 {
        margin-top: 16px;
      }

      .mt-4 {
        margin-top: 24px;
      }
    `
  ]
})
export class NotificationSettingsComponent {
  private readonly pushService = inject(PushMessagingService);
  private readonly firebaseService = inject(FirebaseService);
  private readonly logger = inject(LoggerService);

  // State from service
  readonly permission = this.pushService.permission;
  readonly pushToken = this.pushService.pushToken;
  readonly initialized = this.pushService.initialized;
  readonly error = this.pushService.error;
  readonly loading = this.pushService.loading;

  // Computed states
  readonly hasPermission = this.pushService.hasPermission;
  readonly isSupported = this.pushService.isSupported;
  readonly canRequestPermission = this.pushService.canRequestPermission;
  readonly isReady = this.pushService.isReady;

  // UI computed
  readonly permissionColor = computed(() => {
    const perm = this.permission();
    switch (perm) {
      case 'granted':
        return 'success';
      case 'denied':
        return 'error';
      case 'default':
        return 'warning';
      case 'unsupported':
        return 'default';
      default:
        return 'default';
    }
  });

  readonly permissionText = computed(() => {
    const perm = this.permission();
    switch (perm) {
      case 'granted':
        return '已授權';
      case 'denied':
        return '已拒絕';
      case 'default':
        return '尚未詢問';
      case 'unsupported':
        return '不支援';
      default:
        return '未知';
    }
  });

  constructor() {
    // Auto-initialize if permission already granted
    effect(() => {
      if (this.hasPermission() && !this.initialized()) {
        const userId = this.firebaseService.getCurrentUserId();
        if (userId) {
          this.logger.info('[NotificationSettingsComponent]', 'Auto-initializing push notifications');
          this.initialize();
        }
      }
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<void> {
    try {
      await this.pushService.requestPermission();
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Failed to request permission', error as Error);
    }
  }

  /**
   * Initialize push messaging
   */
  async initialize(): Promise<void> {
    const userId = this.firebaseService.getCurrentUserId();
    if (!userId) {
      this.logger.error('[NotificationSettingsComponent]', 'Cannot initialize: user not logged in');
      return;
    }

    try {
      await this.pushService.init(userId);
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Initialization failed', error as Error);
    }
  }

  /**
   * Refresh FCM token
   */
  async refreshToken(): Promise<void> {
    const userId = this.firebaseService.getCurrentUserId();
    if (!userId) {
      this.logger.error('[NotificationSettingsComponent]', 'Cannot refresh token: user not logged in');
      return;
    }

    try {
      await this.pushService.refreshToken(userId);
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Token refresh failed', error as Error);
    }
  }

  /**
   * Send a test notification (for debugging)
   */
  sendTestNotification(): void {
    // This would typically be done from backend
    // For now, just log the token
    this.logger.info('[NotificationSettingsComponent]', 'Test notification', {
      token: this.pushToken(),
      message: 'Use this token with Firebase Console or backend API to send test notification'
    });

    alert(`FCM Token: ${this.pushToken()}\n\n使用此 Token 透過 Firebase Console 或後端 API 發送測試通知。`);
  }

  /**
   * Copy token to clipboard
   */
  async copyToken(): Promise<void> {
    const token = this.pushToken();
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      this.logger.info('[NotificationSettingsComponent]', 'Token copied to clipboard');
      // Could add a toast notification here
    } catch (error) {
      this.logger.error('[NotificationSettingsComponent]', 'Failed to copy token', error as Error);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.pushService.clearError();
  }
}
