import { Injectable, inject } from '@angular/core';
import { query, where, orderBy, limit as firestoreLimit, Timestamp, DocumentData } from '@angular/fire/firestore';
import { TaskStatus, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/domain/types/task/task.types';
import { TaskWithWBS, TaskDependency } from '@core/domain/types/task/task-wbs.types';

import { FirestoreBaseRepository } from './base/firestore-base.repository';

/**
 * Task Firestore Repository
 * 任務 Firestore Repository
 *
 * Implements Task CRUD operations using Firestore with:
 * - Firestore Security Rules enforcement
 * - Automatic retry on failures
 * - Organization-based isolation
 * - Soft delete support
 *
 * Replaces TaskSupabaseRepository in migration to @angular/fire
 *
 * @extends FirestoreBaseRepository<Task>
 */
@Injectable({
  providedIn: 'root'
})
export class TaskFirestoreRepository extends FirestoreBaseRepository<TaskWithWBS> {
  protected override collectionName = 'tasks';
  /**
   * Convert Firestore document to Task entity
   */
  protected override toEntity(data: DocumentData, id: string): TaskWithWBS {
    const dependencies = this.mapDependencies(data['dependencies']);

    return {
      id,
      blueprintId: data['blueprint_id'] || data['blueprintId'],
      title: data['title'],
      description: data['description'],
      status: this.mapStatus(data['status']),
      assigneeType: data['assignee_type'] || data['assigneeType'],
      assigneeId: data['assignee_id'] || data['assigneeId'],
      assigneeName: data['assignee_name'] || data['assigneeName'],
      assigneeTeamId: data['assignee_team_id'] || data['assigneeTeamId'],
      assigneeTeamName: data['assignee_team_name'] || data['assigneeTeamName'],
      assigneePartnerId: data['assignee_partner_id'] || data['assigneePartnerId'],
      assigneePartnerName: data['assignee_partner_name'] || data['assigneePartnerName'],
      creatorId: data['creator_id'] || data['creatorId'],
      dueDate: data['due_date'] ? this.toDate(data['due_date']) : undefined,
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at']),
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null,
      priority: data['priority'],
      tags: data['tags'] || [],
      attachments: data['attachments'] || [],
      metadata: data['metadata'] || {},
      parentId: data['parent_id'] ?? data['parentId'] ?? null,
      level: data['level'],
      orderIndex: data['order_index'] ?? data['orderIndex'],
      wbsCode: data['wbs_code'] ?? data['wbsCode'],
      path: data['path'] ?? data['ancestor_path'],
      progress: data['progress'] ?? data['completion'] ?? 0,
      plannedStartDate: this.optionalDate(data['planned_start_date']),
      plannedEndDate: this.optionalDate(data['planned_end_date']),
      actualStartDate: this.optionalDate(data['actual_start_date']),
      actualEndDate: this.optionalDate(data['actual_end_date']),
      estimatedHours: data['estimated_hours'] ?? data['estimatedHours'],
      actualHours: data['actual_hours'] ?? data['actualHours'],
      dependencies: dependencies.dependencyIds,
      dependencyDetails: dependencies.details,
      blockedBy: data['blocked_by'] ?? data['blockedBy']
    };
  }

  /**
   * Convert Task entity to Firestore document
   */
  protected override toDocument(task: Partial<TaskWithWBS>): DocumentData {
    const doc: DocumentData = {};

    if (task.blueprintId) doc['blueprint_id'] = task.blueprintId;
    if (task.title) doc['title'] = task.title;
    if (task.description !== undefined) doc['description'] = task.description;
    if (task.status) doc['status'] = task.status.toUpperCase();
    if (task.assigneeType !== undefined) doc['assignee_type'] = task.assigneeType;
    if (task.assigneeId !== undefined) doc['assignee_id'] = task.assigneeId;
    if (task.assigneeName !== undefined) doc['assignee_name'] = task.assigneeName;
    if (task.assigneeTeamId !== undefined) doc['assignee_team_id'] = task.assigneeTeamId;
    if (task.assigneeTeamName !== undefined) doc['assignee_team_name'] = task.assigneeTeamName;
    if (task.assigneePartnerId !== undefined) doc['assignee_partner_id'] = task.assigneePartnerId;
    if (task.assigneePartnerName !== undefined) doc['assignee_partner_name'] = task.assigneePartnerName;
    if (task.creatorId) doc['creator_id'] = task.creatorId;
    if (task.dueDate !== undefined) {
      doc['due_date'] = task.dueDate ? Timestamp.fromDate(task.dueDate) : null;
    }
    if (task.priority) doc['priority'] = task.priority.toUpperCase();
    if (task.tags) doc['tags'] = task.tags;
    if (task.attachments) doc['attachments'] = task.attachments;
    if (task.metadata) doc['metadata'] = task.metadata;
    if (task.parentId !== undefined) doc['parent_id'] = task.parentId ?? null;
    if (task.level !== undefined) doc['level'] = task.level;
    if (task.orderIndex !== undefined) doc['order_index'] = task.orderIndex;
    if (task.wbsCode !== undefined) doc['wbs_code'] = task.wbsCode;
    if (task.path !== undefined) doc['path'] = task.path;
    if (task.progress !== undefined) doc['progress'] = task.progress;
    if (task.plannedStartDate !== undefined) {
      doc['planned_start_date'] = task.plannedStartDate ? Timestamp.fromDate(task.plannedStartDate) : null;
    }
    if (task.plannedEndDate !== undefined) {
      doc['planned_end_date'] = task.plannedEndDate ? Timestamp.fromDate(task.plannedEndDate) : null;
    }
    if (task.actualStartDate !== undefined) {
      doc['actual_start_date'] = task.actualStartDate ? Timestamp.fromDate(task.actualStartDate) : null;
    }
    if (task.actualEndDate !== undefined) {
      doc['actual_end_date'] = task.actualEndDate ? Timestamp.fromDate(task.actualEndDate) : null;
    }
    if (task.estimatedHours !== undefined) doc['estimated_hours'] = task.estimatedHours;
    if (task.actualHours !== undefined) doc['actual_hours'] = task.actualHours;
    if (task.dependencies !== undefined) doc['dependencies'] = task.dependencies;
    if (task.dependencyDetails !== undefined) doc['dependency_details'] = task.dependencyDetails;
    if (task.blockedBy !== undefined) doc['blocked_by'] = task.blockedBy;

    return doc;
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  private optionalDate(value: any): Date | undefined {
    if (!value) return undefined;
    return this.toDate(value);
  }

  private mapDependencies(
    value: any
  ): {
    dependencyIds: string[];
    details?: TaskDependency[];
  } {
    if (!value) {
      return { dependencyIds: [] };
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { dependencyIds: [] };
      }

      if (typeof value[0] === 'string') {
        return { dependencyIds: value as string[] };
      }

      const details = (value as TaskDependency[]).filter(dep => !!dep?.taskId);
      return { dependencyIds: details.map(dep => dep.taskId), details };
    }

    return { dependencyIds: [] };
  }

  /**
   * Map database status to TaskStatus enum
   */
  private mapStatus(status: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      TODO: TaskStatus.PENDING,
      PENDING: TaskStatus.PENDING,
      IN_PROGRESS: TaskStatus.IN_PROGRESS,
      IN_REVIEW: TaskStatus.ON_HOLD,
      REVIEW: TaskStatus.ON_HOLD,
      ON_HOLD: TaskStatus.ON_HOLD,
      COMPLETED: TaskStatus.COMPLETED,
      CANCELLED: TaskStatus.CANCELLED
    };

    return statusMap[status?.toUpperCase()] || TaskStatus.PENDING;
  }

  /**
   * Find task by ID
   * 根據 ID 查找任務
   */
  async findById(id: string): Promise<TaskWithWBS | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }

  /**
   * Find tasks by blueprint
   * 根據藍圖查找任務
   */
  async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<TaskWithWBS[]> {
    return this.executeWithRetry(async () => {
      const constraints: any[] = [where('blueprint_id', '==', blueprintId)];

      // Apply filters
      if (options?.status) {
        constraints.push(where('status', '==', options.status.toUpperCase()));
      }

      if (options?.assigneeId) {
        constraints.push(where('assignee_id', '==', options.assigneeId));
      }

      if (options?.creatorId) {
        constraints.push(where('creator_id', '==', options.creatorId));
      }

      // Handle deleted filter
      if (!options?.includeDeleted) {
        constraints.push(where('deleted_at', '==', null));
      }

      // Sort by created_at descending
      constraints.push(orderBy('created_at', 'desc'));

      // Apply limit
      if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const q = query(this.collectionRef, ...constraints);
      return this.queryDocuments(q);
    });
  }

  /**
   * Find tasks with options
   * 使用選項查找任務
   */
  async findWithOptions(options: TaskQueryOptions): Promise<TaskWithWBS[]> {
    return this.executeWithRetry(async () => {
      const constraints: any[] = [];

      // Apply filters
      if (options.blueprintId) {
        constraints.push(where('blueprint_id', '==', options.blueprintId));
      }

      if (options.status) {
        constraints.push(where('status', '==', options.status.toUpperCase()));
      }

      if (options.assigneeId) {
        constraints.push(where('assignee_id', '==', options.assigneeId));
      }

      if (options.creatorId) {
        constraints.push(where('creator_id', '==', options.creatorId));
      }

      // Handle deleted filter
      if (!options.includeDeleted) {
        constraints.push(where('deleted_at', '==', null));
      }

      // Sort by created_at descending
      constraints.push(orderBy('created_at', 'desc'));

      // Apply limit
      if (options.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const q = query(this.collectionRef, ...constraints);
      return this.queryDocuments(q);
    });
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async create(blueprintId: string, payload: CreateTaskRequest & Partial<TaskWithWBS>): Promise<TaskWithWBS> {
    return this.executeWithRetry(async () => {
      const doc: DocumentData = {
        // Note: blueprintId removed from CreateTaskRequest, passed as parameter
        blueprint_id: blueprintId,
        title: payload.title,
        description: payload.description || '',
        status: (payload.status || TaskStatus.PENDING).toUpperCase(),
        assignee_id: payload.assigneeId || null,
        creator_id: payload.creatorId,
        due_date: payload.dueDate ? Timestamp.fromDate(payload.dueDate) : null,
        priority: payload.priority?.toUpperCase() || 'MEDIUM',
        tags: payload.tags || [],
        attachments: [],
        metadata: {},
        parent_id: payload.parentId ?? null,
        level: payload.level ?? null,
        order_index: payload.orderIndex ?? null,
        wbs_code: payload.wbsCode ?? null,
        path: payload.path ?? null,
        progress: payload.progress ?? null,
        planned_start_date: payload.plannedStartDate ? Timestamp.fromDate(payload.plannedStartDate) : null,
        planned_end_date: payload.plannedEndDate ? Timestamp.fromDate(payload.plannedEndDate) : null,
        actual_start_date: payload.actualStartDate ? Timestamp.fromDate(payload.actualStartDate) : null,
        actual_end_date: payload.actualEndDate ? Timestamp.fromDate(payload.actualEndDate) : null,
        estimated_hours: payload.estimatedHours ?? null,
        actual_hours: payload.actualHours ?? null,
        dependencies: payload.dependencies ?? [],
        blocked_by: payload.blockedBy ?? []
      };

      const task = await this.createDocument(doc as Partial<TaskWithWBS>);

      this.logger.info('[TaskFirestoreRepository]', `Task created with ID: ${task.id}`);

      return task;
    });
  }

  /**
   * Update task
   * 更新任務
   */
  async update(id: string, payload: UpdateTaskRequest & Partial<TaskWithWBS>): Promise<void> {
    return this.executeWithRetry(async () => {
      const doc = this.toDocument(payload);

      await this.updateDocument(id, doc as Partial<TaskWithWBS>);

      this.logger.info('[TaskFirestoreRepository]', `Task updated: ${id}`);
    });
  }

  /**
   * Update task status
   * 更新任務狀態
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.updateDocument(id, {
        status: status.toUpperCase()
      } as any);

      this.logger.info('[TaskFirestoreRepository]', `Task status updated: ${id} -> ${status}`);
    });
  }

  /**
   * Soft delete task
   * 軟刪除任務
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.deleteDocument(id, false);

      this.logger.info('[TaskFirestoreRepository]', `Task soft deleted: ${id}`);
    });
  }

  /**
   * Hard delete task (permanent)
   * 永久刪除任務
   */
  async hardDelete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.deleteDocument(id, true);

      this.logger.info('[TaskFirestoreRepository]', `Task hard deleted: ${id}`);
    });
  }

  /**
   * Restore soft-deleted task
   * 恢復軟刪除的任務
   */
  async restore(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.updateDocument(id, {
        deleted_at: null
      } as any);

      this.logger.info('[TaskFirestoreRepository]', `Task restored: ${id}`);
    });
  }

  /**
   * Count tasks by status
   * 按狀態統計任務數量
   */
  async countByStatus(blueprintId: string): Promise<Record<TaskStatus, number>> {
    return this.executeWithRetry(async () => {
      const q = query(this.collectionRef, where('blueprint_id', '==', blueprintId), where('deleted_at', '==', null));

       const tasks = await this.queryDocuments(q);

      // Initialize counts
      const counts: Record<TaskStatus, number> = {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.ON_HOLD]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0
      };

      // Count by status
      tasks.forEach(task => {
        counts[task.status] = (counts[task.status] || 0) + 1;
      });

      return counts;
    });
  }
}
