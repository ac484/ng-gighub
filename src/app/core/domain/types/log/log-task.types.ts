/**
 * Log Task Types
 * 日誌任務關聯類型定義
 *
 * Following Occam's Razor: Simple, essential log-task relationship
 * Designed for extensibility without over-engineering
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Log Task Item
 * 日誌中的任務項目
 */
export interface LogTaskItem {
  /** Task ID */
  taskId: string;

  /** Task title (cached for display) */
  taskTitle: string;

  /** Quantity completed in this log */
  quantityCompleted: number;

  /** Unit of measurement */
  unit: string;

  /** Notes for this specific task in this log */
  notes?: string;

  /** Task status at time of log */
  taskStatusAtLog?: string;

  /** Created timestamp */
  createdAt?: Date;
}

/**
 * Create Log Task Item Request
 * 建立日誌任務項目請求
 */
export interface CreateLogTaskItemRequest {
  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** Quantity completed */
  quantityCompleted: number;

  /** Unit */
  unit: string;

  /** Notes */
  notes?: string;
}

/**
 * Log with Tasks
 * 支援任務的日誌 (擴展原有 Log interface)
 */
export interface LogWithTasks {
  /** Tasks completed in this log */
  tasks?: LogTaskItem[];

  /** Total tasks count in this log */
  tasksCount?: number;

  /** Total quantity completed across all tasks */
  totalQuantityCompleted?: number;
}

/**
 * Task Selection Option
 * 任務選擇選項 (用於 UI 下拉選單)
 */
export interface TaskSelectionOption {
  /** Task ID */
  id: string;

  /** Task title */
  title: string;

  /** Total quantity required */
  totalQuantity?: number;

  /** Completed quantity */
  completedQuantity?: number;

  /** Remaining quantity */
  remainingQuantity?: number;

  /** Unit */
  unit?: string;

  /** Is task completed */
  isCompleted: boolean;

  /** Can be selected (not completed) */
  canSelect: boolean;
}

/**
 * Log Task Validation Result
 * 日誌任務驗證結果
 */
export interface LogTaskValidationResult {
  /** Is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Warning message if needs attention */
  warning?: string;

  /** Suggested quantity (if over limit) */
  suggestedQuantity?: number;
}
