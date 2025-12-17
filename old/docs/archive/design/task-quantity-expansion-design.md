# 任務數量擴展功能設計文件
# Task Quantity Expansion Feature Design Document

## 📋 需求分析 (Requirement Analysis)

### 核心流程 (Core Workflow)
```
1. 任務建立 (Task Creation)
   └─> 設定總數量 (Set Total Quantity)
   
2. 施工者填寫 (Constructor Fill)
   └─> 在日誌中選取任務 (Select Task in Log)
   └─> 填寫完成數量 (Fill Completed Quantity)
   └─> 提交 (Submit)
   
3. 自動流轉 (Auto Flow)
   └─> 任務數量達標 → 自動標記完成 (Quantity Reached → Auto Complete)
   └─> 自動送品管 (Auto Send to QC)
   
4. 品管驗收 (QC Acceptance)
   └─> 審核 (Review)
   └─> 確認/駁回 (Accept/Reject)
```

## 🎯 影響範圍分析 (Impact Analysis)

### 需要修改的模組 (Modules to Modify)
1. **Task Module** (任務模組)
   - Type Definition: 新增數量相關欄位
   - Repository: 支援數量查詢與更新
   - Store: Signal-based 數量狀態管理
   - Component: UI 顯示與編輯

2. **Log Module** (日誌模組)
   - Type Definition: 新增任務關聯
   - Repository: 支援任務-日誌關聯
   - Store: 任務選取與數量記錄
   - Component: 任務選擇器 UI

3. **New: Quality Control Module** (品管模組)
   - 全新模組，遵循 Container Layer 規範
   - Type Definition: 品管記錄類型
   - Repository: CRUD 操作
   - Store: Signal-based 狀態
   - Component: 審核介面

4. **New: Workflow Module** (工作流模組)
   - 自動流程管理
   - Event-driven 架構

## 📊 資料結構設計 (Data Structure Design)

### 1. Task 擴展 (Task Extension)

```typescript
/**
 * Task with Quantity Support
 * 支援數量的任務
 */
export interface Task {
  // ... existing fields
  
  // NEW: Quantity fields
  /** Total quantity required (e.g., 100 units) */
  totalQuantity?: number;
  
  /** Unit of measurement (e.g., '件', 'm³', 'kg') */
  unit?: string;
  
  /** Completed quantity (calculated from logs) */
  completedQuantity?: number;
  
  /** Whether quantity tracking is enabled */
  enableQuantityTracking?: boolean;
  
  /** Auto complete when quantity reached */
  autoCompleteOnQuantityReached?: boolean;
  
  /** Auto send to QC when completed */
  autoSendToQC?: boolean;
}

/**
 * Task Status Update
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  PENDING_QC = 'pending_qc',        // NEW: 等待品管
  QC_IN_PROGRESS = 'qc_in_progress', // NEW: 品管中
  QC_PASSED = 'qc_passed',          // NEW: 品管通過
  QC_REJECTED = 'qc_rejected',      // NEW: 品管駁回
  CANCELLED = 'cancelled'
}
```

### 2. Log 擴展 (Log Extension)

```typescript
/**
 * Log Task Item
 * 日誌中的任務項目
 */
export interface LogTaskItem {
  /** Task ID */
  taskId: string;
  
  /** Task title (cached for display) */
  taskTitle: string;
  
  /** Quantity completed in this log */
  quantityCompleted: number;
  
  /** Unit */
  unit: string;
  
  /** Notes for this task in log */
  notes?: string;
}

/**
 * Log with Task Support
 * 支援任務的日誌
 */
export interface Log {
  // ... existing fields
  
  // NEW: Task items
  /** Tasks completed in this log */
  tasks?: LogTaskItem[];
  
  /** Total tasks count */
  tasksCount?: number;
}
```

### 3. Quality Control (品管) - New Module

```typescript
/**
 * Quality Control Status
 * 品管狀態
 */
export enum QCStatus {
  PENDING = 'pending',           // 待審核
  IN_PROGRESS = 'in_progress',   // 審核中
  PASSED = 'passed',             // 通過
  REJECTED = 'rejected',         // 駁回
  CANCELLED = 'cancelled'        // 取消
}

/**
 * Quality Control Record
 * 品管記錄
 */
export interface QualityControl {
  /** QC ID */
  id: string;
  
  /** Blueprint ID */
  blueprintId: string;
  
  /** Task ID being inspected */
  taskId: string;
  
  /** Task title (cached) */
  taskTitle: string;
  
  /** QC Status */
  status: QCStatus;
  
  /** Inspector account ID */
  inspectorId?: string;
  
  /** Inspector name (cached) */
  inspectorName?: string;
  
  /** Inspection notes */
  notes?: string;
  
  /** Inspection photos */
  photos?: string[];
  
  /** Issues found */
  issues?: string[];
  
  /** Passed quantity */
  passedQuantity?: number;
  
  /** Rejected quantity */
  rejectedQuantity?: number;
  
  /** Unit */
  unit?: string;
  
  /** Inspection date */
  inspectionDate?: Date;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Soft delete */
  deletedAt?: Date | null;
  
  /** Metadata */
  metadata?: Record<string, any>;
}
```

