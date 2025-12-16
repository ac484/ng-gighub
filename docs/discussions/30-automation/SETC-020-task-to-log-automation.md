# SETC-020: 任務完成→日誌自動化

> **任務 ID**: SETC-020  
> **任務名稱**: Task Completion → Log Automation  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-019  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
任務完成自動建立施工日誌

### 背景 / 目的
實作 SETC.md 定義的第一個自動節點：當任務標記為「管理確認完成」後，自動建立對應的施工日誌記錄。

### 需求說明
1. 實作 TaskCompletedHandler
2. 監聽 `task.completed` 事件
3. 自動建立施工日誌
4. 資料映射與驗證
5. 觸發 `log.created` 事件
6. 錯誤處理與重試

### In Scope / Out of Scope

####  ✅ In Scope
- TaskCompletedHandler 實作
- 事件監聽與觸發
- 自動建立日誌邏輯
- 資料映射規則
- 錯誤處理
- 單元測試

#### ❌ Out of Scope
- Log Module 修改（已存在）
- Task Module 修改（已存在）
- UI 變更
- 手動建立日誌流程

### 功能行為
當接收到 `task.completed` 事件時，自動從任務資料建立施工日誌，包含任務資訊、完成時間、執行人員等。

### 資料 / API

#### Handler 介面

```typescript
export class TaskCompletedHandler implements WorkflowHandler {
  id = 'task-completed-handler';
  name = 'Task Completed to Log Handler';
  
  constructor(
    private logApi: ILogModuleApi,
    private taskApi: ITasksModuleApi
  ) {}
  
  async execute(
    event: BlueprintEvent<TaskCompletedEventData>,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      // 1. 驗證任務資料
      const task = await this.taskApi.getById(event.data.taskId);
      if (!task) {
        throw new Error(`Task ${event.data.taskId} not found`);
      }
      
      // 2. 建立日誌
      const log = await this.logApi.activityLog.autoCreateFromTask({
        taskId: task.id,
        taskTitle: task.title,
        completedBy: event.actor.userId,
        completedAt: event.timestamp,
        workDescription: task.description,
        blueprintId: event.blueprintId
      });
      
      // 3. 儲存到上下文
      context.data.set('logId', log.id);
      context.data.set('taskId', task.id);
      
      return {
        stepId: this.id,
        success: true,
        data: { logId: log.id }
      };
    } catch (error) {
      console.error('[TaskCompletedHandler] Error:', error);
      return {
        stepId: this.id,
        success: false,
        error: error as Error
      };
    }
  }
  
  validate(event: BlueprintEvent): boolean {
    return !!(
      event.data?.taskId &&
      event.blueprintId &&
      event.actor?.userId
    );
  }
}

export interface TaskCompletedEventData {
  taskId: string;
  completedBy: string;
  completedAt: Date;
  notes?: string;
}
```

#### Log Module API 擴展

```typescript
export interface IActivityLogApi {
  // 現有方法...
  
  /**
   * 從任務自動建立日誌
   */
  autoCreateFromTask(data: AutoLogFromTaskData): Promise<ActivityLog>;
}

export interface AutoLogFromTaskData {
  taskId: string;
  taskTitle: string;
  completedBy: string;
  completedAt: Date;
  workDescription?: string;
  blueprintId: string;
  photos?: FileAttachment[];
  notes?: string;
}
```

### 影響範圍
- `src/app/core/blueprint/workflow/handlers/` - 新增 Handler
- `src/app/core/blueprint/modules/implementations/log/services/` - API 擴展
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` - 註冊 Handler

### 驗收條件
1. ✅ 任務完成後自動建立日誌
2. ✅ 資料正確映射
3. ✅ 觸發 `log.created` 事件
4. ✅ 錯誤處理機制有效
5. ✅ 整合測試通過

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
- 查詢 Log Module 現有 API
- 查詢 Task Module 資料結構

### 步驟 2: Sequential Thinking

1. **資料映射分析**
   - Task → ActivityLog 欄位對應關係
   - 必填欄位: taskId, completedBy, completedAt, blueprintId
   - 選填欄位: photos, notes, workDescription

2. **錯誤場景**
   - 任務不存在 → 記錄錯誤，不建立日誌
   - 日誌建立失敗 → 重試機制
   - 權限不足 → 拋出錯誤

### 步驟 3: Software Planning Tool

```
Phase 1: Handler 實作 (4 hours)
├── TaskCompletedHandler 類別
├── execute 方法
├── validate 方法
└── 資料映射邏輯

