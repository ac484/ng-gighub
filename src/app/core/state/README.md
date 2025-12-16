# Core State Management

> **Signal-based 狀態管理** - 使用 Angular Signals 進行響應式狀態管理

## 📋 目錄說明

### stores/
包含所有 Signal-based Store，負責管理應用程式狀態。

**現有 Stores**:
- `task.store.ts` - 任務狀態管理
- `log.store.ts` - 日誌狀態管理
- `construction-log.store.ts` - 施工日誌狀態管理
- `notification.store.ts` - 通知狀態管理
- `team.store.ts` - 團隊狀態管理

## 🎯 設計原則

### 為什麼使用 Signals？

從 Angular 16+ 開始，Signals 提供了更簡單、更高效的響應式狀態管理方案：

✅ **優點**:
1. **簡單直觀** - 無需 actions, reducers, selectors
2. **自動優化** - 更精確的變更檢測
3. **類型安全** - TypeScript 完整支援
4. **與 Zoneless 相容** - 更好的效能

❌ **不需要**:
- Redux-style actions
- Selectors（使用 `computed()` 取代）
- Effects（使用方法取代）

### 架構簡化

```
❌ 傳統 Redux/NgRx 模式:
core/state/
├── stores/
├── actions/       # 不需要！
└── selectors/     # 不需要！

✅ Signal-based 模式:
core/state/
└── stores/        # 只需要這個！
```

## 📝 Store 標準模式

### 基本 Store 範例

```typescript
// stores/task.store.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Task } from '@core/domain/models';
import { TaskRepository } from '@core/data-access/repositories/shared';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private taskRepository = inject(TaskRepository);
  
  // ========== Private State ==========
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _selectedTaskId = signal<string | null>(null);
  
  // ========== Public Readonly State ==========
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedTaskId = this._selectedTaskId.asReadonly();
  
  // ========== Computed State (取代 Selectors) ==========
  readonly selectedTask = computed(() => {
    const id = this._selectedTaskId();
    return id ? this._tasks().find(t => t.id === id) : null;
  });
  
  readonly completedTasks = computed(() =>
    this._tasks().filter(t => t.status === 'completed')
  );
  
  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );
  
  readonly taskCount = computed(() => this._tasks().length);
  
  readonly completionRate = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return 0;
    const completed = this.completedTasks().length;
    return (completed / total) * 100;
  });
  
  // ========== Actions (取代 Redux Actions) ==========
  async loadTasks(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const tasks = await this.taskRepository.findAll();
      this._tasks.set(tasks);
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  async loadTask(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const task = await this.taskRepository.findById(id);
      if (task) {
        this._tasks.update(tasks => {
          const index = tasks.findIndex(t => t.id === id);
          if (index >= 0) {
            tasks[index] = task;
            return [...tasks];
          }
          return [...tasks, task];
        });
      }
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const newTask = await this.taskRepository.create(task);
      this._tasks.update(tasks => [...tasks, newTask]);
      return newTask;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const updatedTask = await this.taskRepository.update(id, updates);
      this._tasks.update(tasks =>
        tasks.map(t => t.id === id ? updatedTask : t)
      );
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  async deleteTask(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      await this.taskRepository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  // ========== Local State Management ==========
  selectTask(id: string | null): void {
    this._selectedTaskId.set(id);
  }
  
  clearError(): void {
    this._error.set(null);
  }
  
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._selectedTaskId.set(null);
  }
}
```

## 🔧 使用模式

### 在元件中使用 Store

```typescript
// routes/tasks/pages/tasks.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { TaskStore } from '@core/state/stores';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (taskStore.loading()) {
      <nz-spin nzSimple />
    } @else if (taskStore.error()) {
      <nz-alert nzType="error" [nzMessage]="taskStore.error()!" />
    } @else {
      <div class="stats">
        <p>總任務數: {{ taskStore.taskCount() }}</p>
        <p>完成率: {{ taskStore.completionRate() | number:'1.0-1' }}%</p>
      </div>
      
      <h3>待處理任務</h3>
      @for (task of taskStore.pendingTasks(); track task.id) {
        <app-task-card [task]="task" (click)="selectTask(task.id)" />
      }
      
      <h3>已完成任務</h3>
      @for (task of taskStore.completedTasks(); track task.id) {
        <app-task-card [task]="task" (click)="selectTask(task.id)" />
      }
    }
  `
})
export class TasksPageComponent implements OnInit {
  taskStore = inject(TaskStore);
  
  ngOnInit(): void {
    this.taskStore.loadTasks();
  }
  
  selectTask(id: string): void {
    this.taskStore.selectTask(id);
  }
  
