/**
 * Storage Types
 * 儲存類型定義
 *
 * Following Occam's Razor: Simple, essential types for storage operations
 */

/**
 * Upload result from storage operation
 * 儲存操作的上傳結果
 */
export interface UploadResult {
  /** File path in storage */
  path: string;
  /** Full URL to access the file */
  fullPath: string;
  /** Public URL (if available) */
  publicUrl?: string;
}

/**
 * File object metadata
 * 檔案物件元資料
 */
export interface FileObject {
  /** File name */
  name: string;
  /** File path */
  path: string;
  /** File ID (if provided by storage) */
  id?: string;
  /** Last updated timestamp */
  updated_at?: string;
  /** Created timestamp */
  created_at?: string;
  /** Last accessed timestamp */
  last_accessed_at?: string;
  /** File metadata */
  metadata?: Record<string, any>;
}

/**
 * Storage error
 * 儲存錯誤
 */
export interface StorageError {
  message: string;
  statusCode?: string;
  error?: string;
}

/**
 * Upload options
 * 上傳選項
 */
export interface UploadOptions {
  /** Cache control header */
  cacheControl?: string;
  /** Content type */
  contentType?: string;
  /** Whether to upsert (overwrite if exists) */
  upsert?: boolean;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Download options
 * 下載選項
 */
export interface DownloadOptions {
  /** Transform options for images */
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * List options
 * 列表選項
 */
export interface ListOptions {
  /** Limit number of files */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort by column */
  sortBy?: {
    column: string;
    order: 'asc' | 'desc';
  };
}
