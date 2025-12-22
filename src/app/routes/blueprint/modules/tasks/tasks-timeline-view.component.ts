import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks-timeline-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTimelineModule],
  template: `
    <nz-timeline>
      @for (task of timelineTasks(); track task.id) {
        <nz-timeline-item [nzColor]="task.status === 'completed' ? 'green' : 'blue'">
          <div class="timeline-item">
            <div class="timeline-item__title">{{ task.title }}</div>
            <div class="timeline-item__meta">
              <span>{{ (task.startAt ?? task.createdAt) | date: 'yyyy-MM-dd HH:mm' }}</span>
              <span class="timeline-item__status">{{ task.status }}</span>
            </div>
          </div>
        </nz-timeline-item>
      } @empty {
        <nz-timeline-item>尚無任務</nz-timeline-item>
      }
    </nz-timeline>
  `,
  styles: [
    `
      .timeline-item__title {
        font-weight: 600;
      }

      .timeline-item__meta {
        color: #666;
        display: flex;
        gap: 8px;
        font-size: 12px;
      }

      .timeline-item__status {
        text-transform: capitalize;
      }
    `
  ]
})
export class TasksTimelineViewComponent {
  blueprintId = input.required<string>();
  private readonly tasksService = inject(TasksService);

  readonly timelineTasks = computed(() =>
    [...this.tasksService.tasks()].sort((a, b) => {
      const aDate = a.startAt ?? a.createdAt;
      const bDate = b.startAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    })
  );
}
