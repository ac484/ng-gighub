# Organization Module Agent Guide

## Title + Scope
Scope: Organization management features under src/app/routes/organization.

## Purpose / Responsibility
Describe responsibilities for organization CRUD, member management, and related routing without breaking multi-tenant boundaries.

## Hard Rules / Constraints
- NO UI components beyond organization module scope unless required.
- NO feature-specific logic outside organization ownership/collaboration.
- NO direct Firebase access outside repositories/adapters; use services for data.

## Allowed / Expected Content
- Routes, components, and services for organizations and members.
- Permission checks and event publishing tied to organization actions.
- Documentation/tests for organization flows.

## Structure / Organization
- routes.ts for organization routes
- Components and subfolders for lists, detail, and members as documented below

## Integration / Dependencies
- Interact with @core services (organization, blueprint) through public APIs.
- Use Angular DI with inject(); keep repository access encapsulated.

## Best Practices / Guidelines
- Enforce role/permission checks, use signals for UI state, and keep services stateless when possible.
- Apply Result pattern and avoid duplication of models.

## Related Docs / References
- ../AGENTS.md (Routes)
- ../../AGENTS.md (App)
- ../../../core/AGENTS.md (Core services)

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Organization Module Agent Guide

The Organization module manages multi-tenant organization features in GigHub (Foundation Layer).

## Module Purpose

The Organization module provides:
- **Organization Management** - Create, view, edit organizations
- **Member Management** - Add/remove organization members
- **Team Management** - Create and manage teams within organizations
- **Settings** - Organization-level configuration
- **Multi-tenancy** - Support for multiple organizations per user

## Module Structure

```
src/app/routes/organization/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
├── members/               # Member management
│   ├── member-list.component.ts
│   └── member-modal.component.ts
├── teams/                 # Team management
│   ├── team-list.component.ts
│   └── team-modal.component.ts
└── settings/              # Organization settings
    ├── general.component.ts
    ├── billing.component.ts
    └── integrations.component.ts
```

## Data Models

### Organization

**規則**:
- `id` 為唯一識別碼
- `name` 為必填欄位
- `slug` 為必填欄位，URL 友善的識別符
- `description` 為選填欄位
- `logo_url` 為選填欄位
- `owner_id` 為必填，指定建立組織的用戶
- `status` 必須為 'active'、'suspended' 或 'archived'
- `subscription_tier` 必須為 'free'、'pro' 或 'enterprise'
- 必須包含 `created_at` 和 `updated_at` 時間戳記
- `deleted_at` 用於軟刪除（選填）

### OrganizationMember

**規則**:
- `id` 為唯一識別碼
- `organization_id` 為必填，指定所屬組織
- `user_id` 為必填，指定用戶 ID
- `role` 必須為 'owner'、'admin' 或 'member'
- 必須包含 `joined_at` 時間戳記
- `invited_by` 為必填，記錄邀請者的用戶 ID

## Key Features

### Organization List

**規則**:
- 必須顯示用戶所屬的所有組織
- 必須支援依角色或狀態篩選
- 必須提供快速操作（檢視、編輯、離開）
- 必須提供建立新組織按鈕

### Member Management

**規則**:
- 必須顯示所有組織成員
- 必須支援透過電子郵件邀請新成員
- 必須支援變更成員角色
- 必須支援移除成員
- 必須基於權限顯示 UI

### Team Management

**規則**:
- 必須支援在組織內建立團隊
- 必須支援將成員分配到團隊
- 必須支援團隊層級權限
- 必須支援團隊儀表板

### Organization Settings

**規則**:
- 一般設定：名稱、標誌、描述
- 帳單設定：訂閱、付款方式
- 整合設定：第三方服務
- 安全設定：2FA、SSO 設定

## Routing

**規則**:
- 根路徑 `/` 必須顯示組織列表
- `/:id` 路徑必須顯示組織詳情
- `/:id/members` 子路由必須顯示成員列表
- `/:id/teams` 子路由必須顯示團隊列表
- `/:id/settings` 子路由必須顯示設定頁面

## Firebase/Firestore Collections

### Collections

**規則**:
- `organizations` collection 儲存主要組織文件
- `organization_members` collection 儲存成員關聯
- `organization_teams` collection 儲存組織內的團隊
- `organization_invitations` collection 儲存待處理的邀請

### Security Rules

**規則**:
- `organizations/{orgId}` 文件：組織成員可讀取，組織管理員可寫入
- `organization_members/{memberId}` 文件：組織成員可讀取，組織管理員可建立，組織擁有者可更新/刪除
- 所有規則必須檢查用戶是否為組織成員

## Integration with Blueprint

**規則**:
- 組織可以擁有藍圖
- 藍圖的 `owner_type` 可以為 'organization'
- 藍圖的 `owner_id` 在 `owner_type` 為 'organization' 時為組織 ID
- 共享存取藍圖的優勢：共享存取、基於團隊的協作、集中帳單、組織層級權限

## Best Practices

**規則**:
1. 多租戶：必須按 `organization_id` 隔離資料
2. 權限：必須強制執行基於角色的存取控制
3. 邀請：新成員必須進行電子郵件驗證
4. 帳單：必須追蹤訂閱狀態
5. 軟刪除：必須維護資料完整性
6. 必須使用 Signals 管理元件狀態
7. 必須使用 `inject()` 進行依賴注入
8. 必須實作錯誤處理和載入狀態

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Core Services](../../core/AGENTS.md)** - Shared services
- **[Team Module](../team/AGENTS.md)** - Team management
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint ownership

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
