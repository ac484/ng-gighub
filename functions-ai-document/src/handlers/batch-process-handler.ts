/**
 * Batch Document Processing Handler
 * Processes multiple documents in batch using Google Cloud Document AI
 * Based on Firebase Functions v2 API and Document AI v1 API
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { BatchProcessDocumentsRequest, BatchProcessingResult, DocumentAIEventLog, DocumentAIOperationContext } from '../types';
import { validateGcsUri, getProcessorName, getProcessorConfigFromEnv, isSupportedMimeType } from '../utils/document-utils';
import { logDocumentOperationStart, logDocumentOperationSuccess, logDocumentOperationFailure, logValidationFailure } from '../utils/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Batch processes multiple documents using Document AI
 * Returns an operation that can be tracked for progress
 *
 * Features:
 * - Batch processing of multiple documents
 * - Asynchronous operation with progress tracking
 * - Results written to Cloud Storage
 * - Comprehensive error handling
 * - Audit trail logging
 *
 * @example
 * ```typescript
 * const result = await batchProcessDocuments({
 *   inputDocuments: [
 *     { gcsUri: 'gs://my-bucket/doc1.pdf', mimeType: 'application/pdf' },
 *     { gcsUri: 'gs://my-bucket/doc2.pdf', mimeType: 'application/pdf' }
 *   ],
 *   outputGcsUri: 'gs://my-bucket/output/',
 *   skipHumanReview: true
 * });
 *
 * // Track operation progress
 * // Operation results will be written to: gs://my-bucket/output/
 * ```
 */
export const batchProcessDocuments = onCall<BatchProcessDocumentsRequest>(
  {
    region: 'asia-east1',
    memory: '2GiB',
    timeoutSeconds: 540,
    maxInstances: 5
  },
  async request => {
    const startTime = Date.now();
    const { inputDocuments, outputGcsUri, skipHumanReview = true } = request.data;
    const userId = request.auth?.uid;

    // Get processor configuration from environment
    let processorConfig;
    try {
      processorConfig = getProcessorConfigFromEnv();
    } catch (error) {
      throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'Failed to get processor configuration');
    }

    // Create operation context for logging
    const context: DocumentAIOperationContext = {
      operation: 'batch-process-documents',
      documentPath: `batch-${inputDocuments.length}-documents`,
      userId,
      timestamp: new Date(),
      processorInfo: {
        processorId: processorConfig.processorId,
        location: processorConfig.location,
        projectId: processorConfig.projectId
      }
    };

    logDocumentOperationStart(context);

    try {
      // Validate input documents
      if (!inputDocuments || inputDocuments.length === 0) {
        throw new HttpsError('invalid-argument', 'No input documents provided');
      }

      if (inputDocuments.length > 500) {
        throw new HttpsError('invalid-argument', 'Maximum 500 documents per batch');
      }

      // Validate output GCS URI
      const outputValidation = validateGcsUri(outputGcsUri);
      if (!outputValidation.valid) {
        logValidationFailure(outputGcsUri, outputValidation.reason || 'Invalid output GCS URI');
        throw new HttpsError('invalid-argument', outputValidation.reason || 'Invalid output GCS URI');
      }

      // Validate each input document
      for (const doc of inputDocuments) {
        const uriValidation = validateGcsUri(doc.gcsUri);
        if (!uriValidation.valid) {
          logValidationFailure(doc.gcsUri, uriValidation.reason || 'Invalid GCS URI', {
            mimeType: doc.mimeType
          });
          throw new HttpsError('invalid-argument', `Invalid GCS URI: ${doc.gcsUri}`);
        }

        if (!isSupportedMimeType(doc.mimeType)) {
          logValidationFailure(doc.gcsUri, `Unsupported MIME type: ${doc.mimeType}`);
          throw new HttpsError('invalid-argument', `Unsupported MIME type: ${doc.mimeType}`);
        }
      }

      // Initialize Document AI client
      const client = new DocumentProcessorServiceClient({
        apiEndpoint: processorConfig.apiEndpoint || `${processorConfig.location}-documentai.googleapis.com`
      });

      const processorName = getProcessorName(processorConfig);

      // Prepare batch process request
      const inputConfigs = inputDocuments.map(doc => ({
        gcsSource: {
          uri: doc.gcsUri
        },
        mimeType: doc.mimeType
      }));

      // Start batch processing operation
      const [operation] = await client.batchProcessDocuments({
        name: processorName,
        inputDocuments: {
          gcsDocuments: {
            documents: inputConfigs
          }
        },
        documentOutputConfig: {
          gcsOutputConfig: {
            gcsUri: outputGcsUri
          }
        },
        skipHumanReview
      });

      const operationName = operation.name || 'unknown-operation';
      const duration = Date.now() - startTime;

      // Create result object
      const result: BatchProcessingResult = {
        operationName,
        status: 'pending',
        outputGcsUri,
        totalDocuments: inputDocuments.length,
        metadata: {
          startTime: new Date().toISOString()
        }
      };

      // Log successful batch start to Firestore
      await logEventToFirestore({
        eventType: 'batch_process',
        documentPath: `batch-${inputDocuments.length}-documents`,
        status: 'pending',
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        duration,
        metadata: {
          operationName,
          totalDocuments: inputDocuments.length,
          outputGcsUri,
          inputDocuments: inputDocuments.map(d => ({
            gcsUri: d.gcsUri,
            mimeType: d.mimeType
          }))
        },
        processorInfo: {
          processorId: processorConfig.processorId,
          location: processorConfig.location,
          projectId: processorConfig.projectId
        }
      });

      logDocumentOperationSuccess(context, duration, {
        operationName,
        totalDocuments: inputDocuments.length,
        outputGcsUri
      });

      return {
        success: true,
        result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logDocumentOperationFailure(context, error as Error, duration);

      // Log error to Firestore
      await logEventToFirestore({
        eventType: 'batch_process',
        documentPath: `batch-${inputDocuments.length}-documents`,
        status: 'failed',
        timestamp: admin.firestore.Timestamp.now(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId,
        duration,
        processorInfo: {
          processorId: processorConfig.processorId,
          location: processorConfig.location,
          projectId: processorConfig.projectId
        }
      }).catch(firestoreError => {
        console.error('Failed to log error to Firestore:', firestoreError);
      });

      // Re-throw as HttpsError for proper client handling
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', error instanceof Error ? error.message : 'Failed to start batch processing');
    }
  }
);

/**
 * Logs Document AI event to Firestore for audit trail
 *
 * @param eventLog - Event log data
 */
async function logEventToFirestore(eventLog: DocumentAIEventLog): Promise<void> {
  try {
    await admin.firestore().collection('documentai_events').add(eventLog);
  } catch (error) {
    console.error('Failed to log event to Firestore:', error);
    // Don't throw - logging should not fail the main operation
  }
}
