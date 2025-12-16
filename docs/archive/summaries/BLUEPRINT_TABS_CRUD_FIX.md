# 藍圖詳情頁面 Tabs CRUD 顯示問題修復需求文件

> **文件版本**: 1.0  
> **建立日期**: 2025-12-14  
> **需求類型**: Bug Fix  
> **優先等級**: High (P1)  
> **預計影響**: 7個模組視圖元件 + 1個施工日誌模組

---

## 📋 名稱

**Blueprint Module Views CRUD Data Loading Fix**  
藍圖模組視圖 CRUD 資料載入問題修復

---

## 🎯 背景 / 目的

### 問題現況

使用者在藍圖詳情頁面切換至以下 Tabs 時，無法看到任何 CRUD 資料：

1. **流程 (Workflow)** - 無顯示任何 CRUD
2. **品質 (QA)** - 無顯示任何 CRUD
3. **驗收 (Acceptance)** - 無顯示任何 CRUD
4. **財務 (Finance)** - 無顯示任何 CRUD
5. **安全 (Safety)** - 無顯示任何 CRUD
6. **雲端 (Cloud)** - 載入雲端資料失敗 + 無顯示任何 CRUD
7. **施工日誌 (Construction Log)** - 新增工地施工日誌時會出現 "Operation failed" 錯誤

### 業務影響

- ❌ 使用者無法檢視藍圖相關的流程、品質、驗收、財務、安全資料
- ❌ 使用者無法管理雲端檔案和備份
- ❌ 使用者無法新增施工日誌記錄
- ❌ 影響工地管理的核心功能使用

### 技術目標

修復資料載入邏輯，確保所有模組視圖元件能正確從 Firestore 載入對應的藍圖資料。

---

## 📝 需求說明

### 核心問題

經過程式碼分析，發現以下根本原因：

#### 問題 1: Services 呼叫錯誤的 Repository 方法

**現況**：
- 所有模組的 Services (例如 `ApprovalService`, `ChecklistService`) 在 `load()` 方法中呼叫 `repository.findAll()`
- `findAll()` 在所有 Repository 中已被標記為 `@deprecated`，且永遠返回空陣列 `[]`

**範例程式碼** (`approval.service.ts`):
```typescript
async load(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  try {
    const result = await this.repository.findAll(); // ❌ 錯誤：永遠回傳 []
    this.data.set(result);
  } catch (err) {
    this.error.set(err as Error);
  } finally {
    this.loading.set(false);
  }
}
```

**正確做法** (`workflow.repository.ts`):
```typescript
@deprecated Use findByBlueprintId() instead.
async findAll(): Promise<unknown[]> {
  this.logger.warn('[WorkflowRepository]', 'findAll() is deprecated.');
  return []; // ❌ 永遠返回空陣列
}

// ✅ 應該使用此方法
findByBlueprintId(blueprintId: string, options?: WorkflowQueryOptions): Observable<WorkflowInstance[]>
```

#### 問題 2: Services 缺少 blueprintId 參數

**現況**：
- Module View Components 在 `ngOnInit()` 中呼叫 `service.load()`，但沒有傳入 `blueprintId`
- Services 的 `load()` 方法簽名不接受任何參數

**範例程式碼** (`workflow-module-view.component.ts`):
```typescript
export class WorkflowModuleViewComponent implements OnInit {
  blueprintId = input.required<string>(); // ✅ 元件有 blueprintId

  ngOnInit(): void {
    this.customWorkflowService.load(); // ❌ 沒有傳入 blueprintId
    this.stateMachineService.load();   // ❌ 沒有傳入 blueprintId
    // ...
  }
}
```

#### 問題 3: Cloud Module 的特殊錯誤

**雲端模組已經正確實作**，但在 `CloudModuleViewComponent` 中呼叫時會出現「載入雲端資料失敗」：

**原因分析**：
- `CloudStorageService` 的 `loadFiles()` 和 `loadBackups()` 已正確接受 `blueprintId` 參數
- 可能是 Firebase Storage 權限問題或 Firestore 查詢錯誤

#### 問題 4: Construction Log Modal 的 "Operation failed"

**現況**：
- `ConstructionLogModalComponent` 使用 `ConstructionLogStore` 建立日誌
- Store 呼叫 `LogFirestoreRepository.create()`
- 錯誤訊息不明確，需要檢查實際的 Firestore 錯誤

---

## 🔍 In Scope / Out of Scope

### ✅ In Scope

