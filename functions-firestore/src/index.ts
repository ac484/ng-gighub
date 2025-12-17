/**
 * Firestore Cloud Functions
 *
 * Handles Firestore document change events including:
 * - Blueprint document changes (create, update, delete)
 * - Audit logging for data changes
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({
  maxInstances: 10,
  region: 'asia-east1'
});

/**
 * Triggered when a blueprint document is created, updated, or deleted
 * Logs the change and creates an audit trail
 */
export const onBlueprintChange = onDocumentWritten(
  {
    document: 'blueprints/{blueprintId}',
    region: 'asia-east1'
  },
  async event => {
    const blueprintId = event.params.blueprintId;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Determine operation type
    const operation = !beforeData ? 'created' : !afterData ? 'deleted' : 'updated';

    logger.info('Blueprint document changed', {
      blueprintId,
      operation,
      hasBeforeData: !!beforeData,
      hasAfterData: !!afterData
    });

    try {
      // Create audit log entry
      const auditLog = {
        documentType: 'blueprint',
        documentId: blueprintId,
        operation,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        beforeData: beforeData || null,
        afterData: afterData || null
      };

      // Only track specific field changes for updates
      if (operation === 'updated' && beforeData && afterData) {
        const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

        // Track important field changes
        const fieldsToTrack = ['name', 'status', 'owner', 'members'];
        fieldsToTrack.forEach(field => {
          if (beforeData[field] !== afterData[field]) {
            changes.push({
              field,
              oldValue: beforeData[field],
              newValue: afterData[field]
            });
          }
        });

        if (changes.length > 0) {
          Object.assign(auditLog, { changes });
          logger.info('Blueprint fields changed', { blueprintId, changes });
        }
      }

      // Write audit log to Firestore
      await admin.firestore().collection('audit_logs').add(auditLog);
      logger.info('Audit log created', { blueprintId, operation });

      return { success: true, operation, blueprintId };
    } catch (error) {
      logger.error('Error processing blueprint change', {
        blueprintId,
        operation,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
);

/**
 * Triggered when a user document is created
 * Initializes user metadata and sets up default collections
 */
export const onUserCreated = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'asia-east1'
  },
  async event => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    logger.info('New user created', {
      userId,
      email: userData?.email
    });

    try {
      // Initialize user metadata
      const userMetadata = {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null,
        profileComplete: false,
        notificationPreferences: {
          email: true,
          push: true
        }
      };

      // Update user document with metadata
      await admin.firestore().collection('users').doc(userId).set(userMetadata, { merge: true });

      logger.info('User metadata initialized', { userId });

      return { success: true, userId };
    } catch (error) {
      logger.error('Error initializing user', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
);
