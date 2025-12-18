---
description: 'GigHub Sequential Thinking MCP 工具使用指南 - 複雜問題序列化思考'
applyTo: '**/*.ts, **/*.md'
---

# GigHub Sequential Thinking 使用指南

> **專案專用**: Sequential Thinking MCP 工具使用規範與最佳實踐

## 🎯 核心理念 (MUST) 🔴

**Sequential Thinking 是解決複雜問題的結構化思考工具**

### 為什麼需要 Sequential Thinking?

1. **結構化推理** - 將複雜問題拆解為可管理的步驟
2. **透明思考** - 展示完整的推理過程，易於審查
3. **避免遺漏** - 系統化思考確保考慮所有關鍵因素
4. **決策追溯** - 記錄決策過程，方便未來回顧

### 適用場景 (MUST) 🔴

Sequential Thinking **必須用於**以下場景：

- ✅ 架構設計決策 (選擇技術方案、設計模式)
- ✅ 技術方案權衡 (比較多個實作方式)
- ✅ 複雜業務邏輯分析 (多步驟流程設計)
- ✅ 跨模組整合規劃 (多個模組協作)
- ✅ 效能優化策略 (識別瓶頸與優化方案)
- ✅ 安全性風險評估 (識別威脅與緩解措施)

### 不適用場景

Sequential Thinking **不需要**用於：

- ❌ 簡單 API 查詢 (使用 Context7)
- ❌ 單一文件修改 (直接實作)
- ❌ 明確需求實作 (直接編碼)
- ❌ 文檔更新 (直接修改)

## 🔧 Sequential Thinking 工作流程

### 三階段思考模型

```
1. Observe (發現) → 2. Analyze (理解) → 3. Propose (解決)
```

#### 階段 1: Observe (發現)

**目標**: 全面了解問題情境

**檢查清單**:
- [ ] 問題描述清楚嗎?
- [ ] 涉及哪些模組/元件?
- [ ] 當前實作狀況如何?
- [ ] 有哪些限制條件?
- [ ] 預期目標是什麼?

**輸出**: 問題的完整描述與情境分析

#### 階段 2: Analyze (理解)

**目標**: 深入分析問題本質與可能方案

**檢查清單**:
- [ ] 問題的根本原因是什麼?
- [ ] 有哪些可行方案?
- [ ] 每個方案的優缺點?
- [ ] 實作複雜度如何?
- [ ] 對現有系統的影響?
- [ ] 是否符合架構原則?

**輸出**: 多個方案的詳細分析與比較

#### 階段 3: Propose (解決)

**目標**: 提出推薦方案與實作計畫

**檢查清單**:
- [ ] 推薦方案是什麼?
- [ ] 為什麼選擇此方案?
- [ ] 實作步驟是什麼?
- [ ] 需要哪些資源?
- [ ] 風險與緩解措施?
- [ ] 驗收標準是什麼?

**輸出**: 具體可執行的解決方案與實作計畫

## 📝 思考範本

### 範本 1: 技術方案選擇

