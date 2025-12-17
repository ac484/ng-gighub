/**
 * @fileOverview Contract Document Parsing Cloud Function
 * @description Extracts structured data from contract documents
 * using Google Gemini AI
 *
 * SETC-018: Enhanced Contract Parsing Implementation
 * Updated to use enhanced prompt and types for comprehensive data extraction.
 */

import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { getGenAIClient, DEFAULT_VISION_MODEL } from '../ai/client';
import { ENHANCED_PARSING_SYSTEM_PROMPT, createUserPrompt } from '../prompts/contract-parsing-enhanced.prompt';
import type {
  ContractParsingRequest,
  ContractParsingResponse,
  ContractParsingOutput,
  EnhancedContractParsingOutput,
  TaskSchema
} from '../types/contract.types';

/**
 * Original system prompt (kept for backward compatibility)
 *
 * @deprecated Use ENHANCED_PARSING_SYSTEM_PROMPT instead
 */
const PARSING_SYSTEM_PROMPT =
  'You are an expert financial analyst for ' +
  'construction projects.\n' +
  'Analyze the provided document and extract the following ' +
  'information:\n\n' +
  '1. **Engagement Name**: The official title of the project or ' +
  'contract.\n' +
  '2. **Client Name**: The customer or entity for whom the work is ' +
  'being done.\n' +
  '3. **Total Value (Subtotal)**: The total value before tax.\n' +
  '4. **Tax**: The total tax amount. If not specified, this can be ' +
  'omitted.\n' +
  '5. **Total Value with Tax**: The grand total including tax. If not ' +
  'specified, this can be omitted.\n' +
  '6. **Work Breakdown Structure (Tasks)**: A detailed list of all ' +
  'work items.\n\n' +
  'For each task item, provide:\n' +
  '- id: A unique identifier (can be sequential like "task-1", ' +
  '"task-2", etc.)\n' +
  '- title: The description of the work item\n' +
  '- quantity: The quantity of units\n' +
  '- unitPrice: The price per unit\n' +
  '- value: The total value (quantity × unitPrice)\n' +
  '- discount: Any discount applied (if not specified, use 0)\n' +
  '- lastUpdated: Current date in ISO format\n' +
  '- completedQuantity: Default to 0\n' +
  '- subTasks: An empty array for now\n\n' +
  'Respond ONLY with valid JSON in the following format ' +
  '(no markdown, no code blocks):\n' +
  '{\n' +
  '  "name": "Project Name",\n' +
  '  "client": "Client Name",\n' +
  '  "totalValue": 1000000,\n' +
  '  "tax": 50000,\n' +
  '  "totalValueWithTax": 1050000,\n' +
  '  "tasks": [\n' +
  '    {\n' +
  '      "id": "task-1",\n' +
  '      "title": "Task description",\n' +
  '      "quantity": 100,\n' +
  '      "unitPrice": 1000,\n' +
  '      "value": 100000,\n' +
  '      "discount": 0,\n' +
  '      "lastUpdated": "2025-12-17T00:00:00.000Z",\n' +
  '      "completedQuantity": 0,\n' +
  '      "subTasks": []\n' +
  '    }\n' +
  '  ]\n' +
  '}';

/**
 * Enable enhanced parsing mode
 * When true, uses ENHANCED_PARSING_SYSTEM_PROMPT for comprehensive data extraction
 * When false, uses original PARSING_SYSTEM_PROMPT for backward compatibility
 */
const USE_ENHANCED_PARSING = true; // SETC-018: Enable enhanced parsing

/**
 * Validates enhanced parsing output data
 * Ensures all critical fields are present and valid
 */
function validateEnhancedParsedData(data: any): data is EnhancedContractParsingOutput {
  // Check critical fields
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Validate basic fields
  if (!data.contractNumber || typeof data.contractNumber !== 'string') {
    logger.warn('Missing or invalid contractNumber');
    return false;
  }

  if (!data.title || typeof data.title !== 'string') {
    logger.warn('Missing or invalid title');
    return false;
  }

  if (!data.currency || typeof data.currency !== 'string') {
    logger.warn('Missing or invalid currency');
    return false;
  }

  // Validate party objects
  if (!data.owner || typeof data.owner !== 'object' || !data.owner.name) {
    logger.warn('Missing or invalid owner information');
    return false;
  }

  if (!data.contractor || typeof data.contractor !== 'object' || !data.contractor.name) {
    logger.warn('Missing or invalid contractor information');
    return false;
  }

  // Validate financial fields
  if (typeof data.totalAmount !== 'number' || data.totalAmount < 0) {
    logger.warn('Missing or invalid totalAmount');
    return false;
  }

  // Validate dates
  if (!data.startDate || !data.endDate) {
    logger.warn('Missing start or end date');
    return false;
  }

  // Validate work items
  if (!Array.isArray(data.workItems) || data.workItems.length === 0) {
    logger.warn('Missing or empty workItems array');
    return false;
  }

  return true;
}

