/**
 * Blueprint event types
 * 藍圖事件類型
 */
export enum BlueprintEventType {
  // Blueprint events
  BLUEPRINT_CREATED = 'blueprint.created',
  BLUEPRINT_UPDATED = 'blueprint.updated',
  BLUEPRINT_DELETED = 'blueprint.deleted',

  // Member events
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',
  MEMBER_ROLE_CHANGED = 'member.role_changed',

  // Module events
  MODULE_ENABLED = 'module.enabled',
  MODULE_DISABLED = 'module.disabled',

  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',

  // Custom
  CUSTOM = 'custom'
}
