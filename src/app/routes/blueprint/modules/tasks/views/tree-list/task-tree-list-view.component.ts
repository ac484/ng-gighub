import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TaskStore } from '../../state/task.store';
import { TaskViewStore } from '../../state/task-view.store';
import { TaskWithWBS } from '@core/domain/types/task/task-wbs.types';
import { TaskStatus } from '@core/domain/types/task/task.types';

interface FlattenedTask {
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
    <nz-table
      [nzData]="flattenedTasks()"
      [nzLoading]="loading()"
      [nzFrontPagination]="false"
      [nzShowPagination]="false"
      nzSize="middle"
    >
      <thead>
        <tr>
          <th nzWidth="56px"></th>
          <th>任務名稱</th>
          <th nzWidth="120px">狀態</th>
          <th nzWidth="140px">負責人</th>
          <th nzWidth="120px">開始</th>
          <th nzWidth="120px">結束</th>
          <th nzWidth="120px">進度</th>
        </tr>
      </thead>
      <tbody>
        @for (item of flattenedTasks(); track item.task.id || item.level) {
          <tr>
            <td class="tree-toggle-cell">
              @if (item.hasChildren) {
                <button nz-button nzType="text" nzSize="small" (click)="toggle(item.task.id)">
                  <span nz-icon [nzType]="isExpanded(item.task.id) ? 'minus-square' : 'plus-square'"></span>
                </button>
              }
            </td>
            <td [style.padding-left.px]="item.level * 20">
              <span class="task-title">{{ item.task.title }}</span>
              @if (item.task.wbsCode) {
                <nz-tag nzSize="small" nzColor="blue">{{ item.task.wbsCode }}</nz-tag>
              }
            </td>
            <td>
              <nz-tag [nzColor]="statusColor(item.task.status)">{{ statusLabel(item.task.status) }}</nz-tag>
            </td>
            <td>{{ item.task.assigneeName || '-' }}</td>
            <td>{{ (item.task.plannedStartDate || item.task.startDate) | date: 'yyyy-MM-dd' }}</td>
            <td>{{ (item.task.plannedEndDate || item.task.dueDate) | date: 'yyyy-MM-dd' }}</td>
            <td>
              <nz-progress nzSize="small" [nzPercent]="item.task.progress ?? 0"></nz-progress>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      .tree-toggle-cell {
        width: 56px;
      }

      .task-title {
        font-weight: 500;
      }
    `
  ]
})
export class TaskTreeListViewComponent {
  private readonly taskStore = inject(TaskStore);
  private readonly taskViewStore = inject(TaskViewStore);

  loading = this.taskStore.loading;
  tasks = this.taskStore.tasks;
  expanded = this.taskViewStore.expandedNodes;

  flattenedTasks = computed<FlattenedTask[]>(() => {
    const tasks = this.tasks();
    const expanded = this.expanded();

    const byParent = new Map<string | null, TaskWithWBS[]>();
    tasks.forEach(task => {
      const parentKey = task.parentId ?? null;
      if (!byParent.has(parentKey)) {
        byParent.set(parentKey, []);
      }
      byParent.get(parentKey)!.push(task);
    });

    const sortTasks = (list: TaskWithWBS[]) =>
      [...list].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    const roots = sortTasks(byParent.get(null) ?? []);
    const result: FlattenedTask[] = [];

    const traverse = (task: TaskWithWBS, level: number): void => {
      const children = sortTasks(byParent.get(task.id ?? null) ?? []);
      result.push({ task, level, hasChildren: children.length > 0 });
      if (task.id && expanded.has(task.id)) {
        children.forEach(child => traverse(child, level + 1));
      }
    };

    roots.forEach(task => traverse(task, 0));
    return result;
  });

  toggle(taskId?: string): void {
    if (!taskId) return;
    this.taskViewStore.toggleNode(taskId);
  }

  isExpanded(taskId?: string): boolean {
    if (!taskId) return false;
    return this.expanded().has(taskId);
  }

  statusLabel(status: TaskStatus): string {
    return status.replace(/_/g, ' ');
  }

  statusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'processing';
      case TaskStatus.ON_HOLD:
        return 'warning';
      case TaskStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  }
}
