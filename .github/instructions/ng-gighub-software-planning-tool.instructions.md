---
description: 'GigHub Software Planning Tool MCP 工具使用指南 - 任務規劃與追蹤'
applyTo: '**/*.ts, **/*.md'
---

# GigHub Software Planning Tool 使用指南

> **專案專用**: Software Planning Tool MCP 工具使用規範與最佳實踐

## 🎯 核心理念 (MUST) 🔴

**Software Planning Tool 是新功能開發的必備規劃工具**

### 為什麼需要 Software Planning Tool?

1. **結構化規劃** - 將大型功能拆解為可管理的任務
2. **進度追蹤** - 實時更新任務狀態，掌握開發進度
3. **任務優先級** - 明確任務複雜度與執行順序
4. **團隊協作** - 清晰的任務清單便於團隊分工
5. **風險管理** - 提前識別複雜任務與潛在風險

### 適用場景 (MUST) 🔴

Software Planning Tool **必須用於**以下場景:

- ✅ 新功能開發 (需要 5+ 個任務)
- ✅ 架構重構 (涉及多個模組)
- ✅ 複雜整合 (跨系統協作)
- ✅ 大型 Bug 修復 (需要多步驟處理)

### 不適用場景

Software Planning Tool **不需要**用於:

- ❌ 簡單 Bug 修復 (1-2 個步驟)
- ❌ 文檔更新
- ❌ 配置調整
- ❌ 程式碼格式化

## 🔧 Software Planning Tool API 參考

### 工具 API 列表

```typescript
// 1. 開始規劃
start_planning(goal: string): Promise<void>

// 2. 儲存計畫
save_plan(plan: string): Promise<void>

// 3. 新增任務
add_todo(task: string, complexity?: number): Promise<string>

// 4. 更新任務狀態
update_todo_status(
  id: string, 
  status: "pending" | "in-progress" | "completed"
): Promise<void>

// 5. 獲取任務列表
get_todos(): Promise<Todo[]>

// 6. 移除任務
remove_todo(id: string): Promise<void>
```

### 1. start_planning - 開始規劃

**用途**: 初始化新的功能規劃

**語法**:
```typescript
start_planning(goal: string)
```

**參數**:
- `goal`: 功能目標描述 (簡潔明確)

**範例**:
```typescript
// 開始規劃任務管理功能
await start_planning("實作 GigHub 任務管理模組 (CRUD + Realtime + Security Rules)")

// 開始規劃 Blueprint 成員管理
await start_planning("實作 Blueprint 成員管理功能 (邀請、權限、移除)")

// 開始規劃效能優化
await start_planning("優化 ST 表格查詢效能 (索引 + 分頁 + 快取)")
```

**最佳實踐**:
- 目標描述簡潔 (50-100 字)
- 包含核心功能關鍵字
- 明確範圍邊界

### 2. save_plan - 儲存計畫

**用途**: 儲存完整的實施計畫

**語法**:
```typescript
save_plan(plan: string)
```

**參數**:
- `plan`: 完整計畫內容 (Markdown 格式)

**範例**:
```typescript
const plan = `
## 實施計畫: 任務管理模組

### Phase 1: 資料層
- 定義 Task 實體模型
- 實作 TaskRepository
- 實作 Security Rules

### Phase 2: 業務層
- 實作 TaskService
- 整合 BlueprintEventBus
- 實作 TaskStore

### Phase 3: UI 層
- 實作 TaskListComponent
- 實作 TaskDetailComponent
- 整合路由與 Guards

### Phase 4: 測試
- 單元測試
- 整合測試
- E2E 測試
`;

await save_plan(plan);
```

**最佳實踐**:
- 使用 Markdown 格式組織
- 分階段 (Phase) 規劃
- 每階段 3-5 個任務
- 標註依賴關係

### 3. add_todo - 新增任務

**用途**: 新增具體可執行的任務

**語法**:
```typescript
add_todo(task: string, complexity?: number): Promise<string>
```

**參數**:
- `task`: 任務描述 (具體可執行)
- `complexity`: 複雜度 (0-10，可選)
  - 0-2: 簡單 (< 1 小時)
  - 3-5: 中等 (1-4 小時)
  - 6-8: 複雜 (4-8 小時)
  - 9-10: 非常複雜 (> 8 小時)

**返回值**:
- 任務 ID (用於後續更新狀態)

