/**
 * Utility functions for Google GenAI operations
 * Includes error handling, retry logic, and monitoring
 */

import * as logger from 'firebase-functions/logger';

import { GenAIError, GenAIErrorType, GenAIMetrics } from '../types/genai.types';

/**
 * Retry configuration for transient errors
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
};

/**
 * Map SDK errors to custom error types
 */
export function mapErrorToGenAIError(error: any): GenAIError {
  const errorMessage = error.message || 'Unknown error';
  const statusCode = error.status || error.statusCode;

  // Check error message patterns
  if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
    return new GenAIError(errorMessage, GenAIErrorType.AUTHENTICATION_ERROR, statusCode || 401, error);
  }

  if (errorMessage.includes('permission') || statusCode === 403) {
    return new GenAIError(errorMessage, GenAIErrorType.PERMISSION_DENIED, statusCode || 403, error);
  }

  if (errorMessage.includes('quota') || statusCode === 429) {
    return new GenAIError(errorMessage, GenAIErrorType.QUOTA_EXCEEDED, statusCode || 429, error);
  }

  if (errorMessage.includes('rate limit')) {
    return new GenAIError(errorMessage, GenAIErrorType.RATE_LIMIT_EXCEEDED, statusCode || 429, error);
  }

  if (errorMessage.includes('not found') || statusCode === 404) {
    return new GenAIError(errorMessage, GenAIErrorType.MODEL_NOT_FOUND, statusCode || 404, error);
  }

  if (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT') {
    return new GenAIError(errorMessage, GenAIErrorType.TIMEOUT, statusCode || 408, error);
  }

  if (errorMessage.includes('network') || error.code === 'ENOTFOUND') {
    return new GenAIError(errorMessage, GenAIErrorType.NETWORK_ERROR, statusCode || 503, error);
  }

  if (errorMessage.includes('invalid') || statusCode === 400) {
    return new GenAIError(errorMessage, GenAIErrorType.INVALID_ARGUMENT, statusCode || 400, error);
  }

  // Default to unknown error
  return new GenAIError(errorMessage, GenAIErrorType.UNKNOWN, statusCode || 500, error);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: GenAIError): boolean {
  const retryableTypes = [
    GenAIErrorType.RATE_LIMIT_EXCEEDED,
    GenAIErrorType.RESOURCE_EXHAUSTED,
    GenAIErrorType.NETWORK_ERROR,
    GenAIErrorType.TIMEOUT
  ];

  return retryableTypes.includes(error.type);
}

/**
 * Execute operation with exponential backoff retry
 */
export async function withRetry<T>(operation: () => Promise<T>, operationName: string, config: Partial<RetryConfig> = {}): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: GenAIError;
  let delay = retryConfig.initialDelayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = mapErrorToGenAIError(error);

      // Don't retry if error is not retryable
      if (!isRetryableError(lastError)) {
        logger.error(`${operationName} failed (non-retryable):`, {
          error: lastError.message,
          type: lastError.type,
          attempt: attempt + 1
        });
        throw lastError;
      }

      // Don't retry if max retries reached
      if (attempt >= retryConfig.maxRetries) {
        logger.error(`${operationName} failed after ${attempt + 1} attempts:`, {
          error: lastError.message,
          type: lastError.type
        });
        throw lastError;
      }

      // Log retry attempt
      logger.warn(`${operationName} failed, retrying in ${delay}ms:`, {
        error: lastError.message,
        type: lastError.type,
        attempt: attempt + 1,
        maxRetries: retryConfig.maxRetries
      });

      // Wait before retry
      await sleep(delay);

      // Exponential backoff with jitter
      delay = Math.min(delay * retryConfig.backoffMultiplier + Math.random() * 1000, retryConfig.maxDelayMs);
    }
  }

  throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create metrics object for monitoring
 */
export function createMetrics(model: string, operation: 'generateContent' | 'generateContentStream' | 'chat'): GenAIMetrics {
  return {
    requestId: generateRequestId(),
    model,
    operation,
    startTime: Date.now(),
    success: false
  };
}

/**
 * Update metrics with success response
 */
export function updateMetricsSuccess(metrics: GenAIMetrics, response: any): GenAIMetrics {
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;
  metrics.success = true;

  // Extract token usage if available
  if (response.usageMetadata) {
    metrics.promptTokens = response.usageMetadata.promptTokenCount;
    metrics.completionTokens = response.usageMetadata.candidatesTokenCount;
    metrics.totalTokens = response.usageMetadata.totalTokenCount;
  }

  return metrics;
}

/**
 * Update metrics with error
 */
export function updateMetricsError(metrics: GenAIMetrics, error: GenAIError): GenAIMetrics {
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;
  metrics.success = false;
  metrics.errorType = error.type;
  metrics.errorMessage = error.message;

  return metrics;
}

/**
 * Log metrics for monitoring
 */
export function logMetrics(metrics: GenAIMetrics): void {
  if (metrics.success) {
    logger.info('GenAI operation completed', {
      requestId: metrics.requestId,
      model: metrics.model,
      operation: metrics.operation,
      duration: metrics.duration,
      totalTokens: metrics.totalTokens
    });
  } else {
    logger.error('GenAI operation failed', {
      requestId: metrics.requestId,
      model: metrics.model,
      operation: metrics.operation,
      duration: metrics.duration,
      errorType: metrics.errorType,
      errorMessage: metrics.errorMessage
    });
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `genai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate generation configuration
 */
export function validateGenerationConfig(config: any): void {
  if (config.maxOutputTokens !== undefined) {
    if (config.maxOutputTokens < 1 || config.maxOutputTokens > 8192) {
      throw new GenAIError('maxOutputTokens must be between 1 and 8192', GenAIErrorType.INVALID_ARGUMENT);
    }
  }

  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      throw new GenAIError('temperature must be between 0 and 2', GenAIErrorType.INVALID_ARGUMENT);
    }
  }

  if (config.topP !== undefined) {
    if (config.topP < 0 || config.topP > 1) {
      throw new GenAIError('topP must be between 0 and 1', GenAIErrorType.INVALID_ARGUMENT);
    }
  }

  if (config.topK !== undefined) {
    if (config.topK < 1 || config.topK > 40) {
      throw new GenAIError('topK must be between 1 and 40', GenAIErrorType.INVALID_ARGUMENT);
    }
  }
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging(data: any): any {
  const sanitized = { ...data };

  // Remove sensitive fields
  if (sanitized.apiKey) {
    sanitized.apiKey = '***REDACTED***';
  }

  if (sanitized.credentials) {
    sanitized.credentials = '***REDACTED***';
  }

  return sanitized;
}
