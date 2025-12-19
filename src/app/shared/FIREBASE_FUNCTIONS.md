# Firebase Functions Integration Components

Firebase Functions 整合元件 - 用於合約模組的 Firebase Functions 呼叫

## 📋 概述

此目錄包含 4 個 Standalone Angular 元件，用於呼叫 Firebase Functions:

1. **AI Document Processor** - 文件 AI 解析 (`functions-ai-document`)
2. **Storage Manager** - 檔案儲存管理 (`functions-storage`)
3. **Firestore Operations** - Firestore 操作 (`functions-firestore`)
4. **AI Generator** - AI 內容生成 (`functions-ai`)

## 🎯 元件清單

### 1. AiDocumentProcessorComponent

**檔案**: `ai-document-processor.component.ts`

**功能**:
- 從 Cloud Storage 解析文件 (GCS URI)
- 上傳文件並解析 (base64 content)
- 批次處理多個文件
- 顯示提取的文字、實體、表單欄位

**使用方式**:
```typescript
import { AiDocumentProcessorComponent } from './contract';

@Component({
  imports: [AiDocumentProcessorComponent],
  template: `<app-ai-document-processor />`
})
```

**呼叫的 Functions**:
- `processDocumentFromStorage` - 從 Storage 處理文件
- `processDocumentFromContent` - 從 base64 處理文件
- `batchProcessDocuments` - 批次處理文件

### 2. StorageManagerComponent

**檔案**: `storage-manager.component.ts`

**功能**:
- 拖放上傳檔案到 Firebase Storage
- 即時上傳進度追蹤
- 檔案驗證 (大小、類型)
- 更新檔案 metadata (描述、標籤、分類)

**使用方式**:
```typescript
import { StorageManagerComponent } from './contract';

@Component({
  imports: [StorageManagerComponent],
  template: `<app-storage-manager />`
})
```

**呼叫的 Functions**:
- `updateFileMetadata` - 更新檔案 metadata

**Firebase Storage 操作**:
- 直接上傳到 Firebase Storage (使用 `@angular/fire/storage`)
- 監控上傳進度
- 取得下載 URL

### 3. FirestoreOperationsComponent

**檔案**: `firestore-operations.component.ts`

**功能**:
- 建立任務 (title, description, priority)
- 列出所有任務
- 更新任務詳情
- 刪除任務 (軟刪除)

**使用方式**:
```typescript
import { FirestoreOperationsComponent } from './contract';

@Component({
  imports: [FirestoreOperationsComponent],
  template: `<app-firestore-operations />`
})
```

**呼叫的 Functions**:
- `createTask` - 建立任務
- `updateTask` - 更新任務
- `deleteTask` - 刪除任務
- `listTasks` - 列出任務

### 4. AiGeneratorComponent

**檔案**: `ai-generator.component.ts`

**功能**:
- 簡單文字生成 (Gemini API)
- 進階內容生成 (自訂參數)
- 多模型選擇 (Gemini 2.5 Flash/Pro, 2.0 Flash)
- Token 使用追蹤
- 對話歷史記錄

**使用方式**:
```typescript
import { AiGeneratorComponent } from './contract';

@Component({
  imports: [AiGeneratorComponent],
  template: `<app-ai-generator />`
})
```

**呼叫的 Functions**:
- `genai-generateText` - 簡單文字生成
- `genai-generateContent` - 進階內容生成

## 🔧 技術細節

### TypeScript 類型定義

所有元件使用完整的 TypeScript 類型定義 (在 `types/firebase-functions.types.ts`):

```typescript
// AI Document Types
interface ProcessDocumentFromStorageRequest { ... }
interface ProcessDocumentResponse { ... }
interface DocumentProcessingResult { ... }

// Storage Types
interface UpdateFileMetadataRequest { ... }
interface UpdateFileMetadataResponse { ... }

// Firestore Types
interface CreateTaskRequest { ... }
interface Task { ... }
interface FirestoreOperationResponse<T> { ... }

// AI Generation Types
interface GenerateContentRequest { ... }
interface GenerateContentResponse { ... }
```

### Angular 20 現代化模式

所有元件遵循最新 Angular 20 最佳實踐:

```typescript
@Component({
  standalone: true,                          // ✅ Standalone Component
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ OnPush
  imports: [SHARED_IMPORTS, ...],           // ✅ 直接導入
})
export class ExampleComponent {
  private functions = inject(Functions);    // ✅ inject() DI
  loading = signal(false);                  // ✅ Signals
  
  async callFunction() {
    const callable = httpsCallable<Req, Res>(  // ✅ 類型安全
      this.functions, 
      'functionName'
    );
    const result = await callable(request);
  }
}
```

### Firebase Functions 呼叫模式

```typescript
import { Functions, httpsCallable } from '@angular/fire/functions';

// 1. Inject Functions service
private functions = inject(Functions);

// 2. Create typed callable
const callable = httpsCallable<RequestType, ResponseType>(
  this.functions,
  'functionName'
);

// 3. Call function
try {
  const result = await callable(requestData);
  // Handle success
} catch (error) {
  // Handle error
}
```

