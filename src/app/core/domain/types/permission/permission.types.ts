import { PermissionLevel } from './permission-level.enum';
import { BusinessRole, SystemRole } from './role.enum';
import { ModuleType } from '@core/blueprint/domain/types';

/**
 * Permission subject type
 * 權限主體類型
 */
export type PermissionSubjectType = 'user' | 'team' | 'organization';

/**
 * Blueprint-level permission flags
 * 藍圖層級權限旗標
 */
export interface BlueprintPermissionSet {
  read: boolean;
  update: boolean;
  delete: boolean;
  manageSettings: boolean;
  manageMembers: boolean;
  exportData: boolean;
}

/**
 * Module permission flags
 * 模組權限旗標
 */
export interface ModulePermission {
  enabled: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export?: boolean;
}

/**
 * Module permission map keyed by module type
 * 依模組類型的權限對應
 */
export type ModulePermissionMap = Partial<Record<ModuleType, ModulePermission>>;

/**
 * Context restrictions for permission
 * 權限的上下文限制
 */
export interface PermissionRestriction {
  ipWhitelist?: string[];
  timeWindows?: Array<{
    start: string;
    end: string;
    timezone?: string;
  }>;
}

/**
 * Permission entity
 * 權限實體
 */
export interface Permission {
  id: string;
  blueprintId: string;
  subjectId: string;
  subjectType: PermissionSubjectType;
  level: PermissionLevel;
  systemRole?: SystemRole;
  businessRole?: BusinessRole;
  permissions: {
    blueprint: BlueprintPermissionSet;
    modules: ModulePermissionMap;
  };
  validFrom?: Date | string;
  validUntil?: Date | string;
  restrictions?: PermissionRestriction;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Permission query options
 * 權限查詢選項
 */
export interface PermissionQueryOptions {
  subjectId?: string;
  subjectType?: PermissionSubjectType;
  blueprintId?: string;
  level?: PermissionLevel;
}