  async createTask(title: string): Promise<void> {
    try {
      await this.taskStore.createTask({
        title,
        description: '',
        status: 'pending',
        assigneeId: null,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }
}
```

### 在服務中使用 Store

```typescript
// routes/tasks/services/tasks-facade.service.ts
import { Injectable, inject } from '@angular/core';
import { TaskStore } from '@core/state/stores';
import { LogStore } from '@core/state/stores';
import { NotificationService } from '@shared/services';

@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private taskStore = inject(TaskStore);
  private logStore = inject(LogStore);
  private notificationService = inject(NotificationService);
  
  async createTaskWithLog(
    taskData: Omit<Task, 'id'>,
    logMessage: string
  ): Promise<void> {
    try {
      // 協調多個 store
      const task = await this.taskStore.createTask(taskData);
      await this.logStore.createLog({
        taskId: task.id,
        message: logMessage,
        createdAt: new Date()
      });
      
      this.notificationService.success('任務建立成功');
    } catch (err) {
      this.notificationService.error('任務建立失敗');
      throw err;
    }
  }
}
```

## 🎨 進階模式

### 1. 與 RxJS 整合

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();
  
  // 轉換為 Observable（如需與舊程式碼整合）
  readonly tasks$ = toObservable(this.tasks);
}
```

### 2. Effects with Signals

```typescript
import { effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private _selectedTaskId = signal<string | null>(null);
  
  constructor() {
    // 當選中的任務改變時，自動執行副作用
    effect(() => {
      const taskId = this._selectedTaskId();
      if (taskId) {
        console.log('Selected task changed:', taskId);
        // 可以觸發其他操作
      }
    });
  }
}
```

### 3. 樂觀更新

```typescript
async updateTask(id: string, updates: Partial<Task>): Promise<void> {
  // 樂觀更新 UI
  const previousTasks = this._tasks();
  this._tasks.update(tasks =>
    tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  );
  
  try {
    // 實際更新後端
    await this.taskRepository.update(id, updates);
  } catch (err) {
    // 失敗時回滾
    this._tasks.set(previousTasks);
    this._error.set(err instanceof Error ? err.message : 'Unknown error');
    throw err;
  }
}
```

## 📊 測試 Store

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { TaskRepository } from '@core/data-access/repositories/shared';

describe('TaskStore', () => {
  let store: TaskStore;
  let mockRepository: jasmine.SpyObj<TaskRepository>;
  
  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('TaskRepository', [
      'findAll', 'findById', 'create', 'update', 'delete'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskRepository, useValue: mockRepository }
      ]
    });
    
    store = TestBed.inject(TaskStore);
  });
  
  it('should load tasks', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' }
    ];
    mockRepository.findAll.and.returnValue(Promise.resolve(mockTasks));
    
    await store.loadTasks();
    
    expect(store.tasks()).toEqual(mockTasks);
    expect(store.taskCount()).toBe(2);
  });
  
  it('should compute completed tasks correctly', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' },
      { id: '3', title: 'Task 3', status: 'completed' }
    ];
    mockRepository.findAll.and.returnValue(Promise.resolve(mockTasks));
    
    await store.loadTasks();
    
    expect(store.completedTasks().length).toBe(2);
    expect(store.pendingTasks().length).toBe(1);
    expect(store.completionRate()).toBeCloseTo(66.67, 1);
  });
});
```

## 🔍 相關文檔

- [Core Layer README](../README.md) - Core 層總覽
- [ADR-0003: Signal-based State Management](../../../docs/architecture/decisions/) - (未來可能添加)
- [Angular Signals 官方文檔](https://angular.dev/guide/signals)

## ⚠️ 最佳實踐

### ✅ 推薦做法

1. **使用 `asReadonly()`** 暴露公開狀態
2. **使用 `computed()`** 處理衍生狀態
3. **保持 Store 單一職責** - 一個 Store 管理一個領域
4. **錯誤處理** - 總是處理並暴露錯誤狀態
5. **Loading 狀態** - 提供 loading 指示器

### ❌ 避免的反模式

```typescript
// ❌ 直接修改 signal 內部的物件
this._tasks().push(newTask);  // 不會觸發更新！

// ✅ 使用 update() 建立新陣列
this._tasks.update(tasks => [...tasks, newTask]);

// ❌ 暴露可寫的 signal
readonly tasks = this._tasks;  // 外部可以修改！

// ✅ 使用 asReadonly()
readonly tasks = this._tasks.asReadonly();

// ❌ 在 computed() 中執行副作用
readonly total = computed(() => {
  console.log('Computing...');  // 副作用！
  return this._tasks().length;
});

// ✅ 純計算邏輯
readonly total = computed(() => this._tasks().length);
```

---

**維護者**: Architecture Team  
**建立日期**: 2025-12-14  
**版本**: 1.0
