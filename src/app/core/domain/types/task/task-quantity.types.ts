/**
 * Task Quantity Extension Types
 * 任務數量擴展類型定義
 *
 * Following Occam's Razor: Simple, essential quantity tracking
 * Designed for extensibility without over-engineering
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Quantity Unit Types
 * 數量單位類型
 */
export enum QuantityUnit {
  /** 件 (pieces) */
  PIECES = 'pieces',
  /** 平方公尺 (square meters) */
  SQUARE_METERS = 'm²',
  /** 立方公尺 (cubic meters) */
  CUBIC_METERS = 'm³',
  /** 公尺 (meters) */
  METERS = 'm',
  /** 公斤 (kilograms) */
  KILOGRAMS = 'kg',
  /** 公噸 (metric tons) */
  METRIC_TONS = 't',
  /** 批次 (batches) */
  BATCHES = 'batches',
  /** 組 (sets) */
  SETS = 'sets',
  /** 自訂 (custom) */
  CUSTOM = 'custom'
}

/**
 * Task Quantity Configuration
 * 任務數量配置
 */
export interface TaskQuantityConfig {
  /** Total quantity required */
  totalQuantity: number;

  /** Unit of measurement */
  unit: string;

  /** Whether quantity tracking is enabled */
  enabled: boolean;

  /** Auto complete when quantity reached */
  autoCompleteOnReached: boolean;

  /** Auto send to QC when completed */
  autoSendToQC: boolean;

  /** Allow partial completion */
  allowPartial?: boolean;

  /** Minimum quantity per log entry */
  minQuantityPerLog?: number;

  /** Maximum quantity per log entry */
  maxQuantityPerLog?: number;
}

/**
 * Task Quantity Status
 * 任務數量狀態
 */
export interface TaskQuantityStatus {
  /** Total quantity required */
  total: number;

  /** Completed quantity */
  completed: number;

  /** Remaining quantity */
  remaining: number;

  /** Unit */
  unit: string;

  /** Completion percentage (0-100) */
  percentage: number;

  /** Is completed */
  isCompleted: boolean;

  /** Is over completed */
  isOverCompleted: boolean;

  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Quantity Validation Result
 * 數量驗證結果
 */
export interface QuantityValidationResult {
  /** Is valid */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Warning message if needs attention */
  warning?: string;
}

/**
 * Task with Quantity Support
 * 支援數量的任務 (擴展原有 Task interface)
 */
export interface TaskWithQuantity {
  /** Quantity configuration */
  quantityConfig?: TaskQuantityConfig;

  /** Current quantity status */
  quantityStatus?: TaskQuantityStatus;

  /** Completed quantity (denormalized for quick access) */
  completedQuantity?: number;
}

/**
 * Create Task with Quantity Request
 * 建立支援數量的任務請求
 */
export interface CreateTaskWithQuantityRequest {
  /** Basic task fields */
  title: string;
  description?: string;
  blueprintId: string;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Date;

  /** Quantity configuration */
  quantityConfig?: Partial<TaskQuantityConfig>;
}

/**
 * Update Task Quantity Request
 * 更新任務數量請求
 */
export interface UpdateTaskQuantityRequest {
  /** Quantity delta (can be positive or negative) */
  quantityDelta: number;

  /** Source of the update */
  source: 'log' | 'manual' | 'qc_adjustment';

  /** Source ID (e.g., log ID) */
  sourceId?: string;

  /** Actor account ID */
  actorId: string;

  /** Notes */
  notes?: string;
}
