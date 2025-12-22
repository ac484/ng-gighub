import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { LoggerService } from '@core/services/logger';
import { FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { TaskStatus } from './tasks.model';
import { TasksGanttViewComponent } from './tasks-gantt-view.component';
import { TasksKanbanViewComponent } from './tasks-kanban-view.component';
import { TasksListViewComponent } from './tasks-list-view.component';
import { TasksTimelineViewComponent } from './tasks-timeline-view.component';
import { TasksTreeViewComponent } from './tasks-tree-view.component';
import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    FormsModule,
    NzGridModule,
    NzEmptyModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzStatisticModule,
    NzTabsModule,
    NzCardModule,
    TasksListViewComponent,
    TasksTreeViewComponent,
    TasksKanbanViewComponent,
    TasksTimelineViewComponent,
    TasksGanttViewComponent
  ],
  template: `
    <nz-row [nzGutter]="16" class="mb-md">
      <nz-col [nzSpan]="24">
        <nz-card nzTitle="任務統計">
          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="totalCount()" nzTitle="總數"></nz-statistic>
            </nz-col>
            <nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="inProgressCount()" nzTitle="進行中" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
            </nz-col>
            <nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="completedCount()" nzTitle="已完成" [nzValueStyle]="{ color: '#52c41a' }"></nz-statistic>
            </nz-col>
            <nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="pendingCount()" nzTitle="待處理" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
            </nz-col>
          </nz-row>
        </nz-card>
      </nz-col>
    </nz-row>

    <nz-row [nzGutter]="16" class="mb-md">
      <nz-col [nzSpan]="24">
        <nz-card nzTitle="新增任務">
          <div class="task-form" role="form" aria-label="新增任務表單">
            <label class="sr-only" for="taskTitle">任務標題</label>
            <input
              id="taskTitle"
              nz-input
              placeholder="輸入任務標題"
              [ngModel]="newTitle()"
              (ngModelChange)="newTitle.set($event)"
              (keyup.enter)="createTask()"
            />
            <label class="sr-only" for="taskStatus">任務狀態</label>
            <nz-select
              id="taskStatus"
              nzSize="large"
              [ngModel]="newStatus()"
              (ngModelChange)="newStatus.set($event)"
              class="task-form__select"
            >
              <nz-option nzLabel="待處理" nzValue="pending"></nz-option>
              <nz-option nzLabel="進行中" nzValue="in-progress"></nz-option>
              <nz-option nzLabel="已完成" nzValue="completed"></nz-option>
            </nz-select>
            <button nz-button nzType="primary" nzSize="large" [nzLoading]="submitting()" (click)="createTask()">新增任務</button>
          </div>
          @if (error()) {
            <div class="mt-sm" role="alert" style="color: #d4380d;">{{ error() }}</div>
          }
        </nz-card>
      </nz-col>
    </nz-row>

    <nz-card>
      <nz-tabset [nzTabBarStyle]="{ 'margin-bottom': '16px' }">
        <nz-tab nzTitle="列表">
          <ng-template nz-tab>
            <app-tasks-list-view [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
        <nz-tab nzTitle="樹狀">
          <ng-template nz-tab>
            <app-tasks-tree-view [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
        <nz-tab nzTitle="看板">
          <ng-template nz-tab>
            <app-tasks-kanban-view [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
        <nz-tab nzTitle="時間線">
          <ng-template nz-tab>
            <app-tasks-timeline-view [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
        <nz-tab nzTitle="甘特圖">
          <ng-template nz-tab>
            <app-tasks-gantt-view [blueprintId]="blueprintId()" />
          </ng-template>
        </nz-tab>
      </nz-tabset>
      @if (loading()) {
        <div class="mt-md text-center">
          <nz-spin nzSimple />
        </div>
      } @else if (tasks().length === 0) {
        <nz-empty nzNotFoundContent="尚未建立任務" />
      }
    </nz-card>
  `,
  styles: [
    `
      .task-form {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      .task-form__select {
        min-width: 160px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    `
  ]
})
export class TasksModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  private readonly logger = inject(LoggerService);
  private readonly tasksService = inject(TasksService);
  private readonly message = inject(NzMessageService);

  readonly tasks = this.tasksService.tasks;
  readonly loading = this.tasksService.loading;
  readonly error = this.tasksService.error;
  readonly totalCount = this.tasksService.totalCount;
  readonly completedCount = this.tasksService.completedCount;
  readonly inProgressCount = this.tasksService.inProgressCount;
  readonly pendingCount = this.tasksService.pendingCount;

  newTitle = signal('');
  newStatus = signal<TaskStatus>('in-progress');
  submitting = signal(false);

  ngOnInit(): void {
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        void this.tasksService.loadTasks(id);
      }
    });
  }

  async createTask(): Promise<void> {
    const blueprintId = this.blueprintId();
    const title = this.newTitle().trim();
    if (!blueprintId) return;
    if (!title) {
      this.message.warning('請輸入任務標題');
      return;
    }
    if (this.submitting()) return;
    this.submitting.set(true);
    try {
      await this.tasksService.createTask(blueprintId, title, this.newStatus());
      this.message.success('已新增任務');
      this.newTitle.set('');
      this.newStatus.set('in-progress');
    } catch (error) {
      this.message.error('新增任務失敗');
      this.logger.error('[TasksModuleViewComponent]', 'createTask failed', error as Error);
    } finally {
      this.submitting.set(false);
    }
  }

}
