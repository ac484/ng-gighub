# GigHub 側邊欄與藍圖設計總結 (Sidebar & Blueprint Design Summary)

## 專案資訊 (Project Information)

**專案名稱**: GigHub - 工地施工進度追蹤管理系統  
**文件日期**: 2025-12-09  
**文件狀態**: 初始設計完成

## 本次任務目標 (Task Objectives)

1. ✅ 分析專案架構與現有 SaaS 實作
2. ✅ 使用 Context7 查詢相關文件（ng-alain, ng-zorro-antd, Angular）
3. ✅ 設計「最基礎」的側邊欄功能
4. ✅ 更新 `src/assets/tmp/app-data.json`
5. ✅ 建立藍圖邏輯容器設計文件

## 交付成果 (Deliverables)

### 1. Blueprint 邏輯容器設計文件

**檔案**: `docs/BLUEPRINT_CONTAINER_DESIGN.md`

#### 核心內容

- **架構定位**: Blueprint 在三層架構中的位置
- **擁有者模型**: User 和 Organization 可建立 Blueprint
- **模組系統**: 任務、日誌、品質驗收等模組
- **權限模型**: RBAC 角色與訪問控制
- **資料模型**: 完整的資料庫 Schema 和 RLS 政策
- **實作指引**: BlueprintService 和元件範例
- **使用場景**: 三個主要使用案例

#### 關鍵設計決策

```
藍圖擁有權矩陣:
┌────────────────┬──────────────┬──────────────┐
│ 上下文          │ 建立藍圖      │ 訪問控制      │
├────────────────┼──────────────┼──────────────┤
│ User           │ ✅ 可建立     │ ✅ 完全控制   │
│ Organization   │ ✅ 可建立     │ ✅ 完全控制   │
│ Team           │ ❌ 不能建立   │ ✅ 只讀訪問   │
│ Bot            │ ❌ 不能建立   │ ✅ 只讀訪問   │
└────────────────┴──────────────┴──────────────┘
```

### 2. 側邊欄功能設計文件

**檔案**: `docs/System-SIDEBAR_FEATURES_DESIGN.md`

#### 核心內容

- **設計原則**: 最小化、上下文感知、一致性
- **四種上下文的側邊欄設計**: User, Organization, Team, Bot
- **藍圖訪問矩陣**: 清楚定義各上下文的權限
- **資料結構**: MenuItem 介面與實作範例
- **使用者體驗流程**: 三個主要場景的流程圖
- **實作檢查清單**: 5 個階段的開發計畫

#### 最基礎功能總結

**User Context (3 功能)**
```json
{
  "儀錶盤": "個人工作概覽",
  "我的藍圖": "個人建立的藍圖管理",
  "個人設定": "帳戶設定與偏好"
}
```

**Organization Context (5 功能)**
```json
{
  "組織儀錶盤": "組織整體概覽",
  "組織藍圖": "組織級專案管理",
  "成員管理": "組織成員與角色",
  "團隊管理": "子團隊組織結構",
  "組織設定": "組織配置管理"
}
```

**Team Context (3 功能)**
```json
{
  "團隊工作臺": "團隊協作中心",
  "團隊藍圖": "訪問授權的組織藍圖（只讀）",
  "團隊成員": "團隊成員資訊"
}
```

**Bot Context (1 功能)**
```json
{
  "機器人控制台": "監控與日誌"
}
```

### 3. 更新後的選單資料

**檔案**: `src/assets/tmp/app-data.json`

#### 變更內容

**User 選單 (變更前後對比)**
```diff
- 儀錶盤 (4 個子選項: V1, 分析, 監控, 工作臺)
+ 儀錶盤 (單一連結: /dashboard/user)
+ 我的藍圖 (新增: /blueprint/list)
+ 個人設定 (新增: /user/settings)
```

**Organization 選單 (變更前後對比)**
```diff
- 儀錶盤 (2 個子選項: 組織概覽, 分析頁)
+ 組織儀錶盤 (單一連結: /dashboard/organization)
+ 組織藍圖 (新增: /organization/blueprints)
+ 成員管理 (新增: /organization/members)
+ 團隊管理 (新增: /organization/teams)
+ 組織設定 (新增: /organization/settings)
```

**Team 選單 (變更前後對比)**
```diff
- 儀錶盤 > 團隊工作臺 (子選單)
+ 團隊工作臺 (單一連結: /dashboard/team)
+ 團隊藍圖 (新增: /team/blueprints, 標記 shortcutRoot: false)
+ 團隊成員 (新增: /team/members)
```

**Bot 選單 (無變更)**
- 保持原有的機器人控制台結構

## 技術決策 (Technical Decisions)

### 1. 使用 Context7 查詢文件

查詢的庫與主題：

| 庫名稱 | Context7 ID | 查詢主題 | 用途 |
|--------|-------------|---------|------|
| ng-alain | /ng-alain/ng-alain | menu sidebar navigation | 了解選單最佳實踐 |
| ng-zorro-antd | /ng-zorro/ng-zorro-antd | menu navigation sidebar | 學習 Menu 元件 API |
| Angular | /angular/angular | signals state management | 實作 Signals 狀態管理 |

