/**
 * Tasks Component
 *
 * Angular UI component for task management.
 * Uses Angular 20 Signals and modern syntax.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { Component, OnInit, inject, signal, effect, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoggerService } from '@core';
import { FirebaseService } from '@core/services/firebase.service';
import { TaskStore } from '@core/state/stores/task.store';
import { Task, TaskViewMode } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { TaskModalComponent } from './task-modal.component';
import { TaskGanttViewComponent } from './views/task-gantt-view.component';
import { TaskKanbanViewComponent } from './views/task-kanban-view.component';
import { TaskListViewComponent } from './views/task-list-view.component';
import { TaskTimelineViewComponent } from './views/task-timeline-view.component';
import { TaskTreeViewComponent } from './views/task-tree-view.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    TaskListViewComponent,
    TaskTreeViewComponent,
    TaskKanbanViewComponent,
    TaskTimelineViewComponent,
    TaskGanttViewComponent
  ],
  template: `
    <nz-card [nzTitle]="'任務統計'" [nzExtra]="statsExtra">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().total" [nzTitle]="'總任務數'" [nzPrefix]="totalIcon"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().pending" [nzTitle]="'待處理'" [nzValueStyle]="{ color: '#faad14' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().inProgress" [nzTitle]="'進行中'" [nzValueStyle]="{ color: '#1890ff' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().completed" [nzTitle]="'已完成'" [nzValueStyle]="{ color: '#52c41a' }"> </nz-statistic>
        </nz-col>
      </nz-row>

      <ng-template #statsExtra>
        <button nz-button nzType="primary" (click)="showCreateTaskModal()">
          <span nz-icon nzType="plus"></span>
          新增任務
        </button>
      </ng-template>

      <ng-template #totalIcon>
        <span nz-icon nzType="check-circle"></span>
      </ng-template>
    </nz-card>

    <nz-card style="margin-top: 16px;">
      <nz-tabset [(nzSelectedIndex)]="selectedViewIndex" (nzSelectedIndexChange)="onViewChange($event)">
        <nz-tab [nzTitle]="listViewTitle">
          <ng-template #listViewTitle>
            <span nz-icon nzType="unordered-list" nzTheme="outline"></span>
            列表視圖
          </ng-template>
          <app-task-list-view
            [blueprintId]="_blueprintId()"
            (editTask)="editTask($event)"
            (deleteTask)="deleteTask($event)"
            (createChildTask)="createSubTask($event)"
          />
        </nz-tab>

        <nz-tab [nzTitle]="treeViewTitle">
          <ng-template #treeViewTitle>
            <span nz-icon nzType="apartment" nzTheme="outline"></span>
            樹狀視圖
          </ng-template>
          <app-task-tree-view
            [blueprintId]="_blueprintId()"
            (editTask)="editTask($event)"
            (deleteTask)="deleteTask($event)"
            (createSubTask)="createSubTask($event)"
            (createRootTask)="showCreateTaskModal()"
          />
        </nz-tab>

        <nz-tab [nzTitle]="kanbanViewTitle">
          <ng-template #kanbanViewTitle>
            <span nz-icon nzType="project" nzTheme="outline"></span>
            看板視圖
          </ng-template>
          <app-task-kanban-view [blueprintId]="_blueprintId()" />
        </nz-tab>

        <nz-tab [nzTitle]="timelineViewTitle">
          <ng-template #timelineViewTitle>
            <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
            時間線視圖
          </ng-template>
          <app-task-timeline-view [blueprintId]="_blueprintId()" />
        </nz-tab>

        <nz-tab [nzTitle]="ganttViewTitle">
          <ng-template #ganttViewTitle>
            <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
            甘特圖視圖
          </ng-template>
          <app-task-gantt-view [blueprintId]="_blueprintId()" />
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class TasksComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private logger = inject(LoggerService);
  private taskStore = inject(TaskStore);
  private firebaseService = inject(FirebaseService);

  // Input from parent (Angular 19+ input() function)
  blueprintId = input<string>();
  blueprintOwnerType = input<string>();  // 'user' or 'organization' - required for task assignee validation

  // Internal state
  _blueprintId = signal<string>('');
  _blueprintOwnerType = signal<string>('user');  // Default to user
  blueprintName = signal<string>('任務管理');
  selectedViewIndex = 0;
  currentViewMode = signal<TaskViewMode>(TaskViewMode.LIST);

  // Expose store signals to template
  readonly taskStats = this.taskStore.taskStats;

  constructor() {
    // Watch for blueprintId input changes
    effect(() => {
      const id = this.blueprintId();
      if (id && id !== this._blueprintId()) {
        this.logger.info('[TasksComponent]', `Effect triggered: blueprintId changed to ${id}`);
        this._blueprintId.set(id);
        this.loadTasks(id);
      }
    });

    // Watch for blueprintOwnerType input changes
    effect(() => {
      const ownerType = this.blueprintOwnerType();
      if (ownerType && ownerType !== this._blueprintOwnerType()) {
        this.logger.info('[TasksComponent]', `Effect triggered: blueprintOwnerType changed to ${ownerType}`);
        this._blueprintOwnerType.set(ownerType);
      }
    });
  }

  ngOnInit(): void {
    this.logger.info('[TasksComponent]', 'ngOnInit called');

    // Priority 1: Use input blueprintId if available
    const inputId = this.blueprintId();
    if (inputId) {
      this.logger.info('[TasksComponent]', `Using input blueprintId: ${inputId}`);
      this._blueprintId.set(inputId);
      this.loadTasks(inputId);
      return;
    }

    // Priority 2: Check route params for backwards compatibility
    this.route.params.subscribe(params => {
      const routeBlueprintId = params['id'] || params['blueprintId'];
      if (routeBlueprintId) {
        this.logger.info('[TasksComponent]', `Using route blueprintId: ${routeBlueprintId}`);
        this._blueprintId.set(routeBlueprintId);
        this.loadTasks(routeBlueprintId);
      } else {
        this.logger.warn('[TasksComponent]', 'No blueprintId found in route params');
      }
    });
  }

  loadTasks(blueprintId: string): void {
    if (!blueprintId) {
      this.logger.warn('[TasksComponent]', 'Cannot load tasks: blueprintId is empty');
      return;
    }
    this.logger.info('[TasksComponent]', `Loading tasks for blueprint: ${blueprintId}`);
    this.taskStore.loadTasks(blueprintId);
  }

  onViewChange(index: number): void {
    const viewModes = [TaskViewMode.LIST, TaskViewMode.TREE, TaskViewMode.KANBAN, TaskViewMode.TIMELINE, TaskViewMode.GANTT];
    this.currentViewMode.set(viewModes[index]);
    this.logger.info('[TasksComponent]', `View changed to: ${viewModes[index]}`);
  }

  showCreateTaskModal(): void {
    const blueprintId = this._blueprintId();
    if (!blueprintId) {
      this.message.warning('請先選擇藍圖');
      return;
    }

    this.modal.create({
      nzTitle: '新增任務',
      nzContent: TaskModalComponent,
      nzData: {
        blueprintId: blueprintId,
        blueprintOwnerType: this._blueprintOwnerType(),
        mode: 'create'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });
    // Success message shown in modal, task added to store by modal
  }

  editTask(task: Task): void {
    const blueprintId = this._blueprintId();
    if (!blueprintId) {
      this.message.warning('請先選擇藍圖');
      return;
    }

    this.modal.create({
      nzTitle: '編輯任務',
      nzContent: TaskModalComponent,
      nzData: {
        blueprintId: blueprintId,
        blueprintOwnerType: this._blueprintOwnerType(),
        task: task,
        mode: 'edit'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });
    // Success message shown in modal, task updated in store by modal
  }

  async deleteTask(task: Task): Promise<void> {
    try {
      const blueprintId = this._blueprintId();
      const currentUserId = this.firebaseService.getCurrentUserId();

      if (!currentUserId) {
        this.message.error('無法取得使用者資訊，請重新登入');
        return;
      }

      if (blueprintId && task.id) {
        await this.taskStore.deleteTask(blueprintId, task.id, currentUserId);
        this.message.success('任務刪除成功');
      }
    } catch (error) {
      this.logger.error('[TasksComponent]', 'Delete task failed', error instanceof Error ? error : undefined);
      this.message.error('任務刪除失敗');
    }
  }

  createSubTask(parentTask: Task): void {
    const blueprintId = this._blueprintId();
    if (!blueprintId) {
      this.message.warning('請先選擇藍圖');
      return;
    }

    this.modal.create({
      nzTitle: `新增子任務 - ${parentTask.title}`,
      nzContent: TaskModalComponent,
      nzData: {
        blueprintId: blueprintId,
        blueprintOwnerType: this._blueprintOwnerType(),
        parentTask: parentTask,
        mode: 'create'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });
  }
}
