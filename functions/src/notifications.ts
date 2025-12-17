/**
 * Notification Triggers Cloud Functions
 *
 * Handles automated push notifications for various events:
 * - Task status changes
 * - Friend requests and acceptances
 * - Log updates
 * - Quality inspections
 *
 * @architecture
 * - Triggers on Firestore document changes
 * - Fetches FCM tokens from fcm_tokens collection
 * - Sends push notifications via Firebase Cloud Messaging
 * - Creates notification documents in notifications collection
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Helper: Get user's FCM token
 */
async function getUserFcmToken(userId: string): Promise<string | null> {
  try {
    const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();

    if (!tokenDoc.exists) {
      logger.warn(`No FCM token found for user: ${userId}`);
      return null;
    }

    const data = tokenDoc.data();
    if (!data?.active) {
      logger.warn(`Inactive FCM token for user: ${userId}`);
      return null;
    }

    return data.token || null;
  } catch (error) {
    logger.error('Error fetching FCM token:', error);
    return null;
  }
}

/**
 * Helper: Send push notification
 */
async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token
    };

    await messaging.send(message);
    logger.info(`Push notification sent: ${title}`);
    return true;
  } catch (error: unknown) {
    logger.error('Error sending push notification:', error);

    // Handle invalid token
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid token, marking as inactive: ${token}`);
      // Token is invalid, we should mark it as inactive
      // But we don't have userId here, so we'll let it fail silently
    }

    return false;
  }
}

/**
 * Helper: Create notification document
 */
async function createNotificationDocument(
  userId: string,
  type: '通知' | '消息' | '待辦',
  title: string,
  description: string,
  link?: string,
  extra?: string
): Promise<void> {
  try {
    await db.collection('notifications').add({
      userId,
      type,
      title,
      description,
      link,
      extra,
      read: false,
      datetime: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Notification document created for user: ${userId}`);
  } catch (error) {
    logger.error('Error creating notification document:', error);
  }
}

/**
 * Send notification to user
 */
async function notifyUser(
  userId: string,
  type: '通知' | '消息' | '待辦',
  title: string,
  description: string,
  link?: string,
  extra?: string
): Promise<void> {
  // Create notification document
  await createNotificationDocument(userId, type, title, description, link, extra);

  // Send push notification
  const token = await getUserFcmToken(userId);
  if (token) {
    await sendPushNotification(token, title, description, {
      type,
      link: link || '/',
      saveToDb: 'false' // Already saved above
    });
  }
}

// ==========================================
// Task Status Change Notifications
// ==========================================

/**
 * Notify when task status changes
 */
export const onTaskStatusChanged = onDocumentUpdated({ document: 'tasks/{taskId}' }, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const taskId = event.params.taskId;

  if (!before || !after) {
    return null;
  }

  // Check if status changed
  if (before.status === after.status) {
    return null;
  }

  logger.info(`Task ${taskId} status changed: ${before.status} -> ${after.status}`);

  // Notify assignee if exists
  if (after.assigneeId && after.assigneeId !== after.updatedBy) {
    const statusText = after.status || 'unknown';
    await notifyUser(
      after.assigneeId,
      '待辦',
      '任務狀態更新',
      `任務「${after.name || '未命名'}」狀態已更改為 ${statusText}`,
      `/tasks/${taskId}`,
      statusText
    );
  }

  // Notify creator if different from assignee and updater
  if (after.creatorId && after.creatorId !== after.assigneeId && after.creatorId !== after.updatedBy) {
    const statusText = after.status || 'unknown';
    await notifyUser(
      after.creatorId,
      '通知',
      '任務狀態更新',
      `任務「${after.name || '未命名'}」狀態已更改為 ${statusText}`,
      `/tasks/${taskId}`
    );
  }

  return null;
});

/**
 * Notify when task is assigned
 */
export const onTaskAssigned = onDocumentUpdated({ document: 'tasks/{taskId}' }, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const taskId = event.params.taskId;

  if (!before || !after) {
    return null;
  }

  // Check if assignee changed
  if (before.assigneeId === after.assigneeId) {
    return null;
  }

  // Only notify if newly assigned (not unassigned)
  if (!after.assigneeId) {
    return null;
  }

  logger.info(`Task ${taskId} assigned to: ${after.assigneeId}`);

  await notifyUser(after.assigneeId, '待辦', '新任務指派', `您被指派了任務「${after.name || '未命名'}」`, `/tasks/${taskId}`, '新指派');

  return null;
});

// ==========================================
// Friend Request Notifications
// ==========================================

