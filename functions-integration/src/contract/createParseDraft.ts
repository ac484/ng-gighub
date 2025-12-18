/**
 * Create Parse Draft Function
 *
 * Step 4 of the Contract OCR Pipeline:
 * - Creates normalized draft from OCR result
 * - Updates draft status to 'draft'
 * - Prepares data for user review
 *
 * SETC-012: Contract Upload & Parsing Service
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';

import type { ContractDraft, NormalizedContractData, NormalizedWorkItem, ParsedContractData, ParsedWorkItem } from './types';
import { isValidStatusTransition } from './types';

const db = getFirestore();

interface CreateParseDraftRequest {
  blueprintId: string;
  draftId: string;
}

interface CreateParseDraftResponse {
  success: boolean;
  normalizedData?: NormalizedContractData;
  error?: string;
}

/**
 * Create normalized draft from OCR result
 */
export const createParseDraft = onCall<CreateParseDraftRequest>(
  { cors: true, maxInstances: 10 },
  async (request): Promise<CreateParseDraftResponse> => {
    const { data, auth } = request;

    // Validate authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { blueprintId, draftId } = data;

    if (!blueprintId || !draftId) {
      throw new HttpsError('invalid-argument', 'Missing required fields: blueprintId, draftId');
    }

    logger.info('[createParseDraft]', 'Creating normalized draft', { blueprintId, draftId });

    try {
      // Get draft document
      const draftRef = db.collection('blueprints').doc(blueprintId).collection('contractDrafts').doc(draftId);
      const draftSnapshot = await draftRef.get();

      if (!draftSnapshot.exists) {
        throw new HttpsError('not-found', 'Draft not found');
      }

      const draft = draftSnapshot.data() as ContractDraft;

      // Validate status
      if (draft.status !== 'parsed') {
        throw new HttpsError('failed-precondition', `Cannot create normalized draft from status '${draft.status}'. Expected: 'parsed'`);
      }

      if (!isValidStatusTransition(draft.status, 'draft')) {
        throw new HttpsError('failed-precondition', `Invalid status transition from '${draft.status}' to 'draft'`);
      }

      if (!draft.ocrResult?.parsedData) {
        throw new HttpsError('failed-precondition', 'No OCR result found in draft');
      }

      // Normalize OCR data
      const normalizedData = normalizeContractData(draft.ocrResult.parsedData);

      // Update draft
      await draftRef.update({
        status: 'draft',
        normalizedData,
        updatedAt: Timestamp.now()
      });

      logger.info('[createParseDraft]', 'Normalized draft created', { draftId, status: 'draft' });

      return {
        success: true,
        normalizedData
      };
    } catch (error) {
      logger.error('[createParseDraft]', 'Failed to create normalized draft', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to create normalized draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Normalize parsed contract data for user review
 */
function normalizeContractData(parsed: ParsedContractData): NormalizedContractData {
  const normalized: NormalizedContractData = {};

  // Contract number
  if (parsed.contractNumber) {
    normalized.contractNumber = parsed.contractNumber.trim();
  }

  // Contract title
  if (parsed.contractTitle) {
    normalized.contractTitle = parsed.contractTitle.trim();
  }

  // Owner (Party A)
  if (parsed.partyA) {
    normalized.owner = {
      name: parsed.partyA.name?.trim() || '',
      representative: parsed.partyA.representative?.trim(),
      address: parsed.partyA.address?.trim(),
      phone: parsed.partyA.phone?.trim(),
      taxId: parsed.partyA.taxId?.trim()
    };
  }

  // Contractor (Party B)
  if (parsed.partyB) {
    normalized.contractor = {
      name: parsed.partyB.name?.trim() || '',
      representative: parsed.partyB.representative?.trim(),
      address: parsed.partyB.address?.trim(),
      phone: parsed.partyB.phone?.trim(),
      taxId: parsed.partyB.taxId?.trim()
    };
  }

  // Financial info
  if (parsed.totalAmount !== undefined) {
    normalized.totalAmount = parsed.totalAmount;
  }
  if (parsed.currency) {
    normalized.currency = parsed.currency.toUpperCase();
  }

  // Dates
  if (parsed.startDate) {
    normalized.startDate = normalizeDate(parsed.startDate);
  }
  if (parsed.endDate) {
    normalized.endDate = normalizeDate(parsed.endDate);
  }
  if (parsed.signDate) {
    normalized.signDate = normalizeDate(parsed.signDate);
  }

  // Work items
  if (parsed.workItems && parsed.workItems.length > 0) {
    normalized.workItems = normalizeWorkItems(parsed.workItems);
  }

  // Terms
  if (parsed.terms) {
    normalized.terms = {
      paymentTerms: parsed.terms.paymentTerms?.trim(),
      warrantyPeriod: parsed.terms.warrantyPeriod?.trim(),
      penaltyClause: parsed.terms.penaltyClause?.trim(),
      specialConditions: parsed.terms.specialConditions?.map(s => s.trim())
    };
  }

  return normalized;
}

/**
 * Normalize work items
 */
function normalizeWorkItems(items: ParsedWorkItem[]): NormalizedWorkItem[] {
  return items.map((item, index) => ({
    id: `wi-${Date.now()}-${index}`,
    itemNo: item.itemNo?.trim() || `${index + 1}`,
    description: item.description?.trim() || '',
    unit: item.unit?.trim() || '',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0),
    notes: item.notes?.trim()
  }));
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string): string {
  // Handle common date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try parsing common formats
  // Format: YYYY/MM/DD or YYYY-MM-DD
  const isoMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Return original if cannot parse
  return dateStr;
}
