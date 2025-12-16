/**
 * Notification Preferences Repository
 *
 * Manages user notification preferences in Firestore.
 * Follows Repository pattern for data access abstraction.
 *
 * @architecture
 * - Repository Layer: Data access abstraction
 * - Uses Firestore for persistence
 * - Handles preferences lifecycle (create, read, update)
 */
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, Timestamp, DocumentReference } from '@angular/fire/firestore';
import {
  NotificationPreferences,
  CreateNotificationPreferencesData,
  UpdateNotificationPreferencesData,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@core/domain/models/notification-preferences.model';
import { LoggerService } from '@core/services/logger/logger.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferencesRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'notification_preferences';

  private getDocRef(userId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, userId);
  }

  private toNotificationPreferences(data: Record<string, unknown>, userId: string): NotificationPreferences {
    const filters = data.filters as Record<string, unknown> | undefined;
    const frequency = data.frequency as Record<string, unknown> | undefined;
    const mutePeriods = data.mutePeriods as unknown[];

    return {
      userId,
      enabled: (data.enabled as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
      mutePeriods: (mutePeriods ?? DEFAULT_NOTIFICATION_PREFERENCES.mutePeriods) as NotificationPreferences['mutePeriods'],
      filters: {
        tasks: (filters?.tasks as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.filters.tasks,
        logs: (filters?.logs as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.filters.logs,
        quality: (filters?.quality as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.filters.quality,
        friends: (filters?.friends as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.filters.friends,
        general: (filters?.general as boolean | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.filters.general
      },
      frequency: {
        minInterval: (frequency?.minInterval as number | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.frequency.minInterval,
        maxPerHour: (frequency?.maxPerHour as number | undefined) ?? DEFAULT_NOTIFICATION_PREFERENCES.frequency.maxPerHour
      },
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt as string)
    };
  }

  /**
   * Find notification preferences by user ID
   *
   * @param userId User ID
   * @returns Notification preferences or null if not found
   */
  async findByUserId(userId: string): Promise<NotificationPreferences | null> {
    try {
      const docRef = this.getDocRef(userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.toNotificationPreferences(snapshot.data() as Record<string, unknown>, userId);
    } catch (error) {
      this.logger.error('[NotificationPreferencesRepository]', 'findByUserId failed', error as Error);
      return null;
    }
  }

  /**
   * Get notification preferences with defaults
   *
   * @param userId User ID
   * @returns Notification preferences (creates with defaults if not exists)
   */
  async getOrCreate(userId: string): Promise<NotificationPreferences> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return existing;
    }

    // Create with defaults
    return this.create({ userId });
  }

  /**
   * Create notification preferences
   *
   * @param data Preferences data
   * @returns Created preferences
   */
  async create(data: CreateNotificationPreferencesData): Promise<NotificationPreferences> {
    const now = Timestamp.now();
    const userId = data.userId;

    try {
      const payload = {
        enabled: data.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
        mutePeriods: data.mutePeriods ?? DEFAULT_NOTIFICATION_PREFERENCES.mutePeriods,
        filters: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.filters,
          ...data.filters
        },
        frequency: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.frequency,
          ...data.frequency
        },
        createdAt: now,
        updatedAt: now
      };

      const docRef = this.getDocRef(userId);
      await setDoc(docRef, payload);

      this.logger.info('[NotificationPreferencesRepository]', `Preferences created for user ${userId}`);

      return this.toNotificationPreferences(payload, userId);
    } catch (error) {
      this.logger.error('[NotificationPreferencesRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   *
   * @param userId User ID
   * @param data Update data
   */
  async update(userId: string, data: UpdateNotificationPreferencesData): Promise<void> {
    try {
      const docRef = this.getDocRef(userId);
      const payload: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now()
      };

      await setDoc(docRef, payload, { merge: true });

      this.logger.info('[NotificationPreferencesRepository]', `Preferences updated for user ${userId}`);
    } catch (error) {
      this.logger.error('[NotificationPreferencesRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Enable notifications
   *
   * @param userId User ID
   */
  async enable(userId: string): Promise<void> {
    await this.update(userId, { enabled: true });
  }

  /**
   * Disable notifications
   *
   * @param userId User ID
   */
  async disable(userId: string): Promise<void> {
    await this.update(userId, { enabled: false });
  }

  /**
   * Add mute period
   *
   * @param userId User ID
   * @param mutePeriod Mute period to add
   */
  async addMutePeriod(userId: string, mutePeriod: NotificationPreferences['mutePeriods'][0]): Promise<void> {
    const prefs = await this.getOrCreate(userId);
    const mutePeriods = [...prefs.mutePeriods, mutePeriod];
    await this.update(userId, { mutePeriods });
  }

  /**
   * Remove mute period
   *
   * @param userId User ID
   * @param index Index of mute period to remove
   */
  async removeMutePeriod(userId: string, index: number): Promise<void> {
    const prefs = await this.getOrCreate(userId);
    const mutePeriods = prefs.mutePeriods.filter((_, i) => i !== index);
    await this.update(userId, { mutePeriods });
  }
}
