# Functions FCM Module

## 📋 概述

`functions-fcm` 模組負責處理 Firebase Cloud Messaging (FCM) 推播通知功能。提供多種推播場景的實作,包括任務提醒、系統通知、即時訊息等,支援個人化推播和批次發送。

## 🎯 目標

- **即時通知**: 提供即時的推播通知服務
- **多平台支援**: 支援 Android、iOS 和 Web 平台
- **個人化推播**: 根據使用者偏好發送通知
- **批次處理**: 高效處理大量推播需求

## 📦 核心功能

### 1. 任務相關推播 (Task Notifications)

```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const onTaskStatusChange = onDocumentWritten({
  document: 'tasks/{taskId}',
  region: 'asia-east1'
}, async (event) => {
  const taskId = event.params.taskId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // 只處理狀態變更
  if (!beforeData || !afterData || beforeData.status === afterData.status) {
    return;
  }

  logger.info('任務狀態變更推播', {
    taskId,
    oldStatus: beforeData.status,
    newStatus: afterData.status
  });

  try {
    const task = afterData;
    
    // 取得任務負責人的 FCM Token
    const assigneeDoc = await admin.firestore()
      .collection('users')
      .doc(task.assignee)
      .get();

    const fcmToken = assigneeDoc.data()?.fcmToken;

    if (!fcmToken) {
      logger.warn('使用者未設定 FCM Token', { userId: task.assignee });
      return;
    }

    // 根據狀態建立通知訊息
    const notification = createTaskNotification(task, beforeData.status, afterData.status);

    // 發送推播
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        type: 'task_status_change',
        taskId,
        oldStatus: beforeData.status,
        newStatus: afterData.status,
        clickAction: `/tasks/${taskId}`
      },
      token: fcmToken,
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          color: '#1890ff'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/assets/icons/task-icon.png',
          badge: '/assets/icons/badge.png'
        }
      }
    };

    const response = await admin.messaging().send(message);

    logger.info('任務推播發送成功', {
      taskId,
      messageId: response
    });

    // 記錄推播歷史
    await admin.firestore()
      .collection('notification_logs')
      .add({
        type: 'task_status_change',
        taskId,
        userId: task.assignee,
        status: 'sent',
        messageId: response,
        timestamp: new Date()
      });

  } catch (error) {
    logger.error('任務推播發送失敗', error);
    throw error;
  }
});

function createTaskNotification(
  task: any,
  oldStatus: string,
  newStatus: string
): { title: string; body: string } {
  const statusMessages: Record<string, string> = {
    'pending': '待處理',
    'in-progress': '進行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  return {
    title: '任務狀態更新',
    body: `任務「${task.name}」已從「${statusMessages[oldStatus]}」更新為「${statusMessages[newStatus]}」`
  };
}
```

### 2. 批次推播 (Batch Notifications)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface BatchNotificationRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export const sendBatchNotification = onCall<BatchNotificationRequest>({
  region: 'asia-east1',
  enforceAppCheck: true,
  memory: '512MiB'
}, async (request) => {
  // 驗證管理員權限
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const userToken = await admin.auth().getUser(request.auth.uid);
  if (userToken.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', '權限不足');
  }

  const { userIds, title, body, data, imageUrl } = request.data;

  logger.info('批次推播請求', {
    userCount: userIds.length,
    title,
    requestedBy: request.auth.uid
  });

  try {
    // 批次取得使用者 FCM Tokens
    const userDocs = await Promise.all(
      userIds.map(uid =>
        admin.firestore().collection('users').doc(uid).get()
      )
    );

    const tokens = userDocs
      .filter(doc => doc.exists && doc.data()?.fcmToken)
      .map(doc => doc.data()!.fcmToken);

    if (tokens.length === 0) {
      throw new HttpsError('invalid-argument', '沒有有效的推播目標');
    }

    // 建立多播訊息
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl
      },
      data: data || {},
      tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          color: '#1890ff'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    // 發送批次推播
    const response = await admin.messaging().sendEachForMulticast(message);

    logger.info('批次推播完成', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    // 處理失敗的 token
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          logger.warn('推播失敗', {
            token: tokens[idx],
            error: resp.error?.message
          });
        }
      });

      // 清理無效的 token
      await cleanupInvalidTokens(failedTokens);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    logger.error('批次推播失敗', error);
    throw new HttpsError('internal', '批次推播失敗');
  }
});

