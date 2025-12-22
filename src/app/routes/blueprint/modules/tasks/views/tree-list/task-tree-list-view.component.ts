import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TaskPriority, TaskStatus } from '@core/types/task/task.types';
import { SHARED_IMPORTS } from '@shared';

import { TaskWithWBS } from '../../data-access/models/task.model';
import { TaskViewStore } from '../../state/task-view.store';
import { TaskStore } from '../../state/task.store';

interface FlattenedTaskRow {
  task: TaskWithWBS;
  level: number;
  hasChildren: boolean;
}

@Component({
  selector: 'app-task-tree-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-table [nzData]="flattenedTasks()" [nzLoading]="loading()" [nzFrontPagination]="false" [nzShowPagination]="false" nzSize="middle">
      <thead>
        <tr>
          <th nzWidth="48px"></th>
          <th>任務名稱</th>
          <th nzWidth="140px">狀態</th>
          <th nzWidth="140px">優先級</th>
          <th nzWidth="140px">開始日期</th>
          <th nzWidth="140px">結束日期</th>
          <th nzWidth="120px">進度</th>
        </tr>
      </thead>

      <tbody>
        @for (row of flattenedTasks(); track row.task.id) {
          <tr>
            <td>
              @if (row.hasChildren) {
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  (click)="toggleExpand(row.task.id!)"
                  [attr.aria-expanded]="isExpanded(row.task.id!)"
                  [attr.aria-label]="'切換 ' + row.task.title"
                >
                  <span nz-icon [nzType]="isExpanded(row.task.id!) ? 'minus-square' : 'plus-square'" nzTheme="outline"></span>
                </button>
              }
            </td>
            <td [style.padding-left.px]="row.level * 20">
              {{ row.task.title || '未命名任務' }}
            </td>
            <td>
              <nz-tag [nzColor]="statusColor(row.task.status)">
                {{ statusLabel(row.task.status) }}
              </nz-tag>
            </td>
            <td>
              <nz-tag nzColor="blue">{{ priorityLabel(row.task.priority) }}</nz-tag>
            </td>
            <td>
              {{ row.task.startDate || row.task.plannedStartDate | date: 'yyyy-MM-dd' }}
            </td>
            <td>
              {{ row.task.completedDate || row.task.plannedEndDate || row.task.dueDate | date: 'yyyy-MM-dd' }}
            </td>
            <td>
              <nz-progress [nzPercent]="row.task.progress ?? 0" nzSize="small" />
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class TaskTreeListViewComponent {
  private readonly taskStore = inject(TaskStore);
  private readonly viewStore = inject(TaskViewStore);

  readonly tasks = this.taskStore.tasks;
  readonly loading = this.taskStore.loading;
  readonly expandedNodes = this.viewStore.expandedNodes;

  readonly flattenedTasks = computed<FlattenedTaskRow[]>(() => {
    const tasks = this.tasks();
    const expanded = this.expandedNodes();

    const byParent = tasks.reduce<Map<string | null, TaskWithWBS[]>>((acc, task) => {
      const key = task.parentId ?? null;
      const list = acc.get(key) ?? [];
      list.push(task);
      acc.set(key, list);
      return acc;
    }, new Map());

    const roots = byParent.get(null) ?? [];
    const result: FlattenedTaskRow[] = [];

    const walk = (task: TaskWithWBS, level: number) => {
      const children = byParent.get(task.id ?? '') ?? [];
      result.push({ task, level, hasChildren: children.length > 0 });

      if (task.id && expanded.has(task.id)) {
        children.forEach(child => walk(child, level + 1));
      }
    };

    roots.forEach(task => walk(task, 0));
    return result;
  });

  toggleExpand(taskId: string): void {
    this.viewStore.toggleNode(taskId);
  }

  isExpanded(taskId: string): boolean {
    return this.expandedNodes().has(taskId);
  }

  statusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: '待處理',
      [TaskStatus.IN_PROGRESS]: '進行中',
      [TaskStatus.ON_HOLD]: '暫停',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    };
    return labels[status] ?? status;
  }

  statusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: 'default',
      [TaskStatus.IN_PROGRESS]: 'processing',
      [TaskStatus.ON_HOLD]: 'warning',
      [TaskStatus.COMPLETED]: 'success',
      [TaskStatus.CANCELLED]: 'error'
    };
    return colors[status] ?? 'default';
  }

  priorityLabel(priority: TaskWithWBS['priority']): string {
    const labels: Record<TaskPriority, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '緊急'
    };
    return priority ? (labels[priority] ?? priority) : '未設定';
  }
}
