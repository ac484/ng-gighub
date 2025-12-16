# Task Domain (任務域)

> **Domain ID**: `tasks`  
> **Version**: 1.0.0  
> **Status**: ✅ Implemented  
> **Architecture**: Blueprint Container Module  
> **Priority**: P0 (核心)

## 📋 Overview

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

## 🏗️ Architecture

### Domain 結構

```
tasks/
├── tasks.module.ts                # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts             # Domain 元資料
├── tasks.repository.ts            # 共用資料存取層
├── tasks.routes.ts                # Domain 路由配置
├── tasks.service.ts               # 任務核心服務
├── task-modal.component.ts        # 任務彈窗元件
├── tasks.component.ts             # 任務列表元件
├── services/                      # Sub-Module Services (Future)
│   ├── task-crud.service.ts       # Sub-Module: CRUD (待重構)
│   ├── assignment.service.ts      # Sub-Module: Assignment (待實作)
│   ├── state-machine.service.ts   # Sub-Module: State Machine (待實作)
│   ├── progress.service.ts        # Sub-Module: Progress (待實作)
│   ├── schedule.service.ts        # Sub-Module: Schedule (待實作)
│   └── subtask.service.ts         # Sub-Module: Subtask (待實作)
├── models/                        # Domain 模型 (待組織)
├── views/                         # Domain UI 元件
│   └── (當前元件待移入此處)
├── config/
│   └── tasks.config.ts            # 模組配置
├── exports/
│   └── tasks-api.exports.ts       # 公開 API
├── index.ts                       # 統一匯出
└── README.md                      # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Task CRUD Sub-Module (任務增刪改查)

**職責**: 任務建立、編輯、刪除、查詢與任務基本屬性管理

**核心功能**:
- 建立新任務
- 編輯任務資訊
- 刪除任務
- 查詢任務列表
- 任務詳細資料查看
- 任務篩選與排序

**狀態**: 🟡 部分實作於 `tasks.service.ts`，待重構為獨立 Sub-Module

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

**狀態**: 🔴 待實作（需整合 Workflow Domain）

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

## 🚀 Quick Start

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

### 2. 使用任務服務 (當前實作)

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

```typescript
import { Component } from '@angular/core';
import { TasksComponent } from '@core/blueprint/modules/implementations/tasks';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [TasksComponent],
  template: `
    <app-tasks [blueprintId]="blueprintId" />
  `
})
export class MyPageComponent {
  blueprintId = 'blueprint-123';
}
```

## 📖 API Reference

### Current TasksService API

```typescript
interface TasksService {
  // 取得任務列表
  getTasks(blueprintId: string): Promise<Task[]>;
  
  // 取得單一任務
  getTask(taskId: string): Promise<Task | null>;
  
  // 建立任務
  createTask(data: CreateTaskData): Promise<Task>;
  
  // 更新任務
  updateTask(taskId: string, data: Partial<Task>): Promise<Task>;
  
  // 刪除任務
  deleteTask(taskId: string): Promise<void>;
  
  // 查詢任務
  queryTasks(blueprintId: string, filters: TaskFilters): Promise<Task[]>;
}
```

### Future Sub-Module APIs (Planned)

詳細的 Sub-Module API 設計請參考各 Sub-Module 的說明文件（待建立）。

## 🔧 Configuration

### Module Configuration

```typescript
import { ITasksConfig, DEFAULT_TASKS_CONFIG } from '@core/blueprint/modules/implementations/tasks';

const customConfig: ITasksConfig = {
  ...DEFAULT_TASKS_CONFIG,
  features: {
    enableTaskCRUD: true,
    enableAssignment: true,
    enableStateMachine: true,
    enableProgressTracking: true,
    enableSchedule: true,
    enableSubtask: true,
    enableComments: true,
    enableAttachments: true
  },
  settings: {
    defaultStatus: 'draft',
    defaultPriority: 'medium',
    maxSubtaskDepth: 3,
    enableAutoProgress: true,
    enableDueDateReminder: true
  }
};
```

## 📊 Data Storage

### Supabase Tables

```sql
-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  parent_task_id UUID REFERENCES tasks(id),
  task_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  
  -- Assignment
  assigned_to UUID,
  assigned_team UUID,
  
  -- Progress
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Schedule
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[],
  custom_fields JSONB,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Task Status History
