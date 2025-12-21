# SETC Implementation 002: Issue Module - Data Models & Interfaces

> **Task ID**: SETC-002  
> **Priority**: P0 (Blocker for services)  
> **Estimated Time**: 6 hours  
> **Dependencies**: SETC-001  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

建立 Issue Module 的所有資料模型、TypeScript 介面、型別定義，確保型別安全與資料一致性。

---

## 🎯 Objectives

1. 建立 Issue 主模型
2. 建立 IssueResolution 模型
3. 建立 IssueVerification 模型
4. 建立型別定義 (IssueSource, IssueSeverity, IssueStatus, etc.)
5. 建立輔助介面 (CreateIssueData, IssueFilters, IssueStatistics)
6. 確保所有型別符合 Firestore schema

---

## 📁 Files to Create

```
src/app/core/blueprint/modules/implementations/issue/models/
├── index.ts
├── issue.model.ts
├── issue-resolution.model.ts
├── issue-verification.model.ts
├── issue.types.ts
└── issue.interfaces.ts
```

---

## 🔧 Implementation Steps

### Step 1: 建立型別定義 (issue.types.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/issue.types.ts

/**
 * Issue 來源類型
 * 
 * - manual: 手動建立
 * - acceptance: 從驗收失敗自動建立
 * - qc: 從 QC 檢查失敗自動建立
 * - warranty: 從保固缺失自動建立
 * - safety: 從安全事故自動建立
 */
export type IssueSource = 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety';

/**
 * Issue 嚴重程度
 * 
 * - critical: 關鍵（阻斷性問題）
 * - major: 重要（主要問題）
 * - minor: 次要（小問題）
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Issue 類別
 * 
 * - quality: 品質問題
 * - safety: 安全問題
 * - warranty: 保固問題
 * - other: 其他問題
 */
export type IssueCategory = 'quality' | 'safety' | 'warranty' | 'other';

/**
 * Issue 狀態
 * 
 * - open: 開啟（剛建立）
 * - in_progress: 處理中
 * - resolved: 已解決（待驗證）
 * - verified: 已驗證（驗證通過）
 * - closed: 已關閉（完成）
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

/**
 * 驗證結果
 * 
 * - approved: 驗證通過
 * - rejected: 驗證不通過
 */
export type VerificationResult = 'approved' | 'rejected';

/**
 * Issue 來源顯示名稱映射
 */
export const ISSUE_SOURCE_LABELS: Record<IssueSource, string> = {
  manual: '手動建立',
  acceptance: '驗收失敗',
  qc: 'QC 檢查',
  warranty: '保固缺失',
  safety: '安全事故'
};

/**
 * Issue 嚴重程度顯示名稱映射
 */
export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: '關鍵',
  major: '重要',
  minor: '次要'
};

/**
 * Issue 狀態顯示名稱映射
 */
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '開啟',
  in_progress: '處理中',
  resolved: '已解決',
  verified: '已驗證',
  closed: '已關閉'
};

/**
 * Issue 嚴重程度顏色映射 (用於 UI 顯示)
 */
export const ISSUE_SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: 'error',    // 紅色
  major: 'warning',     // 橙色
  minor: 'default'      // 灰色
};

/**
 * Issue 狀態顏色映射 (用於 UI 顯示)
 */
export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  open: 'default',      // 灰色
  in_progress: 'processing', // 藍色
  resolved: 'warning',  // 橙色
  verified: 'success',  // 綠色
  closed: 'success'     // 綠色
};
```

### Step 2: 建立 Issue Resolution 模型 (issue-resolution.model.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/issue-resolution.model.ts

import { Timestamp } from '@angular/fire/firestore';

/**
 * Issue 處理方案
 * 
 * 記錄問題的處理方法、成本、證據照片等資訊
 */
export interface IssueResolution {
  /**
   * 處理方法描述
   */
  resolutionMethod: string;
  
  /**
   * 處理日期
   */
  resolutionDate: Date | Timestamp;
  
  /**
   * 處理人員 ID
   */
  resolvedBy: string;
  
  /**
   * 處理成本（選填）
   */
  cost?: number;
  
  /**
   * 備註說明
   */
  notes: string;
  
  /**
   * 證據照片 URL 陣列
   */
  evidencePhotos: string[];
  
  /**
   * 處理完成時間
   */
  resolvedAt: Date | Timestamp;
}

/**
 * 建立 Issue Resolution 的資料
 */
export interface CreateIssueResolutionData {
  resolutionMethod: string;
  resolvedBy: string;
  cost?: number;
  notes: string;
  evidencePhotos: string[];
}

/**
 * Issue Resolution 轉換為 Firestore 格式
 */
export function issueResolutionToFirestore(resolution: IssueResolution): any {
  return {
    resolutionMethod: resolution.resolutionMethod,
    resolutionDate: resolution.resolutionDate instanceof Date
      ? Timestamp.fromDate(resolution.resolutionDate)
      : resolution.resolutionDate,
    resolvedBy: resolution.resolvedBy,
    cost: resolution.cost ?? null,
    notes: resolution.notes,
    evidencePhotos: resolution.evidencePhotos,
    resolvedAt: resolution.resolvedAt instanceof Date
      ? Timestamp.fromDate(resolution.resolvedAt)
      : resolution.resolvedAt
  };
}

/**
 * Firestore 資料轉換為 Issue Resolution
 */
export function firestoreToIssueResolution(data: any): IssueResolution {
  return {
    resolutionMethod: data.resolutionMethod,
    resolutionDate: data.resolutionDate?.toDate() ?? data.resolutionDate,
    resolvedBy: data.resolvedBy,
    cost: data.cost ?? undefined,
    notes: data.notes,
    evidencePhotos: data.evidencePhotos ?? [],
    resolvedAt: data.resolvedAt?.toDate() ?? data.resolvedAt
  };
}
```

