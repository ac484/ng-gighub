/**
 * @fileOverview AI Text Generation Cloud Function
 * @description Generates text using Google Gemini AI
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  getGenAIClient,
  DEFAULT_TEXT_MODEL,
  DEFAULT_GENERATION_CONFIG,
} from "./client";
import type {
  AIGenerateTextRequest,
  AIGenerateTextResponse,
} from "../types/ai.types";

/**
 * AI Text Generation Cloud Function
 *
 * Generates text based on a prompt using Google Gemini AI
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'ai-generateText')({
 *   prompt: 'Explain quantum computing',
 *   maxTokens: 500
 * });
 * ```
 */
export const generateText = onCall<
  AIGenerateTextRequest,
  Promise<AIGenerateTextResponse>
>(
  {
    // Security: Require authentication
    enforceAppCheck: false, // Set to true when App Check is enabled
    // Performance: Set memory and timeout
    memory: "512MiB",
    timeoutSeconds: 60,
    // Region
    region: "asia-east1",
  },
  async (request) => {
    const {prompt, maxTokens, temperature, blueprintId} = request.data;

    // Validate input
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Prompt is required and must be a non-empty string"
      );
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    logger.info("AI Text Generation Request", {
      userId: request.auth.uid,
      blueprintId,
      promptLength: prompt.length,
    });

    try {
      const ai = getGenAIClient();

      // Generate content
      const response = await ai.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: prompt,
        config: {
          maxOutputTokens: maxTokens || 1000,
          temperature: temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
          topP: DEFAULT_GENERATION_CONFIG.topP,
          topK: DEFAULT_GENERATION_CONFIG.topK,
        },
      });

      // Extract text from response
      const text = response.text || "";
      const tokensUsed =
        response.usageMetadata?.totalTokenCount || 0;

      const result: AIGenerateTextResponse = {
        text,
        tokensUsed,
        model: DEFAULT_TEXT_MODEL,
        timestamp: Date.now(),
      };

      logger.info("AI Text Generation Success", {
        userId: request.auth.uid,
        tokensUsed,
        textLength: text.length,
      });

      return result;
    } catch (error) {
      logger.error("AI Text Generation Failed", {
        userId: request.auth.uid,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        throw new HttpsError("internal", error.message);
      }
      throw new HttpsError("internal", "Failed to generate text");
    }
  }
);
