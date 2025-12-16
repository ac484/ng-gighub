# Cloud Functions 通知系統文檔

> Firebase Cloud Functions for automated push notifications

## 📋 概述

本文檔說明 GigHub 推送通知系統的 Cloud Functions 實作，包含自動化通知觸發器、通知偏好設定、以及後續階段的實施計畫。

### 核心功能

- ✅ **任務通知**: 任務狀態變更、任務指派
- ✅ **好友通知**: 好友請求、接受通知
- ✅ **日誌通知**: 新施工日誌
- ✅ **品質驗收通知**: 驗收任務指派、狀態變更
- ✅ **測試功能**: 可呼叫的測試通知函數
- ✅ **通知偏好**: 靜音時段、類型過濾、頻率控制

---

## 🏗️ 架構設計

### 函數結構

```
functions/
├── src/
│   ├── index.ts              # 主入口，匯出所有函數
│   └── notifications.ts      # 通知觸發器實作
├── package.json              # Node.js 依賴
└── tsconfig.json             # TypeScript 配置
```

### 函數列表

| 函數名稱 | 觸發類型 | 描述 |
|----------|----------|------|
| `onTaskStatusChanged` | Firestore Trigger | 任務狀態變更時觸發 |
| `onTaskAssigned` | Firestore Trigger | 任務被指派時觸發 |
| `onFriendRequestSent` | Firestore Trigger | 發送好友請求時觸發 |
| `onFriendRequestAccepted` | Firestore Trigger | 接受好友請求時觸發 |
| `onLogCreated` | Firestore Trigger | 建立施工日誌時觸發 |
| `onQualityInspectionCreated` | Firestore Trigger | 建立品質驗收時觸發 |
| `onQualityInspectionStatusChanged` | Firestore Trigger | 驗收狀態變更時觸發 |
| `sendTestNotification` | Callable HTTPS | 測試通知（需認證） |

---

## 📦 Cloud Functions 實作

### Helper Functions

#### 1. getUserFcmToken()

獲取使用者的 FCM token

```typescript
async function getUserFcmToken(userId: string): Promise<string | null>
```

**流程**:
1. 從 `fcm_tokens` 集合讀取使用者文檔
2. 檢查 token 是否存在且啟用
3. 返回 token 或 null

**錯誤處理**:
- Token 不存在 → 記錄警告，返回 null
- Token 未啟用 → 記錄警告，返回 null

#### 2. sendPushNotification()

發送推送通知

```typescript
async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean>
```

**流程**:
1. 構建 FCM message 物件
2. 呼叫 `admin.messaging().send()`
3. 處理無效 token 錯誤

**錯誤處理**:
- 無效 token → 記錄警告（未來可自動停用）
- 其他錯誤 → 記錄錯誤，返回 false

#### 3. createNotificationDocument()

建立通知文檔

```typescript
async function createNotificationDocument(
  userId: string,
  type: "通知" | "消息" | "待辦",
  title: string,
  description: string,
  link?: string,
  extra?: string
): Promise<void>
```