### Step 3: 建立 Issue Verification 模型 (issue-verification.model.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/issue-verification.model.ts

import { Timestamp } from '@angular/fire/firestore';
import { VerificationResult } from './issue.types';

/**
 * Issue 驗證記錄
 * 
 * 記錄問題處理後的驗證結果
 */
export interface IssueVerification {
  /**
   * 驗證人員 ID
   */
  verifiedBy: string;
  
  /**
   * 驗證時間
   */
  verifiedAt: Date | Timestamp;
  
  /**
   * 驗證結果
   */
  result: VerificationResult;
  
  /**
   * 驗證備註
   */
  notes: string;
  
  /**
   * 驗證照片 URL 陣列
   */
  verificationPhotos: string[];
}

/**
 * 建立 Issue Verification 的資料
 */
export interface CreateIssueVerificationData {
  verifiedBy: string;
  result: VerificationResult;
  notes: string;
  verificationPhotos: string[];
}

/**
 * Issue Verification 轉換為 Firestore 格式
 */
export function issueVerificationToFirestore(verification: IssueVerification): any {
  return {
    verifiedBy: verification.verifiedBy,
    verifiedAt: verification.verifiedAt instanceof Date
      ? Timestamp.fromDate(verification.verifiedAt)
      : verification.verifiedAt,
    result: verification.result,
    notes: verification.notes,
    verificationPhotos: verification.verificationPhotos
  };
}

/**
 * Firestore 資料轉換為 Issue Verification
 */
