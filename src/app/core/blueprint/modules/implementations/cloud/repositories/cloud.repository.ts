/**
 * Cloud Storage Repository
 * 雲端儲存資料存取層
 *
 * Handles interaction with Firebase Storage for file operations.
 * Uses FirebaseStorageRepository and FirebaseService.
 */

import { Injectable, signal, inject } from '@angular/core';
import { collection, addDoc, doc, getDocs, deleteDoc, updateDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { FirebaseStorageRepository } from '@core/infrastructure/storage';
import { FirebaseService } from '@core/services/firebase.service';

import type { CloudFile, CloudBackup, CloudUploadRequest, CloudBackupRequest } from '../models';

/**
 * Cloud Repository
 *
 * Provides data access for cloud storage operations using Firebase Storage.
 */
@Injectable({ providedIn: 'root' })
export class CloudRepository {
  private readonly firebaseService = inject(FirebaseService);
  private readonly storageRepo = inject(FirebaseStorageRepository);
  private readonly logger = inject(LoggerService);

  // State
  readonly files = signal<CloudFile[]>([]);
  readonly backups = signal<CloudBackup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Get storage bucket name for blueprint
   */
  private getBucketName(blueprintId: string): string {
    return `blueprint-${blueprintId}`;
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(blueprintId: string, request: CloudUploadRequest): Promise<CloudFile> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const bucket = this.getBucketName(blueprintId);
      const fileName = `${Date.now()}-${request.file.name}`;
      const filePath = request.path || `files/${fileName}`;

      // Upload to Firebase Storage
      const uploadResult = await this.storageRepo.uploadFile(bucket, filePath, request.file, {
        contentType: request.file.type,
        metadata: request.metadata
          ? {
              originalName: request.metadata.originalName || request.file.name,
              description: request.metadata.description || '',
              tags: request.metadata.tags?.join(',') || ''
            }
          : {}
      });

      // Get current user
      const currentUserId = this.firebaseService.getCurrentUserId() || 'anonymous';

      // Create file record
      const file: CloudFile = {
        id: '', // Will be set after Firestore add
        blueprintId,
        name: request.file.name,
        path: uploadResult.path,
        size: request.file.size,
        mimeType: request.file.type,
        extension: request.file.name.split('.').pop() || '',
        url: uploadResult.publicUrl,
        publicUrl: request.isPublic ? uploadResult.publicUrl : undefined,
        status: 'synced',
        uploadedBy: currentUserId,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        metadata: request.metadata,
        bucket,
        isPublic: request.isPublic ?? false,
        version: 1, // Initialize version to 1
        versionHistory: [] // Initialize empty version history
      };

      // Store file metadata in Firestore
      const filesCollection = collection(this.firebaseService.db, 'cloud_files');

      // Prepare document data - omit undefined fields
      const docData: any = {
        blueprint_id: file.blueprintId,
        name: file.name,
        path: file.path,
        size: file.size,
        mime_type: file.mimeType,
        extension: file.extension,
        url: file.url,
        status: file.status,
        uploaded_by: file.uploadedBy,
        uploaded_at: Timestamp.fromDate(file.uploadedAt),
        updated_at: Timestamp.fromDate(file.updatedAt),
        metadata: file.metadata || {},
        bucket: file.bucket,
        is_public: file.isPublic,
        version: file.version || 1,
        version_history: file.versionHistory || []
      };

      // Only add public_url if it's not undefined
      if (file.publicUrl !== undefined) {
        docData.public_url = file.publicUrl;
      }

      const docRef = await addDoc(filesCollection, docData);

      file.id = docRef.id;

      // Update local state
      this.files.update(files => [...files, file]);

      this.logger.info('[CloudRepository]', `File uploaded: ${file.name}`);
      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.error.set(errorMessage);

      // Log detailed error for debugging
      this.logger.error('[CloudRepository]', 'Upload failed', error as Error);
      console.error('[CloudRepository] Detailed upload error:', {
        error,
        errorMessage,
        errorCode: (error as any)?.code,
        blueprintId
      });

      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Download file from cloud storage
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

      const bucket = this.getBucketName(blueprintId);

      // Get download URL from Firebase Storage
      const downloadUrl = await this.storageRepo.downloadFile(bucket, file.path);

      // Fetch the blob
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();

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

      const bucket = this.getBucketName(blueprintId);

      // Delete from Firebase Storage
      await this.storageRepo.deleteFile(bucket, file.path);

      // Delete metadata from Firestore
      const fileDoc = doc(this.firebaseService.db, 'cloud_files', fileId);
      await deleteDoc(fileDoc);

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
   * Update file path (for folder rename)
   */
  async updateFilePath(_blueprintId: string, fileId: string, newPath: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Update metadata in Firestore
      const fileDoc = doc(this.firebaseService.db, 'cloud_files', fileId);
      await updateDoc(fileDoc, {
        path: newPath,
        updated_at: new Date()
      });

      // Update local state
      this.files.update(files => files.map(f => (f.id === fileId ? { ...f, path: newPath, updatedAt: new Date() } : f)));

      this.logger.info('[CloudRepository]', `File path updated: ${fileId} -> ${newPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update path failed';
      this.error.set(errorMessage);
      this.logger.error('[CloudRepository]', 'Update path failed', error as Error);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * List files for blueprint
   */
  async listFiles(blueprintId: string): Promise<CloudFile[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Query Firestore for file metadata
      const filesCollection = collection(this.firebaseService.db, 'cloud_files');
      // TODO: Add orderBy once Firestore index is created
      // Required index in firestore.indexes.json:
      // {
      //   "collectionGroup": "cloud_files",
      //   "queryScope": "COLLECTION",
      //   "fields": [
      //     { "fieldPath": "blueprint_id", "order": "ASCENDING" },
      //     { "fieldPath": "uploaded_at", "order": "DESCENDING" }
      //   ]
      // }
      // For now, query without orderBy to avoid index requirement
      const q = query(filesCollection, where('blueprint_id', '==', blueprintId));

      const querySnapshot = await getDocs(q);

      // Map to CloudFile interface
      const files: CloudFile[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          blueprintId: data['blueprint_id'],
          name: data['name'],
          path: data['path'],
          size: data['size'],
          mimeType: data['mime_type'],
          extension: data['extension'],
          url: data['url'],
          publicUrl: data['public_url'],
          status: data['status'],
          uploadedBy: data['uploaded_by'],
          uploadedAt: data['uploaded_at']?.toDate() || new Date(),
          updatedAt: data['updated_at']?.toDate() || new Date(),
          metadata: data['metadata'],
          bucket: data['bucket'],
          isPublic: data['is_public'],
          version: data['version'] || 1,
          versionHistory: data['version_history'] || []
        };
      });

      // Sort by uploaded date (descending) - client-side sorting to avoid Firestore index requirement
      files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      // Update local state
      this.files.set(files);

      this.logger.info('[CloudRepository]', `Loaded ${files.length} files`);
      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List files failed';
      this.error.set(errorMessage);

      // Log detailed error for debugging
      this.logger.error('[CloudRepository]', 'List files failed', error as Error);
      console.error('[CloudRepository] Detailed list error:', {
        error,
        errorMessage,
        errorCode: (error as any)?.code,
        blueprintId
      });

      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create backup
   */
  async createBackup(blueprintId: string, request: CloudBackupRequest): Promise<CloudBackup> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUserId = this.firebaseService.getCurrentUserId() || 'anonymous';

      // Create backup record
      const backup: CloudBackup = {
        id: '', // Will be set after Firestore add
        blueprintId,
        name: request.name,
        description: request.description,
        type: 'manual',
        status: 'ready',
        size: 0, // TODO: Calculate actual size
        fileCount: request.fileIds?.length || 0,
        path: `backups/${blueprintId}/${Date.now()}-${request.name}.zip`,
        createdAt: new Date(),
        createdBy: currentUserId,
        isEncrypted: request.options?.encrypt ?? false,
        metadata: {
          includedFiles: request.fileIds,
          version: '1.0',
          custom: {}
        }
      };

      // Store in Firestore
      const backupsCollection = collection(this.firebaseService.db, 'cloud_backups');
      const docRef = await addDoc(backupsCollection, {
        blueprint_id: backup.blueprintId,
        name: backup.name,
        description: backup.description,
        type: backup.type,
        status: backup.status,
        size: backup.size,
        file_count: backup.fileCount,
        path: backup.path,
        created_at: Timestamp.fromDate(backup.createdAt),
        created_by: backup.createdBy,
        is_encrypted: backup.isEncrypted,
        metadata: backup.metadata
      });

      backup.id = docRef.id;

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
   */
  async listBackups(blueprintId: string): Promise<CloudBackup[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const backupsCollection = collection(this.firebaseService.db, 'cloud_backups');
      // TODO: Add orderBy once Firestore index is created
      // Required index in firestore.indexes.json:
      // {
      //   "collectionGroup": "cloud_backups",
      //   "queryScope": "COLLECTION",
      //   "fields": [
      //     { "fieldPath": "blueprint_id", "order": "ASCENDING" },
      //     { "fieldPath": "created_at", "order": "DESCENDING" }
      //   ]
      // }
      // For now, query without orderBy to avoid index requirement
      const q = query(backupsCollection, where('blueprint_id', '==', blueprintId));

      const querySnapshot = await getDocs(q);

      const backups: CloudBackup[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          blueprintId: data['blueprint_id'],
          name: data['name'],
          description: data['description'],
          type: data['type'],
          status: data['status'],
          size: data['size'],
          fileCount: data['file_count'],
          path: data['path'],
          createdAt: data['created_at']?.toDate() || new Date(),
          createdBy: data['created_by'],
          isEncrypted: data['is_encrypted'],
          metadata: data['metadata']
        };
      });

      // Sort by created date (descending) - client-side sorting to avoid Firestore index requirement
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      this.backups.set(backups);
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
