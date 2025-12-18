/**
 * @fileOverview Contract Document Parsing Cloud Function
 * @description Extracts structured data from contract documents using Google Gemini AI
 *
 * Phase 1 Refactoring Complete:
 * - ✅ Retry logic with exponential backoff
 * - ✅ Modernized AI client with HttpsError
 * - ✅ Modular prompt builder with JSON schema
 * - ✅ Unified type definitions
 * - ✅ Structured logging
 * - ✅ Validation and error handling
 *
 * @module contract/parseContract
 */

import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { getGenAIClient, DEFAULT_VISION_MODEL } from '../ai/client';
import { withRetry } from '../ai/retry';
import { ContractPromptBuilder, PROMPT_PRESETS } from '../prompts';
import { ContractParsingInput, ContractParsingOutput, isValidContractOutput, calculateOverallConfidence } from '../types';

/**
 * Generation Configuration for Contract Parsing
 * Uses STANDARD preset optimized for deterministic parsing
 */
const GENERATION_CONFIG = PROMPT_PRESETS.STANDARD;

/**
 * Validates contract parsing output
 *
 * Ensures all required fields are present and properly formatted.
 * Uses type guard from unified types module.
 *
 * @param data - Parsed data to validate
 * @returns True if data is valid ContractParsingOutput
 */
function validateParsedContract(data: any): data is ContractParsingOutput {
  if (!isValidContractOutput(data)) {
    logger.warn('Contract validation failed', {
      hasTitle: !!data?.title,
      hasTotalAmount: typeof data?.totalAmount === 'number',
      hasCurrency: !!data?.currency,
      hasOwner: !!data?.owner,
      hasContractor: !!data?.contractor,
      hasWorkItems: Array.isArray(data?.workItems)
    });
    return false;
  }

  // Additional validation
  if (data.workItems.length === 0) {
    logger.warn('No work items found in parsed contract');
    return false;
  }

  // Calculate and log overall confidence
  if (data.confidenceScores) {
    const overallConfidence = calculateOverallConfidence(data.confidenceScores);
    logger.info('Validation success with confidence scores', {
      overall: overallConfidence,
      ...data.confidenceScores
    });

    // Warn if confidence is too low
    if (overallConfidence < 0.6) {
      logger.warn('Overall confidence score is below 60%', {
        confidence: overallConfidence
      });
    }
  }

  return true;
}

/**
 * Contract Parsing Cloud Function (Refactored)
 *
 * Parses contract documents to extract structured data using modern infrastructure:
 * - Retry logic for resilience
 * - Modular prompt builder
 * - Unified type system
 * - Structured error handling
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'contract-parseContract')({
 *   fileDataUri: 'data:image/png;base64,...',
 *   blueprintId: 'bp-123',
 *   additionalContext: 'Focus on work items extraction'
 * });
 * ```
 */
export const parseContract = onCall<ContractParsingInput>(
  {
    // Security
    enforceAppCheck: false, // Set to true when App Check is enabled
    // Performance
    memory: '1GiB',
    timeoutSeconds: 300, // 5 minutes for complex documents
    // Region
    region: 'asia-east1'
  },
  async request => {
    const { fileDataUri, blueprintId, additionalContext } = request.data;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Validate input
    if (!fileDataUri) {
      throw new HttpsError('invalid-argument', 'fileDataUri is required');
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to parse contracts');
    }

    logger.info('Contract parsing request started', {
      userId: request.auth.uid,
      requestId,
      blueprintId,
      hasAdditionalContext: !!additionalContext
    });

    try {
      // Get AI client
      const ai = getGenAIClient();

      // Build prompt using modular builder
      const { systemInstruction, contents, jsonSchema } = ContractPromptBuilder.buildParsingPrompt(fileDataUri, additionalContext);

      logger.info('Prompt built', {
        requestId,
        systemInstructionLength: systemInstruction.length,
        contentsLength: contents.length
      });

      // Parse data URI to extract MIME type and base64 data
      let mimeType = 'application/pdf';
      let base64Data = fileDataUri;

      if (fileDataUri.startsWith('data:')) {
        const matches = fileDataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      // Generate content with retry logic
      const response = await withRetry(
        async () => {
          return await ai.models.generateContent({
            model: DEFAULT_VISION_MODEL,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemInstruction },
                  { text: `\n\n${contents}` },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            config: {
              ...GENERATION_CONFIG,
              responseMimeType: 'application/json',
              responseSchema: jsonSchema
            }
          });
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000
        },
        requestId
      );

      const resultText = response.text || '';
      logger.info('AI response received', {
        requestId,
        responseLength: resultText.length
      });

      // Parse JSON response
      let parsedData: ContractParsingOutput;
      try {
        parsedData = JSON.parse(resultText) as ContractParsingOutput;
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON', {
          requestId,
          response: resultText.substring(0, 500),
          error: parseError instanceof Error ? parseError.message : 'Unknown'
        });
        throw new HttpsError('internal', 'Failed to parse AI response as valid JSON');
      }

      // Validate parsed data
      if (!validateParsedContract(parsedData)) {
        logger.error('Parsed contract failed validation', {
          requestId,
          data: JSON.stringify(parsedData, null, 2).substring(0, 500)
        });
        throw new HttpsError('failed-precondition', 'Parsed contract data is incomplete or invalid');
      }

      logger.info('Contract parsing completed successfully', {
        userId: request.auth.uid,
        requestId,
        contractNumber: parsedData.contractNumber,
        totalAmount: parsedData.totalAmount,
        currency: parsedData.currency,
        workItemCount: parsedData.workItems.length
      });

      return {
        success: true,
        data: parsedData,
        requestId
      };
    } catch (error) {
      // Log error with context
      logger.error('Contract parsing failed', {
        userId: request.auth.uid,
        requestId,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap other errors as internal error
      throw new HttpsError('internal', `Contract parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