export function firestoreToIssueVerification(data: any): IssueVerification {
  return {
    verifiedBy: data.verifiedBy,
    verifiedAt: data.verifiedAt?.toDate() ?? data.verifiedAt,
    result: data.result,
    notes: data.notes,
    verificationPhotos: data.verificationPhotos ?? []
  };
}
```

### Step 4: 建立 Issue 主模型 (issue.model.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/issue.model.ts

import { Timestamp } from '@angular/fire/firestore';
import {
  IssueSource,
  IssueSeverity,
  IssueCategory,
  IssueStatus
} from './issue.types';
import { IssueResolution, firestoreToIssueResolution, issueResolutionToFirestore } from './issue-resolution.model';
import { IssueVerification, firestoreToIssueVerification, issueVerificationToFirestore } from './issue-verification.model';

/**
 * Issue 主模型
 * 
 * 獨立的問題追蹤記錄，支援多來源建立
 */
export interface Issue {
  /**
   * Issue ID (Firestore document ID)
   */
  id: string;
  
  /**
   * Blueprint ID
   */
  blueprintId: string;
  
  /**
   * Issue 編號 (自動生成，格式: ISS-YYYYMMDD-XXXX)
   */
  issueNumber: string;
  
  // === 來源資訊 ===
  
  /**
   * Issue 來源
   */
  source: IssueSource;
  
  /**
   * 來源記錄 ID（手動建立時為 null）
   */
  sourceId: string | null;
  
  // === 問題資訊 ===
  
  /**
   * 問題標題
   */
  title: string;
  
  /**
   * 問題描述
   */
  description: string;
  
  /**
   * 問題位置
   */
  location: string;
  
  /**
   * 嚴重程度
   */
  severity: IssueSeverity;
  
  /**
   * 問題類別
   */
  category: IssueCategory;
  
  // === 責任歸屬 ===
  
  /**
   * 負責處理方（通常是承商）
   */
  responsibleParty: string;
  
  /**
   * 指派給具體人員 (選填)
   */
  assignedTo?: string;
  
  // === 處理與驗證 ===
  
  /**
   * 處理方案 (選填，處理後才有)
   */
  resolution?: IssueResolution;
  
  /**
   * 驗證記錄 (選填，驗證後才有)
   */
  verification?: IssueVerification;
  
  // === 狀態 ===
  
  /**
   * Issue 狀態
   */
  status: IssueStatus;
  
  // === 照片 ===
  
  /**
   * 問題發現時的照片
   */
  beforePhotos: string[];
  
  /**
   * 處理後的照片
   */
  afterPhotos: string[];
  
  // === 審計資訊 ===
  
  /**
   * 建立人員 ID
   */
  createdBy: string;
  
  /**
   * 建立時間
   */
  createdAt: Date | Timestamp;
  
  /**
   * 最後更新時間
   */
  updatedAt: Date | Timestamp;
  
  /**
   * 解決時間 (選填)
   */
  resolvedAt?: Date | Timestamp;
  
  /**
   * 關閉時間 (選填)
   */
  closedAt?: Date | Timestamp;
}

/**
 * Issue 轉換為 Firestore 格式
 */
export function issueToFirestore(issue: Issue): any {
  const data: any = {
    blueprintId: issue.blueprintId,
    issueNumber: issue.issueNumber,
    source: issue.source,
    sourceId: issue.sourceId,
    title: issue.title,
    description: issue.description,
    location: issue.location,
    severity: issue.severity,
    category: issue.category,
    responsibleParty: issue.responsibleParty,
    assignedTo: issue.assignedTo ?? null,
    status: issue.status,
    beforePhotos: issue.beforePhotos ?? [],
    afterPhotos: issue.afterPhotos ?? [],
    createdBy: issue.createdBy,
    createdAt: issue.createdAt instanceof Date
      ? Timestamp.fromDate(issue.createdAt)
      : issue.createdAt,
    updatedAt: issue.updatedAt instanceof Date
      ? Timestamp.fromDate(issue.updatedAt)
      : issue.updatedAt
  };
  
  if (issue.resolution) {
    data.resolution = issueResolutionToFirestore(issue.resolution);
  }
  
  if (issue.verification) {
    data.verification = issueVerificationToFirestore(issue.verification);
  }
  
  if (issue.resolvedAt) {
    data.resolvedAt = issue.resolvedAt instanceof Date
      ? Timestamp.fromDate(issue.resolvedAt)
      : issue.resolvedAt;
  }
  
  if (issue.closedAt) {
    data.closedAt = issue.closedAt instanceof Date
      ? Timestamp.fromDate(issue.closedAt)
      : issue.closedAt;
  }
  
  return data;
}

/**
 * Firestore 資料轉換為 Issue
 */
export function firestoreToIssue(id: string, data: any): Issue {
  return {
    id,
    blueprintId: data.blueprintId,
    issueNumber: data.issueNumber,
    source: data.source,
    sourceId: data.sourceId ?? null,
    title: data.title,
    description: data.description,
    location: data.location,
    severity: data.severity,
    category: data.category,
    responsibleParty: data.responsibleParty,
    assignedTo: data.assignedTo ?? undefined,
    resolution: data.resolution ? firestoreToIssueResolution(data.resolution) : undefined,
    verification: data.verification ? firestoreToIssueVerification(data.verification) : undefined,
    status: data.status,
    beforePhotos: data.beforePhotos ?? [],
    afterPhotos: data.afterPhotos ?? [],
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate() ?? data.updatedAt,
    resolvedAt: data.resolvedAt?.toDate() ?? undefined,
    closedAt: data.closedAt?.toDate() ?? undefined
  };
}
```

### Step 5: 建立輔助介面 (issue.interfaces.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/issue.interfaces.ts

import { IssueSource, IssueSeverity, IssueCategory, IssueStatus } from './issue.types';

/**
 * 建立 Issue 的資料 (手動建立)
 */
export interface CreateIssueData {
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  category: IssueCategory;
  responsibleParty: string;
  assignedTo?: string;
  beforePhotos?: string[];
  createdBy: string;
}

/**
 * 從 Acceptance 失敗自動建立 Issue 的參數
 */
