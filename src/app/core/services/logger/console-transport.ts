import { LogTransport } from './log-transport.interface';
import { LogEntry, LogLevel } from './logger.service';

/**
 * Console transport for structured logs.
 */
export class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const payload = {
      source: entry.source,
      message: entry.message,
      context: entry.context,
      error: entry.error,
      timestamp: entry.timestamp.toISOString()
    };

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug('[TRACE]', payload);
        break;
      case LogLevel.INFO:
        console.info('[INFO]', payload);
        break;
      case LogLevel.WARN:
        console.warn('[WARN]', payload);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error('[ERROR]', payload);
        break;
      default:
        console.log(payload);
    }
  }
}
