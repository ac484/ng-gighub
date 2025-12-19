/**
 * Contract Upload Service
 *
 * Simplified service that uploads files and calls Cloud Functions.
 * Heavy processing handled by functions-integration.
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Injectable, inject, signal } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Functions, httpsCallable } from '@angular/fire/functions';

import type { FileAttachment } from '../../data/models';

/**
 * Validation result for file uploads
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Cloud Function request/response types
 */
interface ProcessContractUploadRequest {
  blueprintId: string;
  contractId: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  requestedBy?: string;
}

interface ProcessContractUploadResponse {
  success: boolean;
  draftId: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ContractUploadService {
  private readonly storage = inject(Storage);
  private readonly functions = inject(Functions);

  // Configuration
  private readonly ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // State signals
  private readonly _uploading = signal(false);
  readonly uploading = this._uploading.asReadonly();

  /**
   * Upload contract file and trigger Cloud Function processing
   * 
   * This method:
   * 1. Uploads file to Firebase Storage
   * 2. Calls processContractUpload Cloud Function
   * 3. Cloud Function handles OCR, parsing, and draft creation
   */
  async uploadAndProcess(
    blueprintId: string,
    contractId: string,
    file: File,
    uploadedBy?: string
  ): Promise<{ draftId: string; fileAttachment: FileAttachment }> {
    this._uploading.set(true);

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
      }

      // Upload file to Storage
      const fileAttachment = await this.uploadFile(blueprintId, contractId, file, uploadedBy);

      // Call Cloud Function to process upload
      const processUpload = httpsCallable<ProcessContractUploadRequest, ProcessContractUploadResponse>(
        this.functions,
        'processContractUpload'
      );

      const result = await processUpload({
        blueprintId,
        contractId,
        fileUrl: fileAttachment.fileUrl,
        filePath: fileAttachment.storagePath,
        fileName: fileAttachment.fileName,
        fileType: fileAttachment.fileType,
        fileSize: fileAttachment.fileSize,
        requestedBy: uploadedBy
      });

      return {
        draftId: result.data.draftId,
        fileAttachment
      };
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Upload file to Storage only (internal method)
   */
  private async uploadFile(
    blueprintId: string,
    contractId: string,
    file: File,
    uploadedBy = 'current-user'
  ): Promise<FileAttachment> {
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
    return {
      id: fileId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: downloadUrl,
      storagePath,
      uploadedAt: new Date(),
      uploadedBy
    };
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
   * Upload contract file (alias for uploadAndProcess for backward compatibility)
   */
  async uploadContractFile(
    blueprintId: string,
    contractId: string,
    file: File,
    uploadedBy?: string
  ): Promise<FileAttachment> {
    const result = await this.uploadAndProcess(blueprintId, contractId, file, uploadedBy);
    return result.fileAttachment;
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
