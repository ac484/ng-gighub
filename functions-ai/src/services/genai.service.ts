/**
 * Enterprise-grade Google GenAI Service
 * Implements best practices from @google/genai v1.34.0 SDK
 *
 * Features:
 * - Dual API support (Gemini Developer API + Vertex AI)
 * - Auto-configuration from environment variables
 * - Streaming response support
 * - Function calling capabilities
 * - Comprehensive error handling with retry logic
 * - Usage metrics and monitoring
 * - Type safety with TypeScript
 */

import { GoogleGenAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';

import { getGenAIConfig } from '../config/genai.config';
import { GenerateContentRequest, GenerateContentResponse, GenAIError, GenAIErrorType, StreamChunk } from '../types/genai.types';
import {
  createMetrics,
  logMetrics,
  mapErrorToGenAIError,
  updateMetricsError,
  updateMetricsSuccess,
  validateGenerationConfig,
  withRetry
} from '../utils/genai.utils';

/**
 * Google GenAI Service
 * Singleton service for interacting with Google GenAI APIs
 */
export class GenAIService {
  private static instance: GenAIService;
  private client: GoogleGenAI;
  private configManager = getGenAIConfig();

  private constructor() {
    try {
      // Initialize client with auto-configuration
      const sdkConfig = this.configManager.getSDKConfig();
      this.client = new GoogleGenAI(sdkConfig);

      logger.info('GenAI Service initialized', {
        config: this.configManager.getConfigSummary()
      });
    } catch (error: any) {
      logger.error('Failed to initialize GenAI Service', { error });
      throw mapErrorToGenAIError(error);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GenAIService {
    if (!GenAIService.instance) {
      GenAIService.instance = new GenAIService();
    }
    return GenAIService.instance;
  }

  /**
   * Generate content with full response
   * Suitable for synchronous operations where you need the complete response
   *
   * @param request - Generation request parameters
   * @returns Complete response with text and metadata
   */
  public async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const metrics = createMetrics(request.model, 'generateContent');

    try {
      // Validate configuration
      if (request.config) {
        validateGenerationConfig(request.config);
      }

      // Execute with retry logic
      const response = await withRetry(async () => {
        return await this.client.models.generateContent({
          model: request.model,
          contents: request.contents,
          config: request.config as any // Use SDK types
        });
      }, 'generateContent');

      // Update metrics with success
      updateMetricsSuccess(metrics, response);
      logMetrics(metrics);

      // Return formatted response
      return {
        text: response.text,
        functionCalls: response.functionCalls as any,
        usageMetadata: response.usageMetadata as any,
        finishReason: response.candidates?.[0]?.finishReason,
        candidates: response.candidates
      };
    } catch (error: any) {
      const genAIError = mapErrorToGenAIError(error);
      updateMetricsError(metrics, genAIError);
      logMetrics(metrics);
      throw genAIError;
    }
  }

  /**
   * Generate content with streaming response
   * Suitable for real-time interactions with progressive content display
   *
   * @param request - Generation request parameters
   * @returns AsyncGenerator yielding text chunks
   */
  public async *generateContentStream(request: GenerateContentRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const metrics = createMetrics(request.model, 'generateContentStream');

    try {
      // Validate configuration
      if (request.config) {
        validateGenerationConfig(request.config);
      }

      // Execute with retry logic for initial connection
      const responseStream = await withRetry(async () => {
        return await this.client.models.generateContentStream({
          model: request.model,
          contents: request.contents,
          config: request.config as any // Use SDK types
        });
      }, 'generateContentStream');

      // Stream chunks
      let totalTokens = 0;
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield { text: chunk.text, content: chunk };
        }

        // Track token usage from final chunk
        if (chunk.usageMetadata?.totalTokenCount) {
          totalTokens = chunk.usageMetadata.totalTokenCount;
        }
      }

      // Update metrics with success
      metrics.totalTokens = totalTokens;
      updateMetricsSuccess(metrics, { usageMetadata: { totalTokenCount: totalTokens } });
      logMetrics(metrics);

      // Signal completion
      yield { done: true };
    } catch (error: any) {
      const genAIError = mapErrorToGenAIError(error);
      updateMetricsError(metrics, genAIError);
      logMetrics(metrics);
      throw genAIError;
    }
  }

  /**
   * Generate simple text response
   * Convenience method for common text generation use case
   *
   * @param prompt - Text prompt
   * @param model - Model to use (optional, defaults to configured model)
   * @param config - Generation configuration (optional)
   * @returns Generated text
   */
  public async generateText(prompt: string, model?: string, config?: any): Promise<string> {
    const response = await this.generateContent({
      model: model || this.configManager.getDefaultModel(),
      contents: prompt,
      config
    });

    if (!response.text) {
      throw new GenAIError('No text generated in response', GenAIErrorType.UNKNOWN);
    }

    return response.text;
  }

  /**
   * Check if service is using Vertex AI
   */
  public isVertexAI(): boolean {
    return this.configManager.isVertexAI();
  }

  /**
   * Get default model
   */
  public getDefaultModel(): string {
    return this.configManager.getDefaultModel();
  }

  /**
   * Health check for the service
   * Tests connectivity and authentication
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    apiType: string;
    error?: string;
  }> {
    try {
      // Simple generation to test connectivity
      await this.generateText('Hello', this.configManager.getDefaultModel(), { maxOutputTokens: 10 });

      return {
        healthy: true,
        apiType: this.isVertexAI() ? 'Vertex AI' : 'Gemini Developer API'
      };
    } catch (error: any) {
      return {
        healthy: false,
        apiType: this.isVertexAI() ? 'Vertex AI' : 'Gemini Developer API',
        error: error.message
      };
    }
  }
}

/**
 * Export singleton instance getter
 */
export const getGenAIService = (): GenAIService => {
  return GenAIService.getInstance();
};
