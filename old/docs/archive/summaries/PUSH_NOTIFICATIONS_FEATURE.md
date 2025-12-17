# 推送通知功能文檔

> **版本**: 1.0.0  
> **建立日期**: 2025-12-14  
> **@angular/fire 版本**: 20.0.1  
> **狀態**: ✅ 已實施

## 📋 目錄

1. [概述](#概述)
2. [架構設計](#架構設計)
3. [核心元件](#核心元件)
4. [使用指南](#使用指南)
5. [開發指南](#開發指南)
6. [測試指南](#測試指南)
7. [故障排除](#故障排除)

---

## 概述

### 功能描述

GigHub 推送通知系統基於 Firebase Cloud Messaging (FCM) 實現，提供即時的工地施工進度更新、任務提醒和系統通知。

### 核心特性

✅ **現代化架構**
- Angular 20 Signals 狀態管理
- Standalone Components
- OnPush 變更檢測策略
- TypeScript 5.9 嚴格模式

✅ **完整功能**
- 前景通知（應用在使用中）
- 背景通知（應用最小化或關閉）
- 通知點擊導航
- 權限管理
- Token 管理與刷新

✅ **安全性**
- VAPID 金鑰驗證
- Service Worker 隔離
- Firestore Security Rules 保護

✅ **可靠性**
- 錯誤處理與恢復
- 自動重試機制
- 瀏覽器相容性檢查
- SSR 環境保護

---

## 架構設計

### 三層架構

遵循 GigHub 專案的三層架構設計原則：

```
┌─────────────────────────────────────────┐
│          UI Layer (Presentation)         │
│  - NotificationSettingsComponent         │
│  - 通知權限管理界面                       │
│  - 用戶互動與狀態展示                     │
└──────────────────┬──────────────────────┘
                   │ inject()
┌──────────────────▼──────────────────────┐
│         Service Layer (Business)         │
│  - PushMessagingService                  │
│  - 權限管理                              │
│  - Token 註冊與刷新                      │
│  - 前景消息處理                          │
│  - 錯誤處理與日誌                        │
└──────────────────┬──────────────────────┘
                   │ inject()
┌──────────────────▼──────────────────────┐
│      Repository Layer (Data Access)      │
│  - NotificationRepository                │
│  - Firestore CRUD 操作                   │
│  - 即時訂閱管理                          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Infrastructure Layer             │
│  - Firebase Messaging (FCM)              │
│  - Service Worker                        │
│  - Firestore                             │
└─────────────────────────────────────────┘
```

### 狀態管理流程

```mermaid
graph TD
    A[User Action] --> B[PushMessagingService]
    B --> C{Permission Check}
    C -->|Granted| D[Register Token]
    C -->|Denied| E[Show Error]
    C -->|Default| F[Request Permission]
    D --> G[Save to Firestore]
    G --> H[Listen for Messages]
    H --> I[NotificationStore]
    I --> J[UI Update]
```

---

## 核心元件

### 1. PushMessagingService

**位置**: `src/app/core/services/push-messaging.service.ts`

**職責**:
- 推送通知生命週期管理
- 權限請求與狀態追蹤
- FCM Token 註冊與刷新
- 前景消息接收與處理
- 錯誤處理與恢復

**Signals**:
```typescript
// Public readonly state
readonly permission: Signal<NotificationPermission | 'unsupported'>
readonly pushToken: Signal<string | null>
readonly initialized: Signal<boolean>
readonly error: Signal<PushMessagingError | null>
readonly loading: Signal<boolean>

// Computed states
readonly hasPermission: Signal<boolean>
readonly isSupported: Signal<boolean>
readonly canRequestPermission: Signal<boolean>
readonly isReady: Signal<boolean>
```

**核心方法**:
```typescript
// 初始化推送通知
async init(userId: string): Promise<void>

// 請求通知權限
async requestPermission(): Promise<boolean>

// 刷新 FCM Token
async refreshToken(userId: string): Promise<void>

// 清除錯誤狀態
clearError(): void
```

**使用範例**:
```typescript
import { inject } from '@angular/core';
import { PushMessagingService } from '@core/services/push-messaging.service';

export class MyComponent {
  private pushService = inject(PushMessagingService);

  async ngOnInit() {
    const userId = 'user123';
    
    try {
      await this.pushService.init(userId);
      
      if (this.pushService.isReady()) {
        console.log('Push notifications ready!');
        console.log('Token:', this.pushService.pushToken());
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }
}
```

### 2. NotificationSettingsComponent

**位置**: `src/app/routes/settings/notification-settings/notification-settings.component.ts`

**職責**:
- 通知設定 UI
- 權限管理界面
- Token 顯示與複製
- 測試通知發送

**功能**:
- ✅ 顯示瀏覽器支援狀態
- ✅ 顯示權限狀態（已授權、已拒絕、尚未詢問、不支援）
- ✅ 請求通知權限按鈕
- ✅ 初始化推送通知按鈕
- ✅ 刷新 Token 按鈕
- ✅ 發送測試通知按鈕
- ✅ FCM Token 顯示與複製
- ✅ 瀏覽器設定指引

**路由配置**:
```typescript
// src/app/routes/routes.ts
{
  path: 'settings',
  children: [
    {
      path: 'notifications',
      component: NotificationSettingsComponent,
      data: { title: '通知設定' }
    }
  ]
}
```

### 3. Service Worker

**位置**: `public/firebase-messaging-sw.js`

**職責**:
- 背景消息接收
- 通知顯示
- 通知點擊處理
- 智能導航

**功能**:
- ✅ 背景消息處理
- ✅ 自定義通知外觀（標題、內容、圖示、徽章）
- ✅ 通知操作按鈕
- ✅ 點擊導航到指定頁面
- ✅ 多窗口管理（聚焦或開新窗口）

**消息格式**:
```json
{
  "notification": {
    "title": "任務更新",
    "body": "您的任務「外牆施工」已完成",
    "icon": "/assets/logo.svg"
  },
  "data": {
    "link": "/tasks/123",
    "type": "待辦",
    "tag": "task-123",
    "requireInteraction": "false"
  }
}
```

### 4. NotificationRepository

**位置**: `src/app/core/data-access/repositories/shared/notification.repository.ts`

**職責**:
- Firestore 通知 CRUD
- 即時訂閱管理
- 批量操作

**核心方法**:
```typescript
// 查詢用戶所有通知
async findAllByUser(userId: string): Promise<Notification[]>

// 建立通知
async create(data: CreateNotificationData): Promise<Notification>

// 標記為已讀
async markAsRead(id: string): Promise<void>

// 標記所有為已讀
async markAllAsRead(userId: string): Promise<void>

// 即時訂閱
subscribeToRealtimeUpdates(userId: string, callback: Function): () => void
```

### 5. NotificationStore

**位置**: `src/app/core/state/stores/notification.store.ts`

**職責**:
- 通知狀態管理
- 分組邏輯
- 未讀計數

**Signals**:
```typescript
readonly notifications: Signal<Notification[]>
readonly loading: Signal<boolean>
readonly error: Signal<string | null>

// Computed
readonly groupedNotifications: Signal<NotificationGroup[]>
readonly unreadCount: Signal<number>
readonly todoNotifications: Signal<Notification[]>
readonly unreadTodoCount: Signal<number>
```

---

## 使用指南

### 初始化流程

1. **用戶登入後自動初始化**

```typescript
// src/app/core/startup/startup.service.ts
import { inject } from '@angular/core';
import { PushMessagingService } from '@core/services/push-messaging.service';
import { FirebaseService } from '@core/services/firebase.service';

export class StartupService {
  private pushService = inject(PushMessagingService);
  private firebase = inject(FirebaseService);

  async load(): Promise<void> {
    const userId = this.firebase.getCurrentUserId();
    
    if (userId) {
      try {
        await this.pushService.init(userId);
      } catch (error) {
        console.error('Push notification init failed:', error);
        // Non-critical, continue app startup
      }
    }
  }
}
```

2. **手動初始化（通知設定頁）**

用戶可以在 `/settings/notifications` 頁面手動管理推送通知。

### 發送推送通知

#### 方式 1: Firebase Console（手動測試）

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 `elite-chiller-455712-c4`
3. 進入 **Messaging** > **Send your first message**
4. 填寫：
   - **Notification title**: 測試通知
   - **Notification text**: 這是一則測試消息
   - **Target**: Device token
   - **Token**: 從設定頁複製的 FCM Token
5. 點擊 **Send**

#### 方式 2: 後端 API（生產環境）

**Node.js 範例** (Firebase Admin SDK):
```javascript
const admin = require('firebase-admin');

// 初始化 Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// 發送通知
async function sendNotification(token, title, body, data) {
  const message = {
    notification: {
      title: title,
      body: body,
      icon: '/assets/logo.svg'
    },
    data: data || {},
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// 使用範例
sendNotification(
  'user-fcm-token-here',
  '任務更新',
  '您的任務「外牆施工」已完成',
  {
    type: '待辦',
    link: '/tasks/123',
    saveToDb: 'true'
  }
);
```

**Cloud Functions 範例**:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 當任務狀態改變時發送通知
exports.onTaskStatusChanged = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    
    if (newValue.status !== previousValue.status) {
      const userId = newValue.assigneeId;
      
      // 獲取用戶的 FCM token
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const fcmToken = userDoc.data()?.fcmToken;
      
      if (fcmToken) {
        const message = {
          notification: {
            title: '任務狀態更新',
            body: `任務「${newValue.name}」狀態已更改為 ${newValue.status}`
          },
          data: {
            type: '待辦',
            link: `/tasks/${context.params.taskId}`,
            taskId: context.params.taskId
          },
          token: fcmToken
        };
        
        await admin.messaging().send(message);
      }
    }
  });
```

### 通知類型

**支援的通知類型** (NotificationType enum):
- `通知`: 一般系統通知
- `消息`: 用戶間消息
- `待辦`: 任務提醒

**通知狀態** (NotificationStatus enum):
- `todo`: 待處理
- `processing`: 處理中
- `urgent`: 緊急
- `doing`: 進行中

---

## 開發指南

### 環境配置

**1. Firebase 配置**

確保 `src/environments/environment.ts` 包含正確的 Firebase 配置：

```typescript
export const environment = {
  firebaseConfig: {
    apiKey: 'AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI',
    authDomain: 'elite-chiller-455712-c4.firebaseapp.com',
    projectId: 'elite-chiller-455712-c4',
    storageBucket: 'elite-chiller-455712-c4.firebasestorage.app',
    messagingSenderId: '7807661688',
    appId: '1:7807661688:web:5f96a5fe30b799f31d1f8d'
  },
  firebaseMessagingPublicKey: 'BMfTfys7cErI2JVFmjkWSeCb7ClvFklQ4r69lWGIYT2dSq5VD2eguZlckvdq2QJhdGskeyUg0G6RcC8WmlBztFY'
};
```

**2. Service Worker 註冊**

Service Worker 自動由 `PushMessagingService` 註冊，無需手動配置。

**3. VAPID 金鑰**

VAPID 金鑰已配置在 `environment.ts`。如需重新生成：

```bash
# 使用 Firebase CLI
firebase messaging:generate-key

# 或使用 web-push CLI
npx web-push generate-vapid-keys
```

### 擴展功能

#### 自定義通知樣式

修改 `public/firebase-messaging-sw.js`:

```javascript
messaging.onBackgroundMessage(payload => {
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/assets/custom-icon.svg',
    badge: '/assets/custom-badge.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: '查看詳情' },
      { action: 'dismiss', title: '忽略' }
    ]
  };
  
  self.registration.showNotification(payload.notification.title, notificationOptions);
});
```

#### 添加通知音效

```javascript
const notificationOptions = {
  ...otherOptions,
  sound: '/assets/sounds/notification.mp3',
  silent: false
};
```

#### 通知分組

```javascript
const notificationOptions = {
  ...otherOptions,
  tag: `task-${taskId}`,  // 相同 tag 的通知會合併
  renotify: true           // 更新時重新提醒
};
```

### Firestore Security Rules

確保 `firestore.rules` 包含通知集合的規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 通知規則
    match /notifications/{notificationId} {
      // 用戶只能讀取自己的通知
      allow read: if request.auth != null 
                  && request.auth.uid == resource.data.userId;
      
      // 用戶可以更新自己的通知（例如標記為已讀）
      allow update: if request.auth != null 
                    && request.auth.uid == resource.data.userId
                    && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['read', 'updatedAt']);
      
      // 只有後端可以建立通知（透過 Admin SDK）
      allow create: if false;
      
      // 用戶可以刪除自己的通知
      allow delete: if request.auth != null 
                    && request.auth.uid == resource.data.userId;
    }
    
    // FCM Tokens 規則
    match /fcm_tokens/{userId} {
      // 用戶只能讀寫自己的 token
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

---

## 測試指南

### 單元測試

**PushMessagingService 測試範例**:

```typescript
import { TestBed } from '@angular/core/testing';
import { PushMessagingService } from './push-messaging.service';

describe('PushMessagingService', () => {
  let service: PushMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PushMessagingService]
    });
    service = TestBed.inject(PushMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check browser support', async () => {
    const supported = await service['checkSupport']();
    expect(typeof supported).toBe('boolean');
  });

  it('should have default unsupported permission in SSR', () => {
    // In SSR environment
    expect(service.isSupported()).toBe(false);
  });
});
```

### 整合測試

**測試通知接收流程**:

```typescript
describe('Push Notification Flow', () => {
  it('should initialize and receive notification', async () => {
    const userId = 'test-user-123';
    
    // 1. Initialize
    await pushService.init(userId);
    expect(pushService.initialized()).toBe(true);
    
    // 2. Check permission
    expect(pushService.hasPermission()).toBe(true);
    
    // 3. Get token
    const token = pushService.pushToken();
    expect(token).toBeTruthy();
    
    // 4. Send test notification via FCM
    // (use Firebase Admin SDK in test)
    await sendTestNotification(token);
    
    // 5. Verify notification received
    // (check NotificationStore)
  });
});
```

### E2E 測試

使用 Playwright 測試完整流程：

```typescript
import { test, expect } from '@playwright/test';

