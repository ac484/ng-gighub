# Functions Storage Module

## 📋 概述

`functions-storage` 模組負責處理 Firebase Cloud Storage 相關的檔案管理功能。提供檔案上傳驗證、自動元資料處理、檔案刪除清理和事件日誌記錄功能。

## 🎯 核心功能

### 1. 檔案上傳處理 (File Upload Processing)

監聽所有儲存桶的 `onObjectFinalized` 事件，自動驗證和處理上傳的檔案。

**功能特性**：
- 檔案類型驗證（白名單機制）
- 檔案大小驗證（最大 100MB）
- 副檔名黑名單檢查（.exe, .bat, .cmd, .sh, .ps1）
- 自動元資料標記
- 圖片和文件的特殊處理
- 事件記錄到 Firestore
- 完整錯誤處理

**驗證規則**：
- **最大大小**: 100MB
- **封鎖副檔名**: `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`
- **允許類型**: 
  - 圖片 (image/*)
  - 影片 (video/*)
  - 音訊 (audio/*)
  - PDF (application/pdf)
  - Office 文件 (MS Word, Excel 等)
  - 文字檔案 (text/*)

**元資料結構**：
```typescript
{
  metadata: {
    processed: 'true' | 'false',
    validationStatus: 'success' | 'failed',
    processedAt: string,
    originalName: string,
    fileType?: 'image' | 'document',
    requiresThumbnail?: 'true',
    requiresProcessing?: 'true',
    validationReason?: string
  }
}
```

### 2. 檔案刪除處理 (File Deletion Handling)

監聽所有儲存桶的 `onObjectDeleted` 事件，自動清理相關資源。

**功能特性**：
- 記錄刪除事件到 Firestore
- 自動清理相關縮圖檔案
- 追蹤刪除歷史
- 清理失敗的錯誤處理

**清理流程**：
```
1. 記錄刪除事件到 storage_events 集合
2. 檢查相關縮圖檔案
3. 如果存在則刪除縮圖
4. 記錄清理結果
```

## 💻 技術堆疊

- **Firebase Functions**: v7.0.0 (v2 API)
- **Firebase Admin**: v13.6.0
- **TypeScript**: v5.7.3
- **Node.js**: v24

## ⚙️ 配置

- **Region**: `asia-east1`
- **Max Instances**: 10 (成本控制)

## 🚀 開發指令

```bash
# 安裝依賴
npm install

# 建置
npm run build

# 部署
npm run deploy

# 監視模式
npm run build:watch
```

## 📊 事件流程

### 檔案上傳事件流程
```
1. 檔案上傳到 Cloud Storage
2. onFileUpload 觸發
3. 提取檔案元資料（路徑、類型、大小）
4. 驗證檔案（類型、大小、副檔名）
5. 更新檔案元資料
6. 記錄事件到 Firestore storage_events
7. 回傳成功/失敗狀態
```

### 檔案刪除事件流程
```
1. 從 Cloud Storage 刪除檔案
2. onFileDeleted 觸發
3. 記錄刪除到 storage_events
4. 檢查相關縮圖
5. 如果存在則刪除縮圖
6. 記錄清理結果
```

## 🔍 檔案驗證

### validateFile() 函式

根據安全性和大小限制檢查上傳的檔案。

**參數**：
- `contentType`: 檔案的 MIME 類型
- `fileSize`: 檔案大小（位元組）
- `fileExtension`: 副檔名（例如：'.pdf'）

**回傳值**：
```typescript
{
  valid: boolean;
  reason?: string;  // 僅在無效時存在
}
```

**範例**：
```typescript
// 有效檔案
{ valid: true }

// 無效檔案
{ valid: false, reason: 'File size exceeds 100MB limit' }
{ valid: false, reason: 'File extension .exe is not allowed' }
{ valid: false, reason: 'Content type application/x-executable is not allowed' }
```

## 🔧 輔助函式

### isDocumentFile()

根據內容類型和副檔名判斷檔案是否為文件。

**辨識的文件類型**：
- PDF (application/pdf)
- MS Word (.doc, .docx)
- MS Excel (.xls, .xlsx)
- 純文字 (.txt)
- CSV 檔案 (.csv)

## 📝 事件記錄

所有儲存事件記錄到 Firestore 集合 `storage_events`：

```typescript
{
  eventType: 'upload' | 'delete',
  filePath: string,
  contentType?: string,
  fileSize?: number,
  bucket: string,
  timestamp: Timestamp,
  status?: 'success' | 'failed'
}
```

## 🛡️ 錯誤處理

所有函式包含：
- Try-catch 區塊進行錯誤隔離
- 詳細的錯誤日誌與檔案上下文
- 非關鍵操作的優雅降級
- 錯誤重新拋出以支援 Firebase 重試機制

## 📝 監控

函式記錄以下事件：
- 檔案上傳與驗證結果
- 檔案刪除與清理狀態
- 驗證失敗與原因
- 縮圖清理操作
- 錯誤詳情與檔案上下文

## ✅ 最佳實踐

1. **安全優先**: 處理前嚴格驗證檔案
2. **冪等性**: 函式可安全重試
3. **結構化日誌**: 所有日誌包含檔案上下文
4. **資源清理**: 自動刪除相關檔案
5. **類型安全**: 完整的 TypeScript 類型定義

## 🔐 安全功能

- 檔案類型驗證（白名單機制）
- 檔案大小限制強制執行
- 危險副檔名封鎖
- 元資料清理
- 稽核追蹤的事件日誌

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎儲存功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License

## 📦 核心功能

### 1. 檔案上傳處理 (File Upload Processing)

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as path from 'path';

export const onFileUpload = onObjectFinalized({
  bucket: 'gighub-uploads',
  region: 'asia-east1',
  memory: '1GiB',
  timeoutSeconds: 300
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  const fileSize = parseInt(event.data.size || '0');

  logger.info('處理檔案上傳', {
    filePath,
    contentType,
    size: fileSize
  });

  try {
    const bucket = admin.storage().bucket(event.data.bucket);
    const file = bucket.file(filePath);

    // 1. 驗證檔案類型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (contentType && !allowedTypes.includes(contentType)) {
      logger.warn('不允許的檔案類型', { contentType, filePath });
      await file.delete();
      return;
    }

    // 2. 驗證檔案大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      logger.warn('檔案大小超過限制', { size: fileSize, filePath });
      await file.delete();
      return;
    }

    // 3. 根據檔案類型處理
    if (contentType?.startsWith('image/')) {
      await processImage(file, filePath);
    } else if (contentType === 'application/pdf') {
      await processPDF(file, filePath);
    }

    // 4. 更新 Firestore 中的檔案記錄
    const fileName = path.basename(filePath);
    const fileId = fileName.split('.')[0];

    await admin.firestore()
      .collection('files')
      .doc(fileId)
      .set({
        name: fileName,
        path: filePath,
        contentType,
        size: fileSize,
        status: 'processed',
        processedAt: new Date(),
        downloadURL: await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491'
        })
      }, { merge: true });

    logger.info('檔案處理完成', { filePath });

    return { processed: true };
  } catch (error) {
    logger.error('檔案處理失敗', error);
    throw error;
  }
});

async function processImage(file: any, filePath: string) {
  logger.info('處理圖片', { filePath });
  // 生成縮圖、優化等處理
}

async function processPDF(file: any, filePath: string) {
  logger.info('處理 PDF', { filePath });
  // PDF 處理邏輯
}
```

### 2. 圖片縮圖生成 (Image Thumbnail Generation)

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { spawn } from 'child-process-promise';

export const generateThumbnail = onObjectFinalized({
  bucket: 'gighub-uploads',
  region: 'asia-east1',
  memory: '1GiB'
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // 只處理圖片檔案
  if (!contentType || !contentType.startsWith('image/')) {
    return;
  }

  // 跳過已經是縮圖的檔案
  if (filePath.includes('thumb_')) {
    return;
  }

  logger.info('生成縮圖', { filePath });

  try {
    const bucket = admin.storage().bucket(event.data.bucket);
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(os.tmpdir(), thumbFileName);
    const thumbStoragePath = path.join(fileDir, thumbFileName);

    // 1. 下載檔案到臨時目錄
    await bucket.file(filePath).download({ destination: tempFilePath });
    logger.info('檔案已下載', { tempFilePath });

    // 2. 使用 ImageMagick 生成縮圖
    await spawn('convert', [
      tempFilePath,
      '-thumbnail', '300x300>',
      '-quality', '85',
      thumbFilePath
    ]);

    logger.info('縮圖已生成', { thumbFilePath });

    // 3. 上傳縮圖到 Storage
    await bucket.upload(thumbFilePath, {
      destination: thumbStoragePath,
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          originalFile: filePath,
          thumbnail: 'true'
        }
      }
    });

    logger.info('縮圖已上傳', { thumbStoragePath });

    // 4. 清理臨時檔案
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(thumbFilePath);

    // 5. 更新 Firestore 記錄
    const fileId = fileName.split('.')[0];
    await admin.firestore()
      .collection('files')
      .doc(fileId)
      .update({
        thumbnailPath: thumbStoragePath,
        thumbnailGenerated: true,
        thumbnailGeneratedAt: new Date()
      });

    logger.info('縮圖生成完成', { filePath, thumbStoragePath });

    return { thumbnail: thumbStoragePath };
  } catch (error) {
    logger.error('縮圖生成失敗', error);
    throw error;
  }
});
```

### 3. 檔案刪除處理 (File Deletion Handling)

```typescript
import { onObjectDeleted } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as path from 'path';

export const onFileDeleted = onObjectDeleted({
  bucket: 'gighub-uploads',
  region: 'asia-east1'
}, async (event) => {
  const filePath = event.data.name;

  logger.info('檔案已刪除', { filePath });

  try {
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);

    // 1. 刪除對應的縮圖
    if (!filePath.includes('thumb_')) {
      const thumbFileName = `thumb_${fileName}`;
      const thumbPath = path.join(fileDir, thumbFileName);

      const bucket = admin.storage().bucket(event.data.bucket);
      const thumbFile = bucket.file(thumbPath);

      const [exists] = await thumbFile.exists();
      if (exists) {
        await thumbFile.delete();
        logger.info('縮圖已刪除', { thumbPath });
      }
    }

    // 2. 更新 Firestore 記錄
    const fileId = fileName.split('.')[0];
    const fileDoc = await admin.firestore()
      .collection('files')
      .doc(fileId)
      .get();

    if (fileDoc.exists) {
      await fileDoc.ref.update({
        status: 'deleted',
        deletedAt: new Date()
      });

      logger.info('Firestore 記錄已更新', { fileId });
    }

    // 3. 記錄刪除事件
    await admin.firestore()
      .collection('file_deletion_logs')
      .add({
        filePath,
        fileName,
        deletedAt: new Date(),
        fileSize: event.data.size,
        contentType: event.data.contentType
      });

    logger.info('檔案刪除處理完成', { filePath });
  } catch (error) {
    logger.error('檔案刪除處理失敗', error);
    throw error;
  }
});
```

### 4. 檔案病毒掃描 (Virus Scanning)

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child-process-promise';

export const scanFile = onObjectFinalized({
  bucket: 'gighub-uploads',
  region: 'asia-east1',
  memory: '1GiB'
}, async (event) => {
  const filePath = event.data.name;

  logger.info('開始檔案掃描', { filePath });

  try {
    const bucket = admin.storage().bucket(event.data.bucket);
    const file = bucket.file(filePath);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));

    // 1. 下載檔案
    await file.download({ destination: tempFilePath });

    // 2. 使用 ClamAV 掃描 (需要預先安裝)
    const scanResult = await spawn('clamscan', [
      '--no-summary',
      tempFilePath
    ]).catch(err => {
      // ClamAV 發現病毒時會回傳非零退出碼
      return err;
    });

    const isInfected = scanResult.code === 1;

    if (isInfected) {
      logger.warn('發現惡意檔案', { filePath });

      // 刪除檔案
      await file.delete();

      // 標記為惡意檔案
      await admin.firestore()
        .collection('malicious_files')
        .add({
          filePath,
          detectedAt: new Date(),
          scanResult: scanResult.stdout
        });

      return { infected: true };
    }

    logger.info('檔案掃描通過', { filePath });

    // 標記為安全
    const fileId = path.basename(filePath).split('.')[0];
    await admin.firestore()
      .collection('files')
      .doc(fileId)
      .update({
        scanned: true,
        scanResult: 'clean',
        scannedAt: new Date()
      });

    return { infected: false };
  } catch (error) {
    logger.error('檔案掃描失敗', error);
    throw error;
  }
});
```

### 5. 檔案元數據管理 (File Metadata Management)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface UpdateMetadataRequest {
  filePath: string;
  metadata: {
    description?: string;
    tags?: string[];
    category?: string;
  };
}

export const updateFileMetadata = onCall<UpdateMetadataRequest>({
  region: 'asia-east1'
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const { filePath, metadata } = request.data;

  logger.info('更新檔案元數據', {
    filePath,
    userId: request.auth.uid
  });

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError('not-found', '檔案不存在');
    }

    // 更新 Storage 元數據
    await file.setMetadata({
      metadata: {
        ...metadata,
        updatedBy: request.auth.uid,
        updatedAt: new Date().toISOString()
      }
    });

    // 更新 Firestore 記錄
    const fileId = filePath.split('/').pop()?.split('.')[0];
    if (fileId) {
      await admin.firestore()
        .collection('files')
        .doc(fileId)
        .update({
          ...metadata,
          updatedBy: request.auth.uid,
          updatedAt: new Date()
        });
    }

    logger.info('檔案元數據更新完成', { filePath });

    return { success: true };
  } catch (error) {
    logger.error('檔案元數據更新失敗', error);
    throw new HttpsError('internal', '元數據更新失敗');
  }
});
```

### 6. 檔案備份 (File Backup)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const backupFiles = onSchedule({
  schedule: '0 4 * * *', // 每天凌晨 4 點
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  memory: '2GiB',
  timeoutSeconds: 540
}, async (event) => {
  logger.info('開始檔案備份', { scheduleTime: event.scheduleTime });

  try {
    const sourceBucket = admin.storage().bucket('gighub-uploads');
    const backupBucket = admin.storage().bucket('gighub-backups');

    const timestamp = new Date().toISOString().split('T')[0];
    const backupPrefix = `backups/${timestamp}/`;

    // 列出所有要備份的檔案
    const [files] = await sourceBucket.getFiles({
      prefix: 'projects/'
    });

    logger.info('找到檔案', { count: files.length });

    let backedUpCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const destFileName = `${backupPrefix}${file.name}`;

        await file.copy(backupBucket.file(destFileName));
        backedUpCount++;

        if (backedUpCount % 100 === 0) {
          logger.info('備份進度', { backedUpCount, total: files.length });
        }
      } catch (error) {
        logger.error('檔案備份失敗', {
          fileName: file.name,
          error
        });
        errorCount++;
      }
    }

    // 記錄備份結果
    await admin.firestore()
      .collection('backup_logs')
      .add({
        type: 'files',
        timestamp: new Date(),
        filesCount: files.length,
        backedUpCount,
        errorCount,
        backupPath: backupPrefix
      });

    logger.info('檔案備份完成', {
      total: files.length,
      backedUpCount,
      errorCount
    });

    return { 
      success: true, 
      backedUpCount, 
      errorCount 
    };
  } catch (error) {
    logger.error('檔案備份失敗', error);
    throw error;
  }
});
```

## 📂 目錄結構

```
functions-storage/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── upload/               # 上傳處理
│   │   └── file-processor.ts
│   ├── thumbnail/            # 縮圖生成
│   │   └── thumbnail-generator.ts
│   ├── delete/               # 刪除處理
│   │   └── file-cleaner.ts
│   ├── security/             # 安全掃描
│   │   └── virus-scanner.ts
│   ├── metadata/             # 元數據管理
│   │   └── metadata-manager.ts
│   └── backup/               # 備份功能
│       └── file-backup.ts
└── tests/
    └── storage.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-storage
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,storage
```

### 2. 部署

```bash
firebase deploy --only functions:storage
```

## 🔐 安全性設定

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|application/pdf');
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('onFileUpload', () => {
  it('應該處理檔案上傳', async () => {
    const wrapped = testEnv.wrap(onFileUpload);
    
    const event = testEnv.storage.makeObjectEvent({
      name: 'projects/test.jpg',
      contentType: 'image/jpeg',
      size: '1048576'
    });

    const result = await wrapped(event);

    expect(result.processed).toBe(true);
  });
});
```

## 🔧 故障排除

### 常見問題

1. **縮圖生成失敗**
   - 確認 ImageMagick 已安裝
   - 檢查記憶體配置
   - 驗證圖片格式支援

2. **病毒掃描失敗**
   - 確認 ClamAV 已安裝並更新
   - 檢查病毒定義檔是否最新

3. **備份失敗**
   - 檢查 Storage 權限
   - 確認備份 Bucket 存在
   - 驗證記憶體和逾時設定

## 📚 參考資源

- [Cloud Storage Triggers](https://firebase.google.com/docs/functions/gcp-storage-events)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [ImageMagick Documentation](https://imagemagick.org/script/convert.php)
- [ClamAV Documentation](https://www.clamav.net/documents)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎儲存功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
