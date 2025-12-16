import { TestBed } from '@angular/core/testing';

import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleErrorSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService]
    });
    service = TestBed.inject(LoggerService);

    // Spy on console methods
    consoleErrorSpy = spyOn(console, 'error');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleInfoSpy = spyOn(console, 'info');
    consoleLogSpy = spyOn(console, 'log');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('error logging', () => {
    it('should log error with Error object and populate error field', () => {
      const testError = new Error('Test error message');
      testError.stack = 'Error: Test error message\n    at testFunction (file.ts:10:5)';

      service.error('[TestSource]', 'Failed to initialize client', testError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleErrorSpy.calls.mostRecent().args[1];

      // Verify the error field is populated (not undefined)
      expect(loggedPayload.error).toBeDefined();
      expect(loggedPayload.error.name).toBe('Error');
      expect(loggedPayload.error.message).toBe('Test error message');
      expect(loggedPayload.error.stack).toContain('testFunction');

      // Verify other fields
      expect(loggedPayload.source).toBe('[TestSource]');
      expect(loggedPayload.message).toBe('Failed to initialize client');
      expect(loggedPayload.timestamp).toBeDefined();
    });

    it('should log error without Error object', () => {
      service.error('[TestSource]', 'Error without Error object');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleErrorSpy.calls.mostRecent().args[1];

      // Error field should be undefined when no Error object provided
      expect(loggedPayload.error).toBeUndefined();
      expect(loggedPayload.source).toBe('[TestSource]');
      expect(loggedPayload.message).toBe('Error without Error object');
    });

    it('should log error with Error object and context', () => {
      const testError = new Error('Context error');
      const context = { userId: 123, action: 'test' };

      service.error('[TestSource]', 'Error with context', testError, context);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleErrorSpy.calls.mostRecent().args[1];

      // Verify error field is populated
      expect(loggedPayload.error).toBeDefined();
      expect(loggedPayload.error.name).toBe('Error');
      expect(loggedPayload.error.message).toBe('Context error');

      // Verify context is preserved
      expect(loggedPayload.context).toBeDefined();
      expect(loggedPayload.context.userId).toBe(123);
      expect(loggedPayload.context.action).toBe('test');
    });

    it('should handle complex Error objects with custom properties', () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('Custom error message', 'ERR_CUSTOM');

      service.error('[TestSource]', 'Custom error occurred', customError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleErrorSpy.calls.mostRecent().args[1];

      expect(loggedPayload.error).toBeDefined();
      expect(loggedPayload.error.name).toBe('CustomError');
      expect(loggedPayload.error.message).toBe('Custom error message');
    });
  });

  describe('other log levels', () => {
    it('should log info messages', () => {
      service.info('[TestSource]', 'Info message', { key: 'value' });

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleInfoSpy.calls.mostRecent().args[1];
      expect(loggedPayload.source).toBe('[TestSource]');
      expect(loggedPayload.message).toBe('Info message');
      expect(loggedPayload.context).toEqual({ key: 'value' });
      expect(loggedPayload.error).toBeUndefined();
    });

    it('should log warn messages', () => {
      service.warn('[TestSource]', 'Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      const loggedPayload = consoleWarnSpy.calls.mostRecent().args[1];
      expect(loggedPayload.source).toBe('[TestSource]');
      expect(loggedPayload.message).toBe('Warning message');
    });
  });

  describe('log level filtering', () => {
    it('should not log messages below the set log level', () => {
      service.setLevel(LogLevel.ERROR);

      service.info('[TestSource]', 'This should not be logged');
      service.warn('[TestSource]', 'This should not be logged');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      service.error('[TestSource]', 'This should be logged');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
