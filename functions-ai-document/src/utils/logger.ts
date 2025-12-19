/**
 * Structured logging utility for Document AI Functions
 * Enterprise-standard logging with context
 */

import * as logger from 'firebase-functions/logger';

import { DocumentAIOperationContext } from '../types';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Base log context
 */
type LogContext = Record<string, any>;

/**
 * Logs structured information with context
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context data
 */
function logWithContext(level: LogLevel, message: string, context?: LogContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    ...context
  };

  switch (level) {
    case LogLevel.DEBUG:
      logger.debug(message, logData);
      break;
    case LogLevel.INFO:
      logger.info(message, logData);
      break;
    case LogLevel.WARN:
      logger.warn(message, logData);
      break;
    case LogLevel.ERROR:
      logger.error(message, logData);
      break;
  }
}

/**
 * Logs document processing operation start
 *
 * @param context - Operation context
 */
export function logDocumentOperationStart(context: DocumentAIOperationContext): void {
  logWithContext(LogLevel.INFO, `Starting Document AI operation: ${context.operation}`, {
    operation: context.operation,
    documentPath: context.documentPath,
    mimeType: context.mimeType,
    userId: context.userId,
    processorId: context.processorInfo.processorId,
    location: context.processorInfo.location
  });
}

/**
 * Logs document processing operation success
 *
 * @param context - Operation context
 * @param duration - Operation duration in milliseconds
 * @param additionalData - Additional data to log
 */
export function logDocumentOperationSuccess(
  context: DocumentAIOperationContext,
  duration: number,
  additionalData?: Record<string, any>
): void {
  logWithContext(LogLevel.INFO, `Document AI operation completed: ${context.operation}`, {
    operation: context.operation,
    documentPath: context.documentPath,
    duration: `${duration}ms`,
    status: 'success',
    processorId: context.processorInfo.processorId,
    ...additionalData
  });
}

/**
 * Logs document processing operation failure
 *
 * @param context - Operation context
 * @param error - Error object
 * @param duration - Operation duration in milliseconds
 */
export function logDocumentOperationFailure(context: DocumentAIOperationContext, error: Error, duration: number): void {
  logWithContext(LogLevel.ERROR, `Document AI operation failed: ${context.operation}`, {
    operation: context.operation,
    documentPath: context.documentPath,
    duration: `${duration}ms`,
    status: 'failed',
    error: error.message,
    stack: error.stack,
    processorId: context.processorInfo.processorId
  });
}

/**
 * Logs document validation failure
 *
 * @param documentPath - Document path or GCS URI
 * @param reason - Validation failure reason
 * @param context - Additional context
 */
export function logValidationFailure(documentPath: string, reason: string, context?: Record<string, any>): void {
  logWithContext(LogLevel.WARN, 'Document validation failed', {
    documentPath,
    reason,
    ...context
  });
}

/**
 * Logs security event
 *
 * @param eventType - Security event type
 * @param details - Event details
 */
export function logSecurityEvent(eventType: string, details: Record<string, any>): void {
  logWithContext(LogLevel.WARN, `Security event: ${eventType}`, {
    eventType,
    severity: 'high',
    ...details
  });
}

/**
 * Logs performance metric
 *
 * @param metric - Metric name
 * @param value - Metric value
 * @param context - Additional context
 */
export function logPerformanceMetric(metric: string, value: number, context?: Record<string, any>): void {
  logWithContext(LogLevel.INFO, `Performance metric: ${metric}`, {
    metric,
    value,
    unit: 'ms',
    ...context
  });
}

/**
 * Logs debug information
 *
 * @param message - Debug message
 * @param data - Debug data
 */
export function debug(message: string, data?: Record<string, any>): void {
  logWithContext(LogLevel.DEBUG, message, data);
}

/**
 * Logs info message
 *
 * @param message - Info message
 * @param data - Additional data
 */
export function info(message: string, data?: Record<string, any>): void {
  logWithContext(LogLevel.INFO, message, data);
}

/**
 * Logs warning
 *
 * @param message - Warning message
 * @param data - Additional data
 */
export function warn(message: string, data?: Record<string, any>): void {
  logWithContext(LogLevel.WARN, message, data);
}

/**
 * Logs error
 *
 * @param message - Error message
 * @param error - Error object or data
 */
export function error(message: string, error: Error | Record<string, any>): void {
  const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : error;

  logWithContext(LogLevel.ERROR, message, errorData);
}
