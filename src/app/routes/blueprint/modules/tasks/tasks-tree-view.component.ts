import { ChangeDetectionStrategy, Component, computed, inject, input, Signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { Task, TaskStatus } from './tasks.model';
import { TasksService } from './tasks.service';

interface TaskNode {
  task: Task;
  children: TaskNode[];
}

@Component({
  selector: 'app-tasks-tree-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTagModule, NzButtonModule],
  template: `
    <ul class="task-tree" role="tree">
      @for (node of tree(); track node.task.id) {
        <li role="treeitem" [attr.aria-expanded]="true">
          <div class="task-tree__row">
            <span class="task-tree__title">{{ node.task.title }}</span>
            <nz-tag [nzColor]="getStatusColor(node.task.status)">{{ getStatusLabel(node.task.status) }}</nz-tag>
            <span class="task-tree__actions">
              <button nz-button nzType="link" (click)="markInProgress(node.task.id)">進行中</button>
              <button nz-button nzType="link" (click)="complete(node.task.id)">完成</button>
              <button nz-button nzType="link" nzDanger (click)="remove(node.task.id)">刪除</button>
            </span>
          </div>

          @if (node.children.length > 0) {
            <ul role="group">
              @for (child of node.children; track child.task.id) {
                <li role="treeitem">
                  <div class="task-tree__row task-tree__row--child">
                    <span class="task-tree__title">{{ child.task.title }}</span>
                    <nz-tag [nzColor]="getStatusColor(child.task.status)">{{ getStatusLabel(child.task.status) }}</nz-tag>
                    <span class="task-tree__actions">
                      <button nz-button nzType="link" (click)="markInProgress(child.task.id)">進行中</button>
                      <button nz-button nzType="link" (click)="complete(child.task.id)">完成</button>
                      <button nz-button nzType="link" nzDanger (click)="remove(child.task.id)">刪除</button>
                    </span>
                  </div>
                </li>
              }
            </ul>
          }
        </li>
      } @empty {
        <li class="text-muted">尚無任務</li>
      }
    </ul>
  `,
  styles: [
    `
      .task-tree {
        list-style: none;
        padding-left: 0;
      }

      .task-tree__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .task-tree__row--child {
        padding-left: 16px;
      }

      .task-tree__title {
        flex: 1;
      }

      .task-tree__actions button {
        padding: 0 4px;
      }
    `
  ]
})
export class TasksTreeViewComponent {
  blueprintId = input.required<string>();
  private readonly tasksService = inject(TasksService);

  readonly tree: Signal<TaskNode[]> = computed(() => {
    const tasks = this.tasksService.tasks();
    const byId = new Map<string, TaskNode>();
    const roots: TaskNode[] = [];

    for (const task of tasks) {
      byId.set(task.id, { task, children: [] });
    }

    for (const task of tasks) {
      const node = byId.get(task.id)!;
      if (task.parentId) {
        const parent = byId.get(task.parentId);
        if (parent) {
          parent.children.push(node);
          continue;
        }
      }
      roots.push(node);
    }

    return roots;
  });

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
