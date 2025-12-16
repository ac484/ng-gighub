# SETC Implementation 005: Issue Module - Resolution & Verification Services

> **Task ID**: SETC-005  
> **Priority**: P1  
> **Estimated Time**: 8 hours  
> **Dependencies**: SETC-004  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

實現 Issue 的處理與驗證服務，包含完整的生命週期狀態管理。

---

## 🎯 Objectives

1. 實現 IssueResolutionService - 問題處理
2. 實現 IssueVerificationService - 問題驗證
3. 實現 IssueLifecycleService - 生命週期管理
4. 狀態轉換驗證
5. Event Bus 整合

---

## 🔧 Implementation

### IssueResolutionService

```typescript
// services/issue-resolution.service.ts

import { inject, Injectable } from '@angular/core';
import { IssueRepository } from '../repositories/issue.repository';
import {
  Issue,
  CreateIssueResolutionData,
  IssueResolution
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueResolutionService {
  private repository = inject(IssueRepository);
  
  /**
   * 處理問題
   */
  async resolveIssue(
    issueId: string,
    resolutionData: CreateIssueResolutionData
  ): Promise<Issue> {
    const issue = await this.repository.findById(issueId);
    
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    if (issue.status !== 'open' && issue.status !== 'in_progress') {
      throw new Error(`Issue ${issueId} is not in open or in_progress status`);
    }
    
    const resolution: IssueResolution = {
      resolutionMethod: resolutionData.resolutionMethod,
      resolutionDate: new Date(),
      resolvedBy: resolutionData.resolvedBy,
      cost: resolutionData.cost,
      notes: resolutionData.notes,
      evidencePhotos: resolutionData.evidencePhotos,
      resolvedAt: new Date()
    };
    
    await this.repository.update(issueId, {
      resolution,
      status: 'resolved',
      resolvedAt: new Date(),
      updatedAt: new Date()
    });
    
    this.emitEvent('ISSUE_RESOLVED', { issueId, resolution });
    
    const updated = await this.repository.findById(issueId);
    return updated!;
  }
  
  /**
   * 設定問題為處理中
   */
  async markAsInProgress(
    issueId: string,
    userId: string
  ): Promise<Issue> {
    const issue = await this.repository.findById(issueId);
    
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    if (issue.status !== 'open') {
      throw new Error(`Issue ${issueId} is not in open status`);
    }
    
    await this.repository.update(issueId, {
      status: 'in_progress',
      assignedTo: userId,
      updatedAt: new Date()
    });
    
    this.emitEvent('ISSUE_IN_PROGRESS', { issueId, assignedTo: userId });
    
    const updated = await this.repository.findById(issueId);
    return updated!;
  }
  
  private emitEvent(eventType: string, data: any): void {
    console.log(`[IssueResolutionService] Event: ${eventType}`, data);
  }
}
```

### IssueVerificationService

```typescript
// services/issue-verification.service.ts

import { inject, Injectable } from '@angular/core';
import { IssueRepository } from '../repositories/issue.repository';
import {
  Issue,
  CreateIssueVerificationData,
  IssueVerification
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueVerificationService {
  private repository = inject(IssueRepository);
  
  /**
   * 驗證問題處理結果
   */
  async verifyIssue(
    issueId: string,
    verificationData: CreateIssueVerificationData
  ): Promise<Issue> {
    const issue = await this.repository.findById(issueId);
    
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    if (issue.status !== 'resolved') {
      throw new Error(`Issue ${issueId} is not in resolved status`);
    }
    
    const verification: IssueVerification = {
      verifiedBy: verificationData.verifiedBy,
      verifiedAt: new Date(),
      result: verificationData.result,
      notes: verificationData.notes,
      verificationPhotos: verificationData.verificationPhotos
    };
    
    if (verificationData.result === 'approved') {
      // 驗證通過，關閉問題單
      await this.repository.update(issueId, {
        verification,
        status: 'verified',
        closedAt: new Date(),
        updatedAt: new Date()
      });
      
      this.emitEvent('ISSUE_VERIFIED', { issueId });
      this.emitEvent('ISSUE_CLOSED', { issueId });
    } else {
      // 驗證不通過，退回處理中狀態
      await this.repository.update(issueId, {
        verification,
        status: 'in_progress',
        updatedAt: new Date()
      });
      
      this.emitEvent('ISSUE_VERIFICATION_FAILED', { issueId });
    }
    
    const updated = await this.repository.findById(issueId);
    return updated!;
  }
  
  /**
   * 手動關閉問題
   */
  async closeIssue(issueId: string, userId: string): Promise<Issue> {
    const issue = await this.repository.findById(issueId);
    
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    if (issue.status === 'closed') {
      throw new Error(`Issue ${issueId} is already closed`);
    }
    
    await this.repository.update(issueId, {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date()
    });
    
    this.emitEvent('ISSUE_CLOSED', { issueId, closedBy: userId });
    
    const updated = await this.repository.findById(issueId);
    return updated!;
  }
  
  private emitEvent(eventType: string, data: any): void {
    console.log(`[IssueVerificationService] Event: ${eventType}`, data);
  }
}
```

### IssueLifecycleService

```typescript
// services/issue-lifecycle.service.ts

import { inject, Injectable } from '@angular/core';
import { IssueRepository } from '../repositories/issue.repository';
import { Issue, IssueStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class IssueLifecycleService {
  private repository = inject(IssueRepository);
  
  /**
   * 驗證狀態轉換是否有效
   */
  canTransitionTo(
    currentStatus: IssueStatus,
    targetStatus: IssueStatus
  ): boolean {
    const validTransitions: Record<IssueStatus, IssueStatus[]> = {
      open: ['in_progress', 'closed'],
      in_progress: ['resolved', 'open', 'closed'],
      resolved: ['verified', 'in_progress', 'closed'],
      verified: ['closed'],
      closed: [] // 已關閉不能轉換
    };
    
    return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
  }
  
  /**
   * 取得問題的下一個可能狀態
   */
  getNextPossibleStatuses(currentStatus: IssueStatus): IssueStatus[] {
    const validTransitions: Record<IssueStatus, IssueStatus[]> = {
      open: ['in_progress', 'closed'],
      in_progress: ['resolved', 'open', 'closed'],
      resolved: ['verified', 'in_progress', 'closed'],
      verified: ['closed'],
      closed: []
    };
    
    return validTransitions[currentStatus] ?? [];
  }
  
  /**
   * 取得問題進度百分比
   */
  getProgressPercentage(status: IssueStatus): number {
    const progressMap: Record<IssueStatus, number> = {
      open: 0,
      in_progress: 25,
      resolved: 50,
      verified: 75,
      closed: 100
    };
    
    return progressMap[status] ?? 0;
  }
  
  /**
   * 檢查問題是否可以編輯
   */
  canEdit(issue: Issue): boolean {
    return issue.status !== 'closed' && issue.status !== 'verified';
  }
  
  /**
   * 檢查問題是否可以刪除
   */
  canDelete(issue: Issue): boolean {
    return issue.status === 'open';
  }
}
```

---

## ✅ Acceptance Criteria

- [ ] IssueResolutionService 已實現
- [ ] IssueVerificationService 已實現
- [ ] IssueLifecycleService 已實現
- [ ] 狀態轉換驗證正確
- [ ] Event Bus 整合點已預留
- [ ] 單元測試通過（覆蓋率 80%+）
- [ ] 錯誤處理完整

---

## 🔗 Related Tasks

- **Previous**: SETC-004
- **Next**: SETC-006
- **Depends On**: SETC-004
- **Blocks**: SETC-006

---

**Created**: 2025-12-15
