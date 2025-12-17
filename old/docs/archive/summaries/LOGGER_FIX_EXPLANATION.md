# Logger Service Fix - Error Field Population

## Problem Statement

When the FirebaseService failed to initialize, the console log showed:
```
console-transport.ts:30  [ERROR] {
  source: '[FirebaseService]',
  message: 'Failed to initialize client',
  context: {...},
  error: undefined,  // ❌ This should contain error details!
  timestamp: '2025-12-12T11:11:38.071Z'
}
```

The `error` field was `undefined` even though an Error object was passed to the logger.

## Root Cause

In `src/app/core/services/logger/logger.service.ts`, the `error()` method was placing error details inside the `context` object instead of populating the dedicated `error` field of the `LogEntry` interface.

### Before (Broken Code)

```typescript
error(source: string, message: string, error?: Error, context?: Record<string, unknown>): void {
  this.log(LogLevel.ERROR, source, message, {
    ...context,
    error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined
    //    ^ Error details added to context, not to LogEntry.error field
  });
}

private log(level: LogLevel, source: string, message: string, context?: Record<string, unknown>): void {
  if (level < this.logLevel) return;

  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    source,
    message,
    context  // Contains error details buried inside
    // error field is missing! This causes console-transport to log `error: undefined`
  };

  this.transports.forEach(transport => transport.log(entry));
}
```

### After (Fixed Code)

```typescript
error(source: string, message: string, error?: Error, context?: Record<string, unknown>): void {
  this.log(
    LogLevel.ERROR,
    source,
    message,
    context,
    error ? { name: error.name, message: error.message, stack: error.stack } : undefined
    //    ^ Error details passed as separate parameter
  );
}

private log(
  level: LogLevel,
  source: string,
  message: string,
  context?: Record<string, unknown>,
  error?: { name: string; message: string; stack?: string }  // ✅ New parameter
): void {
  if (level < this.logLevel) return;

  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    source,
    message,
    context,
    error  // ✅ Now properly populated
  };

  this.transports.forEach(transport => transport.log(entry));
}
```

## Expected Output After Fix

When the FirebaseService fails to initialize, the console log should now show:

```javascript
console-transport.ts:30  [ERROR] {
  source: '[FirebaseService]',
  message: 'Failed to initialize client',
  context: {...},
  error: {  // ✅ Now properly populated!
    name: 'Error',
    message: 'Firebase configuration missing. Please set NG_PUBLIC_FIREBASE_URL and NG_PUBLIC_FIREBASE_ANON_KEY in environment variables.',
    stack: 'Error: Firebase configuration missing...\n    at FirebaseService.initializeClient (firebase.service.ts:63:15)\n    ...'
  },
  timestamp: '2025-12-12T11:11:38.071Z'
}
```

## Impact

This fix ensures that:

1. **Error details are visible**: Developers can now see the actual error message, name, and stack trace in console logs
2. **Debugging is easier**: Stack traces help identify exactly where errors occurred
3. **LogEntry interface is properly used**: The `error` field of the interface is now correctly populated
4. **All transports work correctly**: Any transport (console, file, remote) will now receive complete error information

## Test Coverage

A comprehensive test suite has been added in `logger.service.spec.ts` that verifies:

- ✅ Error field is populated when Error object is provided
- ✅ Error field is undefined when no Error object is provided
- ✅ Context is preserved separately from error details
- ✅ Custom Error subclasses are handled correctly
- ✅ All log levels (info, warn, error) work as expected
- ✅ Log level filtering continues to work

## Files Changed

1. `src/app/core/services/logger/logger.service.ts` - Fixed error field population
2. `src/app/core/services/logger/logger.service.spec.ts` - Added comprehensive test coverage (NEW)

## How to Verify

1. Run the application: `yarn start`
2. Open browser console
3. Look for `[ERROR]` logs from `[FirebaseService]`
4. Verify that the `error` field now contains proper error details instead of `undefined`

Alternatively, run the test suite:
```bash
yarn test --include='**/logger.service.spec.ts' --watch=false
```
