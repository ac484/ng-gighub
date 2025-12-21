/**
 * Contract Repository (Simplified Skeleton)
 *
 * Basic CRUD operations for contracts subcollection.
 *
 * Collection path: blueprints/{blueprintId}/contracts/{contractId}
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  QueryConstraint,
  collectionData
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import type { Contract, ContractFilters, ContractStatus, CreateContractDto, FileAttachment, UpdateContractDto } from '../../data/models';

@Injectable({ providedIn: 'root' })
export class ContractRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly contractsSubcollection = 'contracts';

  /**
   * Get contracts subcollection reference
   */
  private getContractsCollection(blueprintId: string) {
    return collection(this.firestore, 'blueprints', blueprintId, this.contractsSubcollection);
  }

  /**
   * Get a single contract document reference
   */
  private getContractDocRef(blueprintId: string, contractId: string) {
    return doc(this.firestore, 'blueprints', blueprintId, this.contractsSubcollection, contractId);
  }

  /**
   * Convert Firestore timestamps to Date objects
   */
  private convertTimestamps(data: Record<string, unknown>, id: string): Contract {
    const signingDate = data['signingDate'];
    const startDate = data['startDate'];
    const endDate = data['endDate'];
    const createdAt = data['createdAt'];
    const updatedAt = data['updatedAt'];
    const activatedAt = data['activatedAt'];

    return {
      id,
      blueprintId: data['blueprintId'] as string,
      contractNumber: data['contractNumber'] as string,
      title: data['title'] as string,
      description: data['description'] as string,
      owner: data['owner'] as Contract['owner'],
      contractor: data['contractor'] as Contract['contractor'],
      totalAmount: data['totalAmount'] as number,
      currency: data['currency'] as string,
      terms: data['terms'] as Contract['terms'],
      status: data['status'] as ContractStatus,
      signingDate: signingDate instanceof Timestamp ? signingDate.toDate() : new Date(signingDate as string | number | Date),
      startDate: startDate instanceof Timestamp ? startDate.toDate() : new Date(startDate as string | number | Date),
      endDate: endDate instanceof Timestamp ? endDate.toDate() : new Date(endDate as string | number | Date),
      originalFiles: this.convertFileAttachments((data['originalFiles'] as Contract['originalFiles']) || []),
      createdBy: data['createdBy'] as string,
      createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt as string | number | Date),
      updatedBy: data['updatedBy'] as string,
      updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(updatedAt as string | number | Date),
      activatedBy: data['activatedBy'] as string,
      activatedAt: activatedAt
        ? activatedAt instanceof Timestamp
          ? activatedAt.toDate()
          : new Date(activatedAt as string | number | Date)
        : undefined,
      attachments: this.convertFileAttachments((data['attachments'] as Contract['attachments']) || []),
      parsedData: data['parsedData'] as string | undefined
    } as Contract;
  }

  /**
   * Convert file attachments by normalizing uploadedAt timestamp
   */
  private convertFileAttachments(files: any[]): FileAttachment[] {
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map(file => {
      const uploadedAtValue = file?.uploadedAt;
      let uploadedAt: Date;

      if (uploadedAtValue instanceof Timestamp) {
        uploadedAt = uploadedAtValue.toDate();
      } else if (uploadedAtValue instanceof Date) {
        uploadedAt = uploadedAtValue;
      } else if (typeof uploadedAtValue === 'string' || typeof uploadedAtValue === 'number') {
        uploadedAt = new Date(uploadedAtValue);
      } else {
        uploadedAt = new Date();
      }

      return {
        ...file,
        uploadedAt
      };
    });
  }

  /**
   * Serialize file attachments for Firestore writes
   */
  private serializeFileAttachments(files: FileAttachment[] = []): any[] {
    return files.map(file => ({
      ...file,
      uploadedAt: Timestamp.fromDate(
        file.uploadedAt instanceof Date
          ? file.uploadedAt
          : typeof file.uploadedAt === 'string' || typeof file.uploadedAt === 'number'
            ? new Date(file.uploadedAt)
            : new Date()
      )
    }));
  }

  /**
   * Generate a new contract number (format: CON-0001)
   */
  async generateContractNumber(blueprintId: string): Promise<string> {
    try {
      const contractsRef = this.getContractsCollection(blueprintId);
      const snapshot = await getDocs(contractsRef);

      if (snapshot.empty) {
        return 'CON-0001';
      }

      // Find highest number
      let maxNum = 0;
      snapshot.docs.forEach(doc => {
        const num = doc.data()['contractNumber'] as string;
        const match = num.match(/CON-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });

      return `CON-${String(maxNum + 1).padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('[ContractRepository]', 'generateContractNumber failed', error as Error);
      return 'CON-0001';
    }
  }

  /**
   * Create a new contract
   */
  async create(blueprintId: string, data: CreateContractDto): Promise<Contract> {
    try {
      const contractsRef = this.getContractsCollection(blueprintId);
      const now = Timestamp.now();

      const contractNumber = data.contractNumber || (await this.generateContractNumber(blueprintId));

      const contractData = {
        blueprintId,
        contractNumber,
        title: data.title,
        description: data.description || '',
        owner: data.owner,
        contractor: data.contractor,
        totalAmount: data.totalAmount,
        currency: data.currency || 'TWD',
        terms: data.terms || [],
        status: 'draft' as ContractStatus,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        originalFiles: this.serializeFileAttachments(data.originalFiles || []),
        createdBy: data.createdBy,
        createdAt: now,
        updatedBy: data.createdBy,
        updatedAt: now,
        attachments: []
      };

      const docRef = await addDoc(contractsRef, contractData);
      const snapshot = await getDoc(docRef);

      return this.convertTimestamps(snapshot.data()!, docRef.id);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Find contract by ID (one-time read)
   */
  async findByIdOnce(blueprintId: string, contractId: string): Promise<Contract | null> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.convertTimestamps(snapshot.data(), snapshot.id);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'findByIdOnce failed', error as Error);
      return null;
    }
  }

  /**
   * Find contract by ID (returns Observable for reactive updates)
   */
  findById(blueprintId: string, contractId: string): Observable<Contract | null> {
    return from(this.findByIdOnce(blueprintId, contractId)).pipe(
      catchError(error => {
        this.logger.error('[ContractRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find all contracts for a blueprint
   */
  findByBlueprint(blueprintId: string, filters?: ContractFilters): Observable<Contract[]> {
    const contractsRef = this.getContractsCollection(blueprintId);
    const constraints: QueryConstraint[] = [];

    // Apply basic filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }
      if (filters.ownerId) {
        constraints.push(where('owner.id', '==', filters.ownerId));
      }
      if (filters.contractorId) {
        constraints.push(where('contractor.id', '==', filters.contractorId));
      }
    }

    const contractsQuery = query(contractsRef, ...constraints);

    return from(getDocs(contractsQuery)).pipe(
      map(snapshot => {
        const contracts = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort by createdAt desc
        contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return contracts;
      }),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Subscribe to real-time contract list updates
   */
  subscribeToContracts(blueprintId: string, filters?: ContractFilters): Observable<Contract[]> {
    const contractsRef = this.getContractsCollection(blueprintId);
    const constraints: QueryConstraint[] = [];

    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }

    const contractsQuery = query(contractsRef, ...constraints);

    return collectionData(contractsQuery, { idField: 'id' }).pipe(
      map(docs => {
        const contracts = docs.map(data => this.convertTimestamps(data as Record<string, unknown>, data['id'] as string));
        contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return contracts;
      }),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'subscribeToContracts failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Update contract
   */
  async update(blueprintId: string, contractId: string, data: UpdateContractDto): Promise<Contract> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
        updatedBy: data.updatedBy
      };

      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.owner !== undefined) updateData['owner'] = data.owner;
      if (data.contractor !== undefined) updateData['contractor'] = data.contractor;
      if (data.totalAmount !== undefined) updateData['totalAmount'] = data.totalAmount;
      if (data.currency !== undefined) updateData['currency'] = data.currency;
      if (data.startDate !== undefined) updateData['startDate'] = Timestamp.fromDate(data.startDate);
      if (data.endDate !== undefined) updateData['endDate'] = Timestamp.fromDate(data.endDate);
      if (data.terms !== undefined) updateData['terms'] = data.terms;
      if (data.originalFiles !== undefined) updateData['originalFiles'] = this.serializeFileAttachments(data.originalFiles);
      if (data.parsedData !== undefined) updateData['parsedData'] = data.parsedData;
      if (data.lineItems !== undefined) updateData['lineItems'] = data.lineItems;

      await updateDoc(docRef, updateData);

      const snapshot = await getDoc(docRef);
      return this.convertTimestamps(snapshot.data()!, snapshot.id);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateStatus(blueprintId: string, contractId: string, status: ContractStatus): Promise<void> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'active') {
        updateData['activatedAt'] = Timestamp.now();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete contract
   */
  async delete(blueprintId: string, contractId: string): Promise<void> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      await deleteDoc(docRef);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Count contracts by status
   */
  async countByStatus(blueprintId: string): Promise<Record<ContractStatus, number>> {
    try {
      const contractsRef = this.getContractsCollection(blueprintId);
      const snapshot = await getDocs(contractsRef);

      const counts: Record<ContractStatus, number> = {
        draft: 0,
        pending_activation: 0,
        active: 0,
        completed: 0,
        terminated: 0
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data()['status'] as ContractStatus;
        if (status in counts) {
          counts[status]++;
        }
      });

      return counts;
    } catch (error) {
      this.logger.error('[ContractRepository]', 'countByStatus failed', error as Error);
      return {
        draft: 0,
        pending_activation: 0,
        active: 0,
        completed: 0,
        terminated: 0
      };
    }
  }
}
