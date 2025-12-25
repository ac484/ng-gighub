# 🧠 AI Behavior Guidelines
# GitHub × Firebase Omniscient Architecture Reference

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-25  
> **Status**: Active (Omniscient Mode)  
> **Purpose**: Comprehensive rules, constraints, and workflows for GigHub AI development

---

## 📖 Table of Contents

1. [Omniscient Architecture Overview](#omniscient-architecture-overview)
2. [Three-Layer Architecture Rules](#three-layer-architecture-rules)
3. [Repository Pattern Implementation](#repository-pattern-implementation)
4. [Angular 20 Modern Patterns](#angular-20-modern-patterns)
5. [Firebase Integration Guidelines](#firebase-integration-guidelines)
6. [Firestore Security Rules](#firestore-security-rules)
7. [State Management with Signals](#state-management-with-signals)
8. [Multi-Tenancy: Blueprint System](#multi-tenancy-blueprint-system)
9. [Error Handling and Validation](#error-handling-and-validation)
10. [Testing Strategy](#testing-strategy)
11. [Performance Optimization](#performance-optimization)
12. [Security Best Practices](#security-best-practices)
13. [Code Generation Workflows](#code-generation-workflows)
14. [Common Patterns Library](#common-patterns-library)
15. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## 🏛️ Omniscient Architecture Overview

### What "Omniscient" Means
The AI has **complete architectural awareness** of the GigHub system:
- All layers and their responsibilities
- All data flows and dependencies
- All security boundaries and rules
- All patterns and anti-patterns
- All Firebase integration points

This document is the **single source of truth** for AI behavior in this project.

### System Layers (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│              (src/app/routes/*/*)                       │
│                                                          │
│  Responsibilities:                                       │
│  - Display data to users (templates)                    │
│  - Handle user interactions (events)                    │
│  - Manage local UI state (Signals)                      │
│  - Inject Services (NOT Repositories)                   │
│                                                          │
│  Forbidden:                                              │
│  - ❌ Direct Firestore access                           │
│  - ❌ Business logic                                    │
│  - ❌ Repository injection                              │
└─────────────────────────────────────────────────────────┘
                           ↓ inject(Service)
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LAYER                        │
│           (src/app/core/*/services/*)                   │
│                                                          │
│  Responsibilities:                                       │
│  - Orchestrate business logic                           │
│  - Coordinate multiple repositories                     │
│  - Validate business rules                              │
│  - Publish/subscribe to events                          │
│  - Transform data for UI                                │
│                                                          │
│  Forbidden:                                              │
│  - ❌ Direct Firestore access                           │
│  - ❌ UI logic                                          │
└─────────────────────────────────────────────────────────┘
                           ↓ inject(Repository)
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
│        (src/app/core/*/repositories/*)                  │
│                                                          │
│  Responsibilities:                                       │
│  - Abstract Firestore operations                        │
│  - Execute queries                                      │
│  - Convert Firestore docs ↔ Domain models              │
│  - Handle data access errors                           │
│                                                          │
│  Allowed:                                                │
│  - ✅ Direct @angular/fire injection                    │
│  - ✅ Firestore queries                                 │
│                                                          │
│  Forbidden:                                              │
│  - ❌ Business logic                                    │
│  - ❌ UI concerns                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   FIREBASE/FIRESTORE                     │
│                  + SECURITY RULES                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Three-Layer Architecture Rules

### Layer 1: Presentation (UI Components)

**Location**: `src/app/routes/**/*.component.ts`

**Rules**:
1. ✅ **MUST** use Standalone Components
2. ✅ **MUST** inject Services (never Repositories)
3. ✅ **MUST** use Signals for state management
4. ✅ **MUST** use `inject()` for dependency injection
5. ✅ **MUST** use `takeUntilDestroyed()` for RxJS subscriptions
6. ✅ **MUST** use `ChangeDetectionStrategy.OnPush` for performance
7. ❌ **NEVER** access Firestore directly
8. ❌ **NEVER** contain business logic
9. ❌ **NEVER** use constructor injection

**Example**:
```typescript
import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '@core/services/task.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" (taskChange)="handleTaskChange($event)" />
      } @empty {
        <nz-empty nzNotFoundContent="沒有任務" />
      }
    }
  `
})
export class TaskListComponent {
  // ✅ Inject Service
  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);
  
  // ✅ Signals for state
  tasks = signal<Task[]>([]);
  loading = signal(false);
  
  // ✅ Computed signals
  completedTasks = computed(() => 
    this.tasks().filter(t => t.status === 'completed')
  );
  
  ngOnInit(): void {
    this.loadTasks();
  }
  
  private loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load tasks:', error);
          this.loading.set(false);
        }
      });
  }
  
  handleTaskChange(task: Task): void {
    // Delegate to service
    this.taskService.updateTask(task.id, task)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
```

### Layer 2: Business (Services)

**Location**: `src/app/core/*/services/*.service.ts`

**Rules**:
1. ✅ **MUST** use `@Injectable({ providedIn: 'root' })`
2. ✅ **MUST** inject Repositories (never Firestore directly)
3. ✅ **MUST** implement business logic and validation
4. ✅ **MUST** coordinate multiple repositories when needed
5. ✅ **MUST** publish events via EventBus
6. ✅ **MUST** handle errors and transform to domain errors
7. ❌ **NEVER** access Firestore directly
8. ❌ **NEVER** contain UI logic

**Example**:
```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TaskRepository } from '@core/repositories/task.repository';
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';
import { Task, CreateTaskRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // ✅ Inject repositories
  private taskRepository = inject(TaskRepository);
  private eventBus = inject(BlueprintEventBus);
  
  getTasks(): Observable<Task[]> {
    return from(this.taskRepository.findAll()).pipe(
      catchError(error => {
        console.error('TaskService: Failed to get tasks', error);
        return throwError(() => new Error('Failed to load tasks'));
      })
    );
  }
  
  async createTask(request: CreateTaskRequest): Promise<Task> {
    // ✅ Business logic validation
    this.validateTaskRequest(request);
    
    try {
      // ✅ Delegate to repository
      const task = await this.taskRepository.create(request);
      
      // ✅ Publish event
      this.eventBus.publish({
        type: 'task.created',
        blueprintId: request.blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: task
      });
      
      return task;
    } catch (error) {
      console.error('TaskService: Failed to create task', error);
      throw new Error('Failed to create task');
    }
  }
  
  private validateTaskRequest(request: CreateTaskRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('Task title is required');
    }
    
    if (request.title.length > 200) {
      throw new Error('Task title must not exceed 200 characters');
    }
  }
}
```

### Layer 3: Data (Repositories)

**Location**: `src/app/core/*/repositories/*.repository.ts`

**Rules**:
1. ✅ **MUST** use `@Injectable({ providedIn: 'root' })`
2. ✅ **MUST** inject Firestore directly via `inject(Firestore)`
3. ✅ **MUST** implement CRUD operations
4. ✅ **MUST** convert between Firestore docs and domain models
5. ✅ **MUST** handle Firestore-specific errors
6. ✅ **CAN** use helper functions for query building
7. ❌ **NEVER** contain business logic
8. ❌ **NEVER** contain UI concerns

**Example**:
```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from '@angular/fire/firestore';
import { Task, CreateTaskRequest } from '@core/models';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  // ✅ Direct Firestore injection (ONLY in Repository)
  private firestore = inject(Firestore);
  private collectionName = 'tasks';
  
  async findAll(): Promise<Task[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('deleted_at', '==', null)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }
  
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('blueprint_id', '==', blueprintId),
      where('deleted_at', '==', null)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }
  
  async create(request: CreateTaskRequest): Promise<Task> {
    const now = Timestamp.now();
    const docData = {
      blueprint_id: request.blueprintId,
      title: request.title,
      description: request.description || '',
      status: 'pending',
      created_at: now,
      updated_at: now,
      deleted_at: null
    };
    
    const docRef = await addDoc(
      collection(this.firestore, this.collectionName), 
      docData
    );
    
    return this.toEntity(docData, docRef.id);
  }
  
  async update(id: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const updateData = this.toDocument(updates);
    updateData.updated_at = Timestamp.now();
    
    await updateDoc(docRef, updateData);
  }
  
  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    // Soft delete
    await updateDoc(docRef, {
      deleted_at: Timestamp.now()
    });
  }
  
  // ✅ Convert Firestore doc to domain model
  private toEntity(data: any, id: string): Task {
    return {
      id,
      blueprintId: data.blueprint_id,
      title: data.title,
      description: data.description,
      status: data.status,
      createdAt: data.created_at?.toDate(),
      updatedAt: data.updated_at?.toDate(),
      deletedAt: data.deleted_at?.toDate() || null
    };
  }
  
  // ✅ Convert domain model to Firestore doc
  private toDocument(task: Partial<Task>): any {
    const doc: any = {};
    if (task.title) doc.title = task.title;
    if (task.description !== undefined) doc.description = task.description;
    if (task.status) doc.status = task.status;
    return doc;
  }
}
```

---

## 📦 Repository Pattern Implementation

### Core Principles

1. **Single Responsibility**: One repository per aggregate root
2. **Abstraction**: Hide Firestore implementation details
3. **Domain Models**: Always work with typed domain models, never raw Firestore data
4. **Error Translation**: Convert Firestore errors to domain errors

### Repository Structure

```typescript
@Injectable({ providedIn: 'root' })
export class [Entity]Repository {
  private firestore = inject(Firestore);
  private collectionName = '[collection_name]';
  
  // CRUD operations
  async findAll(): Promise<Entity[]> { }
  async findById(id: string): Promise<Entity | null> { }
  async create(request: CreateRequest): Promise<Entity> { }
  async update(id: string, updates: Partial<Entity>): Promise<void> { }
  async delete(id: string): Promise<void> { }
  
  // Domain-specific queries
  async findBy[Criteria](criteria: string): Promise<Entity[]> { }
  
  // Conversion methods
  private toEntity(data: any, id: string): Entity { }
  private toDocument(entity: Partial<Entity>): any { }
}
```

### When to Create a Repository

**Create a Repository when**:
- ✅ You need to access a Firestore collection
- ✅ The entity is an aggregate root in your domain
- ✅ Multiple services need to access the same data

**Don't create a Repository for**:
- ❌ One-off queries (use the service directly with repository methods)
- ❌ View-specific data (compose in service layer)
- ❌ Calculated/derived data (compute in service layer)

---

## 🅰️ Angular 20 Modern Patterns

### Standalone Components (MANDATORY)

```typescript
// ✅ CORRECT: Standalone component
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS, NzTableModule, NzButtonModule],
  template: `...`
})
export class TaskListComponent { }

// ❌ FORBIDDEN: NgModule-based
@NgModule({
  declarations: [TaskListComponent],
  imports: [CommonModule]
})
export class TaskModule { }
```

### Dependency Injection with inject()

```typescript
// ✅ CORRECT: Use inject()
export class TaskListComponent {
  private taskService = inject(TaskService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
}

// ❌ FORBIDDEN: Constructor injection
export class TaskListComponent {
  constructor(
    private taskService: TaskService,
    private router: Router
  ) { }
}
```

### Inputs and Outputs

```typescript
// ✅ CORRECT: Use input() and output() functions
export class TaskItemComponent {
  task = input.required<Task>();
  readonly = input(false);
  taskChange = output<Task>();
  
  handleClick(): void {
    if (!this.readonly()) {
      this.taskChange.emit(this.task());
    }
  }
}

// ❌ FORBIDDEN: Use decorators
export class TaskItemComponent {
  @Input() task!: Task;
  @Input() readonly = false;
  @Output() taskChange = new EventEmitter<Task>();
}
```

### Control Flow Syntax

```typescript
// ✅ CORRECT: New control flow
template: `
  @if (loading()) {
    <nz-spin />
  } @else if (error()) {
    <nz-alert nzType="error" [nzMessage]="error()" />
  } @else {
    @for (task of tasks(); track task.id) {
      <app-task-item [task]="task" />
    } @empty {
      <nz-empty />
    }
  }
  
  @switch (status()) {
    @case ('pending') { <nz-tag nzColor="blue">待處理</nz-tag> }
    @case ('completed') { <nz-tag nzColor="green">已完成</nz-tag> }
    @default { <nz-tag>未知</nz-tag> }
  }
`

// ❌ FORBIDDEN: Old structural directives
template: `
  <nz-spin *ngIf="loading"></nz-spin>
  <div *ngIf="!loading">
    <app-task-item 
      *ngFor="let task of tasks; trackBy: trackByFn"
      [task]="task"
    />
  </div>
`
```

---

## 🔥 Firebase Integration Guidelines

### Direct @angular/fire Injection (Repository Only)

```typescript
// ✅ CORRECT: Direct injection in Repository
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);
}

// ❌ FORBIDDEN: Wrapper service
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private firestore = inject(Firestore);
  
  collection(path: string) {
    return collection(this.firestore, path);
  }
}
```

### Firestore Query Patterns

```typescript
// ✅ Basic query with filters
const q = query(
  collection(this.firestore, 'tasks'),
  where('blueprint_id', '==', blueprintId),
  where('status', '==', 'pending'),
  where('deleted_at', '==', null),
  orderBy('created_at', 'desc'),
  limit(20)
);

// ✅ Compound query (requires index)
const q = query(
  collection(this.firestore, 'tasks'),
  where('blueprint_id', '==', blueprintId),
  where('assignee_id', '==', userId),
  where('status', 'in', ['pending', 'in-progress']),
  orderBy('priority', 'desc'),
  orderBy('created_at', 'desc')
);
// NOTE: This requires a composite index defined in firestore.indexes.json

// ✅ Realtime subscription
const unsubscribe = onSnapshot(
  query(collection(this.firestore, 'tasks')),
  (snapshot) => {
    const tasks = snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
    this.tasksSubject.next(tasks);
  },
  (error) => {
    console.error('Realtime subscription error:', error);
  }
);
```

### Batch Operations

```typescript
// ✅ Batch write for multiple operations
async batchUpdateTasks(updates: Array<{ id: string; data: Partial<Task> }>): Promise<void> {
  const batch = writeBatch(this.firestore);
  
  updates.forEach(({ id, data }) => {
    const docRef = doc(this.firestore, this.collectionName, id);
    batch.update(docRef, this.toDocument(data));
  });
  
  await batch.commit();
}

// ✅ Transaction for atomic operations
async transferTask(taskId: string, fromUser: string, toUser: string): Promise<void> {
  await runTransaction(this.firestore, async (transaction) => {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const taskSnap = await transaction.get(taskRef);
    
    if (!taskSnap.exists()) {
      throw new Error('Task not found');
    }
    
    if (taskSnap.data().assignee_id !== fromUser) {
      throw new Error('Task not assigned to current user');
    }
    
    transaction.update(taskRef, {
      assignee_id: toUser,
      updated_at: Timestamp.now()
    });
  });
}
```

### AI Integration (Functions Only)

```typescript
// ✅ CORRECT: Call via Cloud Function
async analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  const functions = inject(Functions);
  const analyzeImageFn = httpsCallable<
    { imageUrl: string },
    AnalysisResult
  >(functions, 'ai-analyzeImage');
  
  const result = await analyzeImageFn({ imageUrl });
  return result.data;
}

// ❌ FORBIDDEN: Direct Vertex AI call from frontend
async analyzeImage(imageUrl: string): Promise<AnalysisResult> {
  const vertexAI = inject(VertexAI);
  const model = getGenerativeModel(vertexAI, { model: 'gemini-pro-vision' });
  // ❌ NEVER do this
}
```

---

## 🔒 Firestore Security Rules

### Rule Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    // Collection rules
    match /tasks/{taskId} {
      allow read: if isAuthenticated() 
                  && isBlueprintMember(resource.data.blueprint_id);
      
      allow create: if isAuthenticated() 
                    && isBlueprintMember(request.resource.data.blueprint_id)
                    && hasPermission(request.resource.data.blueprint_id, 'task:create');
      
      allow update: if isAuthenticated() 
                    && isBlueprintMember(resource.data.blueprint_id)
                    && (hasPermission(resource.data.blueprint_id, 'task:update')
                        || resource.data.assignee_id == getCurrentUserId());
      
      allow delete: if isAuthenticated() 
                    && isBlueprintMember(resource.data.blueprint_id)
                    && hasPermission(resource.data.blueprint_id, 'task:delete');
    }
  }
}
```

### Security Rule Principles

1. **Deny by Default**: All access denied unless explicitly allowed
2. **Multi-Tenant Isolation**: Use blueprintMembers for membership checks
3. **Permission-Based**: Check fine-grained permissions for operations
4. **Data Validation**: Validate data structure and values in rules
5. **No Client Trust**: Never trust client-side permission checks

---

## 📊 State Management with Signals

### Signal Patterns

```typescript
// ✅ Writable signals
const tasks = signal<Task[]>([]);
const loading = signal(false);
const error = signal<string | null>(null);

// ✅ Computed signals
const completedTasks = computed(() => 
  tasks().filter(t => t.status === 'completed')
);

const completionRate = computed(() => {
  const total = tasks().length;
  const completed = completedTasks().length;
  return total > 0 ? (completed / total) * 100 : 0;
});

// ✅ Effect for side effects
effect(() => {
  console.log('Tasks changed:', tasks().length);
  localStorage.setItem('lastTaskCount', tasks().length.toString());
});
```

### Signal Store Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TaskRepository);
  
  // Private writable signals
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public readonly signals
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  // Computed signals
  completedTasks = computed(() => 
    this._tasks().filter(t => t.status === 'completed')
  );
  
  // Actions
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const tasks = await this.repository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set('Failed to load tasks');
      console.error(error);
    } finally {
      this._loading.set(false);
    }
  }
  
  async createTask(request: CreateTaskRequest): Promise<void> {
    try {
      const task = await this.repository.create(request);
      this._tasks.update(tasks => [...tasks, task]);
    } catch (error) {
      this._error.set('Failed to create task');
      throw error;
    }
  }
}
```

---

## 🏢 Multi-Tenancy: Blueprint System

### Blueprint Ownership Model

```
User → Organization → Blueprint → Resources (Tasks, Files, etc.)
         ↓
       Team / Partner
```

### Key Concepts

1. **Blueprint = Permission Boundary**
   - Blueprint defines who can access what
   - Resources belong to blueprints
   - Access controlled via BlueprintMembers

2. **Owner Types**
   - `user`: Personal blueprints
   - `organization`: Team/enterprise blueprints

3. **Member Types**
   - `user`: Individual user
   - `team`: Organization sub-account
   - `partner`: External collaborator

4. **Permission Model**
```typescript
interface BlueprintMember {
  blueprintId: string;
  memberType: 'user' | 'team' | 'partner';
  memberId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: string[]; // e.g., ['task:create', 'task:update']
  status: 'active' | 'suspended' | 'revoked';
}
```

### Implementation Example

```typescript
// Check blueprint membership
async isMember(blueprintId: string, userId: string): Promise<boolean> {
  const memberId = `${userId}_${blueprintId}`;
  const memberRef = doc(this.firestore, 'blueprintMembers', memberId);
  const memberSnap = await getDoc(memberRef);
  
  return memberSnap.exists() && memberSnap.data().status === 'active';
}

// Check specific permission
async hasPermission(
  blueprintId: string, 
  userId: string, 
  permission: string
): Promise<boolean> {
  const memberId = `${userId}_${blueprintId}`;
  const memberRef = doc(this.firestore, 'blueprintMembers', memberId);
  const memberSnap = await getDoc(memberRef);
  
  if (!memberSnap.exists()) return false;
  
  const member = memberSnap.data() as BlueprintMember;
  return member.status === 'active' && member.permissions.includes(permission);
}
```

---

## ⚠️ Error Handling and Validation

### Domain Error Types

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', { resource, id });
    this.name = 'NotFoundError';
  }
}
```

### Error Handling Pattern

```typescript
// ✅ Service layer
async createTask(request: CreateTaskRequest): Promise<Task> {
  try {
    // Validation
    if (!request.title) {
      throw new ValidationError('Title is required');
    }
    
    // Authorization check
    const hasPermission = await this.permissionService.check(
      request.blueprintId, 
      'task:create'
    );
    
    if (!hasPermission) {
      throw new AuthorizationError('You do not have permission to create tasks');
    }
    
    // Business logic
    const task = await this.repository.create(request);
    
    // Event publishing
    this.eventBus.publish({
      type: 'task.created',
      data: task
    });
    
    return task;
  } catch (error) {
    // Log error
    console.error('TaskService: Failed to create task', error);
    
    // Re-throw domain errors
    if (error instanceof DomainError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new DomainError(
      'Failed to create task',
      'TASK_CREATE_FAILED',
      { originalError: error }
    );
  }
}

// ✅ Component error handling
async handleCreateTask(request: CreateTaskRequest): Promise<void> {
  try {
    await this.taskService.createTask(request);
    this.message.success('任務建立成功');
  } catch (error) {
    if (error instanceof ValidationError) {
      this.message.error(`驗證失敗: ${error.message}`);
    } else if (error instanceof AuthorizationError) {
      this.message.error('權限不足');
    } else {
      this.message.error('建立任務失敗');
    }
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Repositories)

```typescript
describe('TaskRepository', () => {
  let repository: TaskRepository;
  let firestore: Firestore;
  
  beforeEach(() => {
    // Use Firebase emulator for tests
    TestBed.configureTestingModule({
      providers: [
        TaskRepository,
        provideFirebaseApp(() => initializeApp(testConfig)),
        provideFirestore(() => getFirestore())
      ]
    });
    
    repository = TestBed.inject(TaskRepository);
    firestore = TestBed.inject(Firestore);
  });
  
  it('should create task', async () => {
    const request: CreateTaskRequest = {
      blueprintId: 'blueprint-1',
      title: 'Test Task',
      description: 'Test description'
    };
    
    const task = await repository.create(request);
    
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('pending');
  });
  
  it('should find tasks by blueprint', async () => {
    // Create test data
    await repository.create({
      blueprintId: 'blueprint-1',
      title: 'Task 1'
    });
    
    await repository.create({
      blueprintId: 'blueprint-2',
      title: 'Task 2'
    });
    
    // Query
    const tasks = await repository.findByBlueprintId('blueprint-1');
    
    expect(tasks.length).toBe(1);
    expect(tasks[0].blueprintId).toBe('blueprint-1');
  });
});
```

### Unit Tests (Services)

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let repository: jasmine.SpyObj<TaskRepository>;
  let eventBus: jasmine.SpyObj<BlueprintEventBus>;
  
  beforeEach(() => {
    const repositorySpy = jasmine.createSpyObj('TaskRepository', [
      'create', 'findAll', 'update', 'delete'
    ]);
    
    const eventBusSpy = jasmine.createSpyObj('BlueprintEventBus', ['publish']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: repositorySpy },
        { provide: BlueprintEventBus, useValue: eventBusSpy }
      ]
    });
    
    service = TestBed.inject(TaskService);
    repository = TestBed.inject(TaskRepository) as jasmine.SpyObj<TaskRepository>;
    eventBus = TestBed.inject(BlueprintEventBus) as jasmine.SpyObj<BlueprintEventBus>;
  });
  
  it('should create task and publish event', async () => {
    const request: CreateTaskRequest = {
      blueprintId: 'blueprint-1',
      title: 'Test Task'
    };
    
    const mockTask: Task = {
      id: 'task-1',
      ...request,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    repository.create.and.returnValue(Promise.resolve(mockTask));
    
    const task = await service.createTask(request);
    
    expect(repository.create).toHaveBeenCalledWith(request);
    expect(eventBus.publish).toHaveBeenCalled();
    expect(task).toEqual(mockTask);
  });
  
  it('should throw validation error for empty title', async () => {
    const request: CreateTaskRequest = {
      blueprintId: 'blueprint-1',
      title: ''
    };
    
    await expectAsync(service.createTask(request))
      .toBeRejectedWithError('Task title is required');
  });
});
```

### Integration Tests

```typescript
describe('Task Management Integration', () => {
  let component: TaskListComponent;
  let service: TaskService;
  let repository: TaskRepository;
  
  beforeEach(() => {
    // Use Firebase emulator
    TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        TaskService,
        TaskRepository,
        provideFirebaseApp(() => initializeApp(testConfig)),
        provideFirestore(() => getFirestore())
      ]
    });
    
    component = TestBed.createComponent(TaskListComponent).componentInstance;
    service = TestBed.inject(TaskService);
    repository = TestBed.inject(TaskRepository);
  });
  
  it('should load and display tasks', async () => {
    // Create test data
    await repository.create({
      blueprintId: 'blueprint-1',
      title: 'Task 1'
    });
    
    await repository.create({
      blueprintId: 'blueprint-1',
      title: 'Task 2'
    });
    
    // Load in component
    await component.loadTasks();
    
    expect(component.tasks().length).toBe(2);
    expect(component.loading()).toBe(false);
  });
});
```

---

## ⚡ Performance Optimization

### Firestore Query Optimization

```typescript
// ✅ Use indexes for compound queries
const q = query(
  collection(this.firestore, 'tasks'),
  where('blueprint_id', '==', blueprintId),
  where('status', '==', 'pending'),
  orderBy('priority', 'desc'),
  orderBy('created_at', 'desc')
);
// Requires index: blueprint_id + status + priority + created_at

// ✅ Paginate large result sets
async findTasks(blueprintId: string, pageSize: number = 20, startAfter?: DocumentSnapshot) {
  let q = query(
    collection(this.firestore, 'tasks'),
    where('blueprint_id', '==', blueprintId),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );
  
  if (startAfter) {
    q = query(q, startAfter(startAfter));
  }
  
  const snapshot = await getDocs(q);
  return {
    tasks: snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id)),
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
}

// ✅ Batch operations
async batchCreate(tasks: CreateTaskRequest[]): Promise<Task[]> {
  const batch = writeBatch(this.firestore);
  const refs: DocumentReference[] = [];
  
  tasks.forEach(task => {
    const ref = doc(collection(this.firestore, 'tasks'));
    batch.set(ref, this.toDocument(task));
    refs.push(ref);
  });
  
  await batch.commit();
  
  // Fetch created docs
  const snapshots = await Promise.all(refs.map(ref => getDoc(ref)));
  return snapshots.map(snap => this.toEntity(snap.data()!, snap.id));
}
```

### Angular Performance

```typescript
// ✅ OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent { }

// ✅ trackBy for ngFor (or @for with track)
template: `
  @for (task of tasks(); track task.id) {
    <app-task-item [task]="task" />
  }
`

// ✅ Lazy load routes
export const routes: Routes = [
  {
    path: 'tasks',
    loadComponent: () => import('./task-list.component').then(m => m.TaskListComponent)
  }
];

// ✅ Memoize expensive computations
const expensiveComputed = computed(() => {
  // Heavy computation
  return heavyCalculation(this.data());
});
```

---

## 🛡️ Security Best Practices

### Authentication

```typescript
// ✅ Check auth state
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(Auth);
  private router = inject(Router);
  
  async canActivate(): Promise<boolean> {
    const user = await firstValueFrom(authState(this.auth));
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }
    
    return true;
  }
}
```

### Authorization

```typescript
// ✅ Permission-based guards
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  private permissionService = inject(PermissionService);
  
  constructor(private requiredPermission: string) {}
  
  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const blueprintId = route.params['blueprintId'];
    
    const hasPermission = await this.permissionService.check(
      blueprintId,
      this.requiredPermission
    );
    
    if (!hasPermission) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized access attempt: ${this.requiredPermission}`);
      return false;
    }
    
    return true;
  }
}
```

### Input Sanitization

```typescript
// ✅ Sanitize user input
@Injectable({ providedIn: 'root' })
export class SanitizationService {
  sanitizeHtml(html: string): string {
    // Use DOMPurify or similar
    return DOMPurify.sanitize(html);
  }
  
  sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 1000); // Limit length
  }
}
```

---

## 🔄 Code Generation Workflows

### Workflow 1: New Feature (CRUD)

```
1. Define domain model (src/app/core/models/)
   ↓
2. Create repository (src/app/core/*/repositories/)
   - Implement CRUD
   - Add domain-specific queries
   - Write unit tests
   ↓
3. Create service (src/app/core/*/services/)
   - Implement business logic
   - Add validation
   - Integrate event bus
   - Write unit tests
   ↓
4. Create components (src/app/routes/*/)
   - List component
   - Detail component
   - Form component
   - Write component tests
   ↓
5. Add routes (src/app/routes/routes.ts)
   - Register paths
   - Add guards
   ↓
6. Update Firestore Security Rules (firestore.rules)
   - Add collection rules
   - Test with emulator
   ↓
7. Integration tests
   - End-to-end user flows
```

### Workflow 2: Modify Existing Feature

```
1. Understand current implementation
   - Read related files
   - Check dependencies
   - Review tests
   ↓
2. Plan minimal changes
   - List files to modify
   - Identify breaking changes
   - Consider rollback strategy
   ↓
3. Implement layer by layer
   - Repository first (if data access changes)
   - Service second (if business logic changes)
   - UI last (if interface changes)
   ↓
4. Update tests
   - Fix broken tests
   - Add new test cases
   - Ensure coverage
   ↓
5. Validate
   - Run tests
   - Check lint
   - Manual testing
```

### Workflow 3: Bug Fix

```
1. Reproduce bug
   - Understand the issue
   - Create failing test
   ↓
2. Identify root cause
   - Use debugger
   - Check logs
   - Review related code
   ↓
3. Fix at the right layer
   - Data layer: Repository
   - Business logic: Service
   - UI: Component
   ↓
4. Verify fix
   - Test passes
   - No regressions
   - Manual verification
```

---

## 📚 Common Patterns Library

### Pattern 1: Async State Management

```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function createAsyncState<T>(initialData: T | null = null): Signal<AsyncState<T>> {
  return signal<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  });
}

// Usage
export class TaskListComponent {
  state = createAsyncState<Task[]>([]);
  
  async loadTasks() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    
    try {
      const tasks = await this.taskService.getTasks();
      this.state.update(s => ({ ...s, data: tasks, loading: false }));
    } catch (error) {
      this.state.update(s => ({ 
        ...s, 
        loading: false, 
        error: 'Failed to load tasks' 
      }));
    }
  }
}
```

### Pattern 2: Form Handling

```typescript
export class TaskFormComponent {
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    assigneeId: [''],
    priority: ['medium'],
    dueDate: [null]
  });
  
  async submit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsDirty();
        this.form.get(key)?.updateValueAndValidity();
      });
      return;
    }
    
    const request: CreateTaskRequest = this.form.value as CreateTaskRequest;
    
    try {
      await this.taskService.createTask(request);
      this.message.success('任務建立成功');
      this.form.reset();
    } catch (error) {
      this.message.error('建立失敗');
    }
  }
}
```

### Pattern 3: Realtime Data

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRealtimeRepository {
  private firestore = inject(Firestore);
  
  watchByBlueprintId(blueprintId: string): Observable<Task[]> {
    const q = query(
      collection(this.firestore, 'tasks'),
      where('blueprint_id', '==', blueprintId),
      where('deleted_at', '==', null)
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.map(doc => 
            this.toEntity(doc.data(), doc.id)
          );
          observer.next(tasks);
        },
        (error) => {
          observer.error(error);
        }
      );
      
      return () => unsubscribe();
    });
  }
}

