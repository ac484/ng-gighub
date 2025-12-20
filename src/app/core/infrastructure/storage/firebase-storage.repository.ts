import { Injectable, inject } from '@angular/core';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadMetadata
} from '@angular/fire/storage';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger';
import { UploadResult, FileObject, StorageError, UploadOptions, DownloadOptions, ListOptions } from '@core/types/storage';

/**
 * Firebase Storage Repository
 * Firebase 儲存庫 Repository
 *
 * Following Occam's Razor: Simple, focused storage operations
 * Based on @angular/fire Storage API
 *
 * Replaces StorageRepository (Supabase) in migration to @angular/fire
 *
 * @see https://firebase.google.com/docs/storage
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageRepository {
  private readonly firebaseService = inject(FirebaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Upload a file to storage bucket
   * 上傳檔案到儲存桶
   *
   * @param bucket - Bucket path (e.g., 'blueprint-logs')
   * @param path - File path in bucket (e.g., 'logs/2024/01/photo.jpg')
   * @param file - File to upload
   * @param options - Upload options
   * @returns Upload result with path and URLs
   *
   * @example
   * ```ts
   * const result = await storageRepo.uploadFile(
   *   'blueprint-logs',
   *   'logs/2024/01/photo.jpg',
   *   file,
   *   { contentType: 'image/jpeg' }
   * );
   * ```
   */
  async uploadFile(bucket: string, path: string, file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      const fullPath = `${bucket}/${path}`;
      this.logger.info('[FirebaseStorageRepository]', `Uploading file to ${fullPath}`);

      const storageRef = ref(this.firebaseService.storageInstance, fullPath);

      const metadata: UploadMetadata = {
        contentType: options?.contentType || file.type,
        cacheControl: options?.cacheControl || 'public, max-age=3600',
        customMetadata: options?.metadata || {}
      };

      // Upload file
      const uploadResult = await uploadBytes(storageRef, file, metadata);

      // Get download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const result: UploadResult = {
        path: path,
        fullPath: fullPath,
        publicUrl: downloadUrl
      };

      this.logger.info('[FirebaseStorageRepository]', `File uploaded successfully: ${fullPath}`);
      return result;
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'Upload error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * Upload file with progress tracking
   * 上傳檔案並追蹤進度
   *
   * @param bucket - Bucket path
   * @param path - File path in bucket
   * @param file - File to upload
   * @param options - Upload options
   * @param onProgress - Progress callback (0-100)
   * @returns Upload result
   */
  async uploadFileWithProgress(
    bucket: string,
    path: string,
    file: File,
    options?: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const fullPath = `${bucket}/${path}`;
      this.logger.info('[FirebaseStorageRepository]', `Uploading file with progress tracking to ${fullPath}`);

      const storageRef = ref(this.firebaseService.storageInstance, fullPath);

      const metadata: UploadMetadata = {
        contentType: options?.contentType || file.type,
        cacheControl: options?.cacheControl || 'public, max-age=3600',
        customMetadata: options?.metadata || {}
      };

      // Create upload task for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // Track progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(Math.round(progress));
            }
            this.logger.debug('[FirebaseStorageRepository]', `Upload progress: ${progress.toFixed(2)}%`);
          },
          error => {
            this.logger.error('[FirebaseStorageRepository]', 'Upload error', error);
            reject(this.mapStorageError(error));
          },
          async () => {
            // Upload completed successfully
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            const result: UploadResult = {
              path: path,
              fullPath: fullPath,
              publicUrl: downloadUrl
            };

            this.logger.info('[FirebaseStorageRepository]', `File uploaded successfully: ${fullPath}`);
            resolve(result);
          }
        );
      });
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'Upload error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * Download a file from storage bucket
   * 從儲存桶下載檔案
   *
   * @param bucket - Bucket path
   * @param path - File path in bucket
   * @returns Download URL
   *
   * @example
   * ```ts
   * const url = await storageRepo.downloadFile('blueprint-logs', 'logs/2024/01/photo.jpg');
   * // Then use: window.open(url, '_blank');
   * ```
   */
  async downloadFile(bucket: string, path: string, _options?: DownloadOptions): Promise<string> {
    try {
      const fullPath = `${bucket}/${path}`;
      this.logger.info('[FirebaseStorageRepository]', `Getting download URL for ${fullPath}`);

      const storageRef = ref(this.firebaseService.storageInstance, fullPath);
      const downloadUrl = await getDownloadURL(storageRef);

      this.logger.info('[FirebaseStorageRepository]', 'Download URL retrieved successfully');
      return downloadUrl;
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'Download error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * Delete a file from storage bucket
   * 從儲存桶刪除檔案
   *
   * @param bucket - Bucket path
   * @param path - File path in bucket
   *
   * @example
   * ```ts
   * await storageRepo.deleteFile('blueprint-logs', 'logs/2024/01/photo.jpg');
   * ```
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const fullPath = `${bucket}/${path}`;
      this.logger.info('[FirebaseStorageRepository]', `Deleting file from ${fullPath}`);

      const storageRef = ref(this.firebaseService.storageInstance, fullPath);
      await deleteObject(storageRef);

      this.logger.info('[FirebaseStorageRepository]', 'File deleted successfully');
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'Delete error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * List files in a storage bucket folder
   * 列出儲存桶資料夾中的檔案
   *
   * @param bucket - Bucket path
   * @param folder - Folder path (optional)
   * @param options - List options
   * @returns Array of file objects
   *
   * @example
   * ```ts
   * const files = await storageRepo.listFiles('blueprint-logs', 'logs/2024/01');
   * ```
   */
  async listFiles(bucket: string, folder?: string, options?: ListOptions): Promise<FileObject[]> {
    try {
      const fullPath = folder ? `${bucket}/${folder}` : bucket;
      this.logger.info('[FirebaseStorageRepository]', `Listing files in ${fullPath}`);

      const storageRef = ref(this.firebaseService.storageInstance, fullPath);
      const listResult = await listAll(storageRef);

      // Get metadata for each file
      const filePromises = listResult.items.map(async item => {
        const metadata = await getMetadata(item);
        const downloadUrl = await getDownloadURL(item);

        return {
          name: item.name,
          path: item.fullPath,
          id: item.fullPath,
          updated_at: metadata.updated,
          created_at: metadata.timeCreated,
          last_accessed_at: undefined,
          metadata: {
            size: metadata.size,
            contentType: metadata.contentType,
            ...metadata.customMetadata
          },
          downloadUrl
        } as FileObject;
      });

      const files = await Promise.all(filePromises);

      // Apply options
      let filteredFiles = files;

      if (options?.limit) {
        filteredFiles = filteredFiles.slice(options.offset || 0, (options.offset || 0) + options.limit);
      }

      if (options?.sortBy) {
        const { column, order } = options.sortBy;
        filteredFiles.sort((a, b) => {
          const aVal = (a as any)[column];
          const bVal = (b as any)[column];
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return order === 'asc' ? comparison : -comparison;
        });
      }

      this.logger.info('[FirebaseStorageRepository]', `Listed ${filteredFiles.length} files`);
      return filteredFiles;
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'List error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * Get public URL for a file
   * 取得檔案的公開 URL
   *
   * @param bucket - Bucket path
   * @param path - File path in bucket
   * @returns Public/Download URL
   *
   * @example
   * ```ts
   * const url = await storageRepo.getPublicUrl('blueprint-logs', 'logs/2024/01/photo.jpg');
   * ```
   */
  async getPublicUrl(bucket: string, path: string): Promise<string> {
    try {
      const fullPath = `${bucket}/${path}`;
      const storageRef = ref(this.firebaseService.storageInstance, fullPath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      this.logger.error('[FirebaseStorageRepository]', 'Get public URL error', error as Error);
      throw this.mapStorageError(error);
    }
  }

  /**
   * Map Firebase storage error to StorageError
   * 將 Firebase 儲存錯誤對應到 StorageError
   */
  private mapStorageError(error: any): StorageError {
    const errorCode = error?.code || '';

    const errorMessages: Record<string, string> = {
      'storage/object-not-found': 'File not found',
      'storage/unauthorized': 'Unauthorized access',
      'storage/canceled': 'Upload canceled',
      'storage/unknown': 'Unknown storage error',
      'storage/invalid-format': 'Invalid file format',
      'storage/invalid-argument': 'Invalid argument',
      'storage/cannot-slice-blob': 'Cannot read file',
      'storage/server-file-wrong-size': 'File size mismatch'
    };

    return {
      message: errorMessages[errorCode] || error.message || 'Storage operation failed',
      statusCode: error.code,
      error: errorCode
    };
  }
}
