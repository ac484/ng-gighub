import { Injectable, computed, inject, signal } from '@angular/core';
import { TaskStatus } from '@core/types/task/task.types';

import { TaskWithWBS } from '../data-access/models/task.model';
import { TasksRepository } from '../data-access/repositories/task.repository';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(TasksRepository);

  private readonly _tasks = signal<TaskWithWBS[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedTaskId = signal<string | null>(null);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedTaskId = this._selectedTaskId.asReadonly();

  readonly selectedTask = computed(() => {
    const id = this._selectedTaskId();
    if (!id) return null;
    return this._tasks().find(task => task.id === id) ?? null;
  });

  readonly rootTasks = computed(() => this._tasks().filter(task => !task.parentId));

  readonly statistics = computed(() => {
    const tasks = this._tasks();
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const progressTotal = tasks.reduce((sum, task) => sum + (task.progress ?? 0), 0);

    return {
      total,
      completed,
      pending: tasks.filter(task => task.status === TaskStatus.PENDING).length,
      inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProgress: total > 0 ? Math.round(progressTotal / total) : 0
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
      this._error.set(error instanceof Error ? error.message : 'Failed to load tasks');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  selectTask(taskId: string | null): void {
    this._selectedTaskId.set(taskId);
  }

  async createTask(task: Omit<TaskWithWBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskWithWBS> {
    try {
      const created = await this.repository.create(task as TaskWithWBS);
      this._tasks.update(tasks => [...tasks, created]);
      return created;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to create task');
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<TaskWithWBS>): Promise<void> {
    try {
      const updated = await this.repository.update(id, updates);
      this._tasks.update(tasks => tasks.map(task => (task.id === id ? { ...task, ...updated } : task)));
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to update task');
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      this._tasks.update(tasks => tasks.filter(task => task.id !== id));
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to delete task');
      throw error;
    }
  }
}