CREATE TABLE task_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Task Assignments History
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  assigned_to UUID,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ
);
```

## 🎯 Event Bus Integration

### Emitted Events

```typescript
const TASK_EVENTS = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_PROGRESS_UPDATED: 'TASK_PROGRESS_UPDATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_DUE_DATE_APPROACHING: 'TASK_DUE_DATE_APPROACHING',
  TASK_OVERDUE: 'TASK_OVERDUE'
};
```

### Event Handling Example

```typescript
// 在其他模組中監聽任務事件
context.eventBus.on('TASK_CREATED', async (data: any) => {
  console.log('New task created:', data);
  // 執行相應處理，例如發送通知、記錄日誌等
});

context.eventBus.on('TASK_COMPLETED', async (data: any) => {
  console.log('Task completed:', data);
  // 可能觸發驗收流程、發放款項等
});
```

## 📝 Best Practices

### 1. 任務命名

```typescript
// ✅ 好的做法: 清晰描述性的任務名稱
const task = {
  title: '地下室鋼筋綁紮 - A區',
  description: '完成 B1 A區柱體鋼筋綁紮作業'
};

// ❌ 避免: 模糊不清的名稱
const task = {
  title: '任務1',
  description: '做事情'
};
```

### 2. 任務狀態流轉

```typescript
// ✅ 好的做法: 明確的狀態轉換
await tasksService.updateTaskStatus(taskId, 'in_progress', {
  assignedTo: 'user-123',
  startedAt: new Date(),
  notes: '開始執行任務'
});

// 任務完成時記錄完整資訊
await tasksService.completeTask(taskId, {
  completedBy: 'user-123',
  completedAt: new Date(),
  actualDuration: 120, // minutes
  notes: '任務順利完成'
});
```

### 3. 子任務管理

```typescript
// ✅ 好的做法: 使用子任務分解複雜任務
const parentTask = await tasksService.createTask({
  title: '地下室結構工程',
  // ...
});

const subtasks = [
  { title: '鋼筋工程', parentTaskId: parentTask.id },
  { title: '混凝土工程', parentTaskId: parentTask.id },
  { title: '模板工程', parentTaskId: parentTask.id }
];

for (const subtask of subtasks) {
  await tasksService.createTask(subtask);
}
```

## 🔗 Domain 依賴關係

### 被依賴關係

Task Domain 是核心模組，被多個 Domains 使用：
- **QA Domain**: 品質檢查關聯任務
- **Acceptance Domain**: 驗收關聯任務
- **Finance Domain**: 付款關聯任務
- **Material Domain**: 材料使用關聯任務
- **Log Domain**: 記錄任務操作

### 依賴關係

Task Domain 依賴：
- **Platform Layer**: Event Bus, Context
- **Workflow Domain**: 任務狀態流轉（未來整合）
- **Log Domain**: 記錄任務變更
- **Supabase**: 資料儲存與查詢

## 🚧 Refactoring Roadmap

### Phase 1: 重構現有程式碼
- [ ] 將 `tasks.service.ts` 拆分為 `task-crud.service.ts`
- [ ] 建立標準的 models 目錄與型別定義
- [ ] 重組 UI 元件到 `views/` 目錄
- [ ] 統一 API 介面設計

### Phase 2: 實作缺少的 Sub-Modules
- [ ] 實作 Assignment Sub-Module
- [ ] 實作 Progress Tracking Sub-Module
- [ ] 實作 Subtask Sub-Module

### Phase 3: 整合其他 Domains
- [ ] 與 Workflow Domain 整合（State Machine）
- [ ] 與 Log Domain 整合（完整追蹤）
- [ ] 與 Schedule Module 整合（未來規劃）

### Phase 4: 進階功能
- [ ] 任務範本
- [ ] 任務批次操作
- [ ] 任務看板視圖
- [ ] 任務甘特圖
- [ ] 任務報表

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [Task Domain 擴充設計](../../../../../docs/task-quantity-expansion-design.md)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 🤝 Contributing

在修改任務模組前，請確保：

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
**Domain Priority**: P0 (核心，已實作)  
**Contact**: 請透過專案 GitHub Issues 回報問題
