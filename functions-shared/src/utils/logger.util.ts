/**
 * Structured logging utility
 * Enterprise-standard logging with consistent format
 */

import * as logger from 'firebase-functions/logger';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  functionName?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Structured logger for Firebase Functions
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Add context to logger
   */
  withContext(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    logger.debug(message, { ...this.context, ...data });
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    logger.info(message, { ...this.context, ...data });
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    logger.warn(message, { ...this.context, ...data });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, data?: any): void {
    const errorData =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : error;

    logger.error(message, {
      ...this.context,
      error: errorData,
      ...data
    });
  }

  /**
   * Log function execution time
   */
  logExecutionTime(functionName: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.info(`Function execution completed`, {
      functionName,
      duration: `${duration}ms`
    });
  }
}

/**
 * Create a logger instance with context
 */
export function createLogger(context: LogContext = {}): Logger {
  return new Logger(context);
}