test('push notification settings', async ({ page, context }) => {
  // 授予通知權限
  await context.grantPermissions(['notifications']);
  
  // 導航到設定頁
  await page.goto('/settings/notifications');
  
  // 檢查初始狀態
  await expect(page.locator('text=通知權限')).toBeVisible();
  
  // 點擊初始化按鈕
  await page.click('button:has-text("初始化推送通知")');
  
  // 等待初始化完成
  await expect(page.locator('text=已初始化')).toBeVisible();
  
  // 檢查 Token 顯示
  await expect(page.locator('input[readonly]')).toHaveValue(/^[A-Za-z0-9_-]+$/);
});
```

---

## 故障排除

### 常見問題

#### 1. 通知權限被拒絕

**問題**: 用戶之前拒絕了通知權限

**解決方案**:
- 指導用戶在瀏覽器設定中手動啟用通知
- Chrome: 網址列 → 鎖頭圖示 → 網站設定 → 通知 → 允許
- Firefox: 網址列 → 鎖頭圖示 → 權限 → 通知 → 允許

#### 2. Service Worker 註冊失敗

**問題**: `Service worker registration failed`

**檢查項目**:
- ✅ 確保應用運行在 HTTPS 或 localhost
- ✅ 確保 `public/firebase-messaging-sw.js` 存在且路徑正確
- ✅ 檢查瀏覽器控制台是否有 JavaScript 錯誤
- ✅ 清除瀏覽器緩存和 Service Worker

**解決方案**:
```bash
# 清除 Service Worker
# 瀏覽器 DevTools → Application → Service Workers → Unregister

