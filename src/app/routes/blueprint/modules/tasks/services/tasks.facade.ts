import { inject, Injectable, signal } from '@angular/core';
import { TasksRepository } from '../data-access/repositories/task.repository';
import { TaskModel } from '../data-access/models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly repository = inject(TasksRepository);

  private readonly tasks = signal<TaskModel[]>([]);
  private readonly loading = signal(false);

  readonly tasksState = {
    data: this.tasks.asReadonly(),
    loading: this.loading.asReadonly()
  };

  async loadByBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this.tasks.set(result);
    } finally {
      this.loading.set(false);
    }
  }
}