Phase 2: Log API 擴展 (3 hours)
├── autoCreateFromTask 方法
├── 資料驗證
└── Firestore 儲存

Phase 3: 整合與測試 (5 hours)
├── 註冊到 Orchestrator
├── 整合測試
└── 端對端測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: Handler 實作

**檔案**: `src/app/core/blueprint/workflow/handlers/task-completed.handler.ts`

```typescript
import { inject, Injectable } from '@angular/core';
import { WorkflowHandler, WorkflowStepResult, WorkflowContext } from '../models';
import { BlueprintEvent } from '../../events/models';
import { SystemEventType } from '../../events/types';
import { ILogModuleApi } from '../../modules/implementations/log/exports';
import { ITasksModuleApi } from '../../modules/implementations/tasks/exports';

@Injectable({ providedIn: 'root' })
export class TaskCompletedHandler implements WorkflowHandler {
  id = 'task-completed-handler';
  name = 'Task Completed to Log Handler';
  
  private logApi = inject(ILogModuleApi);
  private taskApi = inject(ITasksModuleApi);
  
  async execute(
    event: BlueprintEvent<TaskCompletedEventData>,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    console.log(`[TaskCompletedHandler] Processing task ${event.data.taskId}`);
    
    try {
      // 獲取完整任務資料
      const task = await this.taskApi.getById(event.data.taskId);
      
      if (!task) {
        throw new Error(`Task ${event.data.taskId} not found`);
      }
      
      // 建立施工日誌
      const log = await this.logApi.activityLog.autoCreateFromTask({
        taskId: task.id,
        taskTitle: task.title,
        completedBy: event.actor.userId,
        completedAt: event.timestamp,
        workDescription: task.description || '',
        blueprintId: event.blueprintId,
        notes: event.data.notes
      });
      
      console.log(`[TaskCompletedHandler] Created log ${log.id} for task ${task.id}`);
      
      // 儲存到上下文供後續步驟使用
      context.data.set('logId', log.id);
      context.data.set('taskId', task.id);
      context.data.set('log', log);
      
      return {
        stepId: this.id,
        success: true,
        data: {
          logId: log.id,
          taskId: task.id
        }
      };
    } catch (error) {
      console.error('[TaskCompletedHandler] Error creating log:', error);
      
      return {
        stepId: this.id,
        success: false,
        error: error as Error
      };
    }
  }
  
  validate(event: BlueprintEvent<TaskCompletedEventData>): boolean {
    const valid = !!(
      event.type === SystemEventType.TASK_COMPLETED &&
      event.data?.taskId &&
      event.blueprintId &&
      event.actor?.userId
    );
    
    if (!valid) {
      console.warn('[TaskCompletedHandler] Invalid event:', event);
    }
    
    return valid;
  }
}
```

#### Phase 2: Log API 擴展

**檔案**: `src/app/core/blueprint/modules/implementations/log/services/activity-log.service.ts`

