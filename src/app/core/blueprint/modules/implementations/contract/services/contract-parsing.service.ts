/**
 * Contract Parsing Service
 *
 * Handles contract document parsing through OCR/AI integration.
 * Manages parsing requests, status tracking, and result confirmation.
 * Implements SETC-012: Contract Upload & Parsing Service.
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, getDoc, Timestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

import type { ContractParsedData, ContractParsingRequest, ContractParsingStatus, FileAttachment } from '../models';
import { ContractEventService } from './contract-event.service';
import type { ContractParsingRequestDto, ContractParsingConfirmationDto } from '../models/dtos';
import { ContractRepository } from '../repositories/contract.repository';

/**
 * Parsing result from Firebase Function
 */
export interface ParsingResult {
  success: boolean;
  requestId: string;
  parsedData?: ContractParsedData;
  errorMessage?: string;
}

/**
 * Parsing progress information
 */
export interface ParsingProgress {
  requestId: string;
  status: ContractParsingStatus;
  progress: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractParsingService {
  private readonly functions = inject(Functions);
  private readonly firestore = inject(Firestore);
  private readonly contractRepository = inject(ContractRepository);
  private readonly eventService = inject(ContractEventService);

  // State signals
  private readonly _parsing = signal(false);
  private readonly _progress = signal<ParsingProgress | null>(null);
  private readonly _error = signal<string | null>(null);

  // Readonly state accessors
  readonly parsing = this._parsing.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Request parsing for contract files
   *
   * @param dto - Parsing request data
   * @returns Parsing request ID
   */
  async requestParsing(dto: ContractParsingRequestDto): Promise<string> {
    this._parsing.set(true);
    this._error.set(null);

    try {
      // Create parsing request record
      const request: Omit<ContractParsingRequest, 'id'> = {
        contractId: dto.contractId,
        blueprintId: dto.blueprintId,
        fileIds: dto.fileIds,
        enginePreference: dto.enginePreference || 'auto',
        status: 'pending',
        requestedBy: dto.requestedBy,
        requestedAt: new Date()
      };

      // Store request in Firestore
      const requestsCollection = collection(this.firestore, 'blueprints', dto.blueprintId, 'contracts', dto.contractId, 'parsingRequests');
      const docRef = await addDoc(requestsCollection, {
        ...request,
        requestedAt: Timestamp.now()
      });
      const requestId = docRef.id;

      // Update progress
      this._progress.set({
        requestId,
        status: 'pending',
        progress: 0,
        message: '解析請求已建立'
      });

      // Emit event
      this.eventService.emitParsingRequested(dto.blueprintId, dto.contractId, requestId, dto.fileIds);

      // Trigger Firebase Function for parsing (async)
      this.triggerParsingFunction(dto.blueprintId, dto.contractId, requestId, dto.fileIds).catch(err => {
        console.error('[ContractParsingService]', 'Background parsing failed', err);
      });

      return requestId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request parsing';
      this._error.set(message);
      throw err;
    } finally {
      this._parsing.set(false);
    }
  }

  /**
   * Trigger Firebase Cloud Function for parsing
   * This is called asynchronously after the request is created
   */
  private async triggerParsingFunction(blueprintId: string, contractId: string, requestId: string, fileIds: string[]): Promise<void> {
    try {
      // Update status to processing
      await this.updateParsingStatus(blueprintId, contractId, requestId, 'processing');

      this._progress.set({
        requestId,
        status: 'processing',
        progress: 10,
        message: '正在解析合約文件...'
      });

      // Emit event
      this.eventService.emitParsingStarted(blueprintId, contractId, requestId);

      // Get contract files for parsing
      const contract = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      const filesToParse = contract.originalFiles.filter(f => fileIds.includes(f.id));
      if (filesToParse.length === 0) {
        throw new Error('No files found for parsing');
      }

      // Call Firebase Function
      const parseContractFn = httpsCallable<
        { blueprintId: string; contractId: string; requestId: string; files: FileAttachment[] },
        ParsingResult
      >(this.functions, 'parseContractDocument');

      const result = await parseContractFn({
        blueprintId,
        contractId,
        requestId,
        files: filesToParse
      });

      if (result.data.success && result.data.parsedData) {
        // Update contract with parsed data
        await this.contractRepository.update(blueprintId, contractId, {
          parsedData: result.data.parsedData
        });

        // Update request status
        await this.updateParsingStatus(blueprintId, contractId, requestId, 'completed');

        this._progress.set({
          requestId,
          status: 'completed',
          progress: 100,
          message: '解析完成'
        });

        // Emit event
        this.eventService.emitParsingCompleted(blueprintId, contractId, requestId, result.data.parsedData);
      } else {
        throw new Error(result.data.errorMessage || 'Parsing failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Parsing failed';

      // Update request status
      await this.updateParsingStatus(blueprintId, contractId, requestId, 'failed', message);

      this._progress.set({
        requestId,
        status: 'failed',
        progress: 0,
        message: `解析失敗: ${message}`
      });

      // Emit event
      this.eventService.emitParsingFailed(blueprintId, contractId, requestId, message);

      throw err;
    }
  }

  /**
   * Get parsing request status
   */
  async getParsingStatus(blueprintId: string, contractId: string, requestId: string): Promise<ContractParsingRequest | null> {
    try {
      const requestDoc = doc(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, 'parsingRequests', requestId);
      const snapshot = await getDoc(requestDoc);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return {
        id: snapshot.id,
        contractId: data['contractId'],
        blueprintId: data['blueprintId'],
        fileIds: data['fileIds'],
        enginePreference: data['enginePreference'],
        status: data['status'],
        requestedBy: data['requestedBy'],
        requestedAt: data['requestedAt'] instanceof Timestamp ? data['requestedAt'].toDate() : new Date(data['requestedAt']),
        completedAt:
          data['completedAt'] instanceof Timestamp
            ? data['completedAt'].toDate()
            : data['completedAt']
              ? new Date(data['completedAt'])
              : undefined,
        errorMessage: data['errorMessage']
      };
    } catch (err) {
      console.error('[ContractParsingService]', 'getParsingStatus failed', err);
      return null;
    }
  }

  /**
   * Confirm parsed data
   */
  async confirmParsedData(dto: ContractParsingConfirmationDto): Promise<void> {
    try {
      const contract = await this.contractRepository.findByIdOnce(dto.blueprintId, dto.contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.parsedData) {
        throw new Error('No parsed data to confirm');
      }

      // Update parsed data with verification info
      const updatedParsedData: ContractParsedData = {
        ...contract.parsedData,
        verificationStatus: dto.confirmationType,
        verifiedBy: dto.confirmedBy,
        verifiedAt: new Date()
      };

      // If modified, update extracted data
      if (dto.confirmationType === 'modified' && dto.modifiedData) {
        updatedParsedData.extractedData = {
          ...updatedParsedData.extractedData,
          contractNumber: dto.modifiedData.contractNumber ?? updatedParsedData.extractedData.contractNumber,
          contractTitle: dto.modifiedData.title ?? updatedParsedData.extractedData.contractTitle,
          totalAmount: dto.modifiedData.totalAmount ?? updatedParsedData.extractedData.totalAmount,
          currency: dto.modifiedData.currency ?? updatedParsedData.extractedData.currency,
          startDate: dto.modifiedData.startDate?.toISOString().split('T')[0] ?? updatedParsedData.extractedData.startDate,
          endDate: dto.modifiedData.endDate?.toISOString().split('T')[0] ?? updatedParsedData.extractedData.endDate
        };

        // Update parties if provided
        if (dto.modifiedData.owner) {
          updatedParsedData.extractedData.parties = updatedParsedData.extractedData.parties || [];
          const ownerIndex = updatedParsedData.extractedData.parties.findIndex(p => p.type === 'owner');
          if (ownerIndex >= 0) {
            updatedParsedData.extractedData.parties[ownerIndex] = {
              ...updatedParsedData.extractedData.parties[ownerIndex],
              ...dto.modifiedData.owner
            };
          } else {
            updatedParsedData.extractedData.parties.push({
              ...dto.modifiedData.owner,
              type: 'owner'
            });
          }
        }

        if (dto.modifiedData.contractor) {
          updatedParsedData.extractedData.parties = updatedParsedData.extractedData.parties || [];
          const contractorIndex = updatedParsedData.extractedData.parties.findIndex(p => p.type === 'contractor');
          if (contractorIndex >= 0) {
            updatedParsedData.extractedData.parties[contractorIndex] = {
              ...updatedParsedData.extractedData.parties[contractorIndex],
              ...dto.modifiedData.contractor
            };
          } else {
            updatedParsedData.extractedData.parties.push({
              ...dto.modifiedData.contractor,
              type: 'contractor'
            });
          }
        }
      }

      // Update contract
      await this.contractRepository.update(dto.blueprintId, dto.contractId, {
        parsedData: updatedParsedData
      });

      // Emit event
      this.eventService.emitParsingConfirmed(dto.blueprintId, dto.contractId, dto.confirmedBy, dto.confirmationType);

      console.log('[ContractParsingService]', `Parsed data confirmed for contract ${dto.contractId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm parsed data';
      this._error.set(message);
      throw err;
    }
  }

  /**
   * Skip parsing and mark as manual entry
   */
  async skipParsing(blueprintId: string, contractId: string, userId: string): Promise<void> {
    try {
      const manualParsedData: ContractParsedData = {
        parsingEngine: 'manual',
        parsedAt: new Date(),
        confidence: 1.0,
        extractedData: {},
        needsVerification: false,
        verificationStatus: 'confirmed',
        verifiedBy: userId,
        verifiedAt: new Date()
      };

      await this.contractRepository.update(blueprintId, contractId, {
        parsedData: manualParsedData
      });

      console.log('[ContractParsingService]', `Parsing skipped for contract ${contractId}`);
    } catch (err) {
      console.error('[ContractParsingService]', 'skipParsing failed', err);
      throw err;
    }
  }

  /**
   * Check if parsing is available (feature enabled)
   */
  isParsingAvailable(): boolean {
    // Check if parsing features are enabled in config
    // For now, return true - can be configured via environment
    return true;
  }

  /**
   * Update parsing request status in Firestore
   */
  private async updateParsingStatus(
    blueprintId: string,
    contractId: string,
    requestId: string,
    status: ContractParsingStatus,
    errorMessage?: string
  ): Promise<void> {
    try {
      const requestDoc = doc(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, 'parsingRequests', requestId);

      const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'completed' || status === 'failed') {
        updateData['completedAt'] = Timestamp.now();
      }

      if (errorMessage) {
        updateData['errorMessage'] = errorMessage;
      }

      await updateDoc(requestDoc, updateData);
    } catch (err) {
      console.error('[ContractParsingService]', 'updateParsingStatus failed', err);
    }
  }
}
