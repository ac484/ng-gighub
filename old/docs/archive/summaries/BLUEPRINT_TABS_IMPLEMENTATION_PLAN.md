# Blueprint Tabs CRUD Fix - Minimal Implementation Plan

> **版本**: 1.0  
> **日期**: 2025-12-14  
> **策略**: Occam's Razor + KISS + YAGNI  
> **預計工時**: 5-7 小時

---

## 🎯 目標

修復藍圖詳情頁面 7 個 Tabs 的 CRUD 資料顯示問題，使用最小化變更策略。

---

## 📋 工作分解

### Phase 1: Services Load Method Fix (Critical)

**目標**: 修復 24 個 Services 的 `load()` 方法，使其接受 `blueprintId` 參數並呼叫正確的 Repository 方法。

#### 工作項目

| # | 模組 | 檔案數 | 預估時間 |
|---|------|--------|---------|
| 1.1 | Workflow | 5 services | 30 分鐘 |
| 1.2 | QA | 4 services | 25 分鐘 |
| 1.3 | Acceptance | 5 services | 30 分鐘 |
| 1.4 | Finance | 6 services | 35 分鐘 |
| 1.5 | Safety | 4 services | 25 分鐘 |

**小計**: 24 個檔案，約 2.5 小時

#### 修改模板

每個 Service 需要的變更：

**1. 新增 import**:
```typescript
import { lastValueFrom } from 'rxjs';
```

**2. 修改 load() 方法簽名**:
```typescript
// Before
async load(): Promise<void>

// After
async load(blueprintId: string): Promise<void>
```

**3. 修改 Repository 呼叫**:
```typescript
// Before
const result = await this.repository.findAll();

// After
const result = await lastValueFrom(
  this.repository.findByBlueprintId(blueprintId)
);
```

#### 批次執行策略

使用 **Loop Workflow** 批次處理：

```bash
# Step 1: 建立待修改檔案清單
FILES=(
  "src/app/core/blueprint/modules/implementations/workflow/services/approval.service.ts"
  "src/app/core/blueprint/modules/implementations/workflow/services/automation.service.ts"
  # ... (共 24 個檔案)
)

# Step 2: 逐一修改（使用 Loop Workflow）
for file in "${FILES[@]}"; do
  # 修改檔案
  # 驗證 TypeScript 語法
  # 繼續下一個
done

# Step 3: 驗證
yarn lint
yarn build
```

---

### Phase 2: Module View Components Fix (Critical)

**目標**: 修改 5 個 Module View Components 的 `ngOnInit()` 方法，傳入 `blueprintId` 給 Services。

#### 工作項目

| # | 元件 | 子服務數 | 預估時間 |
|---|------|---------|---------|
| 2.1 | workflow-module-view.component.ts | 5 | 10 分鐘 |
| 2.2 | qa-module-view.component.ts | 4 | 8 分鐘 |
| 2.3 | acceptance-module-view.component.ts | 5 | 10 分鐘 |
| 2.4 | finance-module-view.component.ts | 6 | 12 分鐘 |
| 2.5 | safety-module-view.component.ts | 4 | 8 分鐘 |

**小計**: 5 個檔案，約 1 小時

#### 修改模板

每個 Component 的 `ngOnInit()` 方法：

**Before**:
```typescript
ngOnInit(): void {
  this.service1.load();
  this.service2.load();
  this.service3.load();
}
```

**After**:
```typescript
ngOnInit(): void {
  const blueprintId = this.blueprintId();
  
  this.service1.load(blueprintId);
  this.service2.load(blueprintId);
  this.service3.load(blueprintId);
}
```

---

### Phase 3: Cloud Module Error Investigation (High Priority)

**目標**: 調查並修復「載入雲端資料失敗」錯誤。

#### 工作項目

| # | 任務 | 預估時間 |
|---|------|---------|
| 3.1 | 加入詳細 debug 日誌 | 15 分鐘 |
| 3.2 | 測試並確認錯誤類型 | 30 分鐘 |
| 3.3 | 檢查 Firestore 索引與 Rules | 15 分鐘 |
| 3.4 | 修復實際問題 | 30 分鐘 |
| 3.5 | 改善錯誤訊息顯示 | 15 分鐘 |

