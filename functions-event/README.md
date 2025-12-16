# Functions Event Module

## 📋 概述

`functions-event` 模組負責處理事件驅動的函式,響應 Firestore、Authentication 和其他 Firebase 服務的即時事件。提供自動化的資料處理、驗證和觸發相關業務邏輯。

## 🎯 目標

- **即時響應**: 自動響應資料庫和系統事件
- **資料完整性**: 確保資料的一致性和完整性
- **業務邏輯**: 觸發相關的業務流程和通知
- **審計追蹤**: 記錄所有重要的系統事件

## 📦 核心功能

### 1. Firestore Document 事件處理

#### 專案建立事件

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const onProjectCreated = onDocumentCreated({
  document: 'projects/{projectId}',
  region: 'asia-east1'
}, async (event) => {
  const projectId = event.params.projectId;
  const projectData = event.data?.data();

  logger.info('專案建立', { projectId, projectData });

  try {
    // 1. 建立預設任務範本
    await createDefaultTasks(projectId);

    // 2. 設定專案權限
    await setupProjectPermissions(projectId, projectData?.organizationId);

    // 3. 發送通知給相關人員
    await notifyProjectCreation(projectId, projectData);

    // 4. 記錄審計日誌
    await logAuditEvent({
      type: 'project.created',
      projectId,
      userId: projectData?.createdBy,
      timestamp: new Date()
    });

    logger.info('專案建立處理完成', { projectId });
  } catch (error) {
    logger.error('專案建立處理失敗', error);
    throw error;
  }
});

async function createDefaultTasks(projectId: string) {
  const defaultTasks = [
    { name: '專案啟動會議', status: 'pending' },
    { name: '需求確認', status: 'pending' },
    { name: '資源配置', status: 'pending' }
  ];

  const batch = admin.firestore().batch();
  
  defaultTasks.forEach(task => {
    const taskRef = admin.firestore()
      .collection('tasks')
      .doc();
    
    batch.set(taskRef, {
      ...task,
      projectId,
      createdAt: new Date()
    });
  });

  await batch.commit();
}

async function setupProjectPermissions(
  projectId: string, 
  organizationId: string
) {
  await admin.firestore()
    .collection('permissions')
    .doc(projectId)
    .set({
      projectId,
      organizationId,
      roles: {
        admin: [],
        manager: [],
        member: []
      },
      createdAt: new Date()
    });
}
```

#### 任務更新事件

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { Change } from 'firebase-functions/v2';

export const onTaskUpdated = onDocumentUpdated({
  document: 'tasks/{taskId}',
  region: 'asia-east1'
}, async (event) => {
  const taskId = event.params.taskId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  logger.info('任務更新', { taskId, beforeData, afterData });

  try {
    // 檢查狀態變更
    if (beforeData.status !== afterData.status) {
      await handleStatusChange(taskId, beforeData.status, afterData.status);
    }

    // 檢查負責人變更
    if (beforeData.assignee !== afterData.assignee) {
      await handleAssigneeChange(taskId, beforeData.assignee, afterData.assignee);
    }

    // 檢查截止日期變更
    if (beforeData.dueDate !== afterData.dueDate) {
      await handleDueDateChange(taskId, beforeData.dueDate, afterData.dueDate);
    }

    // 更新專案統計
    await updateProjectStats(afterData.projectId);

    logger.info('任務更新處理完成', { taskId });
  } catch (error) {
    logger.error('任務更新處理失敗', error);
    throw error;
  }
});

async function handleStatusChange(
  taskId: string,
  oldStatus: string,
  newStatus: string
) {
  logger.info('任務狀態變更', { taskId, oldStatus, newStatus });

  if (newStatus === 'completed') {
    // 發送完成通知
    await sendTaskCompletedNotification(taskId);
  }

  // 記錄狀態變更歷史
  await admin.firestore()
    .collection('task_history')
    .add({
      taskId,
      field: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      timestamp: new Date()
    });
}

async function handleAssigneeChange(
  taskId: string,
  oldAssignee: string,
  newAssignee: string
) {
  logger.info('任務負責人變更', { taskId, oldAssignee, newAssignee });

  // 發送通知給新負責人
  await sendAssignmentNotification(taskId, newAssignee);
}
```

