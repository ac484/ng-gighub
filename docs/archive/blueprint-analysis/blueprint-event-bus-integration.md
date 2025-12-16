# Blueprint Event Bus 整合說明
# Blueprint Event Bus Integration Guide

## 📋 Container Layer 規範遵循

本專案嚴格遵循 `setc.md` 中定義的 Container Layer 規範：

> **3.5 Event Bus**
> 
> A module-to-module communication mechanism.
> 
> Event Bus guarantees:
> - Strict decoupling: No module can directly call another.
> - All communication flows through publish/subscribe.

## 🔌 Blueprint Event Bus 位置

- **實作**: `src/app/core/blueprint/events/event-bus.ts`
- **介面**: `src/app/core/blueprint/events/event-bus.interface.ts`
- **事件類型**: `src/app/core/blueprint/events/event-types.ts`

## 📊 任務數量擴展功能整合

### 新增事件類型

將以下事件類型加入 `BlueprintEventType` (src/app/core/blueprint/events/event-types.ts):

```typescript
export enum BlueprintEventType {
  // ... existing events

  // ===== Task Quantity Events =====
  /** Task quantity has been updated */
  TASK_QUANTITY_UPDATED = 'TASK_QUANTITY_UPDATED',

  /** Task quantity has reached target */
  TASK_QUANTITY_REACHED = 'TASK_QUANTITY_REACHED',

  /** Task has been auto-completed */
  TASK_AUTO_COMPLETED = 'TASK_AUTO_COMPLETED',

  /** Task has been sent to QC */
  TASK_SENT_TO_QC = 'TASK_SENT_TO_QC',

  // ===== Log-Task Events =====
  /** Task has been added to a log */
  LOG_TASK_ADDED = 'LOG_TASK_ADDED',

  /** Log has been submitted */
  LOG_SUBMITTED = 'LOG_SUBMITTED',

  // ===== Quality Control Events =====
  /** QC inspection has been created */
  QC_CREATED = 'QC_CREATED',

  /** QC inspection has been assigned */
  QC_ASSIGNED = 'QC_ASSIGNED',

  /** QC inspection has started */
  QC_INSPECTION_STARTED = 'QC_INSPECTION_STARTED',

  /** QC inspection passed */
  QC_PASSED = 'QC_PASSED',

  /** QC inspection rejected */
  QC_REJECTED = 'QC_REJECTED',

  /** QC inspection cancelled */
  QC_CANCELLED = 'QC_CANCELLED'
}
```

## 🔄 事件流程範例

### 1. Log Module → Task Module

```typescript
// log.service.ts
@Injectable({ providedIn: 'root' })
export class LogService {
  private eventBus = inject(EventBus);

  async addTaskToLog(logId: string, taskId: string, quantityCompleted: number): Promise<void> {
    // 1. 儲存到資料庫
    await this.logRepository.addTask(logId, taskId, quantityCompleted);

    // 2. 透過 Event Bus 通知
    this.eventBus.emit(
      BlueprintEventType.LOG_TASK_ADDED,
      {
        logId,
        taskId,
        quantityCompleted,
        actorId: this.getCurrentUserId()
      },
      'log-module'
    );
  }
}
```

### 2. Task Module 監聽並更新

```typescript
// task.service.ts
@Injectable({ providedIn: 'root' })
export class TaskService implements OnInit {
  private eventBus = inject(EventBus);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // 訂閱 LOG_TASK_ADDED 事件
    const unsubscribe = this.eventBus.on(
      BlueprintEventType.LOG_TASK_ADDED,
      async (event) => {
        await this.handleLogTaskAdded(event.payload);
      }
    );

    // 自動清理
    this.destroyRef.onDestroy(unsubscribe);
  }

  private async handleLogTaskAdded(payload: LogTaskAddedPayload): Promise<void> {
    // 1. 更新任務已完成數量
    const task = await this.taskRepository.findById(payload.taskId);
    const newQuantity = task.completedQuantity + payload.quantityCompleted;
    await this.taskRepository.updateQuantity(payload.taskId, newQuantity);

    // 2. 檢查是否達標
    if (newQuantity >= task.totalQuantity && task.enableQuantityTracking) {
      this.eventBus.emit(
        BlueprintEventType.TASK_QUANTITY_REACHED,
        {
          taskId: task.id,
          taskTitle: task.title,
          totalQuantity: task.totalQuantity,
          completedQuantity: newQuantity,
          unit: task.unit,
          autoCompleteEnabled: task.autoCompleteOnQuantityReached,
          autoSendToQCEnabled: task.autoSendToQC
        },
        'task-module'
      );
    }
  }
}
```

### 3. Workflow Service 自動化處理

