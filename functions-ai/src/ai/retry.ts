/**
 * @fileOverview Retry Utility for AI Operations
 * @description Implements exponential backoff retry logic for resilient AI API calls
 */

import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 * - 3 retries
 * - Start with 1 second delay
 * - Max 10 seconds delay
 * - 2x exponential backoff
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Execute a function with exponential backoff retry
 * 
 * @param fn - Async function to execute
 * @param options - Retry options (partial, uses defaults for omitted fields)
 * @param context - Context string for logging
 * @returns Promise resolving to function result
 * @throws HttpsError if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: string
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${opts.maxRetries + 1}`, { context });
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If this was the last attempt, break and throw
      if (attempt === opts.maxRetries) {
        break;
      }

      // Only retry on retryable errors
      if (!isRetryableError(error)) {
        logger.warn('Non-retryable error encountered', {
          context,
          error: error.message,
          code: error.code
        });
        throw error;
      }

      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        context,
        error: error.message,
        code: error.code
      });

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  // All retries failed
  logger.error('All retry attempts failed', {
    context,
    attempts: opts.maxRetries + 1,
    error: lastError.message,
    code: lastError.code
  });

  throw new HttpsError(
    'unavailable',
    `Operation failed after ${opts.maxRetries + 1} attempts: ${lastError.message}`
  );
}

/**
 * Check if error is retryable
 * 
 * Retryable errors include:
 * - UNAVAILABLE (service temporarily unavailable)
 * - DEADLINE_EXCEEDED (timeout)
 * - RESOURCE_EXHAUSTED (rate limit)
 * - INTERNAL (temporary server error)
 */
function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'RESOURCE_EXHAUSTED',
    'INTERNAL',
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'internal'
  ];

  // Check error code
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check error message for common transient issues
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('timeout') ||
    message.includes('rate limit') ||
    message.includes('temporarily unavailable') ||
    message.includes('try again')
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