#### 文件刪除事件

```typescript
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

export const onTaskDeleted = onDocumentDeleted({
  document: 'tasks/{taskId}',
  region: 'asia-east1'
}, async (event) => {
  const taskId = event.params.taskId;
  const taskData = event.data?.data();

  logger.info('任務刪除', { taskId, taskData });

  try {
    // 1. 刪除相關的附件檔案
    await deleteTaskAttachments(taskId);

    // 2. 刪除相關的評論
    await deleteTaskComments(taskId);

    // 3. 更新專案統計
    if (taskData?.projectId) {
      await updateProjectStats(taskData.projectId);
    }

    // 4. 記錄刪除事件
    await logAuditEvent({
      type: 'task.deleted',
      taskId,
      taskData,
      timestamp: new Date()
    });

    logger.info('任務刪除處理完成', { taskId });
  } catch (error) {
    logger.error('任務刪除處理失敗', error);
    throw error;
  }
});

async function deleteTaskAttachments(taskId: string) {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({
    prefix: `tasks/${taskId}/`
  });

  await Promise.all(files.map(file => file.delete()));
}

async function deleteTaskComments(taskId: string) {
  const commentsRef = admin.firestore()
    .collection('comments')
    .where('taskId', '==', taskId);

  const snapshot = await commentsRef.get();
  const batch = admin.firestore().batch();

  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}
```

### 2. Authentication 事件處理

#### 使用者建立事件

```typescript
import { onUserCreated } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';

export const onUserCreatedHandler = onUserCreated({
  region: 'asia-east1'
}, async (event) => {
  const user = event.data;

  logger.info('新使用者建立', {
    uid: user.uid,
    email: user.email
  });

  try {
    // 1. 建立使用者資料文件
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .set({
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'viewer', // 預設角色
        createdAt: new Date(),
        updatedAt: new Date()
      });

    // 2. 發送歡迎郵件
    await sendWelcomeEmail(user.email!, user.displayName);

    // 3. 設定預設偏好設定
    await setupDefaultPreferences(user.uid);

    logger.info('使用者建立處理完成', { uid: user.uid });
  } catch (error) {
    logger.error('使用者建立處理失敗', error);
    throw error;
  }
});

async function setupDefaultPreferences(uid: string) {
  await admin.firestore()
    .collection('user_preferences')
    .doc(uid)
    .set({
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      language: 'zh-TW',
      timezone: 'Asia/Taipei'
    });
}
```

#### 使用者刪除事件

```typescript
import { onUserDeleted } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';

export const onUserDeletedHandler = onUserDeleted({
  region: 'asia-east1'
}, async (event) => {
  const user = event.data;

  logger.info('使用者刪除', { uid: user.uid });

  try {
    // 1. 刪除使用者資料
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .delete();

    // 2. 刪除使用者偏好設定
    await admin.firestore()
      .collection('user_preferences')
      .doc(user.uid)
      .delete();

    // 3. 匿名化使用者建立的內容
    await anonymizeUserContent(user.uid);

    // 4. 刪除使用者上傳的檔案
    await deleteUserFiles(user.uid);

    logger.info('使用者刪除處理完成', { uid: user.uid });
  } catch (error) {
    logger.error('使用者刪除處理失敗', error);
    throw error;
  }
});

async function anonymizeUserContent(uid: string) {
  const batch = admin.firestore().batch();

  // 匿名化任務
  const tasksSnapshot = await admin.firestore()
    .collection('tasks')
    .where('createdBy', '==', uid)
    .get();

  tasksSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      createdBy: '[deleted]',
      createdByName: '[已刪除的使用者]'
    });
  });

  await batch.commit();
}

async function deleteUserFiles(uid: string) {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({
    prefix: `users/${uid}/`
  });

  await Promise.all(files.map(file => file.delete()));
}
```

