/**
 * Cloud Storage Domain Module Metadata
 * 雲端儲存域模組元數據
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

export const CLOUD_MODULE_METADATA = {
  id: 'cloud',
  moduleType: 'cloud',
  name: '雲端域',
  nameEn: 'Cloud Storage Domain',
  version: '1.0.0',
  description: '雲端儲存域模組 - 提供檔案、照片、備份管理',
  descriptionEn: 'Cloud Storage Domain module - Provides file, photo, and backup management',
  dependencies: [] as string[],
  defaultOrder: 11,
  icon: 'cloud',
  color: '#1890ff',
  category: 'business',
  tags: ['cloud', 'storage', 'backup', 'files'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
} as const;

export const CLOUD_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    fileUpload: true,
    fileDownload: true,
    fileDelete: true,
    backup: true,
    sync: true
  },
  settings: {
    maxFileSize: 104857600, // 100MB
    allowedFileTypes: ['image/*', 'application/pdf', '.dwg', '.dxf', '.rvt'],
    autoSync: false,
    syncInterval: 3600000, // 1 hour
    retentionDays: 90,
    compressionEnabled: true
  },
  ui: { icon: 'cloud', color: '#1890ff', position: 11, visibility: 'visible' },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: ['cloud.read', 'cloud.upload', 'cloud.download', 'cloud.delete', 'cloud.backup', 'cloud.restore']
  },
  limits: {
    maxItems: 50000,
    maxStorage: 10737418240, // 10GB
    maxRequests: 10000
  }
};

export const CLOUD_MODULE_EVENTS = {
  // Module lifecycle events
  MODULE_INITIALIZED: 'cloud.module_initialized',
  MODULE_STARTED: 'cloud.module_started',
  MODULE_STOPPED: 'cloud.module_stopped',
  ERROR_OCCURRED: 'cloud.error_occurred',

  // File management events
  FILE_UPLOADED: 'cloud.file_uploaded',
  FILE_DOWNLOAD_STARTED: 'cloud.file_download_started',
  FILE_DOWNLOADED: 'cloud.file_downloaded',
  FILE_DELETED: 'cloud.file_deleted',
  FILE_UPDATED: 'cloud.file_updated',

  // Sync events
  SYNC_STARTED: 'cloud.sync_started',
  SYNC_COMPLETED: 'cloud.sync_completed',
  SYNC_FAILED: 'cloud.sync_failed',
  SYNC_PROGRESS: 'cloud.sync_progress',

  // Backup events
  BACKUP_CREATED: 'cloud.backup_created',
  BACKUP_DELETED: 'cloud.backup_deleted',
  BACKUP_RESTORE_STARTED: 'cloud.backup_restore_started',
  BACKUP_RESTORED: 'cloud.backup_restored',
  BACKUP_RESTORE_FAILED: 'cloud.backup_restore_failed',

  // Storage events
  STORAGE_QUOTA_WARNING: 'cloud.storage_quota_warning',
  STORAGE_QUOTA_EXCEEDED: 'cloud.storage_quota_exceeded'
} as const;
