# GigHub 文件解析流程分析報告

## 概述

本報告詳細分析 GigHub 專案中如何將待解析的文件送給 Google Cloud Document AI 進行處理。

## 架構概覽

```
前端 (Angular)                    後端 (Firebase Functions)              Google Cloud
┌─────────────────┐              ┌──────────────────────┐              ┌──────────────┐
│ Agreement       │              │ functions-ai-        │              │ Document AI  │
│ Service         │─────────────>│ document             │─────────────>│ Processor    │
│                 │   HTTP Call  │                      │  API Call    │              │
│ (agreement.     │              │ processDocument      │              │ OCR/Extract  │
│  service.ts)    │              │ FromStorage          │              │              │
└─────────────────┘              └──────────────────────┘              └──────────────┘
```

---

## 詳細流程分析

### 1. 前端觸發解析 (Angular Service)

**位置**: `src/app/routes/blueprint/modules/agreement/agreement.service.ts`

#### 1.1 初始化 Firebase Functions 客戶端

```typescript
// 在服務初始化時注入 Functions 實例
private readonly functions = inject(Functions);

// 創建可呼叫的 Cloud Function (在依賴注入上下文中創建)
private readonly processDocumentFromStorage = httpsCallable<
  { gcsUri: string; mimeType: string },
  { success: boolean; result: { [key: string]: unknown } }
>(this.functions, 'processDocumentFromStorage');
```

**重點**:
- 使用 `@angular/fire/functions` 的 `httpsCallable` 創建型別安全的函數呼叫
- 在 service 初始化時創建 callable，避免在呼叫時才創建（injection context 問題）
- 定義明確的 TypeScript 型別（請求和回應）

#### 1.2 上傳文件到 Cloud Storage

```typescript
async uploadAttachment(blueprintId: string, agreementId: string, file: File): Promise<string> {
  this._uploading.set(true);
  try {
    // 1. 構建儲存路徑
    const path = `agreements/${agreementId}/${file.name}`;
    
    // 2. 取得 Storage 參考
    const storageRef = this.firebase.storageRef(path);
    
    // 3. 上傳文件
    await uploadBytes(storageRef, file);
    
    // 4. 取得下載 URL
    const url = await getDownloadURL(storageRef);
    
    // 5. 儲存到 Firestore
    await this.repository.saveAttachmentUrl(agreementId, url, path);
    
    // 6. 更新本地狀態
    this._agreements.update(items =>
      items.map(a => (a.id === agreementId ? { ...a, attachmentUrl: url, attachmentPath: path } : a))
    );
    
    return url;
  } finally {
    this._uploading.set(false);
  }
}
```

**關鍵步驟**:
1. 文件先上傳到 Firebase Cloud Storage
2. 儲存路徑格式: `agreements/{agreementId}/{fileName}`
3. 同時儲存下載 URL 和檔案路徑到 Firestore
4. 使用 Angular Signals 管理上傳狀態

#### 1.3 呼叫 Document AI 解析

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  // 1. 驗證必要欄位
  if (!agreement.attachmentUrl || !agreement.attachmentPath) {
    throw new Error('缺少附件，無法解析');
  }

  // 2. 構建 GCS URI (gs://bucket-name/path)
  const storageRef = this.firebase.storageRef(agreement.attachmentPath);
  const bucket: string | undefined = (storageRef as any).bucket;
  const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

  if (!gcsUri) {
    throw new Error('無法取得檔案路徑');
  }

  // 3. 呼叫 Cloud Function 進行文件解析
  const result = await this.processDocumentFromStorage({ 
    gcsUri, 
    mimeType: 'application/pdf' 
  });
  
  // 4. 將解析結果儲存為 JSON 文件
  const jsonString = JSON.stringify(result.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const parsedPath = `agreements/${agreement.id}/parsed.json`;
  const parsedRef = this.firebase.storageRef(parsedPath);
  await uploadBytes(parsedRef, blob);
  const parsedUrl = await getDownloadURL(parsedRef);
  
  // 5. 更新 Firestore 紀錄
  await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);

  // 6. 更新本地狀態
  this._agreements.update(items =>
    items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item))
  );
}
```

**關鍵點**:
- **GCS URI 格式**: `gs://{bucket-name}/{file-path}`
- 從 Storage Reference 提取 bucket 名稱
- 固定使用 `application/pdf` 作為 MIME type
- 解析結果儲存為 JSON 文件方便後續查看
- 儲存路徑: `agreements/{agreementId}/parsed.json`

