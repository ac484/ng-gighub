import { Injectable } from '@angular/core';
import { query, where, orderBy, limit as firestoreLimit, Timestamp, DocumentData } from '@angular/fire/firestore';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/types/task/task.types';

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
export class TaskFirestoreRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';

  /**
   * Convert Firestore document to Task entity
   */
  protected toEntity(data: DocumentData, id: string): Task {
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
      metadata: data['metadata'] || {}
    };
  }

  /**
   * Convert Task entity to Firestore document
   */
  protected override toDocument(task: Partial<Task>): DocumentData {
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
  async findById(id: string): Promise<Task | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }

  /**
   * Find tasks by blueprint
   * 根據藍圖查找任務
   */
  async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]> {
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
  async findWithOptions(options: TaskQueryOptions): Promise<Task[]> {
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
  async create(blueprintId: string, payload: CreateTaskRequest): Promise<Task> {
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
        metadata: {}
      };

      const task = await this.createDocument(doc as Partial<Task>);

      this.logger.info('[TaskFirestoreRepository]', `Task created with ID: ${task.id}`);

      return task;
    });
  }

  /**
   * Update task
   * 更新任務
   */
  async update(id: string, payload: UpdateTaskRequest): Promise<void> {
    return this.executeWithRetry(async () => {
      const doc = this.toDocument(payload);

      await this.updateDocument(id, doc as Partial<Task>);

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
