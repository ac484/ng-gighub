import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';

import { SHARED_IMPORTS } from '@shared';

import { TaskStore } from '../state/task.store';
import { TaskTreeListViewComponent } from '../views/tree-list/task-tree-list-view.component';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, TaskTreeListViewComponent],
  template: `
    <page-header [title]="'任務 (Tasks)'" />
    <nz-card>
      <p class="text-muted">依據設計文件的任務樹狀列表視圖。</p>
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" />
      } @else if (tasks().length === 0) {
        <nz-alert nzType="info" nzMessage="尚未有任務資料" />
      } @else {
        <app-task-tree-list-view />
      }
    </nz-card>
  `
})
export class TasksListComponent {
  private readonly taskStore = inject(TaskStore);

  readonly blueprintId = input.required<string>();
  readonly tasks = computed(() => this.taskStore.tasks());
  readonly loading = computed(() => this.taskStore.loading());
  readonly error = computed(() => this.taskStore.error());

  constructor() {
    effect(
      () => {
        const id = this.blueprintId();
        if (id) {
          void this.taskStore.loadTasks(id);
        }
      },
      { allowSignalWrites: true }
    );
  }
}
