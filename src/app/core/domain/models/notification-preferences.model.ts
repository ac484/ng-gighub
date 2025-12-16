/**
 * Notification Preferences Model
 *
 * Defines user preferences for push notifications:
 * - Mute periods (quiet hours)
 * - Notification type filters
 * - Frequency controls
 */

export interface MutePeriod {
  /** Start time (HH:mm format, e.g., "22:00") */
  startTime: string;

  /** End time (HH:mm format, e.g., "08:00") */
  endTime: string;

  /** Days of week (0-6, where 0=Sunday) */
  days: number[];

  /** Whether this mute period is active */
  enabled: boolean;
}

export interface NotificationPreferences {
  /** User ID */
  readonly userId: string;

  /** Whether notifications are enabled globally */
  enabled: boolean;

  /** Mute periods (quiet hours) */
  mutePeriods: MutePeriod[];

  /** Notification type filters */
  filters: {
    /** Show task notifications */
    tasks: boolean;

    /** Show log notifications */
    logs: boolean;

    /** Show quality inspection notifications */
    quality: boolean;

    /** Show friend request notifications */
    friends: boolean;

    /** Show general notifications */
    general: boolean;
  };

  /** Notification frequency */
  frequency: {
    /** Minimum minutes between notifications */
    minInterval: number;

    /** Maximum notifications per hour */
    maxPerHour: number;
  };

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Create Notification Preferences Data
 */
export interface CreateNotificationPreferencesData {
  userId: string;
  enabled?: boolean;
  mutePeriods?: MutePeriod[];
  filters?: Partial<NotificationPreferences['filters']>;
  frequency?: Partial<NotificationPreferences['frequency']>;
}

/**
 * Update Notification Preferences Data
 */
export interface UpdateNotificationPreferencesData {
  enabled?: boolean;
  mutePeriods?: MutePeriod[];
  filters?: Partial<NotificationPreferences['filters']>;
  frequency?: Partial<NotificationPreferences['frequency']>;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  enabled: true,
  mutePeriods: [],
  filters: {
    tasks: true,
    logs: true,
    quality: true,
    friends: true,
    general: true
  },
  frequency: {
    minInterval: 5, // 5 minutes
    maxPerHour: 10 // Maximum 10 notifications per hour
  }
};

export default NotificationPreferences;
