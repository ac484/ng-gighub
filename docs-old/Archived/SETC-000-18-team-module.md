# SETC-000-18: Team Module (團隊協作模組)

> **模組 ID**: `team`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作完成  
> **優先級**: P1 (必要)  
> **架構**: Foundation Layer - Collaboration  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

Team 模組管理組織內的團隊協作，提供團隊建立、成員指派、權限管理與團隊儀表板等功能。

### 業務範圍

組織內團隊協作管理，包括：
- 團隊建立、編輯、刪除
- 成員指派 (新增/移除團隊成員)
- 團隊權限 (角色型存取控制)
- 團隊儀表板 (活動與指標)
- Blueprint 存取 (團隊層級 Blueprint 分享)

### 核心特性

- ✅ **團隊管理**: 完整的團隊 CRUD 功能
- ✅ **成員指派**: 彈性的成員管理
- ✅ **角色權限**: Leader/Member 角色區分
- ✅ **Blueprint 分享**: 團隊層級存取控制
- ✅ **活動追蹤**: 團隊活動時間軸

---

## 📊 資料模型

### Team (團隊)

```typescript
interface Team {
  id: string;
  organization_id: string;               // 所屬組織
  name: string;                          // 必填
  description?: string;
  leader_id: string;                     // 團隊領導者
  status: TeamStatus;                    // 'active' | 'archived'
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### TeamMember (團隊成員)

```typescript
interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;                        // 'leader' | 'member'
  joined_at: Date;
  added_by: string;
}
```

### BlueprintTeamPermission (Blueprint 團隊權限)

```typescript
interface BlueprintTeamPermission {
  blueprint_id: string;
  team_id: string;
  role: BlueprintRole;                   // 'viewer' | 'contributor' | 'maintainer'
}
```

---

## 📦 核心功能

### 1️⃣ Team List (團隊列表)

- 顯示組織內所有團隊
- 依狀態或領導者篩選
- 建立新團隊按鈕
- 顯示團隊成員數量

### 2️⃣ Team Detail (團隊詳情)

- 顯示團隊資訊和描述
- 顯示成員列表及其角色
- 顯示團隊活動時間軸
- 顯示已分配的 Blueprint

### 3️⃣ Member Management (成員管理)

- 只能新增組織成員到團隊
- 支援指派團隊角色 (leader/member)
- 支援移除團隊成員
- 支援轉移領導權

---

## 🔗 相關模組

- **Organization Module**: 團隊屬於組織
- **User Module**: 團隊成員管理
- **Blueprint Module**: 團隊層級存取控制

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
