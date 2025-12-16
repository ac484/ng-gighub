/**
 * Cloud Storage Service
 * 雲端儲存服務
 *
 * Business logic for cloud storage operations.
 * Integrates with CloudRepository and EventBus.
 */

import { Injectable, inject, computed } from '@angular/core';
import { LoggerService } from '@core';
import type { IEventBus } from '@core/blueprint/events/event-bus.interface';

import type {
  CloudFile,
  CloudBackup,
  CloudUploadRequest,
  CloudDownloadRequest,
  CloudBackupRequest,
  CloudRestoreRequest,
  CloudStorageStats
} from '../models';
import { CLOUD_MODULE_EVENTS } from '../module.metadata';
import { CloudRepository } from '../repositories';

/**
 * Cloud Storage Service
 *
 * Provides high-level cloud storage operations.
 */
@Injectable({ providedIn: 'root' })
export class CloudStorageService {
  private readonly repository = inject(CloudRepository);
  private readonly logger = inject(LoggerService);

  // Event Bus (injected by module)
  private eventBus?: IEventBus;
  private moduleId = 'cloud';

  // State
  readonly files = this.repository.files;
  readonly backups = this.repository.backups;
  readonly loading = this.repository.loading;
  readonly error = this.repository.error;

  // Computed statistics
  readonly stats = computed<CloudStorageStats>(() => {
    const files = this.files();
    const backups = this.backups();

    const totalFiles = files.length;
    const storageUsed = files.reduce((sum, file) => sum + file.size, 0);
    const storageLimit = 10737418240; // 10GB (from config)

    return {
      totalFiles,
      storageUsed,
      storageLimit,
      usagePercentage: (storageUsed / storageLimit) * 100,
      filesByType: this.calculateFilesByType(files),
      totalUploads: files.length,
      totalDownloads: 0, // TODO: Track downloads
      totalBackups: backups.length,
      lastSyncAt: files.length > 0 ? files[0].uploadedAt : undefined,
      lastBackupAt: backups.length > 0 ? backups[0].createdAt : undefined
    };
  });

  /**
   * Initialize service with EventBus
   */
  initializeWithEventBus(eventBus: IEventBus, moduleId: string): void {
    this.eventBus = eventBus;
    this.moduleId = moduleId;
    this.logger.info('[CloudStorageService]', 'Initialized with EventBus');
  }