1. **修復 5 個模組的 Services** (`load()` 方法)：
   - Workflow (5 services: Approval, Automation, CustomWorkflow, StateMachine, Template)
   - QA (4 services: Checklist, Defect, Inspection, Report)
   - Acceptance (5 services: Request, Review, Preliminary, ReInspection, Conclusion)
   - Finance (6 services: Budget, CostManagement, FinancialReport, Invoice, Ledger, Payment)
   - Safety (4 services: IncidentReport, RiskAssessment, SafetyInspection, SafetyTraining)

2. **修復 Cloud Module**：
   - 調查並修復 `CloudStorageService.loadFiles()` 和 `loadBackups()` 錯誤
   - 檢查 Firebase Storage 權限配置
   - 檢查 Firestore `cloud_files` 和 `cloud_backups` 集合查詢

3. **修復 Construction Log Modal**：
   - 調查並修復 `ConstructionLogStore.createLog()` 的 "Operation failed" 錯誤
   - 改善錯誤訊息顯示

4. **最小化變更原則**：
   - 只修改必要的 Service 方法簽名
   - 不改變現有架構設計
   - 遵守 KISS 和 Occam's Razor 原則

### ❌ Out of Scope

- ❌ 重構整個 Blueprint 模組架構
- ❌ 改變 Repository 方法簽名
- ❌ 新增 Event Bus 整合 (保留現有實作)
- ❌ 修改 UI/UX 設計
- ❌ 新增測試（除非必要）

---

## ⚙️ 功能行為

### 修復後的預期行為

#### 1. Module View Components 行為

當使用者開啟藍圖詳情頁面並切換到任一 Tab (流程/品質/驗收/財務/安全) 時：

```typescript
// ✅ 修復後的流程
ngOnInit(): void {
  const blueprintId = this.blueprintId(); // 取得藍圖 ID
  
  // 所有 services 都接收 blueprintId
  this.customWorkflowService.load(blueprintId);
  this.stateMachineService.load(blueprintId);
  this.automationService.load(blueprintId);
  // ...
}
```

**期望結果**：
- ✅ 元件顯示載入中狀態 (Spinner)
- ✅ Service 呼叫 `repository.findByBlueprintId(blueprintId)` 查詢資料
- ✅ 資料載入完成後，顯示在 `<st>` 表格中
- ✅ 若無資料，顯示「暫無資料」的空狀態提示

#### 2. Cloud Module 行為

當使用者切換到「雲端」Tab 時：

**期望結果**：
- ✅ 顯示雲端統計卡片（已用容量、檔案數量、已同步、備份數）
- ✅ 顯示雲端檔案列表（可上傳、下載、刪除）
- ✅ 顯示備份管理列表（可建立備份、還原備份）
- ✅ 錯誤訊息明確指出失敗原因（權限/網路/資料格式問題）

#### 3. Construction Log Modal 行為

當使用者點擊「新增工地施工日誌」按鈕時：

**期望結果**：
- ✅ Modal 彈出，表單可正常填寫
- ✅ 點擊「新增」按鈕後，資料成功儲存到 Firestore
- ✅ Modal 關閉，列表自動更新顯示新日誌
- ✅ 若失敗，顯示明確的錯誤訊息（非 "Operation failed"）

---

## 🗄️ 資料 / API

### Firestore Collections 結構

所有模組資料都儲存在 Firestore 的子集合中：

```
blueprints/{blueprintId}/
  ├─ workflows/{workflowId}              # 流程
  ├─ qa_defects/{defectId}               # 品質
  ├─ acceptance_requests/{requestId}     # 驗收
  ├─ finance_invoices/{invoiceId}        # 財務
  ├─ safety_inspections/{inspectionId}   # 安全
  └─ logs/{logId}                        # 施工日誌

cloud_files/                             # 雲端檔案 (root collection)
  └─ {fileId}
      ├─ blueprint_id: string
      ├─ name: string
      ├─ path: string
      └─ ...

cloud_backups/                           # 雲端備份 (root collection)
  └─ {backupId}
      ├─ blueprint_id: string
      ├─ name: string
      └─ ...
```

### Repository 方法對應

| Service Method | Repository Method | 參數 |
|----------------|-------------------|------|
| `service.load(blueprintId)` | `repository.findByBlueprintId(blueprintId)` | blueprintId: string |
| `service.create(blueprintId, data)` | `repository.create(blueprintId, data)` | blueprintId: string, data: CreateData |
| `service.update(blueprintId, id, data)` | `repository.update(blueprintId, id, data)` | blueprintId, id, data |
| `service.delete(blueprintId, id)` | `repository.delete(blueprintId, id)` | blueprintId, id |

### Firebase Storage 路徑

雲端檔案儲存路徑：
```
gs://{project-id}.appspot.com/
  └─ blueprint-{blueprintId}/
      └─ files/
          └─ {timestamp}-{filename}
```

