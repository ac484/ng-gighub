/**
 * Permission hierarchy level
 * 權限層級列舉
 */
export enum PermissionLevel {
  /** 系統層級 | System level (owner) */
  SYSTEM = 0,
  /** 組織層級 | Organization level */
  ORGANIZATION = 1,
  /** 團隊層級 | Team level */
  TEAM = 2,
  /** 個人層級 | User level */
  USER = 3
}
