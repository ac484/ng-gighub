import { Injectable, computed, inject, signal } from '@angular/core';

import { Task, TaskStatus } from './tasks.model';
import { TasksRepository } from './tasks.repository';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly repository = inject(TasksRepository);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = computed(() => this._tasks().length);
  readonly completedCount = computed(() => this._tasks().filter(task => task.status === 'completed').length);
  readonly inProgressCount = computed(() => this._tasks().filter(task => task.status === 'in-progress').length);
  readonly pendingCount = computed(() => this._tasks().filter(task => task.status === 'pending').length);
  readonly tasksByStatus = computed(() => {
    const tasks = this._tasks();
    return {
      pending: tasks.filter(task => task.status === 'pending'),
      inProgress: tasks.filter(task => task.status === 'in-progress'),
      completed: tasks.filter(task => task.status === 'completed')
    };
  });

  async loadTasks(blueprintId: string): Promise<void> {
    if (!blueprintId) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const tasks = await this.repository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : '載入任務失敗';
      this._error.set(message);
    } finally {
      this._loading.set(false);
    }
  }

  async createTask(blueprintId: string, title: string, status: TaskStatus): Promise<Task> {
    const created = await this.repository.createTask({
      blueprintId,
      title,
      status,
      startAt: new Date(),
      dueAt: null,
      parentId: null,
      progress: status === 'completed' ? 100 : 0
    });
    this._tasks.update(tasks => [created, ...tasks]);
    return created;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    await this.repository.updateTask(taskId, updates);
    this._tasks.update(tasks =>
      tasks.map(task => {
        if (task.id !== taskId) return task;
        const next: Task = { ...task, updatedAt: new Date() };
        if (updates.title !== undefined) next.title = updates.title;
        if (updates.status !== undefined) next.status = updates.status;
        if (updates.description !== undefined) next.description = updates.description;
        if (updates.progress !== undefined) next.progress = updates.progress;
        if (updates.startAt !== undefined) next.startAt = updates.startAt;
        if (updates.dueAt !== undefined) next.dueAt = updates.dueAt;
        if (updates.parentId !== undefined) next.parentId = updates.parentId;
        return next;
      })
    );
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    const progress = status === 'completed' ? 100 : status === 'in-progress' ? 50 : 0;
    await this.updateTask(taskId, { status, progress });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.repository.deleteTask(taskId);
    this._tasks.update(tasks => tasks.filter(task => task.id !== taskId));
  }
}