/**
 * Notify when friend request is sent
 */
export const onFriendRequestSent = onDocumentCreated({ document: 'friend_relations/{relationId}' }, async event => {
  const data = event.data?.data();

  if (!data || data.status !== 'pending') {
    return null;
  }

  logger.info(`Friend request sent: ${data.requesterId} -> ${data.recipientId}`);

  // Get requester name (optional, requires users collection)
  // For now, just use "某位使用者"
  const requesterName = '某位使用者';

  await notifyUser(data.recipientId, '消息', '新好友請求', `${requesterName} 想加您為好友`, `/friends/requests`, '待回應');

  return null;
});

/**
 * Notify when friend request is accepted
 */
export const onFriendRequestAccepted = onDocumentUpdated({ document: 'friend_relations/{relationId}' }, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) {
    return null;
  }

  // Check if status changed to accepted
  if (before.status === 'accepted' || after.status !== 'accepted') {
    return null;
  }

  logger.info(`Friend request accepted: ${after.requesterId} <-> ${after.recipientId}`);

  // Notify the original requester
  const recipientName = '某位使用者';

  await notifyUser(after.requesterId, '消息', '好友請求已接受', `${recipientName} 接受了您的好友請求`, `/friends`, '已接受');

  return null;
});

// ==========================================
// Log Update Notifications
// ==========================================

/**
 * Notify when new log is created
 */
export const onLogCreated = onDocumentCreated({ document: 'logs/{logId}' }, async event => {
  const data = event.data?.data();
  const logId = event.params.logId;

  if (!data) {
    return null;
  }

  logger.info(`New log created: ${logId}`);

  // Notify blueprint owner or relevant users
  if (data.blueprintId) {
    // Get blueprint to find owner/subscribers
    const blueprintDoc = await db.collection('blueprints').doc(data.blueprintId).get();

    if (blueprintDoc.exists) {
      const blueprint = blueprintDoc.data();

      // Notify owner if not the creator
      if (blueprint?.ownerId && blueprint.ownerId !== data.creatorId) {
        await notifyUser(
          blueprint.ownerId,
          '通知',
          '新施工日誌',
          `新增了施工日誌「${data.title || '未命名'}」`,
          `/logs/${logId}`,
          '新日誌'
        );
      }
    }
  }

  return null;
});

// ==========================================
// Quality Inspection Notifications
// ==========================================

/**
 * Notify when quality inspection is created
 */
export const onQualityInspectionCreated = onDocumentCreated({ document: 'quality/{qualityId}' }, async event => {
  const data = event.data?.data();
  const qualityId = event.params.qualityId;

  if (!data) {
    return null;
  }

  logger.info(`New quality inspection created: ${qualityId}`);

  // Notify assigned inspector
  if (data.inspectorId && data.inspectorId !== data.creatorId) {
    await notifyUser(
      data.inspectorId,
      '待辦',
      '新品質驗收任務',
      `您被指派了品質驗收任務「${data.title || '未命名'}」`,
      `/quality/${qualityId}`,
      '待驗收'
    );
  }

  return null;
});

/**
 * Notify when quality inspection status changes
 */
export const onQualityInspectionStatusChanged = onDocumentUpdated({ document: 'quality/{qualityId}' }, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const qualityId = event.params.qualityId;

  if (!before || !after) {
    return null;
  }

  // Check if status changed
  if (before.status === after.status) {
    return null;
  }

  logger.info(`Quality inspection ${qualityId} status changed: ${before.status} -> ${after.status}`);

  // Notify creator about status change
  if (after.creatorId && after.creatorId !== after.updatedBy) {
    const statusText = after.status || 'unknown';
    await notifyUser(
      after.creatorId,
      '通知',
      '品質驗收狀態更新',
      `品質驗收「${after.title || '未命名'}」狀態已更改為 ${statusText}`,
      `/quality/${qualityId}`
    );
  }

  return null;
});

// ==========================================
// Utility Functions
// ==========================================

/**
 * Test function to manually send notification
 */
export const sendTestNotification = onCall<{
  title?: string;
  body?: string;
  data?: Record<string, string>;
  link?: string;
}>(async request => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { title, body, data, link } = request.data;
  const token = await getUserFcmToken(userId);

  if (!token) {
    throw new HttpsError('not-found', 'No FCM token found for user');
  }

  const success = await sendPushNotification(token, title || '測試通知', body || '這是一則測試通知', data);

  if (success) {
    await createNotificationDocument(userId, '通知', title || '測試通知', body || '這是一則測試通知', link);
  }

  return { success };
});
