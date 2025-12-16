/**
 * Log Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const LOG_MODULE_METADATA = {
  id: 'log',
  moduleType: 'log',
  name: '日誌域',
  nameEn: 'Log Domain',
  version: '1.0.0',
  description: '日誌域模組',
  descriptionEn: 'Log Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'file-text',
  color: '#1890ff',
  category: 'business',
  tags: ['log'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const LOG_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'file-text', color: '#1890ff', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['log.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const LOG_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'log.module_initialized',
  MODULE_STARTED: 'log.module_started',
  ERROR_OCCURRED: 'log.error_occurred'
} as const;
