import { computed, inject, Injectable, signal } from '@angular/core';
import { TaskFirestoreRepository } from '@core/data-access/repositories/task-firestore.repository';
import { TaskStatus } from '@core/domain/types/task/task.types';
import { TaskWithWBS } from '@core/domain/types/task/task-wbs.types';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskRepository = inject(TaskFirestoreRepository);

  private readonly _tasks = signal<TaskWithWBS[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedTaskId = signal<string | null>(null);

  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  selectedTaskId = this._selectedTaskId.asReadonly();

  selectedTask = computed(() => {
    const id = this._selectedTaskId();
    if (!id) return null;
    return this._tasks().find(task => task.id === id) ?? null;
  });

  rootTasks = computed(() => this._tasks().filter(task => !task.parentId));

  tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus | 'archived', TaskWithWBS[]> = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.ON_HOLD]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
      archived: []
    };

    this._tasks().forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped.archived.push(task);
      }
    });

    return grouped;
  });

  statistics = computed(() => {
    const tasks = this._tasks();
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const progressSum = tasks.reduce((sum, task) => sum + (task.progress ?? 0), 0);

    return {
      total,
      completed,
      pending: tasks.filter(task => task.status === TaskStatus.PENDING).length,
      inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProgress: total > 0 ? Math.round(progressSum / total) : 0
    };
  });

  loadTasks(blueprintId: string): void {
    if (!blueprintId) return;
    this._loading.set(true);
    this._error.set(null);

    void this.taskRepository
      .findByBlueprint(blueprintId, { includeDeleted: false })
      .then(tasks => this._tasks.set(tasks.map(task => this.normalizeTask(task))))
      .catch(error => {
        this._error.set(error instanceof Error ? error.message : 'Unknown error');
      })
      .finally(() => this._loading.set(false));
  }

  selectTask(taskId: string | null): void {
    this._selectedTaskId.set(taskId);
  }

  createTask(blueprintId: string, task: Omit<TaskWithWBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskWithWBS> {
    return this.taskRepository.create(blueprintId, task).then(created => {
      const normalized = this.normalizeTask(created);
      this._tasks.update(tasks => [...tasks, normalized]);
      return normalized;
    });
  }

  updateTask(id: string, updates: Partial<TaskWithWBS>): Promise<void> {
    return this.taskRepository.update(id, updates).then(() => {
      this._tasks.update(tasks => tasks.map(task => (task.id === id ? { ...task, ...updates } : task)));
    });
  }

  deleteTask(id: string): Promise<void> {
    return this.taskRepository.delete(id).then(() => {
      this._tasks.update(tasks => tasks.filter(task => task.id !== id));
    });
  }

  clear(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._selectedTaskId.set(null);
  }

  private normalizeTask(task: TaskWithWBS): TaskWithWBS {
    return {
      ...task,
      progress: task.progress ?? 0,
      level: task.level ?? 0,
      orderIndex: task.orderIndex ?? 0,
      path: task.path ?? [],
      parentId: task.parentId ?? null
    };
  }
}
