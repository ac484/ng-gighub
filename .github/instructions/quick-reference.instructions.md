---
description: 'Quick reference cheat sheet for common GigHub patterns'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# GigHub 快速參考指南 ⚡

> 常用模式速查表 - 快速查找最佳實踐和禁止模式

## 🎯 Angular 20 現代語法

### 元件定義
```typescript
// ✅ 正確: Standalone Component with Signals
import { Component, signal, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" (taskChange)="updateTask($event)" />
      }
    }
  `
})
export class TaskListComponent {
  // Signal 狀態
  private taskService = inject(TaskService);
  loading = signal(false);
  tasks = signal<Task[]>([]);
  
  // Computed signal
  completedCount = computed(() => 
    this.tasks().filter(t => t.status === 'completed').length
  );
}
```

### Input/Output (Angular 19+)
```typescript
// ✅ 正確: 使用 input/output 函數
task = input.required<Task>();           // 必填 input
readonly = input(false);                 // 選填 input with default
taskChange = output<Task>();             // output 事件
value = model(0);                        // 雙向綁定

// ❌ 禁止: 使用裝飾器
@Input() task!: Task;
@Output() taskChange = new EventEmitter<Task>();
```

### 依賴注入
```typescript
// ✅ 正確: 使用 inject()
private taskService = inject(TaskService);
private router = inject(Router);
private destroyRef = inject(DestroyRef);

// ❌ 禁止: constructor 注入
constructor(private taskService: TaskService) {}
```

### 新控制流語法
```html
<!-- ✅ 正確: 使用新語法 -->
@if (isAdmin()) {
  <app-admin-panel />
} @else {
  <app-user-panel />
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>沒有資料</p>
}

@switch (status()) {
  @case ('pending') { <nz-badge nzStatus="processing" /> }
  @case ('completed') { <nz-badge nzStatus="success" /> }
  @default { <nz-badge nzStatus="default" /> }
}

<!-- ❌ 禁止: 舊語法 -->
<div *ngIf="isAdmin">...</div>
<div *ngFor="let item of items; trackBy: trackByFn">...</div>
```

## 🎨 ng-alain 常用元件

### ST 表格 (Simple Table)
```typescript
import { STColumn, STData } from '@delon/abc/st';

columns: STColumn[] = [
  { title: 'ID', index: 'id', width: 80 },
  { title: '名稱', index: 'name' },
  { 
    title: '狀態', 
    index: 'status', 
    type: 'badge',
    badge: {
      pending: { text: '待處理', color: 'processing' },
      completed: { text: '已完成', color: 'success' }
    }
  },
  {
    title: '操作',
    buttons: [
      { text: '編輯', click: (record: any) => this.edit(record) },
      { text: '刪除', click: (record: any) => this.delete(record), pop: true }
    ]
  }
];

// Template
<st [data]="tasks()" [columns]="columns" [loading]="loading()" />
```

### 動態表單 (SF)
```typescript
import { SFSchema } from '@delon/form';

schema: SFSchema = {
  properties: {
    name: { 
      type: 'string', 
      title: '任務名稱',
      maxLength: 100 
    },
    description: { 
      type: 'string', 
      title: '描述',
      ui: { widget: 'textarea', rows: 4 }
    },
    assignee: {
      type: 'string',
      title: '負責人',
      enum: this.users,
      ui: { widget: 'select' }
    },
    dueDate: {
      type: 'string',
      title: '截止日期',
      format: 'date',
      ui: { widget: 'date' }
    }
  },
  required: ['name', 'assignee']
};

// Template
<sf [schema]="schema" (formSubmit)="submit($event)" />
```

### 權限控制 (ACL)
```typescript
import { ACLService } from '@delon/acl';

private aclService = inject(ACLService);

// 檢查權限
canEdit(): boolean {
  return this.aclService.can('task:edit');
}

// Template
<button 
  *aclIf="'task:delete'" 
  nz-button 
  nzDanger
  (click)="delete()"
>
  刪除