// Usage in component
export class TaskListComponent {
  private realtimeRepo = inject(TaskRealtimeRepository);
  private destroyRef = inject(DestroyRef);
  
  tasks = signal<Task[]>([]);
  
  ngOnInit() {
    this.realtimeRepo.watchByBlueprintId(this.blueprintId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tasks => this.tasks.set(tasks));
  }
}
```

---

## 🚫 Anti-Patterns to Avoid

### Anti-Pattern 1: God Service

```typescript
// ❌ BAD: Single service handles everything
@Injectable({ providedIn: 'root' })
export class AppService {
  createTask() { }
  updateTask() { }
  deleteTask() { }
  createUser() { }
  updateUser() { }
  deleteUser() { }
  createBlueprint() { }
  // ... 50 more methods
}

// ✅ GOOD: Focused services
@Injectable({ providedIn: 'root' })
export class TaskService {
  createTask() { }
  updateTask() { }
  deleteTask() { }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  createUser() { }
  updateUser() { }
  deleteUser() { }
}
```

### Anti-Pattern 2: Smart Repository

```typescript
// ❌ BAD: Repository with business logic
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  async createTask(request: CreateTaskRequest): Promise<Task> {
    // ❌ Business validation in repository
    if (request.dueDate < new Date()) {
      throw new Error('Due date must be in the future');
    }
    
    // ❌ Permission check in repository
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      throw new Error('No permission');
    }
    
    return this.firestore.add(...);
  }
}

