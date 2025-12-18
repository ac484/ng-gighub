# 強制工作流程規範

> **⚠️ CRITICAL**: GitHub Copilot **MUST** follow this workflow for **EVERY** task. No exceptions.

## 🔴 MANDATORY: Pre-Task Checklist

**BEFORE starting ANY task, Copilot MUST:**

### 1. 工具使用驗證 (MANDATORY) 🔴

- [ ] **Context7 查詢** - 對於任何涉及外部庫/框架的問題
  - Angular, ng-alain, ng-zorro-antd, Firebase, RxJS, TypeScript
  - 查詢最新文檔，驗證 API 簽名
  - 檢查版本兼容性
  - **禁止**: 憑記憶或假設 API

- [ ] **Sequential Thinking 分析** - 對於複雜問題
  - 多步驟邏輯推理
  - 架構設計決策
  - 技術方案權衡
  - 問題拆解與分析

- [ ] **Software Planning Tool** - 對於新功能開發
  - 任務分解 (5-10 個具體步驟)
  - 複雜度評估 (0-10 分)
  - 實施計畫制定
  - 進度追蹤

### 2. 架構驗證 (MANDATORY) 🔴

- [ ] **三層架構嚴格分離**
  - UI 層 (`routes/`) - 僅負責展示與使用者互動
  - Service 層 (`core/services/`) - 業務邏輯協調
  - Repository 層 (`core/data-access/`) - 資料存取抽象
  - **禁止**: UI 直接呼叫 Repository

- [ ] **Repository 模式強制**
  - **禁止**: 直接操作 Firestore
  - **必須**: 使用 Repository 模式
  - **必須**: 實作 Firestore Security Rules
  - Repository 放置遵循決策樹 (shared/ vs 模組專屬)

### 3. 生命週期管理標準化 (MANDATORY) 🔴

- [ ] **Construction** - 僅注入依賴
  - 使用 `inject()` 注入依賴
  - **禁止**: 在 constructor 執行業務邏輯

- [ ] **Initialization** - 在 `ngOnInit` 執行業務邏輯
  - 載入初始資料
  - 訂閱必要的 Observable
  - 設定初始狀態

- [ ] **Active** - 使用 Signals 處理響應式
  - 使用 `signal()` 管理狀態
  - 使用 `computed()` 衍生狀態
  - 使用 `effect()` 處理副作用

- [ ] **Cleanup** - 在 `ngOnDestroy` 清理
  - **禁止**: 在 ngOnDestroy 執行非同步操作
  - 清理手動資源 (WebSocket, EventSource)
  - Subscription 自動清理使用 `takeUntilDestroyed()`

### 4. 上下文傳遞原則 (MANDATORY) 🔴

- [ ] **統一上下文模式**
  - User Context → Organization Context → Blueprint Context → Module Context
  - 使用 `inject()` 注入上層上下文服務
  - 使用 `signal()` 保存當前上下文狀態
  - 上下文變更自動傳播到子元件

### 5. 事件驅動架構 (MANDATORY) 🔴

- [ ] **BlueprintEventBus 集中管理**
  - 所有模組事件透過 BlueprintEventBus
  - 事件命名: `[module].[action]` (例如: `task.created`)
  - 事件結構: type, blueprintId, timestamp, actor, data
  - 訂閱使用 `takeUntilDestroyed()` 清理

## 🔴 MANDATORY: Development Workflow

### Phase 1: 理解需求 (MUST)

1. **仔細閱讀用戶需求**
   - 識別核心功能點
   - 確認範圍和優先級
   - 列出所有相關實體和關係

2. **使用 Context7 查詢**
   - 查詢相關技術文檔
   - 驗證 API 和最佳實踐
   - 檢查版本兼容性

3. **使用 Sequential Thinking 分析**
   - 問題拆解
   - 方案評估
   - 風險識別

### Phase 2: 制定計畫 (MUST)

1. **使用 Software Planning Tool**
   - `start_planning(goal)` - 開始規劃
   - `add_todo(task, complexity)` - 新增任務
   - 複雜度評分 0-10

2. **架構影響分析**
   - 確認符合 `docs/architecture/FINAL_PROJECT_STRUCTURE.md`
   - 確認 Repository 放置位置
   - 確認是否需要新增 Store

