# Firebase Cloud Functions - Firestore Operations

Enterprise-standard implementation of Firebase Cloud Functions v2 for Firestore operations in the GigHub construction site progress tracking system.

## Overview

This module provides production-ready Firebase Cloud Functions with:

- ✅ **Modern v2 API** - Uses `firebase-functions/v2` for improved performance
- ✅ **Type Safety** - Full TypeScript support with strict typing
- ✅ **Error Handling** - Comprehensive error handling with structured logging
- ✅ **Audit Trails** - Automatic audit log creation for all operations
- ✅ **Security** - Authentication checks and input validation
- ✅ **Best Practices** - Follows Firebase and enterprise development standards

## Architecture

### Directory Structure

```
functions-firestore/
├── src/
│   ├── triggers/          # Firestore document triggers
│   │   └── task.triggers.ts
│   ├── callable/          # HTTPS callable functions
│   │   └── task.callable.ts
│   ├── types/             # TypeScript interfaces
│   │   └── documents.types.ts
│   ├── utils/             # Utility functions
│   │   └── firestore.util.ts
│   └── index.ts           # Main export file
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

### Installation

```bash
cd functions-firestore
npm install
```

### Build

```bash
npm run build
```

### Local Development

```bash
firebase emulators:start
```

### Deploy

```bash
firebase deploy --only functions:firestore
```

## Functions Reference

### Firestore Triggers

- `onTaskCreated` - Fires when a new task is created
- `onTaskUpdated` - Fires when a task is modified
- `onTaskDeleted` - Fires when a task is deleted
- `onTaskWritten` - Fires on any write operation

### Callable Functions

- `createTask` - Create a new task
- `updateTask` - Update an existing task
- `deleteTask` - Delete a task (soft or hard)
- `getTask` - Get a task by ID
- `listTasks` - List tasks with filtering and pagination

## Usage Examples

### Angular Client

```typescript
import { getFunctions, httpsCallable } from '@angular/fire/functions';

const functions = getFunctions();

// Create a task
const createTask = httpsCallable(functions, 'createTask');
const result = await createTask({
  title: 'New Task',
  priority: 'high',
});

// List tasks
const listTasks = httpsCallable(functions, 'listTasks');
const tasks = await listTasks({
  status: 'pending',
  limit: 20,
});
```

## Documentation

See [full documentation](./README.md) for:
- Detailed API reference
- Error handling
- Testing guide
- Deployment instructions
- Security best practices
- Troubleshooting

## Version

- **Firebase Functions**: v7.0.0
- **Firebase Admin**: v13.6.0
- **Node.js**: 22
- **TypeScript**: 5.7.3