# 或在程式碼中
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

#### 3. Token 無法獲取

**問題**: `getToken()` 返回空或錯誤

**可能原因**:
- VAPID 金鑰錯誤
- Firebase 配置錯誤
- Service Worker 未正確註冊

**解決方案**:
```typescript
// 檢查 VAPID 金鑰
console.log('VAPID Key:', environment.firebaseMessagingPublicKey);

// 檢查 Service Worker 狀態
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Status:', reg?.active?.state);
});

// 重新生成 Token
await pushService.refreshToken(userId);
```

#### 4. 前景通知不顯示

**問題**: 應用在前景時收到消息但沒有顯示通知

**原因**: 前景消息需要手動處理

**解決方案**: 已在 `PushMessagingService.listenForMessages()` 中實作

#### 5. 背景通知不顯示

**問題**: 應用在背景時收到消息但沒有通知

**檢查項目**:
- ✅ Service Worker 是否正確運行
- ✅ `onBackgroundMessage` 處理程序是否正確
- ✅ 通知權限是否已授予
- ✅ 瀏覽器是否允許背景通知（某些瀏覽器設定可能禁用）

**除錯方法**:
```javascript
// 在 firebase-messaging-sw.js 中添加日誌
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);
  // ... rest of handler
});
```

#### 6. 通知點擊無反應

