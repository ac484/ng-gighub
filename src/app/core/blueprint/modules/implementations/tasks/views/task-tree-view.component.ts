/**
 * Task Tree View Component
 * 任務樹狀視圖元件
 *
 * Displays tasks in hierarchical tree structure using ng-zorro-antd tree-view
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, input, output, computed, inject, ViewChild, effect, signal } from '@angular/core';
import { TaskStore } from '@core/state/stores/task.store';
import { Task, TaskTreeNode } from '@core/types/task';
import { buildTaskHierarchy, calculateAggregatedProgress } from '@core/utils/task-hierarchy.util';
import { SHARED_IMPORTS } from '@shared';
import { NzDropDownModule, NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTreeFlatDataSource, NzTreeFlattener, NzTreeViewModule } from 'ng-zorro-antd/tree-view';

import { TaskContextMenuComponent } from '../components/task-context-menu/task-context-menu.component';
import { TaskContextMenuService } from '../services/task-context-menu.service';

/** Flat node structure for CDK tree */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  taskId: string;
  task: Task;
  aggregatedProgress?: number;
  childrenCount?: number;
}

@Component({
  selector: 'app-task-tree-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzTreeViewModule, NzEmptyModule, NzDropDownModule, NzPopconfirmModule, TaskContextMenuComponent],
  template: `
    <div class="tree-view-container">
      <div class="tree-view-header">
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" nzSize="small" (click)="onCreateRootTask()">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            新增任務
          </button>
          <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="expandAll()">
            <span nz-icon nzType="plus-square" nzTheme="outline"></span>
            全部展開
          </button>
          <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="collapseAll()">
            <span nz-icon nzType="minus-square" nzTheme="outline"></span>
            全部收合
          </button>
          <nz-tag *nzSpaceItem [nzColor]="'blue'"> 共 {{ tasks().length }} 個任務 </nz-tag>
        </nz-space>
      </div>

      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else if (treeData().length === 0) {
        <nz-empty nzNotFoundContent="暫無任務" />
      } @else {
        <nz-tree-view [nzTreeControl]="treeControl" [nzDataSource]="dataSource">
          <nz-tree-node *nzTreeNodeDef="let node" nzTreeNodePadding nzTreeNodeIndentLine>
            <nz-tree-node-toggle nzTreeNodeNoopToggle></nz-tree-node-toggle>
            <nz-tree-node-option [nzDisabled]="node.disabled" (contextmenu)="onContextMenu($event, node.task)">
              <span nz-icon nzType="file" nzTheme="outline" style="margin-right: 8px;"></span>
              <span class="task-title">{{ node.name }}</span>
              <nz-tag [nzColor]="getPriorityColor(node.task)" style="margin-left: 8px;" nzSize="small">
                {{ getPriorityLabel(node.task.priority) }}
              </nz-tag>
              <nz-badge [nzStatus]="getStatusBadge(node.task.status)" style="margin-left: 8px;" />
              @if (node.task.progress !== undefined) {
                <span style="margin-left: 8px; color: #888; font-size: 12px;"> {{ node.task.progress }}% </span>
              }

              <!-- Action Buttons -->
              <span class="task-actions" style="margin-left: auto;">
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  (click)="onEditTask(node.task); $event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="編輯任務"
                >
                  <span nz-icon nzType="edit" nzTheme="outline"></span>
                </button>
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  nz-popconfirm
                  nzPopconfirmTitle="確認刪除此任務？"
                  nzPopconfirmPlacement="topRight"
                  (nzOnConfirm)="onDeleteTask(node.task)"
                  (click)="$event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="刪除任務"
                >
                  <span nz-icon nzType="delete" nzTheme="outline" style="color: #ff4d4f;"></span>
                </button>
              </span>
            </nz-tree-node-option>
          </nz-tree-node>

          <nz-tree-node *nzTreeNodeDef="let node; when: hasChild" nzTreeNodePadding nzTreeNodeIndentLine>
            <nz-tree-node-toggle>
              <span nz-icon [nzType]="treeControl.isExpanded(node) ? 'folder-open' : 'folder'" nzTheme="outline"></span>
            </nz-tree-node-toggle>
            <nz-tree-node-option [nzDisabled]="node.disabled" (contextmenu)="onContextMenu($event, node.task)">
              <span class="task-title" style="font-weight: 500;">{{ node.name }}</span>
              <nz-tag [nzColor]="getPriorityColor(node.task)" style="margin-left: 8px;" nzSize="small">
                {{ getPriorityLabel(node.task.priority) }}
              </nz-tag>
              <nz-badge [nzStatus]="getStatusBadge(node.task.status)" style="margin-left: 8px;" />
              <span style="margin-left: 8px; color: #888; font-size: 12px;"> ({{ node.childrenCount }} 個子任務) </span>
              @if (node.aggregatedProgress !== undefined) {
                <nz-progress
                  [nzPercent]="node.aggregatedProgress"
                  nzSize="small"
                  [nzShowInfo]="true"
                  [nzFormat]="formatProgress"
                  style="width: 120px; margin-left: 12px;"
                />
              }

              <!-- Action Buttons for Parent Node -->
              <span class="task-actions" style="margin-left: auto;">
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  (click)="onCreateSubTask(node.task); $event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="新增子任務"
                >
                  <span nz-icon nzType="plus" nzTheme="outline"></span>
                </button>
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  (click)="onEditTask(node.task); $event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="編輯任務"
                >
                  <span nz-icon nzType="edit" nzTheme="outline"></span>
                </button>
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  nz-popconfirm
                  nzPopconfirmTitle="確認刪除此任務及其所有子任務？"
                  nzPopconfirmPlacement="topRight"
                  (nzOnConfirm)="onDeleteTask(node.task)"
                  (click)="$event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="刪除任務"
                >
                  <span nz-icon nzType="delete" nzTheme="outline" style="color: #ff4d4f;"></span>
                </button>
              </span>
            </nz-tree-node-option>
          </nz-tree-node>
        </nz-tree-view>
      }

      <!-- Context Menu -->
      <app-task-context-menu
        [task]="selectedTask()"
        [blueprintId]="blueprintId()"
        [viewType]="'tree'"
        (edit)="onEditTask($event)"
        (viewDetails)="onViewDetails($event)"
        (createChild)="onCreateSubTask($event)"
        (delete)="onDeleteTask($event)"
        (cloned)="onTaskCloned($event)"
      />
    </div>
  `,
  styles: [
    `
      .tree-view-container {
        padding: 16px;
        height: 100%;
        overflow: auto;
      }

      .tree-view-header {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .task-title {
        font-size: 14px;
        line-height: 22px;
      }

      :host ::ng-deep .nz-tree-view {
        font-size: 14px;
      }

      :host ::ng-deep .nz-tree-node-content-wrapper {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        min-height: 32px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      :host ::ng-deep .nz-tree-node-content-wrapper:hover {
        background-color: #f5f5f5;
      }

      :host ::ng-deep .nz-tree-node-selected .nz-tree-node-content-wrapper {
        background-color: #e6f4ff;
      }

      :host ::ng-deep .nz-tree-node-option {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .task-actions {
        display: inline-flex;
        gap: 4px;
        margin-left: auto;
      }

      .task-actions button {
        opacity: 0.5;
        transition: opacity 0.2s;
      }

      .task-actions button:hover {
        opacity: 1;
      }

      :host ::ng-deep .nz-tree-node-indent-unit {
        width: 24px;
      }

      :host ::ng-deep .nz-progress {
        line-height: 1;
      }

      :host ::ng-deep .nz-tag {
        margin: 0;
      }

      :host ::ng-deep .nz-badge-status-dot {
        width: 8px;
        height: 8px;
      }
    `
  ]
})
export class TaskTreeViewComponent {
  private taskStore = inject(TaskStore);
  private menuService = inject(TaskContextMenuService);
  private nzContextMenuService = inject(NzContextMenuService);
  private message = inject(NzMessageService);

