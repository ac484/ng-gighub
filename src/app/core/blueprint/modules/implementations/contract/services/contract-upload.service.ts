/**
 * Contract Upload Service
 *
 * Handles contract file uploads to Firebase Storage.
 * OCR/AI parsing functionality is interface-only (YAGNI principle).
 * Implements SETC-012: Contract Upload & Parsing Service.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from '@angular/fire/storage';
import { Observable, BehaviorSubject } from 'rxjs';

import type { FileAttachment } from '../models';
import { ContractEventService } from './contract-event.service';

/**
 * Upload progress information
 */
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
}

/**
 * Validation result for file uploads
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parsed contract data (interface only - not implemented in v1)
 */
export interface ContractParsedData {
  title?: string;
  description?: string;
  parties?: {
    owner?: { name?: string; contactPerson?: string };
    contractor?: { name?: string; contactPerson?: string };
  };
  amounts?: {
    total?: number;
    currency?: string;
  };
  dates?: {
    startDate?: string;
    endDate?: string;
  };
  workItems?: Array<{
    name?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
  }>;
  confidence?: number;
}

@Injectable({ providedIn: 'root' })
export class ContractUploadService {
  private readonly storage = inject(Storage);
  private readonly eventService = inject(ContractEventService);

  // Configuration
  private readonly ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // State signals
  private readonly _uploading = signal(false);
  private readonly _progress = signal<UploadProgress | null>(null);
  private readonly _error = signal<string | null>(null);

  // Readonly state accessors
  readonly uploading = this._uploading.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly error = this._error.asReadonly();

  // Active upload tasks
  private readonly activeTasks = new Map<string, UploadTask>();

  // ===============================
  // File Upload
  // ===============================

  /**
   * Upload a single contract file
   */
  async uploadContractFile(blueprintId: string, contractId: string, file: File): Promise<FileAttachment> {
    this._uploading.set(true);
    this._error.set(null);

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
      }

      // Generate unique file ID
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const storagePath = `contracts/${blueprintId}/${contractId}/original/${fileId}-${this.sanitizeFileName(file.name)}`;
      const storageRef = ref(this.storage, storagePath);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      this.activeTasks.set(fileId, uploadTask);

      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
              state: snapshot.state as UploadProgress['state']
            };
            this._progress.set(progress);
          },
          error => {
            this.activeTasks.delete(fileId);
            reject(error);
          },
          () => {
            this.activeTasks.delete(fileId);
            resolve();
          }
        );
      });

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Create file attachment record
      const fileAttachment: FileAttachment = {
        id: fileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: downloadUrl,
        storagePath,
        uploadedAt: new Date(),
        uploadedBy: 'current-user' // Should be replaced with actual user ID
      };

      // Emit event
      this.eventService.emitFileUploaded(blueprintId, contractId, fileId, file.name, downloadUrl);

      return fileAttachment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      this._error.set(message);
      throw err;
    } finally {
      this._uploading.set(false);
      this._progress.set(null);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(blueprintId: string, contractId: string, files: File[]): Promise<FileAttachment[]> {
    const results: FileAttachment[] = [];

    for (const file of files) {
      try {
        const attachment = await this.uploadContractFile(blueprintId, contractId, file);
        results.push(attachment);
      } catch (err) {
        console.error('[ContractUploadService]', 'Failed to upload file', file.name, err);
        // Continue with remaining files
      }
    }

    return results;
  }

  /**
   * Upload with progress observable
   */
  uploadWithProgress(blueprintId: string, contractId: string, file: File): Observable<UploadProgress> {
    const progress$ = new BehaviorSubject<UploadProgress>({
      bytesTransferred: 0,
      totalBytes: file.size,
      percentage: 0,
      state: 'running'
    });

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      progress$.error(new Error(`Invalid file: ${validation.errors.join(', ')}`));
      return progress$.asObservable();
    }

    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `contracts/${blueprintId}/${contractId}/original/${fileId}-${this.sanitizeFileName(file.name)}`;
    const storageRef = ref(this.storage, storagePath);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    this.activeTasks.set(fileId, uploadTask);

    uploadTask.on(
      'state_changed',
      snapshot => {
        progress$.next({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          state: snapshot.state as UploadProgress['state']
        });
      },
      error => {
        this.activeTasks.delete(fileId);
        progress$.error(error);
      },
      () => {
        this.activeTasks.delete(fileId);
        progress$.next({
          bytesTransferred: file.size,
          totalBytes: file.size,
          percentage: 100,
          state: 'success'
        });
        progress$.complete();
      }
    );

    return progress$.asObservable();
  }

  // ===============================
  // File Validation
  // ===============================

  /**
   * Validate a file for upload
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    // Check file type
    if (!this.ACCEPTED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type "${file.type}" not allowed. Accepted types: PDF, JPG, PNG`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      errors.push(`File size (${sizeMB}MB) exceeds maximum allowed (10MB)`);
    }

    // Check file name
    if (!file.name || file.name.length === 0) {
      errors.push('File name is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get accepted file types
   */
  getAcceptedFileTypes(): string[] {
    return [...this.ACCEPTED_FILE_TYPES];
  }

  /**
   * Get maximum file size in bytes
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Get accepted file extensions for input element
   */
  getAcceptedExtensions(): string {
    return '.pdf,.jpg,.jpeg,.png';
  }

  // ===============================
  // File Management
  // ===============================

  /**
   * Delete a file from storage
   */
  async deleteFile(blueprintId: string, contractId: string, storagePath: string, fileName: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, storagePath);
      await deleteObject(storageRef);

      // Emit event
      const fileId = storagePath.split('/').pop() || '';
      this.eventService.emitFileRemoved(blueprintId, contractId, fileId, fileName);
    } catch (err) {
      console.error('[ContractUploadService]', 'Failed to delete file', err);
      throw err;
    }
  }

  /**
   * Get file download URL
   */
  async getFileUrl(storagePath: string): Promise<string> {
    const storageRef = ref(this.storage, storagePath);
    return await getDownloadURL(storageRef);
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(fileId: string): boolean {
    const task = this.activeTasks.get(fileId);
    if (task) {
      task.cancel();
      this.activeTasks.delete(fileId);
      return true;
    }
    return false;
  }

  // ===============================
  // OCR/AI Parsing (Interface Only - NOT IMPLEMENTED)
  // ===============================

  /**
   * Trigger parsing for an uploaded file
   *
   * @note This is an interface placeholder - not implemented in v1 (YAGNI)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async triggerParsing(contractId: string, fileId: string): Promise<void> {
    console.warn('[ContractUploadService]', 'OCR/AI parsing not implemented in v1 (YAGNI)');
    throw new Error('OCR/AI parsing not available - feature planned for future release');
  }

  /**
   * Confirm parsed data
   *
   * @note This is an interface placeholder - not implemented in v1 (YAGNI)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async confirmParsedData(contractId: string, data: ContractParsedData): Promise<void> {
    console.warn('[ContractUploadService]', 'Parsed data confirmation not implemented in v1 (YAGNI)');
    throw new Error('Parsed data confirmation not available - feature planned for future release');
  }

  /**
   * Get parsing status
   *
   * @note This is an interface placeholder - not implemented in v1 (YAGNI)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getParsingStatus(contractId: string, fileId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
    console.warn('[ContractUploadService]', 'Parsing status check not implemented in v1 (YAGNI)');
    return 'pending';
  }

  // ===============================
  // Helper Methods
  // ===============================

  /**
   * Sanitize file name for storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/__+/g, '_')
      .substring(0, 100);
  }
}