---

## 🎯 影響範圍

### 檔案修改清單

#### 1. Services (24 個檔案需修改)

**Workflow 模組** (5 services):
- `src/app/core/blueprint/modules/implementations/workflow/services/approval.service.ts`
- `src/app/core/blueprint/modules/implementations/workflow/services/automation.service.ts`
- `src/app/core/blueprint/modules/implementations/workflow/services/custom-workflow.service.ts`
- `src/app/core/blueprint/modules/implementations/workflow/services/state-machine.service.ts`
- `src/app/core/blueprint/modules/implementations/workflow/services/template.service.ts`

**QA 模組** (4 services):
- `src/app/core/blueprint/modules/implementations/qa/services/checklist.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/defect.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/inspection.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/report.service.ts`

**Acceptance 模組** (5 services):
- `src/app/core/blueprint/modules/implementations/acceptance/services/request.service.ts`
- `src/app/core/blueprint/modules/implementations/acceptance/services/review.service.ts`
- `src/app/core/blueprint/modules/implementations/acceptance/services/preliminary.service.ts`
- `src/app/core/blueprint/modules/implementations/acceptance/services/re-inspection.service.ts`
- `src/app/core/blueprint/modules/implementations/acceptance/services/conclusion.service.ts`

**Finance 模組** (6 services):
- `src/app/core/blueprint/modules/implementations/finance/services/budget.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/cost-management.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/financial-report.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/ledger.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment.service.ts`

**Safety 模組** (4 services):
- `src/app/core/blueprint/modules/implementations/safety/services/incident-report.service.ts`
- `src/app/core/blueprint/modules/implementations/safety/services/risk-assessment.service.ts`
- `src/app/core/blueprint/modules/implementations/safety/services/safety-inspection.service.ts`
- `src/app/core/blueprint/modules/implementations/safety/services/safety-training.service.ts`

#### 2. Module View Components (5 個檔案需修改)

- `src/app/routes/blueprint/modules/workflow-module-view.component.ts`
- `src/app/routes/blueprint/modules/qa-module-view.component.ts`
- `src/app/routes/blueprint/modules/acceptance-module-view.component.ts`
- `src/app/routes/blueprint/modules/finance-module-view.component.ts`
- `src/app/routes/blueprint/modules/safety-module-view.component.ts`

#### 3. Cloud Module (需調查錯誤)

- `src/app/core/blueprint/modules/implementations/cloud/services/cloud-storage.service.ts`
- `src/app/core/blueprint/modules/implementations/cloud/repositories/cloud.repository.ts`
- `src/app/routes/blueprint/modules/cloud-module-view.component.ts`

#### 4. Construction Log (需調查錯誤)

- `src/app/core/state/stores/construction-log.store.ts`
- `src/app/routes/blueprint/construction-log/construction-log-modal.component.ts`

### 影響的使用者流程

- ✅ 藍圖詳情頁面 → 流程 Tab (CRUD 操作)
- ✅ 藍圖詳情頁面 → 品質 Tab (CRUD 操作)
- ✅ 藍圖詳情頁面 → 驗收 Tab (CRUD 操作)
- ✅ 藍圖詳情頁面 → 財務 Tab (CRUD 操作)
- ✅ 藍圖詳情頁面 → 安全 Tab (CRUD 操作)
- ✅ 藍圖詳情頁面 → 雲端 Tab (檔案和備份管理)
- ✅ 藍圖詳情頁面 → 施工日誌 Tab → 新增日誌

---

## ✅ 驗收條件

### 功能驗收

#### 1. 流程/品質/驗收/財務/安全 Tabs

**測試步驟**：
1. 登入系統
2. 導航至任一藍圖詳情頁面
3. 切換至「流程」Tab

**預期結果**：
- ✅ 若藍圖有流程資料，顯示在表格中
- ✅ 若藍圖無流程資料，顯示「暫無自訂流程」空狀態
- ✅ 統計卡片顯示正確的數量
- ✅ 無 Console 錯誤訊息

**重複測試**：品質、驗收、財務、安全 Tabs

#### 2. 雲端 Tab

**測試步驟**：
1. 切換至「雲端」Tab
2. 檢查統計卡片
3. 上傳一個測試檔案
4. 刪除該檔案
5. 建立一個備份

**預期結果**：
- ✅ 統計卡片顯示正確數據
- ✅ 檔案上傳成功，列表更新
- ✅ 檔案刪除成功，列表更新
- ✅ 備份建立成功，列表更新
- ✅ 無「載入雲端資料失敗」錯誤

#### 3. 施工日誌 Tab

