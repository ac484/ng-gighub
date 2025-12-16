# Log / Activity Domain (日誌域)

> **Domain ID**: `log`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P1 (必要)

## 📋 Overview

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

## 🏗️ Architecture

### Domain 結構

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
├── views/                         # Domain UI 元件
│   ├── activity-log/
│   ├── comment/
│   └── attachment/
├── config/
│   └── log.config.ts              # 模組配置
├── exports/
│   └── log-api.exports.ts         # 公開 API
├── index.ts                       # 統一匯出
└── README.md                      # 本文件
```

## 📦 Sub-Modules (子模塊)

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
  attachments?: string[];  // 附件 ID
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isEdited: boolean;
}
```

### 4️⃣ Attachment Sub-Module (附件)

**職責**: 檔案上傳管理與附件關聯

**核心功能**:
- 檔案上傳與儲存
- 附件與資源關聯
- 附件預覽
- 檔案類型驗證
- 附件版本管理

**資料模型**:
```typescript
interface Attachment {
  id: string;
  blueprintId: string;
  resourceType: string;    // 關聯的資源類型
  resourceId: string;      // 關聯的資源 ID
  fileName: string;
  fileSize: number;
  fileType: string;        // MIME type
  fileExtension: string;
  storagePath: string;     // Supabase Storage 路徑
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  isPublic: boolean;
  downloadCount: number;
  metadata?: Record<string, any>;
}
```

### 5️⃣ Change History Sub-Module (變更歷史)

**職責**: 資料變更追蹤與版本歷史管理

**核心功能**:
- 資料變更追蹤（Before/After）
- 版本歷史查詢
- 變更對比
- 變更回溯
- 變更統計分析

**資料模型**:
```typescript
interface ChangeHistory {
  id: string;
  blueprintId: string;
  resourceType: string;
  resourceId: string;
  changeType: ChangeType;  // 'created' | 'updated' | 'deleted'
  fieldName?: string;      // 變更的欄位名稱
  oldValue?: any;
  newValue?: any;
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
  version: number;
  metadata?: Record<string, any>;
}
```

## 🚀 Quick Start

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { LogModule } from '@core/blueprint/modules/implementations/log';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入日誌模組
const logModule = new LogModule();
await container.loadModule(logModule);

// 啟動容器
await container.start();
```

### 2. 在其他模組中使用日誌模組 API

```typescript
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';
import { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ILogModuleApi } from '@core/blueprint/modules/implementations/log';

export class TasksModule implements IBlueprintModule {
  private context?: IExecutionContext;
  private logApi?: ILogModuleApi;

  async init(context: IExecutionContext): Promise<void> {
    this.context = context;

    // 取得日誌模組 API
    const logModule = context.resources.getModule('log');
    this.logApi = logModule?.exports as ILogModuleApi;
  }

  async createTask(taskData: any): Promise<void> {
    // 建立任務
    const task = await this.taskRepository.create(taskData);

    // 記錄操作
    if (this.logApi) {
      await this.logApi.activityLog.recordActivity({
        blueprintId: taskData.blueprintId,
        userId: taskData.createdBy,
        userName: 'User Name',
        action: 'create_task',
        actionType: 'create',
        resourceType: 'task',
        resourceId: task.id,
        description: `Created task: ${task.title}`,
        metadata: { taskData }
      });

      // 記錄變更歷史
      await this.logApi.changeHistory.recordChange({
        blueprintId: taskData.blueprintId,
        resourceType: 'task',
        resourceId: task.id,
        changeType: 'created',
        newValue: task,
        changedBy: taskData.createdBy,
        changedAt: new Date(),
        version: 1
      });
    }
  }
}
```

## 📖 API Reference

### Activity Log API

```typescript
interface IActivityLogApi {
  // 記錄操作
  recordActivity(data: CreateActivityLogData): Promise<ActivityLog>;
  
  // 查詢操作記錄
  getActivityLogs(
    blueprintId: string,
    options?: ActivityLogQueryOptions
  ): Observable<ActivityLog[]>;
  
