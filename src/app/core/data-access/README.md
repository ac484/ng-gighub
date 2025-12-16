# Core Data Access Layer

> **統一資料存取層** - 混合 Repository 策略，平衡集中式管理與模組獨立性

## 📋 目錄說明

### repositories/
包含所有 Repository 實作，採用**混合策略**。

```
repositories/
├── base/                   # Repository 基礎類別
│   └── firestore-base.repository.ts
├── shared/                 # 跨模組共用 Repositories
│   ├── account.repository.ts
│   ├── organization.repository.ts
│   ├── organization-member.repository.ts
│   ├── organization-invitation.repository.ts
│   ├── team.repository.ts
│   ├── team-member.repository.ts
│   └── notification.repository.ts
├── log-firestore.repository.ts      # ⚠️ 應移至模組
└── task-firestore.repository.ts     # ⚠️ 應移至模組
```

**注意**: `log-firestore.repository.ts` 和 `task-firestore.repository.ts` 應該移動到對應的 Blueprint 模組中（參考 ADR-0002）。

## 🎯 混合 Repository 策略

根據 [ADR-0002](../../../docs/architecture/decisions/0002-hybrid-repository-strategy.md)，我們採用混合策略：

### 決策準則

使用以下決策樹判斷 Repository 應該放在哪裡：

```mermaid
flowchart TD
    Start[需要 Repository?] --> Q1{跨多個模組使用?}
    
    Q1 -->|是| Shared[core/data-access/repositories/shared/]
    Q1 -->|否| Q2{是基礎設施服務?}
    
    Q2 -->|是| Infra[core/infrastructure/]
    Q2 -->|否| Module[blueprint/modules/[module]/repositories/]
    
    Shared --> Example1[例如: Account, Organization, User, Team]
    Infra --> Example2[例如: FirebaseStorage, S3Storage]
    Module --> Example3[例如: Tasks, Logs, QA, Safety]
```

### 放置對照表

| Repository 類型 | 放置位置 | 理由 | 範例 |
|----------------|---------|------|------|
| **帳號管理** | `core/data-access/repositories/shared/` | 認證、授權跨所有模組使用 | `account.repository.ts` |
| **組織管理** | `core/data-access/repositories/shared/` | 多功能共用，基礎實體 | `organization.repository.ts` |
| **使用者** | `core/data-access/repositories/shared/` | 使用者資料跨模組共用 | - |
| **團隊** | `core/data-access/repositories/shared/` | 團隊管理跨模組使用 | `team.repository.ts` |
| **通知** | `core/data-access/repositories/shared/` | 通知系統跨模組使用 | `notification.repository.ts` |
| **任務** | `blueprint/modules/tasks/repositories/` | 任務模組特定邏輯 | `tasks.repository.ts` |
| **日誌** | `blueprint/modules/log/repositories/` | 日誌模組特定查詢 | `log.repository.ts` |
| **品管** | `blueprint/modules/qa/repositories/` | 品管領域特定 | `qa-inspection.repository.ts` |
| **安全** | `blueprint/modules/safety/repositories/` | 安全領域特定 | `safety-incident.repository.ts` |
| **檔案儲存** | `core/infrastructure/firebase/` | 基礎設施技術服務 | `firebase-storage.repository.ts` |

## 📝 Repository 標準模式

### 基礎介面

```typescript
// repositories/base/repository.interface.ts
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}

export interface QueryOptions {
  filters?: Record<string, any>;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}
```

### Firestore Base Repository

```typescript
// repositories/base/firestore-base.repository.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Repository, QueryOptions } from './repository.interface';

export abstract class FirestoreBaseRepository<T extends { id: string }> implements Repository<T> {
  protected firestore = inject(Firestore);
  protected abstract tableName: string;
  
  protected get collectionRef() {
    return collection(this.firestore, this.tableName);
  }
  
  async findById(id: string): Promise<T | null> {
    const docRef = doc(this.firestore, this.tableName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  
  async findAll(options?: QueryOptions): Promise<T[]> {
    let q = query(this.collectionRef);
    
    // 應用過濾條件
    if (options?.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        q = query(q, where(field, '==', value));
      });
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }
  
  async create(entity: Omit<T, 'id'>): Promise<T> {
    const docRef = await addDoc(this.collectionRef, {
      ...entity,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return this.findById(docRef.id) as Promise<T>;
  }
  
  async update(id: string, entity: Partial<T>): Promise<T> {
    const docRef = doc(this.firestore, this.tableName, id);
    await updateDoc(docRef, {
      ...entity,
      updatedAt: new Date()
    });
    
    return this.findById(id) as Promise<T>;
  }
  
  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.tableName, id);
    await deleteDoc(docRef);
  }
}
```

