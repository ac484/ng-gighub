import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { TaskStatus } from './tasks.model';
import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks-kanban-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzCardModule, NzTagModule, NzButtonModule],
  template: `
    <div class="kanban-board" role="list">
      <div class="kanban-column" role="listitem">
        <div class="kanban-column__header">待處理 ({{ tasksService.tasksByStatus().pending.length }})</div>
        @for (task of tasksService.tasksByStatus().pending; track task.id) {
          <nz-card class="kanban-card" nzSize="small">
            <div class="kanban-card__title">{{ task.title }}</div>
            <div class="kanban-card__meta">
              <span>{{ task.startAt ? (task.startAt | date: 'MM/dd') : (task.createdAt | date: 'MM/dd') }}</span>
              <button nz-button nzType="link" (click)="move(task.id, 'in-progress')">開始</button>
            </div>
          </nz-card>
        } @empty {
          <div class="kanban-empty">尚無任務</div>
        }
      </div>

      <div class="kanban-column" role="listitem">
        <div class="kanban-column__header">進行中 ({{ tasksService.tasksByStatus().inProgress.length }})</div>
        @for (task of tasksService.tasksByStatus().inProgress; track task.id) {
          <nz-card class="kanban-card" nzSize="small">
            <div class="kanban-card__title">{{ task.title }}</div>
            <div class="kanban-card__meta">
              <span>進度：{{ task.progress ?? 0 }}%</span>
              <button nz-button nzType="link" (click)="move(task.id, 'completed')">完成</button>
            </div>
          </nz-card>
        } @empty {
          <div class="kanban-empty">尚無任務</div>
        }
      </div>

      <div class="kanban-column" role="listitem">
        <div class="kanban-column__header">已完成 ({{ tasksService.tasksByStatus().completed.length }})</div>
        @for (task of tasksService.tasksByStatus().completed; track task.id) {
          <nz-card class="kanban-card" nzSize="small">
            <div class="kanban-card__title">{{ task.title }}</div>
            <div class="kanban-card__meta">
              <nz-tag nzColor="green">完成</nz-tag>
              <button nz-button nzType="link" nzDanger (click)="remove(task.id)">刪除</button>
            </div>
          </nz-card>
        } @empty {
          <div class="kanban-empty">尚無任務</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .kanban-board {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .kanban-column__header {
        font-weight: 600;
        margin-bottom: 8px;
      }

      .kanban-card {
        margin-bottom: 8px;
      }

      .kanban-card__title {
        font-weight: 600;
      }

      .kanban-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 8px;
      }

      .kanban-empty {
        padding: 12px;
        color: #999;
      }
    `
  ]
})
export class TasksKanbanViewComponent {
  blueprintId = input.required<string>();
  readonly tasksService = inject(TasksService);

  async move(taskId: string, status: TaskStatus): Promise<void> {
    await this.tasksService.updateStatus(taskId, status);
  }

  async remove(taskId: string): Promise<void> {
    await this.tasksService.deleteTask(taskId);
  }
}
