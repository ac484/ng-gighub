# SETC-000-02: Log Module (活動日誌模組)

> **模組 ID**: `log`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作 (基礎架構)  
> **優先級**: P1 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

日誌域負責追蹤所有系統變更與使用者行為，提供完整的操作紀錄、系統事件、評論、附件管理及變更歷史追蹤功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

追蹤所有系統變更與使用者行為，包括：
- 使用者操作記錄
- 系統級事件記錄
- 評論與討論串管理
- 檔案上傳與附件管理
- 資料變更歷史追蹤

### 核心特性

- ✅ **完整操作追蹤**: 記錄所有使用者操作與系統事件
- ✅ **評論系統**: 支援多層級評論與討論串
- ✅ **附件管理**: 統一的檔案上傳與附件關聯功能
- ✅ **變更歷史**: 完整的資料變更版本追蹤
- ✅ **事件訂閱**: 支援訂閱特定事件類型
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **被動記錄**: 本域主要被其他 Domain 使用，記錄其操作
2. **Event Bus 通訊**: 透過事件系統接收其他 Domain 的記錄請求
3. **統一介面**: 提供標準化的記錄介面給所有 Domain 使用
4. **可擴展性**: 支援自訂事件類型與記錄格式

---

## 🏗️ 架構設計

### 目錄結構

```
log/
├── log.module.ts                  # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts             # Domain 元資料
├── log.repository.ts              # 共用資料存取層
├── log.routes.ts                  # Domain 路由配置
├── services/                      # Sub-Module Services
│   ├── activity-log.service.ts    # Sub-Module: Activity Log
│   ├── system-event.service.ts    # Sub-Module: System Event
│   ├── comment.service.ts         # Sub-Module: Comment
│   ├── attachment.service.ts      # Sub-Module: Attachment
│   └── change-history.service.ts  # Sub-Module: Change History
├── models/                        # Domain 模型
│   ├── activity-log.model.ts
│   ├── system-event.model.ts
│   ├── comment.model.ts
│   ├── attachment.model.ts
│   └── change-history.model.ts
├── components/                    # Domain UI 元件
│   ├── activity-log/
│   ├── comment/
│   └── attachment/
├── config/
│   └── log.config.ts              # 模組配置
├── exports/
│   └── log-api.exports.ts         # 公開 API
├── index.ts                       # 統一匯出
└── README.md                      # 模組文檔
```

### 三層架構

