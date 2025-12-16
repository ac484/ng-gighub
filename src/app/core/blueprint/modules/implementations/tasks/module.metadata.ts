/**
 * Tasks Module Metadata
 *
 * Configuration and metadata for the Tasks module.
 * Defines module identity, dependencies, and default configuration.
 *
 * @module TasksModuleMetadata
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

/**
 * Tasks Module Metadata
 */
export const TASKS_MODULE_METADATA = {
  /** Unique module identifier */
  id: 'tasks',

  /** Module type identifier */
  moduleType: 'tasks',

  /** Display name */
  name: '任務管理',

  /** English name */
  nameEn: 'Task Management',

  /** Module version */
  version: '1.0.0',

  /** Module description */
  description: '工地任務管理模組，支援任務建立、分配、追蹤與狀態管理',

  /** English description */
  descriptionEn: 'Construction site task management module with task creation, assignment, tracking, and status management',

  /** Module dependencies */
  dependencies: [] as string[],

  /** Default load order */
  defaultOrder: 100,

  /** Module icon (ng-zorro-antd icon name) */
  icon: 'check-circle',

  /** Module color theme */
  color: '#1890ff',

  /** Module category */
  category: 'business',

  /** Tags for filtering */
  tags: ['任務', 'task', 'management', 'construction'],

  /** Author */
  author: 'GigHub Development Team',

  /** License */
  license: 'Proprietary'
} as const;

/**
 * Default Module Configuration
 *
 * Default settings when the module is first enabled.
 */
export const TASKS_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableTaskCreation: true,
    enableTaskAssignment: true,
    enableTaskTracking: true,
    enableSubtasks: true,
    enableTaskDependencies: true,
    enableRecurringTasks: false,
    enableTaskTemplates: false,
    enableTaskComments: true,
    enableTaskAttachments: true,
    enableTaskNotifications: true
  },

  settings: {
    defaultTaskPriority: 'medium',
    defaultTaskStatus: 'pending',
    autoAssignToCreator: false,
    requireApprovalForCompletion: false,
    maxAttachmentsPerTask: 10,
    maxAttachmentSize: 10485760, // 10MB in bytes
    allowGuestTaskCreation: false,
    taskNumberPrefix: 'TASK-',
    enableTaskArchiving: true,
    archiveAfterDays: 90
  },

  ui: {
    icon: 'check-circle',
    color: '#1890ff',
    position: 1,
    visibility: 'visible'
  },

  permissions: {
    requiredRoles: ['contributor', 'maintainer'],
    allowedActions: ['task.create', 'task.read', 'task.update', 'task.delete', 'task.assign', 'task.comment', 'task.attach']
  },

  limits: {
    maxItems: 1000,
    maxStorage: 104857600, // 100MB
    maxRequests: 1000
  }
};

/**
 * Module Permissions
 *
 * Defines permission actions for the Tasks module.
 */
export const TASKS_MODULE_PERMISSIONS = {
  CREATE: 'task.create',
  READ: 'task.read',
  UPDATE: 'task.update',
  DELETE: 'task.delete',
  ASSIGN: 'task.assign',
  COMMENT: 'task.comment',
  ATTACH: 'task.attach',
  EXPORT: 'task.export'
} as const;

/**
 * Module Events
 *
 * Events emitted by the Tasks module.
 */
export const TASKS_MODULE_EVENTS = {
  TASK_LOADED: 'tasks.task_loaded',
  TASK_CREATED: 'tasks.task_created',
  TASK_UPDATED: 'tasks.task_updated',
  TASK_DELETED: 'tasks.task_deleted',
  TASK_ASSIGNED: 'tasks.task_assigned',
  TASK_STATUS_CHANGED: 'tasks.task_status_changed',
  TASK_PRIORITY_CHANGED: 'tasks.task_priority_changed',
  TASK_COMPLETED: 'tasks.task_completed',
  TASK_ARCHIVED: 'tasks.task_archived',
  COMMENT_ADDED: 'tasks.comment_added',
  ATTACHMENT_ADDED: 'tasks.attachment_added',

  // Context Menu Events - 右鍵選單事件
  TASK_CHILD_CREATED: 'tasks.child_created',
  TASK_CLONED: 'tasks.cloned',
  CONTEXT_MENU_OPENED: 'tasks.context_menu_opened',
  CONTEXT_MENU_CLOSED: 'tasks.context_menu_closed',
  CONTEXT_MENU_ACTION: 'tasks.context_menu_action'
} as const;
