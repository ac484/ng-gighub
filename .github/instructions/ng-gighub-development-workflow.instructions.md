---
description: 'GigHub 開發工作流程與任務定義標準'
applyTo: '**/*.ts, **/*.md'
---

# GigHub 開發工作流程

> **專案專用**: 開發工作流程與任務管理規範

## 🔴 強制工具使用 (MANDATORY)

**在開始任何任務前，Copilot MUST 使用以下工具:**

### 1. Context7 - 查詢官方文檔 (MUST) 🔴

**使用時機**: 任何涉及外部庫/框架的問題

```typescript
// 查詢步驟
1. resolve-library-id({ libraryName: "angular" })
2. get-library-docs({ 
     context7CompatibleLibraryID: "/angular/angular",
     topic: "signals",
     mode: "code"
   })
3. 驗證 API 簽名和版本兼容性
```

**涵蓋範圍**:
- Angular 20.x (Signals, Standalone Components, Router)
- ng-alain 20.x (@delon/abc, @delon/form, @delon/auth)
- ng-zorro-antd 20.x (Table, Form, Modal, Layout)
- Firebase 20.x (Authentication, Firestore, Storage)
- RxJS 7.8.x (Operators, Observables, Subjects)

**禁止**: ❌ 憑記憶或假設 API 用法

### 2. Sequential Thinking - 循序思考分析 (MUST) 🔴

**使用時機**: 複雜問題需要多步驟邏輯推理

```
適用場景:
- 架構設計決策
- 技術方案權衡
- 多模組整合規劃
- 複雜業務邏輯分析
```

### 3. Software Planning Tool - 制定開發計畫 (MUST) 🔴

**使用時機**: 新功能開發或重構

```typescript
// 工作流程
1. start_planning({ goal: "功能描述" })
2. add_todo({ task: "具體任務", complexity: 5 })  // 複雜度 0-10
3. update_todo_status({ id: "task-id", status: "in-progress" })
4. update_todo_status({ id: "task-id", status: "completed" })
```

## 📋 任務定義格式 (MANDATORY)

### 必填欄位

#### 1. 任務定義

```markdown
### 名稱
簡短描述任務目標

### 背景 / 目的
說明為什麼需要此功能，解決什麼問題

### 需求說明
詳細描述功能需求，包含使用者故事

### In Scope / Out of Scope
- ✅ In Scope: 本次任務包含的功能
- ❌ Out of Scope: 本次任務不包含的功能

### 功能行為
- 使用者可以做什麼
- 系統如何響應
- 邊界情況處理

### 資料 / API
- 資料模型定義 (TypeScript interfaces)
- Firestore 集合結構
- Security Rules 定義
- API 端點 (如有)

### 影響範圍
- 受影響的模組
- 需要修改的元件
- 需要更新的服務
- 需要新增的 Repository

### 驗收條件
- [ ] 功能完整實作
- [ ] 單元測試通過 (>80% 覆蓋率)
- [ ] E2E 測試關鍵流程
- [ ] 程式碼審查通過
- [ ] 文檔已更新
```

#### 2. 分析階段 (MANDATORY)

```markdown
## 技術分析

### 1. Context7 查詢結果
- 查詢的庫/框架
- 獲取的 API 文檔
- 版本兼容性檢查結果

### 2. Sequential Thinking 分析
- 問題拆解
- 方案評估 (至少 2 個方案)
- 風險識別
- 推薦方案與理由

### 3. 架構影響分析
- [ ] 符合 `docs/architecture/FINAL_PROJECT_STRUCTURE.md` 結構
- [ ] Repository 放置位置決定 (shared/ 或模組專屬)
- [ ] 是否需要新增 Store/Facade
- [ ] 是否需要更新 Firestore Security Rules

### 4. 依賴關係分析
- 需要使用的現有服務
- 需要使用的 Repository
- 模組間依賴關係
- 潛在衝突點

### 5. 技術方案評估
**方案 A**: [描述]
- 優點: ...
- 缺點: ...
- 複雜度: [1-10]

**方案 B**: [描述]
- 優點: ...
- 缺點: ...
- 複雜度: [1-10]

**推薦方案**: [A/B] + 理由

### 6. 風險識別
| 風險 | 影響程度 | 緩解措施 |
|------|----------|----------|
| [風險描述] | 高/中/低 | [具體措施] |
```

#### 3. 規劃階段 (MANDATORY)

