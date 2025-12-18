---
description: 'GigHub Firestore Repository 模式與 FirestoreBaseRepository 最佳實踐'
applyTo: '**/*.ts'
---

# GigHub Firestore Repository Pattern

> **專案專用**: Firestore Repository 模式實作指引  
> **來源**: 從 `src/app/core/data-access/repositories/base/firestore-base.repository.ts` 提取

## 🎯 核心原則 (MUST) 🔴

**禁止直接操作 Firestore，必須使用 Repository 模式**

### 為什麼需要 Repository Pattern?

1. **資料存取抽象** - 將 Firestore 實作細節與業務邏輯分離
2. **統一錯誤處理** - 集中處理 Firestore 錯誤與重試邏輯
3. **自動重試機制** - Exponential Backoff 處理暫時性失敗
4. **可測試性** - 輕鬆 mock Repository 進行單元測試
5. **可維護性** - 集中管理資料存取邏輯
6. **效能追蹤** - 自動記錄操作時間與效能指標

## 📐 FirestoreBaseRepository 架構

### 基礎類別結構

```typescript
import { FirestoreBaseRepository } from './base/firestore-base.repository';

/**
 * 所有 Repository 都必須繼承 FirestoreBaseRepository<T>
 * 
 * @template T - 領域實體類型
 */
export abstract class FirestoreBaseRepository<T> {
  // 自動注入依賴
  protected readonly firebaseService = inject(FirebaseService);
  protected readonly logger = inject(LoggerService);
  protected readonly errorTracking = inject(ErrorTrackingService);
  
  // 子類必須實作
  protected abstract collectionName: string;
  protected abstract toEntity(data: DocumentData, id: string): T;
  
  // 子類可選實作
  protected toDocument(entity: Partial<T>): DocumentData { }
  
  // 內建方法 (自動提供)
  protected async executeWithRetry<R>(...): Promise<R> { }
  protected async queryDocuments(q: any): Promise<T[]> { }
  protected async getDocument(id: string): Promise<T | null> { }
  protected async createDocument(entity: Partial<T>): Promise<T> { }
  protected async updateDocument(id: string, entity: Partial<T>): Promise<T> { }
  protected async deleteDocument(id: string, hard: boolean): Promise<void> { }
}
```

### 內建功能

#### 1. 自動重試機制 (Exponential Backoff)

```typescript
// ✅ 自動包含重試邏輯
protected async executeWithRetry<R>(
  operation: () => Promise<R>, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<R>

// 重試策略:
// - 嘗試 1: 立即執行
// - 嘗試 2: 延遲 2 秒 + 隨機 jitter
// - 嘗試 3: 延遲 4 秒 + 隨機 jitter
// - 最大延遲: 30 秒
```

#### 2. 智能錯誤處理

```typescript
// ✅ 自動識別不可重試的錯誤
protected isNonRetryableError(error: any): boolean

// 不可重試的錯誤類型:
// - permission-denied (Security Rules violation)
// - invalid-argument (資料格式錯誤)
// - not-found (文檔不存在)
// - already-exists (文檔已存在)
// - failed-precondition (前置條件失敗)
// - unauthenticated (未認證)
```

#### 3. 自動日誌記錄

```typescript
// ✅ 自動記錄操作成功
this.logger.debug(`[TaskRepository]`, `findAll succeeded (123.45ms)`);

// ✅ 自動記錄重試警告
this.logger.warn(`[TaskRepository]`, `findAll failed (attempt 1/3), retrying in 2000ms`);

// ✅ 自動記錄最終錯誤
this.logger.error(`[TaskRepository]`, `findAll failed after 3 retries`, error);
```

#### 4. 效能追蹤

```typescript
// ✅ 自動追蹤操作時間
const startTime = performance.now();
const result = await operation();
const duration = performance.now() - startTime;

// ✅ 自動發送到錯誤追蹤服務
this.errorTracking.trackFirestoreError(collectionName, error, context);
```

#### 5. 軟刪除支援

```typescript
// ✅ 預設使用軟刪除
await deleteDocument(id, false);  // 設定 deleted_at timestamp

// ⚠️ 硬刪除需明確指定
await deleteDocument(id, true);   // 實際刪除文檔
```

## 🔧 實作 Repository

