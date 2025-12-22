import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTableModule } from 'ng-zorro-antd/table';

import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks-gantt-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzProgressModule],
  template: `
    <nz-table [nzData]="ganttTasks()" [nzShowPagination]="false" nzSize="small">
      <thead>
        <tr>
          <th scope="col">任務</th>
          <th scope="col">開始</th>
          <th scope="col">到期</th>
          <th scope="col">進度</th>
        </tr>
      </thead>
      <tbody>
        @for (task of ganttTasks(); track task.id) {
          <tr>
            <td>{{ task.title }}</td>
            <td>{{ (task.startAt ?? task.createdAt) | date: 'yyyy-MM-dd' }}</td>
            <td>{{ task.dueAt ? (task.dueAt | date: 'yyyy-MM-dd') : '未設定' }}</td>
            <td>
              <nz-progress [nzPercent]="task.progress ?? 0" [nzStatus]="task.status === 'completed' ? 'success' : 'active'"></nz-progress>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="4" class="text-center">尚無任務</td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      .text-center {
        text-align: center;
      }
    `
  ]
})
export class TasksGanttViewComponent {
  blueprintId = input.required<string>();
  private readonly tasksService = inject(TasksService);

  readonly ganttTasks = computed(() =>
    [...this.tasksService.tasks()].sort((a, b) => {
      const aDate = a.dueAt ?? a.startAt ?? a.createdAt;
      const bDate = b.dueAt ?? b.startAt ?? b.createdAt;
      return aDate.getTime() - bDate.getTime();
    })
  );
}
