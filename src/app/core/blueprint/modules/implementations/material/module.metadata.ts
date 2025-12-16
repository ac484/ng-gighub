/**
 * Material Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const MATERIAL_MODULE_METADATA = {
  id: 'material',
  moduleType: 'material',
  name: '材料域',
  nameEn: 'Material Domain',
  version: '1.0.0',
  description: '材料域模組',
  descriptionEn: 'Material Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'build',
  color: '#eb2f96',
  category: 'business',
  tags: ['material'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const MATERIAL_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'build', color: '#eb2f96', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['material.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const MATERIAL_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'material.module_initialized',
  MODULE_STARTED: 'material.module_started',
  ERROR_OCCURRED: 'material.error_occurred'
} as const;