  // 按使用者查詢
  getActivityLogsByUser(
    blueprintId: string,
    userId: string
  ): Observable<ActivityLog[]>;
  
  // 按資源查詢
  getActivityLogsByResource(
    resourceType: string,
    resourceId: string
  ): Observable<ActivityLog[]>;
}
```

### System Event API

```typescript
interface ISystemEventApi {
  // 記錄系統事件
  recordEvent(data: CreateSystemEventData): Promise<SystemEvent>;
  
  // 查詢系統事件
  getSystemEvents(
    blueprintId: string,
    options?: SystemEventQueryOptions
  ): Observable<SystemEvent[]>;
  
  // 訂閱事件類型
  subscribeToEventType(
    eventType: SystemEventType,
    callback: (event: SystemEvent) => void
  ): void;
  
  // 標記事件已解決
  resolveEvent(eventId: string): Promise<void>;
}
```

### Comment API

```typescript
interface ICommentApi {
  // 新增評論
  createComment(data: CreateCommentData): Promise<Comment>;
  
  // 回覆評論
  replyToComment(parentId: string, data: CreateCommentData): Promise<Comment>;
  
  // 取得評論串
  getComments(
    resourceType: string,
    resourceId: string
  ): Observable<Comment[]>;
  
  // 更新評論
  updateComment(commentId: string, content: string): Promise<Comment>;
  
  // 刪除評論
  deleteComment(commentId: string): Promise<void>;
  
  // 提及使用者
  mentionUser(commentId: string, userId: string): Promise<void>;
}
```

### Attachment API

```typescript
interface IAttachmentApi {
  // 上傳附件
  uploadAttachment(
    file: File,
    data: CreateAttachmentData
  ): Promise<Attachment>;
  
  // 批次上傳
  uploadMultiple(
    files: File[],
    data: CreateAttachmentData
  ): Promise<Attachment[]>;
  
  // 取得附件
  getAttachments(
    resourceType: string,
    resourceId: string
  ): Observable<Attachment[]>;
  
  // 下載附件
  downloadAttachment(attachmentId: string): Promise<Blob>;
  
  // 刪除附件
  deleteAttachment(attachmentId: string): Promise<void>;
}
```

### Change History API

```typescript
interface IChangeHistoryApi {
  // 記錄變更
  recordChange(data: CreateChangeHistoryData): Promise<ChangeHistory>;
  
  // 取得變更歷史
  getChangeHistory(
    resourceType: string,
    resourceId: string
  ): Observable<ChangeHistory[]>;
  
  // 取得特定版本
  getVersion(
    resourceType: string,
    resourceId: string,
    version: number
  ): Observable<ChangeHistory | null>;
  
  // 對比版本
  compareVersions(
    resourceType: string,
    resourceId: string,
    version1: number,
    version2: number
  ): Promise<VersionComparison>;
}
```

## 🔧 Configuration

### Module Configuration

```typescript
import { ILogConfig, DEFAULT_LOG_CONFIG } from '@core/blueprint/modules/implementations/log';

const customConfig: ILogConfig = {
  ...DEFAULT_LOG_CONFIG,
  features: {
    enableActivityLog: true,
    enableSystemEvent: true,
    enableComment: true,
    enableAttachment: true,
    enableChangeHistory: true
  },
  settings: {
    activityLogRetentionDays: 365,
    systemEventRetentionDays: 180,
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.jpg', '.png', '.pdf', '.doc', '.docx'],
    enableAutoCleanup: true
  }
};
```

## 📊 Data Storage

### Supabase Tables

```sql
-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  description TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Events
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  affected_resources TEXT[],
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[],
  attachments UUID[],
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change History
CREATE TABLE change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  version INT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Event Bus Integration

### Emitted Events

