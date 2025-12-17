/**
 * Account Types Module
 *
 * Core type definitions for SaaS multi-tenancy support.
 * Defines user, organization, team, and bot contexts.
 *
 * @module core/types
 */

// ============================================================================
// Context Types (上下文類型)
// ============================================================================

/**
 * 上下文類型枚舉
 * Context type enumeration
 *
 * Defines the different workspace context types available in the application
 */
export enum ContextType {
  /** 個人帳戶上下文 | User account context */
  USER = 'user',
  /** 組織上下文 | Organization context */
  ORGANIZATION = 'organization',
  /** 團隊上下文 | Team context */
  TEAM = 'team',
  /** 機器人上下文 | Bot context */
  BOT = 'bot'
}

/**
 * 上下文狀態介面
 * Context state interface
 *
 * Represents the current workspace context
 */
export interface ContextState {
  /** 上下文類型 | Context type */
  type: ContextType;
  /** 上下文 ID | Context ID */
  id: string | null;
  /** 上下文標籤（顯示名稱） | Context label (display name) */
  label: string;
  /** 上下文圖標 | Context icon */
  icon: string;
}

// ============================================================================
// Account Types (帳戶類型)
// ============================================================================

/**
 * Account entity interface (simplified for Firebase)
 * 帳戶實體介面（Firebase 簡化版）
 */
export interface Account {
  id: string;
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  avatar_url?: string | null;
  /** Whether this account can be discovered in explore/search (default: true) */
  is_discoverable?: boolean;
  created_at?: string;
}

// ============================================================================
// Organization Types (組織類型)
// ============================================================================

/**
 * 組織角色枚舉
 * Organization role enumeration
 */
export enum OrganizationRole {
  /** 擁有者 | Owner */
  OWNER = 'owner',
  /** 管理員 | Admin */
  ADMIN = 'admin',
  /** 成員 | Member */
  MEMBER = 'member'
}

/**
 * Organization entity interface (simplified for Firebase)
 * 組織實體介面（Firebase 簡化版）
 */
export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  /** Whether this organization can be discovered in explore/search (default: true) */
  is_discoverable?: boolean;
  created_by: string; // Firebase Auth UID
  created_at?: string;
}

/**
 * OrganizationMember entity interface
 * 組織成員實體介面
 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string; // Firebase Auth UID
  role: OrganizationRole;
  joined_at?: string;
}

/**
 * 邀請狀態
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

/**
 * 組織邀請
 */
export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  invited_by: string;
  status: InvitationStatus;
  created_at?: string;
}

/**
 * 建立組織邀請請求
 */
export interface CreateOrganizationInvitationRequest {
  organization_id: string;
  email: string;
  invited_by: string;
  status?: InvitationStatus;
}

// ============================================================================
// Team Types (團隊類型)
// ============================================================================

/**
 * 團隊角色枚舉
 * Team role enumeration
 */
export enum TeamRole {
  /** 團隊領導 | Team leader */
  LEADER = 'leader',
  /** 團隊成員 | Team member */
  MEMBER = 'member'
}

/**
 * Team entity interface (simplified for Firebase)
 * 團隊實體介面（Firebase 簡化版）
 */
export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

/**
 * TeamMember entity interface
 * 團隊成員實體介面
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string; // Firebase Auth UID
  role: TeamRole;
  joined_at?: string;
}

// ============================================================================
// Partner Types (夥伴類型)
// ============================================================================

/**
 * 夥伴類型枚舉
 * Partner type enumeration
 *
 * Defines the different types of external partners
 */
export enum PartnerType {
  /** 承包商 | Contractor */
  CONTRACTOR = 'contractor',
  /** 供應商 | Supplier */
  SUPPLIER = 'supplier',
  /** 顧問 | Consultant */
  CONSULTANT = 'consultant',
  /** 次承包商 | Subcontractor */
  SUBCONTRACTOR = 'subcontractor'
}

/**
 * 夥伴角色枚舉
 * Partner role enumeration
 */
export enum PartnerRole {
  /** 管理員 | Admin */
  ADMIN = 'admin',
  /** 成員 | Member */
  MEMBER = 'member'
}

/**
 * Partner entity interface (simplified for Firebase)
 * 夥伴實體介面（Firebase 簡化版）
 *
 * Used for managing external partners (contractors, suppliers, consultants)
 */
export interface Partner {
  id: string;
  organization_id: string;
  name: string;
  type: PartnerType;
  company_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  created_at?: string;
}

/**
 * PartnerMember entity interface
 * 夥伴成員實體介面
 */
export interface PartnerMember {
  id: string;
  partner_id: string;
  user_id: string; // Firebase Auth UID
  role: PartnerRole;
  joined_at?: string;
}

// ============================================================================
// Bot Types (機器人類型)
// ============================================================================

/**
 * Bot entity interface (simplified for Firebase)
 * 機器人實體介面（Firebase 簡化版）
 */
export interface Bot {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string; // Firebase Auth UID or Organization ID
  created_at?: string;
}
