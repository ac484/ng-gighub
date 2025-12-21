# Core Stores Agent Guide

## Title + Scope
Scope: Signal-based stores under src/app/core/state/stores.

## Purpose / Responsibility
Describe shared state stores used across the application, ensuring stateful logic stays centralized and consistent.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific logic outside shared state responsibilities.
- NO direct Firebase access; stores consume services/repositories.

## Allowed / Expected Content
- Signal-based stores managing shared state and exposing readonly signals.
- Store utilities, selectors, and supporting tests/docs.

## Structure / Organization
- Individual store files grouped by domain, plus index/barrel exports if needed.

## Integration / Dependencies
- Use inject() for dependencies; interact with services/repositories via public interfaces.
- Avoid feature-to-feature coupling; stores should be reusable and stateless where possible aside from contained state.

## Best Practices / Guidelines
- Use private writable signals with public readonly exposures, computed selectors, and effects for side effects.
- Apply Result pattern for async flows and keep teardown clean with takeUntilDestroyed() where observables are used.

## Related Docs / References
- ../../AGENTS.md (Core overview)
- ../../services/AGENTS.md
- ../../data-access/repositories/AGENTS.md

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Core Stores Agent Guide

The Core Stores directory contains centralized state management stores using Angular Signals.

## Module Purpose

**規則**:
- 提供集中的應用程式狀態管理
- 使用 Angular Signals 實作反應式狀態
- 封裝狀態更新邏輯
- 提供 computed 衍生狀態
- 支援跨元件狀態共享
- 實作狀態持久化（如需要）

## Module Structure

**規則**:
- `src/app/core/stores/AGENTS.md` - 本文件
- `log.store.ts` - 日誌狀態管理
- `task.store.ts` - 任務狀態管理
- `index.ts` - 公開 API 匯出

## Store Pattern

**規則**:
- 每個 Store 必須使用 `@Injectable({ providedIn: 'root' })` 註冊為單例
- 必須使用 `signal()` 定義私有可寫狀態
- 必須使用 `asReadonly()` 暴露公開唯讀狀態
- 必須使用 `computed()` 定義衍生狀態
- 必須提供 action 方法更新狀態
- 必須使用 Repository 進行資料存取
- 必須使用 `inject()` 函數注入依賴

## Store Architecture

### State Structure

**規則**:
- 私有狀態：使用 `private _stateName = signal<T>(initialValue)`
- 公開狀態：使用 `stateName = this._stateName.asReadonly()`
- 計算狀態：使用 `computed(() => derivedValue)`
- 載入狀態：使用 `private _loading = signal(false)`
- 錯誤狀態：使用 `private _error = signal<string | null>(null)`

### Action Methods

**規則**:
- 必須是 `async` 方法（如果涉及非同步操作）
- 必須設定載入狀態：`this._loading.set(true)`
- 必須使用 `try-catch` 處理錯誤
- 必須在 `finally` 中重置載入狀態
- 必須記錄錯誤到 LoggerService
- 必須使用 `signal.set()` 或 `signal.update()` 更新狀態

## Implementation Example

### task.store.ts

