/**
 * Notification Data Models
 *
 * Models for header notification widgets (notify.component and task.component)
 */

/**
 * Notification Document
 *
 * Represents a notification displayed in the header widgets
 */
export interface Notification {
  /** Document ID */
  readonly id: string;

  /** User ID this notification belongs to */
  userId: string;

  /** Notification type/category */
  type: NotificationType;

  /** Title of the notification */
  title: string;

  /** Detailed description */
  description?: string;

  /** Avatar URL or icon */
  avatar?: string;

  /** Timestamp when notification was created */
  datetime: Date | string;

  /** Whether the notification has been read */
  read: boolean;

  /** Extra status information (for 待辦 type) */
  extra?: string;

  /** Status label (for 待辦 type) */
  status?: NotificationStatus;

  /** Link to navigate when clicked */
  link?: string;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Notification Type
 *
 * Categories for grouping notifications
 */
export enum NotificationType {
  /** General notifications - 通知 */
  NOTICE = '通知',

  /** Messages from users - 消息 */
  MESSAGE = '消息',

  /** Todo items - 待辦 */
  TODO = '待辦'
}

/**
 * Notification Status
 *
 * Status labels for todo-type notifications
 */
export enum NotificationStatus {
  TODO = 'todo',
  PROCESSING = 'processing',
  URGENT = 'urgent',
  DOING = 'doing'
}

/**
 * Notification Group for ng-alain notice-icon
 *
 * Groups notifications by type for display
 */
export interface NotificationGroup {
  title: string;
  list: Notification[];
  emptyText: string;
  emptyImage: string;
  clearText: string;
}

/**
 * Create Notification Request
 */
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  description?: string;
  avatar?: string;
  datetime?: Date | string;
  read?: boolean;
  extra?: string;
  status?: NotificationStatus;
  link?: string;
}

/**
 * Update Notification Request
 */
export interface UpdateNotificationData {
  read?: boolean;
  title?: string;
  description?: string;
  avatar?: string;
  datetime?: Date | string;
  extra?: string;
  status?: NotificationStatus;
  link?: string;
}
