# SETC-002: Issue Repository Layer Implementation

> **Task ID**: SETC-002  
> **Task Name**: Issue Repository Layer Implementation  
> **Priority**: P1 (Critical)  
> **Estimated Effort**: 2 days  
> **Dependencies**: SETC-001  
> **Status**: 📋 Ready After SETC-001

---

## 📋 Task Overview

Implement the Firestore repository layer for the Issue Module, providing type-safe data access operations, query methods, and transaction handling.

## 🎯 Objectives

1. Create Firestore collection schema
2. Implement repository class with CRUD operations
3. Add query methods with filtering
4. Implement transaction support
5. Add error handling and logging
6. Create unit tests for repository

## 📊 Firestore Schema Design

### Collection Structure

```
/issues/{issueId}
  - id: string
  - blueprintId: string
  - issueNumber: string
  - source: 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety'
  - sourceId: string | null
  - title: string
  - description: string
  - location: string
  - severity: 'critical' | 'major' | 'minor'
  - category: 'quality' | 'safety' | 'warranty' | 'other'
  - responsibleParty: string
  - assignedTo: string (optional)
  - resolution: object (optional)
  - verification: object (optional)
  - status: 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed'
  - beforePhotos: string[]
  - afterPhotos: string[]
  - createdBy: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - resolvedAt: Timestamp (optional)
  - closedAt: Timestamp (optional)
```

### Indexes Required

```javascript
// Composite indexes for common queries
issues
  - blueprintId (Ascending) + status (Ascending)
  - blueprintId (Ascending) + source (Ascending)
  - blueprintId (Ascending) + severity (Ascending)
  - blueprintId (Ascending) + createdAt (Descending)
  - responsibleParty (Ascending) + status (Ascending)
  - assignedTo (Ascending) + status (Ascending)
```

## 📝 Implementation Steps

### Step 1: Create Repository Class

**File**: `repositories/issue.repository.ts`

