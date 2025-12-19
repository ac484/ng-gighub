/**
 * File Upload Handler
 * Processes files uploaded to Cloud Storage with enterprise-standard validation
 * Based on Firebase Functions v2 API - onObjectFinalized
 */

import * as admin from 'firebase-admin';
import { onObjectFinalized } from 'firebase-functions/v2/storage';

import { FileMetadata, StorageEventLog, FileOperationContext } from '../types';
import { validateFile, getFileCategory, requiresThumbnail, shouldProcessFile, formatFileSize } from '../utils/file-utils';
import {
  logFileOperationStart,
  logFileOperationSuccess,
  logFileOperationFailure,
  logValidationFailure,
  logSecurityEvent
} from '../utils/logger';

import * as path from 'path';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Handles file upload events
 * Triggered when a file is uploaded to Cloud Storage
 *
 * Features:
 * - File validation (type, size, extension)
 * - Automatic metadata processing
 * - Security checks
 * - Event logging to Firestore
 * - Error handling with retries
 */
export const onFileUpload = onObjectFinalized(
  {
    region: 'asia-east1',
    memory: '1GiB',
    timeoutSeconds: 300,
    maxInstances: 10
  },
  async event => {
    const startTime = Date.now();

    // Extract file information from event
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const fileSizeStr = event.data.size || '0';
    const fileSize = typeof fileSizeStr === 'string' ? parseInt(fileSizeStr, 10) : fileSizeStr;
    const bucket = event.data.bucket;
    const fileName = path.basename(filePath);

    // Create operation context for logging
    const context: FileOperationContext = {
      operation: 'file-upload',
      filePath,
      bucket,
      contentType,
      fileSize,
      timestamp: new Date()
    };

    logFileOperationStart(context);

    try {
      // Skip files that should not be processed
      if (!shouldProcessFile(filePath)) {
        logFileOperationSuccess(context, Date.now() - startTime, {
          skipped: true,
          reason: 'File path excluded from processing'
        });
        return { processed: false, reason: 'skipped' };
      }

      // Get bucket reference
      const bucketRef = admin.storage().bucket(bucket);
      const file = bucketRef.file(filePath);

      // Step 1: Validate file
      const validation = validateFile(contentType, fileSize, fileName);

      if (!validation.valid) {
        logValidationFailure(filePath, validation.reason || 'Unknown validation error', {
          contentType,
          fileSize: formatFileSize(fileSize),
          fileName
        });

        // Log security event for blocked file
        logSecurityEvent('blocked-file-upload', {
          filePath,
          reason: validation.reason,
          contentType,
          fileSize
        });

        // Update file metadata to mark as invalid
        await file.setMetadata({
          metadata: {
            processed: 'false',
            validationStatus: 'failed',
            validationReason: validation.reason,
            processedAt: new Date().toISOString()
          } as Partial<FileMetadata>
        });

        // Log validation failure to Firestore
        await logEventToFirestore({
          eventType: 'upload',
          filePath,
          contentType,
          fileSize,
          bucket,
          timestamp: admin.firestore.Timestamp.now(),
          status: 'failed',
          errorMessage: validation.reason
        });

        // DO NOT delete file - just mark as invalid for audit trail
        logFileOperationSuccess(context, Date.now() - startTime, {
          validated: false,
          reason: validation.reason
        });

        return {
          processed: false,
          validated: false,
          reason: validation.reason
        };
      }

      // Step 2: Determine file category and processing requirements
      const fileCategory = getFileCategory(contentType);
      const needsThumbnail = requiresThumbnail(contentType);

      // Step 3: Update file metadata
      const metadata: Partial<FileMetadata> = {
        processed: 'true',
        validationStatus: 'success',
        processedAt: new Date().toISOString(),
        originalName: fileName,
        fileType: fileCategory,
        requiresThumbnail: needsThumbnail ? 'true' : 'false',
        requiresProcessing: fileCategory === 'image' ? 'true' : 'false',
        scanStatus: 'pending' // Will be updated by virus scanner if configured
      };

      await file.setMetadata({
        metadata,
        contentType: contentType || 'application/octet-stream'
      });

      // Step 4: Log successful upload to Firestore
      await logEventToFirestore({
        eventType: 'upload',
        filePath,
        contentType,
        fileSize,
        bucket,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'success',
        metadata: {
          fileCategory,
          requiresThumbnail: needsThumbnail,
          originalName: fileName
        }
      });

      const duration = Date.now() - startTime;
      logFileOperationSuccess(context, duration, {
        validated: true,
        fileCategory,
        fileSize: formatFileSize(fileSize),
        requiresThumbnail: needsThumbnail
      });

      return {
        processed: true,
        validated: true,
        fileCategory,
        requiresThumbnail: needsThumbnail
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logFileOperationFailure(context, error as Error, duration);

      // Log error to Firestore
      await logEventToFirestore({
        eventType: 'upload',
        filePath,
        contentType,
        fileSize,
        bucket,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }).catch(firestoreError => {
        // Log but don't throw - we don't want to fail the function due to logging issues
        console.error('Failed to log error to Firestore:', firestoreError);
      });

      // Re-throw error for Firebase Functions retry mechanism
      throw error;
    }
  }
);

/**
 * Logs storage event to Firestore for audit trail
 *
 * @param eventLog - Storage event log data
 */
async function logEventToFirestore(eventLog: StorageEventLog): Promise<void> {
  try {
    await admin.firestore().collection('storage_events').add(eventLog);
  } catch (error) {
    console.error('Failed to log event to Firestore:', error);
    // Don't throw - logging should not fail the main operation
  }
}