```markdown
## 實施計畫

### Phase 1: 準備階段
**目標**: 建立資料結構與規劃 Security Rules

**任務清單**:
- [ ] 定義 TypeScript interfaces
- [ ] 設計 Firestore 集合結構
- [ ] 規劃 Security Rules
- [ ] 確認依賴服務

**交付物**:
- `src/app/core/domain/models/{entity}.model.ts`
- `firestore.rules` (更新)

### Phase 2: 資料層實作
**目標**: 實作 Repository 與 Security Rules

**任務清單**:
- [ ] 實作 Repository (CRUD)
- [ ] 實作 Realtime Repository (如需)
- [ ] 實作 Security Rules
- [ ] 單元測試 Repository

**交付物**:
- `src/app/core/data-access/{module}/{entity}.repository.ts`
- `src/app/core/data-access/{module}/{entity}.repository.spec.ts`
- `firestore.rules` (完成)

### Phase 3: 服務層實作
**目標**: 實作 Service/Store 與事件整合

**任務清單**:
- [ ] 實作 Service (業務邏輯)
- [ ] 整合 EventBus
- [ ] 實作 Store (如需)
- [ ] 單元測試 Service

**交付物**:
- `src/app/core/services/{entity}.service.ts`
- `src/app/core/services/{entity}.service.spec.ts`
- `src/app/core/state/{entity}.store.ts` (可選)

### Phase 4: 元件實作
**目標**: 實作 UI 元件

**任務清單**:
- [ ] 實作 List Component
- [ ] 實作 Detail Component
- [ ] 實作 Form Component (如需)
- [ ] 整合 Service
- [ ] 元件測試

**交付物**:
- `src/app/routes/{module}/{entity}-list.component.ts`
- `src/app/routes/{module}/{entity}-detail.component.ts`
- `src/app/routes/{module}/{entity}.component.spec.ts`

### Phase 5: 路由整合與測試
**目標**: 完成路由註冊與測試

**任務清單**:
- [ ] 註冊路由
- [ ] 實作 Guards (如需)
- [ ] 整合測試
- [ ] E2E 測試

**交付物**:
- `src/app/routes/{module}/routes.ts` (更新)
- `e2e/{module}.e2e-spec.ts`

### 檔案清單

**新增檔案**:
- [ ] `src/app/core/domain/models/{entity}.model.ts`
- [ ] `src/app/core/data-access/{module}/{entity}.repository.ts`
- [ ] `src/app/core/services/{entity}.service.ts`
- [ ] `src/app/routes/{module}/{entity}-list.component.ts`
- [ ] `src/app/routes/{module}/{entity}-detail.component.ts`

**修改檔案**:
- [ ] `firestore.rules`
- [ ] `src/app/routes/{module}/routes.ts`
- [ ] `src/app/core/services/blueprint-event-bus.service.ts` (如需)
```

## 🔄 開發工作流程 (5 Phases)

### Phase 1: 理解需求 (MUST)

**步驟**:
1. 仔細閱讀用戶需求
2. 識別核心功能點與業務目標
3. 確認範圍和優先級
4. 列出所有相關實體和關係

**使用工具**:
- ✅ Context7 - 查詢相關技術文檔
- ✅ Sequential Thinking - 分析問題與拆解

**輸出**:
- 任務定義文檔
- 技術分析報告

### Phase 2: 制定計畫 (MUST)

**步驟**:
1. 使用 Software Planning Tool 開始規劃
2. 拆解為 5-10 個具體任務
3. 評估每個任務的複雜度 (0-10)
4. 確定實施順序與依賴關係

**使用工具**:
- ✅ Software Planning Tool
  - `start_planning(goal)`
  - `add_todo(task, complexity)`

**輸出**:
- 實施計畫文檔
- 任務清單 (含複雜度)

### Phase 3: 實作 (MUST)

**步驟**:
1. 遵循順序: Repository → Service → Component
2. 每完成一個任務，更新狀態
3. 遵循程式碼標準與架構規範
4. 撰寫單元測試

**使用工具**:
- ✅ Software Planning Tool
  - `update_todo_status(id, "in-progress")`
  - `update_todo_status(id, "completed")`

**程式碼標準**:
- 使用 Standalone Components
- 使用 Signals 管理狀態
- 使用 `inject()` 依賴注入
- 使用新控制流 (`@if`, `@for`, `@switch`)
- 遵循三層架構

### Phase 4: 驗證 (MUST)

**檢查清單**:

#### 架構檢查 (MUST) 🔴
- [ ] 遵循三層架構 (UI → Service → Repository)
- [ ] 使用 Signals 進行狀態管理
- [ ] 使用 Standalone Components (無 NgModules)
- [ ] 正確使用 inject() 注入依賴

#### 事件檢查 (MUST) 🔴
- [ ] 所有領域事件透過 EventBus 發送
- [ ] 事件命名遵循規範: `[module].[action]`
- [ ] 事件訂閱使用 `takeUntilDestroyed()`

