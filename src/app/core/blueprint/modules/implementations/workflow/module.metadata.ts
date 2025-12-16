/**
 * Workflow Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const WORKFLOW_MODULE_METADATA = {
  id: 'workflow',
  moduleType: 'workflow',
  name: '流程域',
  nameEn: 'Workflow Domain',
  version: '1.0.0',
  description: '流程域模組',
  descriptionEn: 'Workflow Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'apartment',
  color: '#722ed1',
  category: 'business',
  tags: ['workflow'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const WORKFLOW_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'apartment', color: '#722ed1', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['workflow.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const WORKFLOW_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'workflow.module_initialized',
  MODULE_STARTED: 'workflow.module_started',
  ERROR_OCCURRED: 'workflow.error_occurred'
} as const;
