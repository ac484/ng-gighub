/**
 * Warranty Module Metadata
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 保固模組元資料定義
 *
 * @module WarrantyModuleMetadata
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

/**
 * 保固模組元資料
 */
export const WARRANTY_MODULE_METADATA = {
  id: 'warranty',
  moduleType: 'warranty',
  name: '保固域',
  nameEn: 'Warranty Domain',
  version: '1.0.0',
  description: '保固管理模組，提供保固期追蹤、缺失回報、維修管理功能',
  descriptionEn: 'Warranty management module for tracking warranty periods, defect reporting, and repair management',
  dependencies: ['acceptance', 'contract'] as string[],
  defaultOrder: 11,
  icon: 'safety-certificate',
  color: '#722ed1',
  category: 'business',
  tags: ['warranty', 'defect', 'repair', 'quality'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

/**
 * 保固模組預設配置
 */
export const WARRANTY_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    defectManagement: true,
    repairTracking: true,
    autoNotification: true,
    issueIntegration: true
  },
  settings: {
    defaultPeriodMonths: 12,
    notifyDaysBefore: [30, 14, 7, 1],
    expiringThresholdDays: 30
  },
  ui: {
    icon: 'safety-certificate',
    color: '#722ed1',
    position: 11,
    visibility: 'visible'
  },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: ['warranty.read', 'warranty.defect.report']
  },
  limits: {
    maxItems: 1000,
    maxStorage: 104857600, // 100MB
    maxRequests: 500
  }
};

/**
 * 保固模組事件
 */
export const WARRANTY_MODULE_EVENTS = {
  // 模組生命週期
  MODULE_INITIALIZED: 'warranty.module_initialized',
  MODULE_STARTED: 'warranty.module_started',
  ERROR_OCCURRED: 'warranty.error_occurred',

  // 保固事件
  WARRANTY_CREATED: 'warranty.warranty_created',
  WARRANTY_ACTIVATED: 'warranty.warranty_activated',
  WARRANTY_EXPIRING: 'warranty.warranty_expiring',
  WARRANTY_EXPIRED: 'warranty.warranty_expired',
  WARRANTY_COMPLETED: 'warranty.warranty_completed',
  WARRANTY_VOIDED: 'warranty.warranty_voided',

  // 缺失事件
  DEFECT_REPORTED: 'warranty.defect_reported',
  DEFECT_CONFIRMED: 'warranty.defect_confirmed',
  DEFECT_REJECTED: 'warranty.defect_rejected',
  DEFECT_CLOSED: 'warranty.defect_closed',

  // 維修事件
  REPAIR_CREATED: 'warranty.repair_created',
  REPAIR_SCHEDULED: 'warranty.repair_scheduled',
  REPAIR_STARTED: 'warranty.repair_started',
  REPAIR_COMPLETED: 'warranty.repair_completed',
  REPAIR_VERIFIED: 'warranty.repair_verified',
  REPAIR_FAILED: 'warranty.repair_failed'
} as const;

/**
 * 保固模組權限
 */
export const WARRANTY_MODULE_PERMISSIONS = {
  // 保固權限
  WARRANTY_READ: 'warranty.read',
  WARRANTY_CREATE: 'warranty.create',
  WARRANTY_UPDATE: 'warranty.update',
  WARRANTY_DELETE: 'warranty.delete',
  WARRANTY_COMPLETE: 'warranty.complete',
  WARRANTY_VOID: 'warranty.void',

  // 缺失權限
  DEFECT_READ: 'warranty.defect.read',
  DEFECT_REPORT: 'warranty.defect.report',
  DEFECT_CONFIRM: 'warranty.defect.confirm',
  DEFECT_REJECT: 'warranty.defect.reject',

  // 維修權限
  REPAIR_READ: 'warranty.repair.read',
  REPAIR_CREATE: 'warranty.repair.create',
  REPAIR_UPDATE: 'warranty.repair.update',
  REPAIR_COMPLETE: 'warranty.repair.complete',
  REPAIR_VERIFY: 'warranty.repair.verify'
} as const;
