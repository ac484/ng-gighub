import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { TaskStatus } from './tasks.model';
import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzTagModule, NzButtonModule, NzPopconfirmModule, NzProgressModule, NzSpaceModule],
  template: `
    <nz-table [nzData]="tasksService.tasks()" [nzShowPagination]="false" nzSize="middle">
      <thead>
        <tr>
          <th scope="col">名稱</th>
          <th scope="col">狀態</th>
          <th scope="col">進度</th>
          <th scope="col">開始</th>
          <th scope="col">到期</th>
          <th scope="col" class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        @for (task of tasksService.tasks(); track task.id) {
          <tr>
            <td>{{ task.title }}</td>
            <td>
              <nz-tag [nzColor]="getStatusColor(task.status)">{{ getStatusLabel(task.status) }}</nz-tag>
            </td>
            <td>
              <nz-progress [nzPercent]="task.progress ?? 0" [nzSize]="'small'"></nz-progress>
            </td>
            <td>{{ (task.startAt ?? task.createdAt) | date: 'yyyy-MM-dd' }}</td>
            <td>{{ task.dueAt ? (task.dueAt | date: 'yyyy-MM-dd') : '未設定' }}</td>
            <td class="text-right">
              <nz-space>
                <button *nzSpaceItem nz-button nzType="link" (click)="markInProgress(task.id)">進行中</button>
                <button *nzSpaceItem nz-button nzType="link" (click)="complete(task.id)">完成</button>
                <button
                  *nzSpaceItem
                  nz-button
                  nzType="link"
                  nzDanger
                  nz-popconfirm
                  nzPopconfirmTitle="確認刪除？"
                  (nzOnConfirm)="remove(task.id)"
                >
                  刪除
                </button>
              </nz-space>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      .text-right {
        text-align: right;
      }
    `
  ]
})
export class TasksListViewComponent {
  blueprintId = input.required<string>();
  readonly tasksService = inject(TasksService);

  async complete(taskId: string): Promise<void> {
    await this.tasksService.updateStatus(taskId, 'completed');
  }

  async markInProgress(taskId: string): Promise<void> {
    await this.tasksService.updateStatus(taskId, 'in-progress');
  }

  async remove(taskId: string): Promise<void> {
    await this.tasksService.deleteTask(taskId);
  }

  getStatusColor(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      pending: 'gold',
      'in-progress': 'blue',
      completed: 'green'
    };
    return map[status] ?? 'default';
  }

  getStatusLabel(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      pending: '待處理',
      'in-progress': '進行中',
      completed: '已完成'
    };
    return map[status] ?? status;
  }
}