// ✅ GOOD: Dumb repository, smart service
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  async create(request: CreateTaskRequest): Promise<Task> {
    // Only data access
    return this.firestore.add(...);
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  async createTask(request: CreateTaskRequest): Promise<Task> {
    // Business validation
    if (request.dueDate < new Date()) {
      throw new ValidationError('Due date must be in the future');
    }
    
    // Permission check
    const hasPermission = await this.permissionService.check(...);
    if (!hasPermission) {
      throw new AuthorizationError('No permission');
    }
    
    // Delegate to repository
    return this.repository.create(request);
  }
}
```

### Anti-Pattern 3: Component Business Logic

```typescript
// ❌ BAD: Business logic in component
@Component({ ... })
export class TaskFormComponent {
  async submit() {
    // ❌ Validation logic in component
    if (this.task.title.trim().length === 0) {
      this.message.error('Title is required');
      return;
    }
    
    if (this.task.title.length > 200) {
      this.message.error('Title too long');
      return;
    }
    
    // ❌ Permission check in component
    const user = await this.auth.currentUser;
    const member = await this.getMember(user.uid);
    if (!member.permissions.includes('task:create')) {
      this.message.error('No permission');
      return;
    }
    
    // ❌ Direct repository call
    await this.repository.create(this.task);
  }
}

