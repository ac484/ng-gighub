/**
 * Contract Draft Service
 *
 * Manages contract OCR draft workflow including:
 * - Fetching draft status from Firestore
 * - Subscribing to real-time draft updates
 * - Processing draft confirmation
 * - Handling draft rejection and retry
 *
 * Implements SETC-012: Contract Upload & Parsing Service - Frontend Integration
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, doc, getDoc, updateDoc, onSnapshot, Timestamp, query, where, orderBy } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Subject } from 'rxjs';

/**
 * Contract Draft Status
 */
export type ContractDraftStatus =
  | 'uploaded'
  | 'parsing'
  | 'parsed'
  | 'draft'
  | 'user_reviewed'
  | 'confirmed'
  | 'rejected'
  | 'archived'
  | 'error';

/**
 * Parsed Contract Data from OCR
 */
export interface ParsedContractData {
  contractNumber?: string;
  contractTitle?: string;
  partyA?: {
    name?: string;
    representative?: string;
    address?: string;
    phone?: string;
    taxId?: string;
    type?: 'owner' | 'contractor' | 'subcontractor' | 'other';
  };
  partyB?: {
    name?: string;
    representative?: string;
    address?: string;
    phone?: string;
    taxId?: string;
    type?: 'owner' | 'contractor' | 'subcontractor' | 'other';
  };
  totalAmount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  signDate?: string;
  workItems?: Array<{
    itemNo?: string;
    description?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    notes?: string;
  }>;
  terms?: {
    paymentTerms?: string;
    warrantyPeriod?: string;
    penaltyClause?: string;
    specialConditions?: string[];
  };
}

/**
 * OCR Parse Result
 */
export interface OcrParseResult {
  success: boolean;
  parsedAt: Date;
  engine: 'gemini' | 'vision' | 'manual';
  parsedData: ParsedContractData;
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };
  rawText?: string;
  processingTimeMs?: number;
}

/**
 * Contract Draft Document
 */