---

### 2. 後端處理 (Firebase Cloud Functions)

**位置**: `functions-ai-document/src/handlers/process-document-handler.ts`

#### 2.1 函數定義

```typescript
export const processDocumentFromStorage = onCall<ProcessDocumentFromStorageRequest>(
  {
    region: 'asia-east1',
    memory: '2GiB',
    timeoutSeconds: 540,
    maxInstances: 10
  },
  async request => {
    // 處理邏輯
  }
);
```

**配置說明**:
- **region**: `asia-east1` (亞太區域，接近台灣)
- **memory**: 2GB (處理大型文件需要較多記憶體)
- **timeout**: 540秒 (9分鐘，Document AI 可能需要較長時間)
- **maxInstances**: 10 (限制併發實例數)

#### 2.2 環境配置取得

```typescript
// 從環境變數讀取處理器配置
let processorConfig;
try {
  processorConfig = getProcessorConfigFromEnv();
} catch (error) {
  throw new HttpsError('failed-precondition', 
    error instanceof Error ? error.message : 'Failed to get processor configuration'
  );
}
```

**環境變數** (`.env` 文件):
```bash
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

**重要說明**:
- **專案 ID**: 自動從 Firebase 運行時環境取得，無需手動配置
- **認證**: 使用 Application Default Credentials (ADC)，無需服務帳戶金鑰
- **僅需配置**: 處理器位置和處理器 ID

#### 2.3 文件驗證流程

```typescript
// 1. 驗證 GCS URI 格式
const uriValidation = validateGcsUri(gcsUri);
if (!uriValidation.valid) {
  logValidationFailure(gcsUri, uriValidation.reason || 'Invalid GCS URI', { mimeType });
  throw new HttpsError('invalid-argument', uriValidation.reason || 'Invalid GCS URI');
}

// 2. 解析 GCS URI 取得 bucket 和路徑
const { bucket, path: filePath } = parseGcsUri(gcsUri);

// 3. 取得文件 metadata 驗證大小
const bucketRef = admin.storage().bucket(bucket);
const file = bucketRef.file(filePath);
const [metadata] = await file.getMetadata();
const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : metadata.size || 0;

// 4. 驗證文件類型和大小
const validation = validateDocument(mimeType, fileSize);
if (!validation.valid) {
  // 記錄驗證失敗並拋出錯誤
  logValidationFailure(gcsUri, validation.reason || 'Unknown validation error', {
    mimeType,
    fileSize: formatFileSize(fileSize)
  });
  
  // 記錄安全事件
  logSecurityEvent('blocked-document-processing', {
    gcsUri,
    reason: validation.reason,
    mimeType,
    fileSize
  });
  
  throw new HttpsError('invalid-argument', validation.reason || 'Document validation failed');
}
```

**驗證項目**:
1. GCS URI 格式正確性 (`gs://` 開頭)
2. 文件大小限制 (最大 32MB，Document AI 限制)
3. MIME type 支援性
4. 文件存在性

#### 2.4 初始化 Document AI 客戶端

```typescript
// 初始化 Document AI 客戶端
const client = new DocumentProcessorServiceClient({
  apiEndpoint: processorConfig.apiEndpoint || `${processorConfig.location}-documentai.googleapis.com`
});

const processorName = getProcessorName(processorConfig);
// 格式: projects/{projectId}/locations/{location}/processors/{processorId}
```

**關鍵配置**:
- **API Endpoint**: 根據處理器位置動態構建
- **Processor Name**: 完整的資源路徑
- **認證**: 自動使用 Firebase Functions 的 ADC

#### 2.5 呼叫 Document AI API

```typescript
const [result] = await client.processDocument({
  name: processorName,
  gcsDocument: {
    gcsUri,        // gs://bucket/path/to/file.pdf
    mimeType       // application/pdf
  },
  skipHumanReview,
  fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
});

if (!result.document) {
  throw new Error('No document returned from Document AI');
}
```

