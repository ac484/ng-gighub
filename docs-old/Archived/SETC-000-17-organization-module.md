# SETC-000-17: Organization Module (組織管理模組)

> **模組 ID**: `organization`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作完成  
> **優先級**: P0 (核心)  
> **架構**: Foundation Layer - Multi-tenancy  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

Organization 模組管理多租戶組織功能，提供組織建立、成員管理、團隊管理與組織設定等功能。

### 業務範圍

多租戶組織管理，包括：
- 組織建立、檢視、編輯
- 成員管理 (新增/移除成員)
- 團隊管理 (建立與管理團隊)
- 組織設定 (一般設定、計費、整合)
- 多組織支援 (每位使用者可屬於多個組織)

### 核心特性

- ✅ **多租戶架構**: 支援多個組織獨立運作
- ✅ **成員管理**: 完整的成員邀請與角色管理
- ✅ **團隊管理**: 組織內團隊協作
- ✅ **權限控制**: 基於角色的存取控制 (RBAC)
- ✅ **組織設定**: 可自訂的組織配置
- ✅ **訂閱管理**: Free/Pro/Enterprise 方案

---

## 🏗️ 架構設計

### 目錄結構

```
src/app/routes/organization/
├── AGENTS.md              # 模組指引
├── routes.ts              # 路由配置
├── members/               # 成員管理
│   ├── member-list.component.ts
│   └── member-modal.component.ts
├── teams/                 # 團隊管理
│   ├── team-list.component.ts
│   └── team-modal.component.ts
└── settings/              # 組織設定
    ├── general.component.ts
    ├── billing.component.ts
    └── integrations.component.ts
```

---

## 📊 資料模型

### Organization (組織)

```typescript
interface Organization {
  id: string;
  name: string;                          // 必填
  slug: string;                          // URL 友善識別符
  description?: string;
  logo_url?: string;
  owner_id: string;                      // 建立者
  status: OrgStatus;                     // 'active' | 'suspended' | 'archived'
  subscription_tier: SubscriptionTier;   // 'free' | 'pro' | 'enterprise'
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;                     // 軟刪除
}
```

### OrganizationMember (組織成員)

```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;                      // 'owner' | 'admin' | 'member'
  joined_at: Date;
  invited_by: string;
}
```

### MemberRole (成員角色)

| 角色 | 權限 |
|------|------|
| `owner` | 完全控制 (刪除組織、管理計費) |
| `admin` | 管理成員、建立團隊、管理設定 |
| `member` | 存取組織資源、建立 Blueprint |

---

## 📦 核心功能

### 1️⃣ Organization List (組織列表)

**職責**: 顯示使用者所屬的所有組織

**核心功能**:
- 列出所有組織
- 依角色或狀態篩選
- 快速操作 (檢視、編輯、離開)
- 建立新組織

### 2️⃣ Member Management (成員管理)

**職責**: 管理組織成員

**核心功能**:
- 顯示所有成員
- 透過郵件邀請新成員
- 變更成員角色
- 移除成員
- 基於權限的 UI 顯示

**實作範例**:
```typescript
@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [SHARED_IMPORTS]
})
export class MemberListComponent {
  private orgService = inject(OrganizationService);
  private permissionService = inject(PermissionService);
  
  members = signal<OrganizationMember[]>([]);
  loading = signal(false);
  
  // 權限檢查
  canInvite = computed(() => 
    this.permissionService.hasRole('admin') || 
    this.permissionService.hasRole('owner')
  );
  
  canChangeRole = computed(() =>
    this.permissionService.hasRole('owner')
  );
  
  // 邀請成員
  async inviteMember(email: string, role: MemberRole): Promise<void> {
    if (!this.canInvite()) return;
    
    await this.orgService.inviteMember({
      organizationId: this.currentOrg.id,
      email,
      role
    });
    
    this.loadMembers();
  }
}
```

### 3️⃣ Team Management (團隊管理)

**職責**: 組織內團隊管理

**核心功能**:
- 建立團隊
- 編輯團隊資訊
- 指派團隊成員
- 團隊權限管理

### 4️⃣ Organization Settings (組織設定)

**職責**: 組織層級配置

**設定類別**:
- **一般設定**: 名稱、標誌、描述
- **計費設定**: 訂閱方案、付款方式
- **整合設定**: 第三方服務整合

---

## 🔒 權限控制

### 角色權限矩陣

| 操作 | Owner | Admin | Member |
|------|-------|-------|--------|
| 檢視組織 | ✅ | ✅ | ✅ |
| 編輯組織資訊 | ✅ | ✅ | ❌ |
| 邀請成員 | ✅ | ✅ | ❌ |
| 變更成員角色 | ✅ | ❌ | ❌ |
| 移除成員 | ✅ | ✅ | ❌ |
| 建立團隊 | ✅ | ✅ | ❌ |
| 刪除組織 | ✅ | ❌ | ❌ |
| 管理計費 | ✅ | ❌ | ❌ |

---

## 🔗 相關模組

- **User Module**: 使用者與組織關聯
- **Team Module**: 組織內團隊管理
- **Blueprint Module**: 組織擁有的 Blueprint
- **Passport Module**: 登入後組織選擇

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
