# Document AI 權限設定與問題排查指南

## 📋 Firebase 專案服務帳戶所需權限

### 推薦權限配置

根據 Google Cloud Document AI 官方文件和實際使用情境，**推薦使用以下權限**：

```
🎯 推薦: Document AI API 使用者 (roles/documentai.apiUser)
```

### 權限比較表

| 角色 | 權限範圍 | 適用情境 | 推薦度 |
|------|---------|---------|--------|
| **Document AI API 使用者** | 僅文件處理 | 生產環境 (最小權限原則) | ✅ **推薦** |
| Document AI 檢視器 | 檢視 + 文件處理 | 需要查看資源 | ⚠️ 可用 |
| Document AI 編輯器 | 使用所有資源 | 管理處理器 | ❌ 過度授權 |
| Document AI 管理員 | 完整存取 | 開發/測試環境 | ❌ 過度授權 |

### 詳細說明

#### 1. Document AI API 使用者 (`roles/documentai.apiUser`) ✅ 推薦

**包含的權限**:
```
documentai.humanReviewConfigs.get
documentai.humanReviewConfigs.list
documentai.locations.get
documentai.locations.list
documentai.operations.get
documentai.processors.get
documentai.processors.list
documentai.processors.process        # ← 核心權限：處理文件
documentai.processors.processBatch
```

**為何推薦**:
- ✅ 符合**最小權限原則** (Principle of Least Privilege)
- ✅ 僅授予文件處理所需的權限
- ✅ 無法修改或刪除處理器設定
- ✅ 適合生產環境部署
- ✅ 降低安全風險

**適用場景**:
```typescript
// ✅ 可執行的操作
await client.processDocument({ name, gcsDocument });     // ✓ 處理文件
await client.batchProcessDocuments({ name, inputDocuments }); // ✓ 批次處理
await client.getProcessor({ name });                     // ✓ 取得處理器資訊

// ❌ 無法執行的操作
await client.createProcessor(...);    // ✗ 無法建立處理器
await client.deleteProcessor(...);    // ✗ 無法刪除處理器
await client.enableProcessor(...);    // ✗ 無法啟用/停用處理器
```

#### 2. Document AI 檢視器 (`roles/documentai.viewer`) ⚠️ 可用

**額外權限**:
- 可檢視所有 Document AI 資源
- 包含 `roles/documentai.apiUser` 的所有權限
- 可查看處理器配置和版本資訊

**使用時機**:
- 需要查看處理器詳細配置
- 需要監控和除錯

#### 3. Document AI 編輯器 (`roles/documentai.editor`) ❌ 過度授權

**額外權限**:
- 可修改處理器配置
- 可訓練和評估自訂模型
- 可管理人工審核設定

**問題**:
- ❌ 違反最小權限原則
- ❌ 生產環境安全風險過高
- ❌ 服務可能被誤操作修改

#### 4. Document AI 管理員 (`roles/documentai.admin`) ❌ 過度授權

**額外權限**:
- 可建立/刪除處理器
- 可管理所有 Document AI 資源
- 完整的管理權限

**問題**:
- ❌ 嚴重違反最小權限原則
- ❌ 可能導致意外刪除處理器
- ❌ 僅適合開發/測試環境

---

## 🔧 如何設定 IAM 權限

### 方法 1: Google Cloud Console (推薦)

