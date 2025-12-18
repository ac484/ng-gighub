---
description: 'GigHub Angular Signals 狀態管理模式與最佳實踐'
applyTo: '**/*.ts'
---

# GigHub Signals 狀態管理

> **專案專用**: Angular Signals 響應式狀態管理

## 🎯 核心原則 (MUST) 🔴

### 為什麼使用 Signals?

1. **細粒度響應式** - 只更新受影響的部分
2. **效能優化** - 自動追蹤依賴，減少不必要的計算
3. **簡化狀態管理** - 無需 NgRx/Redux 等複雜狀態管理庫
4. **類型安全** - TypeScript 完整支援

### 禁止使用的狀態管理方案

- ❌ NgRx
- ❌ Redux
- ❌ 手動管理 Subscriptions
- ❌ 過度使用 BehaviorSubject

### 推薦使用 Signals

- ✅ `signal()` - 可寫信號
- ✅ `computed()` - 衍生信號 (只讀)
- ✅ `effect()` - 副作用處理
- ✅ `linkedSignal()` - 可寫的衍生信號

## 📐 Signals API 參考

### 1. signal() - 可寫信號

用於創建可變更的響應式狀態。

```typescript
import { signal } from '@angular/core';

// 創建 signal
const count = signal(0);

// 讀取值 (呼叫函式)
console.log(count());  // 0

// 設定新值
count.set(10);
console.log(count());  // 10

// 基於前值更新
count.update(value => value + 1);
console.log(count());  // 11
```

### 2. computed() - 衍生信號 (只讀)

用於創建基於其他信號自動計算的值。

```typescript
import { signal, computed } from '@angular/core';

const firstName = signal('John');
const lastName = signal('Doe');

// 自動追蹤依賴
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName());  // "John Doe"

firstName.set('Jane');
console.log(fullName());  // "Jane Doe" (自動更新)
```

### 3. effect() - 副作用處理

用於執行依賴信號變化的副作用。

```typescript
import { signal, effect } from '@angular/core';

const count = signal(0);

// 當 count 改變時自動執行
effect(() => {
  console.log('Count changed:', count());
});

count.set(1);  // 自動觸發 effect
```

### 4. linkedSignal() - 可寫的衍生信號

結合 `signal()` 和 `computed()` 的特性。

```typescript
import { signal, linkedSignal } from '@angular/core';

const userStatus = signal<'online' | 'offline'>('online');

// 可寫的衍生信號
const notificationsEnabled = linkedSignal(() => userStatus() === 'online');

// 可以手動覆寫
notificationsEnabled.set(false);

// 當 userStatus 改變時會自動更新
userStatus.set('offline');
console.log(notificationsEnabled());  // false
```

## 🔧 實作模式

### 模式 1: 元件本地狀態

適用於不需要跨元件共享的狀態。

```typescript
import { Component, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="task-list">
      <div class="stats">
        <span>總計: {{ totalTasks() }}</span>
        <span>已完成: {{ completedTasks() }}</span>
        <span>進行中: {{ inProgressTasks() }}</span>
        <span>完成率: {{ completionRate() }}%</span>
      </div>
      
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (hasError()) {
        <nz-alert nzType="error" [nzMessage]="errorMessage()!" />
      } @else {
        @for (task of tasks(); track task.id) {
          <app-task-item 
            [task]="task" 
            (taskChange)="updateTask($event)" 
          />
        } @empty {
          <nz-empty nzNotFoundContent="沒有任務" />
        }
      }
    </div>
  `
})
export class TaskListComponent {
  // ✅ Writable signals - 可變更的狀態
  tasks = signal<Task[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // ✅ Computed signals - 自動計算的衍生狀態
  totalTasks = computed(() => this.tasks().length);
  
  completedTasks = computed(() => 
    this.tasks().filter(t => t.status === 'completed').length
  );
  
  inProgressTasks = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress').length
  );
  
  completionRate = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });
  
  hasError = computed(() => this.error() !== null);
  
  errorMessage = computed(() => this.error());
  
  // 生命週期
  ngOnInit(): void {
    this.loadTasks();
  }
  
  async loadTasks(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const tasks = await this.taskService.getTasks();
      this.tasks.set(tasks);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }
  
  updateTask(updatedTask: Task): void {
    this.tasks.update(tasks => 
      tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  }
}
```

### 模式 2: Service 共享狀態

適用於需要跨元件共享的狀態。

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { TaskRepository } from '@core/data-access/task.repository';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private taskRepository = inject(TaskRepository);
  
  // ✅ Private writable signals
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // ✅ Public readonly signals
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  // ✅ Computed signals
  totalTasks = computed(() => this._tasks().length);
  
  completedTasks = computed(() => 
    this._tasks().filter(t => t.status === 'completed')
  );
  
  pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );
  
  inProgressTasks = computed(() =>
    this._tasks().filter(t => t.status === 'in-progress')
  );
  
  // ✅ Actions
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const tasks = await this.taskRepository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this._loading.set(false);
    }
  }
  
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const created = await this.taskRepository.create(task);
      this._tasks.update(tasks => [...tasks, created]);
      return created;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
  
  async updateTask(id: string, task: Partial<Task>): Promise<void> {
    try {
      await this.taskRepository.update(id, task);
      this._tasks.update(tasks => 
        tasks.map(t => t.id === id ? { ...t, ...task } : t)
      );
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
  
  async deleteTask(id: string): Promise<void> {
    try {
      await this.taskRepository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
  
  // ✅ 清除狀態
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

### 模式 3: Signals with RxJS

當需要整合 RxJS Observables 時。

```typescript
import { Component, signal, effect, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TaskRealtimeRepository } from '@core/data-access/task-realtime.repository';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-task-realtime',
  standalone: true,
  template: `
    @if (realtimeTasks(); as tasks) {
      @for (task of tasks; track task.id) {
        <app-task-item [task]="task" />
      }
    }
  `
})
export class TaskRealtimeComponent {
  private realtimeRepo = inject(TaskRealtimeRepository);
  
