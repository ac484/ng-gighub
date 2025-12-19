/**
 * Structured logging utility for Firebase Functions
 * Enterprise-standard logging with context
 */

import * as logger from 'firebase-functions/logger';

import { FileOperationContext } from '../types';

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
 * Logs file operation start
 *
 * @param context - File operation context
 */
export function logFileOperationStart(context: FileOperationContext): void {
  logWithContext(LogLevel.INFO, `Starting file operation: ${context.operation}`, {
    operation: context.operation,
    filePath: context.filePath,
    bucket: context.bucket,
    contentType: context.contentType,
    fileSize: context.fileSize,
    userId: context.userId
  });
}

/**
 * Logs file operation success
 *
 * @param context - File operation context
 * @param duration - Operation duration in milliseconds
 * @param additionalData - Additional data to log
 */
export function logFileOperationSuccess(context: FileOperationContext, duration: number, additionalData?: Record<string, any>): void {
  logWithContext(LogLevel.INFO, `File operation completed: ${context.operation}`, {
    operation: context.operation,
    filePath: context.filePath,
    bucket: context.bucket,
    duration: `${duration}ms`,
    status: 'success',
    ...additionalData
  });
}

/**
 * Logs file operation failure
 *
 * @param context - File operation context
 * @param error - Error object
 * @param duration - Operation duration in milliseconds
 */
export function logFileOperationFailure(context: FileOperationContext, error: Error, duration: number): void {
  logWithContext(LogLevel.ERROR, `File operation failed: ${context.operation}`, {
    operation: context.operation,
    filePath: context.filePath,
    bucket: context.bucket,
    duration: `${duration}ms`,
    status: 'failed',
    error: error.message,
    stack: error.stack
  });
}

/**
 * Logs file validation failure
 *
 * @param filePath - File path
 * @param reason - Validation failure reason
 * @param context - Additional context
 */
export function logValidationFailure(filePath: string, reason: string, context?: Record<string, any>): void {
  logWithContext(LogLevel.WARN, 'File validation failed', {
    filePath,
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
 * Logs cleanup operation
 *
 * @param resourceType - Type of resource being cleaned
 * @param resourcePath - Path to resource
 * @param success - Whether cleanup was successful
 */
export function logCleanup(resourceType: string, resourcePath: string, success: boolean): void {
  const level = success ? LogLevel.INFO : LogLevel.WARN;
  logWithContext(level, `Resource cleanup: ${resourceType}`, {
    resourceType,
    resourcePath,
    success
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
