# Blueprint Tabs CRUD Issues - Root Cause Analysis

> **文件版本**: 1.0  
> **分析日期**: 2025-12-14  
> **分析者**: Blueprint Mode Agent  
> **嚴重程度**: Critical (P1)

---

## 🔍 執行摘要

本文件詳細分析了藍圖詳情頁面 7 個 Tabs 無法顯示 CRUD 資料的根本原因，並提供基於 Occam's Razor 原則的最小化修復方案。

### 問題總覽

| 模組 | 問題類型 | 根本原因 | 影響範圍 |
|-----|---------|---------|---------|
| Workflow | 無資料顯示 | Service 呼叫錯誤的 Repository 方法 | 5 個子服務 |
| QA | 無資料顯示 | Service 呼叫錯誤的 Repository 方法 | 4 個子服務 |
| Acceptance | 無資料顯示 | Service 呼叫錯誤的 Repository 方法 | 5 個子服務 |
| Finance | 無資料顯示 | Service 呼叫錯誤的 Repository 方法 | 6 個子服務 |
| Safety | 無資料顯示 | Service 呼叫錯誤的 Repository 方法 | 4 個子服務 |
| Cloud | 載入失敗 + 無資料 | Firestore 查詢錯誤或權限問題 | 1 個服務 |
| Construction Log | 新增失敗 | Firestore 寫入錯誤（原因未明） | 1 個 Store |

---

## 🎯 根本原因分析

### 問題 1: Services 呼叫過時的 Repository 方法

#### 症狀

所有模組視圖元件（Workflow, QA, Acceptance, Finance, Safety）都顯示空狀態，即使 Firestore 中有資料。

#### 追蹤過程

1. **Module View Component 層級檢查**：
   ```typescript
   // workflow-module-view.component.ts
   ngOnInit(): void {
     this.customWorkflowService.load(); // ✅ 確實呼叫 load()
     this.stateMachineService.load();
     // ...
   }
   ```
   → 元件層級正常呼叫 Service

2. **Service 層級檢查**：
   ```typescript
   // approval.service.ts
   async load(): Promise<void> {
     this.loading.set(true);
     this.error.set(null);

     try {
       const result = await this.repository.findAll(); // ❌ 問題出在這裡
       this.data.set(result);
     } catch (err) {
       this.error.set(err as Error);
     } finally {
       this.loading.set(false);
     }
   }
   ```
   → Service 呼叫 `repository.findAll()`

3. **Repository 層級檢查**：
   ```typescript
   // workflow.repository.ts
   /**
    * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility.
    */
   async findAll(): Promise<unknown[]> {
     this.logger.warn('[WorkflowRepository]', 'findAll() is deprecated.');
     return []; // ❌ 永遠返回空陣列
   }
   ```
   → Repository 的 `findAll()` 被標記為廢棄且返回空陣列

#### 根本原因

**設計衝突**：
- Repository 已遷移至基於 `blueprintId` 的子集合查詢架構
- Service 仍使用舊的 `findAll()` 方法（該方法是為了向後相容而保留的 stub）
- Component 未傳遞 `blueprintId` 給 Service

**資料結構演進**：
```
❌ 舊架構 (已廢棄):
   workflows/                    # Root collection (全域)
     └─ {workflowId}
         └─ blueprintId: string

✅ 新架構 (現行):
   blueprints/{blueprintId}/     # Parent document
     └─ workflows/{workflowId}   # Subcollection (隔離)
```

**為何 `findAll()` 返回空陣列**：
- 新架構下，工作流程不再儲存在 root `workflows/` 集合
- 必須透過 `blueprints/{blueprintId}/workflows/` 路徑查詢
- `findAll()` 無法在不知道 `blueprintId` 的情況下查詢子集合資料

#### 影響的檔案

**24 個 Service 檔案** 需要修改：

```
Workflow Module (5):
  - approval.service.ts
  - automation.service.ts
  - custom-workflow.service.ts
  - state-machine.service.ts
  - template.service.ts

QA Module (4):
  - checklist.service.ts
  - defect.service.ts
  - inspection.service.ts
  - report.service.ts

Acceptance Module (5):
  - request.service.ts
  - review.service.ts
  - preliminary.service.ts
  - re-inspection.service.ts
  - conclusion.service.ts

Finance Module (6):
  - budget.service.ts
  - cost-management.service.ts
  - financial-report.service.ts
  - invoice.service.ts
  - ledger.service.ts
  - payment.service.ts

Safety Module (4):
  - incident-report.service.ts
  - risk-assessment.service.ts
  - safety-inspection.service.ts
  - safety-training.service.ts
```

