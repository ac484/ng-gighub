/**
 * @fileOverview AI Chat Generation Cloud Function
 * @description Generates chat responses using Google Gemini AI
 */

import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { getGenAIClient, DEFAULT_CHAT_MODEL, DEFAULT_GENERATION_CONFIG } from './client';
import type { AIGenerateChatRequest, AIGenerateChatResponse, AIChatMessage } from '../types/ai.types';

/**
 * AI Chat Generation Cloud Function
 *
 * Generates chat responses maintaining conversation context
 *
 * @example
 * ```typescript
 * const result = await httpsCallable(functions, 'ai-generateChat')({
 *   messages: [
 *     { role: 'user', content: 'What is construction safety?' },
 *     { role: 'model', content: 'Construction safety is...' },
 *     { role: 'user', content: 'What are key measures?' }
 *   ]
 * });
 * ```
 */
export const generateChat = onCall<AIGenerateChatRequest, Promise<AIGenerateChatResponse>>(
  {
    // Security: Require authentication
    enforceAppCheck: false, // Set to true when App Check is enabled
    // Performance: Set memory and timeout
    memory: '512MiB',
    timeoutSeconds: 60,
    // Region
    region: 'asia-east1'
  },
  async request => {
    const { messages, maxTokens, temperature, blueprintId } = request.data;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Messages array is required and must not be empty');
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new HttpsError('invalid-argument', 'Each message must have role and content');
      }
      if (msg.role !== 'user' && msg.role !== 'model') {
        throw new HttpsError('invalid-argument', "Message role must be 'user' or 'model'");
      }
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    logger.info('AI Chat Generation Request', {
      userId: request.auth.uid,
      blueprintId,
      messageCount: messages.length
    });

    try {
      const ai = getGenAIClient();

      // Convert messages to GenAI format
      const contents = messages.map((msg: AIChatMessage) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      // Generate content
      const response = await ai.models.generateContent({
        model: DEFAULT_CHAT_MODEL,
        contents,
        config: {
          maxOutputTokens: maxTokens || 1000,
          temperature: temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
          topP: DEFAULT_GENERATION_CONFIG.topP,
          topK: DEFAULT_GENERATION_CONFIG.topK
        }
      });

      // Extract response text
      const responseText = response.text || '';
      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

      const result: AIGenerateChatResponse = {
        response: responseText,
        tokensUsed,
        model: DEFAULT_CHAT_MODEL,
        timestamp: Date.now()
      };

      logger.info('AI Chat Generation Success', {
        userId: request.auth.uid,
        tokensUsed,
        responseLength: responseText.length
      });

      return result;
    } catch (error) {
      logger.error('AI Chat Generation Failed', {
        userId: request.auth.uid,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error) {
        throw new HttpsError('internal', error.message);
      }
      throw new HttpsError('internal', 'Failed to generate chat response');
    }
  }
);
