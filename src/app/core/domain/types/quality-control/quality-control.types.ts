/**
 * Quality Control Types
 * 品管類型定義
 *
 * Following Occam's Razor: Simple, essential QC management
 * Designed for extensibility without over-engineering
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Quality Control Status
 * 品管狀態
 */
export enum QCStatus {
  /** 待審核 */
  PENDING = 'pending',
  /** 審核中 */
  IN_PROGRESS = 'in_progress',
  /** 通過 */
  PASSED = 'passed',
  /** 部分通過 */
  PARTIALLY_PASSED = 'partially_passed',
  /** 駁回 */
  REJECTED = 'rejected',
  /** 需要重工 */
  REQUIRES_REWORK = 'requires_rework',
  /** 已取消 */
  CANCELLED = 'cancelled'
}

/**
 * QC Issue Severity
 * 問題嚴重程度
 */
export enum QCIssueSeverity {
  /** 輕微 - 可接受 */
  MINOR = 'minor',
  /** 中等 - 需要注意 */
  MODERATE = 'moderate',
  /** 嚴重 - 需要修正 */
  MAJOR = 'major',
  /** 致命 - 必須重做 */
  CRITICAL = 'critical'
}

/**
 * QC Issue
 * 品管問題
 */
export interface QCIssue {
  /** Issue ID */
  id: string;

  /** Issue description */
  description: string;

  /** Severity level */
  severity: QCIssueSeverity;

  /** Location/Area affected */
  location?: string;

  /** Photo URLs */
  photos?: string[];

  /** Suggested action */
  suggestedAction?: string;

  /** Created timestamp */
  createdAt: Date;
}

/**
 * QC Photo
 * 品管照片
 */
export interface QCPhoto {
  /** Photo ID */
  id: string;

  /** Storage URL */
  url: string;

  /** Public URL for display */
  publicUrl?: string;

  /** Caption/Description */
  caption?: string;

  /** Upload timestamp */
  uploadedAt: Date;

  /** File size in bytes */
  size?: number;

  /** File name */
  fileName?: string;
}

/**
 * Quality Control Record
 * 品管記錄
 */
export interface QualityControl {
  /** QC ID */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** Task ID being inspected */
  taskId: string;

  /** Task title (cached for display) */
  taskTitle: string;

  /** QC Status */
  status: QCStatus;

  /** Inspector account ID */
  inspectorId?: string;

  /** Inspector name (cached) */
  inspectorName?: string;

  /** Inspection notes */
  notes?: string;

  /** Inspection photos */
  photos: QCPhoto[];

  /** Issues found */
  issues: QCIssue[];

  /** Total quantity inspected */
  inspectedQuantity?: number;

  /** Passed quantity */
  passedQuantity?: number;

  /** Rejected quantity */
  rejectedQuantity?: number;

  /** Unit of measurement */
  unit?: string;

  /** Inspection start date */
  inspectionStartDate?: Date;

  /** Inspection end date */
  inspectionEndDate?: Date;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Soft delete timestamp */
  deletedAt?: Date | null;

  /** Metadata for extensions */
  metadata?: Record<string, any>;
}

/**
 * Create QC Request
 * 建立品管記錄請求
 */
export interface CreateQCRequest {
  /** Blueprint ID */
  blueprintId: string;

  /** Task ID */
  taskId: string;

  /** Task title (cached) */
  taskTitle: string;

  /** Inspector ID (optional, can be assigned later) */
  inspectorId?: string;

  /** Initial notes */
  notes?: string;

  /** Inspected quantity */
  inspectedQuantity?: number;

  /** Unit */
  unit?: string;
}

/**
 * Update QC Request
 * 更新品管記錄請求
 */
export interface UpdateQCRequest {
  /** Status update */
  status?: QCStatus;

  /** Inspector ID */
  inspectorId?: string;

  /** Notes */
  notes?: string;

  /** Passed quantity */
  passedQuantity?: number;

  /** Rejected quantity */
  rejectedQuantity?: number;

  /** Inspection end date */
  inspectionEndDate?: Date;
}

/**
 * QC Query Options
 * 品管查詢選項
 */
export interface QCQueryOptions {
  /** Filter by blueprint ID */
  blueprintId?: string;

  /** Filter by task ID */
  taskId?: string;

  /** Filter by status */
  status?: QCStatus;

  /** Filter by inspector */
  inspectorId?: string;

  /** Filter by date range (start) */
  startDate?: Date;

  /** Filter by date range (end) */
  endDate?: Date;

  /** Include deleted records */
  includeDeleted?: boolean;

  /** Limit results */
  limit?: number;
}

/**
 * QC Statistics
 * 品管統計
 */
export interface QCStatistics {
  /** Total QC records */
  total: number;

  /** Pending count */
  pending: number;

  /** In progress count */
  inProgress: number;

  /** Passed count */
  passed: number;

  /** Rejected count */
  rejected: number;

  /** Pass rate (0-100) */
  passRate: number;

  /** Average inspection time (in hours) */
  avgInspectionTime?: number;
}