**請求參數**:
- **name**: 處理器完整名稱
- **gcsDocument**: 指定 Cloud Storage 中的文件
  - **gcsUri**: 文件的 GCS 路徑
  - **mimeType**: 文件類型
- **skipHumanReview**: 跳過人工審核 (預設 true)
- **fieldMask**: 可選，指定要返回的欄位

**重要**: 這裡使用 `gcsDocument` 而非 `rawDocument`，因為文件已上傳到 Cloud Storage

#### 2.6 處理結果轉換

```typescript
// 轉換為標準化結果格式
const duration = Date.now() - startTime;
const processingResult = convertToProcessingResult(result.document, duration, mimeType);
```

**結果結構** (`DocumentProcessingResult`):
```typescript
{
  text: string;                    // 提取的完整文字
  pages?: Array<{                  // 頁面資訊
    pageNumber: number;
    width: number;
    height: number;
    paragraphs?: string[];
    tables?: Array<{
      headerRows: string[][];
      bodyRows: string[][];
    }>;
  }>;
  entities?: Array<{               // 實體提取 (如處理器支援)
    type: string;
    mentionText: string;
    confidence?: number;
    normalizedValue?: string;
  }>;
  formFields?: Array<{             // 表單欄位 (如處理器支援)
    fieldName: string;
    fieldValue: string;
    confidence?: number;
  }>;
  metadata: {
    processorVersion: string;
    processingTime: number;        // 毫秒
    pageCount: number;
    mimeType: string;
  }
}
```

#### 2.7 審計日誌記錄

```typescript
// 記錄成功處理到 Firestore
await logEventToFirestore({
  eventType: 'process_document',
  documentPath: gcsUri,
  mimeType,
  status: 'success',
  timestamp: admin.firestore.Timestamp.now(),
  userId,
  duration,
  metadata: {
    pageCount: processingResult.metadata.pageCount,
    textLength: processingResult.text.length,
    hasEntities: !!processingResult.entities,
    hasFormFields: !!processingResult.formFields
  },
  processorInfo: {
    processorId: processorConfig.processorId,
    location: processorConfig.location,
    projectId: processorConfig.projectId
  }
});
```

**審計日誌位置**: Firestore collection `documentai_events`

---

## 完整資料流程圖

```
使用者操作
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. 前端上傳文件                                              │
│    AgreementService.uploadAttachment()                      │
│    - 上傳到 Cloud Storage: agreements/{id}/{filename}       │
│    - 儲存 URL 和路徑到 Firestore                            │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 前端觸發解析                                              │
│    AgreementService.parseAttachment()                       │
│    - 構建 GCS URI: gs://{bucket}/{path}                     │
│    - 呼叫 Cloud Function                                     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Cloud Function 接收請求                                   │
│    processDocumentFromStorage()                             │
│    - 取得環境配置 (location, processor ID)                  │
│    - 驗證 GCS URI 格式                                       │
│    - 驗證文件大小和類型                                      │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 初始化 Document AI 客戶端                                 │
│    DocumentProcessorServiceClient                           │
│    - API Endpoint: {location}-documentai.googleapis.com     │
│    - 認證: Firebase ADC (自動)                              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 呼叫 Document AI API                                      │
│    client.processDocument()                                 │
│    - name: projects/{project}/locations/{loc}/processors/{id}│
│    - gcsDocument:                                            │
│      - gcsUri: gs://{bucket}/{path}                         │
│      - mimeType: application/pdf                            │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Document AI 處理文件                                      │
│    - 從 Cloud Storage 讀取文件                               │
│    - OCR 文字提取                                            │
│    - 實體識別 (如適用)                                       │
│    - 表單欄位提取 (如適用)                                   │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Cloud Function 處理結果                                   │
│    - 轉換為標準格式 (DocumentProcessingResult)              │
│    - 記錄審計日誌到 Firestore (documentai_events)           │
│    - 返回結果給前端                                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. 前端處理結果                                              │
│    - 將結果序列化為 JSON                                     │
│    - 上傳到 Cloud Storage: agreements/{id}/parsed.json      │
│    - 更新 Firestore 記錄 (parsedJsonUrl)                    │
│    - 更新本地狀態 (Signals)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 關鍵技術細節

### 1. 為何使用 Cloud Storage 而非直接上傳？

**選擇 `gcsDocument` 的原因**:
1. **效能更好**: Document AI 直接從 Cloud Storage 讀取，無需透過網路傳輸完整文件
2. **大小限制**: Cloud Storage 可處理更大的文件
3. **成本效益**: 避免在 Cloud Function 中傳輸大量資料
4. **可靠性**: Cloud Storage 提供持久化儲存

**替代方案** (`rawDocument`):
- 適用於小型文件 (< 20MB)
- 即時處理需求
- 目前專案未使用

### 2. 認證機制

```
Firebase Cloud Functions (ADC)
    ↓
