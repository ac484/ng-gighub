import { Injectable } from '@angular/core';

import { ConsoleTransport } from './console-transport';
import { LogTransport } from './log-transport.interface';

/**
 * Log levels used for structured logging.
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * Structured log entry definition.
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Minimal structured logger with pluggable transports.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.INFO;
  private readonly transports: LogTransport[] = [new ConsoleTransport()];

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  trace(source: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, source, message, context);
  }

  debug(source: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, source, message, context);
  }

  info(source: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, source, message, context);
  }

  warn(source: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, source, message, context);
  }

  error(source: string, message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(
      LogLevel.ERROR,
      source,
      message,
      context,
      error ? { name: error.name, message: error.message, stack: error.stack } : undefined
    );
  }

  private log(
    level: LogLevel,
    source: string,
    message: string,
    context?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      context,
      error
    };

    this.transports.forEach(transport => transport.log(entry));
  }
}
