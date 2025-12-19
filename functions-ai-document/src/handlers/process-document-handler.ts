/**
 * Document Processing Handler
 * Processes documents using Google Cloud Document AI
 * Based on Firebase Functions v2 API and Document AI v1 API
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import {
  ProcessDocumentFromStorageRequest,
  ProcessDocumentFromContentRequest,
  DocumentAIEventLog,
  DocumentAIOperationContext
} from '../types';
import {
  validateDocument,
  validateGcsUri,
  getProcessorName,
  getProcessorConfigFromEnv,
  convertToProcessingResult,
  formatFileSize,
  parseGcsUri
} from '../utils/document-utils';
import {
  logDocumentOperationStart,
  logDocumentOperationSuccess,
  logDocumentOperationFailure,
  logValidationFailure,
  logSecurityEvent
} from '../utils/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Processes a document from Cloud Storage using Document AI
 *
 * Features:
 * - Document validation
 * - Text extraction
 * - Entity extraction (if processor supports it)
 * - Form field extraction (if processor supports it)
 * - Comprehensive error handling
 * - Audit trail logging
 *
 * @example
 * ```typescript
 * const result = await processDocumentFromStorage({
 *   gcsUri: 'gs://my-bucket/documents/invoice.pdf',
 *   mimeType: 'application/pdf',
 *   skipHumanReview: true
 * });
 * ```
 */
