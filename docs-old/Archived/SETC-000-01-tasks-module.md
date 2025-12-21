# SETC-000-01: Tasks Module (任務管理模組)

> **模組 ID**: `tasks`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作  
> **優先級**: P0 (核心)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

任務域是 GigHub 系統的核心模組，負責所有任務管理相關功能。提供任務增刪改查、任務指派、狀態機、進度追蹤、排程管理及子任務等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

所有任務管理相關功能，包括：
- 任務建立、編輯、刪除、查詢
- 任務指派給使用者/團隊
- 任務狀態流轉管理
- 任務進度更新與追蹤
- 任務時間規劃與排程
- 子任務管理與階層結構

### 核心特性

- ✅ **完整 CRUD 操作**: 任務增刪改查功能
- ✅ **彈性狀態機**: 自定義任務狀態流轉
- ✅ **進度追蹤**: 即時任務進度更新
- ✅ **階層式任務**: 支援子任務與任務群組
- ✅ **排程管理**: 任務時間規劃與視圖
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **靈活性**: 支援各種工程類型的任務管理
2. **可組態**: 任務欄位、狀態、流程都可自定義
3. **易用性**: 直觀的使用者介面與操作流程
4. **可擴展**: 預留介面讓其他模組擴展任務功能

---

## 🏗️ 架構設計

### 目錄結構

```
tasks/
├── tasks.module.ts                # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts             # Domain 元資料
├── tasks.repository.ts            # 共用資料存取層
├── tasks.routes.ts                # Domain 路由配置
├── tasks.service.ts               # 任務核心服務
├── task-modal.component.ts        # 任務彈窗元件
├── tasks.component.ts             # 任務列表元件
├── services/                      # Sub-Module Services
│   ├── task-crud.service.ts       # Sub-Module: CRUD
│   ├── assignment.service.ts      # Sub-Module: Assignment (待實作)
│   ├── state-machine.service.ts   # Sub-Module: State Machine (待實作)
│   ├── progress.service.ts        # Sub-Module: Progress (待實作)
│   ├── schedule.service.ts        # Sub-Module: Schedule (待實作)
│   └── subtask.service.ts         # Sub-Module: Subtask (待實作)
├── models/                        # Domain 模型
├── components/                    # Domain UI 元件
├── config/
│   └── tasks.config.ts            # 模組配置
├── exports/
│   └── tasks-api.exports.ts       # 公開 API
├── index.ts                       # 統一匯出
└── README.md                      # 模組文檔
```

### 三層架構

```
┌─────────────────────────────────────┐
│   UI Layer (Presentation)          │
│   - tasks.component.ts              │
│   - task-modal.component.ts         │
└────────────┬────────────────────────┘
             │ 呼叫
┌────────────▼────────────────────────┐
│   Service Layer (Business Logic)    │
│   - tasks.service.ts                │
│   - task-crud.service.ts            │
└────────────┬────────────────────────┘
             │ 呼叫
┌────────────▼────────────────────────┐
│   Repository Layer (Data Access)    │
│   - tasks.repository.ts             │
└────────────┬────────────────────────┘
             │ 存取
┌────────────▼────────────────────────┐
│   Firestore (Database)              │
└─────────────────────────────────────┘
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Task CRUD Sub-Module (任務增刪改查)

**職責**: 任務建立、編輯、刪除、查詢與任務基本屬性管理

**核心功能**:
- 建立新任務
- 編輯任務資訊
- 刪除任務
- 查詢任務列表
- 任務詳細資料查看
- 任務篩選與排序

**狀態**: 🟡 部分實作於 `tasks.service.ts`

### 2️⃣ Assignment Sub-Module (任務指派)

**職責**: 任務指派給使用者/團隊與責任人管理

**核心功能**:
- 指派任務給使用者
- 指派任務給團隊
- 變更責任人
- 指派歷史記錄
- 工作負載分析

**狀態**: 🔴 待實作

### 3️⃣ State Machine Sub-Module (狀態機)

**職責**: 任務狀態流轉與自定義狀態定義

**核心功能**:
- 自定義任務狀態
- 狀態轉換規則
- 狀態流轉觸發器
- 狀態歷史記錄
- 狀態機視覺化

**狀態**: 🔴 待實作

### 4️⃣ Progress Tracking Sub-Module (進度追蹤)

**職責**: 任務進度更新與進度百分比計算

**核心功能**:
- 手動更新進度
- 自動計算進度（基於子任務）
- 進度歷史記錄
- 進度視覺化
- 進度預警

**狀態**: 🔴 待實作

### 5️⃣ Schedule Sub-Module (排程管理)

**職責**: 任務時間規劃與排程視圖

**核心功能**:
- 設定任務開始/結束時間
- 設定任務里程碑
- 甘特圖視圖
- 日曆視圖
- 排程衝突檢查
- 關鍵路徑分析

**狀態**: 🔴 待實作

### 6️⃣ Subtask Sub-Module (子任務)

**職責**: 子任務管理與任務階層結構

**核心功能**:
- 建立子任務
- 管理任務階層
- 子任務進度彙整
- 父子任務關聯
- 階層視圖

**狀態**: 🔴 待實作

---

## 📊 資料模型

### Task (任務)

```typescript
interface Task {
  id: string;
  blueprintId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // 責任人
  assigneeId?: string;
  assigneeName?: string;
  teamId?: string;
  
