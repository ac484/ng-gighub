import { Injectable, inject } from '@angular/core';
import { UploadResult, FileObject, UploadOptions, DownloadOptions, ListOptions } from '@core/types/storage';

import { FirebaseStorageRepository } from './firebase-storage.repository';

/**
 * Storage Repository
 * 儲存庫 Repository
 *
 * @deprecated Use FirebaseStorageRepository instead
 * This class now delegates to FirebaseStorageRepository for compatibility
 *
 * Migrated from Supabase Storage to Firebase Storage
 */
@Injectable({
  providedIn: 'root'
})
export class StorageRepository {
  private readonly firebaseStorage = inject(FirebaseStorageRepository);

  async uploadFile(bucket: string, path: string, file: File, options?: UploadOptions): Promise<UploadResult> {
    return this.firebaseStorage.uploadFile(bucket, path, file, options);
  }

  async downloadFile(bucket: string, path: string, _options?: DownloadOptions): Promise<string> {
    return this.firebaseStorage.downloadFile(bucket, path);
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    return this.firebaseStorage.deleteFile(bucket, path);
  }

  async listFiles(bucket: string, folder?: string, _options?: ListOptions): Promise<FileObject[]> {
    return this.firebaseStorage.listFiles(bucket, folder);
  }

  getPublicUrl(bucket: string, path: string): string {
    // Firebase Storage URLs are obtained from upload/download operations
    // This is a compatibility method
    return `https://storage.googleapis.com/${bucket}/${path}`;
  }
}