```typescript
// 新增方法
async autoCreateFromTask(data: AutoLogFromTaskData): Promise<ActivityLog> {
  console.log(`[ActivityLogService] Auto-creating log from task ${data.taskId}`);
  
  // 驗證資料
  if (!data.taskId || !data.completedBy || !data.blueprintId) {
    throw new Error('Missing required fields for auto log creation');
  }
  
  // 建立日誌物件
  const log: Omit<ActivityLog, 'id'> = {
    blueprintId: data.blueprintId,
    taskId: data.taskId,
    title: `施工完成: ${data.taskTitle}`,
    description: data.workDescription || '',
    logType: 'construction',
    status: 'completed',
    recordedBy: data.completedBy,
    recordedAt: data.completedAt,
    workDate: data.completedAt,
    photos: data.photos || [],
    notes: data.notes,
    createdBy: data.completedBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 儲存到 Firestore
  const createdLog = await this.repository.create(log);
  
  // 觸發事件
  this.eventBus.emit({
    type: SystemEventType.LOG_CREATED,
    blueprintId: data.blueprintId,
    timestamp: new Date(),
    actor: {
      userId: data.completedBy,
      userName: 'System',
      role: 'system'
    },
    data: {
      logId: createdLog.id,
      taskId: data.taskId,
      autoCreated: true
    }
  });
  
  return createdLog;
}
```

#### Phase 3: 註冊 Handler

**檔案**: `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts`

```typescript
private registerDefaultHandlers(): void {
  console.log('[Workflow] Registering SETC workflow handlers');
  
  // 註冊任務完成處理器
  const taskCompletedHandler = inject(TaskCompletedHandler);
  this.registerHandler(
    SystemEventType.TASK_COMPLETED,
    taskCompletedHandler,
    {
      priority: 10,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
        maxDelayMs: 5000
      },
      timeout: 10000
    }
  );
}
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/workflow/handlers/task-completed.handler.ts` ✅
- `src/app/core/blueprint/workflow/handlers/task-completed.handler.spec.ts` ✅
- `src/app/core/blueprint/workflow/handlers/index.ts` ✅

**修改檔案**:
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` ✅
- `src/app/core/blueprint/workflow/index.ts` ✅
- `src/app/core/state/stores/task.store.ts` ✅ (整合 EnhancedEventBus 發送事件)

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 Log/Task API
- ✅ 使用 Sequential Thinking 分析資料映射
- ✅ 基於奧卡姆剃刀定律 (KISS, YAGNI)
- ✅ 實作重試機制
- ✅ 詳細日誌記錄

---

## ✅ 檢查清單

### 功能檢查
- [x] 任務完成自動建立日誌
- [x] 資料正確映射
- [x] 事件正確觸發
- [x] 錯誤處理完整

### 測試檢查
- [x] 單元測試通過
- [x] 整合測試通過
- [x] 錯誤場景測試完整

---

## 📝 實作總結

### 實作內容

1. **TaskCompletedHandler** (`task-completed.handler.ts`)
   - 監聽 `task.completed` 事件
   - 從 TasksRepository 獲取任務詳情
   - 使用 ConstructionLogStore 建立施工日誌
   - 發送 `log.created` 事件供後續工作流程使用
   - 支援重試機制與回滾操作

2. **SETCWorkflowOrchestratorService 更新**
   - 使用 `runInInjectionContext` 動態注入 TaskCompletedHandler
   - 替換原有的占位符處理器

3. **TaskStore 更新** (`task.store.ts`)
   - 整合 EnhancedEventBusService
   - 當任務完成時同時發送到 EventBus 和 EnhancedEventBus
   - EnhancedEventBus 事件觸發 WorkflowOrchestrator 自動化流程

4. **單元測試**
   - 涵蓋成功建立日誌場景
   - 涵蓋任務不存在場景
   - 涵蓋日誌建立失敗場景
   - 涵蓋驗證邏輯
   - 涵蓋回滾操作

### 工作流程

```
TaskStore.updateTaskStatus(COMPLETED)
    ↓
eventBus.emit('tasks.task_completed')  // 模組內部事件
enhancedEventBus.emitEvent('task.completed')  // 跨模組工作流程事件
    ↓
SETCWorkflowOrchestratorService
    ↓
TaskCompletedHandler.execute()
    ↓
1. 驗證事件資料
2. 獲取任務詳情
3. 建立施工日誌
4. 發送 log.created 事件
    ↓
觸發 SETC-021: Log → QC
```