export interface IssueFromAcceptanceParams {
  acceptanceId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * 從 QC 檢查失敗自動建立 Issue 的參數
 */
export interface IssueFromQCParams {
  inspectionId: string;
  blueprintId: string;
  failedItems: Array<{
    itemName: string;
    location: string;
    notes?: string;
    photos?: string[];
  }>;
  contractorId: string;
  inspectorId: string;
}

/**
 * 從 Warranty 缺失建立 Issue 的參數
 */
export interface IssueFromWarrantyParams {
  warrantyDefectId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  warrantor: string;
  photos?: string[];
  reportedBy: string;
}

/**
 * 從 Safety 事故建立 Issue 的參數
 */
export interface IssueFromSafetyParams {
  incidentId: string;
  blueprintId: string;
  title: string;
  description: string;
  location: string;
  severity: IssueSeverity;
  responsibleParty: string;
  photos?: string[];
  reportedBy: string;
}

/**
 * Issue 查詢過濾條件
 */
export interface IssueFilters {
  source?: IssueSource;
  status?: IssueStatus;
  severity?: IssueSeverity;
  category?: IssueCategory;
  assignedTo?: string;
  responsibleParty?: string;
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Issue 統計資訊
 */
export interface IssueStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  closed: number;
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
  };
  bySource: {
    manual: number;
    acceptance: number;
    qc: number;
    warranty: number;
    safety: number;
  };
  byCategory: {
    quality: number;
    safety: number;
    warranty: number;
    other: number;
  };
}

/**
 * Issue 清單查詢結果
 */
export interface IssueListResult {
  issues: Issue[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### Step 6: 建立 models/index.ts

```typescript
// src/app/core/blueprint/modules/implementations/issue/models/index.ts

export * from './issue.model';
export * from './issue-resolution.model';
export * from './issue-verification.model';
export * from './issue.types';
export * from './issue.interfaces';
```

---

## ✅ Acceptance Criteria

- [ ] 所有型別定義已建立 (IssueSource, IssueSeverity, IssueStatus, etc.)
- [ ] Issue 主模型已建立並包含所有必要欄位
- [ ] IssueResolution 模型已建立
- [ ] IssueVerification 模型已建立
- [ ] 輔助介面已建立 (CreateIssueData, IssueFromXXXParams, etc.)
- [ ] Firestore 轉換函式已實現
- [ ] 所有模型符合 TypeScript strict mode
- [ ] 執行 `ng build` 無錯誤
- [ ] 執行 `npm run lint` 無錯誤

---

## 🧪 Testing

### Unit Tests

```typescript
// issue.model.spec.ts
import { Issue, issueToFirestore, firestoreToIssue } from './issue.model';
import { Timestamp } from '@angular/fire/firestore';

describe('Issue Model', () => {
  const mockIssue: Issue = {
    id: 'test-issue-id',
    blueprintId: 'test-blueprint-id',
    issueNumber: 'ISS-20251215-0001',
    source: 'manual',
    sourceId: null,
    title: 'Test Issue',
    description: 'Test Description',
    location: 'Test Location',
    severity: 'major',
    category: 'quality',
    responsibleParty: 'contractor-id',
    status: 'open',
    beforePhotos: [],
    afterPhotos: [],
    createdBy: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should convert Issue to Firestore format', () => {
    const firestoreData = issueToFirestore(mockIssue);
    
    expect(firestoreData.blueprintId).toBe(mockIssue.blueprintId);
    expect(firestoreData.issueNumber).toBe(mockIssue.issueNumber);
    expect(firestoreData.source).toBe(mockIssue.source);
    expect(firestoreData.createdAt).toBeInstanceOf(Timestamp);
  });

  it('should convert Firestore data to Issue', () => {
    const firestoreData = issueToFirestore(mockIssue);
    const issue = firestoreToIssue('test-issue-id', firestoreData);
    
    expect(issue.id).toBe('test-issue-id');
    expect(issue.blueprintId).toBe(mockIssue.blueprintId);
    expect(issue.source).toBe(mockIssue.source);
    expect(issue.createdAt).toBeInstanceOf(Date);
  });
});
```

---

## 📝 Notes

- 所有日期欄位使用 `Date | Timestamp` 聯合型別以支援 Firestore
- `sourceId` 為 nullable，手動建立時為 null
- 使用嚴格的型別定義確保資料一致性
- 提供 Firestore 轉換函式簡化資料存取層實現

---

## 🔗 Related Tasks

- **Previous**: SETC-001 (Project Setup)
- **Next**: SETC-003 (Repository Implementation)
- **Depends On**: SETC-001
- **Blocks**: SETC-003, SETC-004

---

**Created**: 2025-12-15  
**Updated**: 2025-12-15  
**Author**: GitHub Copilot  
**Reviewer**: TBD