  /**
   * Load files for blueprint
   */
  async loadFiles(blueprintId: string): Promise<void> {
    try {
      await this.repository.listFiles(blueprintId);
      this.logger.info('[CloudStorageService]', `Loaded files for blueprint: ${blueprintId}`);
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Failed to load files', error as Error);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(blueprintId: string, request: CloudUploadRequest): Promise<CloudFile> {
    try {
      this.logger.info('[CloudStorageService]', `Uploading file: ${request.file.name}`);

      const file = await this.repository.uploadFile(blueprintId, request);

      // Emit event
      this.emitEvent(CLOUD_MODULE_EVENTS.FILE_UPLOADED, {
        fileId: file.id,
        fileName: file.name,
        size: file.size,
        blueprintId
      });

      return file;
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Upload failed', error as Error);

      // Emit error event
      this.emitEvent(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, {
        operation: 'upload',
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(blueprintId: string, request: CloudDownloadRequest): Promise<Blob> {
    try {
      this.logger.info('[CloudStorageService]', `Downloading file: ${request.fileId}`);

      // Emit download started event
      this.emitEvent(CLOUD_MODULE_EVENTS.FILE_DOWNLOAD_STARTED, {
        fileId: request.fileId,
        blueprintId
      });

      const blob = await this.repository.downloadFile(blueprintId, request.fileId);

      // Emit download completed event
      this.emitEvent(CLOUD_MODULE_EVENTS.FILE_DOWNLOADED, {
        fileId: request.fileId,
        size: blob.size,
        blueprintId
      });

      return blob;
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Download failed', error as Error);

      this.emitEvent(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, {
        operation: 'download',
        error: error instanceof Error ? error.message : 'Download failed'
      });

      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(blueprintId: string, fileId: string): Promise<void> {
    try {
      this.logger.info('[CloudStorageService]', `Deleting file: ${fileId}`);

      await this.repository.deleteFile(blueprintId, fileId);

      // Emit event
      this.emitEvent(CLOUD_MODULE_EVENTS.FILE_DELETED, {
        fileId,
        blueprintId
      });
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Delete failed', error as Error);

      this.emitEvent(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, {
        operation: 'delete',
        error: error instanceof Error ? error.message : 'Delete failed'
      });

      throw error;
    }
  }

  /**
   * Update file path (for folder rename)
   */
  async updateFilePath(blueprintId: string, fileId: string, newPath: string): Promise<void> {
    try {
      this.logger.info('[CloudStorageService]', `Updating file path: ${fileId} -> ${newPath}`);

      await this.repository.updateFilePath(blueprintId, fileId, newPath);
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Update file path failed', error as Error);

      this.emitEvent(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, {
        operation: 'updatePath',
        error: error instanceof Error ? error.message : 'Update path failed'
      });

      throw error;
    }
  }

  /**
   * Create backup
   */
  async createBackup(blueprintId: string, request: CloudBackupRequest): Promise<CloudBackup> {
    try {
      this.logger.info('[CloudStorageService]', `Creating backup: ${request.name}`);

      const backup = await this.repository.createBackup(blueprintId, request);

      // Emit event
      this.emitEvent(CLOUD_MODULE_EVENTS.BACKUP_CREATED, {
        backupId: backup.id,
        backupName: backup.name,
        fileCount: backup.fileCount,
        blueprintId
      });

      return backup;
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Create backup failed', error as Error);

      this.emitEvent(CLOUD_MODULE_EVENTS.ERROR_OCCURRED, {
        operation: 'backup',
        error: error instanceof Error ? error.message : 'Backup failed'
      });

      throw error;
    }
  }

  /**
   * Restore backup
   */
  async restoreBackup(blueprintId: string, request: CloudRestoreRequest): Promise<void> {
    try {
      this.logger.info('[CloudStorageService]', `Restoring backup: ${request.backupId}`);

      // Emit restore started event
      this.emitEvent(CLOUD_MODULE_EVENTS.BACKUP_RESTORE_STARTED, {
        backupId: request.backupId,
        blueprintId
      });

      // TODO: Implement actual restore logic

      // Emit restore completed event
      this.emitEvent(CLOUD_MODULE_EVENTS.BACKUP_RESTORED, {
        backupId: request.backupId,
        blueprintId
      });
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Restore backup failed', error as Error);

      this.emitEvent(CLOUD_MODULE_EVENTS.BACKUP_RESTORE_FAILED, {
        backupId: request.backupId,
        error: error instanceof Error ? error.message : 'Restore failed',
        blueprintId
      });

      throw error;
    }
  }

  /**
   * Load backups for blueprint
   */
  async loadBackups(blueprintId: string): Promise<void> {
    try {
      await this.repository.listBackups(blueprintId);
      this.logger.info('[CloudStorageService]', `Loaded backups for blueprint: ${blueprintId}`);
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Failed to load backups', error as Error);
      throw error;
    }
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.repository.clearState();
    this.logger.debug('[CloudStorageService]', 'State cleared');
  }

  /**
   * Calculate files by type
   */
  private calculateFilesByType(files: CloudFile[]): Record<string, number> {
    const byType: Record<string, number> = {};

    files.forEach(file => {
      const type = file.mimeType.split('/')[0] || 'other';
      byType[type] = (byType[type] || 0) + 1;
    });

    return byType;
  }

  /**
   * Emit event through EventBus
   */
  private emitEvent<T>(type: string, payload: T): void {
    if (!this.eventBus) {
      this.logger.warn('[CloudStorageService]', 'EventBus not initialized, skipping event emit');
      return;
    }

    try {
      this.eventBus.emit(type, payload, this.moduleId);
      this.logger.debug('[CloudStorageService]', `Event emitted: ${type}`);
    } catch (error) {
      this.logger.error('[CloudStorageService]', 'Failed to emit event', error as Error);
    }
  }
}
