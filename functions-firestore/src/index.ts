/**
 * Firebase Cloud Functions - Firestore Operations
 * Enterprise-standard implementation with v2 API
 *
 * This module provides:
 * - Firestore document triggers (onCreate, onUpdate, onDelete, onWrite)
 * - HTTPS callable functions for client applications
 * - Type-safe interfaces and comprehensive error handling
 * - Structured logging and audit trails
 * - Best practices from Firebase Functions v7.0.0
 *
 * @see https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options for all functions in this codebase
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB'
});

// ============================================================================
// Firestore Triggers
// ============================================================================
// Document lifecycle triggers for automated operations

export { onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskWritten } from './triggers/task.triggers';

// ============================================================================
// Callable Functions
// ============================================================================
// HTTPS callable functions for client applications with authentication

export { createTask, updateTask, deleteTask, getTask, listTasks } from './callable/task.callable';

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Firestore Triggers Usage:
 *
 * These triggers automatically execute when documents change:
 * - onTaskCreated: Fires when a new task is added
 * - onTaskUpdated: Fires when a task is modified
 * - onTaskDeleted: Fires when a task is removed
 * - onTaskWritten: Fires on any write operation
 *
 * No client code needed - triggers run automatically
 */

/**
 * Callable Functions Usage (from Angular):
 *
 * ```typescript
 * import { getFunctions, httpsCallable } from '@angular/fire/functions';
 *
 * const functions = getFunctions();
 *
 * // Create a task
 * const createTask = httpsCallable<CreateTaskData, TaskResponse>(functions, 'createTask');
 * const result = await createTask({
 *   title: 'New Task',
 *   description: 'Task description',
 *   priority: 'high'
 * });
 *
 * // List tasks
 * const listTasks = httpsCallable<ListTasksData, TaskListResponse>(functions, 'listTasks');
 * const tasks = await listTasks({
 *   status: 'pending',
 *   limit: 20
 * });
 * ```
 */