1. 前往 [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. 找到 Firebase 服務帳戶:
   ```
   your-project-id@appspot.gserviceaccount.com
   ```
3. 點擊「編輯主體」(Edit principal)
4. 點擊「新增其他角色」
5. 選擇 **Document AI API 使用者** (`roles/documentai.apiUser`)
6. 點擊「儲存」

### 方法 2: gcloud CLI

```bash
# 設定專案 ID
PROJECT_ID="your-project-id"

# Firebase 服務帳戶
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# 授予 Document AI API 使用者權限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/documentai.apiUser"

# 驗證權限設定
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)"
```

### 方法 3: Terraform

```hcl
resource "google_project_iam_member" "firebase_documentai" {
  project = var.project_id
  role    = "roles/documentai.apiUser"
  member  = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}
```

---

## 🐛 問題排查：500 Internal Server Error

### 問題描述

**症狀**:
- Console 顯示：`POST https://asia-east1-xxx.cloudfunctions.net/processDocumentFromStorage 500 (Internal Server Error)`
- 小文件（150KB）也無法處理
- 錯誤發生在呼叫 Cloud Function 時，不是超時問題

### 根本原因：Cloud Function 環境變數未設定（已解決：使用硬編碼預設值）

#### 問題分析

**✅ 最新版本已包含硬編碼預設值**，無需設定環境變數即可運作：
- `DOCUMENTAI_LOCATION`: 預設為 `us`
- `DOCUMENTAI_PROCESSOR_ID`: 預設為 `d8cd080814899dc4`

如果您看到 500 錯誤，現在更可能是 **IAM 權限問題**，而非環境變數問題。

#### 檢查 IAM 權限（最重要）

```bash
# 授予 Document AI API 使用者權限
gcloud projects add-iam-policy-binding elite-chiller-455712-c4 \
  --member="serviceAccount:elite-chiller-455712-c4@appspot.gserviceaccount.com" \
  --role="roles/documentai.apiUser"
```

#### 可選：覆寫硬編碼的預設值

如果需要使用不同的處理器或區域，可以透過環境變數覆寫預設值：

**方法 1: 使用 .env 檔案（推薦用於開發）**

1. 在 `functions-ai-document/` 目錄創建 `.env` 檔案:
```bash
cd functions-ai-document
cp .env.example .env
```

2. 編輯 `.env` 檔案:
```env
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

3. 重新部署 Cloud Function:
```bash
firebase deploy --only functions:processDocumentFromStorage
```

**方法 2: 使用 Firebase CLI 設定環境變數（推薦用於生產）**

```bash
# 設定環境變數
firebase functions:config:set \
  documentai.location="us" \
  documentai.processor_id="d8cd080814899dc4"

# 查看當前配置
firebase functions:config:get

# 重新部署 Cloud Function
firebase deploy --only functions:processDocumentFromStorage
```

**注意**: 如使用 `functions:config`，需在程式碼中讀取 `functions.config().documentai`

**方法 3: 使用 Google Cloud Console 設定環境變數**

1. 前往 [Cloud Functions Console](https://console.cloud.google.com/functions/list)
2. 找到 `processDocumentFromStorage` 函式
3. 點擊「編輯」
4. 在「執行階段環境變數」區段新增:
   - `DOCUMENTAI_LOCATION` = `us`
   - `DOCUMENTAI_PROCESSOR_ID` = `d8cd080814899dc4`
5. 點擊「部署」

#### 驗證設定

```bash
# 1. 檢查環境變數是否設定
firebase functions:config:get

# 2. 查看 Cloud Function 日誌
firebase functions:log --only processDocumentFromStorage

# 3. 測試解析功能
# 上傳小檔案（< 1MB）並嘗試解析
# 如果仍然失敗，檢查日誌查看具體錯誤訊息
```

---

## 🐛 問題排查：解析顯示「解析中」後變回「未解析」

### 問題描述

**症狀**:
- 點擊「解析」按鈕後顯示「解析中...」
- 經過一段時間後（約 70 秒）自動變回「未解析」
- Console 顯示錯誤：`deadline-exceeded`

### 根本原因：實際上不是超時問題

#### 問題分析

**重要**: 如果您看到 `deadline-exceeded` 錯誤，但文件很小（例如 150KB），這**不是**真正的超時問題。真正的問題通常是：

1. **Cloud Function 配置錯誤** (500 錯誤) → 表現為超時
2. **環境變數未設定** → Cloud Function 無法啟動
3. **IAM 權限不足** → Document AI API 呼叫失敗

**正常處理時間**:
```
小文件 (< 1MB, < 10 頁):   10-30 秒
中型文件 (1-5MB, 10-30 頁): 30-60 秒
大型文件 (5-32MB, 30-50 頁): 60-120 秒
```

**如果超過 2 分鐘仍未完成，這不是正常情況**，請檢查：

#### 排查步驟

**步驟 1: 檢查後端日誌（最重要）**

```bash
firebase functions:log --only processDocumentFromStorage --limit 20
```

常見錯誤訊息：
```
❌ Missing DOCUMENTAI_LOCATION environment variable
   → 解決：設定環境變數

❌ Missing DOCUMENTAI_PROCESSOR_ID environment variable
   → 解決：設定環境變數

❌ 7 PERMISSION_DENIED: The caller does not have permission
   → 解決：授予 roles/documentai.apiUser 權限

❌ Processor projects/.../processors/xxx not found
   → 解決：檢查處理器 ID 是否正確
```

**步驟 2: 確認環境變數已設定**

請參考上方「500 Internal Server Error」章節設定環境變數。

**步驟 3: 檢查 IAM 權限**

請參考本文檔開頭的「Firebase 專案服務帳戶所需權限」章節。

#### 解決方案

**已設定合理的客戶端超時**: 120 秒（2 分鐘）

```typescript
private readonly processDocumentFromStorage = httpsCallable<
  { gcsUri: string; mimeType: string },
  { success: boolean; result: { [key: string]: unknown } }
>(this.functions, 'processDocumentFromStorage', { 
  timeout: 120000  // ✅ 設定為 120 秒（2 分鐘）
});
```

這個超時設定對於正常文件（< 32MB, < 50 頁）已經足夠。如果超時，通常表示後端有問題，而不是文件太大。

**如果看到 deadline-exceeded 錯誤**:

1. **首先檢查後端日誌** - 這是最重要的步驟
2. **確認環境變數已設定** - 檢查 DOCUMENTAI_LOCATION 和 DOCUMENTAI_PROCESSOR_ID
3. **檢查 IAM 權限** - 確認服務帳戶有 roles/documentai.apiUser
4. **確認處理器 ID 正確** - 應該是 `d8cd080814899dc4`

---

## 🐛 問題排查：解析按鈕變灰但無錯誤訊息

### 問題描述

**症狀**:
- 點擊「解析」按鈕後沒有錯誤訊息
- 解析按鈕變成灰色 (disabled)
- 但實際上沒有完成解析

### 根本原因分析

#### 1. 錯誤被靜默吞沒

**目前程式碼** (`agreement-module-view.component.ts`):

```typescript
async parse(agreement: Agreement): Promise<void> {
  this.parsingId.set(agreement.id);           // ← 設定為解析中
  try {
    await this.agreementService.parseAttachment(agreement);
    this.messageService.success('解析完成');
  } catch (error) {
    this.messageService.error('解析失敗');     // ← 只顯示簡單錯誤
    console.error('[AgreementModuleView]', 'parse failed', error);
  } finally {
    this.parsingId.set(null);                  // ← 恢復按鈕狀態
  }
}
```

**問題**:
1. `parsingId` 設定為 `agreement.id` 時，按鈕變灰
2. 如果 `parseAttachment()` 拋出錯誤，進入 `catch` 區塊
3. `finally` 區塊將 `parsingId` 設定為 `null`，按鈕恢復
4. **BUT**: 如果 `parseAttachment()` 內部有未被捕獲的 Promise rejection，`finally` 可能不會執行

#### 2. Service 層缺少錯誤處理

**目前程式碼** (`agreement.service.ts`):

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  if (!agreement.attachmentUrl || !agreement.attachmentPath) {
    throw new Error('缺少附件，無法解析');
  }

  const storageRef = this.firebase.storageRef(agreement.attachmentPath);
  const bucket: string | undefined = (storageRef as any).bucket;
  const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

  if (!gcsUri) {
    throw new Error('無法取得檔案路徑');
  }

  // ⚠️ 這裡沒有 try-catch，如果 Cloud Function 呼叫失敗會直接拋出
  const result = await this.processDocumentFromStorage({ gcsUri, mimeType: 'application/pdf' });
  
  // ⚠️ 後續操作也沒有錯誤處理
  const jsonString = JSON.stringify(result.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const parsedPath = `agreements/${agreement.id}/parsed.json`;
  const parsedRef = this.firebase.storageRef(parsedPath);
  await uploadBytes(parsedRef, blob);
  const parsedUrl = await getDownloadURL(parsedRef);
  await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);

  this._agreements.update(items =>
    items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item))
  );
}
```

**潛在錯誤點**:
1. ❌ `processDocumentFromStorage()` 呼叫失敗 (權限、網路、Cloud Function 錯誤)
2. ❌ `uploadBytes()` 失敗 (Storage 權限、配額)
3. ❌ `getDownloadURL()` 失敗
4. ❌ `repository.saveParsedJsonUrl()` 失敗 (Firestore 權限、網路)

#### 3. Cloud Function 錯誤未正確傳遞

**可能的 Cloud Function 錯誤**:

```typescript
// Firebase Functions HttpsError
{
  code: 'failed-precondition',
  message: 'Missing required environment variable: DOCUMENTAI_PROCESSOR_ID'
}

// 或權限錯誤
{
  code: 'permission-denied',
  message: 'The caller does not have permission'
}

// 或處理器錯誤
{
  code: 'invalid-argument',
  message: 'Invalid GCS URI format'
}
```

---

## 🔍 診斷步驟

### 步驟 1: 檢查瀏覽器開發者工具

**Console 日誌**:
```javascript
// 開啟 Chrome DevTools (F12)
// 查看 Console 標籤
// 尋找 [AgreementModuleView] parse failed

// 預期看到的錯誤格式:
[AgreementModuleView] parse failed Error: {...}
```

**Network 標籤**:
```
1. 開啟 Network 標籤
2. 點擊「解析」按鈕
3. 查找對 Cloud Function 的請求:
   - URL: https://asia-east1-{project-id}.cloudfunctions.net/processDocumentFromStorage
   - Method: POST
   - Status: 200 (成功) 或 4xx/5xx (失敗)
4. 點擊請求查看 Response 內容
```

### 步驟 2: 檢查 Cloud Function 日誌

```bash
# 方法 1: Firebase CLI
firebase functions:log --only processDocumentFromStorage --limit 50

# 方法 2: Google Cloud Console
# 前往: https://console.cloud.google.com/logs/query
# 查詢條件:
resource.type="cloud_function"
resource.labels.function_name="processDocumentFromStorage"
severity>=ERROR
```

**常見錯誤訊息**:

```
# 500 Internal Server Error（最常見）
Error: POST https://xxx.cloudfunctions.net/processDocumentFromStorage 500
原因: Cloud Function 啟動失敗，通常是環境變數未設定
解決方案: 設定 DOCUMENTAI_LOCATION=us 和 DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
檢查: firebase functions:log --only processDocumentFromStorage

# 環境變數錯誤
Error: Missing required environment variable: DOCUMENTAI_PROCESSOR_ID
原因: Cloud Function 環境變數未設定
解決方案: 設定環境變數（參考本文檔「500 Internal Server Error」章節）

# 權限錯誤
Error: 7 PERMISSION_DENIED: The caller does not have permission
原因: Firebase 服務帳戶缺少 Document AI 權限
解決方案: 授予 roles/documentai.apiUser 角色

# 處理器不存在
Error: Processor projects/xxx/locations/us/processors/xxx not found
原因: 處理器 ID 錯誤或處理器未建立
解決方案: 檢查處理器 ID 是否為 d8cd080814899dc4

# 超時錯誤（罕見）
Error: deadline-exceeded
原因: 通常不是真正的超時，而是後端錯誤偽裝成超時
解決方案: 檢查後端日誌查看真正的錯誤原因

# GCS URI 錯誤
Error: Invalid GCS URI format
原因: 文件路徑格式錯誤
解決方案: 確認 GCS URI 格式為 gs://bucket/path
```

### 步驟 3: 檢查環境變數

```bash
# 檢查 functions-ai-document/.env 檔案
cd functions-ai-document
cat .env

# 預期內容:
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4

# 確認檔案存在且格式正確
```

### 步驟 4: 測試 Cloud Function 直接呼叫

```typescript
// 在瀏覽器 Console 中執行
const functions = getFunctions();
const processDoc = httpsCallable(functions, 'processDocumentFromStorage');

processDoc({
  gcsUri: 'gs://your-bucket/agreements/test/file.pdf',
  mimeType: 'application/pdf'
})
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### 步驟 5: 檢查 IAM 權限

```bash
# 檢查服務帳戶權限
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --format="table(bindings.role)"

# 預期輸出應包含:
# roles/documentai.apiUser
```

---

## 💡 解決方案

### 解決方案 1: 增強錯誤處理和日誌記錄

#### 修改 `agreement.service.ts`:

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  console.log('[AgreementService] Starting parseAttachment', { 
    agreementId: agreement.id,
    hasAttachmentUrl: !!agreement.attachmentUrl,
    hasAttachmentPath: !!agreement.attachmentPath 
  });

  if (!agreement.attachmentUrl || !agreement.attachmentPath) {
    const error = new Error('缺少附件，無法解析');
    console.error('[AgreementService] Validation failed', error);
    throw error;
  }

  try {
    // 構建 GCS URI
    const storageRef = this.firebase.storageRef(agreement.attachmentPath);
    const bucket: string | undefined = (storageRef as any).bucket;
    const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

    console.log('[AgreementService] GCS URI constructed', { gcsUri, bucket });

    if (!gcsUri) {
      throw new Error('無法取得檔案路徑');
    }

    // 呼叫 Cloud Function
    console.log('[AgreementService] Calling processDocumentFromStorage', { gcsUri });
    const result = await this.processDocumentFromStorage({ 
      gcsUri, 
      mimeType: 'application/pdf' 
    });
    
    console.log('[AgreementService] Document AI processing completed', { 
      success: result.data.success,
      hasResult: !!result.data.result 
    });

    // 儲存解析結果
    const jsonString = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const parsedPath = `agreements/${agreement.id}/parsed.json`;
    
    console.log('[AgreementService] Uploading parsed result', { parsedPath });
    const parsedRef = this.firebase.storageRef(parsedPath);
    await uploadBytes(parsedRef, blob);
    
    const parsedUrl = await getDownloadURL(parsedRef);
    console.log('[AgreementService] Parsed JSON uploaded', { parsedUrl });

    await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);
    console.log('[AgreementService] Repository updated');

    // 更新本地狀態
    this._agreements.update(items =>
      items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item))
    );

    console.log('[AgreementService] Parse completed successfully');
  } catch (error) {
    console.error('[AgreementService] Parse failed', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      errorDetails: (error as any)?.details
    });
    throw error; // 重新拋出以便 UI 層處理
  }
}
```

#### 修改 `agreement-module-view.component.ts`:

```typescript
async parse(agreement: Agreement): Promise<void> {
  console.log('[AgreementModuleView] Starting parse', { agreementId: agreement.id });
  
  this.parsingId.set(agreement.id);
  try {
    await this.agreementService.parseAttachment(agreement);
    this.messageService.success('解析完成');
    console.log('[AgreementModuleView] Parse successful');
  } catch (error) {
    // 顯示詳細錯誤訊息
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    const errorCode = (error as any)?.code;
    
    let userMessage = '解析失敗';
    if (errorCode === 'permission-denied') {
      userMessage = '解析失敗：權限不足，請檢查 Cloud Function 權限設定';
    } else if (errorCode === 'failed-precondition') {
      userMessage = '解析失敗：Cloud Function 配置錯誤，請檢查環境變數';
    } else if (errorCode === 'unauthenticated') {
      userMessage = '解析失敗：認證失敗，請重新登入';
    } else if (errorMessage) {
      userMessage = `解析失敗：${errorMessage}`;
    }
    
    this.messageService.error(userMessage);
    console.error('[AgreementModuleView] Parse failed', {
      error,
      errorCode,
      errorMessage
    });
  } finally {
    this.parsingId.set(null);
    console.log('[AgreementModuleView] Parse process ended');
  }
}
```

### 解決方案 2: 添加 Loading 狀態指示器

#### 修改模板 (`agreement-module-view.component.ts`):

```typescript
template: `
  <nz-card nzTitle="協議列表" [nzExtra]="createTpl">
    <!-- ... -->
    <nz-table [nzData]="agreements()" nzSize="small" [nzShowPagination]="false">
      <thead>
        <tr>
          <th scope="col">序號</th>
          <th scope="col">附件</th>
          <th scope="col">解析狀態</th>
          <th scope="col">欄位4</th>
          <th scope="col">欄位5</th>
          <th scope="col">欄位6</th>
          <th scope="col">操作</th>
        </tr>
      </thead>
      <tbody>
        @for (agreement of agreements(); track agreement.id; let idx = $index) {
          <tr>
            <td>{{ idx + 1 }}</td>
            <td>
              <!-- 附件上傳按鈕 -->
            </td>
            <td>
              @if (parsingId() === agreement.id) {
                <span nz-icon nzType="loading" nzTheme="outline"></span>
                <span class="ml-xs">解析中...</span>
              } @else if (agreement.parsedJsonUrl) {
                <nz-tag nzColor="success">已解析</nz-tag>
              } @else {
                <nz-tag nzColor="default">未解析</nz-tag>
              }
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-right">
              <button
                nz-button
                nzType="link"
                nzSize="small"
                [disabled]="!agreement.attachmentUrl || parsingId() === agreement.id"
                [nzLoading]="parsingId() === agreement.id"
                (click)="parse(agreement)"
              >
                {{ parsingId() === agreement.id ? '解析中' : '解析' }}
              </button>
              <!-- 其他按鈕 -->
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  </nz-card>
`
```

### 解決方案 3: 添加重試機制

```typescript
async parseAttachment(agreement: Agreement, retries = 3): Promise<void> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AgreementService] Parse attempt ${attempt}/${retries}`);
      
      // 執行解析邏輯
      // ... (同上)
      
      return; // 成功則直接返回
    } catch (error) {
      lastError = error as Error;
      console.warn(`[AgreementService] Parse attempt ${attempt} failed`, error);
      
      // 如果不是暫時性錯誤，立即失敗
      const errorCode = (error as any)?.code;
      if (errorCode === 'permission-denied' || errorCode === 'invalid-argument') {
        throw error;
      }
      
      // 最後一次嘗試失敗
      if (attempt === retries) {
        throw lastError;
      }
      
      // 等待後重試 (指數退避)
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`[AgreementService] Retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Parse failed after retries');
}
```

---

## 📊 驗證檢查清單

### 環境配置檢查

- [ ] `.env` 檔案存在於 `functions-ai-document/` 目錄
- [ ] `DOCUMENTAI_LOCATION=us` 設定正確
- [ ] `DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4` 設定正確
- [ ] Cloud Function 已重新部署 (`firebase deploy --only functions`)

### IAM 權限檢查

- [ ] Firebase 服務帳戶已授予 `roles/documentai.apiUser` 權限
- [ ] Document AI API 已啟用
- [ ] 處理器 `d8cd080814899dc4` 存在於 `us` region
- [ ] 處理器狀態為「已啟用」

### 程式碼檢查

- [ ] `parseAttachment()` 有完整的錯誤處理和日誌
- [ ] UI 元件有清楚的 loading 狀態指示
- [ ] 錯誤訊息包含具體的錯誤原因
- [ ] 瀏覽器 Console 顯示詳細的除錯日誌

### 功能測試

- [ ] 上傳 PDF 檔案成功
- [ ] 點擊「解析」按鈕顯示 loading 狀態
- [ ] 解析成功顯示「解析完成」訊息
- [ ] 解析失敗顯示具體錯誤原因
- [ ] 解析結果 JSON 檔案成功上傳到 Storage

---

## 🎯 預期結果

### 正常流程

1. **點擊解析按鈕**
   - 按鈕顯示 loading 動畫
   - 按鈕文字變為「解析中」
   - 按鈕變為 disabled 狀態

2. **Console 日誌**
   ```
   [AgreementModuleView] Starting parse { agreementId: "xxx" }
   [AgreementService] Starting parseAttachment { agreementId: "xxx", ... }
   [AgreementService] GCS URI constructed { gcsUri: "gs://...", bucket: "..." }
   [AgreementService] Calling processDocumentFromStorage { gcsUri: "gs://..." }
   [AgreementService] Document AI processing completed { success: true, ... }
   [AgreementService] Uploading parsed result { parsedPath: "agreements/xxx/parsed.json" }
   [AgreementService] Parsed JSON uploaded { parsedUrl: "https://..." }
   [AgreementService] Repository updated
   [AgreementService] Parse completed successfully
   [AgreementModuleView] Parse successful
   ```

3. **成功訊息**
   - 顯示「解析完成」
   - 按鈕恢復正常狀態
   - 解析狀態顯示「已解析」

### 錯誤流程

1. **權限錯誤**
   ```
   錯誤訊息: "解析失敗：權限不足，請檢查 Cloud Function 權限設定"
   Console: Error code: permission-denied
   ```

2. **配置錯誤**
   ```
   錯誤訊息: "解析失敗：Cloud Function 配置錯誤，請檢查環境變數"
   Console: Missing required environment variable: DOCUMENTAI_PROCESSOR_ID
   ```

3. **檔案錯誤**
   ```
   錯誤訊息: "解析失敗：無法取得檔案路徑"
   Console: GCS URI is null
   ```

---

## 📚 參考資料

### Google Cloud 官方文件

- [Document AI 快速入門](https://cloud.google.com/document-ai/docs/setup)
- [Document AI 發送請求](https://cloud.google.com/document-ai/docs/send-request?hl=zh-tw)
- [Document AI 處理響應](https://cloud.google.com/document-ai/docs/handle-response?hl=zh-tw)
- [Document AI 區域](https://cloud.google.com/document-ai/docs/regions?hl=zh-tw)
- [Document AI IAM 權限](https://cloud.google.com/document-ai/docs/access-control/iam-roles)

### NPM 套件

- [@google-cloud/documentai (v9.5.0)](https://www.npmjs.com/package/@google-cloud/documentai)
- [GitHub: google-cloud-node](https://github.com/googleapis/google-cloud-node)

### 處理器資訊

```
名稱: blueprint-agreement
ID: d8cd080814899dc4
類型: Custom Extractor
區域: us
狀態: 已啟用
端點: https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4:process
```

---

## 🔧 快速除錯指令

```bash
# 1. 檢查環境變數
cat functions-ai-document/.env

# 2. 檢查 IAM 權限
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:YOUR_PROJECT_ID@appspot.gserviceaccount.com"

# 3. 查看 Cloud Function 日誌
firebase functions:log --only processDocumentFromStorage --limit 20

# 4. 測試處理器連線
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4:process" \
  -d '{
    "gcsDocument": {
      "gcsUri": "gs://your-bucket/test.pdf",
      "mimeType": "application/pdf"
    }
  }'

# 5. 重新部署 Cloud Function
cd functions-ai-document
npm run build
firebase deploy --only functions:processDocumentFromStorage
```

---

**文件版本**: v1.0  
**最後更新**: 2025-12-20  
**維護者**: GigHub 開發團隊
