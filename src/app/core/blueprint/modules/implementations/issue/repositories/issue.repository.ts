/**
 * Issue Repository
 *
 * Provides type-safe data access to the Firestore 'issues' collection.
 * Implements CRUD operations, queries, and transaction support.
 *
 * Collection path: issues/{issueId} (flat structure at root level)
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
  writeBatch,
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import type { Issue, IssueFilters, IssueStatus, IssueSource } from '../models';

@Injectable({ providedIn: 'root' })
export class IssueRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'issues';

  /**
   * Get the issues collection reference
   */
  private get issuesCollection() {
    return collection(this.firestore, this.collectionName);
  }

  /**
   * Helper to get timestamp in milliseconds from various formats
   * Handles both Firestore Timestamp and Date objects consistently
   */
  private getTimeInMs(timestamp: unknown): number {
    if (!timestamp) return 0;
    // Firestore Timestamp
    if (typeof (timestamp as Timestamp).toMillis === 'function') {
      return (timestamp as Timestamp).toMillis();
    }
    // Date object
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    return 0;
  }

  /**
   * Generate a new issue number
   * Format: ISS-0001, ISS-0002, etc.
   * Note: Uses in-memory sorting to avoid composite index requirement
   */
  async generateIssueNumber(blueprintId: string): Promise<string> {
    try {
      // Query all issues for this blueprint (no orderBy to avoid composite index)
      const q = query(this.issuesCollection, where('blueprintId', '==', blueprintId));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 'ISS-0001';
      }

      // Sort in-memory to find the latest issue
      const issues = snapshot.docs.map(docSnap => ({
        issueNumber: docSnap.data()['issueNumber'] as string,
        createdAt: docSnap.data()['createdAt']
      }));

      // Sort by createdAt desc to get the latest
      issues.sort((a, b) => {
        const timeA = this.getTimeInMs(a.createdAt);
        const timeB = this.getTimeInMs(b.createdAt);
        return timeB - timeA;
      });

      // Safe access with fallback
      const lastNumber = issues.length > 0 ? issues[0].issueNumber : undefined;

      if (!lastNumber || !lastNumber.includes('-')) {
        return 'ISS-0001';
      }

      const numberPart = parseInt(lastNumber.split('-')[1], 10);
      const nextNumber = (isNaN(numberPart) ? 0 : numberPart) + 1;

      return `ISS-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('[IssueRepository]', 'generateIssueNumber failed', error as Error);
      // Fallback to timestamp-based number
      return `ISS-${Date.now()}`;
    }
  }

  /**
   * Create a new issue
   */
  async create(data: Omit<Issue, 'id'>): Promise<Issue> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        resolvedAt: data.resolvedAt ? Timestamp.fromDate(data.resolvedAt) : null,
        closedAt: data.closedAt ? Timestamp.fromDate(data.closedAt) : null,
        resolution: data.resolution
          ? {
              ...data.resolution,
              resolutionDate: Timestamp.fromDate(data.resolution.resolutionDate)
            }
          : null,
        verification: data.verification
          ? {
              ...data.verification,
              verifiedAt: Timestamp.fromDate(data.verification.verifiedAt)
            }
          : null
      };

      const docRef = await addDoc(this.issuesCollection, docData);

      this.logger.info('[IssueRepository]', `Issue created: ${docRef.id}`);

      return {
        ...data,
        id: docRef.id,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      this.logger.error('[IssueRepository]', 'create failed', error as Error);
      throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create multiple issues in a batch (for auto-creation scenarios)
   */
  async createBatch(issues: Array<Omit<Issue, 'id'>>): Promise<Issue[]> {
    try {
      const batch = writeBatch(this.firestore);
      const now = Timestamp.now();
      const createdIssues: Issue[] = [];

      for (const issueData of issues) {
        const docRef = doc(this.issuesCollection);
        const docData = {
          ...issueData,
          createdAt: now,
          updatedAt: now,
          resolvedAt: issueData.resolvedAt ? Timestamp.fromDate(issueData.resolvedAt) : null,
          closedAt: issueData.closedAt ? Timestamp.fromDate(issueData.closedAt) : null
        };

        batch.set(docRef, docData);

        createdIssues.push({
          ...issueData,
          id: docRef.id,
          createdAt: now.toDate(),
          updatedAt: now.toDate()
        });
      }

      await batch.commit();
      this.logger.info('[IssueRepository]', `Batch created ${issues.length} issues`);

      return createdIssues;
    } catch (error) {
      this.logger.error('[IssueRepository]', 'createBatch failed', error as Error);
      throw new Error(`Failed to create issues batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find issue by ID (Observable)
   */
  findById(issueId: string): Observable<Issue | null> {
    return from(getDoc(doc(this.firestore, this.collectionName, issueId))).pipe(
      map(snapshot => {
        if (!snapshot.exists()) return null;
        return this.convertTimestamps(snapshot.data(), snapshot.id);
      }),
      catchError(error => {
        this.logger.error('[IssueRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find issue by ID (Promise version)
   */
  async findByIdOnce(issueId: string): Promise<Issue | null> {
    try {
      const snapshot = await getDoc(doc(this.firestore, this.collectionName, issueId));
      if (!snapshot.exists()) return null;
      return this.convertTimestamps(snapshot.data(), snapshot.id);
    } catch (error) {
      this.logger.error('[IssueRepository]', 'findByIdOnce failed', error as Error);
      return null;
    }
  }

  /**
   * Find all issues for a blueprint
   */
  findByBlueprint(blueprintId: string, filters?: IssueFilters): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [where('blueprintId', '==', blueprintId)];

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }
      if (filters.severity && filters.severity.length > 0) {
        constraints.push(where('severity', 'in', filters.severity));
      }
      if (filters.source && filters.source.length > 0) {
        constraints.push(where('source', 'in', filters.source));
      }
      if (filters.responsibleParty) {
        constraints.push(where('responsibleParty', '==', filters.responsibleParty));
      }
      if (filters.assignedTo) {
        constraints.push(where('assignedTo', '==', filters.assignedTo));
      }
      if (filters.createdAfter) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.createdAfter)));
      }
      if (filters.createdBefore) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.createdBefore)));
      }
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
    }

    // Note: orderBy removed to avoid composite index requirement
    // Sorting will be done in-memory instead (acceptable for typical issue counts)

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return from(getDocs(issuesQuery)).pipe(
      map(snapshot => {
        const issues = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort in-memory by createdAt desc (newest first)
        issues.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return issues;
      }),
      catchError(error => {
        this.logger.error('[IssueRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Update issue
   */
  async update(issueId: string, data: Partial<Issue>): Promise<Issue> {
    try {
      const issueDoc = doc(this.firestore, this.collectionName, issueId);
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Convert Date objects to Timestamps
      if (data.resolvedAt) {
        updateData['resolvedAt'] = Timestamp.fromDate(data.resolvedAt);
      }
      if (data.closedAt) {
        updateData['closedAt'] = Timestamp.fromDate(data.closedAt);
      }
      if (data.resolution?.resolutionDate) {
        updateData['resolution'] = {
          ...data.resolution,
          resolutionDate: Timestamp.fromDate(data.resolution.resolutionDate)
        };
      }
      if (data.verification?.verifiedAt) {
        updateData['verification'] = {
          ...data.verification,
          verifiedAt: Timestamp.fromDate(data.verification.verifiedAt)
        };
      }

      // Handle explicit undefined values - use Firestore deleteField for proper deletion
      // For now, we remove undefined values to prevent overwriting with undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Special handling for fields that should be explicitly set to null in Firestore
      // when the caller passes undefined (for reopening issues)
      if (data.resolution === undefined && 'resolution' in data) {
        updateData['resolution'] = null;
      }
      if (data.verification === undefined && 'verification' in data) {
        updateData['verification'] = null;
      }
      if (data.resolvedAt === undefined && 'resolvedAt' in data) {
        updateData['resolvedAt'] = null;
      }
      if (data.closedAt === undefined && 'closedAt' in data) {
        updateData['closedAt'] = null;
      }

      await updateDoc(issueDoc, updateData);

      const updated = await this.findByIdOnce(issueId);
      if (!updated) {
        throw new Error(`Issue ${issueId} not found after update`);
      }

      this.logger.info('[IssueRepository]', `Issue updated: ${issueId}`);
      return updated;
    } catch (error) {
      this.logger.error('[IssueRepository]', 'update failed', error as Error);
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete issue
   */
  async delete(issueId: string): Promise<void> {
    try {
      const issueDoc = doc(this.firestore, this.collectionName, issueId);
      await deleteDoc(issueDoc);
      this.logger.info('[IssueRepository]', `Issue deleted: ${issueId}`);
    } catch (error) {
      this.logger.error('[IssueRepository]', 'delete failed', error as Error);
      throw new Error(`Failed to delete issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find issues by source
   * Note: orderBy removed to avoid composite index requirement
   */
  findBySource(blueprintId: string, source: IssueSource): Observable<Issue[]> {
    const issuesQuery = query(this.issuesCollection, where('blueprintId', '==', blueprintId), where('source', '==', source));

    return from(getDocs(issuesQuery)).pipe(
      map(snapshot => {
        const issues = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort in-memory by createdAt desc (newest first)
        issues.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return issues;
      }),
      catchError(error => {
        this.logger.error('[IssueRepository]', 'findBySource failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find issues by responsible party
   * Note: orderBy removed to avoid composite index requirement
   */
  findByResponsibleParty(blueprintId: string, responsibleParty: string, status?: IssueStatus[]): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [where('blueprintId', '==', blueprintId), where('responsibleParty', '==', responsibleParty)];

    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    // Note: orderBy removed to avoid composite index requirement

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return from(getDocs(issuesQuery)).pipe(
      map(snapshot => {
        const issues = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort in-memory by createdAt desc (newest first)
        issues.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return issues;
      }),
      catchError(error => {
        this.logger.error('[IssueRepository]', 'findByResponsibleParty failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find issues by assigned user
   * Note: orderBy removed to avoid composite index requirement
   */
  findByAssignedTo(blueprintId: string, assignedTo: string, status?: IssueStatus[]): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [where('blueprintId', '==', blueprintId), where('assignedTo', '==', assignedTo)];

    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    // Note: orderBy removed to avoid composite index requirement

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return from(getDocs(issuesQuery)).pipe(
      map(snapshot => {
        const issues = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort in-memory by createdAt desc (newest first)
        issues.sort((a, b) => {
          const timeA = this.getTimeInMs(a.createdAt);
          const timeB = this.getTimeInMs(b.createdAt);
          return timeB - timeA;
        });

        return issues;
      }),
      catchError(error => {
        this.logger.error('[IssueRepository]', 'findByAssignedTo failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Count issues by status for a blueprint
   */
  async countByStatus(blueprintId: string): Promise<Record<IssueStatus, number>> {
    try {
      const q = query(this.issuesCollection, where('blueprintId', '==', blueprintId));
      const snapshot = await getDocs(q);
      const issues = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

      return {
        open: issues.filter(i => i.status === 'open').length,
        in_progress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        verified: issues.filter(i => i.status === 'verified').length,
        closed: issues.filter(i => i.status === 'closed').length
      };
    } catch (error) {
      this.logger.error('[IssueRepository]', 'countByStatus failed', error as Error);
      return {
        open: 0,
        in_progress: 0,
        resolved: 0,
        verified: 0,
        closed: 0
      };
    }
  }

  /**
   * Convert Firestore Timestamps to JavaScript Dates
   */
  private convertTimestamps(data: Record<string, unknown>, id: string): Issue {
    const converted: Record<string, unknown> = { ...data, id };

    // Convert top-level timestamps
    if (converted['createdAt'] instanceof Timestamp) {
      converted['createdAt'] = (converted['createdAt'] as Timestamp).toDate();
    }
    if (converted['updatedAt'] instanceof Timestamp) {
      converted['updatedAt'] = (converted['updatedAt'] as Timestamp).toDate();
    }
    if (converted['resolvedAt'] instanceof Timestamp) {
      converted['resolvedAt'] = (converted['resolvedAt'] as Timestamp).toDate();
    }
    if (converted['closedAt'] instanceof Timestamp) {
      converted['closedAt'] = (converted['closedAt'] as Timestamp).toDate();
    }

    // Convert resolution timestamps
    if (converted['resolution'] && typeof converted['resolution'] === 'object') {
      const resolution = converted['resolution'] as Record<string, unknown>;
      if (resolution['resolutionDate'] instanceof Timestamp) {
        resolution['resolutionDate'] = (resolution['resolutionDate'] as Timestamp).toDate();
      }
      converted['resolution'] = resolution;
    }

    // Convert verification timestamps
    if (converted['verification'] && typeof converted['verification'] === 'object') {
      const verification = converted['verification'] as Record<string, unknown>;
      if (verification['verifiedAt'] instanceof Timestamp) {
        verification['verifiedAt'] = (verification['verifiedAt'] as Timestamp).toDate();
      }
      converted['verification'] = verification;
    }

    return converted as unknown as Issue;
  }
}
