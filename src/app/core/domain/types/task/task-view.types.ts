/**
 * Task View Types
 * 任務視圖類型定義
 *
 * Defines view modes and related types for task visualization
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

/**
 * Task view mode enum
 * 任務視圖模式列舉
 */
export enum TaskViewMode {
  LIST = 'list',
  TREE = 'tree',
  KANBAN = 'kanban',
  GANTT = 'gantt',
  TIMELINE = 'timeline'
}

/**
 * Task tree node
 * 任務樹狀節點
 *
 * Used for tree view hierarchical display
 */
export interface TaskTreeNode {
  /** Node key (task ID) */
  key: string;

  /** Node title */
  title: string;

  /** Task ID */
  taskId: string;

  /** Parent task ID (optional) */
  parentId?: string;

  /** Child nodes */
  children?: TaskTreeNode[];

  /** Is leaf node */
  isLeaf?: boolean;

  /** Is expanded */
  expanded?: boolean;

  /** Is selected */
  selected?: boolean;

  /** Icon name */
  icon?: string;

  /** Reference to the original task */
  task?: any;
}

/**
 * Kanban column
 * 看板欄位
 */
export interface KanbanColumn {
  /** Column ID */
  id: string;

  /** Column title */
  title: string;

  /** Task status */
  status: string;

  /** Tasks in this column */
  tasks: any[];

  /** Column color */
  color?: string;

  /** Maximum tasks allowed */
  maxTasks?: number;
}

/**
 * Timeline item
 * 時間線項目
 */
export interface TimelineItem {
  /** Item ID */
  id: string;

  /** Event date */
  date: Date;

  /** Event title */
  title: string;

  /** Event description */
  description?: string;

  /** Status color */
  color?: string;

  /** Icon */
  icon?: string;

  /** Related task */
  task?: any;
}

/**
 * Gantt task
 * 甘特圖任務
 */
export interface GanttTask {
  /** Task ID */
  id: string;

  /** Task name */
  name: string;

  /** Start date */
  start: Date;

  /** End date */
  end: Date;

  /** Progress (0-100) */
  progress: number;

  /** Dependencies (task IDs) */
  dependencies?: string[];

  /** Task color */
  color?: string;

  /** Is milestone */
  milestone?: boolean;

  /** Has no dates set (for visual distinction) */
  hasNoDates?: boolean;
}
