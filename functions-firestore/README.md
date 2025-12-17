# Functions Firestore Module

## 📋 概述

`functions-firestore` 模組負責處理 Firestore 資料庫相關的業務邏輯和資料操作。提供即時資料變更監聽、自動化稽核日誌和資料完整性維護功能。

## 🎯 核心功能

### 1. 藍圖變更監聽 (Blueprint Change Listener)

監聽 `blueprints/{blueprintId}` 集合的文件變更，自動建立稽核日誌。

**功能特性**：
- 偵測操作類型（建立、更新、刪除）
- 追蹤重要欄位變更（name, status, owner, members）
- 自動寫入 `audit_logs` 集合
- 完整錯誤處理和日誌記錄

**稽核日誌結構**：
```typescript
{
  documentType: 'blueprint',
  documentId: string,
  operation: 'created' | 'updated' | 'deleted',
  timestamp: Timestamp,
  beforeData: any | null,
  afterData: any | null,
  changes?: Array<{
    field: string,
    oldValue: any,
    newValue: any
  }>
}
```

### 2. 使用者建立監聽 (User Creation Listener)

監聽 `users/{userId}` 集合的新文件建立，自動初始化使用者元資料。

**功能特性**：
- 設定預設元資料
- 初始化通知偏好設定
- 記錄建立時間戳記
- 準備使用者個人檔案結構

**使用者元資料結構**：
```typescript
{
  createdAt: Timestamp,
  lastLoginAt: null,
  profileComplete: false,
  notificationPreferences: {
    email: true,
    push: true
  }
}
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

### 藍圖變更事件流程
```
1. blueprints/{blueprintId} 文件變更
2. onBlueprintChange 觸發
3. 提取變更前後資料
4. 判斷操作類型
5. 追蹤欄位變更（更新時）
6. 建立稽核日誌項目
7. 記錄到控制台
```

### 使用者建立事件流程
```
1. users/{userId} 新文件建立
2. onUserCreated 觸發
3. 提取使用者資料
4. 初始化元資料
5. 更新使用者文件
6. 記錄到控制台
```

## 🛡️ 錯誤處理

所有函式包含：
- Try-catch 區塊進行錯誤隔離
- 詳細的錯誤日誌與上下文
- 錯誤重新拋出以支援 Firebase 重試機制
- 結構化日誌便於除錯

## 📝 監控

函式記錄以下事件：
- 文件變更與 ID 及操作類型
- 更新時的欄位級變更
- 使用者建立事件
- 錯誤詳情與上下文

## ✅ 最佳實踐

1. **冪等性**: 函式設計為可安全重試
2. **結構化日誌**: 所有日誌包含上下文資料
3. **錯誤處理**: 全面的錯誤捕捉和記錄
4. **類型安全**: 完整的 TypeScript 類型定義
5. **最小依賴**: 僅使用必要的 Firebase 套件

## 🔐 安全性

- 使用 Firebase Admin SDK 具有提升權限
- 在安全的 Cloud Functions 環境中運行
- 無直接使用者輸入處理
- 稽核日誌符合合規要求

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎資料處理功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License

## 📦 核心功能

### 1. 資料驗證與清理 (Data Validation & Sanitization)

```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const validateProjectData = onDocumentWritten({
  document: 'projects/{projectId}',
  region: 'asia-east1'
}, async (event) => {
  const projectId = event.params.projectId;
  const afterData = event.data?.after.data();

  if (!afterData) return; // 文件已刪除

  logger.info('驗證專案資料', { projectId });

  try {
    const errors: string[] = [];

    // 驗證必填欄位
    if (!afterData.name || afterData.name.trim() === '') {
      errors.push('專案名稱為必填');
    }

    if (!afterData.organizationId) {
      errors.push('組織 ID 為必填');
    }

    // 驗證日期邏輯
    if (afterData.startDate && afterData.endDate) {
      const start = new Date(afterData.startDate);
      const end = new Date(afterData.endDate);
      
      if (end < start) {
        errors.push('結束日期不能早於開始日期');
      }
    }

    // 驗證預算
    if (afterData.budget && afterData.budget < 0) {
      errors.push('預算金額不能為負數');
    }

    // 如果有錯誤，標記為無效
    if (errors.length > 0) {
      await event.data.after.ref.update({
        validationErrors: errors,
        isValid: false,
        validatedAt: new Date()
      });

      logger.warn('專案資料驗證失敗', { projectId, errors });
    } else {
      // 清除舊的驗證錯誤
      await event.data.after.ref.update({
        validationErrors: admin.firestore.FieldValue.delete(),
        isValid: true,
        validatedAt: new Date()
      });

      logger.info('專案資料驗證通過', { projectId });
    }
  } catch (error) {
    logger.error('專案資料驗證失敗', error);
    throw error;
  }
});
```

### 2. 自動計數器更新 (Auto Counter Updates)

```typescript
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const updateTaskCounter = onDocumentCreated({
  document: 'tasks/{taskId}',
  region: 'asia-east1'
}, async (event) => {
  const task = event.data?.data();
  
  if (!task || !task.projectId) return;

  logger.info('更新任務計數器 - 新增', { 
    taskId: event.params.taskId, 
    projectId: task.projectId 
  });

  try {
    // 更新專案的任務計數
    await admin.firestore()
      .collection('projects')
      .doc(task.projectId)
      .update({
        taskCount: admin.firestore.FieldValue.increment(1),
        [`tasksByStatus.${task.status}`]: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });

    logger.info('任務計數器更新完成', { projectId: task.projectId });
  } catch (error) {
    logger.error('任務計數器更新失敗', error);
    throw error;
  }
});

