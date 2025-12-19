/**
 * File Metadata Manager
 * Callable function for updating file metadata
 * Based on Firebase Functions v2 API - onCall
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { UpdateMetadataRequest } from '../types';
import { logFileOperationStart, logFileOperationSuccess, logFileOperationFailure, info } from '../utils/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Updates file metadata in Cloud Storage and Firestore
 * Requires authentication
 *
 * Features:
 * - Authentication required
 * - File existence validation
 * - Metadata synchronization between Storage and Firestore
 * - Audit trail
 */
export const updateFileMetadata = onCall<UpdateMetadataRequest>(
  {
    region: 'asia-east1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10
  },
  async request => {
    const startTime = Date.now();

    // Step 1: Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { filePath, metadata } = request.data;

    // Step 2: Validate input
    if (!filePath) {
      throw new HttpsError('invalid-argument', 'File path is required');
    }

    if (!metadata || Object.keys(metadata).length === 0) {
      throw new HttpsError('invalid-argument', 'Metadata is required');
    }

    const context = {
      operation: 'metadata-update',
      filePath,
      bucket: 'default',
      userId,
      timestamp: new Date()
    };

    logFileOperationStart(context);

    try {
      // Step 3: Get file reference and check existence
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'File does not exist');
      }

      // Step 4: Update Storage metadata
      const storageMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
          storageMetadata[key] = value;
        } else if (Array.isArray(value)) {
          storageMetadata[key] = JSON.stringify(value);
        } else if (value !== null && value !== undefined) {
          storageMetadata[key] = String(value);
        }
      }

      await file.setMetadata({
        metadata: {
          ...storageMetadata,
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        }
      });

      info('Storage metadata updated', {
        filePath,
        userId,
        metadataKeys: Object.keys(metadata)
      });

      // Step 5: Update Firestore record if exists
      const fileId = filePath.split('/').pop()?.split('.')[0];
      if (fileId) {
        try {
          const fileDoc = await admin.firestore().collection('files').doc(fileId).get();

          if (fileDoc.exists) {
            await fileDoc.ref.update({
              ...metadata,
              updatedBy: userId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            info('Firestore metadata updated', {
              fileId,
              userId
            });
          }
        } catch (firestoreError) {
          // Log but don't fail - Firestore update is optional
          console.warn('Failed to update Firestore metadata:', firestoreError);
        }
      }

      // Step 6: Log metadata update event
      try {
        await admin.firestore().collection('storage_events').add({
          eventType: 'metadata_update',
          filePath,
          bucket: bucket.name,
          timestamp: admin.firestore.Timestamp.now(),
          status: 'success',
          userId,
          metadata
        });
      } catch (logError) {
        // Log but don't fail
        console.warn('Failed to log metadata update event:', logError);
      }

      const duration = Date.now() - startTime;
      logFileOperationSuccess(context, duration, {
        metadataKeys: Object.keys(metadata)
      });

      return {
        success: true,
        filePath,
        metadata
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle HttpsError separately
      if (error instanceof HttpsError) {
        logFileOperationFailure(context, error as Error, duration);
        throw error;
      }

      // Log and re-throw other errors
      logFileOperationFailure(context, error as Error, duration);
      throw new HttpsError('internal', 'Failed to update file metadata', {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);