```typescript
/**
 * Task Store
 *
 * Centralized state management for tasks using Angular Signals.
 * Provides reactive task data, loading states, and CRUD operations.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { TaskRepository } from '@core/repositories/task.repository';
import { LoggerService } from '@core/services/logger.service';
import { Task, TaskStatus, CreateTaskData, UpdateTaskData } from '@core/models';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private taskRepo = inject(TaskRepository);
  private logger = inject(LoggerService);

  // Private writable state
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _selectedTaskId = signal<string | null>(null);

  // Public readonly state
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedTaskId = this._selectedTaskId.asReadonly();

  // Computed state
  readonly selectedTask = computed(() => {
    const id = this._selectedTaskId();
    return id ? this._tasks().find(t => t.id === id) : null;
  });

  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === TaskStatus.Pending)
  );

  readonly completedTasks = computed(() =>
    this._tasks().filter(t => t.status === TaskStatus.Completed)
  );

  readonly taskCount = computed(() => ({
    total: this._tasks().length,
    pending: this.pendingTasks().length,
    completed: this.completedTasks().length
  }));

  // Actions
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this.logger.debug('TaskStore', `Loading tasks for blueprint: ${blueprintId}`);
      const tasks = await this.taskRepo.findByBlueprint(blueprintId);
      this._tasks.set(tasks);
      this.logger.info('TaskStore', `Loaded ${tasks.length} tasks`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('TaskStore', 'Failed to load tasks', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this.logger.debug('TaskStore', 'Creating task', data);
      const task = await this.taskRepo.create(data);
      this._tasks.update(tasks => [...tasks, task]);
      this.logger.info('TaskStore', `Created task: ${task.id}`);
      return task;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('TaskStore', 'Failed to create task', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this.logger.debug('TaskStore', `Updating task: ${id}`, data);
      await this.taskRepo.update(id, data);
      this._tasks.update(tasks =>
        tasks.map(t => (t.id === id ? { ...t, ...data } : t))
      );
      this.logger.info('TaskStore', `Updated task: ${id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('TaskStore', `Failed to update task: ${id}`, error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteTask(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this.logger.debug('TaskStore', `Deleting task: ${id}`);
      await this.taskRepo.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
      this.logger.info('TaskStore', `Deleted task: ${id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMsg);
      this.logger.error('TaskStore', `Failed to delete task: ${id}`, error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // Selection management
  selectTask(id: string | null): void {
    this._selectedTaskId.set(id);
    this.logger.debug('TaskStore', `Selected task: ${id}`);
  }

  // Reset state
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._selectedTaskId.set(null);
    this.logger.debug('TaskStore', 'Store reset');
  }
}
```

## Usage in Components

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TaskStore } from '@core/stores';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (store.loading()) {
      <nz-spin nzSimple />
    } @else if (store.error()) {
      <nz-alert nzType="error" [nzMessage]="store.error()" />
    } @else {
      <div class="task-stats">
        <nz-statistic nzTitle="Total" [nzValue]="store.taskCount().total" />
        <nz-statistic nzTitle="Pending" [nzValue]="store.taskCount().pending" />
        <nz-statistic nzTitle="Completed" [nzValue]="store.taskCount().completed" />
      </div>

      <nz-list [nzDataSource]="store.tasks()" nzItemLayout="horizontal">
        <nz-list-item *ngFor="let task of store.tasks()">
          <nz-list-item-meta
            [nzTitle]="task.title"
            [nzDescription]="task.description"
          />
        </nz-list-item>
      </nz-list>
    }
  `
})
export class TaskListComponent implements OnInit {
  store = inject(TaskStore);

  ngOnInit(): void {
    this.store.loadTasks('blueprint-id');
  }
}
```

## Best Practices

**規則**:
1. Store 應該只管理狀態，不包含 UI 邏輯
2. UI 邏輯應該在 Components 中實作
3. Store 應該使用 Repository 進行資料存取
4. Store 方法應該是純函數（除了非同步操作）
5. 必須使用 TypeScript 嚴格類型
6. 必須提供 JSDoc 註解
7. 必須實作適當的錯誤處理
8. 必須使用 LoggerService 記錄操作
9. 必須使用 `asReadonly()` 防止外部直接修改狀態
10. 必須使用 `computed()` 定義衍生狀態

## Import Conventions

**規則**:
- 從 `@core/stores` 匯入：`import { TaskStore } from '@core/stores'`
- 使用 `inject()` 注入：`store = inject(TaskStore)`
- 不使用相對路徑：❌ `import { TaskStore } from '../stores/task.store'`

## Testing

**規則**:
- 必須為每個 Store 提供單元測試
- 必須 mock Repository 服務
- 必須測試所有 action 方法
- 必須測試 computed 狀態
- 必須測試錯誤處理
- 必須驗證狀態更新邏輯

## Related Documentation

- **[Core Models](../models/AGENTS.md)** - Store 使用的資料模型
- **[Core Repositories](../repositories/AGENTS.md)** - Store 使用的資料存取層
- **[Core Services](../AGENTS.md)** - 相關核心服務

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-11  
**Status**: Active
