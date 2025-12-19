# Firebase Functions - Enterprise Standards Documentation

Complete documentation for enterprise-standard Firebase Cloud Functions implementation in GigHub.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [API Reference](#api-reference)
5. [Best Practices](#best-practices)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)

## Overview

This implementation follows enterprise standards based on:
- Firebase Functions v7.0.0 (v2 API)
- Firebase Admin SDK v13.6.0
- TypeScript 5.7.3
- Node.js 22
- Context7 documentation queries

### Key Features

- ✅ Modern v2 API with improved performance
- ✅ Type-safe with comprehensive TypeScript interfaces
- ✅ Structured logging with context
- ✅ Comprehensive error handling
- ✅ Automated audit trails
- ✅ Input validation
- ✅ Authentication checks
- ✅ Pagination support
- ✅ Soft delete capability
- ✅ Performance optimizations

## Architecture

### Three-Layer Structure

```
Client (Angular App)
    ↓
Callable Functions (HTTPS)
    ↓
Firestore Triggers (Events)
    ↓
Firestore Database
```

### Module Organization

```
functions-shared/          # Shared utilities
├── types/
│   └── common.types.ts   # Common interfaces
├── utils/
│   ├── logger.util.ts    # Structured logging
│   └── error.util.ts     # Error handling
└── config/
    └── firebase.config.ts # Firebase initialization

functions-firestore/       # Firestore operations
├── triggers/
│   └── task.triggers.ts  # Document triggers
├── callable/
│   └── task.callable.ts  # HTTPS callable functions
├── types/
│   └── documents.types.ts # Document interfaces
└── utils/
    └── firestore.util.ts # Firestore utilities
```

## Implementation Details

### Context7 Query Results

Based on Context7 documentation queries, the implementation uses:

1. **Firestore Triggers (v2)**
   - `onDocumentCreated` - New document events
   - `onDocumentUpdated` - Document modification events
   - `onDocumentDeleted` - Document deletion events
   - `onDocumentWritten` - Any write operation

2. **HTTPS Callable Functions**
   - Type-safe request/response
   - Automatic authentication
   - Built-in error handling
   - CORS support

3. **Firebase Admin SDK**
   - `initializeApp()` - Initialize once
   - `getFirestore()` - Get Firestore instance
   - Type-safe with `@google-cloud/firestore` types
   - Server-side operations with elevated privileges

### Type Safety

All functions use strict TypeScript typing:

```typescript
// Document interface
export interface Task extends BaseDocument {
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
}

// Request interface
interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Response interface
interface CreateTaskResponse {
  success: boolean;
  taskId: string;
  message: string;
}
```

### Error Handling

Structured error handling with error codes:

```typescript
export enum ErrorCode {
  INVALID_ARGUMENT = 'invalid-argument',
  UNAUTHENTICATED = 'unauthenticated',
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  INTERNAL = 'internal',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
  
  toHttpsError(): https.HttpsError {
    return new https.HttpsError(this.code as any, this.message, this.details);
  }
}
```

### Logging

Structured logging with context:

```typescript
const logger = createLogger({ module: 'task-triggers' });

logger.info('Task created', {
  taskId,
  title: taskData.title,
  status: taskData.status,
  createdBy: taskData.createdBy,
});

logger.error('Failed to process task', error, { taskId });
```

### Audit Trails

Automatic audit log creation:

```typescript
await db().collection('audit_logs').add({
  userId: taskData.createdBy || 'system',
  action: 'task.created',
  resourceType: 'task',
  resourceId: taskId,
  newValue: taskData,
  timestamp: serverTimestamp(),
  metadata: {
    taskTitle: taskData.title,
    taskStatus: taskData.status,
  },
});
```

## API Reference

### Callable Functions

#### createTask

Creates a new task with validation.

**Request:**
```typescript
{
  title: string;           // Required, 3-200 characters
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;        // ISO date string
  tags?: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  taskId: string;
  message: string;
}
```

**Errors:**
- `invalid-argument` - Invalid input
- `unauthenticated` - Not authenticated

#### updateTask

Updates an existing task.

**Request:**
```typescript
{
  taskId: string;          // Required
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  taskId: string;
  message: string;
}
```

**Errors:**
- `invalid-argument` - Invalid input
- `unauthenticated` - Not authenticated
- `not-found` - Task not found

#### deleteTask

Deletes a task (soft or hard delete).

**Request:**
```typescript
{
  taskId: string;          // Required
  hardDelete?: boolean;    // Default: false
}
```

**Response:**
```typescript
{
  success: boolean;
  taskId: string;
  message: string;
}
```

#### getTask

Retrieves a single task by ID.

**Request:**
```typescript
{
  taskId: string;          // Required
}
```

**Response:**
```typescript
{
  success: boolean;
  task: Task;
}
```

#### listTasks

Lists tasks with filtering and pagination.

**Request:**
```typescript
{
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  assignedTo?: string;
  limit?: number;          // Default: 20, Max: 100
  startAfter?: string;     // Task ID for pagination
}
```

**Response:**
```typescript
{
  success: boolean;
  tasks: Task[];
  hasMore: boolean;
  nextCursor?: string;
}
```

## Best Practices

### 1. Use v2 API

```typescript
// ✅ Good - v2 API
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';

// ❌ Bad - v1 API
import * as functions from 'firebase-functions';
```

### 2. Type Safety

```typescript
// ✅ Good - Type-safe
interface CreateTaskData {
  title: string;
  priority?: 'low' | 'medium' | 'high';
}

export const createTask = onCall<CreateTaskData>({...}, async (request) => {
  const { title, priority } = request.data; // Type-safe
});

// ❌ Bad - No types
export const createTask = onCall(async (request) => {
  const title = request.data.title; // any type
});
```

### 3. Error Handling

```typescript
// ✅ Good - Structured error handling
try {
  validateRequired(request.data, ['title']);
  await performOperation();
} catch (error) {
  if (error instanceof AppError) {
    throw error.toHttpsError();
  }
  logger.error('Unexpected error', error);
  throw new HttpsError('internal', 'Operation failed');
}

// ❌ Bad - Generic error handling
try {
  await performOperation();
} catch (error) {
  throw error; // No context or structure
}
```

### 4. Logging

```typescript
// ✅ Good - Structured logging with context
const logger = createLogger({ module: 'task-operations' });
logger.info('Task created', { taskId, title, userId });

// ❌ Bad - Console logging
console.log('Task created:', taskId);
```

### 5. Authentication

```typescript
// ✅ Good - Check authentication
if (!request.auth) {
  throw new HttpsError('unauthenticated', 'User must be authenticated');
}
const userId = request.auth.uid;

// ❌ Bad - No authentication check
const userId = request.auth?.uid; // May be undefined
```

### 6. Input Validation

```typescript
// ✅ Good - Validate inputs
validateRequired(request.data, ['title', 'status']);
if (title.length < 3 || title.length > 200) {
  throw new AppError(ErrorCode.INVALID_ARGUMENT, 'Invalid title length');
}

// ❌ Bad - No validation
const title = request.data.title; // May be invalid
```

### 7. Soft Delete

```typescript
// ✅ Good - Soft delete by default
await taskRef.update({
  deleted: true,
  deletedAt: serverTimestamp(),
});

// ❌ Bad - Hard delete without option
await taskRef.delete();
```

### 8. Pagination

```typescript
// ✅ Good - Implement pagination
let query = db().collection('tasks')
  .orderBy('createdAt', 'desc')
  .limit(20);

if (startAfter) {
  query = query.startAfter(startAfterDoc);
}

// ❌ Bad - Fetch all documents
const allTasks = await db().collection('tasks').get();
```

## Testing

### Local Testing

```bash
# Start emulators
firebase emulators:start

# In another terminal
cd functions-firestore
npm run build

# Test with Angular app
ng serve
```

### Testing Triggers

```typescript
// Triggers fire automatically
await db.collection('tasks').add({
  title: 'Test Task',
  status: 'pending',
});
// onTaskCreated will fire
```

### Testing Callable Functions

```typescript
import { connectFunctionsEmulator } from '@angular/fire/functions';

const functions = getFunctions();
connectFunctionsEmulator(functions, 'localhost', 5001);

const createTask = httpsCallable(functions, 'createTask');
await createTask({ title: 'Test Task' });
```

## Deployment

### Build

```bash
cd functions-firestore
npm run build
```

### Deploy All Functions

```bash
firebase deploy --only functions:firestore
```

### Deploy Specific Function

```bash
firebase deploy --only functions:firestore:createTask
```

### Deploy Multiple Codebases

```bash
firebase deploy --only functions:firestore,functions:shared
```

## Monitoring

### View Logs

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only createTask

# With limit
firebase functions:log --limit 100
```

### Cloud Console

Monitor in Firebase Console:
- Function executions
- Error rates
- Execution times
- Memory usage
- Network egress

### Alerts

Set up alerts for:
- High error rates
- Slow execution times
- Memory exhaustion
- Timeout errors

## Performance Optimization

### Global Options

```typescript
setGlobalOptions({
  region: 'us-central1',    // Deploy close to users
  maxInstances: 10,          // Limit concurrent executions
  timeoutSeconds: 60,        // Function timeout
  memory: '256MiB',          // Memory allocation
});
```

### Function-Specific Options

```typescript
export const onTaskCreated = onDocumentCreated({
  document: 'tasks/{taskId}',
  region: 'us-central1',
  memory: '512MiB',          // More memory for this function
  timeoutSeconds: 120,       // Longer timeout
}, async (event) => {
  // ...
});
```

### Cold Start Optimization

- Minimize dependencies
- Use lazy loading
- Keep functions focused and small
- Use global variables for reusable resources

## Security

### Authentication

All callable functions check authentication:

```typescript
if (!request.auth) {
  throw new HttpsError('unauthenticated', 'User must be authenticated');
}
```

### Input Validation

All inputs are validated:

```typescript
validateRequired(request.data, ['title']);
if (title.length < 3 || title.length > 200) {
  throw new AppError(ErrorCode.INVALID_ARGUMENT, 'Invalid title length');
}
```

### App Check (Production)

```typescript
export const createTask = onCall({
  region: 'us-central1',
  enforceAppCheck: true,  // Require valid App Check token
}, async (request) => {
  // ...
});
```

### Firestore Security Rules

```javascript
match /tasks/{taskId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == request.resource.data.createdBy;
}
```

## Troubleshooting

### Function Not Found

**Error:** `Function not found: createTask`

**Solutions:**
1. Verify function is deployed: `firebase functions:list`
2. Check function name in code matches call
3. Redeploy: `firebase deploy --only functions:firestore`

### Permission Denied

**Error:** `permission-denied`

**Solutions:**
1. Verify user is authenticated
2. Check Firestore security rules
3. Verify user has required permissions

### Timeout

**Error:** `deadline-exceeded`

**Solutions:**
1. Optimize function logic
2. Increase timeout: `timeoutSeconds: 120`
3. Break into smaller operations
4. Use background functions for long operations

### Memory Issues

**Error:** `out-of-memory`

**Solutions:**
1. Increase memory: `memory: '512MiB'`
2. Optimize memory usage
3. Use streaming for large data
4. Implement pagination

## References

- [Firebase Functions v2](https://firebase.google.com/docs/functions/beta)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Context7 Query Results](../docs/context7-queries.md)

---

**Last Updated:** 2024-12-18  
**Version:** 1.0.0  
**Author:** GigHub Development Team
