/**
 * Activity Log Models
 *
 * Data models for activity logging sub-module.
 *
 * @module ActivityLogModel
 * @author GigHub Development Team
 * @date 2025-12-13
 */

/**
 * Activity Type Enum
 */
export enum ActivityType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  CANCEL = 'cancel'
}

/**
 * Activity Log Interface
 *
 * Records user operations and activities within the system.
 */
export interface ActivityLog {
  /** Unique identifier */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** User ID who performed the action */
  userId: string;

  /** User name */
  userName: string;

  /** Action performed */
  action: string;

  /** Action type */
  actionType: ActivityType;

  /** Resource type affected */
  resourceType: string;

  /** Resource ID */
  resourceId: string;

  /** Human-readable description */
  description: string;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** IP address */
  ipAddress?: string;

  /** User agent string */
  userAgent?: string;

  /** Timestamp */
  timestamp: Date;

  /** Created at */
  createdAt: Date;
}

/**
 * Create Activity Log Data
 */
export interface CreateActivityLogData {
  blueprintId: string;
  userId: string;
  userName: string;
  action: string;
  actionType: ActivityType;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Activity Log Query Options
 */
export interface ActivityLogQueryOptions {
  blueprintId: string;
  userId?: string;
  actionType?: ActivityType | ActivityType[];
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
