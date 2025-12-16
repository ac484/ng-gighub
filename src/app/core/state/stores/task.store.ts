import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';
import { EventBus } from '@core/blueprint/events/event-bus';
import { SystemEventType } from '@core/blueprint/events/types/system-event-type.enum';
import {
  AuditLogRepository,
  CreateAuditLogData,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';
import { TASKS_MODULE_EVENTS } from '@core/blueprint/modules/implementations/tasks/module.metadata';
import { TasksRepository } from '@core/blueprint/modules/implementations/tasks/tasks.repository';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '@core/types/task';
import { firstValueFrom } from 'rxjs';

/**
 * Task Store
 * 任務 Store
 *
 * Following Occam's Razor: Simple signal-based state management
 * Using Angular 20 Signals for reactive state
 *
 * Unified store consolidating TaskStore and TasksService functionality
 * Includes audit logging for all task operations
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */
@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private readonly repository = inject(TasksRepository);
  private readonly auditLogRepository = inject(AuditLogRepository);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EventBus);
  private readonly enhancedEventBus = inject(EnhancedEventBusService);

  // Private state
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentBlueprintId = signal<string | null>(null);

  // Public readonly state
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals for task filtering
  readonly pendingTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.PENDING));

  readonly inProgressTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.IN_PROGRESS));

  readonly onHoldTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.ON_HOLD));

  readonly completedTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.COMPLETED));

  readonly cancelledTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.CANCELLED));

  // Computed signals for priority filtering
  readonly tasksByPriority = computed(() => {
    const tasks = this._tasks();
    return {
      critical: tasks.filter(t => t.priority === TaskPriority.CRITICAL),
      high: tasks.filter(t => t.priority === TaskPriority.HIGH),
      medium: tasks.filter(t => t.priority === TaskPriority.MEDIUM),
      low: tasks.filter(t => t.priority === TaskPriority.LOW)
    };
  });

  // Computed signals for statistics
  readonly taskCount = computed(() => this._tasks().length);

  readonly taskStats = computed(() => {
    const tasks = this._tasks();
    const pending = this.pendingTasks().length;
    const inProgress = this.inProgressTasks().length;
    const completed = this.completedTasks().length;
    const total = tasks.length;

    return {
      total,
      pending,
      inProgress,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  /**
   * Load tasks for a blueprint
   * 載入藍圖的任務
   */
  async loadTasks(blueprintId: string): Promise<void> {
    if (!blueprintId) {
      this.logger.warn('[TaskStore]', 'loadTasks called with empty blueprintId');
      return;
    }

    // Check if already loading for this blueprint
    if (this._currentBlueprintId() === blueprintId && this._loading()) {
      this.logger.info('[TaskStore]', `Already loading tasks for blueprint: ${blueprintId}`);
      return;
    }

    this._currentBlueprintId.set(blueprintId);
    this._loading.set(true);
    this._error.set(null);

    try {
      this.logger.info('[TaskStore]', `Fetching tasks for blueprint: ${blueprintId}`);
      const tasks = await firstValueFrom(this.repository.findByBlueprintId(blueprintId));
      this._tasks.set(tasks);
      this.logger.info('[TaskStore]', `Loaded ${tasks.length} tasks for blueprint: ${blueprintId}`, { tasks });

      // Emit event that tasks have been loaded
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_LOADED,
        {
          blueprintId,
          count: tasks.length
        },
        'tasks-module'
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', `Failed to load tasks for blueprint: ${blueprintId}`, err instanceof Error ? err : undefined);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async createTask(blueprintId: string, request: CreateTaskRequest): Promise<Task> {
    try {
      const newTask = await this.repository.create(blueprintId, request);

      // Update local state
      this._tasks.update(tasks => [newTask, ...tasks]);

      // Emit event to EventBus
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_CREATED,
        {
          taskId: newTask.id,
          blueprintId,
          task: newTask
        },
        'tasks-module'
      );

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.TASK_CREATED,
        category: AuditCategory.DATA,
        severity: AuditSeverity.INFO,
        actorId: request.creatorId,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: newTask.id!,
        action: '建立任務',
        message: `任務已建立: ${newTask.title}`,
        status: AuditStatus.SUCCESS
      });

      this.logger.info('[TaskStore]', `Task created: ${newTask.id}`);
      return newTask;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to create task', err as Error);
      throw err;
    }
  }

  /**
   * Update a task
   * 更新任務
   */
  async updateTask(blueprintId: string, taskId: string, data: UpdateTaskRequest, actorId: string): Promise<void> {
    try {
      await this.repository.update(blueprintId, taskId, data);

      // Update local state
      this._tasks.update(tasks => tasks.map(task => (task.id === taskId ? { ...task, ...data, updatedAt: new Date() } : task)));

      // Emit event to EventBus
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_UPDATED,
        {
          taskId,
          blueprintId,
          updates: data
        },
        'tasks-module'
      );

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

      this.logger.info('[TaskStore]', `Task updated: ${taskId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to update task', err as Error);
      throw err;
    }
  }

  /**
   * Delete a task
   * 刪除任務
   */
  async deleteTask(blueprintId: string, taskId: string, actorId: string): Promise<void> {
    try {
      await this.repository.delete(blueprintId, taskId);

      // Remove from local state
      this._tasks.update(tasks => tasks.filter(task => task.id !== taskId));

      // Emit event to EventBus
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_DELETED,
        {
          taskId,
          blueprintId
        },
        'tasks-module'
      );

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

      this.logger.info('[TaskStore]', `Task deleted: ${taskId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to delete task', err as Error);
      throw err;
    }
  }

  /**
   * Update task status
   * 更新任務狀態
   */
  async updateTaskStatus(blueprintId: string, taskId: string, status: TaskStatus, actorId: string): Promise<void> {
    const updateData: UpdateTaskRequest = { status };

    if (status === TaskStatus.COMPLETED) {
      updateData.completedDate = new Date();
      updateData.progress = 100;

      // Emit task completed event to module EventBus
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_COMPLETED,
        {
          taskId,
          blueprintId
        },
        'tasks-module'
      );

      // Emit to EnhancedEventBus for WorkflowOrchestrator (SETC-020: Task → Log automation)
      this.enhancedEventBus.emitEvent({
        type: SystemEventType.TASK_COMPLETED,
        blueprintId,
        timestamp: new Date(),
        actor: {
          userId: actorId,
          userName: 'System',
          role: 'user'
        },
        data: {
          taskId,
          blueprintId,
          completedAt: new Date(),
          completedBy: actorId
        }
      });

      this.logger.info('[TaskStore]', `Task ${taskId} completed, emitting TASK_COMPLETED event for workflow automation`);
    }

    await this.updateTask(blueprintId, taskId, updateData, actorId);

    // Emit status changed event
    this.eventBus.emit(
      TASKS_MODULE_EVENTS.TASK_STATUS_CHANGED,
      {
        taskId,
        blueprintId,
        status
      },
      'tasks-module'
    );
  }

  /**
   * Assign task to user
   * 分配任務給使用者
   */
  async assignTask(blueprintId: string, taskId: string, assigneeId: string, assigneeName: string, actorId: string): Promise<void> {
    await this.updateTask(blueprintId, taskId, { assigneeId, assigneeName }, actorId);

    // Emit task assigned event
    this.eventBus.emit(
      TASKS_MODULE_EVENTS.TASK_ASSIGNED,
      {
        taskId,
        blueprintId,
        assigneeId,
        assigneeName
      },
      'tasks-module'
    );
  }

  /**
   * Get task statistics
   * 獲取任務統計
   */
  async getTaskStatistics(blueprintId: string): Promise<Record<string, number>> {
    try {
      return await this.repository.getCountByStatus(blueprintId);
    } catch (err) {
      this.logger.error('[TaskStore]', 'Failed to get task statistics', err as Error);
      throw err;
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store
   * 重置 Store
   */
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._currentBlueprintId.set(null);
  }

  /**
   * Create a child task under a parent task
   * 建立子任務
   *
   * Automatically sets parentId and emits TASK_CHILD_CREATED event.
   *
   * @param blueprintId - Blueprint ID
   * @param parentId - Parent task ID
   * @param data - Task creation data
   * @param actorId - ID of user creating the child task
   * @returns Created child task
   */
  async createChildTask(blueprintId: string, parentId: string, data: CreateTaskRequest, actorId: string): Promise<Task> {
    try {
      const childTask = await this.repository.createChildTask(blueprintId, parentId, data);

      // Update local state
      this._tasks.update(tasks => [childTask, ...tasks]);

      // Emit TASK_CHILD_CREATED event
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_CHILD_CREATED,
        {
          taskId: childTask.id,
          blueprintId,
          parentId,
          task: childTask
        },
        'tasks-module'
      );

      // Also emit general TASK_CREATED event
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_CREATED,
        {
          taskId: childTask.id,
          blueprintId,
          task: childTask
        },
        'tasks-module'
      );

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.TASK_CREATED,
        category: AuditCategory.DATA,
        severity: AuditSeverity.INFO,
        actorId,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: childTask.id!,
        action: '建立子任務',
        message: `子任務已建立: ${childTask.title} (父任務: ${parentId})`,
        status: AuditStatus.SUCCESS,
        metadata: { parentId }
      });

      this.logger.info('[TaskStore]', `Child task created: ${childTask.id} under parent: ${parentId}`);
      return childTask;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to create child task', err as Error);
      throw err;
    }
  }

  /**
   * Get all direct children of a parent task
   * 獲取任務的所有子任務
   *
   * @param blueprintId - Blueprint ID
   * @param parentId - Parent task ID
   * @returns Array of child tasks
   */
  async getChildren(blueprintId: string, parentId: string): Promise<Task[]> {
    try {
      const children = await this.repository.getChildren(blueprintId, parentId);
      this.logger.info('[TaskStore]', `Retrieved ${children.length} children for parent: ${parentId}`);
      return children;
    } catch (err) {
      this.logger.error('[TaskStore]', 'Failed to get children tasks', err as Error);
      throw err;
    }
  }

  /**
   * Clone an existing task
   * 複製任務
   *
   * Creates a copy of the source task with optional property resets.
   * Emits TASK_CLONED event.
   *
   * @param blueprintId - Blueprint ID
   * @param sourceTaskId - Source task ID to clone
   * @param actorId - ID of user cloning the task
   * @param options - Clone options (reset dates, assignee, etc.)
   * @returns Cloned task
   */
  async cloneTask(
    blueprintId: string,
    sourceTaskId: string,
    actorId: string,
    options?: {
      resetDates?: boolean;
      resetAssignee?: boolean;
      includeChildren?: boolean;
      newParentId?: string | null;
    }
  ): Promise<Task> {
    try {
      const clonedTask = await this.repository.cloneTask(blueprintId, sourceTaskId, actorId, options);

      // Update local state
      this._tasks.update(tasks => [clonedTask, ...tasks]);

      // Emit TASK_CLONED event
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_CLONED,
        {
          taskId: clonedTask.id,
          blueprintId,
          sourceTaskId,
          task: clonedTask
        },
        'tasks-module'
      );

      // Also emit general TASK_CREATED event
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.TASK_CREATED,
        {
          taskId: clonedTask.id,
          blueprintId,
          task: clonedTask
        },
        'tasks-module'
      );

      // Log audit event
      await this.logAuditEvent(blueprintId, {
        blueprintId,
        eventType: AuditEventType.TASK_CREATED,
        category: AuditCategory.DATA,
        severity: AuditSeverity.INFO,
        actorId,
        actorType: ActorType.USER,
        resourceType: 'task',
        resourceId: clonedTask.id!,
        action: '複製任務',
        message: `任務已複製: ${clonedTask.title} (來源: ${sourceTaskId})`,
        status: AuditStatus.SUCCESS,
        metadata: { sourceTaskId, cloneOptions: options }
      });

      this.logger.info('[TaskStore]', `Task cloned: ${clonedTask.id} from source: ${sourceTaskId}`);
      return clonedTask;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to clone task', err as Error);
      throw err;
    }
  }

  /**
   * Log audit event
   * 記錄審計事件
   *
   * @private
   */
  private async logAuditEvent(blueprintId: string, data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditLogRepository.create({ ...data, blueprintId });
    } catch (err) {
      // Don't fail the main operation if audit logging fails
      this.logger.warn('[TaskStore]', 'Audit logging failed');
    }
  }
}
