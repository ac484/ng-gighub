/**
 * Error handling utilities
 * Enterprise-standard error handling and HTTP errors
 */

import { https } from 'firebase-functions/v2';

import { createLogger } from './logger.util';

const logger = createLogger({ module: 'error-util' });

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Client errors (4xx)
  INVALID_ARGUMENT = 'invalid-argument',
  UNAUTHENTICATED = 'unauthenticated',
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  FAILED_PRECONDITION = 'failed-precondition',

  // Server errors (5xx)
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  DATA_LOSS = 'data-loss'
}

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Convert to HttpsError for callable functions
   */
  toHttpsError(): https.HttpsError {
    return new https.HttpsError(this.code as any, this.message, this.details);
  }
}

/**
 * Error handler wrapper for async functions
 */
export function handleError(error: unknown, context?: string): never {
  if (error instanceof AppError) {
    logger.error(`Application error in ${context || 'unknown'}`, error, {
      code: error.code,
      details: error.details
    });
    throw error.toHttpsError();
  }

  if (error instanceof Error) {
    logger.error(`Unexpected error in ${context || 'unknown'}`, error);
    throw new https.HttpsError(ErrorCode.INTERNAL, 'An unexpected error occurred', { originalError: error.message });
  }

  logger.error(`Unknown error in ${context || 'unknown'}`, error);
  throw new https.HttpsError(ErrorCode.INTERNAL, 'An unknown error occurred');
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, any>>(data: T, requiredFields: Array<keyof T>): void {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new AppError(ErrorCode.INVALID_ARGUMENT, `Missing required fields: ${missing.join(', ')}`, { missingFields: missing });
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
    }
  }) as T;
}