---

### 問題 2: Service 方法簽名缺少 blueprintId 參數

#### 症狀

即使 Component 有 `blueprintId` input，也無法傳遞給 Service。

#### 追蹤過程

1. **Component 有 blueprintId**：
   ```typescript
   export class WorkflowModuleViewComponent implements OnInit {
     blueprintId = input.required<string>(); // ✅ 元件有此 input
   }
   ```

2. **Service.load() 不接受參數**：
   ```typescript
   // Current signature (錯誤)
   async load(): Promise<void> { ... }
   
   // Should be (正確)
   async load(blueprintId: string): Promise<void> { ... }
   ```

3. **Component 呼叫時無法傳入 blueprintId**：
   ```typescript
   ngOnInit(): void {
     const blueprintId = this.blueprintId(); // ✅ 有值
     
     // ❌ 無法傳入，因為 load() 不接受參數
     this.customWorkflowService.load();
   }
   ```

#### 根本原因

**方法簽名不匹配**：Service 層的 `load()` 方法在設計時未考慮到資料隔離需求，導致無法接收 `blueprintId` 參數。

**架構演進未完成**：
- Repository 已完成遷移（支援 `findByBlueprintId()`）
- Service 未同步更新（仍使用無參數的 `load()`）
- Component 已準備好傳遞 `blueprintId`（使用 `input.required<string>()`）

---

### 問題 3: Cloud Module 載入失敗

#### 症狀

使用者切換到「雲端」Tab 時，顯示「載入雲端資料失敗」錯誤訊息。

#### 追蹤過程

1. **Component 呼叫正確**：
   ```typescript
   // cloud-module-view.component.ts
   private async loadData(): Promise<void> {
     const blueprintId = this.blueprintId();
     
     try {
       await this.cloudService.loadFiles(blueprintId);    // ✅ 傳入 blueprintId
       await this.cloudService.loadBackups(blueprintId);  // ✅ 傳入 blueprintId
     } catch (error) {
       this.message.error('載入雲端資料失敗'); // ❌ 錯誤訊息不明確
     }
   }
   ```

2. **Service 層正常**：
   ```typescript
   // cloud-storage.service.ts
   async loadFiles(blueprintId: string): Promise<void> {
     try {
       await this.repository.listFiles(blueprintId); // ✅ 正確傳遞
       this.logger.info('[CloudStorageService]', `Loaded files for blueprint: ${blueprintId}`);
     } catch (error) {
       this.logger.error('[CloudStorageService]', 'Failed to load files', error as Error);
       throw error; // ✅ 重新拋出錯誤
     }
   }
   ```

3. **Repository 層疑點**：
   ```typescript
   // cloud.repository.ts
   async listFiles(blueprintId: string): Promise<void> {
     this.loading.set(true);
     this.error.set(null);

     try {
       // 從 Firestore 查詢檔案清單
       const filesCollection = collection(this.firebaseService.db, 'cloud_files');
       const q = query(
         filesCollection,
         where('blueprint_id', '==', blueprintId), // ⚠️ 可能的問題點
         orderBy('uploaded_at', 'desc')
       );
       
       const snapshot = await getDocs(q);
       // ...
     } catch (error) {
       this.error.set(error.message); // ⚠️ 錯誤訊息未傳遞到 UI
       throw error;
     }
   }
   ```

#### 可能的根本原因

**A. Firestore 索引缺失**：
- Firestore 複合查詢（`where` + `orderBy`）需要索引
- 錯誤訊息：`The query requires an index`

**B. Firestore Rules 權限問題**：
- 使用者無權限讀取 `cloud_files` 集合
- 錯誤訊息：`Missing or insufficient permissions`

**C. 欄位名稱不一致**：
- Repository 查詢 `blueprint_id`
- Firestore 實際儲存可能是 `blueprintId` (camelCase)

**D. 空集合導致的異常**：
- 藍圖從未上傳過檔案，集合為空
- 查詢成功但返回空陣列，但某處誤判為錯誤