Application Default Credentials
    ↓
自動取得 Google Cloud 服務帳戶憑證
    ↓
Document AI API 授權
```

**優勢**:
- 無需手動管理服務帳戶金鑰
- 自動輪換憑證
- 符合安全最佳實踐
- 簡化部署流程

### 3. 環境配置

**Firebase Functions v7+ 變更**:
- 移除 `firebase functions:config`
- 改用 `.env` 文件
- 部署時自動載入環境變數

**目前配置**:
```bash
# functions-ai-document/.env
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

### 4. 錯誤處理策略

```typescript
try {
  // 處理文件
} catch (error) {
  // 1. 記錄錯誤日誌
  logDocumentOperationFailure(context, error as Error, duration);
  
  // 2. 記錄到 Firestore (審計追蹤)
  await logEventToFirestore({
    eventType: 'process_document',
    status: 'failed',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    // ...
  });
  
  // 3. 轉換為 HttpsError 返回給前端
  if (error instanceof HttpsError) {
    throw error;
  }
  throw new HttpsError('internal', error instanceof Error ? error.message : 'Failed to process document');
}
```

**錯誤類型**:
- `invalid-argument`: 無效的請求參數
- `failed-precondition`: 缺少配置
- `permission-denied`: 認證失敗
- `not-found`: 文件不存在
- `internal`: 內部錯誤

---

## 支援的文件類型

| MIME Type | 副檔名 | 描述 | 專案使用 |
|-----------|--------|------|----------|
| `application/pdf` | .pdf | PDF 文件 | ✅ 是 |
| `image/jpeg` | .jpg, .jpeg | JPEG 圖片 | ❌ 否 |
| `image/png` | .png | PNG 圖片 | ❌ 否 |
| `image/gif` | .gif | GIF 圖片 | ❌ 否 |
| `image/bmp` | .bmp | BMP 圖片 | ❌ 否 |
| `image/tiff` | .tiff, .tif | TIFF 圖片 | ❌ 否 |
| `image/webp` | .webp | WebP 圖片 | ❌ 否 |

**目前限制**:
- 前端硬編碼使用 `application/pdf`
- 未支援其他文件類型
- 未從文件本身偵測 MIME type

---

## 限制與配額

### Document AI 限制
- **文件大小**: 最大 32MB
- **處理時間**: 依文件大小和複雜度
- **批次處理**: 最大 500 份文件

### Cloud Functions 限制
- **記憶體**: 2GB
- **超時時間**: 540 秒 (9 分鐘)
- **併發實例**: 10 個

### Cloud Storage 限制
- **上傳大小**: 依 Firebase 專案配額
- **讀取速度**: 依網路頻寬

---

## 審計與監控

### Firestore 審計日誌

**Collection**: `documentai_events`

**文件結構**:
```typescript
{
  eventType: 'process_document',
  documentPath: 'gs://bucket/agreements/xyz/file.pdf',
  mimeType: 'application/pdf',
  status: 'success' | 'failed' | 'pending',
  timestamp: Timestamp,
  errorMessage?: string,
  userId: 'user-123',
  duration: 1234,                // 毫秒
  metadata: {
    pageCount: 5,
    textLength: 10000,
    hasEntities: true,
    hasFormFields: false
  },
  processorInfo: {
    processorId: 'd8cd080814899dc4',
    location: 'us',
    projectId: 'gighub-project'
  }
}
```

