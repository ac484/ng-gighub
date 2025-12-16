/**
 * System roles (platform / blueprint level)
 * 系統角色（平台／藍圖層級）
 */
export enum SystemRole {
  /** 擁有者 | Owner */
  OWNER = 'owner',
  /** 管理員 | Admin */
  ADMIN = 'admin',
  /** 成員 | Member */
  MEMBER = 'member'
}

/**
 * Business roles (domain-specific roles)
 * 業務角色（領域角色）
 */
export enum BusinessRole {
  PROJECT_MANAGER = 'project_manager',
  SITE_SUPERVISOR = 'site_supervisor',
  ENGINEER = 'engineer',
  QUALITY_INSPECTOR = 'quality_inspector',
  ARCHITECT = 'architect',
  CONTRACTOR = 'contractor',
  CLIENT = 'client'
}
