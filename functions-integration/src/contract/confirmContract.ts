/**
 * Confirm Contract Function
 *
 * Step 8 of the Contract OCR Pipeline:
 * - Validates draft status
 * - Creates official contract from user-confirmed data
 * - Updates draft status to confirmed
 * - Preserves audit trail
 *
 * SETC-012: Contract Upload & Parsing Service
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';

import type { ConfirmContractRequest, ConfirmContractResponse, ContractDraft, ContractDraftStatus, UserSelections } from './types';
import { isValidStatusTransition } from './types';

const db = getFirestore();

/**
 * Confirm a contract draft and create the official contract
 */
export const confirmContract = onCall<ConfirmContractRequest>(
  { cors: true, maxInstances: 10 },
  async (request): Promise<ConfirmContractResponse> => {
    const { data, auth } = request;

    // Validate authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate request
    const { blueprintId, draftId, selectedFields, confirmedBy } = data;

    if (!blueprintId || !draftId || !selectedFields) {
      throw new HttpsError('invalid-argument', 'Missing required fields: blueprintId, draftId, selectedFields');
    }

    logger.info('[confirmContract]', 'Confirming contract', { blueprintId, draftId });

    try {
      // Get draft document
      const draftRef = db.collection('blueprints').doc(blueprintId).collection('contractDrafts').doc(draftId);
      const draftSnapshot = await draftRef.get();

      if (!draftSnapshot.exists) {
        throw new HttpsError('not-found', 'Draft not found');
      }

      const draft = draftSnapshot.data() as ContractDraft;

      // Validate status transition
      const validStatuses: ContractDraftStatus[] = ['draft', 'user_reviewed', 'parsed'];
      if (!validStatuses.includes(draft.status)) {
        throw new HttpsError(
          'failed-precondition',
          `Cannot confirm draft with status '${draft.status}'. Expected: ${validStatuses.join(', ')}`
        );
      }

      if (!isValidStatusTransition(draft.status, 'confirmed')) {
        throw new HttpsError('failed-precondition', `Invalid status transition from '${draft.status}' to 'confirmed'`);
      }

      // Create user selections record
      const userSelections: UserSelections = {
        selectedFields: Object.keys(selectedFields),
        modifiedFields: selectedFields,
        reviewedAt: Timestamp.now(),
        reviewedBy: confirmedBy || auth.uid
      };

      // Create official contract
      const contractRef = db.collection('blueprints').doc(blueprintId).collection('contracts').doc();
      const contractId = contractRef.id;
      const now = Timestamp.now();

      // Build contract document from selected fields
      const contractData = {
        id: contractId,
        blueprintId,
        draftId,
        status: 'active',

        // Contract details from user selections
        contractNumber: selectedFields.contractNumber || draft.normalizedData?.contractNumber || 'PENDING',
        contractTitle: selectedFields.contractTitle || draft.normalizedData?.contractTitle,
        owner: selectedFields.owner || draft.normalizedData?.owner,
        contractor: selectedFields.contractor || draft.normalizedData?.contractor,
        totalAmount: selectedFields.totalAmount || draft.normalizedData?.totalAmount,
        currency: selectedFields.currency || draft.normalizedData?.currency || 'TWD',
        startDate: selectedFields.startDate || draft.normalizedData?.startDate,
        endDate: selectedFields.endDate || draft.normalizedData?.endDate,
        signDate: selectedFields.signDate || draft.normalizedData?.signDate,
        terms: selectedFields.terms || draft.normalizedData?.terms,

        // Original file reference
        originalFiles: [
          {
            id: draftId,
            fileName: draft.originalFile.fileName,
            fileType: draft.originalFile.fileType,
            fileSize: draft.originalFile.fileSize,
            fileUrl: draft.originalFile.url,
            storagePath: draft.originalFile.path,
            uploadedAt: draft.originalFile.uploadedAt,
            uploadedBy: draft.originalFile.uploadedBy
          }
        ],

        // Metadata
        createdAt: now,
        updatedAt: now,
        createdBy: confirmedBy || auth.uid,
        confirmedAt: now,
        confirmedBy: confirmedBy || auth.uid
      };

      // Run transaction to update draft and create contract
      await db.runTransaction(async transaction => {
        // Create official contract
        transaction.set(contractRef, contractData);

        // Update draft with confirmation info
        transaction.update(draftRef, {
          status: 'confirmed',
          confirmedContractId: contractId,
          userSelections,
          updatedAt: now
        });

        // Add to history
        const historyRef = draftRef.collection('history').doc();
        transaction.set(historyRef, {
          action: 'confirmed',
          previousStatus: draft.status,
          newStatus: 'confirmed',
          contractId,
          performedBy: confirmedBy || auth.uid,
          performedAt: now,
          details: { selectedFields: Object.keys(selectedFields) }
        });
      });

      logger.info('[confirmContract]', 'Contract confirmed', { contractId, draftId });

      return {
        success: true,
        contractId
      };
    } catch (error) {
      logger.error('[confirmContract]', 'Failed to confirm contract', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to confirm contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
