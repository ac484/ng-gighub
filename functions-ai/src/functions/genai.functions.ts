/**
 * Cloud Functions for Google GenAI
 * Provides HTTP and Callable endpoints for AI operations
 */

import * as logger from 'firebase-functions/logger';
import { onCall, onRequest } from 'firebase-functions/v2/https';

import { getGenAIService } from '../services/genai.service';
import { GenAIError, GenAIErrorType, GenAIModel } from '../types/genai.types';

/**
 * Generate content (Callable Function)
 * Authenticated endpoint for generating AI content
 *
 * Usage from client:
 * const generateContent = httpsCallable(functions, 'genai-generateContent');
 * const result = await generateContent({
 *   prompt: "Write a poem",
 *   model: "gemini-2.5-flash",
 *   config: { maxOutputTokens: 500 }
 * });
 */
export const generateContent = onCall(
  {
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 60
  },
  async request => {
    try {
      // Authentication check (optional - remove if you want public access)
      if (!request.auth) {
        throw new GenAIError('Authentication required', GenAIErrorType.AUTHENTICATION_ERROR, 401);
      }

      // Extract parameters
      const { prompt, model, config } = request.data;

      // Validate required fields
      if (!prompt || typeof prompt !== 'string') {
        throw new GenAIError('Invalid prompt: must be a non-empty string', GenAIErrorType.INVALID_ARGUMENT, 400);
      }

      // Get service and generate content
      const service = getGenAIService();
      const response = await service.generateContent({
        model: model || service.getDefaultModel(),
        contents: prompt,
        config: config || {}
      });

      logger.info('Content generated successfully', {
        uid: request.auth?.uid,
        model: model || service.getDefaultModel(),
        tokens: response.usageMetadata?.totalTokenCount
      });

      return {
        success: true,
        data: {
          text: response.text,
          usageMetadata: response.usageMetadata,
          finishReason: response.finishReason
        }
      };
    } catch (error: any) {
      logger.error('Generate content failed', { error: error.message });

      return {
        success: false,
        error: {
          message: error.message,
          type: error.type || GenAIErrorType.UNKNOWN,
          code: error.statusCode || 500
        }
      };
    }
  }
);

/**
 * Generate text (HTTP Function)
 * Simple endpoint for text generation
 *
 * POST /genai-generateText
 * Body: { "prompt": "Your prompt here", "model": "gemini-2.5-flash" }
 */
export const generateText = onRequest(
  {
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: true // Enable CORS for web clients
  },
  async (req, res) => {
    try {
      // Only allow POST
      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: { message: 'Method not allowed' }
        });
        return;
      }

      // Extract parameters
      const { prompt, model, config } = req.body;

      // Validate required fields
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid prompt: must be a non-empty string' }
        });
        return;
      }

      // Get service and generate text
      const service = getGenAIService();
      const text = await service.generateText(prompt, model || service.getDefaultModel(), config || {});

      logger.info('Text generated successfully', {
        model: model || service.getDefaultModel(),
        promptLength: prompt.length,
        responseLength: text.length
      });

      res.status(200).json({
        success: true,
        data: { text }
      });
    } catch (error: any) {
      logger.error('Generate text failed', { error: error.message });

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          type: error.type || GenAIErrorType.UNKNOWN
        }
      });
    }
  }
);

/**
 * Generate content stream (HTTP Function)
 * Streaming endpoint for real-time content generation
 *
 * POST /genai-generateStream
 * Body: { "prompt": "Your prompt here", "model": "gemini-2.5-flash" }
 * Response: Server-Sent Events (SSE) stream
 */
export const generateStream = onRequest(
  {
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 300, // Longer timeout for streaming
    cors: true
  },
  async (req, res) => {
    try {
      // Only allow POST
      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: { message: 'Method not allowed' }
        });
        return;
      }

      // Extract parameters
      const { prompt, model, config } = req.body;

      // Validate required fields
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid prompt: must be a non-empty string' }
        });
        return;
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Get service and stream content
      const service = getGenAIService();
      const stream = service.generateContentStream({
        model: model || service.getDefaultModel(),
        contents: prompt,
        config: config || {}
      });

      // Stream chunks as Server-Sent Events
      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }

        if (chunk.done) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      }

      res.end();

      logger.info('Stream completed successfully', {
        model: model || service.getDefaultModel()
      });
    } catch (error: any) {
      logger.error('Generate stream failed', { error: error.message });

      // Send error as SSE
      res.write(
        `data: ${JSON.stringify({
          error: {
            message: error.message,
            type: error.type || GenAIErrorType.UNKNOWN
          }
        })}\n\n`
      );
      res.end();
    }
  }
);

/**
 * Health check endpoint
 * Tests GenAI service connectivity and authentication
 *
 * GET /genai-health
 */
export const health = onRequest(
  {
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30
  },
  async (req, res) => {
    try {
      const service = getGenAIService();
      const healthStatus = await service.healthCheck();

      const statusCode = healthStatus.healthy ? 200 : 503;
      res.status(statusCode).json({
        success: healthStatus.healthy,
        data: {
          apiType: healthStatus.apiType,
          timestamp: new Date().toISOString(),
          error: healthStatus.error
        }
      });
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });

      res.status(503).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }
  }
);

/**
 * List available models (HTTP Function)
 * Returns information about available models
 *
 * GET /genai-models
 */
export const models = onRequest(
  {
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 10
  },
  async (req, res) => {
    try {
      const service = getGenAIService();
      const defaultModel = service.getDefaultModel();

      res.status(200).json({
        success: true,
        data: {
          defaultModel,
          availableModels: Object.values(GenAIModel),
          apiType: service.isVertexAI() ? 'Vertex AI' : 'Gemini Developer API'
        }
      });
    } catch (error: any) {
      logger.error('List models failed', { error: error.message });

      res.status(500).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }
  }
);
