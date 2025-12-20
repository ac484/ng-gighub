/**
 * Task Context Menu Service
 * 任務右鍵選單服務
 *
 * Manages context menu state, configuration, and business logic.
 * Provides menu item building based on permissions and task state.
 *
 * Following ⭐.md: Service layer for business logic coordination
 *
 * @author GigHub Development Team
 * @date 2025-12-14
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events/event-bus';
import { Task, TaskStatus } from '@core/domain/types/task/task.types';

import { TASKS_MODULE_EVENTS } from '../module.metadata';
import {
  MenuAction,
  ContextMenuItem,
  TaskContextMenuConfig,
  ContextMenuState,
  ContextMenuActionPayload
} from '../types/task-context-menu.types';

@Injectable({
  providedIn: 'root'
})
export class TaskContextMenuService {
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  // Private state
  private _state = signal<ContextMenuState>({
    visible: false,
    config: null,
    items: [],
    loading: false
  });

  // Public readonly state
  readonly state = this._state.asReadonly();

  // Computed properties
  readonly visible = computed(() => this._state().visible);
  readonly config = computed(() => this._state().config);
  readonly items = computed(() => this._state().items);
  readonly loading = computed(() => this._state().loading);

  /**
   * Show context menu
   * 顯示右鍵選單
   *
   * @param config - Menu configuration
   */
  showMenu(config: TaskContextMenuConfig): void {
    this.logger.info('[TaskContextMenuService]', 'Showing context menu', { task: config.task.id, viewType: config.viewType });

    // Build menu items based on config
    const items = this.buildMenuItems(config);

    // Update state
    this._state.set({
      visible: true,
      config,
      items,
      loading: false
    });

    // Emit event
    this.eventBus.emit(
      TASKS_MODULE_EVENTS.CONTEXT_MENU_OPENED,
      {
        taskId: config.task.id,
        viewType: config.viewType,
        position: config.position
      },
      'tasks-module'
    );
  }

  /**
   * Hide context menu
   * 隱藏右鍵選單
   */
  hideMenu(): void {
    const currentConfig = this._state().config;

    if (currentConfig) {
      this.logger.info('[TaskContextMenuService]', 'Hiding context menu');

      // Emit event
      this.eventBus.emit(
        TASKS_MODULE_EVENTS.CONTEXT_MENU_CLOSED,
        {
          taskId: currentConfig.task.id,
          viewType: currentConfig.viewType
        },
        'tasks-module'
      );
    }

    // Reset state
    this._state.set({
      visible: false,
      config: null,
      items: [],
      loading: false
    });
  }

  /**
   * Handle menu action
   * 處理選單操作
   *
   * @param action - Menu action type
   * @param task - Target task
   * @param data - Additional action data
   */
  handleAction(action: MenuAction, task: Task, data?: any): void {
    const config = this._state().config;

    if (!config) {
      this.logger.warn('[TaskContextMenuService]', 'No config available for action');
      return;
    }

    this.logger.info('[TaskContextMenuService]', 'Handling menu action', { action, taskId: task.id });

    // Emit event
    const payload: ContextMenuActionPayload = {
      action,
      task,
      data,
      viewType: config.viewType,
      timestamp: new Date()
    };

    this.eventBus.emit(TASKS_MODULE_EVENTS.CONTEXT_MENU_ACTION, payload, 'tasks-module');

    // Hide menu after action (except for submenu actions)
    if (!this.isSubmenuAction(action)) {
      this.hideMenu();
    }
  }

  /**
   * Build menu items based on configuration
   * 根據配置建立選單項目
   *
   * @param config - Menu configuration
   * @returns Array of menu items
   * @private
   */
  private buildMenuItems(config: TaskContextMenuConfig): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];
    const task = config.task;

    // Edit task
    if (config.allowEdit) {
      items.push({
        key: 'edit',
        label: '編輯任務',
        icon: 'edit',
        action: MenuAction.EDIT,
        disabled: false
      });
    }

    // View details
    items.push({
      key: 'view-details',
      label: '查看詳情',
      icon: 'eye',
      action: MenuAction.VIEW_DETAILS,
      disabled: false
    });

    // Create child task
    if (config.allowCreateChild) {
      items.push({
        key: 'create-child',
        label: '建立子任務',
        icon: 'plus-circle',
        action: MenuAction.CREATE_CHILD,
        disabled: false
      });
    }

    // Divider
    items.push({
      key: 'divider-1',
      label: '',
      divider: true
    });

    // Update status submenu
    items.push({
      key: 'update-status',
      label: '更新狀態',
      icon: 'check-circle',
      children: [
        {
          key: 'status-pending',
          label: '待處理',
          action: MenuAction.UPDATE_STATUS,
          actionData: { status: TaskStatus.PENDING },
          disabled: task.status === TaskStatus.PENDING
        },
        {
          key: 'status-in-progress',
          label: '進行中',
          action: MenuAction.UPDATE_STATUS,
          actionData: { status: TaskStatus.IN_PROGRESS },
          disabled: task.status === TaskStatus.IN_PROGRESS
        },
        {
          key: 'status-on-hold',
          label: '暫停',
          action: MenuAction.UPDATE_STATUS,
          actionData: { status: TaskStatus.ON_HOLD },
          disabled: task.status === TaskStatus.ON_HOLD
        },
        {
          key: 'status-completed',
          label: '已完成',
          action: MenuAction.UPDATE_STATUS,
          actionData: { status: TaskStatus.COMPLETED },
          disabled: task.status === TaskStatus.COMPLETED
        },
        {
          key: 'status-cancelled',
          label: '已取消',
          action: MenuAction.UPDATE_STATUS,
          actionData: { status: TaskStatus.CANCELLED },
          disabled: task.status === TaskStatus.CANCELLED
        }
      ]
    });

    // Assign task (if allowed)
    if (config.allowAssign) {
      items.push({
        key: 'assign',
        label: '分配給',
        icon: 'user',
        action: MenuAction.ASSIGN
      });
    }

    // Divider
    items.push({
      key: 'divider-2',
      label: '',
      divider: true
    });

    // Clone task
    if (config.allowClone) {
      items.push({
        key: 'clone',
        label: '複製任務',
        icon: 'copy',
        action: MenuAction.CLONE,
        disabled: false
      });
    }

    // View-specific actions
    this.addViewSpecificItems(items, config);

    // Divider
    items.push({
      key: 'divider-3',
      label: '',
      divider: true
    });

    // Delete task
    if (config.allowDelete) {
      items.push({
        key: 'delete',
        label: '刪除任務',
        icon: 'delete',
        action: MenuAction.DELETE,
        danger: true,
        disabled: false
      });
    }

    return items;
  }

  /**
   * Add view-specific menu items
   * 添加視圖特定的選單項目
   *
   * @param items - Current menu items array
   * @param config - Menu configuration
   * @private
   */
  private addViewSpecificItems(items: ContextMenuItem[], config: TaskContextMenuConfig): void {
    switch (config.viewType) {
      case 'tree':
        // Expand/Collapse for tree view
        if (config.task.parentId || this.hasChildren(config.task)) {
          items.push({
            key: 'divider-tree',
            label: '',
            divider: true
          });

          items.push({
            key: 'expand',
            label: '展開',
            icon: 'plus-square',
            action: MenuAction.EXPAND
          });

          items.push({
            key: 'collapse',
            label: '收合',
            icon: 'minus-square',
            action: MenuAction.COLLAPSE
          });
        }
        break;

      case 'kanban':
        // Move to column for kanban view
        items.push({
          key: 'divider-kanban',
          label: '',
          divider: true
        });

        items.push({
          key: 'move-column',
          label: '移動到欄位',
          icon: 'swap',
          action: MenuAction.MOVE_TO_COLUMN
        });
        break;

      case 'timeline':
        // Adjust timeline
        items.push({
          key: 'divider-timeline',
          label: '',
          divider: true
        });

        items.push({
          key: 'adjust-timeline',
          label: '調整時間軸',
          icon: 'calendar',
          action: MenuAction.ADJUST_TIMELINE
        });
        break;

      case 'gantt':
        // Set dependencies
        items.push({
          key: 'divider-gantt',
          label: '',
          divider: true
        });

        items.push({
          key: 'set-dependency',
          label: '設定依賴關係',
          icon: 'branches',
          action: MenuAction.SET_DEPENDENCY
        });
        break;
    }
  }

  /**
   * Check if action is submenu action
   * 檢查是否為子選單操作
   *
   * @param action - Menu action
   * @returns True if submenu action
   * @private
   */
  private isSubmenuAction(_action: MenuAction): boolean {
    // Submenu actions don't close the menu immediately
    return false; // All actions close menu for now
  }

  /**
   * Check if task has children
   * 檢查任務是否有子任務
   *
   * @param task - Task to check
   * @returns True if has children (placeholder logic)
   * @private
   */
  private hasChildren(_task: Task): boolean {
    // TODO: Implement actual check (query children from repository)
    // For now, assume tasks can have children
    return true;
  }
}