**小計**: 約 1.5-2 小時

#### 調查步驟

**Step 1: 加入 Debug 日誌**

在 `cloud.repository.ts` 的 `listFiles()` 和 `listBackups()` 中：

```typescript
async listFiles(blueprintId: string): Promise<void> {
  this.logger.debug('[CloudRepository]', 'START listFiles', { blueprintId });
  
  try {
    // ... 查詢邏輯
    this.logger.debug('[CloudRepository]', 'Query result', { count: snapshot.size });
  } catch (error) {
    this.logger.error('[CloudRepository]', 'listFiles ERROR', {
      blueprintId,
      errorCode: (error as any).code,
      errorMessage: (error as any).message,
      error
    });
    throw error;
  }
}
```

**Step 2: 測試並檢查 Console**

1. 開啟藍圖詳情 → 雲端 Tab
2. 開啟 Chrome DevTools Console
3. 檢查錯誤訊息

**可能的錯誤類型**：

| 錯誤代碼 | 原因 | 修復方式 |
|---------|------|---------|
| `permission-denied` | Firestore Rules 限制 | 更新 `firestore.rules` |
| `failed-precondition` | 缺少複合索引 | 更新 `firestore.indexes.json` |
| `not-found` | 集合不存在 | 建立空狀態處理（非錯誤） |
| `invalid-argument` | 查詢參數錯誤 | 檢查欄位名稱 (blueprint_id vs blueprintId) |

**Step 3: 修復方案**

根據錯誤類型選擇對應修復：