```
┌─────────────────────────────────────┐
│   UI Layer (Presentation)          │
│   - activity-log.component.ts      │
│   - comment.component.ts            │
└────────────┬────────────────────────┘
             │ 呼叫
┌────────────▼────────────────────────┐
│   Service Layer (Business Logic)    │
│   - activity-log.service.ts         │
│   - comment.service.ts               │
│   - attachment.service.ts            │
└────────────┬────────────────────────┘
             │ 呼叫
┌────────────▼────────────────────────┐
│   Repository Layer (Data Access)    │
│   - log.repository.ts               │
└────────────┬────────────────────────┘
             │ 存取
┌────────────▼────────────────────────┐
│   Firestore (Database)              │
└─────────────────────────────────────┘
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Activity Log Sub-Module (操作紀錄)

**職責**: 使用者操作記錄與操作歷程追蹤

**核心功能**:
- 記錄使用者所有重要操作
- 操作歷程時間軸顯示
- 操作類型分類與篩選
- 操作者資訊追蹤

**資料模型**:
```typescript
interface ActivityLog {
  id: string;
  blueprintId: string;
  userId: string;
  userName: string;
  action: string;
  actionType: ActivityType; // 'create' | 'update' | 'delete' | 'view'
  resourceType: string;     // 'task' | 'blueprint' | 'member'
  resourceId: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```

### 2️⃣ System Event Sub-Module (系統事件)

**職責**: 系統級事件記錄與事件訂閱管理

**核心功能**:
- 記錄系統級事件（自動化、排程、錯誤等）
- 事件訂閱與通知
- 事件嚴重性分級
- 事件查詢與分析

**資料模型**:
```typescript
interface SystemEvent {
  id: string;
  blueprintId: string;
  eventType: SystemEventType; // 'automation' | 'schedule' | 'error' | 'warning'
  severity: EventSeverity;     // 'critical' | 'high' | 'medium' | 'low'
  source: string;              // 事件來源 Domain
  message: string;
  details?: Record<string, any>;
  affectedResources?: string[];
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}
```

### 3️⃣ Comment Sub-Module (評論)

**職責**: 評論功能與討論串管理

**核心功能**:
- 多層級評論系統
- 評論回覆與討論串
- 評論通知
- 提及使用者 (@mention)
- 評論附件關聯

**資料模型**:
```typescript
interface Comment {
  id: string;
  blueprintId: string;
  resourceType: string;    // 關聯的資源類型
  resourceId: string;      // 關聯的資源 ID
  parentId?: string;       // 父評論 ID（用於回覆）
  userId: string;
  userName: string;
  content: string;
  mentions?: string[];     // 提及的使用者 ID
  attachments?: string[];
  reactions?: Reaction[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4️⃣ Attachment Sub-Module (附件)

**職責**: 檔案上傳與附件管理

**核心功能**:
- 檔案上傳與儲存
- 附件關聯管理
- 檔案預覽與下載
- 附件權限控制
- 附件版本管理

**資料模型**:
```typescript
interface Attachment {
  id: string;
  blueprintId: string;
  resourceType: string;
  resourceId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: FileMetadata;
}
```

### 5️⃣ Change History Sub-Module (變更歷史)

**職責**: 資料變更版本追蹤

**核心功能**:
- 記錄所有資料變更
- 版本比較功能
- 變更回溯
- 變更審計報告

**資料模型**:
```typescript
interface ChangeHistory {
  id: string;
  blueprintId: string;
  resourceType: string;
  resourceId: string;
  version: number;
  changeType: ChangeType;  // 'created' | 'updated' | 'deleted'
  changedFields: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}
```

---

## 🔌 公開 API

### ILogModuleApi

```typescript
interface ILogModuleApi {
  activityLog: IActivityLogApi;
  systemEvent: ISystemEventApi;
  comment: ICommentApi;
  attachment: IAttachmentApi;
  changeHistory: IChangeHistoryApi;
}
```

### IActivityLogApi

```typescript
interface IActivityLogApi {
  log(activity: LogActivityDto): Promise<ActivityLog>;
  findByResource(resourceType: string, resourceId: string): Promise<ActivityLog[]>;
  findByUser(userId: string, filter?: LogFilter): Promise<ActivityLog[]>;
  findByBlueprint(blueprintId: string, filter?: LogFilter): Promise<ActivityLog[]>;
}
```

### ICommentApi

```typescript
interface ICommentApi {
  create(comment: CreateCommentDto): Promise<Comment>;
  update(id: string, comment: UpdateCommentDto): Promise<Comment>;
  delete(id: string): Promise<void>;
  findByResource(resourceType: string, resourceId: string): Promise<Comment[]>;
  findThread(commentId: string): Promise<Comment[]>;
}
```

---

## 📡 事件整合

### 訂閱其他模組事件

```typescript
// 訂閱任務事件並記錄
this.eventBus.on('task.created')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(event => {
    this.activityLogService.log({
      blueprintId: event.blueprintId,
      userId: event.actor,
      action: '建立任務',
      actionType: 'create',
      resourceType: 'task',
      resourceId: event.data.taskId,
      description: `建立任務: ${event.data.task.title}`
    });
  });
```

### 發送日誌事件

```typescript
// 發送評論事件
this.eventBus.emit({
  type: 'log.comment.created',
  blueprintId: comment.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { commentId: comment.id, resourceType, resourceId }
});
```

---

## 🚀 使用範例

### 1. 記錄使用者操作

```typescript
import { inject } from '@angular/core';
import { ActivityLogService } from '@core/blueprint/modules/implementations/log';

class MyComponent {
  private activityLogService = inject(ActivityLogService);

  async onTaskCreated(task: Task) {
    await this.activityLogService.log({
      blueprintId: task.blueprintId,
      userId: this.currentUser.id,
      action: '建立任務',
      actionType: 'create',
      resourceType: 'task',
      resourceId: task.id,
      description: `建立任務: ${task.title}`
    });
  }
}
```

### 2. 查詢活動記錄

```typescript
async loadActivityLog(blueprintId: string) {
  const logs = await this.activityLogService.findByBlueprint(blueprintId, {
    limit: 20,
    orderBy: 'timestamp',
    orderDirection: 'desc'
  });
  console.log('Recent activities:', logs);
}
```

### 3. 使用評論功能

```typescript
async addComment(resourceType: string, resourceId: string, content: string) {
  const comment = await this.commentService.create({
    blueprintId: this.blueprintId,
    resourceType,
    resourceId,
    content,
    userId: this.currentUser.id,
    userName: this.currentUser.name
  });
  console.log('Comment added:', comment);
}
```

---

## 🧪 測試

### 單元測試

```bash
# 執行日誌模組單元測試
yarn test --include="**/log/**/*.spec.ts"
```

### 整合測試

```bash
# 執行日誌模組整合測試
yarn test --include="**/log.module.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **進階搜尋**: 多條件搜尋與過濾
2. ⏳ **匯出功能**: 匯出活動記錄為 CSV/PDF
3. ⏳ **即時通知**: 評論與提及的即時通知
4. ⏳ **附件預覽**: 圖片、PDF 線上預覽
5. ⏳ **變更審計報告**: 自動生成審計報告
6. ⏳ **日誌分析**: 操作統計與趨勢分析

---

## 🔗 相關模組

- **Task Module**: 記錄任務操作
- **QA Module**: 記錄品質檢查活動
- **Contract Module**: 記錄合約變更
- **Finance Module**: 記錄財務操作
- **Audit Logs Module**: 系統級稽核日誌

---

## 📚 參考資源

- [日誌模組 README](../../src/app/core/blueprint/modules/implementations/log/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