**問題**: 點擊通知後沒有導航

**檢查項目**:
- ✅ `notificationclick` 事件處理程序是否正確
- ✅ `data.link` 欄位是否存在
- ✅ 目標 URL 是否有效

**解決方案**: 確保通知 payload 包含 `data.link`:

```json
{
  "data": {
    "link": "/tasks/123"
  }
}
```

### 除錯技巧

#### 啟用詳細日誌

```typescript
// 在 LoggerService 中設定 DEBUG 級別
this.logger.setLevel('DEBUG');
```

#### 檢查 FCM 消息

使用 Chrome DevTools:
1. 開啟 DevTools → Application → Service Workers
2. 檢查 "Update on reload" 和 "Bypass for network"
3. 發送測試通知
4. 查看 Console 中的日誌

#### 測試不同場景

```typescript
// 1. 測試權限狀態
console.log('Permission:', Notification.permission);

// 2. 測試瀏覽器支援
isSupported().then(supported => console.log('Supported:', supported));

// 3. 測試 Token 獲取
getToken(messaging, { vapidKey }).then(token => console.log('Token:', token));

// 4. 手動觸發前景消息
onMessage(messaging, payload => console.log('Message:', payload));
```

### 性能監控

**監控指標**:
- Token 註冊成功率
- 通知送達率
- 通知點擊率
- 錯誤率

