/**
 * Contract Upload Service (Simplified Skeleton)
 *
 * Basic file upload functionality for contract files.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Injectable, inject, signal } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';

import type { FileAttachment } from '../../data/models';

/**
 * Validation result for file uploads
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ContractUploadService {
  private readonly storage = inject(Storage);

  // Configuration
  private readonly ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // State signals
  private readonly _uploading = signal(false);
  readonly uploading = this._uploading.asReadonly();

  /**
   * Upload a single contract file (Basic version)
   */
  async uploadContractFile(blueprintId: string, contractId: string, file: File, uploadedBy = 'current-user'): Promise<FileAttachment> {
    this._uploading.set(true);

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
      }

      // Generate unique file ID
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const storagePath = `contracts/${blueprintId}/${contractId}/${fileId}-${this.sanitizeFileName(file.name)}`;
      const storageRef = ref(this.storage, storagePath);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);
      await uploadTask;

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
        uploadedBy
      };

      return fileAttachment;
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Validate a file for upload
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    if (!this.ACCEPTED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type not allowed. Accepted: PDF, JPG, PNG`);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File too large. Max: 10MB`);
    }

    if (!file.name || file.name.length === 0) {
      errors.push('File name is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    const storageRef = ref(this.storage, storagePath);
    await deleteObject(storageRef);
  }

  /**
   * Get accepted file extensions
   */
  getAcceptedExtensions(): string {
    return '.pdf,.jpg,.jpeg,.png';
  }

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