/**
 * Converts enhanced parsing output to legacy format for backward compatibility
 * Maps new field names and structures to original ContractParsingOutput format
 */
function convertToLegacyFormat(enhanced: EnhancedContractParsingOutput): ContractParsingOutput {
  // Convert work items to legacy task format
  const tasks: TaskSchema[] = enhanced.workItems.map((item, index) => ({
    id: item.code || `task-${index + 1}`,
    title: item.title,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    value: item.totalPrice,
    discount: item.discount || 0,
    lastUpdated: new Date().toISOString(),
    completedQuantity: 0,
    subTasks: []
  }));

  return {
    name: enhanced.title,
    client: enhanced.contractor.name, // Use contractor name for backward compatibility
    totalValue: enhanced.totalAmount,
    tax: enhanced.tax,
    totalValueWithTax: enhanced.totalAmountWithTax,
    tasks
  };
}

/**
 * Contract Parsing Cloud Function
 *
 * Parses contract documents to extract structured data
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'contract-parseContract')({
 *   blueprintId: 'bp-123',
 *   contractId: 'ct-456',
 *   requestId: 'req-789',
 *   files: [{ id: 'f1', name: 'contract.pdf', dataUri: '...' }]
 * });
 * ```
 */
export const parseContract = onCall<ContractParsingRequest, Promise<ContractParsingResponse>>(
  {
    // Security: Require authentication
    enforceAppCheck: false, // Set to true when App Check is enabled
    // Performance: Set memory and timeout (parsing can be resource intensive)
    memory: '1GiB',
    timeoutSeconds: 300, // 5 minutes for complex documents
    // Region
    region: 'asia-east1'
  },
  async request => {
    const { blueprintId, contractId, requestId, files } = request.data;

    // Validate input
    if (!blueprintId || !contractId || !requestId) {
      throw new HttpsError('invalid-argument', 'blueprintId, contractId, and requestId are required');
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one file is required for parsing');
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    logger.info('Contract Parsing Request', {
      userId: request.auth.uid,
      blueprintId,
      contractId,
      requestId,
      fileCount: files.length
    });

    try {
      const ai = getGenAIClient();

      // Determine which prompt to use
      const systemPrompt = USE_ENHANCED_PARSING ? ENHANCED_PARSING_SYSTEM_PROMPT : PARSING_SYSTEM_PROMPT;

      logger.info('Using parsing mode', {
        requestId,
        enhanced: USE_ENHANCED_PARSING
      });

      // For enhanced parsing, process all files together
      // For legacy parsing, aggregate results
      if (USE_ENHANCED_PARSING) {
        // Enhanced parsing mode - comprehensive extraction
        let enhancedData: EnhancedContractParsingOutput | null = null;

        // Process first file (or all files if multi-page)
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          logger.info('Processing file (enhanced mode)', {
            requestId,
            fileIndex: i + 1,
            fileName: file.name
          });

          // Get file data URI
          const fileDataUri = file.dataUri || file.url;
          if (!fileDataUri) {
            throw new Error(`File ${file.name} has no dataUri or url`);
          }

          // Generate content with vision model
          const userPrompt = createUserPrompt(files.length);
          const response = await ai.models.generateContent({
            model: DEFAULT_VISION_MODEL,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `\n\n${userPrompt}` },
                  {
                    inlineData: {
                      mimeType: file.mimeType,
                      data: fileDataUri.split(',')[1] || fileDataUri
                    }
                  }
                ]
              }
            ],
            config: {
              maxOutputTokens: 8192, // Increased for enhanced output
              temperature: 0.1, // Low temperature for more deterministic parsing
              responseMimeType: 'application/json'
            }
          });

          const resultText = response.text || '';
          logger.info('AI Response received (enhanced)', {
            requestId,
            fileIndex: i + 1,
            responseLength: resultText.length
          });

          // Parse JSON response
          try {
            const parsedData = JSON.parse(resultText);

            // Validate enhanced data
            if (!validateEnhancedParsedData(parsedData)) {
              logger.warn('Enhanced parsing validation failed, falling back to legacy format', {
                requestId,
                fileIndex: i + 1
              });
              // Try to use whatever data we got
              enhancedData = parsedData as EnhancedContractParsingOutput;
            } else {
              enhancedData = parsedData;
              logger.info('Enhanced parsing validation successful', {
                requestId,
                contractNumber: enhancedData.contractNumber,
                workItemCount: enhancedData.workItems.length
              });
            }

            // For now, use first file's data (multi-file aggregation can be added later)
            if (i === 0) {
              break;
            }
          } catch (parseError) {
            logger.error('Failed to parse AI response as JSON (enhanced)', {
              requestId,
              fileIndex: i + 1,
              response: resultText.substring(0, 500),
              error: parseError instanceof Error ? parseError.message : 'Unknown'
            });
            throw new Error(`Failed to parse AI response: ${resultText.substring(0, 100)}...`);
          }
        }

        if (!enhancedData) {
          throw new Error('No valid parsed data from any file');
        }

        // Convert to legacy format for backward compatibility
        const legacyData = convertToLegacyFormat(enhancedData);

        logger.info('Contract Parsing Success (Enhanced)', {
          userId: request.auth.uid,
          requestId,
          contractNumber: enhancedData.contractNumber,
          currency: enhancedData.currency,
          workItemCount: enhancedData.workItems.length,
          totalAmount: enhancedData.totalAmount
        });

        return {
          success: true,
          requestId,
          parsedData: legacyData // Return legacy format for backward compatibility
        };
      }

      // Legacy parsing mode (kept for backward compatibility)
      const allTasks: TaskSchema[] = [];
      let contractName = '';
      let clientName = '';
      let totalValue = 0;
      let tax: number | undefined;
      let totalValueWithTax: number | undefined;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        logger.info('Processing file', {
          requestId,
          fileIndex: i + 1,
          fileName: file.name
        });

        // Get file data URI
        const fileDataUri = file.dataUri || file.url;
        if (!fileDataUri) {
          throw new Error(`File ${file.name} has no dataUri or url`);
        }

        // Generate content with vision model
        const response = await ai.models.generateContent({
          model: DEFAULT_VISION_MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                { text: PARSING_SYSTEM_PROMPT },
                { text: '\n\nDocument for analysis:' },
                {
                  inlineData: {
                    mimeType: file.mimeType,
                    data: fileDataUri.split(',')[1] || fileDataUri
                  }
                }
              ]
            }
          ],
          config: {
            maxOutputTokens: 4096,
            temperature: 0.1, // Low temperature for more deterministic parsing
            responseMimeType: 'application/json'
          }
        });

        const resultText = response.text || '';
        logger.info('AI Response received', {
          requestId,
          fileIndex: i + 1,
          responseLength: resultText.length
        });

        // Parse JSON response
        let parsedData: ContractParsingOutput;
        try {
          parsedData = JSON.parse(resultText) as ContractParsingOutput;
        } catch (parseError) {
          logger.error('Failed to parse AI response as JSON', {
            requestId,
            fileIndex: i + 1,
            response: resultText.substring(0, 500),
            error: parseError instanceof Error ? parseError.message : 'Unknown'
          });
          const preview = resultText.substring(0, 100);
          throw new Error(`Failed to parse AI response: ${preview}...`);
        }

        // Aggregate results
        if (i === 0) {
          contractName = parsedData.name;
          clientName = parsedData.client;
          totalValue = parsedData.totalValue;
          tax = parsedData.tax;
          totalValueWithTax = parsedData.totalValueWithTax;
        }

        allTasks.push(...parsedData.tasks);
      }

      // Combine results
      const finalParsedData: ContractParsingOutput = {
        name: contractName,
        client: clientName,
        totalValue,
        tax,
        totalValueWithTax,
        tasks: allTasks
      };

      logger.info('Contract Parsing Success', {
        userId: request.auth.uid,
        requestId,
        taskCount: allTasks.length,
        totalValue
      });

      return {
        success: true,
        requestId,
        parsedData: finalParsedData
      };
    } catch (error) {
      logger.error('Contract Parsing Failed', {
        userId: request.auth.uid,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        requestId,
        errorMessage: error instanceof Error ? error.message : 'Failed to parse contract'
      };
    }
  }
);
