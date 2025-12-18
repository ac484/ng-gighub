/**
 * Process Contract Upload Function
 *
 * Step 2 of the Contract OCR Pipeline:
 * - Receives file upload notification
 * - Creates contract draft document
 * - Triggers OCR parsing via functions-ai
 * - Updates draft status
 *
 * SETC-012: Contract Upload & Parsing Service
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { onCall, HttpsError } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type {
  ProcessContractUploadRequest,
  ProcessContractUploadResponse,
  ContractDraft,
  OcrParseResult
} from './types';

const db = getFirestore();

/**
 * Process a contract file upload
 *
 * Creates a draft document and triggers OCR parsing
 */
export const processContractUpload = onCall<ProcessContractUploadRequest>(
  { cors: true, maxInstances: 10 },
  async (request): Promise<ProcessContractUploadResponse> => {
    const { data, auth } = request;

    // Validate authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate request
    const { blueprintId, contractId, fileUrl, filePath, fileName, fileType, fileSize, requestedBy } = data;

    if (!blueprintId || !contractId || !fileUrl || !filePath) {
      throw new HttpsError('invalid-argument', 'Missing required fields: blueprintId, contractId, fileUrl, filePath');
    }

    logger.info('[processContractUpload]', 'Processing upload', {
      blueprintId,
      contractId,
      fileName,
      fileSize
    });

    try {
      // Create draft document
      const draftRef = db.collection('blueprints').doc(blueprintId).collection('contractDrafts').doc();
      const draftId = draftRef.id;

      const now = Timestamp.now();

      const draft: Omit<ContractDraft, 'id'> = {
        blueprintId,
        contractId,
        status: 'uploaded',
        originalFile: {
          url: fileUrl,
          path: filePath,
          fileName: fileName || 'unknown',
          fileType: fileType || 'application/pdf',
          fileSize: fileSize || 0,
          uploadedAt: now,
          uploadedBy: requestedBy || auth.uid
        },
        createdAt: now,
        updatedAt: now,
        createdBy: requestedBy || auth.uid
      };

      await draftRef.set(draft);

      logger.info('[processContractUpload]', 'Draft created', { draftId, status: 'uploaded' });

      // Trigger OCR parsing asynchronously
      // Note: In a production system, this would call the functions-ai service
      // For now, we'll update the status to show the pipeline is ready
      await triggerOcrParsing(blueprintId, draftId, fileUrl, filePath);

      return {
        success: true,
        draftId,
        status: 'uploaded'
      };
    } catch (error) {
      logger.error('[processContractUpload]', 'Failed to process upload', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to process upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Trigger OCR parsing for the uploaded file
 * This will call the functions-ai service to perform OCR
 */
async function triggerOcrParsing(blueprintId: string, draftId: string, fileUrl: string, filePath: string): Promise<void> {
  const draftRef = db.collection('blueprints').doc(blueprintId).collection('contractDrafts').doc(draftId);

  try {
    // Update status to parsing
    await draftRef.update({
      status: 'parsing',
      updatedAt: Timestamp.now()
    });

    logger.info('[triggerOcrParsing]', 'Starting OCR parsing', { draftId, fileUrl });

    // TODO: Call functions-ai for actual OCR parsing
    // For now, simulate a successful parse with placeholder data
    // In production, this would be:
    // const result = await callFunctionsAI({ fileUrl, filePath });

    // Simulate parsing delay (would be removed in production)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create placeholder OCR result
    const ocrResult: OcrParseResult = {
      success: true,
      parsedAt: Timestamp.now(),
      engine: 'gemini',
      parsedData: {
        contractNumber: 'PENDING_OCR',
        contractTitle: 'Contract Pending OCR Processing'
      },
      confidence: {
        overall: 0,
        fields: {}
      },
      processingTimeMs: 1000
    };

    // Update draft with OCR result
    await draftRef.update({
      status: 'parsed',
      ocrResult,
      updatedAt: Timestamp.now()
    });

    logger.info('[triggerOcrParsing]', 'OCR parsing completed', { draftId, status: 'parsed' });
  } catch (error) {
    logger.error('[triggerOcrParsing]', 'OCR parsing failed', error);

    // Update draft with error status
    await draftRef.update({
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'OCR parsing failed',
      updatedAt: Timestamp.now()
    });
  }
}
