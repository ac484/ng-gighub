/**
 * Contract Module Metadata
 *
 * Defines module identification and configuration metadata
 * for registration with the Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { BlueprintModuleConfiguration } from '@core/domain/models/blueprint-module.model';

export const CONTRACT_MODULE_METADATA = {
  id: 'contract',
  moduleType: 'contract',
  name: '合約管理',
  nameEn: 'Contract Management',
  version: '1.0.0',
  description: '合約建立、管理與工項追蹤模組，為 SETC 工作流程的起點',
  descriptionEn: 'Contract creation, management and work items tracking module, the starting point of SETC workflow',
  dependencies: [] as string[],
  defaultOrder: 1,
  icon: 'file-text',
  color: '#1890ff',
  category: 'foundation',
  tags: ['contract', 'agreement', 'work-items', 'foundation', 'setc'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const CONTRACT_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableManualCreation: true,
    enableFileUpload: true,
    enableWorkItems: true,
    enableOcrParsing: false, // Deferred per YAGNI
    enableAiParsing: false // Deferred per YAGNI
  },
  settings: {
    contractNumberPrefix: 'CON',
    contractNumberLength: 4,
    defaultCurrency: 'TWD',
    requireSignedDateBeforeActivation: false,
    requireWorkItemsBeforeActivation: true
  },
  ui: {
    icon: 'file-text',
    color: '#1890ff',
    position: 1,
    visibility: 'visible'
  },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: [
      'contract.read',
      'contract.create',
      'contract.update',
      'contract.delete',
      'contract.activate',
      'contract.complete',
      'contract.terminate',
      'contract.upload',
      'workitem.read',
      'workitem.create',
      'workitem.update',
      'workitem.delete'
    ]
  },
  limits: {
    maxItems: 1000,
    maxStorage: 1073741824, // 1GB for contract files
    maxRequests: 1000
  }
};

/**
 * Contract Module Event Types
 * All events are prefixed with 'contract.' for namespacing
 */
export const CONTRACT_MODULE_EVENTS = {
  // Module lifecycle
  MODULE_INITIALIZED: 'contract.module_initialized',
  MODULE_STARTED: 'contract.module_started',
  ERROR_OCCURRED: 'contract.error_occurred',

  // Contract lifecycle
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_UPDATED: 'contract.updated',
  CONTRACT_DELETED: 'contract.deleted',
  CONTRACT_ACTIVATED: 'contract.activated',
  CONTRACT_COMPLETED: 'contract.completed',
  CONTRACT_TERMINATED: 'contract.terminated',

  // Contract status
  CONTRACT_STATUS_CHANGED: 'contract.status_changed',

  // File operations
  CONTRACT_FILE_UPLOADED: 'contract.file_uploaded',
  CONTRACT_FILE_REMOVED: 'contract.file_removed',

  // Work item operations
  WORK_ITEM_ADDED: 'contract.work_item_added',
  WORK_ITEM_UPDATED: 'contract.work_item_updated',
  WORK_ITEM_DELETED: 'contract.work_item_deleted',
  WORK_ITEM_PROGRESS_UPDATED: 'contract.work_item_progress_updated',
  WORK_ITEM_TASK_LINKED: 'contract.work_item_task_linked',
  WORK_ITEM_TASK_UNLINKED: 'contract.work_item_task_unlinked'
} as const;