**版本狀態檢查**：
- Angular: 20.3.0 ✅ (專案版本)
- ng-alain: 20.1.0 ✅ (專案版本)
- ng-zorro-antd: 20.3.1 ✅ (專案版本)

所有使用的庫版本皆為最新或接近最新，無需升級警告。

### 2. 設計原則

遵循「最少代碼」與「最基礎功能」原則：

1. **最小化功能集**
   - 每個上下文只包含必要功能
   - 避免功能重複
   - 保持選單結構扁平化

2. **上下文感知**
   - 使用 WorkspaceContextService 管理當前上下文
   - 側邊欄根據上下文動態切換
   - 權限與上下文類型綁定

3. **資料驅動**
   - 選單從 `app-data.json` 載入
   - 支援國際化 (i18n)
   - 支援徽章與通知

### 3. 架構整合

Blueprint 容器整合到現有三層架構：

```
┌─────────────────────────────────────────┐
│ Business Layer (業務層)                  │
│ - Blueprint 邏輯容器                     │
│   - 任務模組 (Task Module)               │
│   - 日誌模組 (Log Module)                │
│   - 品質模組 (Quality Module)            │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Container Layer (容器層)                 │
│ - 權限控制 (ACL) ← 整合 Blueprint 權限  │
│ - 事件總線 (Event Bus)                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Foundation Layer (基礎層)                │
│ - WorkspaceContextService               │
│ - 帳戶體系 (Account System)             │
│ - 組織管理 (Organization Management)    │
└─────────────────────────────────────────┘
```

## 關鍵規則與限制 (Key Rules & Constraints)

### Blueprint 建立規則

```typescript
const canCreateBlueprint = (contextType: ContextType): boolean => {
  return contextType === 'user' || contextType === 'organization';
};

// ✅ User 可以建立個人藍圖
// ✅ Organization 可以建立組織藍圖
// ❌ Team 不能建立藍圖（只能訪問組織藍圖）
// ❌ Bot 不能建立藍圖（只能執行自動化任務）
```

### Blueprint 訪問規則

```typescript
interface BlueprintAccess {
  user: {
    create: true,
    access: 'own_blueprints',
    permissions: 'full_control'
  },
  organization: {
    create: true,
    access: 'org_blueprints',
    permissions: 'full_control'
  },
  team: {
    create: false,
    access: 'authorized_blueprints',
    permissions: 'read_only'
  },
  bot: {
    create: false,
    access: 'authorized_blueprints',
    permissions: 'read_only'
  }
}
```

### 權限層級

```typescript
// Organization 權限
enum OrganizationRole {
  OWNER = 'owner',      // 完全控制，包含刪除組織
  ADMIN = 'admin',      // 管理權限，不含刪除組織
  MEMBER = 'member'     // 基本訪問權限
}

// Team 權限
enum TeamRole {
  LEADER = 'leader',    // 團隊領導（管理團隊成員）
  MEMBER = 'member'     // 團隊成員（協作執行）
}

// Blueprint 權限
enum BlueprintRole {
  OWNER = 'owner',      // 擁有者 - 完全控制
  ADMIN = 'admin',      // 管理員 - 管理但不能刪除
  EDITOR = 'editor',    // 編輯者 - 編輯內容
  VIEWER = 'viewer'     // 檢視者 - 唯讀
}
```

## 資料庫 Schema (Database Schema)

### 核心表結構

```sql
-- Blueprint 表
CREATE TABLE blueprint (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_type VARCHAR(20) NOT NULL, -- 'user' | 'organization'
  owner_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

-- Blueprint 權限表
CREATE TABLE blueprint_permission (
  id UUID PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprint(id),
  user_id UUID NOT NULL REFERENCES account(id),
  role VARCHAR(20) NOT NULL, -- 'owner' | 'admin' | 'editor' | 'viewer'
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID NOT NULL
);

-- Blueprint 任務表 (範例模組)
CREATE TABLE blueprint_task (
  id UUID PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprint(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to UUID REFERENCES account(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Blueprint 訪問政策
CREATE POLICY "blueprint_access_policy"
  ON blueprint FOR SELECT
  USING (
    -- 擁有者可訪問
    (owner_type = 'user' AND owner_id = auth.uid())
    OR
    -- 有明確權限的用戶可訪問
    EXISTS (
      SELECT 1 FROM blueprint_permission
      WHERE blueprint_id = blueprint.id
      AND user_id = auth.uid()
    )
    OR
    -- 組織成員可訪問組織藍圖
    (owner_type = 'organization' AND EXISTS (
      SELECT 1 FROM organization_member
      WHERE organization_id = blueprint.owner_id
      AND user_id = auth.uid()
    ))
  );
```

## 實作路徑 (Implementation Path)

### Phase 1: 基礎建設 ✅ (已完成)
- [x] 定義選單資料結構
- [x] 更新 `app-data.json`
- [x] 撰寫設計文件