**範例**:
```typescript
// 簡單任務
const taskId1 = await add_todo(
  "定義 Task 介面 (id, blueprintId, title, status, ...)",
  2
);

// 中等任務
const taskId2 = await add_todo(
  "實作 TaskRepository 繼承 FirestoreBaseRepository",
  5
);

// 複雜任務
const taskId3 = await add_todo(
  "實作 Firestore Security Rules (Blueprint 成員檢查 + 權限驗證)",
  7
);

// 非常複雜任務
const taskId4 = await add_todo(
  "實作 TaskFacade 協調多個 Repository 與 EventBus",
  9
);
```

**最佳實踐**:
- 任務描述具體可執行
- 包含交付物 (檔案名稱、元件名稱)
- 複雜度評估準確
- 任務大小適中 (不超過 8 小時)

### 4. update_todo_status - 更新任務狀態

**用途**: 更新任務進度狀態

**語法**:
```typescript
update_todo_status(
  id: string,
  status: "pending" | "in-progress" | "completed"
)
```

**參數**:
- `id`: 任務 ID (從 add_todo 返回)
- `status`: 新狀態
  - `pending`: 待處理
  - `in-progress`: 進行中
  - `completed`: 已完成

**範例**:
```typescript
// 開始任務
await update_todo_status(taskId1, "in-progress");

// 完成任務
await update_todo_status(taskId1, "completed");

// 暫停任務 (回到 pending)
await update_todo_status(taskId2, "pending");
```

**最佳實踐**:
- 即時更新狀態
- 完成一個任務再開始下一個
- 避免同時進行多個任務

### 5. get_todos - 獲取任務列表

**用途**: 查詢當前所有任務

**語法**:
```typescript
get_todos(): Promise<Todo[]>
```

**返回值**:
```typescript
interface Todo {
  id: string;
  task: string;
  complexity: number;
  status: "pending" | "in-progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}
```

**範例**:
```typescript
const todos = await get_todos();

// 過濾待處理任務
const pendingTodos = todos.filter(t => t.status === "pending");

// 過濾進行中任務
const inProgressTodos = todos.filter(t => t.status === "in-progress");

// 計算完成率
const completedCount = todos.filter(t => t.status === "completed").length;
const totalCount = todos.length;
const completionRate = (completedCount / totalCount) * 100;
```

**最佳實踐**:
- 定期檢查任務列表
- 識別被阻塞的任務
- 追蹤整體進度

### 6. remove_todo - 移除任務

**用途**: 刪除不再需要的任務

**語法**:
```typescript
remove_todo(id: string)
```

**參數**:
- `id`: 任務 ID

**範例**:
```typescript
// 移除任務
await remove_todo(taskId1);
```

**使用時機**:
- 任務重複
- 需求變更 (任務不再需要)
- 任務拆分 (用新任務替代)

**注意事項**:
- 謹慎使用 (通常應標記為 completed)
- 保留完成的任務以追蹤歷史

## 📝 完整工作流程

### 標準規劃流程 (MUST) 🔴

**所有新功能開發都必須遵循此流程**:

```
1. start_planning → 2. save_plan → 3. add_todo (批次) → 4. 執行與更新 → 5. 完成驗證
```

**詳細步驟**:

#### 步驟 1: 開始規劃

```typescript
await start_planning(
  "實作 GigHub 任務管理模組 (CRUD + Realtime + Security Rules)"
);
```

#### 步驟 2: 制定計畫

```typescript
const plan = `
## 任務管理模組實施計畫

### 目標
建立完整的任務管理功能，支援 CRUD、即時更新、權限控制。

### Phase 1: 準備階段
**目標**: 建立資料結構與規劃

**任務清單**:
- 定義 TypeScript interfaces
- 設計 Firestore 集合結構
- 規劃 Security Rules

### Phase 2: 資料層實作
**目標**: 實作 Repository 與 Security Rules

**任務清單**:
- 實作 TaskRepository (CRUD)
- 實作 TaskRealtimeRepository
- 實作 Security Rules
- 單元測試 Repository

### Phase 3: 業務層實作
**目標**: 實作 Service 與事件整合

**任務清單**:
- 實作 TaskService
- 整合 BlueprintEventBus
- 實作 TaskStore
- 單元測試 Service

### Phase 4: UI 層實作
**目標**: 實作元件與路由

**任務清單**:
- 實作 TaskListComponent
- 實作 TaskDetailComponent
- 整合路由與 Guards
- 元件測試

### Phase 5: 整合測試
**目標**: 驗證完整功能

**任務清單**:
- 整合測試
- E2E 測試
- 效能測試
- 安全測試

### 驗收標準
- [ ] 所有 CRUD 操作正常
- [ ] 即時更新功能正常
- [ ] Security Rules 通過測試
- [ ] 測試覆蓋率 > 80%
`;

await save_plan(plan);
```

