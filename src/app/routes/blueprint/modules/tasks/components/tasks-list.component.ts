import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { TasksFacade } from '../services/tasks.facade';
import { TaskTreeListViewComponent } from '../views/tree-list/task-tree-list-view.component';
import { TaskViewSwitcherComponent } from './view-switcher.component';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, TaskTreeListViewComponent, TaskViewSwitcherComponent],
  template: `
    <page-header [title]="'任務 (Tasks)'" />
    <nz-card>
      <div class="mb-sm">
        <app-task-view-switcher />
      </div>

      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (!resolvedBlueprintId()) {
        <nz-alert nzType="warning" nzMessage="缺少 Blueprint ID，無法載入任務" />
      } @else if (tasks().length === 0) {
        <nz-empty nzNotFoundContent="尚未有任務資料" />
      } @else {
        @switch (currentView()) {
          @case ('tree-list') {
            <app-task-tree-list-view />
          }
          @default {
            <nz-alert nzType="info" nzMessage="該視圖尚未實作，預設使用樹狀列表" />
            <app-task-tree-list-view />
          }
        }
      }
    </nz-card>
  `
})
export class TasksListComponent {
  private readonly facade = inject(TasksFacade);
  private readonly route = inject(ActivatedRoute);

  readonly blueprintId = input<string | null>(null);

  private readonly routeBlueprintId = toSignal(
    (this.route.parent ?? this.route).paramMap.pipe(map(params => params.get('id'))),
    { initialValue: null }
  );

  readonly resolvedBlueprintId = computed(() => this.blueprintId() ?? this.routeBlueprintId());
  readonly tasks = this.facade.tasks;
  readonly loading = this.facade.loading;
  readonly currentView = this.facade.currentView;

  constructor() {
    this.facade.ensureLoaded(this.resolvedBlueprintId);
  }
}