### Phase 2: 服務層實作 (待完成)
- [ ] 實作 `BlueprintService`
- [ ] 整合 WorkspaceContextService
- [ ] 實作權限檢查邏輯
- [ ] 實作 RLS 政策

### Phase 3: UI 元件實作 (待完成)
- [ ] 實作 BlueprintSelectorComponent
- [ ] 更新 BasicLayoutComponent 動態載入選單
- [ ] 實作儀錶盤頁面（User, Org, Team, Bot）
- [ ] 實作藍圖列表與建立頁面

### Phase 4: 路由與守衛 (待完成)
- [ ] 設定路由結構
- [ ] 實作 `blueprintAccessGuard`
- [ ] 實作 `contextRouteGuard`
- [ ] 測試路由切換

### Phase 5: 整合測試 (待完成)
- [ ] 測試上下文切換
- [ ] 測試藍圖建立與訪問
- [ ] 測試權限控制
- [ ] E2E 測試

## 使用範例 (Usage Examples)

### 範例 1: 用戶建立個人藍圖

```typescript
// 1. 切換到用戶上下文
await workspaceContext.switchToUser(userId);

// 2. 建立個人藍圖
const blueprint = await blueprintService.createBlueprint({
  name: '住宅裝修專案',
  description: '張先生的房屋裝修工程'
});

// 3. 在側邊欄查看「我的藍圖」
// → 自動顯示新建立的藍圖
```

### 範例 2: 組織分配藍圖給團隊

```typescript
// 1. 切換到組織上下文
await workspaceContext.switchToOrganization(orgId);

// 2. 建立組織藍圖
const blueprint = await blueprintService.createBlueprint({
  name: '商業大樓專案',
  description: '市中心商業大樓建設'
});

// 3. 分配權限給團隊
await blueprintService.grantTeamAccess({
  blueprint_id: blueprint.id,
  team_id: teamId,
  role: 'editor'
});

// 4. 團隊成員切換到團隊上下文
await workspaceContext.switchToTeam(teamId);

// 5. 在「團隊藍圖」中可見該藍圖（只讀）
```

### 範例 3: 檢查建立權限

```typescript
// 在 UI 中決定是否顯示「新增藍圖」按鈕
const canCreate = computed(() => {
  const contextType = workspaceContext.contextType();
  return contextType === 'user' || contextType === 'organization';
});

// Template
// @if (canCreate()) {
//   <button nz-button (click)="createBlueprint()">
//     新增藍圖
//   </button>
// }
```

## 文件結構 (Documentation Structure)

```
docs/
├── BLUEPRINT_CONTAINER_DESIGN.md    ← 藍圖邏輯容器設計（本次建立）
├── System-SIDEBAR_FEATURES_DESIGN.md       ← 側邊欄功能設計（本次建立）
├── Account-SAAS_IMPLEMENTATION.md           ← 現有 SaaS 實作文件
├── System-CONTEXT_SWITCHER_UI.md           ← 現有上下文切換器文件
└── README.md                         ← 文件索引

src/assets/tmp/
└── app-data.json                     ← 選單資料（本次更新）
```

## 下一步行動 (Next Steps)

### 立即可執行 (Immediate)
1. Review 設計文件並取得團隊共識
2. 確認資料庫 Schema 是否符合需求
3. 開始實作 Phase 2（服務層）

### 短期目標 (Short-term)
1. 實作 BlueprintService 與基礎 CRUD
2. 整合到現有 WorkspaceContextService

### 中期目標 (Medium-term)
1. 完成所有上下文的儀錶盤頁面
2. 實作藍圖管理 UI
3. 整合測試與 E2E 測試

## 參考資源 (References)

### 文件
- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [ng-zorro-antd Menu Component](https://ng.ant.design/components/menu/)
- [ng-alain Menu Service](https://ng-alain.com/theme/menu/)
- [Firebase Row Level Security](https://firebase.com/docs/guides/auth/row-level-security)

### 專案內部文件
- `docs/Account-SAAS_IMPLEMENTATION.md` - SaaS 多租戶實作
- `docs/System-CONTEXT_SWITCHER_UI.md` - 上下文切換器 UI
- `src/app/core/types/account.types.ts` - 帳戶類型定義
- `src/app/shared/services/workspace-context.service.ts` - 工作區上下文服務

## 總結 (Conclusion)

本次設計成功完成了以下目標：

1. ✅ **清晰的藍圖概念**: Blueprint 作為邏輯容器，整合多個業務模組
2. ✅ **最小化功能集**: 每個上下文只包含最基礎的必要功能
3. ✅ **明確的權限規則**: User 和 Organization 可建立，Team 和 Bot 只能訪問
4. ✅ **完整的設計文件**: 兩份詳細的設計文件涵蓋所有細節
5. ✅ **可執行的實作計畫**: 5 個階段的開發檢查清單

設計遵循 Angular 20 最佳實踐，使用 Signals 進行狀態管理，並與現有的 SaaS 多租戶架構無縫整合。

---

**文件版本**: v1.0  
**最後更新**: 2025-12-09  
**維護者**: GitHub Copilot Agent
