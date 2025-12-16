# SETC Implementation 006: Issue Module - Event System Integration

> **Task ID**: SETC-006  
> **Priority**: P1  
> **Estimated Time**: 6 hours  
> **Dependencies**: SETC-005  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

整合 Issue Module 與 Blueprint Event Bus，實現事件驅動的模組間通訊。

---

## 🎯 Objectives

1. 定義 Issue Module 事件類型
2. 整合 Event Bus
3. 實現事件發送
4. 實現事件監聽（與其他模組整合）
5. 測試事件流

---

## 🔧 Implementation

### Issue Events Definition

```typescript
// config/issue.events.ts

export const ISSUE_MODULE_EVENTS = {
  // 建立事件
  ISSUE_CREATED: 'issue.created',
  ISSUE_CREATED_MANUAL: 'issue.created_manual',
  ISSUES_CREATED_FROM_ACCEPTANCE: 'issue.created_from_acceptance',
  ISSUES_CREATED_FROM_QC: 'issue.created_from_qc',
  ISSUE_CREATED_FROM_WARRANTY: 'issue.created_from_warranty',
  ISSUE_CREATED_FROM_SAFETY: 'issue.created_from_safety',
  
  // 處理事件
  ISSUE_UPDATED: 'issue.updated',
  ISSUE_ASSIGNED: 'issue.assigned',
  ISSUE_IN_PROGRESS: 'issue.in_progress',
  ISSUE_RESOLVED: 'issue.resolved',
  ISSUE_VERIFICATION_FAILED: 'issue.verification_failed',
  ISSUE_VERIFIED: 'issue.verified',
  ISSUE_CLOSED: 'issue.closed',
  
  // 批次事件
  ISSUES_BATCH_CREATED: 'issue.batch_created',
  ISSUES_BATCH_CLOSED: 'issue.batch_closed'
} as const;

export type IssueEventType = typeof ISSUE_MODULE_EVENTS[keyof typeof ISSUE_MODULE_EVENTS];
```

### Event Bus Integration Service

```typescript
// services/issue-event.service.ts

import { inject, Injectable } from '@angular/core';
import { EventBus } from '@core/events/event-bus.service';
import { ISSUE_MODULE_EVENTS, IssueEventType } from '../config/issue.events';

@Injectable({ providedIn: 'root' })
export class IssueEventService {
  private eventBus = inject(EventBus);
  
  /**
   * 發送 Issue 事件
   */
  emit(eventType: IssueEventType, data: any): void {
    this.eventBus.emit({
      type: eventType,
      timestamp: new Date(),
      source: 'issue',
      data
    });
  }
  
  /**
   * 監聽 Issue 事件
   */
  on(eventType: IssueEventType, handler: (data: any) => void): void {
    this.eventBus.on(eventType, handler);
  }
  
  /**
   * 取消監聽
   */
  off(eventType: IssueEventType, handler: (data: any) => void): void {
    this.eventBus.off(eventType, handler);
  }
}
```

### Update Services to Use Event Bus

```typescript
// services/issue-management.service.ts (更新)

@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private repository = inject(IssueRepository);
  private eventService = inject(IssueEventService);
  
  async createIssue(data: CreateIssueData): Promise<Issue> {
    // ... existing code ...
    
    this.eventService.emit(ISSUE_MODULE_EVENTS.ISSUE_CREATED, {
      issueId: id,
      source: 'manual',
      blueprintId: data.blueprintId
    });
    
    return { ...issueData, id } as Issue;
  }
}
```

### Integration with Other Modules

```typescript
// exports/issue-api.exports.ts

export interface IIssueModuleApi {
  management: {
    createIssue(data: CreateIssueData): Promise<Issue>;
    updateIssue(issueId: string, data: Partial<Issue>): Promise<Issue>;
    deleteIssue(issueId: string): Promise<void>;
    getIssue(issueId: string): Promise<Issue | null>;
    listIssues(blueprintId: string, filters?: IssueFilters): Promise<Issue[]>;
    getIssueStatistics(blueprintId: string): Promise<IssueStatistics>;
  };
  
  creation: {
    autoCreateFromAcceptance(params: IssueFromAcceptanceParams): Promise<Issue[]>;
    autoCreateFromQC(params: IssueFromQCParams): Promise<Issue[]>;
    autoCreateFromWarranty(params: IssueFromWarrantyParams): Promise<Issue>;
    autoCreateFromSafety(params: IssueFromSafetyParams): Promise<Issue>;
  };
  
  resolution: {
    resolveIssue(issueId: string, data: CreateIssueResolutionData): Promise<Issue>;
    markAsInProgress(issueId: string, userId: string): Promise<Issue>;
  };
  
  verification: {
    verifyIssue(issueId: string, data: CreateIssueVerificationData): Promise<Issue>;
    closeIssue(issueId: string, userId: string): Promise<Issue>;
  };
  
  lifecycle: {
    canTransitionTo(currentStatus: IssueStatus, targetStatus: IssueStatus): boolean;
    getNextPossibleStatuses(currentStatus: IssueStatus): IssueStatus[];
    getProgressPercentage(status: IssueStatus): number;
    canEdit(issue: Issue): boolean;
    canDelete(issue: Issue): boolean;
  };
  
  events: {
    on(eventType: IssueEventType, handler: (data: any) => void): void;
    off(eventType: IssueEventType, handler: (data: any) => void): void;
  };
}
```

---

## ✅ Acceptance Criteria

- [ ] Issue 事件定義已建立
- [ ] Event Bus 整合服務已實現
- [ ] 所有服務已更新使用 Event Bus
- [ ] Public API 已定義
- [ ] 事件流測試通過
- [ ] 與其他模組整合測試通過

---

## 🔗 Related Tasks

- **Previous**: SETC-005
- **Next**: SETC-007
- **Depends On**: SETC-005
- **Blocks**: SETC-007

---

**Created**: 2025-12-15