export const decrementTaskCounter = onDocumentDeleted({
  document: 'tasks/{taskId}',
  region: 'asia-east1'
}, async (event) => {
  const task = event.data?.data();
  
  if (!task || !task.projectId) return;

  logger.info('更新任務計數器 - 刪除', {
    taskId: event.params.taskId,
    projectId: task.projectId
  });

  try {
    await admin.firestore()
      .collection('projects')
      .doc(task.projectId)
      .update({
        taskCount: admin.firestore.FieldValue.increment(-1),
        [`tasksByStatus.${task.status}`]: admin.firestore.FieldValue.increment(-1),
        updatedAt: new Date()
      });

    logger.info('任務計數器更新完成', { projectId: task.projectId });
  } catch (error) {
    logger.error('任務計數器更新失敗', error);
    throw error;
  }
});
```

### 3. 資料同步 (Data Synchronization)

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const syncUserProfile = onDocumentUpdated({
  document: 'users/{userId}',
  region: 'asia-east1'
}, async (event) => {
  const userId = event.params.userId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  // 檢查是否有需要同步的欄位變更
  const syncFields = ['displayName', 'photoURL', 'email'];
  const hasChanges = syncFields.some(
    field => beforeData[field] !== afterData[field]
  );

  if (!hasChanges) return;

  logger.info('同步使用者資料', { userId, changedFields: syncFields });

  try {
    const batch = admin.firestore().batch();

    // 同步到任務的建立者資訊
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('createdBy', '==', userId)
      .get();

    tasksSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        createdByName: afterData.displayName,
        createdByPhoto: afterData.photoURL
      });
    });

    // 同步到評論的使用者資訊
    const commentsSnapshot = await admin.firestore()
      .collection('comments')
      .where('userId', '==', userId)
      .get();

    commentsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        userName: afterData.displayName,
        userPhoto: afterData.photoURL
      });
    });

    await batch.commit();

    logger.info('使用者資料同步完成', {
      userId,
      tasksUpdated: tasksSnapshot.size,
      commentsUpdated: commentsSnapshot.size
    });
  } catch (error) {
    logger.error('使用者資料同步失敗', error);
    throw error;
  }
});
```

### 4. 階層式資料刪除 (Cascading Delete)

```typescript
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const cascadeDeleteProject = onDocumentDeleted({
  document: 'projects/{projectId}',
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 300
}, async (event) => {
  const projectId = event.params.projectId;

  logger.info('階層式刪除專案資料', { projectId });

  try {
    // 刪除所有相關任務
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('projectId', '==', projectId)
      .get();

    const taskDeletions = tasksSnapshot.docs.map(doc => doc.ref.delete());

    // 刪除所有專案日誌
    const logsSnapshot = await admin.firestore()
      .collection('logs')
      .where('projectId', '==', projectId)
      .get();

    const logDeletions = logsSnapshot.docs.map(doc => doc.ref.delete());

    // 刪除所有專案檔案
    const filesSnapshot = await admin.firestore()
      .collection('files')
      .where('projectId', '==', projectId)
      .get();

    const fileDeletions = filesSnapshot.docs.map(doc => doc.ref.delete());

    // 等待所有刪除完成
    await Promise.all([
      ...taskDeletions,
      ...logDeletions,
      ...fileDeletions
    ]);

    // 刪除 Storage 中的專案檔案
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({
      prefix: `projects/${projectId}/`
    });

    logger.info('階層式刪除完成', {
      projectId,
      tasksDeleted: tasksSnapshot.size,
      logsDeleted: logsSnapshot.size,
      filesDeleted: filesSnapshot.size
    });
  } catch (error) {
    logger.error('階層式刪除失敗', error);
    throw error;
  }
});
```