  // ✅ Signal 輸入
  blueprintId = signal('blueprint-1');
  
  // ✅ 轉換 Signal 為 Observable
  blueprintId$ = toObservable(this.blueprintId);
  
  // ✅ Observable 處理
  private tasks$ = this.blueprintId$.pipe(
    switchMap(blueprintId => this.realtimeRepo.watchByBlueprintId(blueprintId))
  );
  
  // ✅ 轉換 Observable 為 Signal
  realtimeTasks = toSignal(this.tasks$, { initialValue: [] });
  
  // ✅ Effect 追蹤變化
  constructor() {
    effect(() => {
      console.log('Realtime tasks updated:', this.realtimeTasks().length);
    });
  }
}
```

### 模式 4: 複雜狀態管理 (Facade Pattern)

適用於需要協調多個 Repository 和複雜業務邏輯。

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { TaskRepository } from '@core/data-access/task.repository';
import { BlueprintRepository } from '@core/data-access/blueprint.repository';
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';

interface TaskListState {
  tasks: Task[];
  blueprint: Blueprint | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskFacade {
  private taskRepository = inject(TaskRepository);
  private blueprintRepository = inject(BlueprintRepository);
  private eventBus = inject(BlueprintEventBus);
  
  // ✅ 集中狀態管理
  private state = signal<TaskListState>({
    tasks: [],
    blueprint: null,
    loading: false,
    error: null
  });
  
  // ✅ 選擇器 (Selectors)
  tasks = computed(() => this.state().tasks);
  blueprint = computed(() => this.state().blueprint);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  
  // ✅ 衍生狀態
  tasksByStatus = computed(() => {
    const tasks = this.state().tasks;
    return {
      pending: tasks.filter(t => t.status === 'pending'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };
  });
  
  statistics = computed(() => {
    const tasks = this.state().tasks;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return {
      total,
      completed,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });
  
  // ✅ Actions
  async initialize(blueprintId: string): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      const [tasks, blueprint] = await Promise.all([
        this.taskRepository.findByBlueprintId(blueprintId),
        this.blueprintRepository.findById(blueprintId)
      ]);
      
      this.updateState({ tasks, blueprint, loading: false });
    } catch (err) {
      this.updateState({ 
        loading: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  }
  
  async createTask(blueprintId: string, task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const created = await this.taskRepository.create(task);
      
      this.updateState({
        tasks: [...this.state().tasks, created]
      });
      
      this.eventBus.publish({
        type: 'task.created',
        blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: created
      });
      
      return created;
    } catch (err) {
      this.updateState({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
      throw err;
    }
  }
  
  // ✅ 輔助方法: 部分狀態更新
  private updateState(partial: Partial<TaskListState>): void {
    this.state.update(state => ({ ...state, ...partial }));
  }
  
  // ✅ 清除狀態
  reset(): void {
    this.state.set({
      tasks: [],
      blueprint: null,
      loading: false,
      error: null
    });
  }
}
```

## ✅ Signals 檢查清單

### 設計檢查 (MUST) 🔴

- [ ] 使用 `signal()` 創建可變狀態
- [ ] 使用 `computed()` 創建衍生狀態
- [ ] Private signals 使用 `asReadonly()` 暴露
- [ ] 避免在 signal 中存儲過於複雜的物件
- [ ] Computed signals 不包含副作用

### 效能檢查 (SHOULD) ⚠️

- [ ] 使用 `computed()` 快取計算結果
- [ ] 避免不必要的 signal 創建
- [ ] 大型陣列使用 `trackBy`
- [ ] 考慮使用 OnPush 變更檢測

### 可讀性檢查 (SHOULD) ⚠️

- [ ] Signal 命名清晰
- [ ] Computed signals 反映其用途
- [ ] 適當使用註解說明複雜邏輯

## 🚫 常見錯誤模式

### ❌ 錯誤: 直接修改 Signal 內部值

```typescript
// ❌ 錯誤: 直接修改陣列
const tasks = signal<Task[]>([]);
tasks().push(newTask);  // ❌ 不會觸發更新
```

### ✅ 正確: 使用 update 方法

```typescript
// ✅ 正確: 使用 update 創建新陣列
const tasks = signal<Task[]>([]);
tasks.update(current => [...current, newTask]);  // ✅ 觸發更新
```

### ❌ 錯誤: Computed Signal 包含副作用

```typescript
// ❌ 錯誤: Computed 中包含副作用
const userName = computed(() => {
  const user = this.user();
  console.log('User changed:', user);  // ❌ 副作用
  return user?.name || 'Guest';
});
```

### ✅ 正確: 使用 Effect 處理副作用

```typescript
// ✅ 正確: 使用 effect 處理副作用
const userName = computed(() => {
  const user = this.user();
  return user?.name || 'Guest';
});

constructor() {
  effect(() => {
    console.log('User changed:', this.user());  // ✅ 副作用在 effect
  });
}
```

## 📚 參考資料

- Angular Signals Guide: https://angular.dev/guide/signals
- Angular Reactivity: https://angular.dev/guide/signals/rxjs-interop
- Performance Tips: https://angular.dev/best-practices/runtime-performance

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