export const processDocumentFromStorage = onCall<ProcessDocumentFromStorageRequest>(
  {
    region: 'asia-east1',
    memory: '2GiB',
    timeoutSeconds: 540,
    maxInstances: 10,
    secrets: ['DOCUMENTAI_LOCATION', 'DOCUMENTAI_PROCESSOR_ID']
  },
  async request => {
    const startTime = Date.now();
    const { gcsUri, mimeType, skipHumanReview = true, fieldMask } = request.data;
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
      operation: 'process-document-from-storage',
      documentPath: gcsUri,
      mimeType,
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
      // Validate GCS URI
      const uriValidation = validateGcsUri(gcsUri);
      if (!uriValidation.valid) {
        logValidationFailure(gcsUri, uriValidation.reason || 'Invalid GCS URI', {
          mimeType
        });

        throw new HttpsError('invalid-argument', uriValidation.reason || 'Invalid GCS URI');
      }

      // Parse GCS URI to get bucket and path
      const { bucket, path: filePath } = parseGcsUri(gcsUri);

      // Get file metadata to validate size
      const bucketRef = admin.storage().bucket(bucket);
      const file = bucketRef.file(filePath);
      const [metadata] = await file.getMetadata();
      const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : metadata.size || 0;

      // Validate document
      const validation = validateDocument(mimeType, fileSize);

      if (!validation.valid) {
        logValidationFailure(gcsUri, validation.reason || 'Unknown validation error', {
          mimeType,
          fileSize: formatFileSize(fileSize)
        });

        // Log security event for blocked document
        logSecurityEvent('blocked-document-processing', {
          gcsUri,
          reason: validation.reason,
          mimeType,
          fileSize
        });

        // Log failed event to Firestore
        await logEventToFirestore({
          eventType: 'process_document',
          documentPath: gcsUri,
          mimeType,
          status: 'failed',
          timestamp: admin.firestore.Timestamp.now(),
          errorMessage: validation.reason,
          userId,
          processorInfo: {
            processorId: processorConfig.processorId,
            location: processorConfig.location,
            projectId: processorConfig.projectId
          }
        });

        throw new HttpsError('invalid-argument', validation.reason || 'Document validation failed');
      }

      // Initialize Document AI client
      const client = new DocumentProcessorServiceClient({
        apiEndpoint: processorConfig.apiEndpoint || `${processorConfig.location}-documentai.googleapis.com`
      });

      const processorName = getProcessorName(processorConfig);

      // Process document
      const [result] = await client.processDocument({
        name: processorName,
        gcsDocument: {
          gcsUri,
          mimeType
        },
        skipHumanReview,
        fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
      });

      if (!result.document) {
        throw new Error('No document returned from Document AI');
      }

      // Convert to standardized result format
      const duration = Date.now() - startTime;
      const processingResult = convertToProcessingResult(result.document, duration, mimeType);

      // Log successful processing to Firestore
      await logEventToFirestore({
        eventType: 'process_document',
        documentPath: gcsUri,
        mimeType,
        status: 'success',
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        duration,
        metadata: {
          pageCount: processingResult.metadata.pageCount,
          textLength: processingResult.text.length,
          hasEntities: !!processingResult.entities,
          hasFormFields: !!processingResult.formFields
        },
        processorInfo: {
          processorId: processorConfig.processorId,
          location: processorConfig.location,
          projectId: processorConfig.projectId
        }
      });

      logDocumentOperationSuccess(context, duration, {
        pageCount: processingResult.metadata.pageCount,
        textLength: processingResult.text.length,
        entitiesCount: processingResult.entities?.length || 0,
        formFieldsCount: processingResult.formFields?.length || 0
      });

      return {
        success: true,
        result: processingResult
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logDocumentOperationFailure(context, error as Error, duration);

      // Log error to Firestore
      await logEventToFirestore({
        eventType: 'process_document',
        documentPath: gcsUri,
        mimeType,
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

      throw new HttpsError('internal', error instanceof Error ? error.message : 'Failed to process document');
    }
  }
);

/**
 * Processes a document from raw content using Document AI
 *
 * @example
 * ```typescript
 * const result = await processDocumentFromContent({
 *   content: base64EncodedContent,
 *   mimeType: 'application/pdf',
 *   skipHumanReview: true
 * });
 * ```
 */
export const processDocumentFromContent = onCall<ProcessDocumentFromContentRequest>(
  {
    region: 'asia-east1',
    memory: '2GiB',
    timeoutSeconds: 540,
    maxInstances: 10,
    secrets: ['DOCUMENTAI_LOCATION', 'DOCUMENTAI_PROCESSOR_ID']
  },
  async request => {
    const startTime = Date.now();
    const { content, mimeType, skipHumanReview = true, fieldMask } = request.data;
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
      operation: 'process-document-from-content',
      documentPath: 'inline-content',
      mimeType,
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
      // Validate content size (base64 encoded, so actual size is ~3/4)
      const contentSize = Buffer.from(content, 'base64').length;
      const validation = validateDocument(mimeType, contentSize);

      if (!validation.valid) {
        logValidationFailure('inline-content', validation.reason || 'Unknown validation error', {
          mimeType,
          contentSize: formatFileSize(contentSize)
        });

        throw new HttpsError('invalid-argument', validation.reason || 'Document validation failed');
      }

      // Initialize Document AI client
      const client = new DocumentProcessorServiceClient({
        apiEndpoint: processorConfig.apiEndpoint || `${processorConfig.location}-documentai.googleapis.com`
      });

      const processorName = getProcessorName(processorConfig);

      // Process document
      const [result] = await client.processDocument({
        name: processorName,
        rawDocument: {
          content,
          mimeType
        },
        skipHumanReview,
        fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
      });

      if (!result.document) {
        throw new Error('No document returned from Document AI');
      }

      // Convert to standardized result format
      const duration = Date.now() - startTime;
      const processingResult = convertToProcessingResult(result.document, duration, mimeType);

      // Log successful processing to Firestore
      await logEventToFirestore({
        eventType: 'process_document',
        documentPath: 'inline-content',
        mimeType,
        status: 'success',
        timestamp: admin.firestore.Timestamp.now(),
        userId,
        duration,
        metadata: {
          pageCount: processingResult.metadata.pageCount,
          textLength: processingResult.text.length,
          contentSize
        },
        processorInfo: {
          processorId: processorConfig.processorId,
          location: processorConfig.location,
          projectId: processorConfig.projectId
        }
      });

      logDocumentOperationSuccess(context, duration, {
        pageCount: processingResult.metadata.pageCount,
        textLength: processingResult.text.length,
        contentSize: formatFileSize(contentSize)
      });

      return {
        success: true,
        result: processingResult
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logDocumentOperationFailure(context, error as Error, duration);

      // Log error to Firestore
      await logEventToFirestore({
        eventType: 'process_document',
        documentPath: 'inline-content',
        mimeType,
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

      throw new HttpsError('internal', error instanceof Error ? error.message : 'Failed to process document');
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
