import { LogEntry } from './logger.service';

/**
 * Transport interface for structured logs.
 */
export interface LogTransport {
  log(entry: LogEntry): void;
}
