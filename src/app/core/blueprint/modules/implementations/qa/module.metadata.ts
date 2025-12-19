/**
 * QA Domain Module Metadata
 *
 * Defines module identification and configuration metadata
 * for registration with the Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 * @updated 2025-12-19 - Enhanced event definitions and metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const QA_MODULE_METADATA = {
  id: 'qa',
  moduleType: 'qa',
  name: '品質控管',
  nameEn: 'Quality Assurance',
  version: '1.0.0',
  description: '品質控管模組，包含檢查表、缺失管理、現場巡檢及品質報告',
  descriptionEn: 'QA module with checklist, defect management, inspection and reporting',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'safety-certificate',
  color: '#52c41a',
  category: 'quality',
  tags: ['qa', 'quality', 'defect', 'inspection', 'checklist', 'report'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const QA_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableChecklist: true,
    enableDefectManagement: true,
    enableDefectLifecycle: true,
    enableDefectResolution: true,
    enableDefectReinspection: true,
    enableDefectIssueIntegration: true,
    enableInspection: true,
    enableQAReport: true
  },
  settings: {
    defectNumberPrefix: 'QA',
    defectNumberLength: 4,
    autoAssignDefects: true,
    defectAutoCloseAfterVerification: true,
    autoCreateIssueFromCriticalDefect: true
  },
  ui: { icon: 'safety-certificate', color: '#52c41a', position: 10, visibility: 'visible' },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: [
      'qa.read',
      'qa.create',
      'qa.update',
      'qa.delete',
      'qa.checklist.read',
      'qa.checklist.create',
      'qa.defect.read',
      'qa.defect.create',
      'qa.defect.update',
      'qa.defect.resolve',
      'qa.defect.verify',
      'qa.inspection.read',
      'qa.inspection.create',
      'qa.report.read',
      'qa.report.generate'
    ]
  },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

/**
 * QA Module Event Types
 * All events are prefixed with 'qa.' for namespacing
 */
export const QA_MODULE_EVENTS = {
  // Module lifecycle
  MODULE_INITIALIZED: 'qa.module_initialized',
  MODULE_STARTED: 'qa.module_started',
  ERROR_OCCURRED: 'qa.error_occurred',

  // Checklist events
  CHECKLIST_CREATED: 'qa.checklist_created',
  CHECKLIST_COMPLETED: 'qa.checklist_completed',
  CHECKLIST_FAILED: 'qa.checklist_failed',

  // Defect lifecycle events (SETC-041)
  DEFECT_CREATED: 'qa.defect_created',
  DEFECT_AUTO_CREATED_FROM_QC: 'qa.defect_auto_created_from_qc',
  DEFECT_ASSIGNED: 'qa.defect_assigned',
  DEFECT_STATUS_CHANGED: 'qa.defect_status_changed',

  // Defect resolution events (SETC-042)
  DEFECT_RESOLUTION_STARTED: 'qa.defect_resolution_started',
  DEFECT_PROGRESS_UPDATED: 'qa.defect_progress_updated',
  DEFECT_RESOLVED: 'qa.defect_resolved',

  // Defect reinspection events (SETC-043)
  DEFECT_REINSPECTION_SCHEDULED: 'qa.defect_reinspection_scheduled',
  DEFECT_REINSPECTION_PASSED: 'qa.defect_reinspection_passed',
  DEFECT_REINSPECTION_FAILED: 'qa.defect_reinspection_failed',
  DEFECT_VERIFIED: 'qa.defect_verified',

  // Defect-Issue integration events (SETC-044)
  DEFECT_ISSUE_CREATED: 'qa.defect_issue_created',
  DEFECT_ISSUE_SYNCED: 'qa.defect_issue_synced',

  // Defect closure
  DEFECT_CLOSED: 'qa.defect_closed',

  // Critical defect alert
  CRITICAL_DEFECT_FOUND: 'qa.critical_defect_found',

  // Inspection events
  INSPECTION_STARTED: 'qa.inspection_started',
  INSPECTION_COMPLETED: 'qa.inspection_completed',
  INSPECTION_FAILED: 'qa.inspection_failed',

  // Report events
  REPORT_GENERATED: 'qa.report_generated',
  REPORT_EXPORTED: 'qa.report_exported'
} as const;
