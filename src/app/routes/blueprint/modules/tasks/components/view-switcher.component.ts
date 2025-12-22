import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TaskViewOption, TaskViewStore, TaskViewId } from '../state/task-view.store';

const TASK_VIEWS: TaskViewOption[] = [
  { id: 'tree-list', label: '列表', icon: 'unordered-list', description: '表格化任務列表' },
  { id: 'tree', label: '樹狀圖', icon: 'apartment', description: '階層結構視圖' },
  { id: 'gantt', label: '甘特圖', icon: 'bar-chart', description: '時程與依賴關係' },
  { id: 'calendar', label: '日曆', icon: 'calendar', description: '日期分佈檢視' },
  { id: 'timeline', label: '時間線', icon: 'clock-circle', description: '事件順序追蹤' }
];

@Component({
  selector: 'app-task-view-switcher',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-segmented
      [nzOptions]="options"
      [ngModel]="currentView()"
      (ngModelChange)="onSelect($event)"
      nzSize="large"
    />
  `
})
export class TaskViewSwitcherComponent {
  private readonly taskViewStore = inject(TaskViewStore);

  options = TASK_VIEWS.map(view => ({
    label: view.label,
    icon: view.icon,
    value: view.id
  }));

  currentView = this.taskViewStore.currentView;

  onSelect(view: TaskViewId): void {
    this.taskViewStore.switchView(view);
  }
}
