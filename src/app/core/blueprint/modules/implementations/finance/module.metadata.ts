/**
 * Finance Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const FINANCE_MODULE_METADATA = {
  id: 'finance',
  moduleType: 'finance',
  name: '財務域',
  nameEn: 'Finance Domain',
  version: '1.0.0',
  description: '財務域模組',
  descriptionEn: 'Finance Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'dollar-circle',
  color: '#13c2c2',
  category: 'business',
  tags: ['finance'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const FINANCE_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'dollar-circle', color: '#13c2c2', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['finance.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const FINANCE_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'finance.module_initialized',
  MODULE_STARTED: 'finance.module_started',
  ERROR_OCCURRED: 'finance.error_occurred'
} as const;