#### 需要進一步調查

1. 檢查 Firestore 索引配置 (`firestore.indexes.json`)
2. 檢查 Firestore Rules (`firestore.rules`)
3. 檢查實際 Firestore 文件的欄位名稱
4. 在 Repository 加入詳細的 debug 日誌

---

### 問題 4: Construction Log Modal "Operation failed"

#### 症狀

使用者點擊「新增工地施工日誌」→ 填寫表單 → 點擊「新增」→ 顯示 "Operation failed" 錯誤。

#### 追蹤過程

1. **Modal Component 層級**：
   ```typescript
   // construction-log-modal.component.ts
   async submit(): Promise<void> {
     // ...
     try {
       const log = await this.createLog(formValue);
       
       if (!log) throw new Error('Operation failed'); // ❌ 不明確的錯誤訊息
       
       // Upload photos if any
       if (this.fileList().length > 0) {
         await this.uploadPhotos(log.id);
       }
       
       this.modalRef.close({ success: true, log });
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : '操作失敗';
       this.message.error(errorMessage); // ❌ 顯示 "Operation failed"
     }
   }
   ```

2. **createLog() 方法**：
   ```typescript
   private async createLog(formValue: any): Promise<Log | null> {
     const request: CreateLogRequest = {
       blueprintId: this.modalData.blueprintId, // ✅ 有 blueprintId
       date: date,
       title: formValue.title,
       // ...
     };
     
     return this.logStore.createLog(request); // ⚠️ 可能返回 null
   }
   ```

3. **Store 層級**：
   ```typescript
   // construction-log.store.ts
   async createLog(request: CreateLogRequest): Promise<Log | null> {
     try {
       const newLog = await this.repository.create(request); // ⚠️ 可能拋出錯誤
       this._logs.update(logs => [newLog, ...logs]);
       
       // Record audit log (可能失敗但不影響主流程)
       try {
         await this.auditService.recordLog({ ... });
       } catch (auditError) {
         console.error('Failed to record audit log:', auditError);
       }
       
       return newLog;
     } catch (error) {
       this._error.set(error instanceof Error ? error.message : 'Failed to create log');
       console.error('Create log error:', error); // ⚠️ 錯誤訊息只在 console
       return null; // ❌ 返回 null 而非拋出錯誤
     }
   }
   ```

#### 可能的根本原因

**A. Repository.create() 拋出未捕獲的錯誤**：
- Firestore 寫入權限問題
- 必填欄位缺失
- 資料驗證失敗

**B. Store 捕獲錯誤但返回 null**：
- Store 的 `createLog()` 在 catch block 中返回 `null`
- Modal 檢查到 `null` 後拋出通用的 "Operation failed"
- 實際錯誤訊息被埋藏在 console.error 中

**C. 錯誤處理鏈斷裂**：
```
Repository (拋出詳細錯誤)
  ↓
Store (捕獲錯誤 → console.error → 返回 null)
  ↓
Modal (檢查 null → 拋出 "Operation failed")
  ↓
使用者 (看到無用的錯誤訊息)
```

#### 修復策略

**改善錯誤傳遞鏈**：
```typescript
// ✅ 修復後的 Store
async createLog(request: CreateLogRequest): Promise<Log> {
  try {
    const newLog = await this.repository.create(request);
    this._logs.update(logs => [newLog, ...logs]);
    return newLog;
  } catch (error) {
    // 設定錯誤狀態
    this._error.set(error instanceof Error ? error.message : 'Failed to create log');
    
    // 記錄詳細日誌
    console.error('[ConstructionLogStore] Create log failed:', error);
    
    // 重新拋出錯誤（而非返回 null）
    throw error;
  }
}

// ✅ 修復後的 Modal
async submit(): Promise<void> {
  try {
    const log = await this.createLog(formValue);
    // ...
  } catch (error) {
    // 顯示真實的錯誤訊息
    const errorMessage = error instanceof Error ? error.message : '建立日誌失敗';
    this.message.error(errorMessage);
    console.error('[ConstructionLogModal] Submit error:', error);
  }
}
```

---

## 🛠️ 最小化修復方案

### 方案設計原則

1. **Occam's Razor** - 選擇最簡單的解決方案
2. **Minimal Changes** - 只修改必要的程式碼
3. **No Over-Engineering** - 不引入新的複雜度
4. **Backward Compatible** - 保持既有 API 相容（如可能）

