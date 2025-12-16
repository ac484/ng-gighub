# Notification System Implementation Guide

## 📝 概述 (Overview)

本文件說明如何實現讓 `task.component.ts` 和 `notify.component.ts` 具備真實用途的通知系統。

### 目標
- 將假資料替換為真實的 Firebase 資料
- 使用 Angular 20 Signals 進行狀態管理
- 實現即時通知功能（Firebase Realtime）
- 遵循專案三層架構（Foundation → Infra → Facade）
- 符合奧卡姆剃刀原則（最小化複雜度）

## 🏗️ 架構設計

### 三層架構

```
┌─────────────────────────────────────────┐
│        Widget Components                 │
│  (task.component / notify.component)    │
│  - 使用 OnPush 變更偵測                 │
│  - inject() 依賴注入                    │
│  - 新控制流語法 (@if, @for)            │
└──────────────┬──────────────────────────┘
               │ inject(NotificationStore)
               ▼
┌─────────────────────────────────────────┐
│          Store Layer (Facades)          │
│  NotificationStore                      │
│  - Signals (loading, data, error)       │
│  - Computed (groupedNotifications,      │
│    unreadCount, todoNotifications)      │
│  - Actions (load, markAsRead, clear)    │
└──────────────┬──────────────────────────┘
               │ inject(NotificationRepository)
               ▼
┌─────────────────────────────────────────┐
│       Repository Layer (Infra)          │
│  NotificationRepository                 │
│  - findAllByUser()                      │
│  - markAsRead()                         │
│  - deleteByType()                       │
│  - subscribeToChanges() (Realtime)      │
└──────────────┬──────────────────────────┘
               │ inject(FirebaseService)
               ▼
┌─────────────────────────────────────────┐
│         Firebase Service                │
│  - Database queries                     │
│  - Realtime subscriptions               │
│  - Authentication                       │
└─────────────────────────────────────────┘
```

## 📦 已實現的檔案

### 1. 模型層 (Foundation Layer)

**檔案**: `src/app/core/models/notification.model.ts`

定義了以下介面：
- `Notification` - 通知資料結構
- `NotificationType` - 通知類型枚舉（通知、消息、待辦）
- `NotificationStatus` - 待辦狀態枚舉
- `NotificationGroup` - ng-alain notice-icon 分組結構
- `CreateNotificationData` - 建立通知請求
- `UpdateNotificationData` - 更新通知請求

### 2. Repository 層 (Infrastructure Layer)

**檔案**: `src/app/core/repositories/notification.repository.ts`

提供的方法：
- `findAllByUser(userId: string)` - 查詢使用者的所有通知
- `findUnreadByUser(userId: string)` - 查詢未讀通知
- `create(data: CreateNotificationData)` - 建立新通知
- `markAsRead(id: string)` - 標記通知為已讀
- `markAllAsRead(userId: string)` - 全部標記已讀
- `update(id: string, data: UpdateNotificationData)` - 更新通知
- `deleteByType(userId: string, type: string)` - 依類型刪除
- `delete(id: string)` - 刪除單一通知
- `subscribeToChanges(userId: string, callback)` - 訂閱即時更新

### 3. Store 層 (Facade Layer)

**檔案**: `src/app/core/stores/notification.store.ts`

**Signals 狀態**:
- `notifications` - 通知列表（只讀）
- `loading` - 載入狀態（只讀）
- `error` - 錯誤訊息（只讀）

**Computed Signals**:
- `groupedNotifications` - 依類型分組的通知（用於 notify.component）
- `unreadCount` - 未讀通知數量
- `todoNotifications` - 待辦類型通知（用於 task.component）
- `unreadTodoCount` - 未讀待辦數量

**Actions**:
- `loadNotifications(userId: string)` - 載入通知
- `markAsRead(id: string)` - 標記已讀
- `markAllAsRead(userId: string)` - 全部標記已讀
- `clearByType(userId: string, type: string)` - 清空類型
- `subscribeToRealtimeUpdates(userId: string, destroyRef: DestroyRef)` - 訂閱即時更新
- `clearError()` - 清除錯誤
- `reset()` - 重置 Store

### 4. 元件層 (Presentation Layer)

#### notify.component.ts

**更新內容**:
- 使用 `NotificationStore` 管理狀態
- 連接真實 Firebase 資料
- 實現即時更新訂閱
- 處理使用者互動（點擊、清空）

**關鍵程式碼**:
```typescript
protected readonly notificationStore = inject(NotificationStore);

async ngOnInit(): Promise<void> {
  const user = await this.firebase.getCurrentUser();
  if (user) {
    this.notificationStore.subscribeToRealtimeUpdates(user.id, this.destroyRef);
  }
}

async loadData(): Promise<void> {
  const user = await this.firebase.getCurrentUser();
  if (user) {
    await this.notificationStore.loadNotifications(user.id);
  }
}
```

#### task.component.ts

**更新內容**:
- 共享 `NotificationStore`（與 notify.component）
- 只顯示「待辦」類型通知
- 顯示未讀待辦數量 Badge
- 點擊通知時標記已讀並導航

**關鍵程式碼**:
```typescript
protected readonly notificationStore = inject(NotificationStore);

// 使用 computed signal 過濾待辦通知
readonly todoNotifications = computed(() => 
  this.notificationStore.notifications().filter(n => n.type === NotificationType.TODO)
);

readonly unreadTodoCount = computed(() => 
  this.todoNotifications().filter(n => !n.read).length
);
```