3. **依賴關係分析**
   - 識別需要使用的服務/Repository/Store
   - 確認模組間依賴關係
   - 檢查是否需要更新 Security Rules

### Phase 3: 實作 (MUST)

1. **遵循實施順序**
   - Repository → Service → Component
   - 整合 Event Bus
   - 註冊路由與守衛

2. **程式碼標準**
   - 使用 Standalone Components
   - 使用 Signals 管理狀態
   - 使用 `inject()` 依賴注入
   - 使用新控制流 (`@if`, `@for`, `@switch`)

3. **更新狀態**
   - `update_todo_status(id, "in-progress")`
   - 實時追蹤進度

### Phase 4: 驗證 (MUST)

1. **完成檢查清單**
   - 所有 MUST 檢查項目通過
   - 所有 MUST NOT 檢查項目避免
   - 程式碼符合規範

2. **測試驗證**
   - 單元測試 > 80% 覆蓋率
   - 元件測試通過
   - E2E 測試關鍵流程

3. **更新狀態**
   - `update_todo_status(id, "completed")`
   - 標記任務完成

## 🔴 MANDATORY: Quality Gates

### Gate 1: 工具使用驗證

**Copilot MUST confirm:**
- "I have used Context7 to verify all external library APIs"
- "I have used Sequential Thinking for complex analysis"
- "I have used Software Planning Tool for task planning"

### Gate 2: 架構驗證

**Copilot MUST confirm:**
- "I have verified three-layer architecture separation"
- "I have used Repository pattern for all data access"
- "I have implemented Firestore Security Rules"
- "I have followed lifecycle management standards"

### Gate 3: 程式碼品質驗證

**Copilot MUST confirm:**
- "I have used Standalone Components with Signals"
- "I have used inject() for dependency injection"
- "I have used new control flow syntax"
- "I have avoided all MUST NOT patterns"

### Gate 4: 測試驗證

**Copilot MUST confirm:**
- "I have written unit tests with >80% coverage"
- "I have tested all critical business logic"
- "I have validated error handling"

## 🚫 MANDATORY: Forbidden Actions

**Copilot MUST NEVER:**

1. ❌ 跳過工具使用驗證
2. ❌ 憑記憶提供 API 用法
3. ❌ 直接操作 Firestore (必須使用 Repository)
4. ❌ 使用 NgModule (必須使用 Standalone Components)
5. ❌ 使用 any 類型
6. ❌ 在 constructor 執行業務邏輯
7. ❌ 手動管理訂閱 (必須使用 takeUntilDestroyed)
8. ❌ 跨層直接依賴 (UI 不直接呼叫 Repository)

## ✅ MANDATORY: Verification Statement

**Before completing ANY task, Copilot MUST provide this verification:**

```
### 強制規則遵守驗證

#### 工具使用驗證 ✅
- [x] 已使用 Context7 查詢相關技術文檔
- [x] 已使用 Sequential Thinking 分析問題
- [x] 已使用 Software Planning Tool 制定計畫

#### 架構驗證 ✅
- [x] 已遵循三層架構分離原則
- [x] 已使用 Repository 模式存取資料
- [x] 已實作 Firestore Security Rules
- [x] 已遵循生命週期管理標準

#### 程式碼品質驗證 ✅
- [x] 已使用 Standalone Components with Signals
- [x] 已使用 inject() 依賴注入
- [x] 已使用新控制流語法
- [x] 已避免所有禁止模式

#### 測試驗證 ✅
- [x] 已撰寫單元測試 (覆蓋率 > 80%)
- [x] 已測試關鍵業務邏輯
- [x] 已驗證錯誤處理
```

## 📊 Compliance Tracking

**Every response MUST include:**
- Tool usage: `Context7: [Yes/No]`, `Sequential Thinking: [Yes/No]`, `Planning Tool: [Yes/No]`
- Architecture compliance: `Three-layer: [Yes/No]`, `Repository: [Yes/No]`, `Security Rules: [Yes/No]`
- Code quality: `Standalone: [Yes/No]`, `Signals: [Yes/No]`, `New syntax: [Yes/No]`

---

**版本**: v1.0  
**最後更新**: 2025-12-17  
**強制執行**: MANDATORY - No Exceptions