**文檔結構**:
```typescript
{
  userId: string,
  type: "通知" | "消息" | "待辦",
  title: string,
  description: string,
  link?: string,
  extra?: string,
  read: false,
  datetime: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4. notifyUser()

整合函數：建立通知文檔 + 發送推送

```typescript
async function notifyUser(
  userId: string,
  type: "通知" | "消息" | "待辦",
  title: string,
  description: string,
  link?: string,
  extra?: string
): Promise<void>
```

---

## 🔔 通知觸發器

### 1. 任務狀態變更 (onTaskStatusChanged)

**觸發條件**: `tasks/{taskId}` 文檔更新且 `status` 欄位變更

**通知對象**:
- Assignee (如果存在且不是更新者)
- Creator (如果與 assignee 和更新者不同)

**通知內容**:
```typescript
{
  type: "待辦",  // for assignee
  type: "通知",  // for creator
  title: "任務狀態更新",
  description: `任務「${taskName}」狀態已更改為 ${newStatus}`,
  link: `/tasks/${taskId}`,
  extra: newStatus
}
```

**範例場景**:
```
任務 A 狀態從 "進行中" 變更為 "已完成"
→ 通知 assignee: "任務「網站開發」狀態已更改為 已完成"
→ 通知 creator: "任務「網站開發」狀態已更改為 已完成"
```

### 2. 任務指派 (onTaskAssigned)

**觸發條件**: `tasks/{taskId}` 文檔更新且 `assigneeId` 欄位變更

**通知對象**:
- 新的 assignee (僅在指派時，不在取消指派時)

**通知內容**:
```typescript
{
  type: "待辦",
  title: "新任務指派",
  description: `您被指派了任務「${taskName}」`,
  link: `/tasks/${taskId}`,
  extra: "新指派"
}
```

### 3. 好友請求 (onFriendRequestSent)

**觸發條件**: `friend_relations/{relationId}` 文檔建立且 `status` 為 "pending"

**通知對象**:
- 好友請求接收者 (recipientId)

**通知內容**:
```typescript
{
  type: "消息",
  title: "新好友請求",
  description: `${requesterName} 想加您為好友`,
  link: `/friends/requests`,
  extra: "待回應"
}
```

### 4. 好友接受 (onFriendRequestAccepted)

**觸發條件**: `friend_relations/{relationId}` 文檔更新且 `status` 從非 "accepted" 變更為 "accepted"

**通知對象**:
- 原始請求者 (requesterId)

**通知內容**:
```typescript
{
  type: "消息",
  title: "好友請求已接受",
  description: `${recipientName} 接受了您的好友請求`,
  link: `/friends`,
  extra: "已接受"
}
```

### 5. 日誌建立 (onLogCreated)

**觸發條件**: `logs/{logId}` 文檔建立

**通知對象**:
- Blueprint 擁有者 (如果不是建立者)

**通知內容**:
```typescript
{
  type: "通知",
  title: "新施工日誌",
  description: `新增了施工日誌「${logTitle}」`,
  link: `/logs/${logId}`,
  extra: "新日誌"
}
```

### 6. 品質驗收 (Quality Inspections)

#### 6.1 建立驗收 (onQualityInspectionCreated)

**觸發條件**: `quality/{qualityId}` 文檔建立

**通知對象**:
- 驗收人員 (inspectorId，如果不是建立者)

**通知內容**:
```typescript
{
  type: "待辦",
  title: "新品質驗收任務",
  description: `您被指派了品質驗收任務「${qualityTitle}」`,
  link: `/quality/${qualityId}`,
  extra: "待驗收"
}
```

#### 6.2 狀態變更 (onQualityInspectionStatusChanged)

**觸發條件**: `quality/{qualityId}` 文檔更新且 `status` 欄位變更

**通知對象**:
- 建立者 (creatorId，如果不是更新者)

**通知內容**:
```typescript
{
  type: "通知",
  title: "品質驗收狀態更新",
  description: `品質驗收「${qualityTitle}」狀態已更改為 ${newStatus}`,
  link: `/quality/${qualityId}`
}
```

---

## 🧪 測試通知函數

### sendTestNotification (Callable HTTPS)

可呼叫函數，用於測試推送通知系統。

**認證**: 需要使用者認證

**參數**:
```typescript
{
  title?: string,    // 預設: "測試通知"
  body?: string,     // 預設: "這是一則測試通知"
  data?: Record<string, string>,
  link?: string
}
```

**返回**:
```typescript
{
  success: boolean
}
```

**前端呼叫範例**:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const testNotification = httpsCallable(functions, 'sendTestNotification');

async function sendTest() {
  try {
    const result = await testNotification({
      title: '測試通知',
      body: '這是一則測試通知',
      link: '/dashboard'
    });
    
    console.log('Success:', result.data.success);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## ⚙️ 通知偏好設定

### NotificationPreferences 模型

```typescript
interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  mutePeriods: MutePeriod[];
  filters: {
    tasks: boolean;
    logs: boolean;
    quality: boolean;
    friends: boolean;
    general: boolean;
  };
  frequency: {
    minInterval: number;  // 最小間隔 (分鐘)
    maxPerHour: number;   // 每小時最大數量
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MutePeriod {
  startTime: string;  // "22:00"
  endTime: string;    // "08:00"
  days: number[];     // [0-6], 0=Sunday
  enabled: boolean;
}
```

### 預設值

```typescript
{
  enabled: true,
  mutePeriods: [],
  filters: {
    tasks: true,
    logs: true,
    quality: true,
    friends: true,
    general: true
  },
  frequency: {
    minInterval: 5,   // 5 分鐘
    maxPerHour: 10    // 每小時最多 10 則
  }
}
```

### Repository 方法

```typescript
// 獲取偏好設定 (不存在則建立預設值)
async getOrCreate(userId: string): Promise<NotificationPreferences>

// 建立偏好設定
async create(data: CreateNotificationPreferencesData): Promise<NotificationPreferences>

// 更新偏好設定
async update(userId: string, data: UpdateNotificationPreferencesData): Promise<void>

// 啟用/停用通知
async enable(userId: string): Promise<void>
async disable(userId: string): Promise<void>

// 管理靜音時段
async addMutePeriod(userId: string, mutePeriod: MutePeriod): Promise<void>
async removeMutePeriod(userId: string, index: number): Promise<void>
```

---

## 🚀 部署與使用

### 部署 Cloud Functions

```bash
# 進入 functions 目錄
cd functions

# 安裝依賴
npm install

# 編譯 TypeScript
npm run build

# 部署所有函數
firebase deploy --only functions

# 部署特定函數
firebase deploy --only functions:onTaskStatusChanged
```

### 本地測試

```bash
# 啟動 Firebase Emulators
npm run serve

# 或使用
firebase emulators:start --only functions,firestore
```

### 查看日誌

```bash
# 即時日誌
firebase functions:log

# 特定函數日誌
firebase functions:log --only onTaskStatusChanged
```

---

## 📊 監控與除錯

### Firebase Console

1. **Functions Dashboard**: 查看函數執行次數、錯誤率
2. **Logs Explorer**: 詳細日誌查詢
3. **Performance Monitoring**: 函數執行時間分析

### 日誌格式

所有函數使用標準化日誌格式:

```typescript
logger.info(`Task ${taskId} status changed: ${before} -> ${after}`);
logger.warn(`No FCM token found for user: ${userId}`);
logger.error('Error sending push notification:', error);
```

---

## 🔐 安全性

### Firestore Security Rules

```javascript
// notifications 集合 - 只有後端可建立
match /notifications/{notificationId} {
  allow read, update, delete: if isAuthenticated() 
    && resource.data.userId == getCurrentAccountId();
  allow create: if false;  // Only via Cloud Functions
}

// fcm_tokens 集合 - 使用者可管理自己的 token
match /fcm_tokens/{userId} {
  allow read, create, update, delete: if isAuthenticated() 
    && userId == getCurrentAccountId();
}

// notification_preferences 集合 - 使用者可管理自己的偏好
match /notification_preferences/{userId} {
  allow read, create, update, delete: if isAuthenticated() 
    && userId == getCurrentAccountId();
}
```

### Admin SDK 權限

Cloud Functions 使用 Firebase Admin SDK，擁有：
- ✅ 完整 Firestore 讀寫權限
- ✅ 完整 FCM 發送權限
- ✅ 繞過 Security Rules (僅限 Cloud Functions)

### 成本控制

```typescript
setGlobalOptions({ maxInstances: 10 });
```

- 限制同時執行的函數實例數量
- 防止意外流量導致高額費用
- 可針對個別函數調整

---

## 🎯 後續階段計畫

### Phase 6: 分析追蹤 (計畫中)

#### 整合 Firebase Analytics

```typescript
// 追蹤通知送達
analytics.logEvent('notification_delivered', {
  notification_type: 'task_status_changed',
  user_id: userId,
  task_id: taskId
});

// 追蹤通知點擊
analytics.logEvent('notification_clicked', {
  notification_type: 'task_status_changed',
  user_id: userId,
  from_notification: true
});
```

#### 指標追蹤

- **送達率**: 成功發送的通知比例
- **點擊率**: 使用者點擊通知的比例
- **錯誤率**: 發送失敗的比例
- **響應時間**: 觸發到送達的時間

### Phase 7: 好友功能整合 (計畫中)

#### 額外通知類型

- 好友動態通知
- 好友生日提醒
- 好友專案邀請

### Phase 8: 互動通知 (計畫中)

#### 快速回覆

```javascript
// Service Worker
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'reply') {
    // 處理快速回覆
    const reply = event.reply;
    // 發送回覆到後端
  }
});
```

#### Rich Media

- 圖片通知
- 影片縮圖
- 自定義動作按鈕

---

## 📚 參考資源

### 官方文檔

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)

### 內部文檔

- [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) - 推送通知完整文檔
- [FINAL_PROJECT_STRUCTURE.md](../architecture/FINAL_PROJECT_STRUCTURE.md) - 專案架構
- [⭐.md](../../⭐.md) - 開發流程指引

---

## ✅ 檢查清單

### 開發

- [x] Cloud Functions 實作完成
- [x] 通知觸發器測試
- [x] 錯誤處理完善
- [x] 日誌記錄完整
- [x] 通知偏好模型建立
- [x] Repository 實作完成
- [ ] UI 元件開發

### 部署

- [ ] Functions 部署到 Firebase
- [ ] Security Rules 部署
- [ ] 生產環境測試
- [ ] 監控設定

### 文檔

- [x] Cloud Functions 文檔
- [x] API 參考文檔
- [x] 使用範例
- [ ] 故障排除指南

---

**版本**: 1.0.0  
**最後更新**: 2025-12-14  
**狀態**: Phase 1-5 完成，Phase 6-8 計畫中
