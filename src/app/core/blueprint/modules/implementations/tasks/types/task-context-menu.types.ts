/**
 * Task Context Menu Types
 * 任務右鍵選單類型定義
 *
 * Type definitions for the unified context menu system across all task views.
 * Supports tree, kanban, timeline, and Gantt chart views.
 *
 * @author GigHub Development Team
 * @date 2025-12-14
 */

import { Task } from '@core/domain/types/task/task.types';

/**
 * Context menu action types
 * 右鍵選單操作類型
 */
export enum MenuAction {
  /** Edit task - 編輯任務 */
  EDIT = 'edit',

  /** View task details - 查看詳情 */
  VIEW_DETAILS = 'view-details',

  /** Create child task - 建立子任務 */
  CREATE_CHILD = 'create-child',

  /** Update task status - 更新狀態 */
  UPDATE_STATUS = 'update-status',

  /** Assign task - 分配任務 */
  ASSIGN = 'assign',

  /** Clone task - 複製任務 */
  CLONE = 'clone',

  /** Move task - 移動任務 */
  MOVE = 'move',

  /** Delete task - 刪除任務 */
  DELETE = 'delete',

  /** Expand tree node - 展開節點 (樹狀視圖) */
  EXPAND = 'expand',

  /** Collapse tree node - 收合節點 (樹狀視圖) */
  COLLAPSE = 'collapse',

  /** Move to column - 移動到欄位 (看板視圖) */
  MOVE_TO_COLUMN = 'move-to-column',

  /** Adjust timeline - 調整時間軸 (時間線視圖) */
  ADJUST_TIMELINE = 'adjust-timeline',

  /** Set dependency - 設定依賴 (甘特圖視圖) */
  SET_DEPENDENCY = 'set-dependency'
}

/**
 * Context menu item definition
 * 右鍵選單項目定義
 */
export interface ContextMenuItem {
  /** Unique identifier for the menu item */
  key: string;

  /** Display label */
  label: string;

  /** Icon name (ng-zorro-antd icon) */
  icon?: string;

  /** Is this a divider? */
  divider?: boolean;

  /** Is this item disabled? */
  disabled?: boolean;

  /** Should this item be hidden? */
  hidden?: boolean;

  /** Menu item is dangerous (red color) */
  danger?: boolean;

  /** Child menu items (submenu) */
  children?: ContextMenuItem[];

  /** Action to execute */
  action?: MenuAction;

  /** Additional data for the action */
  actionData?: any;

  /** Required permission to show this item */
  permission?: string;

  /** Handler function */
  handler?: (task: Task) => void | Promise<void>;
}

/**
 * Context menu configuration
 * 右鍵選單配置
 */
export interface TaskContextMenuConfig {
  /** Target task */
  task: Task;

  /** Menu position (client coordinates) */
  position: { x: number; y: number };

  /** View type where menu was triggered */
  viewType: 'tree' | 'kanban' | 'timeline' | 'gantt' | 'list';

  /** Can user edit this task? */
  allowEdit: boolean;

  /** Can user delete this task? */
  allowDelete: boolean;

  /** Can user create child task? */
  allowCreateChild: boolean;

  /** Can user clone this task? */
  allowClone: boolean;

  /** Can user move this task? */
  allowMove: boolean;

  /** Can user assign this task? */
  allowAssign: boolean;

  /** Additional view-specific options */
  viewOptions?: Record<string, any>;
}

/**
 * Context menu event payload
 * 右鍵選單事件資料
 */
export interface ContextMenuActionPayload {
  /** Action type */
  action: MenuAction;

  /** Target task */
  task: Task;

  /** Additional action data */
  data?: any;

  /** View type */
  viewType: string;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Clone task options
 * 複製任務選項
 */
export interface CloneTaskOptions {
  /** Reset dates (dueDate, startDate) */
  resetDates?: boolean;

  /** Reset assignee */
  resetAssignee?: boolean;

  /** Include child tasks */
  includeChildren?: boolean;

  /** New parent ID (if moving to different parent) */
  newParentId?: string | null;
}

/**
 * Menu item builder function type
 * 選單項目建構函式類型
 */
export type MenuItemBuilder = (task: Task, config: TaskContextMenuConfig) => ContextMenuItem[];

/**
 * Context menu state
 * 右鍵選單狀態
 */
export interface ContextMenuState {
  /** Is menu visible? */
  visible: boolean;

  /** Current configuration */
  config: TaskContextMenuConfig | null;

  /** Menu items to display */
  items: ContextMenuItem[];

  /** Is menu loading? */
  loading: boolean;
}
