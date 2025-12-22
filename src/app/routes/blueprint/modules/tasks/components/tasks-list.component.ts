import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TasksFacade } from '../services/tasks.facade';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'任務 (Tasks)'" />
    <nz-card>
      <p class="text-muted">Tasks 模組雛形，待接資料與權限流程。</p>
      @if (loading()) {
        <nz-spin nzSimple />
      }
      @if (!loading()) {
        <nz-alert nzType="info" nzMessage="尚未串接資料" />
      }
    </nz-card>
  `
})
export class TasksListComponent {
  private readonly facade = inject(TasksFacade);
  loading = signal(false);

  // 保留日後串接 blueprintId → facade.load(blueprintId)
  // constructor() { this.facade.loading changes can be wired here }
}