### 步驟 1: 定義領域實體

```typescript
// src/app/core/domain/models/task.model.ts
export interface Task {
  id: string;
  blueprintId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assigneeId?: string;
  assigneeType?: 'user' | 'team' | 'partner';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### 步驟 2: 創建 Repository 類別

```typescript
// src/app/core/data-access/task/task.repository.ts
import { Injectable } from '@angular/core';
import { query, where, orderBy, limit, DocumentData } from '@angular/fire/firestore';
import { Task } from '@core/domain/models/task.model';
import { FirestoreBaseRepository } from '../base/firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  // ✅ MUST: 定義 collection 名稱
  protected collectionName = 'tasks';
  
  // ✅ MUST: 實作 toEntity 方法
  protected toEntity(data: DocumentData, id: string): Task {
    return {
      id,
      blueprintId: data['blueprint_id'] || data['blueprintId'],
      title: data['title'],
      description: data['description'],
      status: this.mapStatus(data['status']),
      assigneeId: data['assignee_id'] || data['assigneeId'],
      assigneeType: data['assignee_type'] || data['assigneeType'],
      dueDate: data['due_date'] ? this.toDate(data['due_date']) : undefined,
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at']),
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null,
      priority: data['priority']?.toLowerCase(),
      tags: data['tags'] || [],
      metadata: data['metadata'] || {}
    };
  }
  
  // ✅ SHOULD: 覆寫 toDocument 方法 (如需自訂轉換邏輯)
  protected override toDocument(task: Partial<Task>): DocumentData {
    const doc: DocumentData = {};
    
    if (task.blueprintId) doc['blueprint_id'] = task.blueprintId;
    if (task.title) doc['title'] = task.title;
    if (task.description !== undefined) doc['description'] = task.description;
    if (task.status) doc['status'] = task.status.toUpperCase();
    if (task.assigneeId !== undefined) doc['assignee_id'] = task.assigneeId;
    if (task.assigneeType !== undefined) doc['assignee_type'] = task.assigneeType;
    if (task.dueDate !== undefined) {
      doc['due_date'] = task.dueDate ? Timestamp.fromDate(task.dueDate) : null;
    }
    if (task.priority) doc['priority'] = task.priority.toUpperCase();
    if (task.tags) doc['tags'] = task.tags;
    if (task.metadata) doc['metadata'] = task.metadata;
    
    return doc;
  }
  
  // ✅ 輔助方法: 類型轉換
  private toDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
  
  private mapStatus(status: string): Task['status'] {
    const normalized = status?.toUpperCase();
    switch (normalized) {
      case 'PENDING': return 'pending';
      case 'IN_PROGRESS': return 'in-progress';
      case 'COMPLETED': return 'completed';
      default: return 'pending';
    }
  }
}
```

### 步驟 3: 實作業務查詢方法

```typescript
export class TaskRepository extends FirestoreBaseRepository<Task> {
  // ... (前面的程式碼)
  
  /**
   * 取得 Blueprint 的所有任務 (不含已刪除)
   */
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 根據狀態取得任務
   */
  async findByStatus(
    blueprintId: string, 
    status: Task['status']
  ): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        where('status', '==', status.toUpperCase()),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 根據指派人取得任務
   */
  async findByAssignee(
    blueprintId: string,
    assigneeId: string
  ): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        where('assignee_id', '==', assigneeId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 根據 ID 取得單一任務
   */
  async findById(id: string): Promise<Task | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }
  
  /**
   * 創建新任務
   */
  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Task> {
    return this.executeWithRetry(async () => {
      return this.createDocument(task);
    });
  }
  
  /**
   * 更新任務
   */
  async update(id: string, task: Partial<Task>): Promise<Task> {
    return this.executeWithRetry(async () => {
      return this.updateDocument(id, task);
    });
  }
  
  /**
   * 刪除任務 (軟刪除)
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      return this.deleteDocument(id, false);  // 軟刪除
    });
  }
  
  /**
   * 永久刪除任務 (硬刪除 - 謹慎使用)
   */
  async hardDelete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      return this.deleteDocument(id, true);  // 硬刪除
    });
  }
  
  /**
   * 批次更新任務狀態
   */
  async updateStatusBatch(
    taskIds: string[], 
    status: Task['status']
  ): Promise<void> {
    const operations = taskIds.map(id => 
      () => this.update(id, { status })
    );
    
    await this.executeBatch(operations);
  }
}
```

### 步驟 4: 錯誤處理

```typescript
export class TaskRepository extends FirestoreBaseRepository<Task> {
  // ... (前面的程式碼)
  