```typescript
// workflow.service.ts
@Injectable({ providedIn: 'root' })
export class WorkflowService implements OnInit {
  private eventBus = inject(EventBus);
  private destroyRef = inject(DestroyRef);
  private taskService = inject(TaskService);
  private qcService = inject(QualityControlService);

  ngOnInit(): void {
    this.registerWorkflowRules();
  }

  private registerWorkflowRules(): void {
    // Rule 1: 自動完成任務
    const unsubscribe1 = this.eventBus.on(
      BlueprintEventType.TASK_QUANTITY_REACHED,
      async (event) => {
        const payload = event.payload as TaskQuantityReachedPayload;

        if (payload.autoCompleteEnabled) {
          // 更新任務狀態為完成
          await this.taskService.updateStatus(payload.taskId, TaskStatus.COMPLETED);

          // 發送完成事件
          this.eventBus.emit(
            BlueprintEventType.TASK_AUTO_COMPLETED,
            { taskId: payload.taskId, taskTitle: payload.taskTitle },
            'workflow-service'
          );

          // 如果啟用自動送品管
          if (payload.autoSendToQCEnabled) {
            await this.sendToQC(payload);
          }
        }
      }
    );

    this.destroyRef.onDestroy(unsubscribe1);
  }

  private async sendToQC(payload: TaskQuantityReachedPayload): Promise<void> {
    // 建立品管記錄
    const qc = await this.qcService.createQC({
      taskId: payload.taskId,
      taskTitle: payload.taskTitle,
      inspectedQuantity: payload.totalQuantity,
      unit: payload.unit
    });

    // 發送事件
    this.eventBus.emit(
      BlueprintEventType.TASK_SENT_TO_QC,
      {
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        qcId: qc.id,
        quantityToInspect: payload.totalQuantity,
        unit: payload.unit
      },
      'workflow-service'
    );
  }
}
```

### 4. QC Module 處理驗收

```typescript
// quality-control.service.ts
@Injectable({ providedIn: 'root' })
export class QualityControlService implements OnInit {
  private eventBus = inject(EventBus);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // 監聽 TASK_SENT_TO_QC 事件
    const unsubscribe = this.eventBus.on(
      BlueprintEventType.TASK_SENT_TO_QC,
      async (event) => {
        await this.handleTaskSentToQC(event.payload);
      }
    );

    this.destroyRef.onDestroy(unsubscribe);
  }

  async completeInspection(qcId: string, result: 'passed' | 'rejected'): Promise<void> {
    const qc = await this.qcRepository.findById(qcId);

    // 更新 QC 狀態
    await this.qcRepository.updateStatus(qcId, result === 'passed' ? QCStatus.PASSED : QCStatus.REJECTED);

    // 發送事件
    this.eventBus.emit(
      result === 'passed' ? BlueprintEventType.QC_PASSED : BlueprintEventType.QC_REJECTED,
      {
        qcId: qc.id,
        taskId: qc.taskId,
        status: result,
        inspectorId: this.getCurrentUserId(),
        passedQuantity: qc.passedQuantity,
        rejectedQuantity: qc.rejectedQuantity
      },
      'qc-module'
    );
  }
}
```

## 📊 事件流程圖

```
┌──────────────┐
│ Log Module   │
│ (施工者填寫)  │
└──────┬───────┘
       │ emit(LOG_TASK_ADDED)
       ▼
┌──────────────┐
│ Event Bus    │ ◄──── 所有模組間通訊統一入口
└──────┬───────┘
       │
       ├──► Task Module (監聽 LOG_TASK_ADDED)
       │     └─► 更新 completedQuantity
       │         └─► emit(TASK_QUANTITY_REACHED)
       │
       ├──► Workflow Service (監聽 TASK_QUANTITY_REACHED)
       │     └─► 自動完成任務
       │         └─► emit(TASK_AUTO_COMPLETED)
       │         └─► 建立 QC 記錄
       │             └─► emit(TASK_SENT_TO_QC)
       │
       └──► QC Module (監聽 TASK_SENT_TO_QC)
             └─► 分配檢驗員
                 └─► 完成檢驗
                     └─► emit(QC_PASSED / QC_REJECTED)
```

## ✅ 零耦合驗證

### 模組相依檢查

```typescript
// ❌ 禁止: 直接匯入其他模組
import { TaskService } from '../task/task.service';

// ✅ 正確: 透過 Event Bus 通訊
private eventBus = inject(EventBus);
this.eventBus.emit('TASK_QUANTITY_UPDATED', payload, 'log-module');
```

### 測試隔離性

```typescript
// 每個模組可以獨立測試
describe('LogService', () => {
  let service: LogService;
  let mockEventBus: jasmine.SpyObj<EventBus>;

  beforeEach(() => {
    mockEventBus = jasmine.createSpyObj('EventBus', ['emit', 'on']);

    TestBed.configureTestingModule({
      providers: [
        LogService,
        { provide: EventBus, useValue: mockEventBus }
      ]
    });

    service = TestBed.inject(LogService);
  });

  it('should emit LOG_TASK_ADDED event', async () => {
    await service.addTaskToLog('log-1', 'task-1', 20);

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'LOG_TASK_ADDED',
      jasmine.objectContaining({ taskId: 'task-1', quantityCompleted: 20 }),
      'log-module'
    );
  });
});
```

## 🎯 優勢

1. **零耦合**: 模組之間完全解耦，可獨立開發與測試
2. **可追蹤**: Event Bus 保存事件歷史，便於除錯與審計
3. **可擴展**: 新增模組只需訂閱相關事件，無需修改既有模組
4. **一致性**: 所有模組使用統一的通訊機制
5. **符合規範**: 完全遵循 Container Layer 規範 (setc.md)

## 📚 參考文件

- Container Layer 規範: `setc.md`
- Blueprint Event Bus 實作: `src/app/core/blueprint/events/event-bus.ts`
- 任務數量擴展設計: `docs/task-quantity-expansion-design.md`
- Workflow 類型定義: `src/app/core/types/workflow/workflow.types.ts`

---

**版本**: v1.1  
**更新日期**: 2025-12-11  
**狀態**: ✅ 已修正，完全遵循 Container Layer 規範
