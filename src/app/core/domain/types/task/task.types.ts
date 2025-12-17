/**
 * Task Types
 * 任務類型定義
 *
 * Following Occam's Razor: Simple, essential task management
 * Designed for extensibility without over-engineering
 *
 * Unified type definitions for all task-related operations
 * Consolidates Task, TaskDocument, and related types
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

/**
 * Task status enum
 * 任務狀態列舉
 *
 * Unified from previous Task and TaskDocument implementations
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Task priority enum
 * 任務優先級列舉
 *
 * Unified from previous Task and TaskDocument implementations
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Assignee type enum
 * 指派對象類型列舉
 *
 * Defines who the task can be assigned to
 */
export enum AssigneeType {
  /** Individual user */
  USER = 'user',
  /** Internal team */
  TEAM = 'team',
  /** External partner */
  PARTNER = 'partner'
}

/**
 * Task entity
 * 任務實體
 *
 * Unified interface consolidating Task and TaskDocument
 * Used for both top-level and subcollection operations
 */
export interface Task {
  /** Task ID */
  readonly id?: string;

  /** Blueprint ID this task belongs to */
  blueprintId: string;

  /** Task title */
  title: string;

  /** Task description (optional) */
  description?: string;

  /** Task status */
  status: TaskStatus;

  /** Task priority */
  priority: TaskPriority;

  /**
   * Assignee type - who is this task assigned to
   * 指派對象類型
   */
  assigneeType?: AssigneeType;

  /** Assignee account ID (optional) - for USER type */
  assigneeId?: string;

  /** Assignee name (optional) - for USER type */
  assigneeName?: string;

  /**
   * Team ID (optional) - for TEAM type
   * Reference to teams collection
   */
  assigneeTeamId?: string;

  /**
   * Team name (optional) - for TEAM type
   */
  assigneeTeamName?: string;

  /**
   * Partner ID (optional) - for PARTNER type
   * Reference to partners collection
   */
  assigneePartnerId?: string;

  /**
   * Partner name (optional) - for PARTNER type
   */
  assigneePartnerName?: string;

  /** Creator account ID */
  creatorId: string;

  /** Creator name (optional) */
  creatorName?: string;

  /** Due date (optional) */
  dueDate?: Date;

  /** Start date (optional) */
  startDate?: Date;

  /** Completed date (optional) */
  completedDate?: Date;

  /** Estimated hours (optional) */
  estimatedHours?: number;

  /** Actual hours (optional) */
  actualHours?: number;

  /** Progress percentage (0-100) */
  progress?: number;

  /**
   * Estimated budget/amount for this task (optional)
   * 預估金額/預算
   *
   * For parent tasks: Sum of all child task budgets cannot exceed this amount
   * For leaf tasks: The actual budget allocated to this task
   */
  estimatedBudget?: number;

  /**
   * Actual budget/amount spent (optional)
   * 實際金額
   */
  actualBudget?: number;

  /**
   * Parent task ID for hierarchical structure (optional)
   *
   * When a parent task is deleted, child tasks become orphaned (parentId = null).
   * Deletion is NOT cascaded by default. Consumers must handle orphaned tasks as needed.
   */
  parentId?: string | null;

  /**
   * Task dependencies - array of task IDs that must be completed first (optional)
   *
   * Constraints:
   * 1. If a dependency task is deleted, its ID should be removed from all dependencies arrays.
   * 2. Circular dependencies are prevented by isValidParentChild() utility function.
   * 3. Maximum recommended dependencies per task: 20.
   */
  dependencies?: string[];

  /** Tags (optional) */
  tags?: string[];

  /** Attachments (reserved) */
  attachments?: string[];

  /** Metadata for extensions */
  metadata?: Record<string, unknown>;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * Create task request
 * 創建任務請求
 *
 * Unified interface for task creation
 * Note: blueprintId is passed as a method parameter, not in the request object
 */
export interface CreateTaskRequest {
  /** Task title */
  title: string;

  /** Task description (optional) */
  description?: string;

