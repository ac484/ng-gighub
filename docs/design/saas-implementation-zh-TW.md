# SaaS 多租戶實作指南 (SaaS Multi-Tenancy Implementation)

## 概述 (Overview)

本實作為 GigHub 專案添加基於 Firebase 的 SaaS 多租戶支援，允許用戶在不同的工作區上下文之間切換：用戶 (User)、組織 (Organization)、團隊 (Team) 和機器人 (Bot)。

---

## 核心元件 (Key Components)

### 1. 核心類型 (`src/app/core/types/account.types.ts`)

定義所有 SaaS 相關的類型定義：

```typescript
// 上下文類型枚舉
export enum ContextType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  TEAM = 'TEAM',
  BOT = 'BOT'
}

// 核心實體介面
export interface Account {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

// 角色枚舉
export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export enum TeamRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER'
}

// 上下文狀態介面
export interface ContextState {
  type: ContextType;
  accountId: string;
  label: string;
  icon: string;
}
```

### 2. 工作區上下文服務 (`src/app/shared/services/workspace-context.service.ts`)

集中管理工作區上下文的服務：

**主要功能**：
- **反應式狀態管理**: 使用 Angular Signals 實現細粒度反應性
- **Firebase 整合**: 與 FirebaseAuthService 整合以同步身份驗證狀態
- **模擬資料**: 提供示範組織和團隊用於展示
- **LocalStorage 持久化**: 跨會話保存和恢復上下文
- **上下文切換方法**：
  - `switchToUser(userId)` - 切換到用戶上下文
  - `switchToOrganization(organizationId)` - 切換到組織上下文
  - `switchToTeam(teamId)` - 切換到團隊上下文
  - `switchToBot(botId)` - 切換到機器人上下文

**當前模擬資料結構**：
```
用戶帳戶 (來自 Firebase Auth)
  ├─ 組織: 示範組織 A
  │  ├─ 團隊: 開發團隊
  │  └─ 團隊: 設計團隊
  ├─ 組織: 示範組織 B
  │  └─ 團隊: 營運團隊
  └─ 機器人: 自動化機器人
```

### 3. 標頭上下文切換器元件 (`src/app/layout/basic/widgets/context-switcher.component.ts`)

用於上下文切換的 UI 元件：

**特性**：
- **階層顯示**: 顯示用戶帳戶、組織（含巢狀團隊）和機器人
- **視覺回饋**: 高亮顯示當前選中的上下文
- **最小模板**: 僅渲染選單項目，便於嵌入父容器
- **圖標**: 使用 ng-zorro-antd 圖標進行視覺表示

### 4. 佈局整合 (`src/app/layout/basic/basic.component.ts`)

上下文切換器整合到側邊欄的用戶選單下拉清單中：

```
用戶頭像選單
  ├─ [切換工作區 區段]
  │  ├─ 個人帳戶 (User)
  │  ├─ 示範組織 A (含子選單)
  │  │  ├─ 示範組織 A
  │  │  ├─ 開發團隊
  │  │  └─ 設計團隊
  │  ├─ 示範組織 B (含子選單)
  │  │  ├─ 示範組織 B
  │  │  └─ 營運團隊
  │  └─ 自動化機器人 (Bot)
  ├─ [分隔線]
  ├─ 個人中心
  └─ 個人設置
```

---

## 架構模式 (Architecture Patterns)

### 1. 基於 Signal 的反應性

實作全程使用 Angular Signals 以獲得最佳效能：

```typescript
// 所有狀態存儲在 signals 中
private currentContextState = signal<ContextState>(initialState);

// 衍生資料使用 computed signals
contextLabel = computed(() => this.currentContextState().label);
contextIcon = computed(() => this.currentContextState().icon);

// UI 在上下文變更時自動更新
```

**優勢**：
- ✅ 更好的效能（細粒度反應性）
- ✅ 更簡單的心智模型
- ✅ Angular 20 原生功能
- ✅ 無需外部依賴

### 2. 服務注入

```typescript
// 使用 Angular 的 inject() 函式進行依賴注入
private firebaseAuth = inject(FirebaseAuthService);

// 服務在 root 層級提供
@Injectable({ providedIn: 'root' })
export class WorkspaceContextService { }
```

### 3. 類型安全

```typescript
// 所有類型都明確定義
type: ContextType;

// TypeScript 枚舉用於上下文類型和角色
enum ContextType { USER, ORGANIZATION, TEAM, BOT }

// 所有實體形狀的介面
interface Organization { id: string; name: string; }
```

### 4. 持久化層

```typescript
// 上下文狀態持久化到 localStorage
private readonly STORAGE_KEY = 'workspace_context';

// 頁面重新載入時自動恢復
private loadSavedContext(): void {
  const saved = localStorage.getItem(this.STORAGE_KEY);
  if (saved) {
    this.currentContextState.set(JSON.parse(saved));
  }
}

// 如果沒有保存的狀態，則回退到用戶上下文
```

---

