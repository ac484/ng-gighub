/**
 * @fileOverview Contract Document Parsing Cloud Function
 * @description Extracts structured data from contract documents using Google Gemini AI
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  getGenAIClient,
  DEFAULT_VISION_MODEL,
} from "../ai/client";
import type {
  ContractParsingRequest,
  ContractParsingResponse,
  ContractParsingOutput,
  TaskSchema,
} from "../types/contract.types";

/**
 * System prompt for contract parsing
 */
const PARSING_SYSTEM_PROMPT = `You are an expert financial analyst for construction projects.
Analyze the provided document and extract the following information:

1. **Engagement Name**: The official title of the project or contract.
2. **Client Name**: The customer or entity for whom the work is being done.
3. **Total Value (Subtotal)**: The total value before tax.
4. **Tax**: The total tax amount. If not specified, this can be omitted.
5. **Total Value with Tax**: The grand total including tax. If not specified, this can be omitted.
6. **Work Breakdown Structure (Tasks)**: A detailed list of all work items.

For each task item, provide:
- id: A unique identifier (can be sequential like "task-1", "task-2", etc.)
- title: The description of the work item
- quantity: The quantity of units
- unitPrice: The price per unit
- value: The total value (quantity × unitPrice)
- discount: Any discount applied (if not specified, use 0)
- lastUpdated: Current date in ISO format
- completedQuantity: Default to 0
- subTasks: An empty array for now

Respond ONLY with valid JSON in the following format (no markdown, no code blocks):
{
  "name": "Project Name",
  "client": "Client Name",
  "totalValue": 1000000,
  "tax": 50000,
  "totalValueWithTax": 1050000,
  "tasks": [
    {
      "id": "task-1",
      "title": "Task description",
      "quantity": 100,
      "unitPrice": 1000,
      "value": 100000,
      "discount": 0,
      "lastUpdated": "2025-12-17T00:00:00.000Z",
      "completedQuantity": 0,
      "subTasks": []
    }
  ]
}`;

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
export const parseContract = onCall<
  ContractParsingRequest,
  Promise<ContractParsingResponse>
>(
  {
    // Security: Require authentication
    enforceAppCheck: false, // Set to true when App Check is enabled
    // Performance: Set memory and timeout (parsing can be resource intensive)
    memory: "1GiB",
    timeoutSeconds: 300, // 5 minutes for complex documents
    // Region
    region: "asia-east1",
  },
  async (request) => {
    const {blueprintId, contractId, requestId, files} = request.data;

    // Validate input
    if (!blueprintId || !contractId || !requestId) {
      throw new HttpsError(
        "invalid-argument",
        "blueprintId, contractId, and requestId are required"
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "At least one file is required for parsing"
      );
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info("Contract Parsing Request", {
      userId: request.auth.uid,
      blueprintId,
      contractId,
      requestId,
      fileCount: files.length,
    });

    try {
      const ai = getGenAIClient();

      // Process each file and combine results
      const allTasks: TaskSchema[] = [];
      let contractName = "";
      let clientName = "";
      let totalValue = 0;
      let tax: number | undefined;
      let totalValueWithTax: number | undefined;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        logger.info("Processing file", {
          requestId,
          fileIndex: i + 1,
          fileName: file.name,
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
              role: "user",
              parts: [
                {text: PARSING_SYSTEM_PROMPT},
                {text: `\n\nDocument for analysis:`},
                {
                  inlineData: {
                    mimeType: file.mimeType,
                    data: fileDataUri.split(",")[1] || fileDataUri,
                  },
                },
              ],
            },
          ],
          config: {
            maxOutputTokens: 4096,
            temperature: 0.1, // Low temperature for more deterministic parsing
            responseMimeType: "application/json",
          },
        });

        const resultText = response.text || "";
        logger.info("AI Response received", {
          requestId,
          fileIndex: i + 1,
          responseLength: resultText.length,
        });

        // Parse JSON response
        let parsedData: ContractParsingOutput;
        try {
          parsedData = JSON.parse(resultText) as ContractParsingOutput;
        } catch (parseError) {
          logger.error("Failed to parse AI response as JSON", {
            requestId,
            fileIndex: i + 1,
            response: resultText.substring(0, 500),
            error: parseError instanceof Error ? parseError.message : "Unknown",
          });
          throw new Error(`Failed to parse AI response: ${resultText.substring(0, 100)}...`);
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
        tasks: allTasks,
      };

      logger.info("Contract Parsing Success", {
        userId: request.auth.uid,
        requestId,
        taskCount: allTasks.length,
        totalValue,
      });

      return {
        success: true,
        requestId,
        parsedData: finalParsedData,
      };
    } catch (error) {
      logger.error("Contract Parsing Failed", {
        userId: request.auth.uid,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        requestId,
        errorMessage: error instanceof Error ? error.message : "Failed to parse contract",
      };
    }
  }
);