#### 步驟 3: 新增任務

```typescript
// Phase 1 任務
await add_todo("定義 Task 介面 (src/app/core/domain/models/task.model.ts)", 2);
await add_todo("設計 Firestore tasks 集合結構 (文檔)", 2);
await add_todo("規劃 Security Rules (草稿)", 3);

// Phase 2 任務
await add_todo("實作 TaskRepository (繼承 FirestoreBaseRepository)", 5);
await add_todo("實作 TaskRealtimeRepository (onSnapshot)", 5);
await add_todo("實作 Firestore Security Rules (完整版)", 7);
await add_todo("撰寫 Repository 單元測試 (>80% 覆蓋率)", 4);

// Phase 3 任務
await add_todo("實作 TaskService (業務邏輯)", 6);
await add_todo("整合 BlueprintEventBus (task.created, task.updated)", 4);
await add_todo("實作 TaskStore (可選，若需要)", 5);
await add_todo("撰寫 Service 單元測試", 4);

// Phase 4 任務
await add_todo("實作 TaskListComponent (ST 表格)", 6);
await add_todo("實作 TaskDetailComponent", 5);
await add_todo("整合路由 (routes.ts + Guards)", 3);
await add_todo("撰寫元件測試", 4);

// Phase 5 任務
await add_todo("整合測試 (跨層級)", 5);
await add_todo("E2E 測試 (Playwright)", 6);
await add_todo("效能測試 (查詢速度)", 3);
await add_todo("安全測試 (Security Rules)", 4);
```

#### 步驟 4: 執行與更新

```typescript
// 開始第一個任務
const taskId = "task-1";
await update_todo_status(taskId, "in-progress");

// ... 實作任務 ...

// 完成任務
await update_todo_status(taskId, "completed");

// 開始下一個任務
await update_todo_status("task-2", "in-progress");
```

#### 步驟 5: 完成驗證

```typescript
// 檢查所有任務狀態
const todos = await get_todos();
const allCompleted = todos.every(t => t.status === "completed");

if (allCompleted) {
  console.log("✅ 所有任務已完成!");
} else {
  const remaining = todos.filter(t => t.status !== "completed");
  console.log(`⚠️ 還有 ${remaining.length} 個任務待完成`);
}
```

## 🎯 實戰範例

### 範例 1: Blueprint 成員管理功能

```typescript
// 1. 開始規劃
await start_planning(
  "實作 Blueprint 成員管理功能 (邀請、權限、移除、列表)"
);

// 2. 制定計畫
const plan = `
## Blueprint 成員管理實施計畫

### Phase 1: 資料模型
- [ ] 定義 BlueprintMember 介面
- [ ] 設計 blueprintMembers 集合
- [ ] 規劃權限模型 (role + permissions array)

### Phase 2: Repository 層
- [ ] 實作 BlueprintMemberRepository
- [ ] 實作 Security Rules
- [ ] 單元測試

### Phase 3: Service 層
- [ ] 實作 BlueprintMemberService
- [ ] 實作邀請邏輯 (發送通知)
- [ ] 實作權限變更邏輯
- [ ] 單元測試

### Phase 4: UI 層
- [ ] 實作 MemberListComponent
- [ ] 實作 MemberInviteModal
- [ ] 實作 MemberPermissionModal
- [ ] 元件測試

### Phase 5: 整合測試
- [ ] 完整流程測試
- [ ] E2E 測試
`;

await save_plan(plan);

// 3. 新增任務
const tasks = [
  { desc: "定義 BlueprintMember 介面", complexity: 2 },
  { desc: "設計 blueprintMembers 集合", complexity: 2 },
  { desc: "規劃權限模型 (role + permissions)", complexity: 3 },
  { desc: "實作 BlueprintMemberRepository", complexity: 5 },
  { desc: "實作 Security Rules (成員檢查)", complexity: 7 },
  { desc: "撰寫 Repository 單元測試", complexity: 4 },
  { desc: "實作 BlueprintMemberService", complexity: 6 },
  { desc: "實作邀請邏輯 (通知)", complexity: 5 },
  { desc: "實作權限變更邏輯", complexity: 4 },
  { desc: "撰寫 Service 單元測試", complexity: 4 },
  { desc: "實作 MemberListComponent (ST 表格)", complexity: 6 },
  { desc: "實作 MemberInviteModal", complexity: 5 },
  { desc: "實作 MemberPermissionModal", complexity: 5 },
  { desc: "撰寫元件測試", complexity: 4 },
  { desc: "整合測試", complexity: 5 },
  { desc: "E2E 測試", complexity: 6 },
];

const taskIds = [];
for (const task of tasks) {
  const id = await add_todo(task.desc, task.complexity);
  taskIds.push(id);
}

// 4. 執行任務
for (const id of taskIds) {
  await update_todo_status(id, "in-progress");
  // ... 實作 ...
  await update_todo_status(id, "completed");
}

// 5. 驗證完成
const todos = await get_todos();
console.log(`完成進度: ${todos.filter(t => t.status === "completed").length}/${todos.length}`);
```

