# Functions Storage Module

## 📋 概述

`functions-storage` 模組負責處理 Firebase Cloud Storage 相關的檔案管理功能。提供檔案上傳處理、圖片優化、檔案轉換、安全驗證和自動化備份功能,確保檔案儲存的安全性和效能。

## 🎯 目標

- **檔案處理**: 自動化檔案上傳和處理流程
- **圖片優化**: 生成縮圖和優化圖片品質
- **安全驗證**: 驗證檔案類型和大小限制
- **自動備份**: 定期備份重要檔案

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