```typescript
const LOG_EVENTS = {
  ACTIVITY_LOGGED: 'LOG_ACTIVITY_LOGGED',
  SYSTEM_EVENT_RECORDED: 'LOG_SYSTEM_EVENT_RECORDED',
  COMMENT_CREATED: 'LOG_COMMENT_CREATED',
  COMMENT_REPLIED: 'LOG_COMMENT_REPLIED',
  ATTACHMENT_UPLOADED: 'LOG_ATTACHMENT_UPLOADED',
  CHANGE_RECORDED: 'LOG_CHANGE_RECORDED'
};
```

### Listening to Other Domain Events

```typescript
// 監聽其他 Domain 的事件並自動記錄
context.eventBus.on('TASK_CREATED', async (data: any) => {
  await logApi.activityLog.recordActivity({
    blueprintId: data.blueprintId,
    userId: data.createdBy,
    userName: data.createdByName,
    action: 'create_task',
    actionType: 'create',
    resourceType: 'task',
    resourceId: data.taskId,
    description: `Created task: ${data.taskTitle}`
  });
});
```

## 📝 Best Practices

### 1. 使用適當的 Sub-Module

```typescript
// ✅ 好的做法: 使用正確的 Sub-Module
// 使用者操作 → Activity Log
await logApi.activityLog.recordActivity({...});

// 系統事件 → System Event
await logApi.systemEvent.recordEvent({...});

// 討論互動 → Comment
await logApi.comment.createComment({...});
```

### 2. 記錄足夠的上下文

```typescript
// ✅ 好的做法: 包含詳細的 metadata
await logApi.activityLog.recordActivity({
  // ... basic fields
  metadata: {
    previousStatus: 'draft',
    newStatus: 'published',
    assignee: 'user-123',
    priority: 'high'
  }
});
```

### 3. 正確使用變更歷史

```typescript
// ✅ 好的做法: 記錄變更前後的完整值
await logApi.changeHistory.recordChange({
  resourceType: 'task',
  resourceId: taskId,
  changeType: 'updated',
  fieldName: 'status',
  oldValue: 'draft',
  newValue: 'published',
  changedBy: userId,
  changeReason: 'Task review completed',
  version: 2
});
```

### 4. 附件安全性

```typescript
// ✅ 好的做法: 驗證檔案類型和大小
const allowedTypes = ['.jpg', '.png', '.pdf'];
const maxSize = 10 * 1024 * 1024; // 10MB

if (!allowedTypes.includes(file.extension)) {
  throw new Error('File type not allowed');
}

if (file.size > maxSize) {
  throw new Error('File too large');
}
```

## 🔗 Domain 依賴關係

### 被依賴關係

Log Domain 是被動域，被以下 Domains 依賴：
- **Task Domain**: 記錄任務操作
- **Finance Domain**: 記錄財務操作
- **QA Domain**: 記錄品質檢查
- **Acceptance Domain**: 記錄驗收過程
- **Workflow Domain**: 記錄流程執行
- **所有其他 Domains**: 通用記錄需求

### 依賴關係

Log Domain 依賴：
- **Platform Layer**: Event Bus, Context
- **Supabase**: 資料儲存與查詢

## 🔒 Security Considerations

### 1. 存取控制

```typescript
// 確保使用者只能查看其有權限的記錄
const hasPermission = await aclService.can(userId, 'log.read', blueprintId);
if (!hasPermission) {
  throw new Error('Access denied');
}
```

### 2. 敏感資訊遮罩

```typescript
// 在記錄中遮罩敏感資訊
const sanitizedData = {
  ...data,
  password: '***',
  apiKey: '***',
  token: '***'
};
```

### 3. 附件掃描

```typescript
// 掃描上傳的附件是否含有惡意內容
const isSafe = await scanFile(file);
if (!isSafe) {
  throw new Error('File contains malicious content');
}
```

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [Supabase Storage 文檔](https://supabase.com/docs/guides/storage)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 🤝 Contributing

在實作日誌模組前，請確保：

1. 理解 Blueprint Container 架構
2. 遵循 IBlueprintModule 介面規範
3. 維持零耦合設計原則
4. 正確使用 Event Bus 通訊
5. 添加適當的測試
6. 更新相關文檔

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-13  
**Domain Priority**: P1 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題