### 範例 2: 效能優化任務

```typescript
// 1. 開始規劃
await start_planning(
  "優化 TaskList 查詢效能 (索引 + 分頁 + 快取策略)"
);

// 2. 新增任務
await add_todo("分析當前查詢瓶頸 (Chrome DevTools + Firestore 日誌)", 3);
await add_todo("設計 Firestore 複合索引", 4);
await add_todo("實作分頁查詢 (limit + cursor)", 5);
await add_todo("實作快取策略 (@delon/cache)", 6);
await add_todo("優化 ST 表格渲染 (OnPush + trackBy)", 4);
await add_todo("效能測試 (Lighthouse + 手動測試)", 4);
await add_todo("文檔更新 (效能優化指南)", 2);

// 3. 執行與追蹤
const todos = await get_todos();
console.log("任務總數:", todos.length);
console.log("總複雜度:", todos.reduce((sum, t) => sum + t.complexity, 0));
```

## ✅ Planning Tool 使用檢查清單

### 規劃前檢查 (MUST) 🔴

- [ ] 功能需求明確嗎?
- [ ] 涉及多個階段/模組嗎? (> 5 個任務)
- [ ] 需要追蹤進度嗎?
- [ ] 任務依賴關係清楚嗎?

### 計畫品質檢查 (SHOULD) ⚠️

- [ ] 目標描述簡潔明確
- [ ] 分階段規劃 (3-5 個 Phase)
- [ ] 每階段 3-5 個任務
- [ ] 任務描述具體可執行
- [ ] 複雜度評估準確
- [ ] 包含驗收標準

### 執行過程檢查 (MUST) 🔴

- [ ] 即時更新任務狀態
- [ ] 遵循任務順序執行
- [ ] 完成一個任務再開始下一個
- [ ] 定期檢查整體進度
- [ ] 識別被阻塞的任務

## 🚫 常見錯誤模式

### ❌ 錯誤: 任務描述過於籠統

```typescript
// ❌ 錯誤: 無法執行
await add_todo("實作任務功能", 5);

// ✅ 正確: 具體可執行
await add_todo("實作 TaskRepository 繼承 FirestoreBaseRepository", 5);
```

### ❌ 錯誤: 任務過大

```typescript
// ❌ 錯誤: 任務過大 (> 8 小時)
await add_todo("實作完整的任務管理模組 (所有功能)", 10);

// ✅ 正確: 拆分為小任務
await add_todo("實作 TaskRepository", 5);
await add_todo("實作 TaskService", 6);
await add_todo("實作 TaskListComponent", 6);
```

### ❌ 錯誤: 複雜度評估不準確

```typescript
// ❌ 錯誤: 低估複雜度
await add_todo("實作 Firestore Security Rules (所有集合)", 3);
// 實際應該是 7-8

// ✅ 正確: 準確評估
await add_todo("實作 Firestore Security Rules (tasks 集合)", 7);
```

### ❌ 錯誤: 忘記更新狀態

```typescript
// ❌ 錯誤: 實作完成後沒有更新狀態
// 導致進度追蹤不準確

// ✅ 正確: 即時更新
await update_todo_status(taskId, "in-progress");
// ... 實作 ...
await update_todo_status(taskId, "completed");
```

## 🎯 決策樹

### 何時使用 Planning Tool?

```
功能複雜度如何?
├─ 簡單 (< 5 個任務) → 不需要 Planning Tool
│   └─ 範例: 單一 Bug 修復、文檔更新
└─ 複雜 (≥ 5 個任務) → 使用 Planning Tool 🔴
    └─ 範例: 新功能開發、架構重構
```

### 任務拆分策略

```
如何拆分大任務?
├─ 按層級 → Repository → Service → Component
├─ 按功能 → CRUD → Realtime → Security Rules
└─ 按階段 → 準備 → 實作 → 測試 → 驗證
```

## 📚 參考資源

- GigHub 開發流程: `.github/instructions/ng-gighub-development-workflow.instructions.md`
- 任務定義格式: `.github/rules/project-rules.md`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