// ✅ GOOD: Delegate to service
@Component({ ... })
export class TaskFormComponent {
  async submit() {
    try {
      await this.taskService.createTask(this.task);
      this.message.success('Task created');
    } catch (error) {
      if (error instanceof ValidationError) {
        this.message.error(error.message);
      } else if (error instanceof AuthorizationError) {
        this.message.error('No permission');
      } else {
        this.message.error('Failed to create task');
      }
    }
  }
}
```

### Anti-Pattern 4: Leaky Abstractions

```typescript
// ❌ BAD: Firestore types leak to UI
@Component({ ... })
export class TaskListComponent {
  tasks: DocumentSnapshot<Task>[] = []; // ❌ Firestore type in UI
  
  async loadTasks() {
    const snapshot = await getDocs(...); // ❌ Firestore query in component
    this.tasks = snapshot.docs;
  }
}

// ✅ GOOD: Domain models only
@Component({ ... })
export class TaskListComponent {
  tasks = signal<Task[]>([]); // ✅ Domain model
  
  async loadTasks() {
    const tasks = await this.taskService.getTasks(); // ✅ Service abstraction
    this.tasks.set(tasks);
  }
}
```

---

## 🎓 Continuous Learning

### Stay Updated
- Monitor Angular release notes for new features
- Follow Firebase updates and deprecations
- Review ng-alain changelog for component updates
- Track TypeScript language features

### Code Review Learning
- Study code review feedback
- Identify recurring patterns
- Update mental models
- Share knowledge with team

### Performance Monitoring
- Use Firebase Performance Monitoring
- Track Firestore read/write costs
- Monitor bundle size
- Analyze Core Web Vitals

---

## 🏁 Conclusion

This document serves as the **omniscient reference** for AI-driven development in the GigHub project. Every code generation, every architectural decision, and every pattern must align with these guidelines.

**Remember**:
- Three-layer architecture is **non-negotiable**
- Repository pattern is **mandatory** for Firestore access
- Angular 20 modern patterns are **required**
- Security rules are **first-class citizens**
- Minimal, surgical changes are **preferred**

When in doubt, refer back to this document and the referenced instruction files in `.github/instructions/`.

---

**End of AI Behavior Guidelines**

This is the law of the land. Follow it without exception.
