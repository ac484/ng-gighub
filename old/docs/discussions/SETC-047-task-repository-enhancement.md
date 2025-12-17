# SETC-047: Task Repository Enhancement

> **任務編號**: SETC-047  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-046  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
擴展現有 Task Repository，實作完整的 Firestore 資料存取層，支援進階查詢、批次操作和即時訂閱功能。

### 範圍
- 擴展 TaskRepository 類別
- 實作進階查詢方法
- 支援批次 CRUD 操作
- 實作即時訂閱功能
- 建立 Firestore Security Rules

---

## 🏗️ 技術實作

### Repository 介面定義

```typescript
import { Observable } from 'rxjs';
import { Task, TaskFilters, TaskStatus, CreateTaskData, UpdateTaskData } from '../models/task.model';

export interface ITaskRepository {
  // 基本 CRUD
  create(data: CreateTaskData): Promise<Task>;
  findById(taskId: string): Promise<Task | null>;
  update(taskId: string, data: UpdateTaskData): Promise<Task>;
  delete(taskId: string): Promise<void>;
  
  // 查詢方法
  findByBlueprint(blueprintId: string, filters?: TaskFilters): Promise<Task[]>;
  findByContract(contractId: string): Promise<Task[]>;
  findByAssignee(userId: string): Promise<Task[]>;
  findByStatus(blueprintId: string, status: TaskStatus): Promise<Task[]>;
  findSubtasks(parentTaskId: string): Promise<Task[]>;
  
  // 即時訂閱
  watchById(taskId: string): Observable<Task | null>;
  watchByBlueprint(blueprintId: string, filters?: TaskFilters): Observable<Task[]>;
  watchByAssignee(userId: string): Observable<Task[]>;
  
  // 批次操作
  createBatch(tasks: CreateTaskData[]): Promise<Task[]>;
  updateBatch(updates: { id: string; data: UpdateTaskData }[]): Promise<Task[]>;
  deleteBatch(taskIds: string[]): Promise<void>;
  
  // 統計查詢
  countByStatus(blueprintId: string): Promise<Record<TaskStatus, number>>;
  getProgressSummary(blueprintId: string): Promise<TaskProgressSummary>;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  category?: TaskCategory | TaskCategory[];
  assignedTo?: string;
  contractId?: string;
  parentTaskId?: string | null;
  dateRange?: { start: Date; end: Date };
  searchText?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'plannedEndDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TaskProgressSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageProgress: number;
}
```

### Repository 實作

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '../models/task.model';
import { ITaskRepository, TaskProgressSummary } from './task-repository.interface';

@Injectable({ providedIn: 'root' })
export class TaskRepository implements ITaskRepository {
  private firestore = inject(Firestore);
  private readonly collectionName = 'tasks';
  
  // 內部狀態
  private taskNumberCounter = signal(0);

  /**
   * 建立任務
   */
  async create(data: CreateTaskData): Promise<Task> {
    const tasksCollection = collection(this.firestore, this.collectionName);
    
    const taskNumber = await this.generateTaskNumber(data.blueprintId);
    
    const taskData = {
      ...data,
      taskNumber,
      status: data.status || 'draft',
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(tasksCollection, taskData);
    
    return {
      id: docRef.id,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Task;
  }

  /**
   * 根據 ID 查詢任務
   */
  async findById(taskId: string): Promise<Task | null> {
    const taskDoc = doc(this.firestore, this.collectionName, taskId);
    const snapshot = await getDoc(taskDoc);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return this.convertToTask(snapshot.id, snapshot.data());
  }

  /**
   * 更新任務
   */
  async update(taskId: string, data: UpdateTaskData): Promise<Task> {
    const taskDoc = doc(this.firestore, this.collectionName, taskId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(taskDoc, updateData);
    
    const updated = await this.findById(taskId);
    if (!updated) {
      throw new Error(`Task ${taskId} not found after update`);
    }
    
    return updated;
  }

  /**
   * 刪除任務 (軟刪除)
   */
  async delete(taskId: string): Promise<void> {
    const taskDoc = doc(this.firestore, this.collectionName, taskId);
    
    await updateDoc(taskDoc, {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * 根據藍圖查詢任務
   */
  async findByBlueprint(blueprintId: string, filters?: TaskFilters): Promise<Task[]> {
    const tasksCollection = collection(this.firestore, this.collectionName);
    
    let q = query(
      tasksCollection,
      where('blueprintId', '==', blueprintId),
      where('deletedAt', '==', null)
    );
    
    // 應用篩選條件
    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      q = query(q, where('status', 'in', statuses));
    }
    
    if (filters?.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }
    
    if (filters?.contractId) {
      q = query(q, where('contractId', '==', filters.contractId));
    }
    
    // 排序
    const sortField = filters?.sortBy || 'createdAt';
    const sortDirection = filters?.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortDirection));
    
    // 限制數量
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertToTask(doc.id, doc.data()));
  }

  /**
   * 即時訂閱任務
   */
  watchById(taskId: string): Observable<Task | null> {
    return new Observable(subscriber => {
      const taskDoc = doc(this.firestore, this.collectionName, taskId);
      
      const unsubscribe = onSnapshot(taskDoc, 
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(this.convertToTask(snapshot.id, snapshot.data()));
          } else {
            subscriber.next(null);
          }
        },
        (error) => subscriber.error(error)
      );
      
      return () => unsubscribe();
    });
  }