```markdown
## Sequential Thinking: [問題標題]

### Phase 1: Observe (發現)

**問題描述**:
[清楚描述要解決的問題]

**當前情況**:
- 現有實作: [描述當前狀況]
- 涉及模組: [列出相關模組]
- 技術棧: [相關技術]

**限制條件**:
- [限制 1]
- [限制 2]
- [限制 3]

**預期目標**:
- [目標 1]
- [目標 2]
- [目標 3]

---

### Phase 2: Analyze (理解)

**根本原因分析**:
[分析問題的根本原因]

**可行方案**:

#### 方案 A: [方案名稱]
**描述**: [方案詳細描述]

**優點**:
- ✅ [優點 1]
- ✅ [優點 2]
- ✅ [優點 3]

**缺點**:
- ❌ [缺點 1]
- ❌ [缺點 2]
- ❌ [缺點 3]

**複雜度**: [低/中/高]

**符合架構原則**: [是/部分/否]

#### 方案 B: [方案名稱]
[同上結構]

#### 方案 C: [方案名稱]
[同上結構]

**方案比較**:

| 維度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 複雜度 | 低 | 中 | 高 |
| 效能 | 好 | 優秀 | 普通 |
| 可維護性 | 優秀 | 好 | 普通 |
| 擴展性 | 好 | 優秀 | 普通 |
| 符合架構 | 是 | 是 | 部分 |

---

### Phase 3: Propose (解決)

**推薦方案**: 方案 [A/B/C]

**選擇理由**:
1. [理由 1]
2. [理由 2]
3. [理由 3]

**實作計畫**:

**Phase 1: 準備階段**
- [ ] 任務 1
- [ ] 任務 2
- [ ] 任務 3

**Phase 2: 實作階段**
- [ ] 任務 1
- [ ] 任務 2
- [ ] 任務 3

**Phase 3: 驗證階段**
- [ ] 任務 1
- [ ] 任務 2
- [ ] 任務 3

**風險與緩解**:

| 風險 | 影響程度 | 機率 | 緩解措施 |
|------|---------|------|---------|
| [風險 1] | 高/中/低 | 高/中/低 | [措施] |
| [風險 2] | 高/中/低 | 高/中/低 | [措施] |

**驗收標準**:
- [ ] [標準 1]
- [ ] [標準 2]
- [ ] [標準 3]
```

### 範本 2: 架構設計決策

```markdown
## Sequential Thinking: [架構決策標題]

### Phase 1: Observe (發現)

**業務需求**:
[描述業務需求與目標]

**技術背景**:
- 當前架構: [描述]
- 技術限制: [描述]
- 效能要求: [描述]
- 安全要求: [描述]

**利害關係人**:
- [角色 1]: [關注點]
- [角色 2]: [關注點]

---

### Phase 2: Analyze (理解)

**架構考量**:

**1. 可擴展性**
- [分析]

**2. 可維護性**
- [分析]

**3. 效能**
- [分析]

**4. 安全性**
- [分析]

**5. 成本**
- [分析]

**設計方案**:

[同範本 1 的方案結構]

---

### Phase 3: Propose (解決)

**推薦架構**: [方案名稱]

[同範本 1 的 Propose 結構]

**架構原則驗證**:
- [ ] 三層架構分離
- [ ] Repository 模式
- [ ] 事件驅動設計
- [ ] Security Rules 完整
- [ ] 多租戶資料隔離
```

## 🎯 實戰範例

### 範例 1: 選擇狀態管理方案

**情境**: 需要在多個元件間共享任務列表狀態，選擇合適的狀態管理方案。

