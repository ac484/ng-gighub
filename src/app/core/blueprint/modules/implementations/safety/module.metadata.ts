/**
 * Safety Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const SAFETY_MODULE_METADATA = {
  id: 'safety',
  moduleType: 'safety',
  name: '安全域',
  nameEn: 'Safety Domain',
  version: '1.0.0',
  description: '安全域模組',
  descriptionEn: 'Safety Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'warning',
  color: '#faad14',
  category: 'business',
  tags: ['safety'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const SAFETY_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'warning', color: '#faad14', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['safety.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const SAFETY_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'safety.module_initialized',
  MODULE_STARTED: 'safety.module_started',
  ERROR_OCCURRED: 'safety.error_occurred'
} as const;