  /**
   * 即時訂閱藍圖任務列表
   */
  watchByBlueprint(blueprintId: string, filters?: TaskFilters): Observable<Task[]> {
    return new Observable(subscriber => {
      const tasksCollection = collection(this.firestore, this.collectionName);
      
      let q = query(
        tasksCollection,
        where('blueprintId', '==', blueprintId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const tasks = snapshot.docs.map(doc => 
            this.convertToTask(doc.id, doc.data())
          );
          subscriber.next(tasks);
        },
        (error) => subscriber.error(error)
      );
      
      return () => unsubscribe();
    });
  }

  /**
   * 批次建立任務
   */
  async createBatch(tasks: CreateTaskData[]): Promise<Task[]> {
    const batch = writeBatch(this.firestore);
    const createdTasks: Task[] = [];
    
    for (const taskData of tasks) {
      const tasksCollection = collection(this.firestore, this.collectionName);
      const newDocRef = doc(tasksCollection);
      const taskNumber = await this.generateTaskNumber(taskData.blueprintId);
      
      const data = {
        ...taskData,
        taskNumber,
        status: taskData.status || 'draft',
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      batch.set(newDocRef, data);
      
      createdTasks.push({
        id: newDocRef.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Task);
    }
    
    await batch.commit();
    return createdTasks;
  }

  /**
   * 統計各狀態任務數量
   */
  async countByStatus(blueprintId: string): Promise<Record<string, number>> {
    const tasks = await this.findByBlueprint(blueprintId);
    
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 取得進度摘要
   */
  async getProgressSummary(blueprintId: string): Promise<TaskProgressSummary> {
    const tasks = await this.findByBlueprint(blueprintId);
    const now = new Date();
    
    const completedTasks = tasks.filter(t => t.status === 'confirmed');
    const inProgressTasks = tasks.filter(t => 
      ['assigned', 'in_progress', 'submitted'].includes(t.status)
    );
    const pendingTasks = tasks.filter(t => 
      ['draft', 'pending'].includes(t.status)
    );
    const overdueTasks = tasks.filter(t => 
      t.plannedEndDate && new Date(t.plannedEndDate) < now && 
      !['confirmed', 'cancelled'].includes(t.status)
    );
    
    const totalProgress = tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const averageProgress = tasks.length > 0 ? totalProgress / tasks.length : 0;
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      averageProgress: Math.round(averageProgress * 100) / 100
    };
  }

  // ============ Private Methods ============

  private async generateTaskNumber(blueprintId: string): Promise<string> {
    // TODO: 實作真正的編號生成邏輯
    const count = await this.countByStatus(blueprintId);
    const total = Object.values(count).reduce((a, b) => a + b, 0);
    return `TASK-${String(total + 1).padStart(4, '0')}`;
  }

  private convertToTask(id: string, data: any): Task {
    return {
      id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt),
      deletedAt: data.deletedAt instanceof Timestamp 
        ? data.deletedAt.toDate() 
        : data.deletedAt ? new Date(data.deletedAt) : undefined
    } as Task;
  }
}
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tasks Collection
    match /tasks/{taskId} {
      // 讀取權限：藍圖成員可讀
      allow read: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId);
      
      // 建立權限：藍圖成員可建立
      allow create: if request.auth != null && 
        isBlueprintMember(request.resource.data.blueprintId) &&
        validateTask(request.resource.data);
      
      // 更新權限：藍圖成員可更新
      allow update: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId) &&
        validateTaskUpdate(request.resource.data);
      
      // 刪除權限：僅管理員可刪除
      allow delete: if request.auth != null && 
        isBlueprintAdmin(resource.data.blueprintId);
    }
    
    // Helper Functions
    function isBlueprintMember(blueprintId) {
      return exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
    }
    
    function isBlueprintAdmin(blueprintId) {
      let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
      return member != null && member.data.role in ['owner', 'admin'];
    }
    
    function validateTask(task) {
      return task.blueprintId is string &&
             task.title is string &&
             task.title.size() > 0 &&
             task.title.size() <= 200 &&
             task.createdBy == request.auth.uid;
    }
    
    function validateTaskUpdate(task) {
      return task.updatedAt == request.time;
    }
  }
}
```

---

## 🧪 測試規格

### 單元測試

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TaskRepository } from './task.repository';

describe('TaskRepository', () => {
  let repository: TaskRepository;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TaskRepository
      ]
    });
    
    repository = TestBed.inject(TaskRepository);
  });

  describe('create', () => {
    it('should create a task with generated task number', async () => {
      const result = await repository.create({
        blueprintId: 'bp-123',
        title: 'Test Task',
        createdBy: 'user-123'
      });

      expect(result.id).toBeDefined();
      expect(result.taskNumber).toMatch(/^TASK-\d{4}$/);
      expect(result.status).toBe('draft');
      expect(result.progress).toBe(0);
    });
  });

  describe('findByBlueprint', () => {
    it('should return tasks filtered by status', async () => {
      const tasks = await repository.findByBlueprint('bp-123', {
        status: 'in_progress'
      });

      expect(tasks.every(t => t.status === 'in_progress')).toBe(true);
    });
  });

  describe('watchByBlueprint', () => {
    it('should emit task updates', (done) => {
      repository.watchByBlueprint('bp-123').subscribe({
        next: (tasks) => {
          expect(Array.isArray(tasks)).toBe(true);
          done();
        }
      });
    });
  });
});
```

---

## ✅ 交付物

- [ ] `task.repository.ts` - 完整 Repository 實作
- [ ] `task-repository.interface.ts` - Repository 介面定義
- [ ] `firestore.rules` - 更新 Security Rules
- [ ] `task.repository.spec.ts` - 單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 所有 Repository 方法正確實作
2. ✅ Firestore 查詢效能優化
3. ✅ 即時訂閱功能正常運作
4. ✅ Security Rules 測試通過
5. ✅ 單元測試覆蓋率 >80%
6. ✅ TypeScript 編譯無錯誤

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
