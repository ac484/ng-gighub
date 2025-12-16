/**
 * Analytics Tracking Service
 *
 * Tracks push notification metrics using Firebase Analytics.
 * Follows Occam's Razor: Track only essential metrics.
 *
 * Key Metrics:
 * - Notification delivered
 * - Notification clicked
 * - Notification dismissed
 * - Permission granted/denied
 *
 * @architecture
 * - Service Layer: Business logic for analytics
 * - Uses Firebase Analytics for tracking
 * - Minimal dependencies, simple implementation
 */

import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { LoggerService } from '@core/services/logger/logger.service';

export interface NotificationAnalyticsEvent {
  notificationType: 'task' | 'friend' | 'log' | 'quality' | 'general';
  action: 'delivered' | 'clicked' | 'dismissed';
  userId?: string;
  metadata?: Record<string, string>;
}

export interface PermissionAnalyticsEvent {
  action: 'granted' | 'denied' | 'default';
  source: 'auto' | 'manual';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationAnalyticsService {
  private readonly analytics = inject(Analytics);
  private readonly logger = inject(LoggerService);

  /**
   * Track notification delivery
   */
  trackNotificationDelivered(type: NotificationAnalyticsEvent['notificationType'], metadata?: Record<string, string>): void {
    try {
      logEvent(this.analytics, 'notification_delivered', {
        notification_type: type,
        ...metadata
      });

      this.logger.debug('[NotificationAnalytics]', `Delivered: ${type}`);
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackNotificationDelivered failed', error as Error);
    }
  }

  /**
   * Track notification click
   */
  trackNotificationClicked(type: NotificationAnalyticsEvent['notificationType'], link?: string): void {
    try {
      logEvent(this.analytics, 'notification_clicked', {
        notification_type: type,
        link: link || '/'
      });

      this.logger.debug('[NotificationAnalytics]', `Clicked: ${type} -> ${link}`);
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackNotificationClicked failed', error as Error);
    }
  }

  /**
   * Track notification dismissed
   */
  trackNotificationDismissed(type: NotificationAnalyticsEvent['notificationType']): void {
    try {
      logEvent(this.analytics, 'notification_dismissed', {
        notification_type: type
      });

      this.logger.debug('[NotificationAnalytics]', `Dismissed: ${type}`);
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackNotificationDismissed failed', error as Error);
    }
  }

  /**
   * Track permission change
   */
  trackPermissionChange(permission: PermissionAnalyticsEvent['action'], source: PermissionAnalyticsEvent['source']): void {
    try {
      logEvent(this.analytics, 'notification_permission_change', {
        permission,
        source
      });

      this.logger.info('[NotificationAnalytics]', `Permission: ${permission} (${source})`);
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackPermissionChange failed', error as Error);
    }
  }

  /**
   * Track FCM token registration
   */
  trackTokenRegistered(): void {
    try {
      logEvent(this.analytics, 'fcm_token_registered', {
        timestamp: Date.now()
      });

      this.logger.debug('[NotificationAnalytics]', 'Token registered');
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackTokenRegistered failed', error as Error);
    }
  }

  /**
   * Track error
   */
  trackError(errorCode: string, errorMessage: string): void {
    try {
      logEvent(this.analytics, 'notification_error', {
        error_code: errorCode,
        error_message: errorMessage
      });

      this.logger.error('[NotificationAnalytics]', `Error: ${errorCode} - ${errorMessage}`);
    } catch (error) {
      this.logger.error('[NotificationAnalytics]', 'trackError failed', error as Error);
    }
  }
}