  @ViewChild(TaskContextMenuComponent, { static: false })
  contextMenuComponent?: TaskContextMenuComponent;

  // Input from parent
  blueprintId = input.required<string>();

  // Outputs
  readonly editTask = output<Task>();
  readonly deleteTask = output<Task>();
  readonly createSubTask = output<Task>();
  readonly createRootTask = output<void>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;
  readonly tasks = this.taskStore.tasks;

  // Context menu state
  readonly selectedTask = signal<Task | null>(null);

  // Watch for menu service changes
  constructor() {
    effect(
      () => {
        const config = this.menuService.config();
        if (config && config.task) {
          this.selectedTask.set(config.task);
        }
      },
      { allowSignalWrites: true }
    );
  }

  // Tree control and data source
  readonly treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  private readonly transformer = (node: TaskTreeNode, level: number): FlatNode => {
    const aggregatedProgress = calculateAggregatedProgress(node);
    const childrenCount = node.children?.length || 0;

    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.title,
      level,
      taskId: node.taskId,
      task: node.task,
      aggregatedProgress,
      childrenCount
    };
  };

  private readonly treeFlattener = new NzTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  readonly dataSource = new NzTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // Convert tasks to tree structure
  readonly treeData = computed(() => {
    const tasks = this.taskStore.tasks();
    const treeNodes = buildTaskHierarchy(tasks);
    this.dataSource.setData(treeNodes);
    return treeNodes;
  });

  readonly hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  /**
   * Expand all nodes
   */
  expandAll(): void {
    this.treeControl.expandAll();
  }

  /**
   * Collapse all nodes
   */
  collapseAll(): void {
    this.treeControl.collapseAll();
  }

  /**
   * Format progress display
   */
  formatProgress = (percent: number): string => {
    return `${percent}%`;
  };

  /**
   * Get status badge color
   */
  getStatusBadge(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      on_hold: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return statusMap[status] || 'default';
  }

  /**
   * Get priority color
   */
  getPriorityColor(task: Task): string {
    const colorMap: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default'
    };
    return colorMap[task.priority] || 'default';
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    const labelMap: Record<string, string> = {
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return labelMap[priority] || priority;
  }

  /**
   * Handle edit task action
   */
  onEditTask(task: Task): void {
    this.editTask.emit(task);
  }

  /**
   * Handle delete task action
   */
  onDeleteTask(task: Task): void {
    this.deleteTask.emit(task);
  }

  /**
   * Handle create sub-task action
   */
  onCreateSubTask(parentTask: Task): void {
    this.createSubTask.emit(parentTask);
  }

  /**
   * Handle create root task action
   */
  onCreateRootTask(): void {
    this.createRootTask.emit();
  }

  /**
   * Handle context menu (right-click)
   * 處理右鍵選單
   */
  onContextMenu(event: MouseEvent, task: Task): void {
    event.preventDefault(); // Prevent browser default context menu
    event.stopPropagation();

    // Update selected task
    this.selectedTask.set(task);

    // Show menu using service
    this.menuService.showMenu({
      task,
      position: { x: event.clientX, y: event.clientY },
      viewType: 'tree',
      allowEdit: true,
      allowDelete: true,
      allowCreateChild: true,
      allowClone: true,
      allowMove: false,
      allowAssign: true
    });

    // Show context menu dropdown at cursor position
    if (this.contextMenuComponent?.contextMenuComponent) {
      this.nzContextMenuService.create(event, this.contextMenuComponent.contextMenuComponent);
    }
  }

  /**
   * Handle view task details
   * 處理查看任務詳情
   */
  onViewDetails(task: Task): void {
    // TODO: Implement view details modal
    this.message.info(`查看任務詳情: ${task.title}`);
    console.log('View details for task:', task.id);
  }

  /**
   * Handle task cloned
   * 處理任務複製完成
   */
  onTaskCloned(clonedTask: Task): void {
    // Show success message
    this.message.success(`任務已複製: ${clonedTask.title}`);
    console.log('Task cloned successfully:', clonedTask.id);
  }
}
