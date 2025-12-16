/**
 * Tasks Repository
 *
 * Data access layer for task management.
 * Handles all Firestore operations for tasks within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/tasks/{taskId}
 *
 * Following Occam's Razor: Single repository implementation for all task operations
 * Uses unified Task types from @core/types/task
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  Timestamp,
  CollectionReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/types/task';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Type aliases for backward compatibility
 * These will be removed in future versions
 */
/** @deprecated Use Task from @core/types/task */
export type TaskDocument = Task;

/** @deprecated Use CreateTaskRequest from @core/types/task */
export type CreateTaskData = CreateTaskRequest;

/** @deprecated Use UpdateTaskRequest from @core/types/task */
export type UpdateTaskData = UpdateTaskRequest;

/** @deprecated Import from @core/types/task */
export type { TaskStatus, TaskPriority, TaskQueryOptions };

/**
 * Tasks Repository Service
 *
 * Manages CRUD operations for tasks within a blueprint.
 */
@Injectable({
  providedIn: 'root'
})
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'tasks';

  /**
   * Get tasks subcollection reference
   */
  private getTasksCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Convert Firestore data to Task entity
   * 將 Firestore 數據轉換為 Task 實體
   */
  private toTask(data: any, id: string): Task {
    return {
      id,
      blueprintId: data.blueprintId || '',
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      creatorId: data.createdBy || data.creatorId,
      creatorName: data.creatorName,
      dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      completedDate: data.completedDate instanceof Timestamp ? data.completedDate.toDate() : data.completedDate,
      estimatedHours: data.estimatedHours,
      estimatedBudget: data.estimatedBudget,
      actualBudget: data.actualBudget,
      actualHours: data.actualHours,
      progress: data.progress,
      parentId: data.parentId,
      dependencies: data.dependencies || [],
      tags: data.tags || [],
      attachments: data.attachments || [],
      metadata: data.metadata || {},
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : data.deletedAt) : null
    };
  }

  /**
   * Find all tasks for a blueprint
   * 根據藍圖 ID 查找所有任務
   *
   * Following Occam's Razor: Simplified query without composite index requirement
   * - Removed orderBy to avoid Firestore composite index requirement
   * - Sorting is done in-memory after fetch (acceptable for typical task counts)
   * - This allows immediate querying without database index setup
   */
  findByBlueprintId(blueprintId: string, options?: TaskQueryOptions): Observable<Task[]> {
    this.logger.info('[TasksRepository]', `Querying tasks for blueprint: ${blueprintId}`);

    const constraints: QueryConstraint[] = [];

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.priority) {
      constraints.push(where('priority', '==', options.priority));
    }

    if (options?.assigneeId) {
      constraints.push(where('assigneeId', '==', options.assigneeId));
    }

    // Simplified: Only filter deleted items, no orderBy in Firestore
    // This avoids composite index requirement: (deletedAt, createdAt)
    if (!options?.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }

    // Note: orderBy removed to avoid composite index requirement
    // We'll sort in-memory instead (see below)

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getTasksCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        this.logger.info('[TasksRepository]', `Fetched ${snapshot.docs.length} task documents from Firestore`);

        // Convert to Task objects
        const tasks = snapshot.docs.map(docSnap => this.toTask(docSnap.data(), docSnap.id));

        // Sort in-memory by createdAt desc (newest first)
        tasks.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA; // Descending order
        });

        return tasks;
      }),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findByBlueprintId failed', error as Error);
        this.logger.error('[TasksRepository]', 'Error details:', error);
        return of([]);
      })
    );
  }

  /**
   * Find task by ID
   * 根據 ID 查找任務
   */
  findById(blueprintId: string, taskId: string): Observable<Task | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTask(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async create(blueprintId: string, data: CreateTaskRequest): Promise<Task> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      title: data.title,
      description: data.description || '',
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || null,
      creatorId: data.creatorId,
      creatorName: data.creatorName || null,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      completedDate: null,
      estimatedHours: data.estimatedHours || null,
      estimatedBudget: data.estimatedBudget || null,
      actualBudget: data.actualBudget || null,
      actualHours: 0,
      progress: data.progress || 0,
      parentId: data.parentId || null,
      dependencies: data.dependencies || [],
      tags: data.tags || [],
      attachments: [],
      metadata: data.metadata || {},
      createdBy: data.creatorId, // Backward compatibility
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getTasksCollection(blueprintId), docData);
      this.logger.info('[TasksRepository]', `Task created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toTask(snapshot.data(), snapshot.id);
      }

      return this.toTask(docData, docRef.id);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing task
   * 更新現有任務
   */
  async update(blueprintId: string, taskId: string, data: UpdateTaskRequest): Promise<void> {
    const docData: any = {
      updatedAt: Timestamp.now()
    };

    // Only include defined fields to avoid Firestore undefined errors
    // Firestore doesn't accept undefined values - use null instead
    if (data.title !== undefined) docData.title = data.title;
    if (data.description !== undefined) docData.description = data.description;
    if (data.status !== undefined) docData.status = data.status;
    if (data.priority !== undefined) docData.priority = data.priority;
    if (data.assigneeId !== undefined) docData.assigneeId = data.assigneeId || null;
    if (data.assigneeName !== undefined) docData.assigneeName = data.assigneeName || null;
    if (data.estimatedHours !== undefined) docData.estimatedHours = data.estimatedHours || null;
    if (data.actualHours !== undefined) docData.actualHours = data.actualHours || null;
    if (data.estimatedBudget !== undefined) docData.estimatedBudget = data.estimatedBudget || null;
    if (data.actualBudget !== undefined) docData.actualBudget = data.actualBudget || null;
    if (data.progress !== undefined) docData.progress = data.progress;
    if (data.parentId !== undefined) docData.parentId = data.parentId;
    if (data.dependencies !== undefined) docData.dependencies = data.dependencies || [];
    if (data.tags !== undefined) docData.tags = data.tags || [];
    if (data.metadata !== undefined) docData.metadata = data.metadata || {};

    // Convert dates to Timestamps
    if (data.dueDate !== undefined) {
      docData.dueDate = data.dueDate ? (data.dueDate instanceof Date ? Timestamp.fromDate(data.dueDate) : data.dueDate) : null;
    }
    if (data.startDate !== undefined) {
      docData.startDate = data.startDate ? (data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate) : null;
    }
    if (data.completedDate !== undefined) {
      docData.completedDate = data.completedDate
        ? data.completedDate instanceof Date
          ? Timestamp.fromDate(data.completedDate)
          : data.completedDate
        : null;
    }

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId), docData);
      this.logger.info('[TasksRepository]', `Task updated: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async delete(blueprintId: string, taskId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId), {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[TasksRepository]', `Task deleted: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Hard delete a task
   */
  async hardDelete(blueprintId: string, taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId));
      this.logger.info('[TasksRepository]', `Task hard deleted: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'hardDelete failed', error as Error);
      throw error;
    }
  }

  /**
   * Get task count by status
   */
  async getCountByStatus(blueprintId: string): Promise<Record<TaskStatus, number>> {
    try {
      const snapshot = await getDocs(query(this.getTasksCollection(blueprintId), where('deletedAt', '==', null)));

      const counts: Record<TaskStatus, number> = {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.ON_HOLD]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data['status'] && data['status'] in counts) {
          counts[data['status'] as TaskStatus]++;
        }
      });

      return counts;
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'getCountByStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * Create a child task under a parent task
   * 建立子任務
   *
   * Automatically sets the parentId to link the child to parent.
   * Inherits blueprintId and optionally other properties from parent.
   *
   * @param blueprintId - Blueprint ID
   * @param parentId - Parent task ID
   * @param data - Task creation data
   * @returns Created child task
   */
  async createChildTask(blueprintId: string, parentId: string, data: CreateTaskRequest): Promise<Task> {
    try {
      // Automatically set parentId
      const childData: CreateTaskRequest = {
        ...data,
        parentId
      };

      // Create the task with parentId set
      const childTask = await this.create(blueprintId, childData);

      this.logger.info('[TasksRepository]', `Child task created: ${childTask.id} under parent: ${parentId}`);
      return childTask;
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'createChildTask failed', error as Error);
      throw error;
    }
  }

  /**
   * Get all direct children of a parent task
   * 獲取任務的所有子任務
   *
   * Returns only immediate children (depth = 1).
   * Does not recursively fetch grandchildren.
   *
   * @param blueprintId - Blueprint ID
   * @param parentId - Parent task ID
   * @returns Array of child tasks
   */
  async getChildren(blueprintId: string, parentId: string): Promise<Task[]> {
    try {
      const constraints: QueryConstraint[] = [where('parentId', '==', parentId), where('deletedAt', '==', null)];

      const q = query(this.getTasksCollection(blueprintId), ...constraints);
      const snapshot = await getDocs(q);

      const children = snapshot.docs.map(docSnap => this.toTask(docSnap.data(), docSnap.id));

      // Sort by createdAt desc (newest first)
      children.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });

      this.logger.info('[TasksRepository]', `Found ${children.length} children for parent: ${parentId}`);
      return children;
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'getChildren failed', error as Error);
      throw error;
    }
  }

  /**
   * Clone an existing task
   * 複製任務
   *
   * Creates a copy of the source task with optional property resets.
   * Does NOT clone child tasks by default.
   *
   * @param blueprintId - Blueprint ID
   * @param sourceTaskId - Source task ID to clone
   * @param creatorId - ID of user creating the clone
   * @param options - Clone options (reset dates, assignee, etc.)
   * @returns Cloned task
   */
  async cloneTask(
    blueprintId: string,
    sourceTaskId: string,
    creatorId: string,
    options?: {
      resetDates?: boolean;
      resetAssignee?: boolean;
      includeChildren?: boolean;
      newParentId?: string | null;
    }
  ): Promise<Task> {
    try {
      // Fetch source task
      const source = await from(this.findById(blueprintId, sourceTaskId)).toPromise();

      if (!source) {
        throw new Error(`Source task not found: ${sourceTaskId}`);
      }

      // Build clone data
      const cloneData: CreateTaskRequest = {
        title: `${source.title} (副本)`,
        description: source.description,
        priority: source.priority,
        estimatedHours: source.estimatedHours,
        estimatedBudget: source.estimatedBudget,
        actualBudget: source.actualBudget,
        progress: 0, // Reset progress
        tags: source.tags || [],
        dependencies: [], // Don't clone dependencies
        metadata: { ...source.metadata, clonedFrom: sourceTaskId },
        creatorId,
        creatorName: source.creatorName,
        // Conditional properties based on options
        assigneeId: options?.resetAssignee ? undefined : source.assigneeId,
        assigneeName: options?.resetAssignee ? undefined : source.assigneeName,
        dueDate: options?.resetDates ? undefined : source.dueDate,
        startDate: options?.resetDates ? undefined : source.startDate,
        parentId: options?.newParentId !== undefined ? options.newParentId : source.parentId
      };

      // Create the cloned task
      const clonedTask = await this.create(blueprintId, cloneData);

      this.logger.info('[TasksRepository]', `Task cloned: ${clonedTask.id} from source: ${sourceTaskId}`);
      return clonedTask;
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'cloneTask failed', error as Error);
      throw error;
    }
  }
}