### 5. 資料庫遷移

**功能**:
- 建立 `notifications` 資料表
- 設定欄位約束和預設值
- 建立效能索引
- 設定 RLS (Row Level Security) policies
- 啟用 Realtime publication
- 建立自動更新 `updated_at` 觸發器

**資料表結構**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('通知', '消息', '待辦')),
  title TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false,
  extra TEXT,
  status TEXT CHECK (status IN ('todo', 'processing', 'urgent', 'doing')),
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 🚀 部署步驟

### 1. 執行資料庫遷移

```bash
# 連接到 Firebase CLI
firebase login

# 執行遷移
firebase db push

# 或直接在 Firebase Dashboard 執行 SQL
```

### 2. 安裝依賴（如果尚未安裝）

```bash
yarn install
```

### 3. 啟動開發伺服器

```bash
yarn start
```

### 4. 測試通知系統

1. **登入系統**
   - 確保使用者已通過 Firebase Auth 登入
   - Firebase session 會自動同步

2. **建立測試通知**
   ```sql
   -- 在 Firebase Dashboard SQL Editor 執行
   INSERT INTO notifications (user_id, type, title, description, read) VALUES
     ('your-user-id', '通知', '測試通知', '這是測試描述', false);
   ```

3. **驗證功能**
   - [ ] 通知出現在 header notify widget
   - [ ] 未讀數量正確顯示
   - [ ] 點擊通知標記為已讀
   - [ ] 清空功能運作正常
   - [ ] 待辦通知出現在 task widget
   - [ ] Realtime 更新即時同步

## 🔒 安全性

### RLS Policies

所有通知都受 RLS 保護：
- ✅ 使用者只能查看自己的通知
- ✅ 使用者只能建立自己的通知
- ✅ 使用者只能更新自己的通知
- ✅ 使用者只能刪除自己的通知

### 最佳實踐

1. **不要在日誌中輸出敏感資料**
   ```typescript
   // ❌ 禁止
   console.log('User token:', token);
   
   // ✅ 正確
   console.log('User authenticated:', userId);
   ```

2. **使用參數化查詢**
   - Repository 使用 Firebase client 自動處理

3. **正確清理訂閱**
   ```typescript
   // ✅ 正確 - 使用 DestroyRef
   subscribeToRealtimeUpdates(userId: string, destroyRef: DestroyRef): void {
     const channel = this.repository.subscribeToChanges(userId, callback);
     destroyRef.onDestroy(() => {
       channel?.unsubscribe();
     });
   }
   ```

## 📊 效能優化

### 1. 索引優化

已建立以下索引：
- `idx_notifications_user_created` - 主查詢索引
- `idx_notifications_user_unread` - 未讀通知索引
- `idx_notifications_user_type` - 類型篩選索引
- `idx_notifications_todo` - 待辦通知索引

### 2. Signals 最佳化

- 使用 `computed()` 快取衍生狀態
- 使用 `asReadonly()` 防止外部修改
- 使用 `OnPush` 變更偵測策略

### 3. Realtime 最佳化

- 單一訂閱共享於兩個元件
- 自動清理訂閱防止記憶體洩漏
- 使用 filter 減少不必要的更新

## 🧪 測試建議

### 單元測試

```typescript
describe('NotificationStore', () => {
  it('should load notifications', async () => {
    // Test implementation
  });
  
  it('should mark notification as read', async () => {
    // Test implementation
  });
  
  it('should group notifications correctly', () => {
    // Test implementation
  });
});
```

### 整合測試

```typescript
describe('NotifyComponent', () => {
  it('should display notifications', () => {
    // Test implementation
  });
  
  it('should update unread count', () => {
    // Test implementation
  });
});
```

## 🔧 故障排除

### 問題 1: 通知沒有顯示

**解決方案**:
1. 檢查使用者是否已登入
3. 檢查 browser console 錯誤訊息
4. 驗證資料表是否有資料

### 問題 2: Realtime 不工作

**解決方案**:
1. 確認已執行遷移檔案
2. 檢查 Realtime 是否已啟用
3. 檢查 Publication 設定
4. 查看 Firebase Dashboard logs

### 問題 3: 編譯錯誤

**解決方案**:
1. 執行 `yarn install` 安裝依賴
2. 確認所有 import 路徑正確
3. 檢查 TypeScript 版本兼容性

## 📚 參考資源

- [Angular Signals 文檔](https://angular.dev/guide/signals)
- [Firebase Realtime 文檔](https://firebase.com/docs/guides/realtime)
- [ng-alain 文檔](https://ng-alain.com)
- [專案架構指南](../README.md)

## 🎯 後續擴展

### 短期
- [ ] 加入通知過濾功能
- [ ] 實現通知搜尋
- [ ] 加入通知設定頁面

### 中期
- [ ] 整合 Firebase Cloud Messaging（推播通知）
- [ ] 加入通知優先級
- [ ] 實現通知分頁載入

### 長期
- [ ] 加入通知模板系統
- [ ] 實現批次操作
- [ ] 加入通知統計分析

---

**建立日期**: 2025-12-12  
**版本**: 1.0.0  
**維護者**: GigHub Team