**A. 索引問題** → 更新 `firestore.indexes.json`:
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
    },
    {
      "collectionGroup": "cloud_backups",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprint_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**B. 權限問題** → 更新 `firestore.rules`:
```
match /cloud_files/{fileId} {
  allow read, write: if request.auth != null 
    && get(/databases/$(database)/documents/blueprints/$(resource.data.blueprint_id)).data.members[request.auth.uid] != null;
}
```

**C. 欄位名稱問題** → 修改 Repository 查詢:
```typescript
// 檢查實際 Firestore 文件使用的欄位名稱
where('blueprint_id', '==', blueprintId)  // snake_case
// 或
where('blueprintId', '==', blueprintId)   // camelCase
```

---

### Phase 4: Construction Log Error Message Fix (High Priority)

**目標**: 修復「Operation failed」錯誤，改善錯誤訊息顯示。

#### 工作項目

| # | 任務 | 預估時間 |
|---|------|---------|
| 4.1 | 修改 Store 錯誤處理邏輯 | 20 分鐘 |
| 4.2 | 修改 Modal 錯誤處理邏輯 | 15 分鐘 |
| 4.3 | 加入詳細日誌 | 10 分鐘 |
| 4.4 | 測試與驗證 | 15 分鐘 |

**小計**: 約 1 小時

#### 修改清單

**File 1: `construction-log.store.ts`**

```typescript
// ❌ Before
async createLog(request: CreateLogRequest): Promise<Log | null> {
  try {
    const newLog = await this.repository.create(request);
    // ...
    return newLog;
  } catch (error) {
    this._error.set(error.message);
    console.error('Create log error:', error);
    return null; // ❌ 吞掉錯誤
  }
}

// ✅ After
async createLog(request: CreateLogRequest): Promise<Log> {
  try {
    console.log('[ConstructionLogStore] Creating log for blueprint:', request.blueprintId);
    const newLog = await this.repository.create(request);
    console.log('[ConstructionLogStore] Log created successfully:', newLog.id);
    // ...
    return newLog;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create log';
    this._error.set(errorMessage);
    
    // ✅ 詳細錯誤日誌
    console.error('[ConstructionLogStore] Create log failed:', {
      error,
      blueprintId: request.blueprintId,
      errorCode: (error as any).code,
      errorDetails: (error as any).details
    });
    
    // ✅ 重新拋出錯誤
    throw new Error(errorMessage);
  }
}
```

**File 2: `construction-log-modal.component.ts`**

```typescript
// ❌ Before
async submit(): Promise<void> {
  try {
    const log = await this.createLog(formValue);
    if (!log) throw new Error('Operation failed'); // ❌ 通用錯誤
    // ...
  } catch (error) {
    this.message.error(error.message); // ❌ 可能顯示 "Operation failed"
  }
}

// ✅ After
async submit(): Promise<void> {
  this.submitting.set(true);

  try {
    const formValue = this.form.value;
    const log = await this.createLog(formValue); // ✅ 直接拋出錯誤
    
    // Upload photos
    if (this.fileList().length > 0) {
      await this.uploadPhotos(log.id);
    }

    this.message.success('施工日誌建立成功');
    this.modalRef.close({ success: true, log });
  } catch (error) {
    // ✅ 顯示實際錯誤訊息
    const errorMessage = error instanceof Error 
      ? error.message 
      : '建立施工日誌失敗，請檢查網路連線後重試';
    
    this.message.error(errorMessage);
    
    // ✅ 詳細日誌
    console.error('[ConstructionLogModal] Submit failed:', {
      error,
      blueprintId: this.modalData.blueprintId,
      formData: this.form.value
    });
  } finally {
    this.submitting.set(false);
  }
}

// ✅ 簡化 createLog
private async createLog(formValue: any): Promise<Log> {
  const currentUserId = this.firebaseService.getCurrentUserId();
  if (!currentUserId) {
    throw new Error('使用者未登入，請重新登入後再試');
  }

  const request: CreateLogRequest = {
    blueprintId: this.modalData.blueprintId,
    date: this.ensureValidDate(formValue.date),
    title: formValue.title,
    description: formValue.description,
    workHours: formValue.workHours,
    workers: formValue.workers,
    equipment: formValue.equipment,
    weather: formValue.weather,
    temperature: formValue.temperature,
    creatorId: currentUserId
  };

  return this.logStore.createLog(request); // ✅ 直接返回（錯誤會往上拋）
}
```

---

### Phase 5: Testing & Validation (必要)

**目標**: 確保所有修復正常運作且無 regression。

#### 工作項目

| # | 測試類型 | 預估時間 |
|---|---------|---------|
| 5.1 | TypeScript 編譯檢查 | 5 分鐘 |
| 5.2 | ESLint 檢查 | 5 分鐘 |
| 5.3 | 功能測試 (5 Tabs) | 30 分鐘 |
| 5.4 | Cloud Module 測試 | 15 分鐘 |
| 5.5 | Construction Log 測試 | 15 分鐘 |
| 5.6 | Console 錯誤檢查 | 10 分鐘 |

**小計**: 約 1.5 小時

#### 測試腳本

**Step 1: 靜態檢查**

```bash
# TypeScript 編譯
yarn build

# ESLint 檢查
yarn lint

# 預期結果：
# ✅ 無 TypeScript 錯誤
# ✅ 無 ESLint 錯誤
# ✅ 無 "findAll() is deprecated" 警告
```

**Step 2: 功能測試清單**

| 測試項目 | 測試步驟 | 預期結果 | 狀態 |
|---------|---------|---------|------|
| 流程 Tab | 1. 開啟藍圖詳情<br>2. 點擊「流程」Tab | 顯示資料或空狀態 | ⏳ |
| 品質 Tab | 1. 開啟藍圖詳情<br>2. 點擊「品質」Tab | 顯示資料或空狀態 | ⏳ |
| 驗收 Tab | 1. 開啟藍圖詳情<br>2. 點擊「驗收」Tab | 顯示資料或空狀態 | ⏳ |
| 財務 Tab | 1. 開啟藍圖詳情<br>2. 點擊「財務」Tab | 顯示資料或空狀態 | ⏳ |
| 安全 Tab | 1. 開啟藍圖詳情<br>2. 點擊「安全」Tab | 顯示資料或空狀態 | ⏳ |
| 雲端 Tab - 統計 | 1. 開啟藍圖詳情<br>2. 點擊「雲端」Tab | 顯示統計卡片 | ⏳ |
| 雲端 Tab - 上傳 | 1. 點擊「上傳檔案」<br>2. 選擇檔案 | 上傳成功，列表更新 | ⏳ |
| 雲端 Tab - 刪除 | 1. 點擊檔案「刪除」<br>2. 確認刪除 | 刪除成功，列表更新 | ⏳ |
| 雲端 Tab - 備份 | 1. 點擊「建立備份」 | 備份成功，列表更新 | ⏳ |
| 施工日誌 - 新增 | 1. 點擊「新增日誌」<br>2. 填寫表單<br>3. 點擊「新增」 | 建立成功，顯示成功訊息 | ⏳ |
| 施工日誌 - 錯誤 | 1. 模擬錯誤情境 | 顯示明確錯誤訊息（非 "Operation failed"） | ⏳ |

**Step 3: Console 檢查**

開啟 Chrome DevTools Console，執行上述測試，檢查：

- ✅ 無紅色錯誤訊息
- ✅ 無 "findAll() is deprecated" 黃色警告
- ✅ 無 Firestore 權限錯誤
- ✅ 只有正常的 info/debug 日誌

---

## 📊 總時程估算

| Phase | 工作項目 | 預估時間 |
|-------|---------|---------|
| Phase 1 | Services Load Method Fix | 2.5 小時 |
| Phase 2 | Module View Components Fix | 1 小時 |
| Phase 3 | Cloud Module Investigation | 1.5-2 小時 |
| Phase 4 | Construction Log Error Fix | 1 小時 |
| Phase 5 | Testing & Validation | 1.5 小時 |

**總計**: 7-8 小時（單人全職約 1 工作天）

---

## 🚦 風險與緩解

### 風險 1: Repository 方法返回 Observable 而非 Promise

**影響**: Phase 1 所有 Services

**緩解**: 使用 `lastValueFrom()` 轉換
```typescript
import { lastValueFrom } from 'rxjs';
const result = await lastValueFrom(observable);
```

### 風險 2: Cloud Module 問題複雜度未知

**影響**: Phase 3 可能超時

**緩解**: 
- 先加入詳細日誌確認錯誤類型
- 若 2 小時內無法解決，標記為後續調查項目
- 先完成 Phase 1 & 2（核心功能）

### 風險 3: Firestore Rules 或索引修改需要 Firebase Admin 權限

**影響**: Phase 3 修復可能需要等待部署

**緩解**:
- 在本地測試環境（Firebase Emulator）先驗證
- 準備好修改內容，提交給有權限的人員部署

---

## ✅ Definition of Done

### Phase 1 & 2 完成標準

- ✅ 24 個 Services 的 `load()` 方法接受 `blueprintId` 參數
- ✅ 5 個 Module View Components 傳入 `blueprintId`
- ✅ `yarn build` 成功（無 TypeScript 錯誤）
- ✅ `yarn lint` 成功（無 ESLint 錯誤）
- ✅ 無 "findAll() is deprecated" 警告
- ✅ 5 個 Tabs 能正常顯示資料或空狀態

### Phase 3 完成標準

- ✅ 確認雲端模組錯誤的根本原因
- ✅ 修復實際問題（索引/權限/欄位名稱）
- ✅ 雲端 Tab 能正常顯示統計與檔案列表
- ✅ 檔案上傳/下載/刪除功能正常
- ✅ 備份建立/還原功能正常

### Phase 4 完成標準

- ✅ 施工日誌能成功建立
- ✅ 失敗時顯示明確錯誤訊息（非 "Operation failed"）
- ✅ Console 有詳細的 debug 日誌

### Phase 5 完成標準

- ✅ 所有功能測試通過
- ✅ Console 無錯誤訊息
- ✅ 效能測試通過（載入時間 < 2 秒）

---

## 📚 參考資料

- [需求文件](./blueprint-tabs-crud-fix.md)
- [根因分析](./blueprint-tabs-root-cause-analysis.md)
- [RxJS lastValueFrom](https://rxjs.dev/api/index/function/lastValueFrom)
- [Angular Signals](https://angular.dev/guide/signals)
- [Firestore 複合查詢](https://firebase.google.com/docs/firestore/query-data/queries#compound_queries)

---

**計畫狀態**: ✅ 完成  
**開始執行**: ⏳ 待確認
