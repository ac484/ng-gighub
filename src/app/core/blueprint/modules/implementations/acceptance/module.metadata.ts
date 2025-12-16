/**
 * Acceptance Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const ACCEPTANCE_MODULE_METADATA = {
  id: 'acceptance',
  moduleType: 'acceptance',
  name: '驗收域',
  nameEn: 'Acceptance Domain',
  version: '1.0.0',
  description: '驗收域模組',
  descriptionEn: 'Acceptance Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'file-done',
  color: '#fa8c16',
  category: 'business',
  tags: ['acceptance'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const ACCEPTANCE_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'file-done', color: '#fa8c16', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['acceptance.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const ACCEPTANCE_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'acceptance.module_initialized',
  MODULE_STARTED: 'acceptance.module_started',
  ERROR_OCCURRED: 'acceptance.error_occurred'
} as const;
