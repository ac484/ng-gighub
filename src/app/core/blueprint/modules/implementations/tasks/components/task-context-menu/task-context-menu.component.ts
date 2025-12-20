/**
 * Task Context Menu Component
 * 任務右鍵選單元件
 *
 * Displays a context menu with task operations.
 * Uses ng-zorro-antd dropdown for menu UI.
 *
 * Following ⭐.md: Standalone component with Signal-based state
 *
 * @author GigHub Development Team
 * @date 2025-12-14
 */

import { Component, input, output, computed, inject, ViewChild } from '@angular/core';
import { Task } from '@core/domain/types/task/task.types';
import { TaskStore } from '@core/state/stores/task.store';
import { SHARED_IMPORTS } from '@shared';
import { NzDropDownModule, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

import { TaskContextMenuService } from '../../services/task-context-menu.service';
import { MenuAction, ContextMenuItem } from '../../types/task-context-menu.types';

@Component({
  selector: 'app-task-context-menu',
  standalone: true,
  imports: [SHARED_IMPORTS, NzDropDownModule, NzPopconfirmModule],
  templateUrl: './task-context-menu.component.html',
  styleUrls: ['./task-context-menu.component.less']
})
export class TaskContextMenuComponent {
  private readonly menuService = inject(TaskContextMenuService);
  private readonly taskStore = inject(TaskStore);

  @ViewChild('contextMenu', { static: false, read: NzDropdownMenuComponent })
  contextMenuComponent?: NzDropdownMenuComponent;

  // Inputs
  task = input<Task | null>(null);
  blueprintId = input.required<string>();
  viewType = input<'tree' | 'kanban' | 'timeline' | 'gantt' | 'list'>('list');

  // Outputs
  edit = output<Task>();
  viewDetails = output<Task>();
  createChild = output<Task>();
  delete = output<Task>();
  statusChanged = output<{ task: Task; status: string }>();
  assigned = output<{ task: Task; assigneeId: string }>();
  cloned = output<Task>();

  // State from service
  readonly visible = computed(() => this.menuService.visible());
  readonly menuItems = computed(() => this.menuService.items());
  readonly menuConfig = computed(() => this.menuService.config());

  /**
   * Handle menu item click
   * 處理選單項目點擊
   */
  async handleMenuClick(item: ContextMenuItem): Promise<void> {
    const task = this.task();

    if (!task || !item.action || item.disabled) {
      return;
    }

    // Emit action to service
    this.menuService.handleAction(item.action, task, item.actionData);

    // Handle specific actions
    switch (item.action) {
      case MenuAction.EDIT:
        this.edit.emit(task);
        break;

      case MenuAction.VIEW_DETAILS:
        this.viewDetails.emit(task);
        break;

      case MenuAction.CREATE_CHILD:
        this.createChild.emit(task);
        break;

      case MenuAction.UPDATE_STATUS:
        if (item.actionData?.status) {
          this.statusChanged.emit({ task, status: item.actionData.status });
          await this.taskStore.updateTaskStatus(
            this.blueprintId(),
            task.id!,
            item.actionData.status,
            'current-user' // TODO: Get actual current user ID
          );
        }
        break;

      case MenuAction.ASSIGN:
        // TODO: Show assign dialog
        break;

      case MenuAction.CLONE:
        try {
          const clonedTask = await this.taskStore.cloneTask(
            this.blueprintId(),
            task.id!,
            'current-user', // TODO: Get actual current user ID
            { resetDates: true, resetAssignee: true }
          );
          this.cloned.emit(clonedTask);
        } catch (error) {
          console.error('Failed to clone task:', error);
        }
        break;

      case MenuAction.DELETE:
        // Delete is handled by parent component with confirmation
        this.delete.emit(task);
        break;

      default:
        console.log('Unhandled action:', item.action);
    }
  }

  /**
   * Hide menu
   * 隱藏選單
   */
  hideMenu(): void {
    this.menuService.hideMenu();
  }
}
