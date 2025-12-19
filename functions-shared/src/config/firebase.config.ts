/**
 * Firebase Admin initialization
 * Enterprise-standard Firebase Admin SDK setup
 */

import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

import { createLogger } from '../utils/logger.util';

const logger = createLogger({ module: 'firebase-config' });

/**
 * Initialize Firebase Admin SDK
 * Should be called once at the start of your functions
 */
export function initializeFirebaseAdmin(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp();
    logger.info('Firebase Admin SDK initialized');
  }
}

/**
 * Get Firestore instance
 *
 * @param databaseId - Optional database ID for multi-database setup
 */
export function getFirestoreInstance(databaseId?: string): Firestore {
  if (databaseId) {
    return getFirestore(databaseId);
  }
  return getFirestore();
}

/**
 * Get default Firestore instance
 */
export const db = (): Firestore => getFirestoreInstance();

/**
 * Server timestamp helper
 */
export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

/**
 * Firestore field value helpers
 */
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