```typescript
/**
 * Issue Repository
 * 
 * Provides type-safe data access to the Firestore 'issues' collection.
 * Implements CRUD operations, queries, and transaction support.
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  collectionData,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  WhereFilterOp,
  Timestamp,
  writeBatch,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Issue,
  IssueFilters,
  IssueStatus,
  IssueSeverity,
  IssueSource
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueRepository {
  private firestore = inject(Firestore);
  private issuesCollection = collection(this.firestore, 'issues');

  /**
   * Generate a new issue number
   * Format: ISS-0001, ISS-0002, etc.
   */
  async generateIssueNumber(): Promise<string> {
    // Query to get the latest issue number
    const latestQuery = query(
      this.issuesCollection,
      orderBy('issueNumber', 'desc'),
      limit(1)
    );
    
    const snapshot = await from(collectionData(latestQuery)).toPromise();
    
    if (!snapshot || snapshot.length === 0) {
      return 'ISS-0001';
    }
    
    const lastNumber = snapshot[0]['issueNumber'] as string;
    const numberPart = parseInt(lastNumber.split('-')[1], 10);
    const nextNumber = numberPart + 1;
    
    return `ISS-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new issue
   */
  async create(issueData: Omit<Issue, 'id'>): Promise<Issue> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...issueData,
        createdAt: now,
        updatedAt: now,
        resolvedAt: issueData.resolvedAt ? Timestamp.fromDate(issueData.resolvedAt) : null,
        closedAt: issueData.closedAt ? Timestamp.fromDate(issueData.closedAt) : null
      };

      const docRef = await addDoc(this.issuesCollection, docData);
      
      return {
        ...issueData,
        id: docRef.id,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error('Error creating issue:', error);
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
      return createdIssues;
    } catch (error) {
      console.error('Error creating issues batch:', error);
      throw new Error(`Failed to create issues batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find issue by ID
   */
  findById(issueId: string): Observable<Issue | undefined> {
    const issueDoc = doc(this.firestore, 'issues', issueId);
    
    return docData(issueDoc, { idField: 'id' }).pipe(
      map((data) => {
        if (!data) return undefined;
        return this.convertTimestamps(data as any) as Issue;
      })
    );
  }

  /**
   * Find issue by ID (Promise version)
   */
  async findByIdOnce(issueId: string): Promise<Issue | null> {
    return new Promise((resolve) => {
      this.findById(issueId).subscribe({
        next: (issue) => resolve(issue || null),
        error: () => resolve(null)
      });
    });
  }

  /**
   * Find all issues for a blueprint
   */
  findByBlueprint(blueprintId: string, filters?: IssueFilters): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [
      where('blueprintId', '==', blueprintId)
    ];

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
    }

    // Default ordering by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return collectionData(issuesQuery, { idField: 'id' }).pipe(
      map((issues) => issues.map(issue => this.convertTimestamps(issue as any) as Issue))
    );
  }

  /**
   * Update issue
   */
  async update(issueId: string, data: Partial<Issue>): Promise<Issue> {
    try {
      const issueDoc = doc(this.firestore, 'issues', issueId);
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Convert Date objects to Timestamps
      if (data.resolvedAt) {
        updateData.resolvedAt = Timestamp.fromDate(data.resolvedAt);
      }
      if (data.closedAt) {
        updateData.closedAt = Timestamp.fromDate(data.closedAt);
      }

      await updateDoc(issueDoc, updateData);

      const updated = await this.findByIdOnce(issueId);
      if (!updated) {
        throw new Error(`Issue ${issueId} not found after update`);
      }

      return updated;
    } catch (error) {
      console.error(`Error updating issue ${issueId}:`, error);
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete issue
   */
  async delete(issueId: string): Promise<void> {
    try {
      const issueDoc = doc(this.firestore, 'issues', issueId);
      await deleteDoc(issueDoc);
    } catch (error) {
      console.error(`Error deleting issue ${issueId}:`, error);
      throw new Error(`Failed to delete issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find issues by source
   */
  findBySource(blueprintId: string, source: IssueSource): Observable<Issue[]> {
    const issuesQuery = query(
      this.issuesCollection,
      where('blueprintId', '==', blueprintId),
      where('source', '==', source),
      orderBy('createdAt', 'desc')
    );

    return collectionData(issuesQuery, { idField: 'id' }).pipe(
      map((issues) => issues.map(issue => this.convertTimestamps(issue as any) as Issue))
    );
  }

  /**
   * Find issues by responsible party
   */
  findByResponsibleParty(responsibleParty: string, status?: IssueStatus[]): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [
      where('responsibleParty', '==', responsibleParty)
    ];

    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return collectionData(issuesQuery, { idField: 'id' }).pipe(
      map((issues) => issues.map(issue => this.convertTimestamps(issue as any) as Issue))
    );
  }

  /**
   * Find issues by assigned user
   */
  findByAssignedTo(assignedTo: string, status?: IssueStatus[]): Observable<Issue[]> {
    const constraints: QueryConstraint[] = [
      where('assignedTo', '==', assignedTo)
    ];

    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const issuesQuery = query(this.issuesCollection, ...constraints);

    return collectionData(issuesQuery, { idField: 'id' }).pipe(
      map((issues) => issues.map(issue => this.convertTimestamps(issue as any) as Issue))
    );
  }

  /**
   * Count issues by status
   */
  async countByStatus(blueprintId: string): Promise<Record<IssueStatus, number>> {
    const issues = await new Promise<Issue[]>((resolve) => {
      this.findByBlueprint(blueprintId).subscribe({
        next: (data) => resolve(data),
        error: () => resolve([])
      });
    });

    return {
      open: issues.filter(i => i.status === 'open').length,
      in_progress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      verified: issues.filter(i => i.status === 'verified').length,
      closed: issues.filter(i => i.status === 'closed').length
    };
  }

  /**
   * Convert Firestore Timestamps to JavaScript Dates
   */
  private convertTimestamps(data: any): any {
    const converted = { ...data };

    if (converted.createdAt?.toDate) {
      converted.createdAt = converted.createdAt.toDate();
    }
    if (converted.updatedAt?.toDate) {
      converted.updatedAt = converted.updatedAt.toDate();
    }
    if (converted.resolvedAt?.toDate) {
      converted.resolvedAt = converted.resolvedAt.toDate();
    }
    if (converted.closedAt?.toDate) {
      converted.closedAt = converted.closedAt.toDate();
    }

    return converted;
  }
}
```

### Step 2: Update Repository Index

**File**: `repositories/index.ts`

```typescript
export * from './issue.repository';
```

### Step 3: Create Firestore Security Rules

**File**: `firestore.rules` (Update existing rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Issue Collection Rules
    match /issues/{issueId} {
      // Allow authenticated users to read issues
      allow read: if request.auth != null;
      
      // Allow authenticated users to create issues
      allow create: if request.auth != null
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.blueprintId is string
        && request.resource.data.issueNumber is string
        && request.resource.data.source in ['manual', 'acceptance', 'qc', 'warranty', 'safety']
        && request.resource.data.status in ['open', 'in_progress', 'resolved', 'verified', 'closed']
        && request.resource.data.severity in ['critical', 'major', 'minor']
        && request.resource.data.category in ['quality', 'safety', 'warranty', 'other'];
      
      // Allow issue owner or assigned user to update
      allow update: if request.auth != null
        && (resource.data.createdBy == request.auth.uid
           || resource.data.assignedTo == request.auth.uid
           || resource.data.responsibleParty == request.auth.uid);
      
      // Allow only admins or issue creator to delete
      allow delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### Step 4: Create Unit Tests

**File**: `repositories/issue.repository.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { IssueRepository } from './issue.repository';
import { Issue, IssueStatus, IssueSeverity } from '../models';

