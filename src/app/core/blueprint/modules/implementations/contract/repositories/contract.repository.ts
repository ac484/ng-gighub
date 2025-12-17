/**
 * Contract Repository
 *
 * Provides type-safe data access to the Firestore contracts subcollection.
 * Implements CRUD operations, queries, and real-time subscription support.
 *
 * Collection path: blueprints/{blueprintId}/contracts/{contractId}
 *
 * @author GigHub Development Team
 * @date 2025-12-15
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
  limit,
  Timestamp,
  QueryConstraint,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';

import type {
  Contract,
  ContractFilters,
  ContractStatus,
  FileAttachment,
  ContractParsedData,
  ContractWorkItem,
  CreateContractDto,
  UpdateContractDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class ContractRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly contractsSubcollection = 'contracts';

  /**
   * Get contracts subcollection reference for a blueprint
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
   * Helper to get timestamp in milliseconds from various formats
   */
  private getTimeInMs(timestamp: unknown): number {
    if (!timestamp) return 0;
    if (typeof (timestamp as Timestamp).toMillis === 'function') {
      return (timestamp as Timestamp).toMillis();
    }
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    return 0;
  }

  /**
   * Generate a new contract number
   * Format: CON-0001, CON-0002, etc.
   */
  async generateContractNumber(blueprintId: string): Promise<string> {
    try {
      const contractsRef = this.getContractsCollection(blueprintId);
      const q = query(contractsRef);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 'CON-0001';
      }

      // Sort in-memory to find the latest contract
      const contracts = snapshot.docs.map(docSnap => ({
        contractNumber: docSnap.data()['contractNumber'] as string,
        createdAt: docSnap.data()['createdAt']
      }));

      contracts.sort((a, b) => {
        const timeA = this.getTimeInMs(a.createdAt);
        const timeB = this.getTimeInMs(b.createdAt);
        return timeB - timeA;
      });

      const lastNumber = contracts.length > 0 ? contracts[0].contractNumber : undefined;

      if (!lastNumber || !lastNumber.includes('-')) {
        return 'CON-0001';
      }

      const numberPart = parseInt(lastNumber.split('-')[1], 10);
      const nextNumber = (isNaN(numberPart) ? 0 : numberPart) + 1;

      return `CON-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('[ContractRepository]', 'generateContractNumber failed', error as Error);
      return `CON-${Date.now()}`;
    }
  }

  /**
   * Create a new contract
   */
  async create(blueprintId: string, data: CreateContractDto): Promise<Contract> {
    try {
      const now = Timestamp.now();
      const contractNumber = data.contractNumber || (await this.generateContractNumber(blueprintId));

      const docData = {
        blueprintId,
        contractNumber,
        title: data.title,
        description: data.description || null,
        owner: data.owner,
        contractor: data.contractor,
        totalAmount: data.totalAmount,
        currency: data.currency || 'TWD',
        workItems: [] as ContractWorkItem[],
        terms: data.terms || [],
        status: 'draft' as ContractStatus,
        signedDate: data.signedDate ? Timestamp.fromDate(data.signedDate) : null,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        originalFiles: [] as FileAttachment[],
        parsedData: null as ContractParsedData | null,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now
      };

      const contractsRef = this.getContractsCollection(blueprintId);
      const docRef = await addDoc(contractsRef, docData);

      this.logger.info('[ContractRepository]', `Contract created: ${docRef.id}`);

      return {
        id: docRef.id,
        blueprintId,
        contractNumber,
        title: data.title,
        description: data.description,
        owner: data.owner,
        contractor: data.contractor,
        totalAmount: data.totalAmount,
        currency: data.currency || 'TWD',
        workItems: [],
        terms: data.terms || [],
        status: 'draft',
        signedDate: data.signedDate,
        startDate: data.startDate,
        endDate: data.endDate,
        originalFiles: [],
        createdBy: data.createdBy,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      this.logger.error('[ContractRepository]', 'create failed', error as Error);
      throw new Error(`Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find contract by ID (Promise version)
   * Also loads work items from subcollection
   */
  async findByIdOnce(blueprintId: string, contractId: string): Promise<Contract | null> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const contract = this.convertTimestamps(snapshot.data(), snapshot.id);

      // Load work items from subcollection
      const workItemsRef = collection(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, 'workItems');
      const workItemsSnapshot = await getDocs(workItemsRef);

      contract.workItems = workItemsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contractId,
          code: data['code'],
          name: data['name'],
          description: data['description'] || '',
          category: data['category'],
          unit: data['unit'],
          quantity: data['quantity'],
          unitPrice: data['unitPrice'],
          totalPrice: data['totalPrice'],
          linkedTaskIds: data['linkedTaskIds'] || [],
          completedQuantity: data['completedQuantity'] || 0,
          completedAmount: data['completedAmount'] || 0,
          completionPercentage: data['completionPercentage'] || 0,
          createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(data['createdAt']),
          updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'].toDate() : new Date(data['updatedAt'])
        } as ContractWorkItem;
      });

      return contract;
    } catch (error) {
      this.logger.error('[ContractRepository]', 'findByIdOnce failed', error as Error);
      return null;
    }
  }

  /**
   * Find contract by ID (Observable version for real-time updates)
   */
  findById(blueprintId: string, contractId: string): Observable<Contract | null> {
    const docRef = this.getContractDocRef(blueprintId, contractId);

    return from(getDoc(docRef)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) return null;
        return this.convertTimestamps(snapshot.data(), snapshot.id);
      }),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Subscribe to real-time contract updates
   */
  subscribeToContract(blueprintId: string, contractId: string): Observable<Contract | null> {
    const docRef = this.getContractDocRef(blueprintId, contractId);

    return docData(docRef, { idField: 'id' }).pipe(
      map(data => {
        if (!data) return null;
        return this.convertTimestamps(data as Record<string, unknown>, data['id'] as string);
      }),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'subscribeToContract failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find all contracts for a blueprint
   * Also loads work items count for each contract
   */
  findByBlueprint(blueprintId: string, filters?: ContractFilters): Observable<Contract[]> {
    const contractsRef = this.getContractsCollection(blueprintId);
    const constraints: QueryConstraint[] = [];

    // Apply filters
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
      if (filters.startDateAfter) {
        constraints.push(where('startDate', '>=', Timestamp.fromDate(filters.startDateAfter)));
      }
      if (filters.startDateBefore) {
        constraints.push(where('startDate', '<=', Timestamp.fromDate(filters.startDateBefore)));
      }
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
    }

    const contractsQuery = query(contractsRef, ...constraints);

    return from(getDocs(contractsQuery)).pipe(
      map(async snapshot => {
        const contracts = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Load work items for each contract
        await Promise.all(
          contracts.map(async contract => {
            const workItemsRef = collection(this.firestore, 'blueprints', blueprintId, 'contracts', contract.id, 'workItems');
            const workItemsSnapshot = await getDocs(workItemsRef);

            contract.workItems = workItemsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                contractId: contract.id,
                code: data['code'],
                name: data['name'],
                description: data['description'] || '',
                category: data['category'],
                unit: data['unit'],
                quantity: data['quantity'],
                unitPrice: data['unitPrice'],
                totalPrice: data['totalPrice'],
                linkedTaskIds: data['linkedTaskIds'] || [],
                completedQuantity: data['completedQuantity'] || 0,
                completedAmount: data['completedAmount'] || 0,
                completionPercentage: data['completionPercentage'] || 0,
                createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(data['createdAt']),
                updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'].toDate() : new Date(data['updatedAt'])
              } as ContractWorkItem;
            });
          })
        );

        // Sort in-memory by createdAt desc (newest first)
        contracts.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return contracts;
      }),
      // Flatten the promise into observable
      map(promise => from(promise)),
      // Unwrap the inner observable
      switchMap(obs => obs),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Subscribe to real-time contracts list updates
   */
  subscribeToContracts(blueprintId: string, filters?: ContractFilters): Observable<Contract[]> {
    const contractsRef = this.getContractsCollection(blueprintId);
    const constraints: QueryConstraint[] = [];

    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const contractsQuery = query(contractsRef, ...constraints);

    return collectionData(contractsQuery, { idField: 'id' }).pipe(
      map(docs => {
        const contracts = docs.map(data => this.convertTimestamps(data as Record<string, unknown>, data['id'] as string));

        contracts.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return contracts;
      }),
      catchError(error => {
        this.logger.error('[ContractRepository]', 'subscribeToContracts failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Update a contract
   */
  async update(blueprintId: string, contractId: string, data: UpdateContractDto): Promise<Contract> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Convert Date objects to Timestamps
      if (data.signedDate) {
        updateData['signedDate'] = Timestamp.fromDate(data.signedDate);
      }
      if (data.startDate) {
        updateData['startDate'] = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData['endDate'] = Timestamp.fromDate(data.endDate);
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(docRef, updateData);

      const updated = await this.findByIdOnce(blueprintId, contractId);
      if (!updated) {
        throw new Error(`Contract ${contractId} not found after update`);
      }

      this.logger.info('[ContractRepository]', `Contract updated: ${contractId}`);
      return updated;
    } catch (error) {
      this.logger.error('[ContractRepository]', 'update failed', error as Error);
      throw new Error(`Failed to update contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update contract status
   */
  async updateStatus(blueprintId: string, contractId: string, status: ContractStatus): Promise<void> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });

      this.logger.info('[ContractRepository]', `Contract status updated: ${contractId} -> ${status}`);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'updateStatus failed', error as Error);
      throw new Error(`Failed to update contract status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a contract
   */
  async delete(blueprintId: string, contractId: string): Promise<void> {
    try {
      const docRef = this.getContractDocRef(blueprintId, contractId);
      await deleteDoc(docRef);
      this.logger.info('[ContractRepository]', `Contract deleted: ${contractId}`);
    } catch (error) {
      this.logger.error('[ContractRepository]', 'delete failed', error as Error);
      throw new Error(`Failed to delete contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find contracts by status
   */
  findByStatus(blueprintId: string, status: ContractStatus): Observable<Contract[]> {
    return this.findByBlueprint(blueprintId, { status: [status] });
  }

  /**
   * Count contracts by status
   */
  async countByStatus(blueprintId: string): Promise<Record<ContractStatus, number>> {
    try {
      const contractsRef = this.getContractsCollection(blueprintId);
      const q = query(contractsRef);
      const snapshot = await getDocs(q);
      const contracts = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

      return {
        draft: contracts.filter(c => c.status === 'draft').length,
        pending_activation: contracts.filter(c => c.status === 'pending_activation').length,
        active: contracts.filter(c => c.status === 'active').length,
        completed: contracts.filter(c => c.status === 'completed').length,
        terminated: contracts.filter(c => c.status === 'terminated').length
      };
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

  /**
   * Convert Firestore Timestamps to JavaScript Dates
   */
  private convertTimestamps(data: Record<string, unknown>, id: string): Contract {
    const converted: Record<string, unknown> = { ...data, id };

    // Convert top-level timestamps
    if (converted['createdAt'] instanceof Timestamp) {
      converted['createdAt'] = (converted['createdAt'] as Timestamp).toDate();
    }
    if (converted['updatedAt'] instanceof Timestamp) {
      converted['updatedAt'] = (converted['updatedAt'] as Timestamp).toDate();
    }
    if (converted['signedDate'] instanceof Timestamp) {
      converted['signedDate'] = (converted['signedDate'] as Timestamp).toDate();
    }
    if (converted['startDate'] instanceof Timestamp) {
      converted['startDate'] = (converted['startDate'] as Timestamp).toDate();
    }
    if (converted['endDate'] instanceof Timestamp) {
      converted['endDate'] = (converted['endDate'] as Timestamp).toDate();
    }

    // Handle null values for optional fields
    if (converted['signedDate'] === null) {
      delete converted['signedDate'];
    }
    if (converted['description'] === null) {
      delete converted['description'];
    }

    return converted as unknown as Contract;
  }
}