</button>
```

## 🔥 Firebase/Firestore 資料存取

### Repository Pattern
```typescript
// core/data-access/repositories/task-firestore.repository.ts
import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore);
  private tasksCollection = collection(this.firestore, 'tasks');
  
  findAll(): Observable<Task[]> {
    const q = query(this.tasksCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }
  
  findById(id: string): Observable<Task | undefined> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    return docData(taskDoc, { idField: 'id' }) as Observable<Task | undefined>;
  }
  
  async create(task: Omit<Task, 'id'>): Promise<string> {
    const docRef = await addDoc(this.tasksCollection, {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }
  
  async update(id: string, task: Partial<Task>): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await updateDoc(taskDoc, {
      ...task,
      updatedAt: new Date()
    });
  }
  
  async delete(id: string): Promise<void> {
    const taskDoc = doc(this.firestore, 'tasks', id);
    await deleteDoc(taskDoc);
  }
}
```

### Store Pattern with Signals
```typescript
// core/facades/task.store.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { TaskRepository } from '@core/infra/task.repository';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TaskRepository);
  
  // Private state
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public readonly state
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  // Computed
  completedTasks = computed(() => 
    this._tasks().filter(t => t.status === 'completed')
  );
  
  pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );
  
  // Actions
  loadTasks(): void {
    this._loading.set(true);
    this._error.set(null);
    
    this.repository.findAll().subscribe({
      next: (tasks) => {
        this._tasks.set(tasks);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err instanceof Error ? err.message : 'Unknown error');
        this._loading.set(false);
      }
    });
  }
  
  async createTask(task: Omit<Task, 'id'>): Promise<void> {
    try {
      const id = await this.repository.create(task);
      // Task will be automatically updated via Firestore observable
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
}
```

### Firestore Snapshot Listeners
```typescript
import { DestroyRef, inject } from '@angular/core';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private firestore = inject(Firestore);
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.subscribeToTasks();
}

private subscribeToTasks(): void {
  const tasksCol = collection(this.firestore, 'tasks');
  
  // Using onSnapshot for real-time updates
  const unsubscribe = onSnapshot(tasksCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New task: ', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified task: ', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed task: ', change.doc.data());
      }
    });
  });
  
  // Auto cleanup
  this.destroyRef.onDestroy(() => {
    this.channel?.unsubscribe();
  });
}
```

## 🚫 禁止模式速查

### Angular 反模式
```typescript
// ❌ 禁止: any 類型
function process(data: any): any { ... }

// ✅ 正確: 明確類型
function process(data: TaskDto): Task { ... }

// ❌ 禁止: 直接修改 Signal 內部值
this._tasks().push(newTask);

// ✅ 正確: 使用 update 方法
this._tasks.update(tasks => [...tasks, newTask]);

// ❌ 禁止: 未清理 Subscription
ngOnInit() {
  this.data$.subscribe(data => { ... });
}

// ✅ 正確: 使用 takeUntilDestroyed
private destroyRef = inject(DestroyRef);
ngOnInit() {
  this.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => { ... });
}
```

### 架構反模式
```typescript
// ❌ 禁止: 元件直接呼叫 Firestore
@Component({ ... })
export class TaskComponent {
  private firestore = inject(Firestore);
  
  loadTasks() {
    const tasksCol = collection(this.firestore, 'tasks');
    collectionData(tasksCol).subscribe(data => { ... });
  }
}

// ✅ 正確: 透過 Store/Facade
@Component({ ... })
export class TaskComponent {
  private taskStore = inject(TaskStore);
  
  tasks = this.taskStore.tasks;
  
  ngOnInit() {
    this.taskStore.loadTasks();
  }
}
```

### 安全反模式
```typescript
// ❌ 禁止: 在日誌中輸出敏感資料
console.log('User token:', token);

// ✅ 正確: 只記錄必要資訊
console.log('User authenticated:', userId);

// ❌ 禁止: 直接使用 innerHTML
element.innerHTML = userInput;

// ✅ 正確: 使用 Angular 安全機制
@Component({ 
  template: `<div [innerHTML]="sanitizedContent"></div>` 
})
```

## 📚 更多資訊

詳細說明請參考:
- **Angular 現代特性**: `.github/instructions/angular-modern-features.instructions.md`
- **企業架構模式**: `.github/instructions/enterprise-angular-architecture.instructions.md`
- **ng-alain 框架**: `.github/instructions/ng-alain-delon.instructions.md`
- **ng-zorro-antd 元件**: `.github/instructions/ng-zorro-antd.instructions.md`
- **TypeScript 標準**: `.github/instructions/typescript-5-es2022.instructions.md`
- **約束規則**: `.github/copilot/constraints.md`

---

**版本**: 2025-12-16  
**適用於**: Angular 20.3.x, ng-alain 20.1.x, Firebase 20.0.1