### 5. 資料完整性檢查 (Data Integrity Check)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface CheckIntegrityRequest {
  collectionName: string;
  fix?: boolean;
}

export const checkDataIntegrity = onCall<CheckIntegrityRequest>({
  region: 'asia-east1',
  memory: '1GiB',
  timeoutSeconds: 540
}, async (request) => {
  // 驗證管理員權限
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const userToken = await admin.auth().getUser(request.auth.uid);
  if (userToken.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', '權限不足');
  }

  const { collectionName, fix = false } = request.data;

  logger.info('檢查資料完整性', { collectionName, fix });

  try {
    const issues: any[] = [];

    if (collectionName === 'tasks') {
      // 檢查任務的專案 ID 是否有效
      const tasksSnapshot = await admin.firestore()
        .collection('tasks')
        .get();

      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        
        if (task.projectId) {
          const projectDoc = await admin.firestore()
            .collection('projects')
            .doc(task.projectId)
            .get();

          if (!projectDoc.exists) {
            issues.push({
              type: 'orphaned_task',
              taskId: taskDoc.id,
              projectId: task.projectId,
              message: '任務關聯的專案不存在'
            });

            if (fix) {
              // 刪除孤立的任務
              await taskDoc.ref.delete();
            }
          }
        }
      }
    }

    logger.info('資料完整性檢查完成', {
      collectionName,
      issuesFound: issues.length,
      fixed: fix
    });

    return {
      success: true,
      issuesFound: issues.length,
      issues,
      fixed: fix
    };
  } catch (error) {
    logger.error('資料完整性檢查失敗', error);
    throw new HttpsError('internal', '完整性檢查失敗');
  }
});
```

### 6. 資料快照備份 (Snapshot Backup)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const backupFirestore = onSchedule({
  schedule: '0 3 * * *', // 每天凌晨 3 點
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  memory: '1GiB'
}, async (event) => {
  logger.info('開始 Firestore 備份', { scheduleTime: event.scheduleTime });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const collections = ['projects', 'tasks', 'users', 'logs'];

    for (const collectionName of collections) {
      const snapshot = await admin.firestore()
        .collection(collectionName)
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      // 儲存到 Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(`backups/${timestamp}/${collectionName}.json`);

      await file.save(JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        metadata: {
          timestamp,
          collectionName,
          documentCount: data.length
        }
      });

      logger.info('Collection 備份完成', {
        collectionName,
        documentCount: data.length
      });
    }

    logger.info('Firestore 備份完成', { timestamp });

    return { success: true, timestamp };
  } catch (error) {
    logger.error('Firestore 備份失敗', error);
    throw error;
  }
});
```

## 📂 目錄結構

```
functions-firestore/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── validation/           # 資料驗證
│   │   └── validators.ts
│   ├── counters/             # 計數器管理
│   │   └── auto-counters.ts
│   ├── sync/                 # 資料同步
│   │   └── data-sync.ts
│   ├── cascade/              # 階層式操作
│   │   └── cascade-delete.ts
│   ├── integrity/            # 完整性檢查
│   │   └── integrity-check.ts
│   └── backup/               # 備份功能
│       └── snapshot-backup.ts
└── tests/
    └── firestore.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-firestore
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,firestore
```

### 2. 部署

```bash
firebase deploy --only functions:firestore
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('validateProjectData', () => {
  it('應該驗證專案資料', async () => {
    const wrapped = testEnv.wrap(validateProjectData);
    
    const before = testEnv.firestore.makeDocumentSnapshot(
      { name: 'Old Name' },
      'projects/test123'
    );

    const after = testEnv.firestore.makeDocumentSnapshot(
      { 
        name: 'New Name',
        organizationId: 'org123',
        budget: 100000
      },
      'projects/test123'
    );

    await wrapped(testEnv.makeChange(before, after));

    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc('test123')
      .get();

    expect(projectDoc.data()?.isValid).toBe(true);
  });
});
```

## 🔧 故障排除

### 常見問題

1. **計數器不準確**
   - 使用 checkDataIntegrity 函式檢查並修復
   - 重新計算計數器

2. **同步延遲**
   - 檢查函式執行時間
   - 優化查詢效能
   - 使用批次處理

3. **備份失敗**
   - 檢查 Storage 權限
   - 確認記憶體配置足夠
   - 分批處理大型集合

## 📚 參考資源

- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Data Modeling Best Practices](https://firebase.google.com/docs/firestore/manage-data/structure-data)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎資料處理功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