#### 安全檢查 (MUST) 🔴
- [ ] 已實作 Firestore Security Rules
- [ ] 在守衛檢查角色: `permissionService.hasRole()`
- [ ] 在元件檢查權限: `permissionService.canEdit()`

#### 測試檢查 (SHOULD) ⚠️
- [ ] 單元測試覆蓋率 > 80%
- [ ] 關鍵業務邏輯有測試
- [ ] E2E 測試涵蓋主要流程

#### 程式碼品質 (MUST) 🔴
- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 無使用 any 類型
- [ ] 命名清晰且符合規範

### Phase 5: 交付 (MUST)

**步驟**:
1. 完成所有檢查清單
2. 更新文檔 (README, AGENTS.md)
3. 提交 Pull Request
4. 等待 Code Review

**交付物**:
- ✅ 完整的程式碼實作
- ✅ 單元測試與 E2E 測試
- ✅ 更新的文檔
- ✅ Pull Request 描述

## ✅ 驗證聲明 (MANDATORY)

**每次完成任務前，Copilot MUST 提供此驗證:**

```markdown
### 🔍 強制規則遵守驗證

#### 📋 Pre-Task Checks
- [x] Read all mandatory rule files (.github/rules/*.md)
- [x] Identified required tools (Context7/Sequential Thinking/Planning Tool)
- [x] Verified solution follows three-layer architecture
- [x] Confirmed Repository pattern usage (no direct Firestore)
- [x] Checked all forbidden patterns avoided

#### 🔧 Tool Usage
- Context7: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Sequential Thinking: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Planning Tool: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]

#### 🏗️ Architecture Compliance
- Three-layer separation: [✅ Yes / ❌ No]
- Repository pattern: [✅ Yes / ❌ No]
- Security Rules: [✅ Implemented / ❌ Not Needed / ⚠️ MISSING]

#### 💻 Code Quality
- Standalone Components: [✅ Yes / ❌ No]
- Signals usage: [✅ Yes / ❌ No]
- inject() usage: [✅ Yes / ❌ No]
- New control flow: [✅ Yes / ❌ No]
- No any types: [✅ Yes / ⚠️ Found any types]

#### 🚫 Forbidden Pattern Check
- No direct Firestore: [✅ Clean]
- No NgModule: [✅ Clean]
- No constructor injection: [✅ Clean]
- No manual subscriptions: [✅ Clean]

**Compliance Status**: [✅ 100% COMPLIANT / ⚠️ WARNINGS / ❌ VIOLATIONS]
```

## 🚫 禁止行為清單 (MUST NOT) 🔴

Copilot **MUST NOT**:

1. ❌ 跳過工具使用驗證
2. ❌ 憑記憶提供 API 用法
3. ❌ 直接操作 Firestore (必須使用 Repository)
4. ❌ 建立 NgModule (必須使用 Standalone Components)
5. ❌ 使用 any 類型
6. ❌ 在 constructor 執行業務邏輯
7. ❌ 手動管理訂閱 (必須使用 takeUntilDestroyed)
8. ❌ UI 層直接呼叫 Repository
9. ❌ Service 包含 UI 邏輯
10. ❌ Repository 包含業務邏輯

## 📊 決策樹指南

### 狀態管理決策

```
需要響應式狀態？
├─ 是 → 使用 signal()
│   └─ 需要衍生狀態？
│       ├─ 是 → 使用 computed()
│       └─ 否 → 直接使用 signal
└─ 否 → 無狀態元件
```

### 訂閱管理決策

```
需要訂閱 Observable？
├─ 是 → 使用 takeUntilDestroyed()
│   └─ 需要手動清理？
│       ├─ 是 → 在 ngOnDestroy 清理
│       └─ 否 → 自動清理
└─ 否 → 不訂閱
```

### Repository 放置決策

```
是否被多個模組使用？
├─ 是 → core/data-access/shared/{entity}.repository.ts
└─ 否 → core/data-access/{module}/{entity}.repository.ts
```

### 新模塊創建決策

```
需要新模塊？
├─ 是 → 遵循模塊擴展規範 (4 階段)
│   1. 註冊階段: module-registry.ts
│   2. 實作階段: Repository → Service → Component
│   3. 整合階段: 路由 + Guards + Security Rules
│   4. 測試階段: 單元 + 元件 + 整合 + E2E
└─ 否 → 擴展現有模塊
```

## 📚 參考資源

- 架構設計原則: `.github/rules/architectural-principles.md`
- 專案開發規則: `.github/rules/project-rules.md`
- 強制工作流程: `.github/rules/mandatory-workflow.md`
- Angular 最佳實踐: `.github/instructions/angular.instructions.md`
- Repository 模式: `.github/instructions/ng-gighub-repository-pattern.instructions.md`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