**實作範例**:
```typescript
// 在 PushMessagingService 中添加分析
private async registerToken(userId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // ... token registration logic
    
    const duration = Date.now() - startTime;
    this.analytics.logEvent('fcm_token_registered', {
      userId,
      duration,
      success: true
    });
  } catch (error) {
    this.analytics.logEvent('fcm_token_failed', {
      userId,
      error: (error as Error).message
    });
    throw error;
  }
}
```

---

## 最佳實踐

### 1. 用戶體驗

- ✅ 在適當時機請求權限（不要在頁面載入時立即請求）
- ✅ 清楚說明推送通知的好處
- ✅ 提供選項讓用戶管理通知偏好
- ✅ 尊重用戶的拒絕決定

### 2. 性能優化

- ✅ 使用 OnPush 變更檢測策略
- ✅ 懶載入通知設定元件
- ✅ 批次處理大量通知
- ✅ 使用虛擬滾動顯示通知列表

### 3. 安全性

- ✅ 驗證所有通知內容
- ✅ 使用 Firestore Security Rules 保護資料
- ✅ 定期刷新過期 Token
- ✅ 不在通知中包含敏感資訊

### 4. 可維護性

- ✅ 使用 TypeScript 嚴格模式
- ✅ 編寫完整的 JSDoc 註解
- ✅ 單元測試覆蓋率 > 80%
- ✅ 遵循專案架構規範

---

## 參考資源

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [@angular/fire Documentation](https://github.com/angular/angularfire)
- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

## 變更日誌

### v1.0.0 (2025-12-14)

**新功能**:
- ✅ 實作現代化 PushMessagingService（Angular 20 + Signals）
- ✅ 實作 NotificationSettingsComponent
- ✅ 增強 Service Worker 功能
- ✅ 添加錯誤處理與恢復機制
- ✅ 添加完整的文檔和測試指南

**改進**:
- ✅ 使用 Signals 取代傳統狀態管理
- ✅ 添加 TypeScript 類型定義
- ✅ 改進錯誤處理和日誌
- ✅ 增強瀏覽器相容性檢查

---

## 授權

MIT License - GigHub Project