async function cleanupInvalidTokens(tokens: string[]) {
  const batch = admin.firestore().batch();

  // 查找使用這些 token 的使用者並清除
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('fcmToken', 'in', tokens)
    .get();

  usersSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      fcmToken: admin.firestore.FieldValue.delete()
    });
  });

  await batch.commit();
}
```

### 3. 主題訂閱推播 (Topic Notifications)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface SubscribeToTopicRequest {
  token: string;
  topic: string;
}

export const subscribeToTopic = onCall<SubscribeToTopicRequest>({
  region: 'asia-east1'
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const { token, topic } = request.data;

  logger.info('訂閱主題', { uid: request.auth.uid, topic });

  try {
    // 訂閱主題
    await admin.messaging().subscribeToTopic(token, topic);

    // 記錄訂閱
    await admin.firestore()
      .collection('topic_subscriptions')
      .add({
        userId: request.auth.uid,
        topic,
        subscribedAt: new Date()
      });

    logger.info('主題訂閱成功', { uid: request.auth.uid, topic });

    return { success: true, topic };
  } catch (error) {
    logger.error('主題訂閱失敗', error);
    throw new HttpsError('internal', '主題訂閱失敗');
  }
});

export interface SendTopicNotificationRequest {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendTopicNotification = onCall<SendTopicNotificationRequest>({
  region: 'asia-east1',
  enforceAppCheck: true
}, async (request) => {
  // 驗證管理員權限
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const userToken = await admin.auth().getUser(request.auth.uid);
  if (userToken.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', '權限不足');
  }

  const { topic, title, body, data } = request.data;

  logger.info('發送主題推播', { topic, title });

  try {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body
      },
      data: data || {},
      topic,
      android: {
        priority: 'high',
        notification: {
          sound: 'default'
        }
      }
    };

    const response = await admin.messaging().send(message);

    logger.info('主題推播發送成功', {
      topic,
      messageId: response
    });

    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    logger.error('主題推播發送失敗', error);
    throw new HttpsError('internal', '主題推播發送失敗');
  }
});
```

### 4. 排程推播 (Scheduled Notifications)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const sendDailyReminders = onSchedule({
  schedule: '0 9 * * *', // 每天早上 9 點
  timeZone: 'Asia/Taipei',
  region: 'asia-east1'
}, async (event) => {
  logger.info('發送每日提醒推播', { scheduleTime: event.scheduleTime });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 查詢今天到期的任務
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('status', '==', 'in-progress')
      .where('dueDate', '>=', today)
      .where('dueDate', '<', tomorrow)
      .get();

    // 按負責人分組任務
    const tasksByAssignee = new Map<string, any[]>();
    
    tasksSnapshot.docs.forEach(doc => {
      const task = { id: doc.id, ...doc.data() };
      const assignee = task.assignee;
      
      if (!tasksByAssignee.has(assignee)) {
        tasksByAssignee.set(assignee, []);
      }
      
      tasksByAssignee.get(assignee)!.push(task);
    });

    // 為每個負責人發送推播
    const promises = Array.from(tasksByAssignee.entries()).map(
      async ([userId, tasks]) => {
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(userId)
          .get();

        const fcmToken = userDoc.data()?.fcmToken;
        
        if (!fcmToken) return;

        const message = {
          notification: {
            title: '今日任務提醒',
            body: `您有 ${tasks.length} 個任務今天到期`
          },
          data: {
            type: 'daily_reminder',
            taskCount: String(tasks.length)
          },
          token: fcmToken
        };

        await admin.messaging().send(message);
      }
    );

    await Promise.all(promises);

    logger.info('每日提醒推播完成', {
      userCount: tasksByAssignee.size,
      taskCount: tasksSnapshot.size
    });

    return { success: true };
  } catch (error) {
    logger.error('每日提醒推播失敗', error);
    throw error;
  }
});
```

### 5. FCM Token 管理 (Token Management)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface RegisterTokenRequest {
  token: string;
  platform: 'android' | 'ios' | 'web';
}

export const registerFCMToken = onCall<RegisterTokenRequest>({
  region: 'asia-east1'
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const { token, platform } = request.data;
  const uid = request.auth.uid;

  logger.info('註冊 FCM Token', { uid, platform });

  try {
    // 更新使用者的 FCM Token
    await admin.firestore()
      .collection('users')
      .doc(uid)
      .update({
        fcmToken: token,
        fcmPlatform: platform,
        fcmTokenUpdatedAt: new Date()
      });

    // 記錄 token 註冊
    await admin.firestore()
      .collection('fcm_tokens')
      .doc(uid)
      .set({
        token,
        platform,
        userId: uid,
        createdAt: new Date(),
        lastUsed: new Date()
      });

    logger.info('FCM Token 註冊成功', { uid });

    return { success: true };
  } catch (error) {
    logger.error('FCM Token 註冊失敗', error);
    throw new HttpsError('internal', 'Token 註冊失敗');
  }
});
```

