/**
 * QA Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const QA_MODULE_METADATA = {
  id: 'qa',
  moduleType: 'qa',
  name: '品質控管域',
  nameEn: 'QA Domain',
  version: '1.0.0',
  description: '品質控管域模組',
  descriptionEn: 'QA Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'safety-certificate',
  color: '#52c41a',
  category: 'business',
  tags: ['qa'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const QA_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'safety-certificate', color: '#52c41a', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['qa.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const QA_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'qa.module_initialized',
  MODULE_STARTED: 'qa.module_started',
  ERROR_OCCURRED: 'qa.error_occurred'
} as const;