**測試步驟**：
1. 切換至「施工日誌」Tab
2. 點擊「新增工地施工日誌」按鈕
3. 填寫必填欄位（日期、標題）
4. 點擊「新增」按鈕

**預期結果**：
- ✅ 日誌建立成功
- ✅ Modal 關閉
- ✅ 列表自動更新顯示新日誌
- ✅ 顯示成功訊息（非 "Operation failed"）

### 技術驗收

#### Code Review Checklist

- ✅ 所有 Services 的 `load()` 方法接受 `blueprintId: string` 參數
- ✅ 所有 Services 呼叫 `repository.findByBlueprintId(blueprintId)` 而非 `findAll()`
- ✅ 所有 Module View Components 在 `ngOnInit()` 中傳入 `this.blueprintId()` 給 services
- ✅ 使用 RxJS 的 `lastValueFrom()` 或 `firstValueFrom()` 處理 Observable
- ✅ 錯誤處理完整，提供明確的錯誤訊息
- ✅ 遵守專案的 TypeScript 和 Angular 編碼規範
- ✅ 無 ESLint 警告

#### Console 檢查

- ✅ 無 Firestore 權限錯誤
- ✅ 無 "findAll() is deprecated" 警告
- ✅ 無 "Operation failed" 錯誤
- ✅ 只有正常的 info/debug 日誌

### 效能驗收

- ✅ 每個 Tab 的資料載入時間 < 2 秒
- ✅ 切換 Tabs 時無明顯延遲
- ✅ 無記憶體洩漏（在 Chrome DevTools Memory Profiler 檢查）

---

## 🚀 實作計畫

### Phase 1: 修復 Services (高優先度)

**目標**: 修復 24 個 Services 的 `load()` 方法

**步驟**：
1. 建立 Service 修改模板
2. 使用 Loop Workflow 批次修改所有 Services
3. 修改 Module View Components 的 `ngOnInit()` 方法

**預估時間**: 2-3 小時

### Phase 2: 修復 Cloud Module (中優先度)

**目標**: 調查並修復 Cloud 資料載入錯誤

**步驟**：
1. 啟用 Cloud Repository 的 debug 日誌
2. 測試 Firestore 查詢和 Firebase Storage 權限
3. 檢查 `cloud_files` 和 `cloud_backups` 集合索引
4. 修復錯誤並改善錯誤訊息

**預估時間**: 1-2 小時

### Phase 3: 修復 Construction Log (中優先度)

**目標**: 修復施工日誌建立錯誤

**步驟**：
1. 在 `ConstructionLogStore.createLog()` 中加入詳細錯誤日誌
2. 測試 Firestore 寫入操作
3. 檢查 `LogFirestoreRepository.create()` 的實作
4. 改善錯誤訊息顯示

**預估時間**: 1 小時

### Phase 4: 測試與驗收 (必要)

**步驟**：
1. 執行功能驗收測試
2. 執行技術驗收檢查
3. 檢查 Console 日誌
4. 效能測試

**預估時間**: 1-2 小時

---

## 📊 風險評估

### 高風險項目

1. **Firebase 權限問題**：
   - 風險：Cloud Module 可能因 Firestore Rules 或 Storage Rules 限制而無法讀寫資料
   - 緩解：檢查 `firestore.rules` 和 Firebase Storage 規則配置

2. **資料遷移問題**：
   - 風險：現有藍圖可能沒有對應的子集合資料
   - 緩解：顯示「暫無資料」空狀態，不視為錯誤

### 中風險項目

1. **Service 方法簽名變更**：
   - 風險：其他未發現的呼叫點可能需要同步修改
   - 緩解：使用全域搜尋確認所有呼叫點

2. **RxJS Observable 處理**：
   - 風險：`findByBlueprintId()` 返回 Observable，需要正確轉換為 Promise
   - 緩解：統一使用 `lastValueFrom()` 或 `firstValueFrom()`

---

## 📚 參考資料

- [FINAL_PROJECT_STRUCTURE.md](../architecture/FINAL_PROJECT_STRUCTURE.md) - 專案架構文檔
- [Angular Signals Guide](.github/instructions/angular-modern-features.instructions.md) - Signal 使用指引
- [Quick Reference](.github/instructions/quick-reference.instructions.md) - 常用模式速查
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore) - Firestore 官方文檔
- [RxJS lastValueFrom](https://rxjs.dev/api/index/function/lastValueFrom) - RxJS API 文檔

---

## 📝 變更歷史

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|----------|
| 1.0 | 2025-12-14 | Blueprint Mode Agent | 初版需求文件建立 |

---

**文件狀態**: ✅ 已完成  
**審核狀態**: ⏳ 待審核  
**核准狀態**: ⏳ 待核准
