import { BlueprintStatus } from './blueprint-status.enum';
import { OwnerType } from './owner-type.enum';
import { ModuleType } from '../module/module.types';

/**
 * Blueprint role enumeration (system roles)
 * 藍圖系統角色列舉
 */
export enum BlueprintRole {
  /** 檢視者 - 唯讀訪問 | Viewer role */
  VIEWER = 'viewer',
  /** 貢獻者 - 可編輯內容 | Contributor role */
  CONTRIBUTOR = 'contributor',
  /** 維護者 - 管理與編輯權限 | Maintainer role */
  MAINTAINER = 'maintainer'
}

/**
 * Blueprint business role enumeration
 * 藍圖業務角色列舉
 */
export enum BlueprintBusinessRole {
  PROJECT_MANAGER = 'project_manager',
  SITE_SUPERVISOR = 'site_supervisor',
  ENGINEER = 'engineer',
  QUALITY_INSPECTOR = 'quality_inspector',
  ARCHITECT = 'architect',
  CONTRACTOR = 'contractor',
  CLIENT = 'client'
}

/**
 * Team access levels for blueprint
 * 藍圖團隊訪問層級
 */
export enum BlueprintTeamAccess {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

/**
 * Blueprint entity interface
 * 藍圖實體介面
 */
export interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;

  // Ownership
  ownerId: string;
  ownerType: OwnerType;

  // Visibility and status
  isPublic: boolean;
  status: BlueprintStatus;
  enabledModules: ModuleType[];

  // Metadata
  metadata?: Record<string, unknown>;

  // Audit fields
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * Blueprint member interface
 * 藍圖成員介面
 */
export interface BlueprintMember {
  id: string;
  blueprintId: string;
  accountId: string;
  role: BlueprintRole;
  businessRole?: BlueprintBusinessRole;
  isExternal: boolean;
  permissions?: {
    canManageMembers?: boolean;
    canManageSettings?: boolean;
    canExportData?: boolean;
    canDeleteBlueprint?: boolean;
    customPermissions?: string[];
  };
  metadata?: Record<string, unknown>;
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * Blueprint team role interface
 * 藍圖團隊角色介面
 */
export interface BlueprintTeamRole {
  id: string;
  blueprintId: string;
  teamId: string;
  access: BlueprintTeamAccess;
  metadata?: Record<string, unknown>;
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * Blueprint creation request
 * 藍圖建立請求
 */
export interface CreateBlueprintRequest {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  ownerType: OwnerType;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Blueprint update payload
 * 藍圖更新資料
 */
export type UpdateBlueprintRequest = Partial<Omit<Blueprint, 'id' | 'createdAt' | 'createdBy'>>;

/**
 * Blueprint query options
 * 藍圖查詢選項
 */
export interface BlueprintQueryOptions {
  ownerId?: string;
  ownerType?: OwnerType;
  status?: BlueprintStatus;
  isPublic?: boolean;
  includeDeleted?: boolean;
}