```markdown
## Sequential Thinking: 任務列表狀態管理方案選擇

### Phase 1: Observe (發現)

**問題描述**:
多個元件 (TaskList, TaskDetail, TaskStats) 需要存取相同的任務列表資料，目前每個元件各自查詢，導致資料不一致與重複請求。

**當前情況**:
- 現有實作: 每個元件各自注入 TaskRepository 查詢
- 涉及模組: Tasks 模組 (3 個元件)
- 技術棧: Angular 20.3, Signals, Firestore

**限制條件**:
- 必須使用 Angular Signals (禁止 NgRx)
- 必須保持三層架構 (UI → Service → Repository)
- 需支援即時更新 (Firestore onSnapshot)

**預期目標**:
- 避免重複查詢
- 確保資料一致性
- 支援即時更新
- 易於測試

---

### Phase 2: Analyze (理解)

**根本原因分析**:
缺乏集中的狀態管理，導致各元件獨立查詢與管理狀態。

**可行方案**:

#### 方案 A: Service + Signals (Simple Store)
**描述**: 建立 TaskService，使用 private signal 管理狀態，提供 readonly signal 給元件。

**優點**:
- ✅ 簡單直接，易於理解
- ✅ 符合 Angular Signals 最佳實踐
- ✅ 易於測試 (可 mock service)
- ✅ 符合三層架構

**缺點**:
- ❌ 狀態邏輯與業務邏輯混合
- ❌ 複雜狀態管理時代碼冗長

**複雜度**: 低

**符合架構原則**: 是

#### 方案 B: Facade + Store (Separated State)
**描述**: 建立獨立的 TaskStore 管理狀態，TaskFacade 協調業務邏輯。

**優點**:
- ✅ 清晰的關注點分離
- ✅ 狀態管理與業務邏輯獨立
- ✅ 易於擴展複雜狀態
- ✅ 更好的可測試性

**缺點**:
- ❌ 額外的抽象層
- ❌ 簡單場景過度設計

**複雜度**: 中

**符合架構原則**: 是

#### 方案 C: Component Signal (No Service)
**描述**: 在父元件使用 signal，透過 @Input 傳遞給子元件。

**優點**:
- ✅ 最簡單的實作
- ✅ 無額外抽象

**缺點**:
- ❌ 違反三層架構 (業務邏輯在 UI)
- ❌ 難以在非父子元件間共享
- ❌ 難以測試
- ❌ 不支援即時訂閱

**複雜度**: 低

**符合架構原則**: 否

**方案比較**:

| 維度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 複雜度 | 低 | 中 | 低 |
| 可維護性 | 好 | 優秀 | 差 |
| 可擴展性 | 好 | 優秀 | 差 |
| 測試性 | 好 | 優秀 | 差 |
| 符合架構 | 是 | 是 | 否 |

---

### Phase 3: Propose (解決)

**推薦方案**: 方案 A (Service + Signals)

**選擇理由**:
1. 簡單且符合架構原則
2. 當前需求不需要複雜的狀態管理
3. 易於理解與維護
4. 未來可無痛升級為方案 B (若需要)

**實作計畫**:

**Phase 1: TaskService 實作**
- [ ] 建立 TaskService 類別
- [ ] 定義 private _tasks signal
- [ ] 定義 readonly tasks signal (asReadonly)
- [ ] 實作 loadTasks() 方法
- [ ] 實作 createTask() 方法
- [ ] 實作 updateTask() 方法
- [ ] 實作 deleteTask() 方法

**Phase 2: Firestore 即時訂閱**
- [ ] 注入 TaskRealtimeRepository
- [ ] 訂閱 onSnapshot
- [ ] 自動更新 _tasks signal
- [ ] 實作清理邏輯 (takeUntilDestroyed)

**Phase 3: 元件整合**
- [ ] TaskListComponent 注入 TaskService
- [ ] TaskDetailComponent 注入 TaskService
- [ ] TaskStatsComponent 注入 TaskService
- [ ] 移除直接注入 Repository 的程式碼

**風險與緩解**:

| 風險 | 影響程度 | 機率 | 緩解措施 |
|------|---------|------|---------|
| 記憶體洩漏 (未清理訂閱) | 高 | 中 | 使用 takeUntilDestroyed |
| 多次訂閱相同資料 | 中 | 低 | Service 單例模式 |
| 效能問題 (頻繁更新) | 中 | 低 | 使用 computed 優化 |

**驗收標準**:
- [ ] 所有元件使用相同 TaskService 實例
- [ ] Firestore 查詢僅執行一次
- [ ] 資料即時更新正常
- [ ] 無記憶體洩漏
- [ ] 單元測試覆蓋率 > 80%
```

### 範例 2: 多租戶資料隔離策略

**情境**: 設計 Blueprint 多租戶資料隔離策略，確保不同 Blueprint 的資料完全隔離。