export interface ContractDraft {
  id: string;
  blueprintId: string;
  contractId?: string;
  status: ContractDraftStatus;
  originalFile: {
    url: string;
    path: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: string;
  };
  ocrResult?: OcrParseResult;
  normalizedData?: ParsedContractData;
  userSelections?: {
    selectedFields: string[];
    modifiedFields: Record<string, unknown>;
    reviewedAt: Date;
    reviewedBy: string;
    notes?: string;
  };
  confirmedContractId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Confirm Draft Request
 */
export interface ConfirmDraftRequest {
  blueprintId: string;
  draftId: string;
  selectedFields: Partial<ParsedContractData>;
  confirmedBy: string;
}

/**
 * Confirm Draft Response
 */
export interface ConfirmDraftResponse {
  success: boolean;
  contractId?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractDraftService {
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  private readonly _currentDraft = signal<ContractDraft | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _drafts = signal<ContractDraft[]>([]);

  // Unsubscribe function for real-time listener
  private unsubscribeDraft: (() => void) | null = null;

  // Readonly state accessors
  readonly currentDraft = this._currentDraft.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly drafts = this._drafts.asReadonly();

  // Computed states
  readonly isParsing = computed(() => {
    const draft = this._currentDraft();
    return draft?.status === 'parsing';
  });

  readonly isParsed = computed(() => {
    const draft = this._currentDraft();
    return draft?.status === 'parsed' || draft?.status === 'draft';
  });

  readonly hasError = computed(() => {
    const draft = this._currentDraft();
    return draft?.status === 'error' || !!this._error();
  });

  readonly parsedData = computed(() => {
    const draft = this._currentDraft();
    return draft?.ocrResult?.parsedData || draft?.normalizedData || null;
  });

  readonly confidence = computed(() => {
    const draft = this._currentDraft();
    return draft?.ocrResult?.confidence?.overall || 0;
  });

  /**
   * Load a specific draft by ID
   */
  async loadDraft(blueprintId: string, draftId: string): Promise<ContractDraft | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const draftDoc = doc(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId);
      const snapshot = await getDoc(draftDoc);

      if (!snapshot.exists()) {
        this._error.set('Draft not found');
        return null;
      }

      const data = snapshot.data();
      const draft = this.convertToDraft(snapshot.id, data);

      this._currentDraft.set(draft);
      return draft;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load draft';
      this._error.set(message);
      console.error('[ContractDraftService]', 'loadDraft failed', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Subscribe to real-time draft updates
   */
  subscribeToDraft(blueprintId: string, draftId: string): void {
    // Unsubscribe from previous listener
    this.unsubscribeFromDraft();

    this._loading.set(true);
    this._error.set(null);

    const draftDoc = doc(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId);

    this.unsubscribeDraft = onSnapshot(
      draftDoc,
      snapshot => {
        this._loading.set(false);

        if (!snapshot.exists()) {
          this._error.set('Draft not found');
          this._currentDraft.set(null);
          return;
        }

        const data = snapshot.data();
        const draft = this.convertToDraft(snapshot.id, data);
        this._currentDraft.set(draft);

        console.log('[ContractDraftService]', 'Draft updated', { draftId, status: draft.status });
      },
      error => {
        this._loading.set(false);
        this._error.set(error.message || 'Failed to subscribe to draft');
        console.error('[ContractDraftService]', 'subscribeToDraft error', error);
      }
    );
  }

  /**
   * Unsubscribe from real-time draft updates
   */
  unsubscribeFromDraft(): void {
    if (this.unsubscribeDraft) {
      this.unsubscribeDraft();
      this.unsubscribeDraft = null;
    }
  }

  /**
   * Load all drafts for a blueprint
   */
  async loadDrafts(blueprintId: string): Promise<ContractDraft[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const draftsCol = collection(this.firestore, 'blueprints', blueprintId, 'contractDrafts');
      const q = query(draftsCol, orderBy('createdAt', 'desc'));

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          snapshot => {
            unsubscribe();
            this._loading.set(false);

            const drafts = snapshot.docs.map(doc => this.convertToDraft(doc.id, doc.data()));
            this._drafts.set(drafts);
            resolve(drafts);
          },
          error => {
            unsubscribe();
            this._loading.set(false);
            this._error.set(error.message || 'Failed to load drafts');
            reject(error);
          }
        );
      });
    } catch (err) {
      this._loading.set(false);
      const message = err instanceof Error ? err.message : 'Failed to load drafts';
      this._error.set(message);
      console.error('[ContractDraftService]', 'loadDrafts failed', err);
      return [];
    }
  }

  /**
   * Confirm a draft and create the official contract
   */
  async confirmDraft(request: ConfirmDraftRequest): Promise<ConfirmDraftResponse> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Call the confirmContract cloud function
      const confirmContractFn = httpsCallable<ConfirmDraftRequest, ConfirmDraftResponse>(this.functions, 'confirmContract');

      const result = await confirmContractFn(request);

      if (result.data.success) {
        console.log('[ContractDraftService]', 'Draft confirmed', {
          draftId: request.draftId,
          contractId: result.data.contractId
        });

        // Reload the draft to get updated status
        await this.loadDraft(request.blueprintId, request.draftId);
      } else {
        this._error.set(result.data.error || 'Failed to confirm draft');
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm draft';
      this._error.set(message);
      console.error('[ContractDraftService]', 'confirmDraft failed', err);
      return { success: false, error: message };
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reject a draft
   */
  async rejectDraft(blueprintId: string, draftId: string, reason?: string, userId?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const draftDoc = doc(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId);

      // Get current draft to record previous status
      const snapshot = await getDoc(draftDoc);
      const previousStatus = snapshot.exists() ? (snapshot.data()['status'] as string) : 'unknown';

      await updateDoc(draftDoc, {
        status: 'rejected',
        errorMessage: reason || 'Rejected by user',
        updatedAt: Timestamp.now()
      });

      // Add history entry
      const historyCol = collection(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId, 'history');
      const { addDoc: addDocFn } = await import('@angular/fire/firestore');
      await addDocFn(historyCol, {
        action: 'rejected',
        previousStatus,
        newStatus: 'rejected',
        performedBy: userId || 'unknown',
        performedAt: Timestamp.now(),
        details: { reason: reason || 'Rejected by user' }
      });

      console.log('[ContractDraftService]', 'Draft rejected', { draftId, reason });

      // Reload draft
      await this.loadDraft(blueprintId, draftId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject draft';
      this._error.set(message);
      console.error('[ContractDraftService]', 'rejectDraft failed', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Retry OCR parsing for a draft
   */
  async retryParsing(blueprintId: string, draftId: string, userId?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const draftDoc = doc(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId);

      // Get current draft to record previous status
      const snapshot = await getDoc(draftDoc);
      const previousStatus = snapshot.exists() ? (snapshot.data()['status'] as string) : 'unknown';

      // Reset status to trigger re-parsing
      await updateDoc(draftDoc, {
        status: 'uploaded',
        ocrResult: null,
        errorMessage: null,
        updatedAt: Timestamp.now()
      });

      // Add history entry
      const historyCol = collection(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId, 'history');
      const { addDoc: addDocFn } = await import('@angular/fire/firestore');
      await addDocFn(historyCol, {
        action: 'retry_requested',
        previousStatus,
        newStatus: 'uploaded',
        performedBy: userId || 'unknown',
        performedAt: Timestamp.now(),
        details: { reason: 'User requested retry' }
      });

      console.log('[ContractDraftService]', 'Retry parsing requested', { draftId });

      // The processContractUpload function will be triggered again
      // or we can call it explicitly here
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry parsing';
      this._error.set(message);
      console.error('[ContractDraftService]', 'retryParsing failed', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update draft with user modifications
   */
  async updateDraftData(blueprintId: string, draftId: string, data: Partial<ParsedContractData>, userId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const draftDoc = doc(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId);

      // Get current draft to record previous status
      const snapshot = await getDoc(draftDoc);
      const previousStatus = snapshot.exists() ? (snapshot.data()['status'] as string) : 'unknown';

      await updateDoc(draftDoc, {
        normalizedData: data,
        status: 'user_reviewed',
        userSelections: {
          modifiedFields: data,
          reviewedAt: Timestamp.now(),
          reviewedBy: userId
        },
        updatedAt: Timestamp.now()
      });

      // Add history entry
      const historyCol = collection(this.firestore, 'blueprints', blueprintId, 'contractDrafts', draftId, 'history');
      const { addDoc: addDocFn } = await import('@angular/fire/firestore');
      await addDocFn(historyCol, {
        action: 'user_reviewed',
        previousStatus,
        newStatus: 'user_reviewed',
        performedBy: userId,
        performedAt: Timestamp.now(),
        details: {
          modifiedFieldCount: Object.keys(data).length,
          modifiedFields: Object.keys(data)
        }
      });

      console.log('[ContractDraftService]', 'Draft data updated', { draftId });

      // Reload draft
      await this.loadDraft(blueprintId, draftId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update draft data';
      this._error.set(message);
      console.error('[ContractDraftService]', 'updateDraftData failed', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear current draft state
   */
  clearDraft(): void {
    this.unsubscribeFromDraft();
    this._currentDraft.set(null);
    this._error.set(null);
  }

  /**
   * Convert Firestore document data to ContractDraft
   */
  private convertToDraft(id: string, data: Record<string, unknown>): ContractDraft {
    const originalFile = (data['originalFile'] as Record<string, unknown>) || {};
    const ocrResult = data['ocrResult'] as Record<string, unknown> | undefined;
    const userSelections = data['userSelections'] as Record<string, unknown> | undefined;

    return {
      id,
      blueprintId: data['blueprintId'] as string,
      contractId: data['contractId'] as string | undefined,
      status: data['status'] as ContractDraftStatus,
      originalFile: {
        url: (originalFile['url'] as string) || '',
        path: (originalFile['path'] as string) || '',
        fileName: (originalFile['fileName'] as string) || '',
        fileType: (originalFile['fileType'] as string) || 'application/pdf',
        fileSize: (originalFile['fileSize'] as number) || 0,
        uploadedAt: this.toDate(originalFile['uploadedAt']),
        uploadedBy: (originalFile['uploadedBy'] as string) || ''
      },
      ocrResult: ocrResult
        ? {
            success: ocrResult['success'] as boolean,
            parsedAt: this.toDate(ocrResult['parsedAt']),
            engine: ocrResult['engine'] as 'gemini' | 'vision' | 'manual',
            parsedData: ocrResult['parsedData'] as ParsedContractData,
            confidence: ocrResult['confidence'] as { overall: number; fields: Record<string, number> },
            rawText: ocrResult['rawText'] as string | undefined,
            processingTimeMs: ocrResult['processingTimeMs'] as number | undefined
          }
        : undefined,
      normalizedData: data['normalizedData'] as ParsedContractData | undefined,
      userSelections: userSelections
        ? {
            selectedFields: (userSelections['selectedFields'] as string[]) || [],
            modifiedFields: (userSelections['modifiedFields'] as Record<string, unknown>) || {},
            reviewedAt: this.toDate(userSelections['reviewedAt']),
            reviewedBy: (userSelections['reviewedBy'] as string) || '',
            notes: userSelections['notes'] as string | undefined
          }
        : undefined,
      confirmedContractId: data['confirmedContractId'] as string | undefined,
      errorMessage: data['errorMessage'] as string | undefined,
      createdAt: this.toDate(data['createdAt']),
      updatedAt: this.toDate(data['updatedAt']),
      createdBy: (data['createdBy'] as string) || ''
    };
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private toDate(value: unknown): Date {
    if (!value) {
      return new Date();
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
      return (value as Timestamp).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  }
}
