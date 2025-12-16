/**
 * Log Types
 * 日誌類型定義
 *
 * Following Occam's Razor: Simple, essential construction log management
 * Designed for extensibility (future: voice records, documents)
 */

/**
 * Log photo
 * 日誌照片
 */
export interface LogPhoto {
  /** Photo ID */
  id: string;

  /** Storage URL */
  url: string;

  /** Public URL for display */
  publicUrl?: string;

  /** Photo caption/description */
  caption?: string;

  /** Upload timestamp */
  uploadedAt: Date;

  /** File size in bytes */
  size?: number;

  /** File name */
  fileName?: string;
}

/**
 * Log entity
 * 日誌實體
 *
 * Simplified interface - extensions can be added when needed
 */
export interface Log {
  /** Log ID */
  id: string;

  /** Blueprint ID this log belongs to */
  blueprintId: string;

  /** Log date (work date) */
  date: Date;

  /** Log title */
  title: string;

  /** Log description/content */
  description?: string;

  /** Work hours */
  workHours?: number;

  /** Number of workers */
  workers?: number;

  /** Equipment used */
  equipment?: string;

  /** Weather conditions */
  weather?: string;

  /** Temperature (Celsius) */
  temperature?: number | null;

  /** Photos */
  photos: LogPhoto[];

  /** Creator account ID */
  creatorId: string;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * Create log request
 * 創建日誌請求
 */
export interface CreateLogRequest {
  /** Blueprint ID */
  blueprintId: string;

  /** Log date */
  date: Date;

  /** Log title */
  title: string;

  /** Log description */
  description?: string;

  /** Work hours */
  workHours?: number;

  /** Number of workers */
  workers?: number;

  /** Equipment */
  equipment?: string;

  /** Weather */
  weather?: string;

  /** Temperature */
  temperature?: number | null;

  /** Creator account ID */
  creatorId: string;
}

/**
 * Update log request
 * 更新日誌請求
 */
export interface UpdateLogRequest {
  /** Log date */
  date?: Date;

  /** Log title */
  title?: string;

  /** Log description */
  description?: string;

  /** Work hours */
  workHours?: number;

  /** Number of workers */
  workers?: number;

  /** Equipment */
  equipment?: string;

  /** Weather */
  weather?: string;

  /** Temperature */
  temperature?: number | null;
}

/**
 * Log query options
 * 日誌查詢選項
 */
export interface LogQueryOptions {
  /** Filter by blueprint ID */
  blueprintId?: string;

  /** Filter by date range (start) */
  startDate?: Date;

  /** Filter by date range (end) */
  endDate?: Date;

  /** Filter by creator */
  creatorId?: string;

  /** Include deleted logs */
  includeDeleted?: boolean;

  /** Limit results */
  limit?: number;
}