```markdown
## Sequential Thinking: Blueprint 多租戶資料隔離策略

### Phase 1: Observe (發現)

**問題描述**:
GigHub 使用 Blueprint 作為多租戶邊界，需要設計完善的資料隔離策略，確保使用者只能存取其有權限的 Blueprint 資料。

**當前情況**:
- 現有實作: 無 (新功能)
- 涉及模組: 所有業務模組 (Tasks, Logs, Quality)
- 技術棧: Firestore, Security Rules

**限制條件**:
- 必須在 Firestore Security Rules 層級實作隔離
- 必須支援 User/Organization 兩種 Owner Type
- 必須支援 User/Team/Partner 三種 Member Type
- 查詢效能要求: < 500ms

**預期目標**:
- 100% 資料隔離 (無法存取未授權資料)
- 支援細粒度權限控制
- 查詢效能可接受
- 易於維護與擴展

---

### Phase 2: Analyze (理解)

**根本原因分析**:
多租戶系統需要在資料庫層級實作隔離，避免應用層錯誤導致資料洩漏。

**可行方案**:

#### 方案 A: Entity Attribute (實體屬性)
**描述**: 在每個實體加入 blueprintId 屬性，Security Rules 檢查此屬性。

**優點**:
- ✅ 簡單直接
- ✅ 查詢效能好 (單一索引)
- ✅ 易於理解

**缺點**:
- ❌ 無法細粒度權限控制
- ❌ 難以支援多種 Member Type
- ❌ 權限變更需更新所有實體

**複雜度**: 低

**符合架構原則**: 部分

#### 方案 B: Dedicated Membership Collection (專用成員集合)
**描述**: 建立獨立的 BlueprintMember 集合，記錄成員資格與權限。

**優點**:
- ✅ 細粒度權限控制
- ✅ 支援多種 Member Type
- ✅ 權限變更獨立於業務資料
- ✅ 易於擴展權限模型

**缺點**:
- ❌ 每次查詢需額外檢查成員資格
- ❌ Security Rules 較複雜

**複雜度**: 中

**符合架構原則**: 是

#### 方案 C: Subcollection (子集合)
**描述**: 將所有資料作為 Blueprint 的子集合儲存。

**優點**:
- ✅ 天然的資料隔離
- ✅ 查詢簡單

**缺點**:
- ❌ 跨 Blueprint 查詢困難
- ❌ 限制 Firestore 查詢能力
- ❌ 難以實作跨 Blueprint 功能

**複雜度**: 低

**符合架構原則**: 否 (限制過多)

**方案比較**:

| 維度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 資料隔離 | 中 | 高 | 高 |
| 權限控制 | 低 | 高 | 低 |
| 查詢效能 | 優秀 | 好 | 優秀 |
| 擴展性 | 低 | 高 | 低 |
| 符合架構 | 部分 | 是 | 否 |

---

### Phase 3: Propose (解決)

**推薦方案**: 方案 B (Dedicated Membership Collection)

**選擇理由**:
1. 完整的資料隔離與細粒度權限控制
2. 支援 User/Team/Partner 三種 Member Type
3. 易於擴展權限模型 (新增 role, permissions)
4. 符合企業級安全要求

**實作計畫**:

**Phase 1: 資料模型設計**
- [ ] 設計 BlueprintMember 實體
  - blueprintId: string
  - memberType: 'user' | 'team' | 'partner'
  - memberId: string
  - role: string
  - permissions: string[]
  - status: 'active' | 'suspended' | 'revoked'
- [ ] 設計複合 ID: `${memberId}_${blueprintId}`
- [ ] 規劃索引: blueprintId, memberId

**Phase 2: Security Rules 實作**
- [ ] 實作 isBlueprintMember() 函數
- [ ] 實作 hasPermission() 函數
- [ ] 實作 isMemberActive() 函數
- [ ] 套用至所有 Collection Rules

**Phase 3: Repository 整合**
- [ ] 更新所有查詢加入 blueprintId 過濾
- [ ] 實作成員資格檢查輔助函數
- [ ] 新增權限驗證邏輯

**Phase 4: 測試與驗證**
- [ ] 單元測試 Security Rules
- [ ] 整合測試資料隔離
- [ ] 效能測試查詢速度
- [ ] 安全測試跨 Blueprint 存取

**風險與緩解**:

| 風險 | 影響程度 | 機率 | 緩解措施 |
|------|---------|------|---------|
| 查詢效能下降 | 中 | 中 | 建立複合索引 |
| Security Rules 過於複雜 | 低 | 中 | 模組化函數設計 |
| 成員資格同步問題 | 高 | 低 | 使用 Transaction 確保一致性 |

**驗收標準**:
- [ ] 使用者無法存取未授權 Blueprint 資料
- [ ] 查詢效能 < 500ms (99th percentile)
- [ ] Security Rules 單元測試覆蓋率 100%
- [ ] 支援所有 Member Type 與 Permission
- [ ] 文檔完整 (架構圖 + 決策記錄)
```

