/**
 * Task document triggers
 * Enterprise-standard Firestore triggers for task management
 */

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';

import { initializeFirebaseAdmin, db, serverTimestamp } from '../../../functions-shared/src/config/firebase.config';
import { createLogger } from '../../../functions-shared/src/utils/logger.util';
import { Task } from '../types/documents.types';
import { getDocumentData } from '../utils/firestore.util';

// Initialize Firebase Admin
initializeFirebaseAdmin();

const logger = createLogger({ module: 'task-triggers' });

/**
 * Trigger when a task is created
 * Creates audit log and sends notifications
 */
export const onTaskCreated = onDocumentCreated(
  {
    document: 'tasks/{taskId}',
    region: 'us-central1'
  },
  async event => {
    const startTime = Date.now();
    const taskId = event.params.taskId;

    if (!event.data) {
      logger.warn('Event data is undefined', { taskId });
      return;
    }

    const taskData = getDocumentData<Task>(event.data);

    if (!taskData) {
      logger.warn('Task document does not exist', { taskId });
      return;
    }

    logger.info('Task created', {
      taskId,
      title: taskData.title,
      status: taskData.status,
      createdBy: taskData.createdBy
    });

    try {
      // Create audit log
      await db()
        .collection('audit_logs')
        .add({
          userId: taskData.createdBy || 'system',
          action: 'task.created',
          resourceType: 'task',
          resourceId: taskId,
          newValue: taskData,
          timestamp: serverTimestamp(),
          metadata: {
            taskTitle: taskData.title,
            taskStatus: taskData.status
          }
        });

      // Update task counter
      const counterRef = db().collection('counters').doc('tasks');
      await counterRef.set(
        {
          total: require('firebase-admin').firestore.FieldValue.increment(1),
          pending: taskData.status === 'pending' ? require('firebase-admin').firestore.FieldValue.increment(1) : 0,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      logger.logExecutionTime('onTaskCreated', startTime);
    } catch (error) {
      logger.error('Failed to process task creation', error, { taskId });
      throw error;
    }
  }
);

/**
 * Trigger when a task is updated
 * Tracks changes and updates related documents
 */
export const onTaskUpdated = onDocumentUpdated(
  {
    document: 'tasks/{taskId}',
    region: 'us-central1'
  },
  async event => {
    const startTime = Date.now();
    const taskId = event.params.taskId;

    if (!event.data) {
      logger.warn('Event data is undefined', { taskId });
      return;
    }

    const beforeData = getDocumentData<Task>(event.data.before);
    const afterData = getDocumentData<Task>(event.data.after);

    if (!beforeData || !afterData) {
      logger.warn('Task document missing', { taskId });
      return;
    }

    logger.info('Task updated', {
      taskId,
      title: afterData.title,
      oldStatus: beforeData.status,
      newStatus: afterData.status
    });

    try {
      // Track status changes
      if (beforeData.status !== afterData.status) {
        logger.info('Task status changed', {
          taskId,
          from: beforeData.status,
          to: afterData.status
        });

        // Create status change audit log
        await db()
          .collection('audit_logs')
          .add({
            userId: afterData.updatedBy || 'system',
            action: 'task.status_changed',
            resourceType: 'task',
            resourceId: taskId,
            oldValue: { status: beforeData.status },
            newValue: { status: afterData.status },
            timestamp: serverTimestamp(),
            metadata: {
              taskTitle: afterData.title
            }
          });

        // Update status counters
        const counterRef = db().collection('counters').doc('tasks');
        const updates: any = {};

        // Decrement old status
        if (beforeData.status) {
          updates[beforeData.status] = require('firebase-admin').firestore.FieldValue.increment(-1);
        }

        // Increment new status
        if (afterData.status) {
          updates[afterData.status] = require('firebase-admin').firestore.FieldValue.increment(1);
        }

        updates.updatedAt = serverTimestamp();
        await counterRef.set(updates, { merge: true });
      }

      // Track assignment changes
      if (beforeData.assignedTo !== afterData.assignedTo) {
        logger.info('Task assignment changed', {
          taskId,
          from: beforeData.assignedTo,
          to: afterData.assignedTo
        });

        // Create assignment audit log
        await db()
          .collection('audit_logs')
          .add({
            userId: afterData.updatedBy || 'system',
            action: 'task.assigned',
            resourceType: 'task',
            resourceId: taskId,
            oldValue: { assignedTo: beforeData.assignedTo },
            newValue: { assignedTo: afterData.assignedTo },
            timestamp: serverTimestamp()
          });
      }

      logger.logExecutionTime('onTaskUpdated', startTime);
    } catch (error) {
      logger.error('Failed to process task update', error, { taskId });
      throw error;
    }
  }
);

/**
 * Trigger when a task is deleted
 * Cleans up related documents and updates counters
 */
export const onTaskDeleted = onDocumentDeleted(
  {
    document: 'tasks/{taskId}',
    region: 'us-central1'
  },
  async event => {
    const startTime = Date.now();
    const taskId = event.params.taskId;

    if (!event.data) {
      logger.warn('Event data is undefined', { taskId });
      return;
    }

    const taskData = getDocumentData<Task>(event.data);

    if (!taskData) {
      logger.warn('Cannot retrieve deleted task data', { taskId });
      return;
    }

    logger.info('Task deleted', {
      taskId,
      title: taskData.title,
      status: taskData.status
    });

    try {
      // Create deletion audit log
      await db()
        .collection('audit_logs')
        .add({
          userId: 'system', // Cannot determine user from delete event
          action: 'task.deleted',
          resourceType: 'task',
          resourceId: taskId,
          oldValue: taskData,
          timestamp: serverTimestamp(),
          metadata: {
            taskTitle: taskData.title,
            taskStatus: taskData.status
          }
        });

      // Update task counter
      const counterRef = db().collection('counters').doc('tasks');
      const updates: any = {
        total: require('firebase-admin').firestore.FieldValue.increment(-1),
        updatedAt: serverTimestamp()
      };

      if (taskData.status) {
        updates[taskData.status] = require('firebase-admin').firestore.FieldValue.increment(-1);
      }

      await counterRef.set(updates, { merge: true });

      logger.logExecutionTime('onTaskDeleted', startTime);
    } catch (error) {
      logger.error('Failed to process task deletion', error, { taskId });
      throw error;
    }
  }
);

/**
 * Trigger on any task document write
 * Useful for general operations like last modified tracking
 */
export const onTaskWritten = onDocumentWritten(
  {
    document: 'tasks/{taskId}',
    region: 'us-central1'
  },
  async event => {
    const taskId = event.params.taskId;

    if (!event.data) {
      logger.warn('Event data is undefined', { taskId });
      return;
    }

    const beforeData = event.data.before?.data();
    const afterData = event.data.after?.data();

    const operation = !beforeData ? 'created' : !afterData ? 'deleted' : 'updated';

    logger.debug('Task document written', {
      taskId,
      operation,
      hasData: !!afterData
    });

    // Update last activity timestamp
    if (afterData) {
      const activityRef = db().collection('activity').doc('tasks');
      await activityRef.set(
        {
          lastModified: serverTimestamp(),
          lastModifiedTaskId: taskId,
          lastOperation: operation
        },
        { merge: true }
      );
    }
  }
);
