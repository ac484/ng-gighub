/**
 * Contract Parsing Cloud Function
 *
 * Handles OCR/AI parsing of contract documents.
 * This function is called from the frontend via httpsCallable.
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

/**
 * File attachment structure
 */
interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storagePath?: string;
}

/**
 * Parsed data structure
 */
interface ContractParsedData {
  parsingEngine: 'ocr' | 'ai' | 'manual';
  parsedAt: Date;
  confidence: number;
  extractedData: {
    contractNumber?: string;
    contractTitle?: string;
    totalAmount?: number;
    currency?: string;
    parties?: Array<{
      name?: string;
      type?: string;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
    }>;
    workItems?: Array<{
      code?: string;
      name?: string;
      unit?: string;
      quantity?: number;
      unitPrice?: number;
    }>;
    terms?: Array<{
      title?: string;
      content?: string;
    }>;
    startDate?: string;
    endDate?: string;
  };
  needsVerification: boolean;
}

/**
 * Parse contract request data
 */
interface ParseContractRequest {
  blueprintId: string;
  contractId: string;
  requestId: string;
  files: FileAttachment[];
}

/**
 * Parse contract response data
 */
interface ParseContractResponse {
  success: boolean;
  requestId: string;
  parsedData?: ContractParsedData;
  errorMessage?: string;
}

/**
 * Contract Document Parsing Function
 *
 * This is a placeholder implementation that simulates OCR/AI parsing.
 * In production, this would integrate with:
 * - Google Cloud Vision API for OCR
 * - Vertex AI / Gemini for intelligent extraction
 * - Document AI for structured document parsing
 *
 * @param request - The parsing request containing file information
 * @returns Parsing result with extracted data
 */
export const parseContractDocument = onCall<ParseContractRequest, Promise<ParseContractResponse>>(
  {
    region: 'asia-east1',
    memory: '512MiB',
    timeoutSeconds: 300, // 5 minutes for complex documents
    cors: true
  },
  async request => {
    const { blueprintId, contractId, requestId, files } = request.data;

    // Validate authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to parse contracts');
    }

    // Validate input
    if (!blueprintId || !contractId || !requestId) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    if (!files || files.length === 0) {
      throw new HttpsError('invalid-argument', 'No files provided for parsing');
    }

    logger.info('Contract parsing requested', {
      blueprintId,
      contractId,
      requestId,
      fileCount: files.length,
      userId: request.auth.uid
    });

    try {
      // Update parsing request status to 'processing'
      const db = admin.firestore();
      const requestRef = db
        .collection('blueprints')
        .doc(blueprintId)
        .collection('contracts')
        .doc(contractId)
        .collection('parsingRequests')
        .doc(requestId);

      await requestRef.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Simulate parsing process
      // In production, this would call actual OCR/AI services
      const parsedData = await simulateContractParsing(files);

      // Update request status to 'completed'
      await requestRef.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Contract parsing completed', {
        blueprintId,
        contractId,
        requestId,
        confidence: parsedData.confidence
      });

      return {
        success: true,
        requestId,
        parsedData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';

      logger.error('Contract parsing failed', {
        blueprintId,
        contractId,
        requestId,
        error: errorMessage
      });

      // Update request status to 'failed'
      try {
        const db = admin.firestore();
        await db
          .collection('blueprints')
          .doc(blueprintId)
          .collection('contracts')
          .doc(contractId)
          .collection('parsingRequests')
          .doc(requestId)
          .update({
            status: 'failed',
            errorMessage,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (updateError) {
        logger.error('Failed to update request status', updateError);
      }

      return {
        success: false,
        requestId,
        errorMessage
      };
    }
  }
);

/**
 * Simulate contract parsing
 *
 * This is a placeholder that simulates the parsing process.
 * In production, replace with actual OCR/AI integration:
 *
 * 1. Google Cloud Vision API - OCR text extraction
 * 2. Document AI - Structured document parsing
 * 3. Vertex AI / Gemini - Intelligent data extraction
 *
 * @param files - Files to parse
 * @returns Simulated parsed data
 */
async function simulateContractParsing(files: FileAttachment[]): Promise<ContractParsedData> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check file types for confidence scoring
  const hasPdf = files.some(f => f.fileType === 'application/pdf');
  const hasImage = files.some(f => f.fileType.startsWith('image/'));

  // Base confidence based on file types
  let confidence = 0.7;
  if (hasPdf) {
    confidence = 0.85; // PDF usually has better text extraction
  } else if (hasImage) {
    confidence = 0.75; // Images require OCR
  }

  // Return simulated parsed data
  // In production, this would contain actual extracted data
  return {
    parsingEngine: hasPdf ? 'ai' : 'ocr',
    parsedAt: new Date(),
    confidence,
    extractedData: {
      // Placeholder extracted data
      // Real implementation would extract from document content
      contractNumber: undefined,
      contractTitle: undefined,
      totalAmount: undefined,
      currency: 'TWD',
      parties: [],
      workItems: [],
      terms: [],
      startDate: undefined,
      endDate: undefined
    },
    needsVerification: true // Always require verification for auto-parsed data
  };
}

// Export the function
export default parseContractDocument;