### Cloud Functions 日誌

**查看方式**:
```bash
# Firebase CLI
firebase functions:log --only processDocumentFromStorage

# Google Cloud Console
https://console.cloud.google.com/logs/query
```

**日誌內容**:
- 操作開始/成功/失敗
- 驗證失敗
- 安全事件
- 處理時間和效能指標

---

## 成本考量

### Document AI 計費
- **依頁數計費**: 每頁約 $0.0015 - $0.015 (依處理器類型)
- **免費額度**: 每月前 1,000 頁免費

### Cloud Functions 計費
- **執行時間**: 依記憶體和執行時間
- **網路傳輸**: 下載 Cloud Storage 文件
- **免費額度**: 每月 2M 次呼叫

### Cloud Storage 計費
- **儲存**: 依儲存大小
- **操作**: 讀取、寫入次數
- **網路傳輸**: 下載流量

---

## 優化建議

### 1. 效能優化
```typescript
// 建議: 使用批次處理
export const batchProcessDocuments = onCall<BatchProcessDocumentsRequest>(...);

// 目前: 每次只處理一份文件
// 改進: 一次處理多份合約文件
```

### 2. MIME Type 偵測
```typescript
// 建議: 從文件自動偵測 MIME type
async uploadAttachment(file: File) {
  const mimeType = file.type;  // 使用實際文件類型
  // 而非硬編碼 'application/pdf'
}
```

### 3. 結果快取
```typescript
// 建議: 快取解析結果避免重複處理
async parseAttachment(agreement: Agreement) {
  if (agreement.parsedJsonUrl) {
    // 已經解析過，直接返回
    return;
  }
  // 進行解析...
}
```

### 4. 錯誤重試
```typescript
// 建議: 實作指數退避重試
async parseAttachmentWithRetry(agreement: Agreement, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.parseAttachment(agreement);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
```

---

## 安全考量

### 1. 文件驗證
- ✅ 驗證 GCS URI 格式
- ✅ 驗證文件大小
- ✅ 驗證 MIME type
- ⚠️ 未驗證文件內容 (病毒掃描)

### 2. 存取控制
- ✅ Firebase Authentication 必須
- ✅ Firestore Security Rules
- ✅ Cloud Storage Security Rules
- ⚠️ 未實作角色權限檢查

### 3. 資料隱私
- ✅ 審計日誌記錄操作
- ✅ 使用 ADC 避免憑證外洩
- ⚠️ 解析結果未加密儲存

---

## 總結

### 核心流程
1. **文件上傳**: Angular → Cloud Storage (`agreements/{id}/{file}`)
2. **觸發解析**: Angular → Cloud Function (傳遞 GCS URI)
3. **Document AI**: Cloud Function → Document AI API (gcsDocument)
4. **結果儲存**: Cloud Function → Angular → Cloud Storage (`parsed.json`)
5. **審計追蹤**: 所有操作記錄到 Firestore (`documentai_events`)

### 技術亮點
- ✅ 使用 `gcsDocument` 而非 `rawDocument` (效能更佳)
- ✅ 自動認證 (ADC)，無需管理金鑰
- ✅ 完整的審計日誌
- ✅ 型別安全 (TypeScript)
- ✅ 錯誤處理和日誌記錄

### 改進空間
- ⚠️ 支援多種文件格式 (目前僅 PDF)
- ⚠️ 批次處理優化
- ⚠️ 結果快取機制
- ⚠️ 更細緻的權限控制
- ⚠️ 文件內容安全掃描

---

## 參考資料

### 專案檔案
- 前端服務: `src/app/routes/blueprint/modules/agreement/agreement.service.ts`
- Cloud Function: `functions-ai-document/src/handlers/process-document-handler.ts`
- 型別定義: `functions-ai-document/src/types/index.ts`
- 說明文件: `functions-ai-document/README.md`

### 官方文件
- [Document AI API](https://cloud.google.com/document-ai/docs)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Angular Fire](https://github.com/angular/angularfire)

---

**報告日期**: 2025-12-20  
**專案版本**: Angular 20.3.x, Firebase 20.0.x  
**分析者**: GitHub Copilot with Context7
