import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadMetadata
} from '@angular/fire/storage';
import { LoggerService } from '@core';

export interface UploadResult {
  path: string;
  publicUrl: string;
  url: string;
}

/**
 * Log Storage Repository
 * 
 * Self-contained storage implementation for log photos using @angular/fire/storage directly.
 * Replaces dependency on @core/infrastructure/storage.
 */
@Injectable({ providedIn: 'root' })
export class LogStorageRepository {
  private readonly storage = inject(Storage);
  private readonly logger = inject(LoggerService);

  /**
   * Upload file to storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: {
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    try {
      const fullPath = `${bucket}/${path}`;
      const storageRef = ref(this.storage, fullPath);
      
      // Build upload metadata
      const uploadMetadata: UploadMetadata = {};
      if (options?.contentType) {
        uploadMetadata.contentType = options.contentType;
      }
      if (options?.cacheControl) {
        uploadMetadata.cacheControl = options.cacheControl;
      }
      if (options?.metadata) {
        uploadMetadata.customMetadata = options.metadata;
      }
      
      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);
      
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);
      
      this.logger.debug('[LogStorageRepository]', `Upload successful: ${fullPath}`);
      
      return {
        path: fullPath,
        url: downloadURL,
        publicUrl: downloadURL  // Firebase Storage URLs are public by default
      };
    } catch (err) {
      this.logger.error('[LogStorageRepository]', `Upload failed: ${path}`, err as Error);
      throw err;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, pathOrUrl: string): Promise<void> {
    try {
      // If it's a full URL, extract the path
      let path = pathOrUrl;
      if (pathOrUrl.includes('http')) {
        // Extract path from Firebase Storage URL
        const url = new URL(pathOrUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch && pathMatch[1]) {
          path = decodeURIComponent(pathMatch[1]);
        }
      } else if (!pathOrUrl.startsWith(bucket)) {
        // Prepend bucket if not already included
        path = `${bucket}/${pathOrUrl}`;
      }

      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      this.logger.debug('[LogStorageRepository]', `Delete successful: ${path}`);
    } catch (err) {
      this.logger.error('[LogStorageRepository]', `Delete failed: ${pathOrUrl}`, err as Error);
      throw err;
    }
  }
}
