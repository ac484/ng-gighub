/**
 * Blueprint owner type
 * 藍圖擁有者類型
 */
export enum OwnerType {
  /** 個人用戶 | User-owned blueprint */
  USER = 'user',
  /** 組織 | Organization-owned blueprint */
  ORGANIZATION = 'organization',
  /** 團隊 | Team-owned blueprint */
  TEAM = 'team'
}
