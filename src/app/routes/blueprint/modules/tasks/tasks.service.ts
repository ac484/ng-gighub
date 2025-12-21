import { Injectable, computed, inject, signal } from '@angular/core';

import { Task, TaskStatus } from './tasks.model';
import { TasksRepository } from './tasks.repository';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly repository = inject(TasksRepository);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalCount = computed(() => this._tasks().length);
  readonly completedCount = computed(() => this._tasks().filter(task => task.status === 'completed').length);
  readonly inProgressCount = computed(() => this._tasks().filter(task => task.status === 'in-progress').length);
  readonly pendingCount = computed(() => this._tasks().filter(task => task.status === 'pending').length);

  async loadTasks(blueprintId: string): Promise<void> {
    if (!blueprintId) return;
    this._loading.set(true);
    try {
      const tasks = await this.repository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } finally {
      this._loading.set(false);
    }
  }

  async createTask(blueprintId: string, title: string, status: TaskStatus): Promise<Task> {
    const created = await this.repository.createTask({ blueprintId, title, status });
    this._tasks.update(tasks => [created, ...tasks]);
    return created;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.repository.deleteTask(taskId);
    this._tasks.update(tasks => tasks.filter(task => task.id !== taskId));
  }
}