### 4. Task Progress (任務進度) - New Type

```typescript
/**
 * Task Progress Record
 * 任務進度記錄 (用於追蹤數量變化歷史)
 */
export interface TaskProgress {
  /** Progress ID */
  id: string;
  
  /** Task ID */
  taskId: string;
  
  /** Log ID (if from log) */
  logId?: string;
  
  /** Quantity delta (change amount) */
  quantityDelta: number;
  
  /** Total quantity after this change */
  totalQuantity: number;
  
  /** Action type */
  actionType: 'log_submit' | 'manual_adjust' | 'qc_adjust';
  
  /** Actor account ID */
  actorId: string;
  
  /** Notes */
  notes?: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Metadata */
  metadata?: Record<string, any>;
}
```

## 🗄️ 資料庫 Schema (Firestore)

### Tables to Create/Modify

```sql
-- 1. Extend tasks table
ALTER TABLE tasks 
ADD COLUMN total_quantity DECIMAL(10,2),
ADD COLUMN unit VARCHAR(50),
ADD COLUMN completed_quantity DECIMAL(10,2) DEFAULT 0,
ADD COLUMN enable_quantity_tracking BOOLEAN DEFAULT FALSE,
ADD COLUMN auto_complete_on_quantity_reached BOOLEAN DEFAULT TRUE,
ADD COLUMN auto_send_to_qc BOOLEAN DEFAULT TRUE;

-- 2. Create log_tasks junction table
CREATE TABLE log_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255),
  quantity_completed DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(log_id, task_id)
);

-- 3. Create quality_controls table
CREATE TABLE quality_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  inspector_id UUID REFERENCES accounts(id),
  inspector_name VARCHAR(255),
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  issues TEXT[],
  passed_quantity DECIMAL(10,2),
  rejected_quantity DECIMAL(10,2),
  unit VARCHAR(50),
  inspection_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB
);

-- 4. Create task_progress table (audit trail)
CREATE TABLE task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE SET NULL,
  quantity_delta DECIMAL(10,2) NOT NULL,
  total_quantity DECIMAL(10,2) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_log_tasks_log_id ON log_tasks(log_id);
CREATE INDEX idx_log_tasks_task_id ON log_tasks(task_id);
CREATE INDEX idx_quality_controls_task_id ON quality_controls(task_id);
CREATE INDEX idx_quality_controls_status ON quality_controls(status);
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
```

## 🔄 工作流設計 (Workflow Design)

### Blueprint Event Bus Integration

本設計遵循 Container Layer 規範 (setc.md)，**所有模組間通訊統一使用 Blueprint Event Bus**。

#### Event Bus 位置
- 實作: `src/app/core/blueprint/events/event-bus.ts`
- 介面: `src/app/core/blueprint/events/event-bus.interface.ts`
- 事件類型: `src/app/core/blueprint/events/event-types.ts`

#### 新增事件類型

```typescript
// 擴展 BlueprintEventType (src/app/core/blueprint/events/event-types.ts)
export enum BlueprintEventType {
  // ... existing events

  // Task Quantity Events
  TASK_QUANTITY_UPDATED = 'TASK_QUANTITY_UPDATED',
  TASK_QUANTITY_REACHED = 'TASK_QUANTITY_REACHED',
  TASK_AUTO_COMPLETED = 'TASK_AUTO_COMPLETED',
  TASK_SENT_TO_QC = 'TASK_SENT_TO_QC',

  // Log-Task Events
  LOG_TASK_ADDED = 'LOG_TASK_ADDED',
  LOG_SUBMITTED = 'LOG_SUBMITTED',

  // QC Events
  QC_CREATED = 'QC_CREATED',
  QC_ASSIGNED = 'QC_ASSIGNED',
  QC_INSPECTION_STARTED = 'QC_INSPECTION_STARTED',
  QC_PASSED = 'QC_PASSED',
  QC_REJECTED = 'QC_REJECTED',
  QC_CANCELLED = 'QC_CANCELLED'
}
```

### Event-Driven Workflow Flow

```typescript
/**
 * 使用 Blueprint Event Bus 的工作流程
 */

// 1. Log Submit → Emit Event
eventBus.emit('LOG_TASK_ADDED', {
  logId: '...',
  taskId: '...',
  quantityCompleted: 20
}, 'log-module');

// 2. Task Module 監聽並更新數量
eventBus.on('LOG_TASK_ADDED', async (event) => {
  await taskService.updateQuantity(event.payload.taskId, event.payload.quantityCompleted);
  
  // Check if quantity reached
  const task = await taskService.getTask(event.payload.taskId);
  if (task.completedQuantity >= task.totalQuantity) {
    eventBus.emit('TASK_QUANTITY_REACHED', {
      taskId: task.id,
      autoCompleteEnabled: task.autoCompleteOnQuantityReached
    }, 'task-module');
  }
});

// 3. Workflow Service 監聽並執行自動化
eventBus.on('TASK_QUANTITY_REACHED', async (event) => {
  if (event.payload.autoCompleteEnabled) {
    await taskService.completeTask(event.payload.taskId);
    eventBus.emit('TASK_AUTO_COMPLETED', {
      taskId: event.payload.taskId
    }, 'workflow-service');
    
    if (event.payload.autoSendToQCEnabled) {
      const qc = await qcService.createQC(event.payload.taskId);
      eventBus.emit('TASK_SENT_TO_QC', {
        taskId: event.payload.taskId,
        qcId: qc.id
      }, 'workflow-service');
    }
  }
});

// 4. QC Module 監聽並處理
eventBus.on('QC_PASSED', async (event) => {
  await taskService.updateStatus(event.payload.taskId, 'qc_passed');
});
```