### 3. Eventarc 自訂事件

```typescript
import { onCustomEventPublished } from 'firebase-functions/v2/eventarc';
import * as logger from 'firebase-functions/logger';

interface ProjectMilestoneEvent {
  projectId: string;
  milestoneType: string;
  data: any;
}

export const onProjectMilestone = onCustomEventPublished<ProjectMilestoneEvent>({
  eventType: 'gighub.project.milestone',
  channel: 'projects/gighub/locations/asia-east1/channels/milestones',
  region: 'asia-east1'
}, async (event) => {
  const { projectId, milestoneType, data } = event.data;

  logger.info('專案里程碑事件', { projectId, milestoneType });

  try {
    switch (milestoneType) {
      case 'progress_50':
        await handleProgress50(projectId, data);
        break;
      case 'progress_100':
        await handleProjectCompletion(projectId, data);
        break;
      case 'budget_threshold':
        await handleBudgetThreshold(projectId, data);
        break;
      default:
        logger.warn('未處理的里程碑類型', { milestoneType });
    }

    return { processed: true };
  } catch (error) {
    logger.error('里程碑事件處理失敗', error);
    throw error;
  }
});

async function handleProgress50(projectId: string, data: any) {
  logger.info('專案達到 50% 進度', { projectId });
  // 發送進度通知
  // 更新報表
}

async function handleProjectCompletion(projectId: string, data: any) {
  logger.info('專案完成', { projectId });
  // 生成完工報告
  // 發送慶祝通知
}

async function handleBudgetThreshold(projectId: string, data: any) {
  logger.info('專案預算達到門檻', { projectId, threshold: data.threshold });
  // 發送預算警告
  // 通知管理員
}
```

## 📂 目錄結構

```
functions-event/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── firestore/            # Firestore 事件
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── users.ts
│   ├── auth/                 # Authentication 事件
│   │   ├── user-created.ts
│   │   └── user-deleted.ts
│   ├── storage/              # Storage 事件
│   │   └── file-uploaded.ts
│   └── custom/               # 自訂事件
│       └── project-milestones.ts
└── tests/
    └── events.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-event
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,firestore,auth
```

### 2. 部署

```bash
firebase deploy --only functions:event
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('onProjectCreated', () => {
  it('應該建立預設任務', async () => {
    const wrapped = testEnv.wrap(onProjectCreated);
    
    const event = testEnv.firestore.makeDocumentSnapshot(
      { name: 'Test Project' },
      'projects/test123'
    );

    await wrapped(event);

    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('projectId', '==', 'test123')
      .get();

    expect(tasksSnapshot.size).toBeGreaterThan(0);
  });
});
```

## 📊 監控與日誌

### 事件追蹤

```typescript
async function logAuditEvent(event: {
  type: string;
  [key: string]: any;
}) {
  await admin.firestore()
    .collection('audit_logs')
    .add({
      ...event,
      timestamp: new Date()
    });
}
```

### 錯誤追蹤

```typescript
import { onTaskFailed } from 'firebase-functions/v2/tasks';

export const onEventError = onTaskFailed(
  { region: 'asia-east1' },
  async (event) => {
    logger.error('事件處理失敗', {
      error: event.data.error,
      functionName: event.data.functionName
    });

    // 發送錯誤通知給管理員
    await notifyAdminError(event.data);
  }
);
```

## 🔧 故障排除

### 常見問題

1. **事件未觸發**
   - 檢查 Firestore 規則
   - 驗證文件路徑格式
   - 確認函式部署成功

2. **處理逾時**
   - 增加函式逾時時間
   - 優化資料庫查詢
   - 使用非同步處理

3. **記憶體不足**
   - 增加記憶體配置
   - 避免載入大量資料
   - 使用串流處理

## 📚 參考資源

- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Auth Triggers](https://firebase.google.com/docs/functions/auth-events)
- [Eventarc Triggers](https://firebase.google.com/docs/functions/eventarc-events)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎事件處理 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
