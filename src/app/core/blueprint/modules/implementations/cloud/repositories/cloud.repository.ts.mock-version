/**
 * Cloud Storage Repository
 * 雲端儲存資料存取層
 *
 * Mock implementation for demonstration purposes.
 * TODO: Replace with actual Supabase Storage integration when SupabaseService is available.
 */

import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from '@core';

import type { CloudFile, CloudBackup, CloudUploadRequest, CloudBackupRequest } from '../models';

/**
 * Cloud Repository
 *
 * Provides data access for cloud storage operations.
 * Currently uses mock data - will be replaced with Supabase Storage integration.
 */
@Injectable({ providedIn: 'root' })
export class CloudRepository {
  private readonly logger = inject(LoggerService);

  // State
  readonly files = signal<CloudFile[]>([]);
  readonly backups = signal<CloudBackup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Upload file to cloud storage
   * TODO: Integrate with Supabase Storage
   */
  async uploadFile(blueprintId: string, request: CloudUploadRequest): Promise<CloudFile> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create mock file record
      const file: CloudFile = {
        id: crypto.randomUUID(),
        blueprintId,
        name: request.file.name,
        path: `${blueprintId}/${Date.now()}-${request.file.name}`,
        size: request.file.size,
        mimeType: request.file.type,
        extension: request.file.name.split('.').pop() || '',
        url: URL.createObjectURL(request.file),
        status: 'synced',
        uploadedBy: 'current-user',
        uploadedAt: new Date(),
        updatedAt: new Date(),
        metadata: request.metadata,
        bucket: `blueprint-${blueprintId}-files`,
        isPublic: request.isPublic ?? false
      };

      // Update local state
      this.files.update(files => [...files, file]);

      this.logger.info('[CloudRepository]', `File uploaded: ${file.name}`);
      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'Upload failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Download file from cloud storage
   * TODO: Integrate with Supabase Storage
   */
  async downloadFile(blueprintId: string, fileId: string): Promise<Blob> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Get file metadata
      const file = this.files().find(f => f.id === fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create mock blob
      const blob = new Blob(['Mock file content'], { type: file.mimeType });

      this.logger.info('[CloudRepository]', `File downloaded: ${file.name}`);
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'Download failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete file from cloud storage
   * TODO: Integrate with Supabase Storage
   */
  async deleteFile(blueprintId: string, fileId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Get file metadata
      const file = this.files().find(f => f.id === fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      // Simulate delete delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update local state
      this.files.update(files => files.filter(f => f.id !== fileId));

      this.logger.info('[CloudRepository]', `File deleted: ${file.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'Delete failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * List files for blueprint
   * TODO: Integrate with Supabase database
   */
  async listFiles(blueprintId: string): Promise<CloudFile[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Return current state (mock data)
      const files = this.files().filter(f => f.blueprintId === blueprintId);

      this.logger.info('[CloudRepository]', `Loaded ${files.length} files`);
      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List files failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'List files failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create backup
   * TODO: Implement actual backup creation
   */
  async createBackup(blueprintId: string, request: CloudBackupRequest): Promise<CloudBackup> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Simulate backup creation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create backup record
      const backup: CloudBackup = {
        id: crypto.randomUUID(),
        blueprintId,
        name: request.name,
        description: request.description,
        type: 'manual',
        status: 'ready',
        size: 0, // TODO: Calculate actual size
        fileCount: request.fileIds?.length || 0,
        path: `backups/${blueprintId}/${Date.now()}-${request.name}.zip`,
        createdAt: new Date(),
        createdBy: 'current-user',
        isEncrypted: request.options?.encrypt ?? false,
        metadata: {
          includedFiles: request.fileIds,
          version: '1.0',
          custom: {}
        }
      };

      // Update local state
      this.backups.update(backups => [...backups, backup]);

      this.logger.info('[CloudRepository]', `Backup created: ${backup.name}`);
      return backup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Create backup failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'Create backup failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * List backups for blueprint
   * TODO: Integrate with Supabase database
   */
  async listBackups(blueprintId: string): Promise<CloudBackup[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Return current state (mock data)
      const backups = this.backups().filter(b => b.blueprintId === blueprintId);

      this.logger.info('[CloudRepository]', `Loaded ${backups.length} backups`);
      return backups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List backups failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'List backups failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.files.set([]);
    this.backups.set([]);
    this.error.set(null);
  }
}