### 共享 Repository 範例

```typescript
// repositories/shared/account.repository.ts
import { Injectable } from '@angular/core';
import { FirestoreBaseRepository } from '../base/firestore-base.repository';

export interface Account {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AccountRepository extends FirestoreBaseRepository<Account> {
  protected tableName = 'accounts';
  
  // 額外的帳號特定方法
  async findByEmail(email: string): Promise<Account | null> {
    const accounts = await this.findAll({
      filters: { email }
    });
    return accounts.length > 0 ? accounts[0] : null;
  }
}
```

### 模組 Repository 範例

```typescript
// core/blueprint/modules/implementations/tasks/repositories/tasks.repository.ts
import { Injectable } from '@angular/core';
import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<Task> {
  protected tableName = 'tasks';
  
  // 任務模組特定的查詢方法
  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    return this.findAll({
      filters: { blueprint_id: blueprintId }
    });
  }
  
  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return this.findAll({
      filters: { assignee_id: assigneeId }
    });
  }
  
  async findOverdue(): Promise<Task[]> {
    const allTasks = await this.findAll();
    const now = new Date();
    return allTasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'completed'
    );
  }
}
```

## 🔧 使用模式

### 在 Store 中使用 Repository

```typescript
// core/state/stores/task.store.ts
import { Injectable, signal, inject } from '@angular/core';
import { TasksRepository } from '@core/blueprint/modules/implementations/tasks/repositories';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TasksRepository);
  private _tasks = signal<Task[]>([]);
  
  async loadTasks(): Promise<void> {
    const tasks = await this.repository.findAll();
    this._tasks.set(tasks);
  }
  
  async loadTasksByBlueprint(blueprintId: string): Promise<void> {
    const tasks = await this.repository.findByBlueprint(blueprintId);
    this._tasks.set(tasks);
  }
}
```

### 在服務中使用 Repository

```typescript
// core/blueprint/modules/implementations/tasks/services/tasks.service.ts
import { Injectable, inject } from '@angular/core';
import { TasksRepository } from '../repositories/tasks.repository';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private repository = inject(TasksRepository);
  
  async getOverdueTasks(): Promise<Task[]> {
    return this.repository.findOverdue();
  }
  
  async assignTask(taskId: string, assigneeId: string): Promise<void> {
    await this.repository.update(taskId, {
      assignee_id: assigneeId,
      updatedAt: new Date()
    });
  }
}
```

## 🎨 進階模式

### 1. 快取策略

```typescript
import { Injectable } from '@angular/core';
import { FirestoreBaseRepository } from '../base/firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class CachedRepository<T extends { id: string }> extends FirestoreBaseRepository<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private cacheDuration = 5 * 60 * 1000; // 5 分鐘
  
  async findById(id: string): Promise<T | null> {
    // 檢查快取
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    
    // 從資料庫取得
    const data = await super.findById(id);
    if (data) {
      this.cache.set(id, { data, timestamp: Date.now() });
    }
    
    return data;
  }
  
  invalidateCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }
}
```

### 2. 批次操作

```typescript
@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<Task> {
  protected tableName = 'tasks';
  
  async batchCreate(tasks: Omit<Task, 'id'>[]): Promise<Task[]> {
    const promises = tasks.map(task => this.create(task));
    return Promise.all(promises);
  }
  
  async batchUpdate(updates: Array<{ id: string; data: Partial<Task> }>): Promise<void> {
    const promises = updates.map(({ id, data }) => this.update(id, data));
    await Promise.all(promises);
  }
}
```

### 3. 複雜查詢