### 修復 Phase 1: Services (24 個檔案)

#### 修改模板

**Before**:
```typescript
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private repository = inject(WorkflowRepository);

  data = signal<any[]>([]);
  loading = signal(false);
  error = signal<Error | null>(null);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.repository.findAll();
      this.data.set(result);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

**After**:
```typescript
import { lastValueFrom } from 'rxjs'; // ✅ 新增 import

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private repository = inject(WorkflowRepository);

  data = signal<any[]>([]);
  loading = signal(false);
  error = signal<Error | null>(null);

  // ✅ 修改：新增 blueprintId 參數
  async load(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // ✅ 修改：呼叫 findByBlueprintId 並轉換 Observable 為 Promise
      const result = await lastValueFrom(
        this.repository.findByBlueprintId(blueprintId)
      );
      this.data.set(result);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

#### 批次修改策略

使用 **Loop Workflow** 處理 24 個 Services：

1. **分類**：
   - Simple (20 services): 套用上述模板即可
   - Complex (4 services): 需要額外調整（例如多個 Repository 的情況）

2. **執行順序**：
   - Workflow Module (5 services)
   - QA Module (4 services)
   - Acceptance Module (5 services)
   - Finance Module (6 services)
   - Safety Module (4 services)

3. **驗證**：
   - 每修改 5 個檔案後執行 `yarn lint`
   - 檢查 TypeScript 編譯錯誤

### 修復 Phase 2: Module View Components (5 個檔案)

#### 修改模板

**Before**:
```typescript
ngOnInit(): void {
  this.customWorkflowService.load();
  this.stateMachineService.load();
  this.automationService.load();
  this.templateService.load();
  this.approvalService.load();
}
```

**After**:
```typescript
ngOnInit(): void {
  const blueprintId = this.blueprintId(); // ✅ 取得 blueprintId
  
  // ✅ 傳入 blueprintId
  this.customWorkflowService.load(blueprintId);
  this.stateMachineService.load(blueprintId);
  this.automationService.load(blueprintId);
  this.templateService.load(blueprintId);
  this.approvalService.load(blueprintId);
}
```

### 修復 Phase 3: Cloud Module (調查與修復)

#### Step 1: 加入詳細日誌

```typescript
// cloud.repository.ts
async listFiles(blueprintId: string): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  // ✅ 加入 debug 日誌
  this.logger.debug('[CloudRepository]', `Listing files for blueprint: ${blueprintId}`);

  try {
    const filesCollection = collection(this.firebaseService.db, 'cloud_files');
    const q = query(
      filesCollection,
      where('blueprint_id', '==', blueprintId),
      orderBy('uploaded_at', 'desc')
    );
    
    // ✅ 記錄查詢參數
    this.logger.debug('[CloudRepository]', 'Query params:', { blueprintId });
    
    const snapshot = await getDocs(q);
    
    // ✅ 記錄結果數量
    this.logger.debug('[CloudRepository]', `Found ${snapshot.size} files`);
    
    // ...
  } catch (error) {
    // ✅ 記錄詳細錯誤
    this.logger.error('[CloudRepository]', 'listFiles failed', {
      error,
      blueprintId,
      errorCode: (error as any).code,
      errorMessage: (error as any).message
    });
    
    this.error.set((error as Error).message);
    throw error;
  } finally {
    this.loading.set(false);
  }
}
```

#### Step 2: 檢查 Firestore 配置

**檢查索引** (`firestore.indexes.json`):
```json
{
  "indexes": [
    {
      "collectionGroup": "cloud_files",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprint_id", "order": "ASCENDING" },
        { "fieldPath": "uploaded_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**檢查 Rules** (`firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cloud_files/{fileId} {
      // ✅ 確保使用者有讀取權限
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 修復 Phase 4: Construction Log (改善錯誤處理)

#### Step 1: Store 層級改善

```typescript
// construction-log.store.ts
async createLog(request: CreateLogRequest): Promise<Log> {
  try {
    this.logger.info('[ConstructionLogStore]', 'Creating log', { blueprintId: request.blueprintId });
    
    const newLog = await this.repository.create(request);
    this._logs.update(logs => [newLog, ...logs]);
    
    this.logger.info('[ConstructionLogStore]', 'Log created successfully', { logId: newLog.id });
    
    // Audit log (non-blocking)
    this.recordAuditLog(newLog, request).catch(err => {
      this.logger.warn('[ConstructionLogStore]', 'Failed to record audit log', err);
    });
    
    return newLog; // ✅ 返回成功結果
  } catch (error) {
    // ✅ 詳細錯誤記錄
    this.logger.error('[ConstructionLogStore]', 'Failed to create log', {
      error,
      request,
      errorCode: (error as any).code,
      errorMessage: (error as any).message
    });
    
    this._error.set(error instanceof Error ? error.message : 'Failed to create log');
    
    // ✅ 重新拋出錯誤（而非返回 null）
    throw error;
  }
}
```

#### Step 2: Modal 層級改善

```typescript
// construction-log-modal.component.ts
async submit(): Promise<void> {
  if (!this.form.valid) { /* ... */ return; }

  this.submitting.set(true);

  try {
    const formValue = this.form.value;
    
    // ✅ 直接呼叫 createLog，不需要檢查 null
    const log = await this.createLog(formValue);
    
    // Upload photos
    if (this.fileList().length > 0) {
      await this.uploadPhotos(log.id);
    }

    this.message.success('施工日誌建立成功'); // ✅ 成功訊息
    this.modalRef.close({ success: true, log });
  } catch (error) {
    // ✅ 顯示實際錯誤訊息
    const errorMessage = error instanceof Error 
      ? error.message 
      : '建立施工日誌失敗，請稍後再試';
    
    this.message.error(errorMessage);
    
    // ✅ 詳細日誌
    console.error('[ConstructionLogModal] Submit failed:', {
      error,
      formValue: this.form.value,
      blueprintId: this.modalData.blueprintId
    });
  } finally {
    this.submitting.set(false);
  }
}

private async createLog(formValue: any): Promise<Log> {
  const date = this.ensureValidDate(formValue.date);
  const currentUserId = this.firebaseService.getCurrentUserId();
  
  if (!currentUserId) {
    throw new Error('無法取得使用者資訊，請重新登入'); // ✅ 明確錯誤
  }

  const request: CreateLogRequest = { /* ... */ };
  
  // ✅ 直接返回 Promise（讓錯誤往上拋）
  return this.logStore.createLog(request);
}
```

---

## 📊 修復優先順序

### Critical (P0) - 立即修復

- ✅ **Services load() 方法** (24 個檔案)
- ✅ **Module View Components ngOnInit()** (5 個檔案)

**理由**：影響 5 個核心功能模組，完全阻擋 CRUD 操作

### High (P1) - 優先修復

- ⚠️ **Construction Log 錯誤訊息**
- ⚠️ **Cloud Module 錯誤調查**

**理由**：影響單一功能，但錯誤訊息不明確導致難以 debug

### Medium (P2) - 後續改善

- 🔧 加入單元測試
- 🔧 改善錯誤處理機制
- 🔧 加入 retry 機制

---

## ✅ 驗證計畫

### 單元測試（Phase 1 修復後）

```bash
# 檢查 TypeScript 編譯
yarn build

# 執行 linter
yarn lint

# 檢查是否有 console 警告
# 預期：無 "findAll() is deprecated" 警告
```

### 整合測試（Phase 2 修復後）

1. 啟動開發伺服器
2. 登入系統
3. 開啟任一藍圖詳情頁面
4. 依序檢查 5 個 Tabs（流程、品質、驗收、財務、安全）
5. 確認資料正常載入或顯示空狀態

### 端對端測試（Phase 3 & 4 修復後）

1. 測試雲端檔案上傳/下載/刪除
2. 測試備份建立/還原
3. 測試施工日誌新增/編輯/刪除
4. 檢查 Console 無錯誤訊息

---

## 📚 參考資料

- [Firebase Firestore 子集合查詢](https://firebase.google.com/docs/firestore/query-data/queries#subcollections)
- [RxJS lastValueFrom](https://rxjs.dev/api/index/function/lastValueFrom)
- [Angular Signals](https://angular.dev/guide/signals)
- [FINAL_PROJECT_STRUCTURE.md](../architecture/FINAL_PROJECT_STRUCTURE.md)

---

**文件狀態**: ✅ 完成  
**下一步**: 執行 Phase 1 修復（Services + Components）
