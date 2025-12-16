/**
 * Communication Domain Module Metadata
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const COMMUNICATION_MODULE_METADATA = {
  id: 'communication',
  moduleType: 'communication',
  name: '通訊域',
  nameEn: 'Communication Domain',
  version: '1.0.0',
  description: '通訊域模組',
  descriptionEn: 'Communication Domain module',
  dependencies: [] as string[],
  defaultOrder: 10,
  icon: 'notification',
  color: '#2f54eb',
  category: 'business',
  tags: ['communication'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const COMMUNICATION_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {},
  settings: {},
  ui: { icon: 'notification', color: '#2f54eb', position: 10, visibility: 'visible' },
  permissions: { requiredRoles: ['viewer'], allowedActions: ['communication.read'] },
  limits: { maxItems: 10000, maxStorage: 104857600, maxRequests: 1000 }
};

export const COMMUNICATION_MODULE_EVENTS = {
  MODULE_INITIALIZED: 'communication.module_initialized',
  MODULE_STARTED: 'communication.module_started',
  ERROR_OCCURRED: 'communication.error_occurred'
} as const;
