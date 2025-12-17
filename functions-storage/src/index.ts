/**
 * Storage Cloud Functions
 *
 * Handles Cloud Storage events including:
 * - File upload completion (onObjectFinalized)
 * - File deletion (onObjectDeleted)
 * - File metadata validation and processing
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage';

import * as path from 'path';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({
  maxInstances: 10,
  region: 'asia-east1'
});

/**
 * Triggered when a file is uploaded to Cloud Storage
 * Validates file type, size, and updates metadata
 */
export const onFileUpload = onObjectFinalized(
  {
    region: 'asia-east1'
  },
  async event => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const fileSize = event.data.size;
    const bucketName = event.data.bucket;

    logger.info('File uploaded', {
      filePath,
      contentType,
      size: fileSize,
      bucket: bucketName
    });

    try {
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      // Validate file
      const validationResult = validateFile(contentType, fileSize, fileExtension);

      if (!validationResult.valid) {
        logger.warn('File validation failed', {
          filePath,
          reason: validationResult.reason
        });

        // Update metadata with validation failure
        await file.setMetadata({
          metadata: {
            processed: 'false',
            validationStatus: 'failed',
            validationReason: validationResult.reason || 'Unknown error',
            processedAt: new Date().toISOString()
          }
        });

        return { success: false, reason: validationResult.reason };
      }

      // Update metadata for successful validation
      const metadata: any = {
        metadata: {
          processed: 'true',
          validationStatus: 'success',
          processedAt: new Date().toISOString(),
          originalName: fileName
        }
      };

      // Add special handling for images
      if (contentType?.startsWith('image/')) {
        logger.info('Image file detected', { filePath, contentType });
        metadata.metadata.fileType = 'image';
        metadata.metadata.requiresThumbnail = 'true';
      }

      // Add special handling for documents
      if (isDocumentFile(contentType, fileExtension)) {
        logger.info('Document file detected', { filePath, contentType });
        metadata.metadata.fileType = 'document';
        metadata.metadata.requiresProcessing = 'true';
      }

      await file.setMetadata(metadata);
      logger.info('File processed successfully', { filePath });

      // Log to Firestore for tracking
      await admin.firestore().collection('storage_events').add({
        eventType: 'upload',
        filePath,
        contentType,
        fileSize,
        bucket: bucketName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success'
      });

      return { success: true, filePath, validationStatus: 'success' };
    } catch (error) {
      logger.error('Error processing file upload', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
);

/**
 * Triggered when a file is deleted from Cloud Storage
 * Logs the deletion and cleans up related resources
 */
export const onFileDeleted = onObjectDeleted(
  {
    region: 'asia-east1'
  },
  async event => {
    const filePath = event.data.name;
    const bucketName = event.data.bucket;

    logger.info('File deleted', {
      filePath,
      bucket: bucketName
    });

    try {
      // Log deletion event to Firestore
      await admin.firestore().collection('storage_events').add({
        eventType: 'delete',
        filePath,
        bucket: bucketName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('File deletion logged', { filePath });

      // Clean up related thumbnails if they exist
      const fileName = path.basename(filePath);
      const dirName = path.dirname(filePath);
      const thumbnailPath = path.join(dirName, 'thumbnails', `thumb_${fileName}`);

      const bucket = admin.storage().bucket(bucketName);
      const thumbnailFile = bucket.file(thumbnailPath);

      const [exists] = await thumbnailFile.exists();
      if (exists) {
        await thumbnailFile.delete();
        logger.info('Related thumbnail deleted', { thumbnailPath });
      }

      return { success: true, filePath };
    } catch (error) {
      logger.error('Error processing file deletion', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
);

/**
 * Validates uploaded file based on type, size, and extension
 */
function validateFile(contentType: string | undefined, fileSize: number, fileExtension: string): { valid: boolean; reason?: string } {
  // Maximum file size: 100MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  if (!contentType) {
    return { valid: false, reason: 'Missing content type' };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, reason: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  // Blocked file extensions
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1'];
  if (blockedExtensions.includes(fileExtension)) {
    return { valid: false, reason: `File extension ${fileExtension} is not allowed` };
  }

  // Allowed content types
  const allowedTypes = [
    'image/',
    'video/',
    'audio/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'text/'
  ];

  const isAllowed = allowedTypes.some(type => contentType.startsWith(type));
  if (!isAllowed) {
    return { valid: false, reason: `Content type ${contentType} is not allowed` };
  }

  return { valid: true };
}

/**
 * Checks if file is a document based on content type and extension
 */
function isDocumentFile(contentType: string | undefined, fileExtension: string): boolean {
  if (!contentType) return false;

  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'text/plain',
    'text/csv'
  ];

  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

  return documentTypes.some(type => contentType.startsWith(type)) || documentExtensions.includes(fileExtension);
}
