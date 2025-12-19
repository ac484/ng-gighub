/**
 * File Deletion Handler
 * Processes files deleted from Cloud Storage with automatic cleanup
 * Based on Firebase Functions v2 API - onObjectDeleted
 */

import * as admin from 'firebase-admin';
import { onObjectDeleted } from 'firebase-functions/v2/storage';

import { StorageEventLog, FileOperationContext } from '../types';
import { getThumbnailPath } from '../utils/file-utils';
import { logFileOperationStart, logFileOperationSuccess, logFileOperationFailure, logCleanup, info } from '../utils/logger';

import * as path from 'path';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Handles file deletion events
 * Triggered when a file is deleted from Cloud Storage
 *
 * Features:
 * - Automatic thumbnail cleanup
 * - Event logging to Firestore
 * - Audit trail maintenance
 * - Error handling with graceful degradation
 */
export const onFileDeleted = onObjectDeleted(
  {
    region: 'asia-east1',
    memory: '512MiB',
    timeoutSeconds: 120,
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
      operation: 'file-delete',
      filePath,
      bucket,
      contentType,
      fileSize,
      timestamp: new Date()
    };

    logFileOperationStart(context);

    try {
      // Step 1: Log deletion event to Firestore for audit trail
      await logEventToFirestore({
        eventType: 'delete',
        filePath,
        contentType,
        fileSize,
        bucket,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'success'
      });

      // Step 2: Clean up related resources (thumbnails)
      let thumbnailCleaned = false;
      let thumbnailCleanupError: string | undefined;

      // Skip thumbnail cleanup if this IS a thumbnail
      if (!filePath.includes('/thumbnails/')) {
        try {
          const thumbnailPath = getThumbnailPath(filePath);
          const bucketRef = admin.storage().bucket(bucket);
          const thumbnailFile = bucketRef.file(thumbnailPath);

          // Check if thumbnail exists
          const [exists] = await thumbnailFile.exists();

          if (exists) {
            // Delete thumbnail
            await thumbnailFile.delete();
            thumbnailCleaned = true;

            logCleanup('thumbnail', thumbnailPath, true);
            info('Thumbnail deleted successfully', {
              originalFile: filePath,
              thumbnailPath
            });
          } else {
            info('No thumbnail found for deleted file', {
              originalFile: filePath,
              expectedThumbnailPath: thumbnailPath
            });
          }
        } catch (thumbnailError) {
          // Log but don't fail - thumbnail cleanup is non-critical
          thumbnailCleanupError = thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error';
          logCleanup('thumbnail', getThumbnailPath(filePath), false);
          console.warn('Failed to clean up thumbnail:', thumbnailError);
        }
      }

      // Step 3: Update Firestore file record if it exists
      try {
        const fileId = fileName.split('.')[0];
        const fileDoc = await admin.firestore().collection('files').doc(fileId).get();

        if (fileDoc.exists) {
          await fileDoc.ref.update({
            status: 'deleted',
            deletedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          info('Firestore file record updated', {
            fileId,
            filePath
          });
        }
      } catch (firestoreError) {
        // Log but don't fail - Firestore update is non-critical
        console.warn('Failed to update Firestore file record:', firestoreError);
      }

      // Step 4: Log deletion to audit log collection
      try {
        await admin.firestore().collection('file_deletion_logs').add({
          filePath,
          fileName,
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
          fileSize,
          contentType,
          thumbnailCleaned,
          thumbnailCleanupError
        });
      } catch (auditError) {
        // Log but don't fail - audit logging is non-critical
        console.warn('Failed to create audit log:', auditError);
      }

      const duration = Date.now() - startTime;
      logFileOperationSuccess(context, duration, {
        thumbnailCleaned,
        thumbnailCleanupError
      });

      return {
        processed: true,
        thumbnailCleaned,
        thumbnailCleanupError
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logFileOperationFailure(context, error as Error, duration);

      // Log error to Firestore (non-blocking)
      await logEventToFirestore({
        eventType: 'delete',
        filePath,
        contentType,
        fileSize,
        bucket,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }).catch(firestoreError => {
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
