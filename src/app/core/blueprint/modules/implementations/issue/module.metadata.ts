/**
 * Issue Module Metadata
 *
 * Defines module identification and configuration metadata
 * for registration with the Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const ISSUE_MODULE_METADATA = {
  id: 'issue',
  moduleType: 'issue',
  name: '問題管理',
  nameEn: 'Issue Management',
  version: '1.0.0',
  description: '獨立的問題單管理模組，支援手動建立與多來源自動生成',
  descriptionEn: 'Independent issue management module with manual creation and multi-source auto-generation',
  dependencies: [] as string[],
  defaultOrder: 8,
  icon: 'exclamation-circle',
  color: '#fa8c16',
  category: 'quality',
  tags: ['issue', 'problem', 'tracking', 'resolution', 'quality'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const ISSUE_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableManualCreation: true,
    enableAutoCreationFromAcceptance: true,
    enableAutoCreationFromQC: true,
    enableAutoCreationFromWarranty: true,
    enableAutoCreationFromSafety: true
  },
  settings: {
    issueNumberPrefix: 'ISS',
    issueNumberLength: 4,
    defaultCategory: 'quality',
    defaultSeverity: 'minor',
    requireResolutionBeforeVerification: true,
    requireVerificationBeforeClose: true
  },
  ui: {
    icon: 'exclamation-circle',
    color: '#fa8c16',
    position: 8,
    visibility: 'visible'
  },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: ['issue.read', 'issue.create', 'issue.update', 'issue.resolve', 'issue.verify', 'issue.close']
  },
  limits: {
    maxItems: 10000,
    maxStorage: 104857600,
    maxRequests: 1000
  }
};

/**
 * Issue Module Event Types
 * All events are prefixed with 'issue.' for namespacing
 */
export const ISSUE_MODULE_EVENTS = {
  // Module lifecycle
  MODULE_INITIALIZED: 'issue.module_initialized',
  MODULE_STARTED: 'issue.module_started',
  ERROR_OCCURRED: 'issue.error_occurred',

  // Issue creation
  ISSUE_CREATED: 'issue.created',
  ISSUES_CREATED_FROM_ACCEPTANCE: 'issue.created_from_acceptance',
  ISSUES_CREATED_FROM_QC: 'issue.created_from_qc',
  ISSUE_CREATED_FROM_WARRANTY: 'issue.created_from_warranty',
  ISSUE_CREATED_FROM_SAFETY: 'issue.created_from_safety',

  // Issue lifecycle
  ISSUE_UPDATED: 'issue.updated',
  ISSUE_ASSIGNED: 'issue.assigned',
  ISSUE_RESOLVED: 'issue.resolved',
  ISSUE_VERIFICATION_FAILED: 'issue.verification_failed',
  ISSUE_VERIFIED: 'issue.verified',
  ISSUE_CLOSED: 'issue.closed',

  // Batch operations
  ISSUES_BATCH_CREATED: 'issue.batch_created',
  ISSUES_BATCH_CLOSED: 'issue.batch_closed'
} as const;