## 📂 目錄結構

```
functions-fcm/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── task/                 # 任務推播
│   │   └── task-notifications.ts
│   ├── batch/                # 批次推播
│   │   └── batch-sender.ts
│   ├── topic/                # 主題推播
│   │   ├── subscribe.ts
│   │   └── topic-sender.ts
│   ├── scheduled/            # 排程推播
│   │   └── reminders.ts
│   └── token/                # Token 管理
│       └── token-manager.ts
└── tests/
    └── fcm.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-fcm
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,firestore
```

### 2. 部署

```bash
firebase deploy --only functions:fcm
```

## 📱 前端整合

### Angular Component 範例

```typescript
import { inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Functions, httpsCallable } from '@angular/fire/functions';

export class NotificationComponent {
  private messaging = inject(Messaging);
  private functions = inject(Functions);

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'YOUR_VAPID_KEY'
        });
        
        // 註冊 Token 到後端
        const registerToken = httpsCallable(
          this.functions, 
          'registerFCMToken'
        );
        
        await registerToken({ 
          token, 
          platform: 'web' 
        });
        
        console.log('FCM Token 註冊成功');
      }
    } catch (error) {
      console.error('推播權限請求失敗', error);
    }
  }

  listenToMessages() {
    onMessage(this.messaging, (payload) => {
      console.log('收到推播訊息', payload);
      
      // 顯示通知
      if (payload.notification) {
        new Notification(
          payload.notification.title || '',
          {
            body: payload.notification.body,
            icon: payload.notification.image
          }
        );
      }
    });
  }
}
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('sendBatchNotification', () => {
  it('應該發送批次推播', async () => {
    const wrapped = testEnv.wrap(sendBatchNotification);
    
    const result = await wrapped({
      data: {
        userIds: ['user1', 'user2'],
        title: '測試推播',
        body: '這是測試訊息'
      },
      auth: { uid: 'admin-user' }
    });

    expect(result.success).toBe(true);
    expect(result.successCount).toBeGreaterThan(0);
  });
});
```

## 🔧 故障排除

### 常見問題

1. **推播未收到**
   - 確認 FCM Token 已正確註冊
   - 檢查裝置是否開啟通知權限
   - 驗證推播訊息格式正確

2. **Token 無效**
   - Token 可能已過期，需要重新取得
   - 清除無效 Token 並重新註冊

3. **批次推播失敗**
   - 檢查 Token 陣列是否包含無效 Token
   - 確認批次大小未超過限制（500個）

## 📚 參考資源

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Server API](https://firebase.google.com/docs/cloud-messaging/server)
- [Platform-Specific Setup](https://firebase.google.com/docs/cloud-messaging/android/client)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎推播功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