describe('IssueRepository', () => {
  let repository: IssueRepository;
  let mockFirestore: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    mockFirestore = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    TestBed.configureTestingModule({
      providers: [
        IssueRepository,
        { provide: Firestore, useValue: mockFirestore }
      ]
    });

    repository = TestBed.inject(IssueRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  describe('generateIssueNumber', () => {
    it('should generate ISS-0001 for first issue', async () => {
      // Test implementation
    });

    it('should increment issue number correctly', async () => {
      // Test implementation
    });
  });

  describe('create', () => {
    it('should create an issue with generated ID', async () => {
      // Test implementation
    });

    it('should throw error on creation failure', async () => {
      // Test implementation
    });
  });

  describe('findById', () => {
    it('should return issue when found', (done) => {
      // Test implementation
      done();
    });

    it('should return undefined when not found', (done) => {
      // Test implementation
      done();
    });
  });

  describe('update', () => {
    it('should update issue successfully', async () => {
      // Test implementation
    });

    it('should update timestamp on update', async () => {
      // Test implementation
    });
  });

  describe('delete', () => {
    it('should delete issue successfully', async () => {
      // Test implementation
    });
  });
});
```

## ✅ Acceptance Criteria

- [ ] Repository class implements all CRUD operations
- [ ] Query methods support filtering and sorting
- [ ] Batch operations implemented for bulk creation
- [ ] Proper error handling for all operations
- [ ] Timestamp conversion handled correctly
- [ ] Firestore security rules defined
- [ ] Unit tests written with >80% coverage
- [ ] All tests pass
- [ ] Code passes TypeScript compilation
- [ ] Code passes ESLint validation

## 🧪 Testing Steps

```bash
# 1. Run unit tests
yarn test src/app/core/blueprint/modules/implementations/issue/repositories

# 2. Check test coverage
yarn test-coverage

# 3. Manual Firestore testing (in development environment)
# - Create test issue
# - Query issues
# - Update issue
# - Delete issue
```

## 📦 Deliverables

1. Complete IssueRepository class
2. Firestore security rules
3. Unit tests with good coverage
4. Updated repository index

## 🔗 Next Task

**SETC-003**: Issue Service Layer Implementation
- Implement 5 core services
- Add business logic
- Integrate with repository
- Implement event publishing

---

**Status**: 📋 Ready after SETC-001  
**Estimated completion**: 2 days  
**Dependencies**: SETC-001