### 模組解耦規則 (Module Decoupling Rules)

遵循 Container Layer 規範：

1. ✅ **NO direct module imports** - 禁止直接匯入其他模組
2. ✅ **ALL communication via Event Bus** - 所有通訊透過 Event Bus
3. ✅ **Publish/Subscribe pattern** - 發布/訂閱模式
4. ✅ **Zero coupling** - 零耦合設計

## 🎨 UI/UX 設計 (UI/UX Design)

### 1. Task Form Enhancement

```
任務表單新增欄位:
┌─────────────────────────────────┐
│ 任務標題: [____________]         │
│ 描述: [______________]           │
│                                  │
│ ☑ 啟用數量追蹤                   │
│                                  │
│ 總數量: [____] 單位: [____]      │
│ ☑ 數量達標自動完成               │
│ ☑ 完成後自動送品管               │
│                                  │
│ [取消] [儲存]                    │
└─────────────────────────────────┘
```

### 2. Log Form with Task Selector

```
日誌表單:
┌─────────────────────────────────┐
│ 日期: [2025-12-11]              │
│ 標題: [____________]             │
│                                  │
│ [+ 新增任務項目]                 │
│                                  │
│ ┌─────────────────────────┐    │
│ │ 任務: [下拉選擇任務▼]    │    │
│ │ 完成數量: [___] 件       │    │
│ │ 備註: [_________]        │    │
│ │ [移除]                   │    │
│ └─────────────────────────┘    │
│                                  │
│ [取消] [儲存]                    │
└─────────────────────────────────┘
```

### 3. Task Progress Dashboard

```
任務進度視覺化:
┌─────────────────────────────────┐
│ 鋼筋綁紮作業                     │
│ ████████░░ 80/100 噸            │
│                                  │
│ 進度歷史:                        │
│ 2025-12-11  施工日誌 #123  +20噸│
│ 2025-12-10  施工日誌 #122  +30噸│
│ 2025-12-09  施工日誌 #121  +30噸│
│                                  │
│ 狀態: [進行中] → [等待品管]      │
└─────────────────────────────────┘
```

### 4. Quality Control Interface

```
品管審核介面:
┌─────────────────────────────────┐
│ 任務: 鋼筋綁紮作業               │
│ 完成數量: 100噸                  │
│                                  │
│ 審核結果:                        │
│ ( ) 通過  ( ) 駁回              │
│                                  │
│ 通過數量: [___] 噸              │
│ 駁回數量: [___] 噸              │
│                                  │
│ 問題描述: [____________]         │
│ 照片: [上傳照片]                 │
│                                  │
│ [提交審核]                       │
└─────────────────────────────────┘
```

## 🧩 實施步驟 (Implementation Steps)

### Phase 1: 資料層 (Data Layer)
1. ✅ 設計類型定義
2. ⬜ 建立資料庫 Schema
3. ⬜ 實作 Repository 層

### Phase 2: 業務邏輯層 (Business Logic Layer)
4. ⬜ 實作 Stores (Signal-based)
5. ⬜ 實作 Workflow Service
6. ⬜ 實作自動流程邏輯

### Phase 3: UI 層 (UI Layer)
7. ⬜ 擴展 Task Form
8. ⬜ 擴展 Log Form
9. ⬜ 建立 QC 介面
10. ⬜ 建立進度視覺化

### Phase 4: 測試與整合 (Testing & Integration)
11. ⬜ 單元測試
12. ⬜ 整合測試
13. ⬜ E2E 測試

## 📝 注意事項 (Notes)

### 奧卡姆剃刀原則 (Occam's Razor)
- 最小化複雜度
- 不過度設計
- 只實作當前需要的功能
- 為未來預留擴展空間但不實作

### 模組解耦 (Module Decoupling)
- 使用 Event Bus 進行模組間通訊
- Repository 層只負責資料存取
- Store 層管理狀態
- Component 層只處理 UI

### 效能考量 (Performance)
- 使用 Signals 實現細粒度的響應式更新
- 使用 OnPush 變更檢測策略
- 適當使用 computed() 快取計算結果
- 資料庫查詢加入適當索引

---

**文件版本**: v1.0  
**建立日期**: 2025-12-11  
**作者**: GigHub Development Team
