---
description: 'Quick reference cheat sheet for common GigHub patterns'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# GigHub Quick Reference Guide ⚡

> Common patterns cheat sheet - Quick lookup for best practices and anti-patterns

## 🎯 Angular 20 Modern Syntax

### Component Definition
```typescript
// ✅ Correct: Standalone Component with Signals
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
  // Signal state
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
// ✅ Correct: Use input/output functions
task = input.required<Task>();           // Required input
readonly = input(false);                 // Optional input with default
taskChange = output<Task>();             // Output event
value = model(0);                        // Two-way binding

// ❌ Forbidden: Use decorators
@Input() task!: Task;
@Output() taskChange = new EventEmitter<Task>();
```

### Dependency Injection
```typescript
// ✅ Correct: Use inject()
private taskService = inject(TaskService);
private router = inject(Router);
private destroyRef = inject(DestroyRef);

// ❌ Forbidden: constructor injection
constructor(private taskService: TaskService) {}
```

### New Control Flow Syntax
```html
<!-- ✅ Correct: Use new syntax -->
@if (isAdmin()) {
  <app-admin-panel />
} @else {
  <app-user-panel />
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No data</p>
}

@switch (status()) {
  @case ('pending') { <nz-badge nzStatus="processing" /> }
  @case ('completed') { <nz-badge nzStatus="success" /> }
  @default { <nz-badge nzStatus="default" /> }
}

<!-- ❌ Forbidden: Old syntax -->
<div *ngIf="isAdmin">...</div>
<div *ngFor="let item of items; trackBy: trackByFn">...</div>
```

## 🎨 ng-alain Common Components

### ST Table (Simple Table)
```typescript
import { STColumn } from '@delon/abc/st';

columns: STColumn[] = [
  { title: 'ID', index: 'id', width: 80 },
  { title: 'Name', index: 'name' },
  { 
    title: 'Status', 
    index: 'status', 
    type: 'badge',
    badge: {
      pending: { text: 'Pending', color: 'processing' },
      completed: { text: 'Completed', color: 'success' }
    }
  },
  {
    title: 'Actions',
    buttons: [
      { text: 'Edit', click: (record: any) => this.edit(record) },
      { text: 'Delete', click: (record: any) => this.delete(record), pop: true }
    ]
  }
];

<st [data]="tasks()" [columns]="columns" [loading]="loading()" />
```

### Dynamic Form (SF)
```typescript
import { SFSchema } from '@delon/form';

schema: SFSchema = {
  properties: {
    name: { type: 'string', title: 'Task Name', maxLength: 100 },
    description: { type: 'string', title: 'Description', ui: { widget: 'textarea', rows: 4 } },
    assignee: { type: 'string', title: 'Assignee', enum: this.users, ui: { widget: 'select' } },
    dueDate: { type: 'string', title: 'Due Date', format: 'date', ui: { widget: 'date' } }
  },
  required: ['name', 'assignee']
};

<sf [schema]="schema" (formSubmit)="submit($event)" />
```

### Access Control (ACL)
```typescript
import { ACLService } from '@delon/acl';

private aclService = inject(ACLService);

canEdit(): boolean {
  return this.aclService.can('task:edit');
}

<button *aclIf="'task:delete'" nz-button nzDanger (click)="delete()">Delete</button>
```

## 🔥 Firebase/Firestore Data Access

### Repository Pattern
```typescript
import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore);
  private tasksCollection = collection(this.firestore, 'tasks');
  
  findAll(): Observable<Task[]> {
    const q = query(this.tasksCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }
  
  async create(task: Omit<Task, 'id'>): Promise<string> {
    const docRef = await addDoc(this.tasksCollection, {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }
}
```

### Store Pattern with Signals
```typescript
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TaskRepository);
  
  // Private state
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  
  // Public readonly
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  
  // Computed
  completedTasks = computed(() => 
    this._tasks().filter(t => t.status === 'completed')
  );
  
  loadTasks(): void {
    this._loading.set(true);
    this.repository.findAll().subscribe({
      next: (tasks) => {
        this._tasks.set(tasks);
        this._loading.set(false);
      }
    });
  }
}
```

## 🚫 Anti-Patterns Quick Reference

### Angular Anti-Patterns
| ❌ Forbidden | ✅ Correct |
|--------------|-----------|
| `any` type | Explicit types |
| Direct signal mutation | Use `update()` method |
| Manual subscriptions | `takeUntilDestroyed()` |
| Constructor business logic | `ngOnInit()` |
| NgModule | Standalone Components |
| `@Input/@Output` decorators | `input()/output()` functions |

### Architecture Anti-Patterns
| ❌ Forbidden | ✅ Correct |
|--------------|-----------|
| Component calls Firestore | Component → Service → Repository |
| Service contains UI logic | Separate concerns |
| Repository has business logic | Keep data access only |
| Direct Firestore operations | Use Repository Pattern |

### Security Anti-Patterns
| ❌ Forbidden | ✅ Correct |
|--------------|-----------|
| Log sensitive data | Log IDs only |
| Direct innerHTML | Angular sanitization |
| Hardcoded credentials | Environment variables |
| Client-only auth checks | Security Rules + client |

## 📚 References

| Topic | File |
|-------|------|
| Angular 20 Guide | `.github/instructions/angular.instructions.md` |
| Angular Modern Features | See Angular guide |
| Architecture | `.github/instructions/ng-gighub-architecture.instructions.md` |
| ng-alain | `.github/instructions/ng-alain-delon.instructions.md` |
| TypeScript | `.github/instructions/typescript-5-es2022.instructions.md` |
| Constraints | `.github/copilot/constraints.md` |

---

**Version**: 2025-12-18  
**Compatible**: Angular 20.3.x, ng-alain 20.1.x, Firebase 20.0.1
