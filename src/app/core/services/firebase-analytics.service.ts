import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent, setUserId, setUserProperties } from '@angular/fire/analytics';

import { LoggerService } from './logger/logger.service';

/**
 * Firebase Analytics Service
 * Firebase 分析服務
 *
 * Wrapper service for Firebase Analytics integration
 *
 * @version 1.0.0
 * @since Angular 20.3.0
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseAnalyticsService {
  private readonly analytics = inject(Analytics, { optional: true });
  private readonly logger = inject(LoggerService);

  /**
   * Log a custom event
   * 記錄自訂事件
   */
  logEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!this.analytics) {
      this.logger.warn('[FirebaseAnalytics]', 'Analytics not initialized');
      return;
    }

    try {
      logEvent(this.analytics, eventName, eventParams);
      this.logger.debug('[FirebaseAnalytics]', `Event logged: ${eventName}`, eventParams);
    } catch (error) {
      this.logger.error('[FirebaseAnalytics]', `Failed to log event: ${eventName}`, error as Error);
    }
  }

  /**
   * Set user ID
   * 設定使用者 ID
   */
  setUserId(userId: string | null): void {
    if (!this.analytics) return;

    try {
      setUserId(this.analytics, userId);
      this.logger.debug('[FirebaseAnalytics]', `User ID set: ${userId}`);
    } catch (error) {
      this.logger.error('[FirebaseAnalytics]', 'Failed to set user ID', error as Error);
    }
  }

  /**
   * Set user properties
   * 設定使用者屬性
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.analytics) return;

    try {
      setUserProperties(this.analytics, properties);
      this.logger.debug('[FirebaseAnalytics]', 'User properties set', properties);
    } catch (error) {
      this.logger.error('[FirebaseAnalytics]', 'Failed to set user properties', error as Error);
    }
  }
}
