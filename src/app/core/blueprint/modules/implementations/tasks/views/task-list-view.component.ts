/**
 * Task List View Component
 * 任務列表視圖元件
 *
 * Displays tasks in hierarchical tree table format using ST (Simple Table) with expandable rows
 * Shows parent-child relationships with indentation and expand/collapse functionality
 *
 * Features:
 * - Expand All / Collapse All buttons for bulk operations
 * - Single node expand/collapse via toggle icons
 * - Hierarchical display with proper indentation
 * - Modern Angular 20 with Signals
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 * @updated 2025-12-15 - Added tree table support and expand/collapse all functionality
 */

import { Component, input, output, inject, ViewChild, signal, computed } from '@angular/core';
import { PlusSquareOutline, MinusSquareOutline } from '@ant-design/icons-angular/icons';
import { TaskStore } from '@core/state/stores/task.store';
import { Task, TaskStatus, TaskPriority, TaskTreeNode, AssigneeType } from '@core/types/task';
import { buildTaskHierarchy } from '@core/utils/task-hierarchy.util';
import { STColumn, STComponent, STData } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TaskAssignModalComponent } from '../components/task-assign-modal/task-assign-modal.component';
/**
 * Flat node for table display with hierarchy info
 * 用於表格顯示的扁平節點（含階層資訊）
 */
interface TaskTableNode extends STData {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  assigneeName?: string;
  assigneeDisplay?: string; // Combined display for user/team/partner
  assigneeType?: string;
  dueDate?: Date;
  createdAt: Date;
  level: number; // Depth in hierarchy
  parentId?: string;
  hasChildren: boolean;
  expanded: boolean;
  task: Task; // Original task reference
  children?: TaskTableNode[];
}

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  providers: [provideNzIconsPatch([PlusSquareOutline, MinusSquareOutline])],
  template: `
    <div class="tree-list-view-container">
      <div class="tree-list-view-header">
        <nz-space>
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
      } @else {
        <st
          #stTable
          [data]="displayData()"
          [columns]="columns"
          [page]="{ show: false }"
          [loading]="loading()"
          (change)="onTableChange($event)"
        >
          <ng-template st-row="titleTpl" let-item let-index="index" let-column="column">
            <span class="tree-node-wrapper">
              @if (item.hasChildren) {
                <span class="tree-expand-icon" (click)="toggleExpand(item); $event.stopPropagation()">
                  @if (item.expanded) {
                    <span nz-icon nzType="minus-square" nzTheme="outline"></span>
                  } @else {
                    <span nz-icon nzType="plus-square" nzTheme="outline"></span>
                  }
                </span>
              } @else {
                <span class="tree-expand-placeholder"></span>
              }
              <span class="tree-node-title" [style.margin-left.px]="item.level * 24">{{ item.title }}</span>
            </span>
          </ng-template>
        </st>
      }
    </div>
  `,
  styles: [
    `
      .tree-list-view-container {
        height: 100%;
        overflow: auto;
      }

      .tree-list-view-header {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      :host ::ng-deep .st tbody tr {
        cursor: pointer;
      }

      :host ::ng-deep .st tbody tr:hover {
        background-color: #f5f5f5;
      }

      /* Tree node wrapper */
      .tree-node-wrapper {
        display: flex;
        align-items: center;
      }

      /* Tree expand icon styles */
      .tree-expand-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition: all 0.2s;
        margin-right: 8px;
        flex-shrink: 0;
      }

      .tree-expand-icon:hover {
        color: #1890ff;
        background-color: rgba(24, 144, 255, 0.1);
        border-radius: 4px;
      }

      .tree-expand-placeholder {
        display: inline-block;
        width: 24px;
        height: 24px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      .tree-node-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `
  ]
})
export class TaskListViewComponent {
  private taskStore = inject(TaskStore);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  @ViewChild('stTable') stTable?: STComponent;

  // Inputs
  blueprintId = input.required<string>();

  // Outputs
  readonly editTask = output<Task>();
  readonly deleteTask = output<Task>();
  readonly createChildTask = output<Task>();
  readonly assignTask = output<Task>();

  // State
  expandedNodeIds = signal<Set<string>>(new Set());

  // Expose store state
  readonly tasks = this.taskStore.tasks;
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  /**
   * Build hierarchical tree structure from flat task list
   * 從扁平任務列表建立階層樹狀結構
   */
  readonly treeData = computed(() => {
    const tasks = this.tasks();
    return buildTaskHierarchy(tasks);
  });

  /**
   * Convert tree data to flat table nodes with hierarchy information
   * 將樹狀資料轉換為扁平表格節點（含階層資訊）
   */
  readonly displayData = computed(() => {
    const treeNodes = this.treeData();
    const expandedIds = this.expandedNodeIds();
    return this.flattenForDisplay(treeNodes, 0, expandedIds);
  });

  /**
   * Get display text for assignee based on type
   * 根據類型取得指派對象的顯示文字
   */
  private getAssigneeDisplay(task: Task): string {
    if (!task.assigneeType) {
      // Legacy: fallback to assigneeName
      return task.assigneeName || '未分配';
    }

    switch (task.assigneeType) {
      case AssigneeType.USER:
        return task.assigneeName ? `👤 ${task.assigneeName}` : '未分配';
      case AssigneeType.TEAM:
        return task.assigneeTeamName ? `👥 ${task.assigneeTeamName}` : '未分配團隊';
      case AssigneeType.PARTNER:
        return task.assigneePartnerName ? `🤝 ${task.assigneePartnerName}` : '未分配夥伴';
      default:
        return '未分配';
    }
  }

