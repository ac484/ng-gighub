# SETC-055: Acceptance Repository Implementation

> **任務編號**: SETC-055  
> **模組**: Acceptance Module (驗收模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-054  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作 Acceptance Module 的 Firestore Repository 層，支援驗收申請、初驗、複驗和結論的完整 CRUD 操作。

### 範圍
- AcceptanceRequestRepository
- PreliminaryAcceptanceRepository
- ReinspectionRepository
- AcceptanceConclusionRepository
- Firestore Security Rules

---

## 🏗️ 技術實作

### Repository 介面定義

```typescript
import { Observable } from 'rxjs';

// 驗收申請 Repository
export interface IAcceptanceRequestRepository {
  create(data: CreateAcceptanceRequestData): Promise<AcceptanceRequest>;
  findById(id: string): Promise<AcceptanceRequest | null>;
  update(id: string, data: UpdateAcceptanceRequestData): Promise<AcceptanceRequest>;
  delete(id: string): Promise<void>;
  
  findByBlueprint(blueprintId: string, filters?: AcceptanceRequestFilters): Promise<AcceptanceRequest[]>;
  findByStatus(blueprintId: string, status: RequestStatus): Promise<AcceptanceRequest[]>;
  findByTask(taskId: string): Promise<AcceptanceRequest[]>;
  
  watchById(id: string): Observable<AcceptanceRequest | null>;
  watchByBlueprint(blueprintId: string): Observable<AcceptanceRequest[]>;
}

// 初驗 Repository
export interface IPreliminaryAcceptanceRepository {
  create(data: CreatePreliminaryData): Promise<PreliminaryAcceptance>;
  findById(id: string): Promise<PreliminaryAcceptance | null>;
  update(id: string, data: UpdatePreliminaryData): Promise<PreliminaryAcceptance>;
  
  findByRequest(requestId: string): Promise<PreliminaryAcceptance | null>;
  findByBlueprint(blueprintId: string): Promise<PreliminaryAcceptance[]>;
  
  watchById(id: string): Observable<PreliminaryAcceptance | null>;
}

// 複驗 Repository
export interface IReinspectionRepository {
  create(data: CreateReinspectionData): Promise<Reinspection>;
  findById(id: string): Promise<Reinspection | null>;
  update(id: string, data: UpdateReinspectionData): Promise<Reinspection>;
  
  findByPreliminary(preliminaryId: string): Promise<Reinspection[]>;
  findByBlueprint(blueprintId: string): Promise<Reinspection[]>;
  
  watchById(id: string): Observable<Reinspection | null>;
}

// 驗收結論 Repository
export interface IAcceptanceConclusionRepository {
  create(data: CreateConclusionData): Promise<AcceptanceConclusion>;
  findById(id: string): Promise<AcceptanceConclusion | null>;
  update(id: string, data: UpdateConclusionData): Promise<AcceptanceConclusion>;
  
  findByRequest(requestId: string): Promise<AcceptanceConclusion | null>;
  findByBlueprint(blueprintId: string): Promise<AcceptanceConclusion[]>;
  
  watchById(id: string): Observable<AcceptanceConclusion | null>;
}
```

### AcceptanceRequestRepository 實作

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { 
  AcceptanceRequest, 
  CreateAcceptanceRequestData,
  UpdateAcceptanceRequestData,
  AcceptanceRequestFilters,
  RequestStatus
} from '../models/acceptance-request.model';

@Injectable({ providedIn: 'root' })
export class AcceptanceRequestRepository {
  private firestore = inject(Firestore);
  private readonly collectionName = 'acceptance_requests';

  /**
   * 建立驗收申請
   */
  async create(data: CreateAcceptanceRequestData): Promise<AcceptanceRequest> {
    const col = collection(this.firestore, this.collectionName);
    
    const requestNumber = await this.generateRequestNumber(data.blueprintId);
    
    const requestData = {
      ...data,
      requestNumber,
      status: 'draft' as RequestStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(col, requestData);
    
    return {
      id: docRef.id,
      ...requestData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AcceptanceRequest;
  }

  /**
   * 根據 ID 查詢
   */
  async findById(id: string): Promise<AcceptanceRequest | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return this.convertToModel(snapshot.id, snapshot.data());
  }

  /**
   * 更新驗收申請
   */
  async update(id: string, data: UpdateAcceptanceRequestData): Promise<AcceptanceRequest> {
    const docRef = doc(this.firestore, this.collectionName, id);
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`AcceptanceRequest ${id} not found after update`);
    }
    
    return updated;
  }

  /**
   * 根據藍圖查詢
   */
  async findByBlueprint(
    blueprintId: string, 
    filters?: AcceptanceRequestFilters
  ): Promise<AcceptanceRequest[]> {
    const col = collection(this.firestore, this.collectionName);
    
    let q = query(
      col,
      where('blueprintId', '==', blueprintId),
      orderBy('createdAt', 'desc')
    );
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters?.requestType) {
      q = query(q, where('requestType', '==', filters.requestType));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertToModel(doc.id, doc.data()));
  }

  /**
   * 即時訂閱
   */
  watchById(id: string): Observable<AcceptanceRequest | null> {
    return new Observable(subscriber => {
      const docRef = doc(this.firestore, this.collectionName, id);
      
      const unsubscribe = onSnapshot(docRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(this.convertToModel(snapshot.id, snapshot.data()));
          } else {
            subscriber.next(null);
          }
        },
        (error) => subscriber.error(error)
      );
      
      return () => unsubscribe();
    });
  }

  /**
   * 即時訂閱藍圖的驗收申請
   */
  watchByBlueprint(blueprintId: string): Observable<AcceptanceRequest[]> {
    return new Observable(subscriber => {
      const col = collection(this.firestore, this.collectionName);
      const q = query(
        col,
        where('blueprintId', '==', blueprintId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const requests = snapshot.docs.map(doc => 
            this.convertToModel(doc.id, doc.data())
          );
          subscriber.next(requests);
        },
        (error) => subscriber.error(error)
      );
      
      return () => unsubscribe();
    });
  }

  // ============ Private Methods ============

  private async generateRequestNumber(blueprintId: string): Promise<string> {
    const requests = await this.findByBlueprint(blueprintId);
    const count = requests.length + 1;
    const year = new Date().getFullYear();
    return `ACC-${year}-${String(count).padStart(4, '0')}`;
  }

  private convertToModel(id: string, data: any): AcceptanceRequest {
    return {
      id,
      ...data,
      requestedAt: data.requestedAt instanceof Timestamp 
        ? data.requestedAt.toDate() 
        : new Date(data.requestedAt),
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt)
    } as AcceptanceRequest;
  }
}
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Acceptance Requests Collection
    match /acceptance_requests/{requestId} {
      allow read: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId);
      
      allow create: if request.auth != null && 
        isBlueprintMember(request.resource.data.blueprintId) &&
        validateAcceptanceRequest(request.resource.data);
      
      allow update: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId);
      
      allow delete: if request.auth != null && 
        isBlueprintAdmin(resource.data.blueprintId);
    }
    
    // Preliminary Acceptance Collection
    match /preliminary_acceptances/{acceptanceId} {
      allow read: if request.auth != null && 
        isBlueprintMemberByRequest(resource.data.requestId);
      
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Reinspections Collection
    match /reinspections/{reinspectionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Acceptance Conclusions Collection
    match /acceptance_conclusions/{conclusionId} {
      allow read: if request.auth != null && 
        isBlueprintMemberByRequest(resource.data.requestId);
      
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Helper Functions
    function validateAcceptanceRequest(data) {
      return data.blueprintId is string &&
             data.title is string &&
             data.requestType in ['preliminary', 'final', 'partial', 'phased'];
    }
    
    function isBlueprintMemberByRequest(requestId) {
      let request = get(/databases/$(database)/documents/acceptance_requests/$(requestId));
      return request != null && 
        isBlueprintMember(request.data.blueprintId);
    }
  }
}
```

---

## 🧪 測試規格

```typescript
import { TestBed } from '@angular/core/testing';
import { AcceptanceRequestRepository } from './acceptance-request.repository';

describe('AcceptanceRequestRepository', () => {
  let repository: AcceptanceRequestRepository;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [AcceptanceRequestRepository]
    });
    repository = TestBed.inject(AcceptanceRequestRepository);
  });

  it('should create acceptance request', async () => {
    const result = await repository.create({
      blueprintId: 'bp-123',
      requestType: 'preliminary',
      title: 'Test Acceptance',
      requestedBy: 'user-123'
    });

    expect(result.id).toBeDefined();
    expect(result.requestNumber).toMatch(/^ACC-\d{4}-\d{4}$/);
    expect(result.status).toBe('draft');
  });

  it('should find by blueprint', async () => {
    const requests = await repository.findByBlueprint('bp-123');
    expect(Array.isArray(requests)).toBe(true);
  });
});
```

---

## ✅ 交付物

- [ ] `acceptance-request.repository.ts`
- [ ] `preliminary.repository.ts`
- [ ] `reinspection.repository.ts`
- [ ] `conclusion.repository.ts`
- [ ] Firestore Security Rules
- [ ] 單元測試

---

## 🎯 驗收標準

1. ✅ 所有 Repository 方法正確實作
2. ✅ Firestore 查詢效能優化
3. ✅ 即時訂閱功能正常
4. ✅ Security Rules 測試通過
5. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
