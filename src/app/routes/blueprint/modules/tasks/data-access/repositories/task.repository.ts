import { inject, Injectable } from '@angular/core';
import { TaskFirestoreRepository } from '@core/data-access/repositories/task-firestore.repository';
import { TaskWithWBS } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly taskRepository = inject(TaskFirestoreRepository);

  findByBlueprintId(blueprintId: string): Promise<TaskWithWBS[]> {
    return this.taskRepository.findByBlueprint(blueprintId);
  }
}