## 實作方法：最少程式碼 (Minimal Code)

遵循「最少代碼」要求，本實作：

1. **重用現有模式**: 從示範模式改編但簡化
2. **模擬資料而非 API 呼叫**: 使用記憶體中的模擬資料展示功能
3. **無需資料庫遷移**: 無需後端變更即可工作
4. **Firebase 兼容**: 與現有 FirebaseAuthService 整合
5. **獨立元件**: 使用 Angular 20 的獨立元件模式

---

## 使用場景 (Usage Scenarios)

### 場景 1: 個人用戶工作

```typescript
// 用戶登入後預設為個人上下文
workspaceContext.switchToUser(userId);

// 查看個人藍圖
const myBlueprints = await blueprintService.getByOwner(userId);
```

### 場景 2: 組織管理

```typescript
// 切換到組織上下文
workspaceContext.switchToOrganization(orgId);

// 查看組織的所有資源
const orgBlueprints = await blueprintService.getByOrganization(orgId);
const orgMembers = await memberService.getByOrganization(orgId);
```

### 場景 3: 團隊協作

```typescript
// 切換到團隊上下文
workspaceContext.switchToTeam(teamId);

// 團隊成員共享訪問
const teamProjects = await projectService.getByTeam(teamId);
const teamTasks = await taskService.getByTeam(teamId);
```

### 場景 4: 自動化機器人

```typescript
// 切換到機器人上下文
workspaceContext.switchToBot(botId);

// 機器人可以訪問授權的資源
const authorizedData = await dataService.getAuthorized(botId);
```

---

## 視覺參考 (Visual Reference)

### 上下文切換器 UI

```
┌─────────────────────────────────────────┐
│  用戶頭像 & 資訊 (點擊開啟)              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 🔄 切換工作區                           │ ← 標題（不可點擊）
├─────────────────────────────────────────┤
│ 👤 個人帳戶                             │ ← 用戶上下文（預設選中）
│ 👥 示範組織 A ▶                        │ ← 組織（可展開）
│    👥 示範組織 A                        │   ← 組織本身
│    👥 開發團隊                          │   ← 團隊 1
│    👥 設計團隊                          │   ← 團隊 2
│ 👥 示範組織 B ▶                        │ ← 組織（可展開）
│    👥 示範組織 B                        │   ← 組織本身
│    👥 營運團隊                          │   ← 團隊 3
│ 🤖 自動化機器人                        │ ← 機器人上下文
├─────────────────────────────────────────┤
│ 👤 個人中心                             │ ← 帳戶中心
│ ⚙️  個人設置                            │ ← 帳戶設置
└─────────────────────────────────────────┘
```

### 圖標參考

| 上下文類型 | 圖標 | 描述 |
|-----------|------|------|
| User | `user` | 個人帳戶 |
| Organization | `team` | 組織上下文 |
| Team | `usergroup-add` | 組織內的團隊 |
| Bot | `robot` | 自動化機器人帳戶 |

### 互動行為

1. **點擊用戶頭像** → 打開下拉選單
2. **點擊個人帳戶** → 切換到用戶上下文
3. **懸停在組織上** → 顯示展開箭頭
4. **點擊組織名稱** → 展開顯示團隊並切換到組織上下文
5. **點擊團隊名稱** → 切換到團隊上下文
6. **點擊機器人名稱** → 切換到機器人上下文
7. **選中的上下文** → 使用 `ant-menu-item-selected` 類別高亮顯示

---

## 未來增強功能 (Future Enhancements)

### 1. 連接真實後端

要連接真實後端，您需要：

#### 替換模擬資料載入

```typescript
// 在 WorkspaceContextService 中，替換 loadMockData() 為：
async loadRealData(userId: string): Promise<void> {
  // 從 Firestore 載入資料
  const orgs = await this.firestoreService.getUserOrganizations(userId);
  const teams = await this.firestoreService.getUserTeams(userId);
  const bots = await this.firestoreService.getUserBots(userId);
  
  // 更新狀態
  this.organizationsState.set(orgs);
  this.teamsState.set(teams);
  this.botsState.set(bots);
}
```

#### 添加 Firestore 集合

建議的集合結構：

```typescript
// organizations 集合
interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  members: Array<{
    userId: string;
    role: OrganizationRole;
    joinedAt: Timestamp;
  }>;
}

// teams 集合
interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Timestamp;
  members: Array<{
    userId: string;
    role: TeamRole;
    joinedAt: Timestamp;
  }>;
}

// bots 集合
interface Bot {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  permissions: string[];
  createdAt: Timestamp;
}
```

#### 實作 RLS（行級安全性）

使用 Firebase Security Rules 強制執行訪問控制：

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Organizations
    match /organizations/{orgId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == 'OWNER';
    }
    
    // Teams
    match /teams/{teamId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/teams/$(teamId)/members/$(request.auth.uid));
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/teams/$(teamId)/members/$(request.auth.uid)).data.role == 'LEAD';
    }
  }
}
```

### 2. 添加上下文感知資料過濾

```typescript
// 使用 contextAccountId 過濾資料
export class BlueprintService {
  private workspaceContext = inject(WorkspaceContextService);
  