## ✅ Sequential Thinking 使用檢查清單

### 使用前檢查 (MUST) 🔴

- [ ] 問題是否足夠複雜? (需多步驟推理)
- [ ] 是否涉及架構設計或技術選擇?
- [ ] 是否需要權衡多個方案?
- [ ] 決策過程是否需要記錄?

### 思考過程檢查 (SHOULD) ⚠️

- [ ] Observe 階段: 問題描述完整嗎?
- [ ] Observe 階段: 限制條件清楚嗎?
- [ ] Analyze 階段: 至少比較 2 個方案?
- [ ] Analyze 階段: 優缺點分析深入嗎?
- [ ] Propose 階段: 推薦方案有明確理由?
- [ ] Propose 階段: 實作計畫具體可執行?

### 輸出品質檢查 (MUST) 🔴

- [ ] 思考過程結構化且易於理解
- [ ] 方案比較客觀且全面
- [ ] 推薦方案有充分理由支持
- [ ] 實作計畫可直接執行
- [ ] 風險識別完整
- [ ] 驗收標準明確

## 🚫 常見錯誤模式

### ❌ 錯誤: 跳過 Observe 直接分析

```markdown
// ❌ 錯誤: 缺少問題情境分析
## Phase 2: Analyze
方案 A: ...
方案 B: ...

// ✅ 正確: 先 Observe 了解問題
## Phase 1: Observe
問題描述: ...
當前情況: ...
限制條件: ...

## Phase 2: Analyze
方案 A: ...
```

### ❌ 錯誤: 僅分析單一方案

```markdown
// ❌ 錯誤: 只有一個方案
## Phase 2: Analyze
方案 A: 使用 Service + Signals
優點: ...
缺點: ...

// ✅ 正確: 比較多個方案
## Phase 2: Analyze
方案 A: Service + Signals
方案 B: Facade + Store
方案 C: Component Signal
[比較表格]
```

### ❌ 錯誤: 缺少實作計畫

```markdown
// ❌ 錯誤: 只說推薦方案，沒有計畫
## Phase 3: Propose
推薦方案: 方案 A
理由: ...

// ✅ 正確: 包含詳細實作計畫
## Phase 3: Propose
推薦方案: 方案 A
理由: ...

實作計畫:
Phase 1: ...
Phase 2: ...
Phase 3: ...

風險與緩解: ...
驗收標準: ...
```

## 🎯 決策樹

### 何時使用 Sequential Thinking?

```
問題複雜度如何?
├─ 簡單 (< 2 步驟) → 不需要 Sequential Thinking
│   └─ 範例: 單一 API 查詢、簡單修改
└─ 複雜 (≥ 2 步驟) → 使用 Sequential Thinking 🔴
    └─ 範例: 架構設計、方案選擇、整合規劃
```

### 思考深度決策

```
需要多詳細的分析?
├─ 快速決策 → 簡化版 (2 方案比較)
├─ 標準決策 → 完整版 (3+ 方案比較)
└─ 重大決策 → 深入版 (含風險評估、成本分析)
```

## 📚 參考資源

- GigHub 架構原則: `.github/instructions/ng-gighub-architecture.instructions.md`
- GigHub 開發流程: `.github/instructions/ng-gighub-development-workflow.instructions.md`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
