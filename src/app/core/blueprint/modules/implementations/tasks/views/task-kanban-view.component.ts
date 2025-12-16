/**
 * Task Kanban View Component
 * 任務看板視圖元件
 *
 * Displays tasks in Kanban board format with drag-and-drop
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, input, computed, inject, output } from '@angular/core';
import { FirebaseService } from '@core/services/firebase.service';
import { TaskStore } from '@core/state/stores/task.store';
import { Task, TaskStatus } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TaskContextMenuComponent } from '../components/task-context-menu/task-context-menu.component';
import { TaskContextMenuService } from '../services/task-context-menu.service';

@Component({
  selector: 'app-task-kanban-view',
  standalone: true,
  imports: [SHARED_IMPORTS, DragDropModule, TaskContextMenuComponent],
  template: `
    <div class="kanban-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <div class="kanban-board">
          @for (column of columns(); track column.id) {
            <div class="kanban-column">
              <div class="column-header">
                <h3>{{ column.title }}</h3>
                <nz-badge [nzCount]="column.tasks.length" />
              </div>

              <div
                class="column-content"
                cdkDropList
                [id]="column.id"
                [cdkDropListData]="column.tasks"
                [cdkDropListConnectedTo]="connectedDropLists()"
                (cdkDropListDropped)="onDrop($event, column.status)"
              >
                @for (task of column.tasks; track task.id) {
                  <div class="task-card" cdkDrag (contextmenu)="onContextMenu($event, task)">
                    <div class="task-card-header">
                      <span class="task-title">{{ task.title }}</span>
                      <nz-tag [nzColor]="getPriorityColor(task.priority)">
                        {{ getPriorityText(task.priority) }}
                      </nz-tag>
                    </div>

                    @if (task.description) {
                      <div class="task-description">{{ task.description }}</div>
                    }

                    @if (task.progress !== undefined) {
                      <div class="task-progress">
                        <nz-progress [nzPercent]="task.progress" nzSize="small" />
                      </div>
                    }

                    <div class="task-meta">
                      @if (task.assigneeName) {
                        <nz-avatar [nzText]="task.assigneeName.charAt(0)" nzSize="small" />
                        <span class="assignee-name">{{ task.assigneeName }}</span>
                      }
                      @if (task.dueDate) {
                        <span class="due-date">
                          <span nz-icon nzType="calendar" nzTheme="outline"></span>
                          {{ task.dueDate | date: 'MM/dd' }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Context Menu -->
      <app-task-context-menu
        [task]="selectedTask()"
        [blueprintId]="blueprintId()"
        [viewType]="'kanban'"
        (edit)="onEditTask($event)"
        (viewDetails)="onViewDetails($event)"
        (createChild)="onCreateChildTask($event)"
        (delete)="onDeleteTask($event)"
        (cloned)="onTaskCloned($event)"
      />
    </div>
  `,
  styles: [
    `
      .kanban-container {
        height: 100%;
        overflow-x: auto;
        padding: 16px;
      }

      .kanban-board {
        display: flex;
        gap: 16px;
        min-width: fit-content;
      }

      .kanban-column {
        width: 300px;
      }

      .column-header {
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .column-header h3 {
        margin: 0;
        font-weight: 600;
      }

      .column-content {
        flex: 1;
        padding: 8px;
        overflow-y: auto;
        min-height: 200px;
      }

      .task-card {
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: move;
      }

      .task-card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .task-title {
        font-weight: 500;
        flex: 1;
      }

      .task-description {
        font-size: 12px;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .task-progress {
        margin-bottom: 8px;
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .assignee-name {
        flex: 1;
      }

      .due-date {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `
  ]
})
export class TaskKanbanViewComponent {
  private taskStore = inject(TaskStore);
  private message = inject(NzMessageService);
  private firebaseService = inject(FirebaseService);
  private menuService = inject(TaskContextMenuService);

  // Inputs
  blueprintId = input.required<string>();

  // Outputs
  readonly editTask = output<Task>();
  readonly deleteTask = output<Task>();
  readonly createChildTask = output<Task>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Context menu state
  readonly selectedTask = computed(() => this.menuService.config()?.task || null);

  // Kanban columns
  readonly columns = computed(() => {
    const tasks = this.taskStore.tasks();

    const columnDefs = [
      { id: TaskStatus.PENDING, title: '待處理', status: TaskStatus.PENDING },
      { id: TaskStatus.IN_PROGRESS, title: '進行中', status: TaskStatus.IN_PROGRESS },
      { id: TaskStatus.ON_HOLD, title: '暫停', status: TaskStatus.ON_HOLD },
      { id: TaskStatus.COMPLETED, title: '已完成', status: TaskStatus.COMPLETED }
    ];

    return columnDefs.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.status)
    }));
  });

  readonly connectedDropLists = computed(() => this.columns().map(col => col.id));

  /**
   * Handle card drop event
   */
  async onDrop(event: CdkDragDrop<Task[]>, newStatus: string): Promise<void> {
    if (event.previousContainer === event.container) {
      // Same column - just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different column - move and update status
      const task = event.previousContainer.data[event.previousIndex];

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      // Update task status
      try {
        const currentUserId = this.firebaseService.getCurrentUserId();
        if (!currentUserId) {
          this.message.error('無法取得使用者資訊，請重新登入');
          // Revert the move
          transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
          return;
        }

        await this.taskStore.updateTaskStatus(this.blueprintId(), task.id!, newStatus as TaskStatus, currentUserId);
        this.message.success('任務狀態已更新');
      } catch (err) {
        console.error('Update task status error:', err);
        this.message.error('更新任務狀態失敗');
        // Revert the move
        transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      }
    }
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default'
    };
    return colorMap[priority] || 'default';
  }

  /**
   * Get priority text
   */
  getPriorityText(priority: string): string {
    const textMap: Record<string, string> = {
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return textMap[priority] || priority;
  }

  /**
   * Handle context menu (right-click)
   * 處理右鍵選單
   */
  onContextMenu(event: MouseEvent, task: Task): void {
    event.preventDefault(); // Prevent browser default context menu

    this.menuService.showMenu({
      task,
      position: { x: event.clientX, y: event.clientY },
      viewType: 'kanban',
      allowEdit: true,
      allowDelete: true,
      allowCreateChild: true,
      allowClone: true,
      allowMove: true, // Allow move to column in kanban view
      allowAssign: true
    });
  }

  /**
   * Handle edit task
   * 處理編輯任務
   */
  onEditTask(task: Task): void {
    this.editTask.emit(task);
  }

  /**
   * Handle view task details
   * 處理查看任務詳情
   */
  onViewDetails(task: Task): void {
    // TODO: Implement view details modal
    console.log('View details for task:', task.id);
  }

  /**
   * Handle create child task
   * 處理建立子任務
   */
  onCreateChildTask(task: Task): void {
    this.createChildTask.emit(task);
  }

  /**
   * Handle delete task
   * 處理刪除任務
   */
  onDeleteTask(task: Task): void {
    this.deleteTask.emit(task);
  }

  /**
   * Handle task cloned
   * 處理任務複製完成
   */
  onTaskCloned(clonedTask: Task): void {
    this.message.success('任務已複製成功');
    console.log('Task cloned successfully:', clonedTask.id);
  }
}
