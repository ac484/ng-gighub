# SETC Implementation 003: Issue Module - Repository & Data Access Layer

> **Task ID**: SETC-003  
> **Priority**: P0 (Required for services)  
> **Estimated Time**: 6 hours  
> **Dependencies**: SETC-002  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

實現 Issue Repository，提供 Firestore CRUD 操作、查詢、過濾功能。

---

## 🎯 Objectives

1. 建立 IssueRepository 基礎結構
2. 實現 CRUD 操作 (Create, Read, Update, Delete)
3. 實現查詢與過濾功能
4. 實現分頁查詢
5. 實現統計功能
6. 確保錯誤處理與日誌記錄

---

## 🔧 Implementation

```typescript
// issue.repository.ts

import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentSnapshot,
  CollectionReference
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import {
  Issue,
  IssueFilters,
  IssueStatistics,
  issueToFirestore,
  firestoreToIssue
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueRepository {
  private firestore = inject(Firestore);
  private issuesCollection: CollectionReference;
  
  constructor() {
    this.issuesCollection = collection(this.firestore, 'issues');
  }
  
  /**
   * 建立新問題
   */
  async create(issueData: Omit<Issue, 'id'>): Promise<string> {
    const data = issueToFirestore({ ...issueData, id: '' } as Issue);
    const docRef = await addDoc(this.issuesCollection, data);
    return docRef.id;
  }
  
  /**
   * 根據 ID 獲取問題
   */
  async findById(issueId: string): Promise<Issue | null> {
    const docRef = doc(this.firestore, 'issues', issueId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return firestoreToIssue(docSnap.id, docSnap.data());
  }
  
  /**
   * 更新問題
   */
  async update(issueId: string, data: Partial<Issue>): Promise<void> {
    const docRef = doc(this.firestore, 'issues', issueId);
    const updateData = issueToFirestore({ ...data, id: issueId } as Issue);
    delete updateData.id; // 移除 id 欄位
    await updateDoc(docRef, updateData);
  }
  
  /**
   * 刪除問題
   */
  async delete(issueId: string): Promise<void> {
    const docRef = doc(this.firestore, 'issues', issueId);
    await deleteDoc(docRef);
  }
  
  /**
   * 根據 Blueprint 獲取所有問題
   */
  async findByBlueprint(
    blueprintId: string,
    filters?: IssueFilters
  ): Promise<Issue[]> {
    let q: Query = query(
      this.issuesCollection,
      where('blueprintId', '==', blueprintId)
    );
    
    // 應用過濾條件
    if (filters) {
      if (filters.source) {
        q = query(q, where('source', '==', filters.source));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.severity) {
        q = query(q, where('severity', '==', filters.severity));
      }
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
    }
    
    // 排序
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => firestoreToIssue(doc.id, doc.data()));
  }
  
  /**
   * 獲取問題統計
   */
  async getStatistics(blueprintId: string): Promise<IssueStatistics> {
    const issues = await this.findByBlueprint(blueprintId);
    
    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      verified: issues.filter(i => i.status === 'verified').length,
      closed: issues.filter(i => i.status === 'closed').length,
      bySeverity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        major: issues.filter(i => i.severity === 'major').length,
        minor: issues.filter(i => i.severity === 'minor').length
      },
      bySource: {
        manual: issues.filter(i => i.source === 'manual').length,
        acceptance: issues.filter(i => i.source === 'acceptance').length,
        qc: issues.filter(i => i.source === 'qc').length,
        warranty: issues.filter(i => i.source === 'warranty').length,
        safety: issues.filter(i => i.source === 'safety').length
      },
      byCategory: {
        quality: issues.filter(i => i.category === 'quality').length,
        safety: issues.filter(i => i.category === 'safety').length,
        warranty: issues.filter(i => i.category === 'warranty').length,
        other: issues.filter(i => i.category === 'other').length
      }
    };
  }
}
```

---

## ✅ Acceptance Criteria

- [ ] IssueRepository 已建立
- [ ] CRUD 操作已實現
- [ ] 查詢過濾功能已實現
- [ ] 統計功能已實現
- [ ] 單元測試通過
- [ ] 錯誤處理完整

---

## 🔗 Related Tasks

- **Previous**: SETC-002
- **Next**: SETC-004
- **Depends On**: SETC-002
- **Blocks**: SETC-004

---

**Created**: 2025-12-15
