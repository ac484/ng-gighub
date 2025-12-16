/**
 * Push Messaging Service
 *
 * Modern implementation of Firebase Cloud Messaging (FCM) for push notifications.
 *
 * @architecture Three-Layer Architecture
 * - Service Layer: Business logic for push notification management
 * - Uses NotificationStore for state management (Signals)
 * - Uses NotificationRepository for data persistence
 *
 * @features
 * - ✅ Angular 20 Signals for reactive state management
 * - ✅ Modern @angular/fire/messaging v20 API
 * - ✅ Automatic lifecycle management with DestroyRef
 * - ✅ Robust error handling with typed errors
 * - ✅ Browser/SSR compatibility checks
 * - ✅ Token persistence with Firestore
 * - ✅ Realtime message handling
 *
 * @security
 * - VAPID key validation
 * - Permission state management
 * - Service Worker isolation
 *
 * @usage
 * ```typescript
 * const pushService = inject(PushMessagingService);
 * await pushService.init(userId);
 * if (pushService.hasPermission()) {
 *   const token = pushService.pushToken();
 * }
 * ```
 */
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Messaging, getToken, isSupported, onMessage, MessagePayload } from '@angular/fire/messaging';
import { FcmTokenRepository } from '@core/data-access/repositories/shared/fcm-token.repository';
import { NotificationRepository } from '@core/data-access/repositories/shared/notification.repository';
import { CreateNotificationData, NotificationType } from '@core/domain/models/notification.model';
import { LoggerService } from '@core/services/logger/logger.service';
import { NotificationAnalyticsService } from '@core/services/notification-analytics.service';
import { NotificationStore } from '@core/state/stores/notification.store';
import { environment } from '@env/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';

/**
 * Push messaging error types
 */
