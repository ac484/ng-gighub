/**
 * Type definitions for Firebase Storage Functions
 * Enterprise-standard type safety for file operations
 */

/**
 * Allowed file content types for upload validation
 */
export const ALLOWED_CONTENT_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Others
  'application/json',
  'application/xml'
] as const;

/**
 * Blocked file extensions for security
 */
export const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.scr', '.vbs', '.js', '.jar'] as const;

/**
 * Maximum file size in bytes (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * File metadata for processing
 */
export interface FileMetadata {
  processed: string;
  validationStatus: 'success' | 'failed';
  processedAt: string;
  originalName: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'text' | 'other';
  requiresThumbnail?: string;
  requiresProcessing?: string;
  validationReason?: string;
  scanStatus?: 'pending' | 'clean' | 'infected' | 'error';
  scanTimestamp?: string;
}

/**
 * Storage event log for Firestore
 */
export interface StorageEventLog {
  eventType: 'upload' | 'delete' | 'metadata_update';
  filePath: string;
  contentType?: string;
  fileSize?: number;
  bucket: string;
  timestamp: FirebaseFirestore.Timestamp;
  status: 'success' | 'failed';
  errorMessage?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Thumbnail generation options
 */
export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  prefix: string;
}

/**
 * File type categories
 */
export type FileCategory = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'text' | 'other';

/**
 * Backup job result
 */
export interface BackupResult {
  success: boolean;
  totalFiles: number;
  backedUpCount: number;
  errorCount: number;
  backupPath: string;
  duration: number;
  errors?: Array<{
    fileName: string;
    error: string;
  }>;
}

/**
 * File metadata update request
 */
export interface UpdateMetadataRequest {
  filePath: string;
  metadata: {
    description?: string;
    tags?: string[];
    category?: string;
    [key: string]: any;
  };
}

/**
 * File operation context for logging
 */
export interface FileOperationContext {
  operation: string;
  filePath: string;
  bucket: string;
  contentType?: string;
  fileSize?: number;
  userId?: string;
  timestamp: Date;
}
