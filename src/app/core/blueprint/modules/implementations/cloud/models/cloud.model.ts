/**
 * Cloud Storage Domain Models
 * 雲端儲存域資料模型
 */

/**
 * Cloud File interface
 * 雲端檔案介面
 */
export interface CloudFile {
  /** Unique file ID */
  id: string;

  /** Blueprint ID this file belongs to */
  blueprintId: string;

  /** File name */
  name: string;

  /** File path in storage */
  path: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** File extension */
  extension: string;

  /** File URL for access */
  url?: string;

  /** Public URL (if file is public) */
  publicUrl?: string;

  /** Upload status */
  status: 'uploading' | 'synced' | 'pending' | 'error';

  /** Upload progress (0-100) */
  uploadProgress?: number;

  /** User ID who uploaded */
  uploadedBy: string;

  /** Upload timestamp */
  uploadedAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;

  /** File metadata */
  metadata?: {
    /** Original filename */
    originalName?: string;
    /** File description */
    description?: string;
    /** File tags */
    tags?: string[];
    /** Related entity ID (task, log, etc) */
    relatedTo?: string;
    /** Related entity type */
    relatedType?: string;
    /** Custom metadata */
    custom?: Record<string, unknown>;
  };

  /** Storage bucket name */
  bucket?: string;

  /** Checksum/hash for integrity */
  checksum?: string;

  /** Is file public */
  isPublic: boolean;

  /** Expiry date (for temporary files) */
  expiresAt?: Date;

  /** Version number */
  version?: number;

  /** Version history */
  versionHistory?: CloudFileVersion[];

  /** Parent version ID (if this is a version) */
  parentVersionId?: string;
}

/**
 * Cloud File Version interface
 * 雲端檔案版本介面
 */
export interface CloudFileVersion {
  /** Version ID */
  id: string;

  /** Version number */
  versionNumber: number;

  /** File path for this version */
  path: string;

  /** File size in bytes */
  size: number;

  /** Version checksum */
  checksum?: string;

  /** Created by user ID */
  createdBy: string;

  /** Created timestamp */
  createdAt: Date;

  /** Version comment/description */
  comment?: string;

  /** Is this the current version */
  isCurrent: boolean;
}

/**
 * Sync Record interface
 * 同步記錄介面
 */
export interface CloudSyncRecord {
  /** Sync record ID */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** File ID being synced */
  fileId: string;

  /** Sync type */
  type: 'upload' | 'download' | 'update' | 'delete';

  /** Sync status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  /** Sync progress (0-100) */
  progress: number;

  /** Start timestamp */
  startedAt: Date;

  /** Completion timestamp */
  completedAt?: Date;

  /** Error message (if failed) */
  error?: string;

  /** Bytes transferred */
  bytesTransferred?: number;

  /** Total bytes */
  totalBytes?: number;

  /** User ID who initiated sync */
  initiatedBy: string;
}

/**
 * Backup interface
 * 備份介面
 */
export interface CloudBackup {
  /** Backup ID */
  id: string;

  /** Blueprint ID */
  blueprintId: string;

  /** Backup name */
  name: string;

  /** Backup description */
  description?: string;

  /** Backup type */
  type: 'manual' | 'automatic' | 'scheduled';

  /** Backup status */
  status: 'creating' | 'ready' | 'restoring' | 'error';

  /** Backup size in bytes */
  size: number;

  /** Number of files in backup */
  fileCount: number;

  /** Backup file path */
  path: string;

  /** Backup creation timestamp */
  createdAt: Date;

  /** Created by user ID */
  createdBy: string;

  /** Last accessed timestamp */
  lastAccessedAt?: Date;

  /** Expiry date */
  expiresAt?: Date;

  /** Backup metadata */
  metadata?: {
    /** Included file IDs */
    includedFiles?: string[];
    /** Backup trigger */
    trigger?: string;
    /** Backup version */
    version?: string;
    /** Custom metadata */
    custom?: Record<string, unknown>;
  };

  /** Checksum for integrity */
  checksum?: string;

  /** Is backup encrypted */
  isEncrypted: boolean;
}

/**
 * Cloud Storage Configuration
 * 雲端儲存配置
 */
export interface CloudStorageConfig {
  /** Storage provider (supabase, s3, etc) */
  provider: 'supabase' | 's3' | 'azure' | 'gcs';

  /** Bucket/container name */
  bucket: string;

  /** Region */
  region?: string;

  /** Access credentials (should be from secure store) */
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
  };

  /** Storage limits */
  limits: {
    /** Max file size in bytes */
    maxFileSize: number;
    /** Max total storage in bytes */
    maxTotalStorage: number;
    /** Allowed file types */
    allowedFileTypes: string[];
  };

  /** Feature flags */
  features: {
    /** Enable file versioning */
    versioning: boolean;
    /** Enable encryption at rest */
    encryption: boolean;
    /** Enable CDN */
    cdn: boolean;
    /** Enable automatic backup */
    autoBackup: boolean;
  };
}

/**
 * Cloud Storage Statistics
 * 雲端儲存統計
 */
export interface CloudStorageStats {
  /** Total files */
  totalFiles: number;

  /** Total storage used in bytes */
  storageUsed: number;

  /** Storage limit in bytes */
  storageLimit: number;

  /** Storage usage percentage */
  usagePercentage: number;

  /** Files by type */
  filesByType: Record<string, number>;

  /** Total uploads */
  totalUploads: number;

  /** Total downloads */
  totalDownloads: number;

  /** Total backups */
  totalBackups: number;

  /** Last sync timestamp */
  lastSyncAt?: Date;

  /** Last backup timestamp */
  lastBackupAt?: Date;
}

/**
 * Upload Request
 * 上傳請求
 */
export interface CloudUploadRequest {
  /** File to upload */
  file: File;

  /** Target path */
  path?: string;

  /** File metadata */
  metadata?: CloudFile['metadata'];

  /** Is file public */
  isPublic?: boolean;

  /** Upload options */
  options?: {
    /** Override existing file */
    overwrite?: boolean;
    /** Compress before upload */
    compress?: boolean;
    /** Generate thumbnail (for images) */
    thumbnail?: boolean;
  };
}

/**
 * Download Request
 * 下載請求
 */
export interface CloudDownloadRequest {
  /** File ID to download */
  fileId: string;

  /** Download as attachment (vs inline) */
  asAttachment?: boolean;

  /** Custom filename */
  filename?: string;
}

/**
 * Backup Request
 * 備份請求
 */
export interface CloudBackupRequest {
  /** Backup name */
  name: string;

  /** Backup description */
  description?: string;

  /** File IDs to include (empty = all files) */
  fileIds?: string[];

  /** Backup options */
  options?: {
    /** Compress backup */
    compress?: boolean;
    /** Encrypt backup */
    encrypt?: boolean;
    /** Retention days */
    retentionDays?: number;
  };
}

/**
 * Restore Request
 * 還原請求
 */
export interface CloudRestoreRequest {
  /** Backup ID to restore from */
  backupId: string;

  /** Target path for restoration */
  targetPath?: string;

  /** Restore options */
  options?: {
    /** Overwrite existing files */
    overwrite?: boolean;
    /** Restore specific files only */
    fileIds?: string[];
  };
}