  /** Task priority (defaults to MEDIUM) */
  priority?: TaskPriority;

  /**
   * Assignee type - who is this task assigned to
   * 指派對象類型
   */
  assigneeType?: AssigneeType;

  /** Assignee account ID (optional) - for USER type */
  assigneeId?: string;

  /** Assignee name (optional) - for USER type */
  assigneeName?: string;

  /**
   * Team ID (optional) - for TEAM type
   * Reference to teams collection
   */
  assigneeTeamId?: string;

  /**
   * Team name (optional) - for TEAM type
   */
  assigneeTeamName?: string;

  /**
   * Partner ID (optional) - for PARTNER type
   * Reference to partners collection
   */
  assigneePartnerId?: string;

  /**
   * Partner name (optional) - for PARTNER type
   */
  assigneePartnerName?: string;

  /** Creator account ID */
  creatorId: string;

  /** Creator name (optional) */
  creatorName?: string;

  /** Due date (optional) */
  dueDate?: Date;

  /** Start date (optional) */
  startDate?: Date;

  /** Estimated hours (optional) */
  estimatedHours?: number;

  /** Estimated budget/amount (optional) */
  estimatedBudget?: number;

  /** Actual budget/amount (optional) */
  actualBudget?: number;

  /** Progress percentage (0-100) (optional) */
  progress?: number;

  /** Initial status (defaults to PENDING) */
  status?: TaskStatus;

  /** Parent task ID for hierarchical structure (optional) */
  parentId?: string | null;

  /** Task dependencies - array of task IDs (optional) */
  dependencies?: string[];

  /** Tags (optional) */
  tags?: string[];

  /** Metadata (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Update task request
 * 更新任務請求
 *
 * Unified interface for task updates
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateTaskRequest {
  /** Task title */
  title?: string;

  /** Task description */
  description?: string;

  /** Task status */
  status?: TaskStatus;

  /** Task priority */
  priority?: TaskPriority;

  /**
   * Assignee type - who is this task assigned to
   * 指派對象類型
   */
  assigneeType?: AssigneeType;

  /** Assignee account ID - for USER type */
  assigneeId?: string;

  /** Assignee name - for USER type */
  assigneeName?: string;

  /**
   * Team ID - for TEAM type
   * Reference to teams collection
   */
  assigneeTeamId?: string;

  /**
   * Team name - for TEAM type
   */
  assigneeTeamName?: string;

  /**
   * Partner ID - for PARTNER type
   * Reference to partners collection
   */
  assigneePartnerId?: string;

  /**
   * Partner name - for PARTNER type
   */
  assigneePartnerName?: string;

  /** Due date */
  dueDate?: Date;

  /** Start date */
  startDate?: Date;

  /** Completed date */
  completedDate?: Date;

  /** Estimated hours */
  estimatedHours?: number;

  /** Actual hours */
  actualHours?: number;

  /** Estimated budget/amount */
  estimatedBudget?: number;

  /** Actual budget/amount */
  actualBudget?: number;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Parent task ID */
  parentId?: string | null;

  /** Task dependencies */
  dependencies?: string[];

  /** Tags */
  tags?: string[];

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Task query options
 * 任務查詢選項
 *
 * Unified interface for querying tasks with various filters
 */
export interface TaskQueryOptions {
  /** Filter by blueprint ID */
  blueprintId?: string;

  /** Filter by status */
  status?: TaskStatus;

  /** Filter by priority */
  priority?: TaskPriority;

  /** Filter by assignee */
  assigneeId?: string;

  /** Filter by creator */
  creatorId?: string;

  /** Include deleted tasks */
  includeDeleted?: boolean;

  /** Limit results */
  limit?: number;
}

/**
 * Type aliases for backward compatibility
 * 向後兼容的類型別名
 */

/** @deprecated Use Task instead */
export type TaskDocument = Task;

/** @deprecated Use CreateTaskRequest instead */
export type CreateTaskData = CreateTaskRequest;

/** @deprecated Use UpdateTaskRequest instead */
export type UpdateTaskData = UpdateTaskRequest;