  async getBlueprints(): Promise<Blueprint[]> {
    const contextId = this.workspaceContext.contextId();
    const contextType = this.workspaceContext.contextType();
    
    switch (contextType) {
      case ContextType.USER:
        return this.getByOwner(contextId);
      case ContextType.ORGANIZATION:
        return this.getByOrganization(contextId);
      case ContextType.TEAM:
        return this.getByTeam(contextId);
      default:
        return [];
    }
  }
}
```

### 3. 權限檢查

```typescript
// 實作權限檢查服務
export class PermissionService {
  private workspaceContext = inject(WorkspaceContextService);
  
  canEdit(resource: any): boolean {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    
    switch (contextType) {
      case ContextType.USER:
        return resource.ownerId === contextId;
      case ContextType.ORGANIZATION:
        return resource.organizationId === contextId;
      case ContextType.TEAM:
        return resource.teamId === contextId;
      default:
        return false;
    }
  }
}
```

---

## 測試指南 (Testing Guide)

### 測試步驟

1. **登入**: 使用 Firebase 身份驗證登入
2. **打開用戶選單**: 點擊側邊欄中的用戶頭像
3. **查看上下文切換器**: 查看「切換工作區」區段
4. **切換上下文**: 點擊不同的組織、團隊或機器人
5. **驗證持久化**: 重新載入頁面並驗證上下文已恢復

### 測試檢查清單

- [ ] 成功登入後顯示用戶上下文
- [ ] 點擊組織展開團隊清單
- [ ] 切換到組織上下文正常工作
- [ ] 切換到團隊上下文正常工作
- [ ] 切換到機器人上下文正常工作
- [ ] 頁面重新載入後上下文持久化
- [ ] 視覺回饋（選中狀態）正確顯示
- [ ] 圖標正確顯示
- [ ] 鍵盤導航正常工作

---

## 技術決策 (Technical Decisions)

### 為什麼使用 Signals 而非 RxJS？

**優勢**：
- ✅ 更好的效能（細粒度反應性）
- ✅ 更簡單的心智模型用於狀態管理
- ✅ Angular 20 原生功能，無需外部依賴
- ✅ 更少的樣板程式碼
- ✅ 更容易除錯

**範例比較**：

```typescript
// 使用 RxJS
private context$ = new BehaviorSubject<ContextState>(initialState);
contextLabel$ = this.context$.pipe(map(c => c.label));

// 使用 Signals（更簡潔）
private context = signal<ContextState>(initialState);
contextLabel = computed(() => this.context().label);
```

### 為什麼使用模擬資料？

**原因**：
- ✅ 快速原型製作
- ✅ 無需後端設置
- ✅ 易於測試和演示
- ✅ 稍後可輕鬆替換為真實 API

---

## 效能考量 (Performance Considerations)

### 優化策略

1. **Signals 的細粒度更新** - 僅更新受影響的 UI 部分
2. **LocalStorage 快取** - 減少不必要的資料載入
3. **OnPush 變更檢測** - 與 signals 結合使用
4. **延遲載入** - 僅在需要時載入組織/團隊資料

### 記憶體管理

```typescript
// 使用 computed signals 進行自動記憶體管理
contextLabel = computed(() => {
  const state = this.currentContextState();
  return state.label;
});

// 不需要手動取消訂閱
```

---

## 故障排除 (Troubleshooting)

### 問題: 上下文未持久化

**解決方案**:
1. 檢查瀏覽器是否啟用 localStorage
2. 驗證 STORAGE_KEY 正確
3. 確認沒有 localStorage 配額問題

### 問題: 圖標未顯示

**解決方案**:
1. 確認圖標已在 `style-icons.ts` 中註冊
2. 執行 `yarn icon` 更新圖標清單
3. 檢查圖標名稱拼寫

### 問題: 上下文切換不工作

**解決方案**:
1. 檢查 WorkspaceContextService 是否正確注入
2. 驗證 signals 是否正確更新
3. 檢查瀏覽器控制台錯誤

---

## 相關文檔 (Related Documentation)

- [上下文切換器 UI 參考](./context-switcher-zh-TW.md)
- [藍圖概念說明](./blueprint-concept-zh-TW.md)
- [藍圖容器設計](./blueprint-container-zh-TW.md)
- [側邊欄功能設計](./sidebar-features-zh-TW.md)
- [設計摘要](./design-summary-zh-TW.md)

---

## 版本資訊 (Version Information)

- **Angular**: 20.3.0
- **ng-zorro-antd**: 20.3.1
- **ng-alain**: 20.1.0
- **Firebase**: 10.x

---

**維護者**: GitHub Copilot  
**專案**: GigHub - 工地施工進度追蹤管理系統  
**文件版本**: 1.0.0  
**最後更新**: 2025-01-09
