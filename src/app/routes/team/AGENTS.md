# Team Module Agent Guide

## Title + Scope
Scope: Team collaboration features under src/app/routes/team, including team management, membership, and permissions.

## Purpose / Responsibility
Guide agents implementing team routing, services, and data interactions while preserving organization/blueprint boundaries and role-based access.

## Hard Rules / Constraints
- NO UI components beyond team module scope unless explicitly required.
- NO feature-specific logic outside team collaboration responsibilities.
- NO direct Firebase access outside adapters/repositories; use approved data access layers.
- Maintain multi-tenant safety and use inject() for DI.

## Allowed / Expected Content
- Team routing definitions, guards, and services coordinating team/member flows.
- Documentation and tests for team data models and permissions.
- Shared helpers for team dashboards and member assignment that stay within this module.

## Structure / Organization
- routes.ts for team routes
- members/ folder for member management components
- Additional feature folders as documented below

## Integration / Dependencies
- Interact with organization/blueprint services through public interfaces.
- Use Angular DI (inject()) and repository pattern for Firestore operations.
- No cross-feature imports without explicit contracts.

## Best Practices / Guidelines
- Enforce role checks consistently, use signals for state, and keep services stateless when possible.
- Validate inputs, apply Result pattern for async flows, and avoid duplicating data models.

## Related Docs / References
- ../AGENTS.md (Routes)
- ../../AGENTS.md (App)
- ../../../core/AGENTS.md (Core services)

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Team Module Agent Guide

The Team module manages team collaboration within organizations in GigHub (Foundation Layer).

## Module Purpose

The Team module provides:
- **Team Management** - Create, edit, delete teams
- **Member Assignment** - Add/remove team members
- **Team Permissions** - Role-based access within teams
- **Team Dashboard** - Team activity and metrics
- **Blueprint Access** - Team-level blueprint sharing

## Module Structure

```
src/app/routes/team/
├── AGENTS.md              # This file
├── routes.ts              # Module routing
└── members/               # Team member management
    ├── member-list.component.ts
    └── member-modal.component.ts
```

## Data Models

### Team

**規則**:
- `id` 為唯一識別碼
- `organization_id` 為必填，指定所屬組織
- `name` 為必填欄位
- `description` 為選填欄位
- `leader_id` 為必填，指定團隊領導者用戶 ID
- `status` 必須為 'active' 或 'archived'
- 必須包含 `created_at` 和 `updated_at` 時間戳記
- `deleted_at` 用於軟刪除（選填）

### TeamMember

**規則**:
- `id` 為唯一識別碼
- `team_id` 為必填，指定所屬團隊
- `user_id` 為必填，指定用戶 ID
- `role` 必須為 'leader' 或 'member'
- 必須包含 `joined_at` 時間戳記
- `added_by` 為必填，記錄新增成員的用戶 ID

### BlueprintTeamPermission

**規則**:
- `blueprint_id` 為必填，指定藍圖 ID
- `team_id` 為必填，指定團隊 ID
- `role` 必須為 'viewer'、'contributor' 或 'maintainer'

## Key Features

### Team List

**規則**:
- 必須顯示組織內所有團隊
- 必須支援依狀態或領導者篩選
- 必須提供建立新團隊按鈕
- 必須顯示團隊成員數量

### Team Detail

**規則**:
- 必須顯示團隊資訊和描述
- 必須顯示成員列表及其角色
- 必須顯示團隊活動時間軸
- 必須顯示已分配的藍圖

### Member Management

**規則**:
- 只能將組織成員加入團隊
- 必須支援指派團隊角色（leader/member）
- 必須支援移除團隊成員
- 必須支援轉移領導權

### Team Permissions

**規則**:
- 團隊可以被授予藍圖權限
- 團隊成員繼承團隊權限
- 簡化權限管理流程

## Routing

**規則**:
- 根路徑 `/` 必須顯示團隊列表
- `/:id` 路徑必須顯示團隊詳情
- `/:id/members` 子路由必須顯示成員列表
- `/:id/blueprints` 子路由必須顯示團隊藍圖

## Firebase/Firestore Collections

### Collections

**規則**:
- `teams` collection 儲存團隊文件
- `team_members` collection 儲存團隊成員關係
- `blueprint_team_permissions` collection 儲存團隊對藍圖的存取權限

### Security Rules

**規則**:
- `teams/{teamId}` 文件：團隊成員或組織成員可讀取，團隊領導者或組織管理員可寫入
- `team_members/{memberId}` 文件：團隊成員可讀取，團隊領導者可建立，團隊領導者或本人可刪除
- 所有規則必須檢查用戶是否為團隊成員或組織成員

## Integration Points

### With Organization

**規則**:
- 團隊必須隸屬於組織
- 只有組織成員才能加入團隊
- 組織管理員可以管理所有團隊

### With Blueprint

**規則**:
- 團隊可以被授予藍圖存取權限
- 團隊成員繼承團隊權限
- 簡化權限管理流程

### Use Cases

**規則**:
1. 專案團隊：將團隊分配給特定藍圖
2. 部門團隊：工程、QA、管理團隊
3. 外部團隊：承包商或客戶團隊

## Best Practices

**規則**:
1. 團隊規模必須保持在可管理範圍（5-15 名成員）
2. 必須明確定義團隊領導者和職責
3. 必須使用團隊權限以提升效率
4. 必須記錄團隊操作以確保責任制
5. 必須與通知系統整合
6. 必須使用 Signals 管理元件狀態
7. 必須使用 `inject()` 進行依賴注入
8. 必須實作錯誤處理和載入狀態

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Organization Module](../organization/AGENTS.md)** - Parent organization
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint permissions
- **[Core Services](../../core/AGENTS.md)** - Permission service

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
