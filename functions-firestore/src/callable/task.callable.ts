/**
 * Task management callable functions
 * Enterprise-standard HTTPS callable functions for client applications
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { initializeFirebaseAdmin, db, serverTimestamp } from '../../../functions-shared/src/config/firebase.config';
import { AppError, ErrorCode, validateRequired } from '../../../functions-shared/src/utils/error.util';
import { createLogger } from '../../../functions-shared/src/utils/logger.util';
import { Task } from '../types/documents.types';
import { getDocumentData, validateDocumentExists } from '../utils/firestore.util';

// Initialize Firebase Admin
initializeFirebaseAdmin();

const logger = createLogger({ module: 'task-callable' });

/**
 * Create a new task
 */
export const createTask = onCall<{
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
}>(
  {
    region: 'us-central1',
    enforceAppCheck: false // Set to true in production
  },
  async request => {
    const startTime = Date.now();

    // Authentication check
    if (!request.auth) {
      logger.warn('Unauthenticated request to createTask');
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { title, description, priority = 'medium', assignedTo, dueDate, tags } = request.data;

    logger.info('Creating task', { userId, title, priority });

    try {
      // Validate required fields
      validateRequired(request.data, ['title']);

      // Validate title length
      if (title.length < 3 || title.length > 200) {
        throw new AppError(ErrorCode.INVALID_ARGUMENT, 'Title must be between 3 and 200 characters', { titleLength: title.length });
      }

      // Create task document
      const taskData: Omit<Task, 'id'> = {
        title,
        description: description || '',
        status: 'pending',
        priority,
        assignedTo,
        dueDate,
        tags: tags || [],
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        createdBy: userId,
        updatedBy: userId,
        deleted: false,
        metadata: {
          createdVia: 'callable-function'
        }
      };

      const taskRef = await db().collection('tasks').add(taskData);

      logger.info('Task created successfully', { taskId: taskRef.id, userId });
      logger.logExecutionTime('createTask', startTime);

      return {
        success: true,
        taskId: taskRef.id,
        message: 'Task created successfully'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error.toHttpsError();
      }

      logger.error('Failed to create task', error, { userId });
      throw new HttpsError('internal', 'Failed to create task');
    }
  }
);

/**
 * Update an existing task
 */
export const updateTask = onCall<{
  taskId: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
}>(
  {
    region: 'us-central1',
    enforceAppCheck: false
  },
  async request => {
    const startTime = Date.now();

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { taskId, ...updates } = request.data;

    logger.info('Updating task', { userId, taskId, updates });

    try {
      // Validate required fields
      validateRequired(request.data, ['taskId']);

      // Validate task exists
      await validateDocumentExists(db(), 'tasks', taskId);

      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      };

      // Validate title if provided
      if (updates.title && (updates.title.length < 3 || updates.title.length > 200)) {
        throw new AppError(ErrorCode.INVALID_ARGUMENT, 'Title must be between 3 and 200 characters', { titleLength: updates.title.length });
      }

      // Update task
      await db().collection('tasks').doc(taskId).update(updateData);

      logger.info('Task updated successfully', { taskId, userId });
      logger.logExecutionTime('updateTask', startTime);

      return {
        success: true,
        taskId,
        message: 'Task updated successfully'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error.toHttpsError();
      }

      logger.error('Failed to update task', error, { userId, taskId });
      throw new HttpsError('internal', 'Failed to update task');
    }
  }
);

/**
 * Delete a task (soft delete)
 */
export const deleteTask = onCall<{
  taskId: string;
  hardDelete?: boolean;
}>(
  {
    region: 'us-central1',
    enforceAppCheck: false
  },
  async request => {
    const startTime = Date.now();

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { taskId, hardDelete = false } = request.data;

    logger.info('Deleting task', { userId, taskId, hardDelete });

    try {
      // Validate required fields
      validateRequired(request.data, ['taskId']);

      // Validate task exists
      await validateDocumentExists(db(), 'tasks', taskId);

      const taskRef = db().collection('tasks').doc(taskId);

      if (hardDelete) {
        // Hard delete - remove document
        await taskRef.delete();
        logger.info('Task hard deleted', { taskId, userId });
      } else {
        // Soft delete - mark as deleted
        await taskRef.update({
          deleted: true,
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: userId
        });
        logger.info('Task soft deleted', { taskId, userId });
      }

      logger.logExecutionTime('deleteTask', startTime);

      return {
        success: true,
        taskId,
        message: hardDelete ? 'Task permanently deleted' : 'Task deleted successfully'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error.toHttpsError();
      }

      logger.error('Failed to delete task', error, { userId, taskId });
      throw new HttpsError('internal', 'Failed to delete task');
    }
  }
);

/**
 * Get task by ID
 */
export const getTask = onCall<{
  taskId: string;
}>(
  {
    region: 'us-central1',
    enforceAppCheck: false
  },
  async request => {
    const startTime = Date.now();

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { taskId } = request.data;

    logger.info('Getting task', { userId, taskId });

    try {
      // Validate required fields
      validateRequired(request.data, ['taskId']);

      // Get task
      const taskDoc = await db().collection('tasks').doc(taskId).get();
      const taskData = getDocumentData<Task>(taskDoc);

      if (!taskData) {
        throw new AppError(ErrorCode.NOT_FOUND, `Task not found: ${taskId}`);
      }

      // Check if deleted
      if (taskData.deleted) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Task has been deleted');
      }

      logger.info('Task retrieved successfully', { taskId, userId });
      logger.logExecutionTime('getTask', startTime);

      return {
        success: true,
        task: taskData
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error.toHttpsError();
      }

      logger.error('Failed to get task', error, { userId, taskId });
      throw new HttpsError('internal', 'Failed to get task');
    }
  }
);

/**
 * List tasks with filtering and pagination
 */
export const listTasks = onCall<{
  status?: 'pending' | 'in-progress' | 'completed' | 'archived';
  assignedTo?: string;
  limit?: number;
  startAfter?: string;
}>(
  {
    region: 'us-central1',
    enforceAppCheck: false
  },
  async request => {
    const startTime = Date.now();

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { status, assignedTo, limit = 20, startAfter } = request.data;

    logger.info('Listing tasks', { userId, status, assignedTo, limit });

    try {
      let query = db().collection('tasks').where('deleted', '==', false).orderBy('createdAt', 'desc').limit(Math.min(limit, 100)); // Max 100 items per request

      // Apply filters
      if (status) {
        query = query.where('status', '==', status) as any;
      }

      if (assignedTo) {
        query = query.where('assignedTo', '==', assignedTo) as any;
      }

      // Apply pagination
      if (startAfter) {
        const startAfterDoc = await db().collection('tasks').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc) as any;
        }
      }

      const snapshot = await query.get();
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      logger.info('Tasks retrieved successfully', {
        userId,
        count: tasks.length,
        hasMore: tasks.length === limit
      });
      logger.logExecutionTime('listTasks', startTime);

      return {
        success: true,
        tasks,
        hasMore: tasks.length === limit,
        nextCursor: tasks.length > 0 ? tasks[tasks.length - 1].id : undefined
      };
    } catch (error) {
      logger.error('Failed to list tasks', error, { userId });
      throw new HttpsError('internal', 'Failed to list tasks');
    }
  }
);
