/**
 * Firestore utility functions
 * Enterprise-standard Firestore operations
 */

import { Firestore, DocumentSnapshot, QuerySnapshot } from 'firebase-admin/firestore';

import { AppError, ErrorCode } from '../../../functions-shared/src/utils/error.util';
import { createLogger } from '../../../functions-shared/src/utils/logger.util';

const logger = createLogger({ module: 'firestore-util' });

/**
 * Get document data with ID
 */
export function getDocumentData<T>(snapshot: DocumentSnapshot): T | null {
  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  } as T;
}

/**
 * Get query results with IDs
 */
export function getQueryResults<T>(snapshot: QuerySnapshot): T[] {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
}

/**
 * Validate document exists
 */
export async function validateDocumentExists(db: Firestore, collection: string, docId: string): Promise<void> {
  const docRef = db.collection(collection).doc(docId);
  const doc = await docRef.get();

  if (!doc.exists) {
    logger.warn(`Document not found`, { collection, docId });
    throw new AppError(ErrorCode.NOT_FOUND, `Document not found: ${collection}/${docId}`);
  }
}

/**
 * Batch write with error handling
 */
export async function batchWrite(
  db: Firestore,
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: FirebaseFirestore.DocumentReference;
    data?: any;
  }>
): Promise<void> {
  const batch = db.batch();

  for (const op of operations) {
    switch (op.type) {
      case 'set':
        batch.set(op.ref, op.data);
        break;
      case 'update':
        batch.update(op.ref, op.data);
        break;
      case 'delete':
        batch.delete(op.ref);
        break;
    }
  }

  await batch.commit();
  logger.info(`Batch write completed`, { operationCount: operations.length });
}

/**
 * Safely increment field
 */
export function incrementField(value: number) {
  return require('firebase-admin').firestore.FieldValue.increment(value);
}

/**
 * Safely array union
 */
export function arrayUnion(...elements: any[]) {
  return require('firebase-admin').firestore.FieldValue.arrayUnion(...elements);
}

/**
 * Safely array remove
 */
export function arrayRemove(...elements: any[]) {
  return require('firebase-admin').firestore.FieldValue.arrayRemove(...elements);
}