  // 進度
  progress: number;
  completionPercentage: number;
  
  // 時間
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // 階層
  parentTaskId?: string;
  subtaskIds: string[];
  
  // 關聯
  contractId?: string;
  workItemId?: string;
  locationId?: string;
  
  // 標籤與分類
  tags: string[];
  category?: string;
  
  // 附件
  attachments: Attachment[];
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}
```

### TaskStatus (任務狀態)

```typescript
type TaskStatus = 
  | 'draft'         // 草稿
  | 'pending'       // 待開始
  | 'in_progress'   // 進行中
  | 'on_hold'       // 暫停
  | 'blocked'       // 阻塞
  | 'completed'     // 完成
  | 'cancelled';    // 取消
```

### TaskPriority (任務優先級)

```typescript
type TaskPriority = 
  | 'critical'      // 緊急
  | 'high'          // 高
  | 'medium'        // 中
  | 'low';          // 低
```

---

## 🔌 公開 API

### ITaskModuleApi

```typescript
interface ITaskModuleApi {
  crud: ITaskCrudApi;               // 任務 CRUD 操作
  assignment: ITaskAssignmentApi;   // 任務指派
  stateMachine: ITaskStateMachineApi; // 狀態機
  progress: ITaskProgressApi;       // 進度追蹤
  schedule: ITaskScheduleApi;       // 排程管理
  subtask: ISubtaskApi;             // 子任務
}
```

### ITaskCrudApi

```typescript
interface ITaskCrudApi {
  create(task: CreateTaskDto): Promise<Task>;
  update(id: string, task: UpdateTaskDto): Promise<Task>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Task | undefined>;
  findAll(blueprintId: string, filter?: TaskFilter): Promise<Task[]>;
  search(blueprintId: string, query: string): Promise<Task[]>;
}
```

---

## 🚀 使用範例

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { TasksModule } from '@core/blueprint/modules/implementations/tasks';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入任務模組
const tasksModule = new TasksModule();
await container.loadModule(tasksModule);

// 啟動容器
await container.start();
```

### 2. 使用任務服務

```typescript
import { inject } from '@angular/core';
import { TasksService } from '@core/blueprint/modules/implementations/tasks';

class MyComponent {
  private tasksService = inject(TasksService);

  async loadTasks() {
    const tasks = await this.tasksService.getTasks('blueprint-123');
    console.log('Tasks:', tasks);
  }

  async createTask() {
    const newTask = await this.tasksService.createTask({
      blueprintId: 'blueprint-123',
      title: 'New Task',
      description: 'Task description',
      status: 'draft',
      priority: 'medium'
    });
    console.log('Created:', newTask);
  }
}
```

### 3. 使用 UI 元件

```html
<app-tasks 
  [blueprintId]="blueprintId()"
  (taskCreated)="onTaskCreated($event)"
  (taskUpdated)="onTaskUpdated($event)"
/>
```

---

## 📡 事件整合

### 發送事件

```typescript
// 任務建立事件
this.eventBus.emit({
  type: 'task.created',
  blueprintId: task.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { taskId: task.id, task }
});

// 任務完成事件
this.eventBus.emit({
  type: 'task.completed',
  blueprintId: task.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { taskId: task.id }
});
```

### 訂閱事件

```typescript
// 訂閱任務事件
this.eventBus.on('task.created')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(event => {
    console.log('New task created:', event.data);
    this.refreshTasks();
  });
```

---

## 🧪 測試

### 單元測試

```bash
# 執行任務模組單元測試
yarn test --include="**/tasks/**/*.spec.ts"
```

### 整合測試

```bash
# 執行任務模組整合測試
yarn test --include="**/tasks.module.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **任務指派**: Assignment Sub-Module
2. ⏳ **狀態機**: State Machine Sub-Module
3. ⏳ **進度追蹤**: Progress Tracking Sub-Module
4. ⏳ **排程管理**: Schedule Sub-Module (甘特圖、日曆視圖)
5. ⏳ **子任務**: Subtask Sub-Module
6. ⏳ **任務範本**: 可重複使用的任務範本
7. ⏳ **批次操作**: 批次建立、更新、刪除任務
8. ⏳ **任務匯入/匯出**: CSV, Excel 格式

---

## 🔗 相關模組

- **Log Module**: 記錄任務操作歷史
- **Workflow Module**: 任務自動化流程
- **Contract Module**: 任務與合約工項關聯
- **QA Module**: 任務與品質檢查關聯
- **Finance Module**: 任務成本追蹤

---

## 📚 參考資源

- [任務模組 README](../../src/app/core/blueprint/modules/implementations/tasks/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-046-task-module-enhancement-planning.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