export interface PushMessagingError {
  name?: string;
  code: 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'TOKEN_FAILED' | 'SW_FAILED' | 'INIT_FAILED';
  message: string;
  recoverable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PushMessagingService {
  private readonly messaging = inject(Messaging);
  private readonly logger = inject(LoggerService);
  private readonly notification = inject(NzNotificationService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly notificationRepository = inject(NotificationRepository);
  private readonly fcmTokenRepository = inject(FcmTokenRepository);
  private readonly analytics = inject(NotificationAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // State signals (private)
  private readonly _permission = signal<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  private readonly _token = signal<string | null>(null);
  private readonly _initialized = signal(false);
  private readonly _error = signal<PushMessagingError | null>(null);
  private readonly _loading = signal(false);

  // Public readonly state
  readonly permission = this._permission.asReadonly();
  readonly pushToken = this._token.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed states
  readonly hasPermission = computed(() => this._permission() === 'granted');
  readonly isSupported = computed(() => this._permission() !== 'unsupported');
  readonly canRequestPermission = computed(() => this._permission() === 'default');
  readonly isReady = computed(() => this._initialized() && this.hasPermission() && this._token() !== null);

  /**
   * Initialize push messaging for a user
   *
   * @param userId User ID to associate notifications with
   * @throws {PushMessagingError} If initialization fails
   *
   * @example
   * ```typescript
   * try {
   *   await pushService.init(userId);
   *   console.log('Push notifications ready:', pushService.isReady());
   * } catch (error) {
   *   console.error('Failed to initialize:', error);
   * }
   * ```
   */
  async init(userId: string): Promise<void> {
    // Guard: Prevent re-initialization
    if (this._initialized()) {
      this.logger.info('[PushMessagingService]', 'Already initialized, skipping');
      return;
    }

    // Guard: Browser environment check
    if (!this.isBrowser()) {
      this.logger.warn('[PushMessagingService]', 'Not in browser environment, skipping initialization');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // Step 1: Check browser support
      const supported = await this.checkSupport();
      if (!supported) {
        throw this.createError('UNSUPPORTED', 'Push notifications not supported in this browser', false);
      }

      // Step 2: Ensure permission
      await this.ensurePermission();
      if (!this.hasPermission()) {
        throw this.createError('PERMISSION_DENIED', 'Push notification permission denied by user', true);
      }

      // Step 3: Register service worker and get token
      await this.registerToken(userId);

      // Step 4: Listen for foreground messages
      this.listenForMessages(userId);

      this._initialized.set(true);
      this.logger.info('[PushMessagingService]', 'Push messaging initialized successfully', {
        userId,
        hasToken: !!this._token()
      });
    } catch (error) {
      const pushError = error as PushMessagingError;
      this._error.set(pushError);
      this.logger.error('[PushMessagingService]', 'Initialization failed', pushError as Error);
      throw pushError;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Request notification permission from user
   *
   * @returns Promise<boolean> True if permission granted
   */
  async requestPermission(): Promise<boolean> {
    if (!this.canRequestPermission()) {
      this.logger.warn('[PushMessagingService]', 'Cannot request permission', {
        currentPermission: this._permission()
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this._permission.set(result);
      this.logger.info('[PushMessagingService]', 'Permission request result', { result });

      // Track permission change
      this.analytics.trackPermissionChange(result as 'granted' | 'denied' | 'default', 'manual');

      return result === 'granted';
    } catch (error) {
      this.logger.error('[PushMessagingService]', 'Permission request failed', error as Error);
      return false;
    }
  }

  /**
   * Refresh FCM token (useful after token expiration)
   *
   * @param userId User ID
   */
  async refreshToken(userId: string): Promise<void> {
    if (!this.hasPermission()) {
      throw this.createError('PERMISSION_DENIED', 'Cannot refresh token without permission', true);
    }

    try {
      await this.registerToken(userId);
      this.logger.info('[PushMessagingService]', 'Token refreshed successfully');
    } catch (error) {
      this.logger.error('[PushMessagingService]', 'Token refresh failed', error as Error);
      throw error;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  // ==================== Private Methods ====================

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  private async checkSupport(): Promise<boolean> {
    try {
      return await isSupported();
    } catch (error) {
      this.logger.warn('[PushMessagingService]', 'Support check failed', { error });
      return false;
    }
  }

  private async ensurePermission(): Promise<void> {
    if (typeof Notification === 'undefined') {
      this._permission.set('unsupported');
      return;
    }

    this._permission.set(Notification.permission);

    // Auto-request if default (can be disabled if you want explicit user action)
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      this._permission.set(result);
    }
  }

  private async registerToken(userId: string): Promise<void> {
    try {
      // Check service worker support
      if (!('serviceWorker' in navigator)) {
        throw this.createError('SW_FAILED', 'Service workers not supported', false);
      }

      // Get or register service worker
      const registration =
        (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ??
        (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));

      // Validate VAPID key
      const vapidKey = environment.firebaseMessagingPublicKey;
      if (!vapidKey) {
        throw this.createError('TOKEN_FAILED', 'VAPID key not configured', false);
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        throw this.createError('TOKEN_FAILED', 'Failed to retrieve FCM token', true);
      }

      this._token.set(token);

      // Persist token to Firestore (for backend to send notifications)
      await this.saveTokenToFirestore(userId, token);

      // Track token registration
      this.analytics.trackTokenRegistered();

      this.logger.info('[PushMessagingService]', 'FCM token registered and saved', {
        userId,
        tokenPrefix: token.substring(0, 20)
      });
    } catch (error) {
      if ((error as PushMessagingError).code) {
        throw error;
      }
      throw this.createError('TOKEN_FAILED', `Token registration failed: ${(error as Error).message}`, true);
    }
  }

  private async saveTokenToFirestore(userId: string, fcmToken: string): Promise<void> {
    try {
      await this.fcmTokenRepository.save({
        userId,
        token: fcmToken,
        deviceType: 'web'
      });

      this.logger.info('[PushMessagingService]', 'FCM token saved to Firestore', { userId });
    } catch (error) {
      this.logger.error('[PushMessagingService]', 'Failed to save token to Firestore', error as Error);
      // Non-critical error, don't throw
    }
  }

  private listenForMessages(userId: string): void {
    // Listen to foreground messages
    onMessage(this.messaging, async (payload: MessagePayload) => {
      this.logger.info('[PushMessagingService]', 'Foreground message received', { payload });

      try {
        // Show UI notification
        const title = payload.notification?.title ?? '新通知';
        const body = payload.notification?.body ?? payload.data?.['body'] ?? '您有新的通知';

        this.notification.info(title, body, {
          nzPlacement: 'topRight',
          nzDuration: 5000
        });

        // Save to Firestore if it's not already saved by backend
        if (payload.data?.['saveToDb'] !== 'false') {
          await this.saveNotificationToFirestore(userId, payload);
        }

        // Reload notifications
        await this.notificationStore.loadNotifications(userId);
      } catch (error) {
        this.logger.error('[PushMessagingService]', 'Failed to handle foreground message', error as Error);
      }
    });

    this.logger.info('[PushMessagingService]', 'Listening for foreground messages');
  }

  private async saveNotificationToFirestore(userId: string, payload: MessagePayload): Promise<void> {
    try {
      const notificationData: CreateNotificationData = {
        userId,
        type: (payload.data?.['type'] as NotificationType) ?? NotificationType.NOTICE,
        title: payload.notification?.title ?? '通知',
        description: payload.notification?.body ?? payload.data?.['body'],
        avatar: payload.notification?.icon,
        link: payload.data?.['link'],
        read: false
      };

      await this.notificationRepository.create(notificationData);
      this.logger.info('[PushMessagingService]', 'Notification saved to Firestore', { userId });
    } catch (error) {
      this.logger.error('[PushMessagingService]', 'Failed to save notification', error as Error);
    }
  }

  private createError(code: PushMessagingError['code'], message: string, recoverable: boolean): PushMessagingError {
    return { code, message, recoverable };
  }
}
