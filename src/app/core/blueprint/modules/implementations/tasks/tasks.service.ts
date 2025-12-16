/**
 * Tasks Service
 *
 * @deprecated This service has been consolidated into TaskStore
 * Please use TaskStore from @core/state/stores/task.store instead
 *
 * Migration guide:
 * - TasksService → TaskStore
 * - All methods have been moved with the same signatures
 * - Audit logging functionality is now integrated in TaskStore
 *
 * This file will be removed in a future version.
 *
 * Business logic layer for task management.
 * Orchestrates between repository and UI, handles validation and business rules.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 * @deprecated 2025-12-12
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core';
import {
  AuditLogRepository,
  CreateAuditLogData,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';

import {
  TasksRepository,
  TaskDocument,
  CreateTaskData,
  UpdateTaskData,
  TaskStatus,
  TaskPriority,
  TaskQueryOptions
} from './tasks.repository';

/**
 * Tasks Service
 *
 * @deprecated Use TaskStore from @core/state/stores/task.store instead
 *
 * Manages task operations with business logic and audit logging.
 */
@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly repository = inject(TasksRepository);
  private readonly auditLogRepository = inject(AuditLogRepository);
  private readonly logger = inject(LoggerService);

  // State signals
  private _tasks = signal<TaskDocument[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentBlueprintId = signal<string | null>(null);

  // Public readonly signals
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly pendingTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.PENDING));

  readonly inProgressTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.IN_PROGRESS));

  readonly completedTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.COMPLETED));

  readonly tasksByPriority = computed(() => {
    const tasks = this._tasks();
    return {
      critical: tasks.filter(t => t.priority === TaskPriority.CRITICAL),
      high: tasks.filter(t => t.priority === TaskPriority.HIGH),
      medium: tasks.filter(t => t.priority === TaskPriority.MEDIUM),
      low: tasks.filter(t => t.priority === TaskPriority.LOW)
    };
  });

  readonly taskStats = computed(() => {
    const tasks = this._tasks();
    return {
      total: tasks.length,
      pending: this.pendingTasks().length,
      inProgress: this.inProgressTasks().length,
      completed: this.completedTasks().length,
      completionRate: tasks.length > 0 ? Math.round((this.completedTasks().length / tasks.length) * 100) : 0
    };
  });

  /**
   * Load tasks for a blueprint
   */
  loadTasks(blueprintId: string, options?: TaskQueryOptions): void {
    this._currentBlueprintId.set(blueprintId);
    this._loading.set(true);
    this._error.set(null);

    this.repository
      .findByBlueprintId(blueprintId, options)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: tasks => {
          this._tasks.set(tasks);
          this._loading.set(false);
          this.logger.info('[TasksService]', `Loaded ${tasks.length} tasks`);
        },
        error: err => {
          this._error.set(err.message || 'Failed to load tasks');
          this._loading.set(false);
          this.logger.error('[TasksService]', 'loadTasks failed', err);
        }
      });
  }

  /**
   * Create a new task
   */
  async createTask(blueprintId: string, data: CreateTaskData): Promise<TaskDocument> {
    try {
      const task = await this.repository.create(blueprintId, data);

      // Update local state
      this._tasks.update(tasks => [task, ...tasks]);

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.MODULE_CONFIGURED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.INFO,
        actorId: data.createdBy,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: task.id,
        action: 'create',
        message: `Task created: ${task.title}`,
        status: AuditStatus.SUCCESS
      });

      this.logger.info('[TasksService]', `Task created: ${task.id}`);
      return task;
    } catch (error: any) {
      this.logger.error('[TasksService]', 'createTask failed', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(blueprintId: string, taskId: string, data: UpdateTaskData, actorId: string): Promise<void> {
    try {
      await this.repository.update(blueprintId, taskId, data);

      // Update local state
      this._tasks.update(tasks => tasks.map(t => (t.id === taskId ? { ...t, ...data, updatedAt: new Date() } : t)));

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.MODULE_CONFIGURED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.INFO,
        actorId,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: taskId,
        action: 'update',
        message: `Task updated: ${taskId}`,
        status: AuditStatus.SUCCESS
      });

      this.logger.info('[TasksService]', `Task updated: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksService]', 'updateTask failed', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(blueprintId: string, taskId: string, actorId: string): Promise<void> {
    try {
      await this.repository.delete(blueprintId, taskId);

      // Update local state
      this._tasks.update(tasks => tasks.filter(t => t.id !== taskId));

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.MODULE_CONFIGURED,
        category: AuditCategory.MODULE,
        severity: AuditSeverity.MEDIUM,
        actorId,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: taskId,
        action: 'delete',
        message: `Task deleted: ${taskId}`,
        status: AuditStatus.SUCCESS
      });

      this.logger.info('[TasksService]', `Task deleted: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksService]', 'deleteTask failed', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(blueprintId: string, taskId: string, status: TaskStatus, actorId: string): Promise<void> {
    const updateData: UpdateTaskData = { status };

    if (status === TaskStatus.COMPLETED) {
      updateData.completedDate = new Date();
    }

    await this.updateTask(blueprintId, taskId, updateData, actorId);
  }

  /**
   * Assign task to user
   */
  async assignTask(blueprintId: string, taskId: string, assigneeId: string, assigneeName: string, actorId: string): Promise<void> {
    await this.updateTask(blueprintId, taskId, { assigneeId, assigneeName }, actorId);
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(blueprintId: string): Promise<Record<TaskStatus, number>> {
    try {
      return await this.repository.getCountByStatus(blueprintId);
    } catch (error: any) {
      this.logger.error('[TasksService]', 'getTaskStatistics failed', error);
      throw error;
    }
  }

  /**
   * Clear local state
   */
  clearState(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._currentBlueprintId.set(null);
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(blueprintId: string, data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditLogRepository.create({ ...data, blueprintId });
    } catch (error: any) {
      // Don't fail the main operation if audit logging fails
      this.logger.warn('[TasksService]', 'Audit logging failed', error);
    }
  }
}