  /**
   * Flatten tree nodes for table display, respecting expand/collapse state
   * 扁平化樹狀節點用於表格顯示，遵循展開/收合狀態
   */
  private flattenForDisplay(nodes: TaskTreeNode[], level: number, expandedIds: Set<string>): TaskTableNode[] {
    const result: TaskTableNode[] = [];

    for (const node of nodes) {
      const hasChildren = !!(node.children && node.children.length > 0);
      const isExpanded = expandedIds.has(node.taskId);

      const tableNode: TaskTableNode = {
        id: node.taskId,
        title: node.title,
        status: node.task.status,
        priority: node.task.priority,
        progress: node.task.progress ?? 0,
        assigneeName: node.task.assigneeName,
        assigneeDisplay: this.getAssigneeDisplay(node.task),
        assigneeType: node.task.assigneeType,
        dueDate: node.task.dueDate,
        createdAt: node.task.createdAt,
        level,
        parentId: node.parentId,
        hasChildren,
        expanded: isExpanded,
        task: node.task,
        children: node.children as any // For reference
      };

      result.push(tableNode);

      // Recursively add children if node is expanded
      if (hasChildren && isExpanded && node.children) {
        result.push(...this.flattenForDisplay(node.children, level + 1, expandedIds));
      }
    }

    return result;
  }

  // ST Table columns with tree functionality
  columns: STColumn[] = [
    {
      title: '任務名稱',
      index: 'title',
      width: 350,
      render: 'titleTpl'
    },
    {
      title: '狀態',
      index: 'status',
      type: 'badge',
      width: 100,
      badge: {
        [TaskStatus.PENDING]: { text: '待處理', color: 'default' },
        [TaskStatus.IN_PROGRESS]: { text: '進行中', color: 'processing' },
        [TaskStatus.ON_HOLD]: { text: '暫停', color: 'warning' },
        [TaskStatus.COMPLETED]: { text: '已完成', color: 'success' },
        [TaskStatus.CANCELLED]: { text: '已取消', color: 'error' }
      }
    },
    {
      title: '優先級',
      index: 'priority',
      type: 'badge',
      width: 100,
      badge: {
        [TaskPriority.CRITICAL]: { text: '緊急', color: 'error' },
        [TaskPriority.HIGH]: { text: '高', color: 'warning' },
        [TaskPriority.MEDIUM]: { text: '中', color: 'processing' },
        [TaskPriority.LOW]: { text: '低', color: 'default' }
      }
    },
    {
      title: '進度',
      index: 'progress',
      width: 120,
      render: 'progressTpl',
      renderTitle: 'progressTitle',
      format: (item: TaskTableNode) => `${item.progress}%`
    },
    {
      title: '負責人',
      index: 'assigneeDisplay',
      width: 150,
      default: '未分配'
    },
    {
      title: '到期日',
      index: 'dueDate',
      type: 'date',
      width: 120,
      dateFormat: 'yyyy-MM-dd'
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      width: 150,
      dateFormat: 'yyyy-MM-dd HH:mm',
      sort: true
    },
    {
      title: '操作',
      width: 280,
      buttons: [
        {
          text: '指派',
          icon: 'user',
          click: (record: TaskTableNode) => this.openAssignModal(record.task)
        },
        {
          text: '編輯',
          icon: 'edit',
          click: (record: TaskTableNode) => this.editTask.emit(record.task)
        },
        {
          text: '新增子任務',
          icon: 'plus',
          click: (record: TaskTableNode) => this.createChildTask.emit(record.task)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確認刪除？',
            okType: 'danger'
          },
          click: (record: TaskTableNode) => this.deleteTask.emit(record.task)
        }
      ]
    }
  ];

  /**
   * Toggle expand/collapse for a single node
   * 切換單一節點展開/收合狀態
   */
  toggleExpand(node: TaskTableNode): void {
    if (!node.hasChildren) {
      return; // No children, nothing to expand
    }

    const expandedIds = new Set(this.expandedNodeIds());
    if (expandedIds.has(node.id)) {
      expandedIds.delete(node.id);
    } else {
      expandedIds.add(node.id);
    }
    this.expandedNodeIds.set(expandedIds);
  }

  /**
   * Expand all nodes with children
   * 展開所有具有子節點的節點
   */
  expandAll(): void {
    const treeNodes = this.treeData();
    const allExpandableIds = this.collectExpandableIds(treeNodes);
    this.expandedNodeIds.set(new Set(allExpandableIds));
  }

  /**
   * Collapse all nodes
   * 收合所有節點
   */
  collapseAll(): void {
    this.expandedNodeIds.set(new Set());
  }

  /**
   * Collect all IDs of nodes that have children (recursive)
   * 遞迴收集所有具有子節點的節點 ID
   */
  private collectExpandableIds(nodes: TaskTreeNode[]): string[] {
    const ids: string[] = [];

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        ids.push(node.taskId);
        // Recursively collect from children
        ids.push(...this.collectExpandableIds(node.children));
      }
    }

    return ids;
  }

  /**
   * Handle ST table change event
   */
  onTableChange(event: any): void {
    // Handle table events (sort, filter, etc.)
    console.log('Table change:', event);
  }

  /**
   * Open assign modal
   * 開啟指派模態框
   */
  openAssignModal(task: Task): void {
    const modalRef = this.modal.create({
      nzTitle: '指派任務',
      nzContent: TaskAssignModalComponent,
      nzWidth: 600,
      nzData: {
        blueprintId: this.blueprintId(),
        task: task
      },
      nzFooter: null
    });

    // Reload tasks after successful assignment
    modalRef.afterClose.subscribe((result) => {
      if (result === true) {
        // Assignment successful - tasks will auto-reload via store subscription
        this.assignTask.emit(task);
      }
    });
  }
}