  /**
   * 安全地取得任務 (帶錯誤處理)
   */
  async findByIdSafe(id: string): Promise<Task | null> {
    try {
      return await this.findById(id);
    } catch (error) {
      // ✅ 使用內建的錯誤處理
      this.handleError(error, `findByIdSafe(${id})`);
      return null;  // TypeScript won't reach here due to handleError throwing
    }
  }
  
  /**
   * 批次創建任務 (帶錯誤恢復)
   */
  async createBatch(tasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<{
    succeeded: Task[];
    failed: Array<{ task: typeof tasks[0]; error: string }>;
  }> {
    const succeeded: Task[] = [];
    const failed: Array<{ task: typeof tasks[0]; error: string }> = [];
    
    for (const task of tasks) {
      try {
        const created = await this.create(task);
        succeeded.push(created);
      } catch (error) {
        failed.push({
          task,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // ✅ 記錄錯誤但繼續處理
        this.logger.error(
          `[TaskRepository]`,
          `Failed to create task in batch`,
          error,
          { task }
        );
      }
    }
    
    return { succeeded, failed };
  }
}
```

## 📊 Repository 放置位置決策樹

```
是否被多個模組使用？
├─ 是 → src/app/core/data-access/repositories/shared/{entity}.repository.ts
└─ 否 → src/app/core/data-access/repositories/{module}/{entity}.repository.ts

範例:
- TaskRepository → core/data-access/repositories/task/task.repository.ts
- UserRepository → core/data-access/repositories/shared/user.repository.ts
- LogRepository → core/data-access/repositories/log/log.repository.ts
```

## 🔒 與 Security Rules 整合

### Repository 只負責資料操作，Security Rules 負責權限驗證

```typescript
// ✅ Repository - 不做權限檢查
export class TaskRepository extends FirestoreBaseRepository<Task> {
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    // ✅ 只負責查詢，不檢查權限
    // Firestore Security Rules 會自動驗證
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        where('deleted_at', '==', null)
      );
      return this.queryDocuments(q);
    });
  }
}
```

```javascript
// ✅ Firestore Security Rules - 負責權限驗證
match /tasks/{taskId} {
  allow read: if isAuthenticated() 
              && isBlueprintMember(resource.data.blueprint_id);
  
  allow create: if isAuthenticated() 
                && isBlueprintMember(request.resource.data.blueprint_id)
                && hasPermission(request.resource.data.blueprint_id, 'task:create');
}
```

## 🧪 Repository 測試

### 單元測試範例

```typescript
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { TaskRepository } from './task.repository';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger';
import { ErrorTrackingService } from '@core/services/error-tracking.service';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let firebaseServiceMock: jasmine.SpyObj<FirebaseService>;
  let loggerMock: jasmine.SpyObj<LoggerService>;
  let errorTrackingMock: jasmine.SpyObj<ErrorTrackingService>;
  
  beforeEach(() => {
    firebaseServiceMock = jasmine.createSpyObj('FirebaseService', ['db']);
    loggerMock = jasmine.createSpyObj('LoggerService', ['debug', 'warn', 'error']);
    errorTrackingMock = jasmine.createSpyObj('ErrorTrackingService', ['trackFirestoreError']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskRepository,
        { provide: FirebaseService, useValue: firebaseServiceMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: ErrorTrackingService, useValue: errorTrackingMock }
      ]
    });
    
    repository = TestBed.inject(TaskRepository);
  });
  
  it('should create task with timestamps', async () => {
    const task = {
      blueprintId: 'blueprint-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending' as const
    };
    
    // Mock Firestore operations
    spyOn(repository as any, 'createDocument').and.returnValue(Promise.resolve({
      id: 'task-1',
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }));
    
    const result = await repository.create(task);
    
    expect(result.id).toBe('task-1');
    expect(result.title).toBe(task.title);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });
  
  it('should retry on transient errors', async () => {
    const error = new Error('unavailable');
    (error as any).code = 'unavailable';
    
    let attempts = 0;
    spyOn(repository as any, 'getDocument').and.callFake(async () => {
      attempts++;
      if (attempts < 3) {
        throw error;
      }
      return { id: 'task-1', title: 'Test' } as Task;
    });
    
    const result = await repository.findById('task-1');
    
    expect(attempts).toBe(3);
    expect(result).toBeTruthy();
    expect(loggerMock.warn).toHaveBeenCalledTimes(2);
  });
});
```

## ✅ Repository 檢查清單

### 實作檢查 (MUST) 🔴

- [ ] Repository 繼承自 `FirestoreBaseRepository<T>`
- [ ] 定義 `collectionName` 屬性
- [ ] 實作 `toEntity(data, id)` 方法
- [ ] 覆寫 `toDocument(entity)` 方法 (如需)
- [ ] 使用 `@Injectable({ providedIn: 'root' })`
- [ ] 所有查詢方法包裝在 `executeWithRetry()`
- [ ] 使用內建的 `queryDocuments()`, `getDocument()`, `createDocument()`, `updateDocument()`, `deleteDocument()`

### 設計檢查 (MUST) 🔴

- [ ] 不包含業務邏輯
- [ ] 不直接被 UI 元件注入
- [ ] 方法命名清晰 (findAll, findById, findByBlueprintId, create, update, delete)
- [ ] 返回類型明確
- [ ] 支援查詢篩選 (where, orderBy, limit)
- [ ] 預設使用軟刪除

### 效能檢查 (SHOULD) ⚠️

- [ ] 使用批次操作 (`executeBatch()`) 處理大量資料
- [ ] 查詢包含 `where('deleted_at', '==', null)` 過濾已刪除項目
- [ ] 大型查詢使用分頁 (limit + cursor)
- [ ] 考慮使用索引優化查詢

### 安全檢查 (MUST) 🔴

- [ ] 配合 Firestore Security Rules
- [ ] 不在 Repository 做權限檢查
- [ ] 使用參數化查詢
- [ ] 適當處理錯誤並記錄

## 🚫 常見錯誤模式

### ❌ 錯誤: 不使用 executeWithRetry

```typescript
// ❌ 錯誤: 缺少重試邏輯
async findByBlueprintId(blueprintId: string): Promise<Task[]> {
  const q = query(this.collectionRef, where('blueprint_id', '==', blueprintId));
  return this.queryDocuments(q);  // ❌ 暫時性失敗會直接拋出錯誤
}
```

### ✅ 正確: 使用 executeWithRetry

```typescript
// ✅ 正確: 包含重試邏輯
async findByBlueprintId(blueprintId: string): Promise<Task[]> {
  return this.executeWithRetry(async () => {
    const q = query(this.collectionRef, where('blueprint_id', '==', blueprintId));
    return this.queryDocuments(q);
  });
}
```

### ❌ 錯誤: Repository 包含業務邏輯

```typescript
// ❌ 錯誤: 業務邏輯在 Repository
async create(task: Task): Promise<Task> {
  // ❌ 業務邏輯驗證不應在 Repository
  if (task.dueDate < new Date()) {
    throw new Error('Due date cannot be in the past');
  }
  
  return this.executeWithRetry(async () => {
    return this.createDocument(task);
  });
}
```

### ✅ 正確: 業務邏輯在 Service

```typescript
// ✅ 正確: Repository 只負責資料操作
async create(task: Omit<Task, 'id'>): Promise<Task> {
  return this.executeWithRetry(async () => {
    return this.createDocument(task);
  });
}

// ✅ 業務邏輯在 Service
export class TaskService {
  async createTask(task: Task): Promise<Task> {
    // ✅ 業務邏輯驗證在 Service
    if (task.dueDate < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    
    return await this.taskRepository.create(task);
  }
}
```

## 📚 參考資料

- FirestoreBaseRepository: `src/app/core/data-access/repositories/base/firestore-base.repository.ts`
- Task Repository 實作: `src/app/core/data-access/repositories/task-firestore.repository.ts`
- Firebase Firestore SDK: https://firebase.google.com/docs/firestore
- Angular Fire: https://github.com/angular/angularfire

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
