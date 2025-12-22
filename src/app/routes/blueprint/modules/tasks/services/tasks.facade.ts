import { effect, inject, Injectable, Signal } from '@angular/core';
import { TaskStore } from '../state/task.store';
import { TaskViewId, TaskViewStore } from '../state/task-view.store';
import { TaskWithWBS } from '../data-access/models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly taskStore = inject(TaskStore);
  private readonly viewStore = inject(TaskViewStore);

  readonly tasks = this.taskStore.tasks;
  readonly loading = this.taskStore.loading;
  readonly currentView = this.viewStore.currentView;
  readonly expandedNodes = this.viewStore.expandedNodes;

  ensureLoaded(blueprintId: Signal<string | null>): void {
    effect(
      () => {
        const id = blueprintId();
        if (id) {
          this.taskStore.loadTasks(id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  switchView(view: TaskViewId): void {
    this.viewStore.switchView(view);
  }

  toggleNode(nodeId: string): void {
    this.viewStore.toggleNode(nodeId);
  }

  selectTask(taskId: string | null): void {
    this.taskStore.selectTask(taskId);
  }

  addTask(blueprintId: string, task: Omit<TaskWithWBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskWithWBS> {
    return this.taskStore.createTask(blueprintId, task);
  }
}