## 🚀 使用指南

### 前置需求

1. **Firebase Functions 已部署**:
   ```bash
   firebase deploy --only functions
   ```

2. **Firebase 配置**:
   - `app.config.ts` 包含 `provideFunctions()`
   - Firebase Authentication 已設定

3. **本地開發** (使用 Emulator):
   ```bash
   firebase emulators:start --only functions
   ```

### 整合到合約模組

在 `contract-module-view.component.ts` 中:

```typescript
import {
  AiDocumentProcessorComponent,
  StorageManagerComponent,
  FirestoreOperationsComponent,
  AiGeneratorComponent
} from './contract';

@Component({
  imports: [
    SHARED_IMPORTS,
    AiDocumentProcessorComponent,
    StorageManagerComponent,
    FirestoreOperationsComponent,
    AiGeneratorComponent
  ],
  template: `
    <nz-tabset>
      <nz-tab nzTitle="AI 文件解析">
        <app-ai-document-processor />
      </nz-tab>
      
      <nz-tab nzTitle="檔案管理">
        <app-storage-manager />
      </nz-tab>
      
      <nz-tab nzTitle="任務操作">
        <app-firestore-operations />
      </nz-tab>
      
      <nz-tab nzTitle="AI 生成">
        <app-ai-generator />
      </nz-tab>
    </nz-tabset>
  `
})
```

## 🔒 安全性

### Firebase Authentication

所有 Functions 都需要 Firebase Authentication:

```typescript
// Functions 會自動檢查 auth
// 如果未認證，會拋出 'unauthenticated' 錯誤
```

### 錯誤處理

元件包含完整的錯誤處理:

```typescript
try {
  const result = await callable(request);
  if (result.data.success) {
    // 成功處理
  } else {
    // 業務邏輯錯誤
    this.message.error(result.data.error?.message);
  }
} catch (error: any) {
  // Firebase/Network 錯誤
  console.error('Function call error:', error);
  this.message.error(error.message || '呼叫失敗');
}
```

### 權限管理

- **functions-ai-document**: 需要文件讀取權限
- **functions-storage**: 需要 Storage 寫入權限
- **functions-firestore**: 根據 Firestore Security Rules
- **functions-ai**: 需要 AI API 權限

## 📊 效能考量

### Loading States

所有元件都使用 Signals 管理 loading 狀態:

```typescript
loading = signal(false);

async someOperation() {
  this.loading.set(true);
  try {
    // Operation
  } finally {
    this.loading.set(false);
  }
}
```

### 檔案大小限制

- **Storage Manager**: 最大 100MB per file
- **Document Processor**: 最大 32MB (Document AI limit)

### Token 使用追蹤

AI Generator 元件追蹤 Token 使用:

```typescript
usageMetadata = signal<{
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
} | null>(null);
```

## 🧪 測試

### 單元測試

```typescript
describe('AiDocumentProcessorComponent', () => {
  it('should call processDocumentFromStorage', async () => {
    // Mock Functions
    // Test component
  });
});
```

### 整合測試

```bash
# 啟動 Firebase Emulator
firebase emulators:start --only functions

# 在瀏覽器測試
npm start
```

## 📚 參考資料

- **Firebase Functions 文檔**:
  - `functions-ai-document/README.md`
  - `functions-storage/README.md`
  - `functions-firestore/README.md`
  - `functions-ai/README.md`

- **Angular Fire 文檔**:
  - [AngularFire Functions](https://github.com/angular/angularfire/blob/main/docs/functions.md)

- **Context7 查詢結果**:
  - Angular Fire `httpsCallable` API 驗證

## ❓ 常見問題

### Q: 如何測試 Functions?

使用 Firebase Emulator:
```bash
firebase emulators:start --only functions
```

### Q: 錯誤: "Function not found"

確認 Functions 已部署:
```bash
firebase deploy --only functions
```

### Q: 錯誤: "Unauthenticated"

確認已登入 Firebase Authentication:
```typescript
import { getAuth } from '@angular/fire/auth';
const auth = getAuth();
// 登入邏輯
```

### Q: 如何自訂 Function 區域?

在 `app.config.ts`:
```typescript
import { getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';

provideFunctions(() => {
  const functions = getFunctions(getApp(), 'asia-east1');
  // 本地開發
  if (environment.useEmulator) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
  return functions;
})
```

## 🔄 版本歷史

- **v1.0.0** (2025-12-18) - 初始版本
  - 4 個 Firebase Functions 整合元件
  - 完整 TypeScript 類型定義
  - Angular 20 現代化模式

## 👥 維護者

GigHub Development Team

---

**最後更新**: 2025-12-18  
**Angular 版本**: 20.3.x  
**Firebase 版本**: 20.0.1