```typescript
@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<Task> {
  protected tableName = 'tasks';
  
  async findWithFilters(filters: {
    status?: string[];
    assigneeId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    priority?: string;
  }): Promise<Task[]> {
    let tasks = await this.findAll();
    
    // 應用多重過濾
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter(t => filters.status!.includes(t.status));
    }
    
    if (filters.assigneeId) {
      tasks = tasks.filter(t => t.assignee_id === filters.assigneeId);
    }
    
    if (filters.dueDateFrom) {
      tasks = tasks.filter(t => t.dueDate && t.dueDate >= filters.dueDateFrom!);
    }
    
    if (filters.dueDateTo) {
      tasks = tasks.filter(t => t.dueDate && t.dueDate <= filters.dueDateTo!);
    }
    
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    
    return tasks;
  }
}
```

## 📊 測試 Repository

```typescript
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { TasksRepository } from './tasks.repository';

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  
  beforeEach(() => {
    mockFirestore = jasmine.createSpyObj('Firestore', ['collection']);
    
    TestBed.configureTestingModule({
      providers: [
        TasksRepository,
        { provide: Firestore, useValue: mockFirestore }
      ]
    });
    
    repository = TestBed.inject(TasksRepository);
  });
  
  it('should create a task', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending'
    };
    
    const task = await repository.create(taskData);
    
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
  });
});
```

## 🔍 相關文檔

- [ADR-0002: 混合 Repository 策略](../../../docs/architecture/decisions/0002-hybrid-repository-strategy.md)
- [Core Layer README](../README.md)
- [ARCHITECTURE_REVIEW.md](../../../docs/architecture/ARCHITECTURE_REVIEW.md)

## ⚠️ 最佳實踐

### ✅ 推薦做法

1. **繼承 Base Repository** - 減少重複程式碼
2. **類型安全** - 使用 TypeScript 泛型
3. **錯誤處理** - 統一的錯誤處理機制
4. **命名一致** - Repository 以實體名稱 + Repository 命名
5. **單一職責** - 一個 Repository 管理一個實體

### ❌ 避免的反模式

```typescript
// ❌ 直接在元件中使用 Repository
@Component({...})
export class TaskComponent {
  private repository = inject(TasksRepository);  // 不要！
  
  async loadTasks(): Promise<void> {
    this.tasks = await this.repository.findAll();
  }
}

// ✅ 透過 Store 使用
@Component({...})
export class TaskComponent {
  private taskStore = inject(TaskStore);  // 正確！
  tasks = this.taskStore.tasks;
  
  ngOnInit(): void {
    this.taskStore.loadTasks();
  }
}

// ❌ Repository 包含業務邏輯
@Injectable({ providedIn: 'root' })
export class TasksRepository {
  async completeTask(id: string): Promise<void> {
    // 複雜的業務邏輯 - 不應該在這裡！
    const task = await this.findById(id);
    if (task.status === 'pending') {
      await this.sendNotification(task.assignee_id);
      await this.updateTaskStatus(id, 'completed');
      await this.logActivity(id);
    }
  }
}

// ✅ Repository 只負責資料存取
@Injectable({ providedIn: 'root' })
export class TasksRepository {
  async update(id: string, data: Partial<Task>): Promise<Task> {
    // 只負責資料存取
    return super.update(id, data);
  }
}

// ✅ 業務邏輯放在 Service 或 Store
@Injectable({ providedIn: 'root' })
export class TasksService {
  async completeTask(id: string): Promise<void> {
    const task = await this.repository.findById(id);
    if (task.status === 'pending') {
      await this.notificationService.sendToAssignee(task.assignee_id);
      await this.repository.update(id, { status: 'completed' });
      await this.activityLogger.log(id, 'Task completed');
    }
  }
}
```

## 🔄 遷移待辦

根據架構評估，以下 Repository 需要重新組織：

- [ ] 將 `log-firestore.repository.ts` 移至 `core/blueprint/modules/implementations/log/repositories/`
- [ ] 將 `task-firestore.repository.ts` 移至 `core/blueprint/modules/implementations/tasks/repositories/`
- [ ] 更新相關的 import 路徑
- [ ] 驗證 Blueprint 模組中的 Repository 遵循標準模式

---

**維護者**: Architecture Team  
**建立日期**: 2025-12-14  
**版本**: 1.0
