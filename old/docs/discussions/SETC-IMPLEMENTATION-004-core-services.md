# SETC Implementation 004: Issue Module - Core Services (Management & Creation)

> **Task ID**: SETC-004  
> **Priority**: P1  
> **Estimated Time**: 12 hours  
> **Dependencies**: SETC-003  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

實現 Issue Module 的兩個核心服務：IssueManagementService (手動 CRUD) 和 IssueCreationService (多來源自動建立)。

---

## 🎯 Objectives

1. 實現 IssueManagementService - 手動建立與管理
2. 實現 IssueCreationService - 多來源自動建立
3. 實現 Issue 編號自動生成
4. 整合 Event Bus
5. 錯誤處理與日誌

---

## 🔧 Implementation

### IssueManagementService

```typescript
// services/issue-management.service.ts

import { inject, Injectable } from '@angular/core';
import { IssueRepository } from '../repositories/issue.repository';
import {
  Issue,
  CreateIssueData,
  IssueFilters,
  IssueStatistics
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private repository = inject(IssueRepository);
  
  /**
   * 建立問題單（手動）
   */
  async createIssue(data: CreateIssueData): Promise<Issue> {
    const issueNumber = await this.generateIssueNumber();
    
    const issueData: Omit<Issue, 'id'> = {
      blueprintId: data.blueprintId,
      issueNumber,
      source: 'manual',
      sourceId: null,
      title: data.title,
      description: data.description,
      location: data.location,
      severity: data.severity,
      category: data.category,
      responsibleParty: data.responsibleParty,
      assignedTo: data.assignedTo,
      status: 'open',
      beforePhotos: data.beforePhotos ?? [],
      afterPhotos: [],
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await this.repository.create(issueData);
    
    // Emit event
    this.emitEvent('ISSUE_CREATED', { issueId: id, source: 'manual' });
    
    return { ...issueData, id } as Issue;
  }
  
  /**
   * 更新問題單
   */
  async updateIssue(issueId: string, data: Partial<Issue>): Promise<Issue> {
    await this.repository.update(issueId, {
      ...data,
      updatedAt: new Date()
    });
    
    this.emitEvent('ISSUE_UPDATED', { issueId });
    
    const updated = await this.repository.findById(issueId);
    if (!updated) {
      throw new Error(`Issue ${issueId} not found after update`);
    }
    
    return updated;
  }
  
  /**
   * 刪除問題單
   */
  async deleteIssue(issueId: string): Promise<void> {
    await this.repository.delete(issueId);
    this.emitEvent('ISSUE_DELETED', { issueId });
  }
  
  /**
   * 獲取問題單
   */
  async getIssue(issueId: string): Promise<Issue | null> {
    return this.repository.findById(issueId);
  }
  
  /**
   * 獲取問題單清單
   */
  async listIssues(
    blueprintId: string,
    filters?: IssueFilters
  ): Promise<Issue[]> {
    return this.repository.findByBlueprint(blueprintId, filters);
  }
  
  /**
   * 獲取問題統計
   */
  async getIssueStatistics(blueprintId: string): Promise<IssueStatistics> {
    return this.repository.getStatistics(blueprintId);
  }
  
  /**
   * 生成 Issue 編號
   * 格式: ISS-YYYYMMDD-XXXX
   */
  private async generateIssueNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ISS-${dateStr}-${random}`;
  }
  
  private emitEvent(eventType: string, data: any): void {
    // Event Bus integration - to be implemented in SETC-006
    console.log(`[IssueManagementService] Event: ${eventType}`, data);
  }
}
```

### IssueCreationService

```typescript
// services/issue-creation.service.ts

import { inject, Injectable } from '@angular/core';
import { IssueRepository } from '../repositories/issue.repository';
import {
  Issue,
  IssueFromAcceptanceParams,
  IssueFromQCParams,
  IssueFromWarrantyParams,
  IssueFromSafetyParams,
  IssueSeverity
} from '../models';

@Injectable({ providedIn: 'root' })
export class IssueCreationService {
  private repository = inject(IssueRepository);
  
  /**
   * 從驗收不通過自動建立問題單
   */
  async autoCreateFromAcceptance(
    params: IssueFromAcceptanceParams
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    for (const item of params.failedItems) {
      const issueNumber = await this.generateIssueNumber();
      const severity = this.determineSeverity(item.notes);
      
      const issueData: Omit<Issue, 'id'> = {
        blueprintId: params.blueprintId,
        issueNumber,
        source: 'acceptance',
        sourceId: params.acceptanceId,
        title: `驗收問題: ${item.itemName}`,
        description: item.notes || `${item.itemName} 驗收不合格`,
        location: item.location,
        severity,
        category: 'quality',
        responsibleParty: params.contractorId,
        assignedTo: params.contractorId,
        status: 'open',
        beforePhotos: item.photos || [],
        afterPhotos: [],
        createdBy: params.inspectorId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const id = await this.repository.create(issueData);
      issues.push({ ...issueData, id } as Issue);
    }
    
    this.emitEvent('ISSUES_CREATED_FROM_ACCEPTANCE', {
      acceptanceId: params.acceptanceId,
      issueIds: issues.map(i => i.id)
    });
    
    return issues;
  }
  
  /**
   * 從 QC 檢查失敗自動建立問題單
   */
  async autoCreateFromQC(params: IssueFromQCParams): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    for (const item of params.failedItems) {
      const issueNumber = await this.generateIssueNumber();
      const severity = this.determineSeverity(item.notes);
      
      const issueData: Omit<Issue, 'id'> = {
        blueprintId: params.blueprintId,
        issueNumber,
        source: 'qc',
        sourceId: params.inspectionId,
        title: `QC 問題: ${item.itemName}`,
        description: item.notes || `${item.itemName} QC 檢查不合格`,
        location: item.location,
        severity,
        category: 'quality',
        responsibleParty: params.contractorId,
        status: 'open',
        beforePhotos: item.photos || [],
        afterPhotos: [],
        createdBy: params.inspectorId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const id = await this.repository.create(issueData);
      issues.push({ ...issueData, id } as Issue);
    }
    
    this.emitEvent('ISSUES_CREATED_FROM_QC', {
      inspectionId: params.inspectionId,
      issueIds: issues.map(i => i.id)
    });
    
    return issues;
  }
  
  /**
   * 從保固缺失建立問題單
   */
  async autoCreateFromWarranty(
    params: IssueFromWarrantyParams
  ): Promise<Issue> {
    const issueNumber = await this.generateIssueNumber();
    
    const issueData: Omit<Issue, 'id'> = {
      blueprintId: params.blueprintId,
      issueNumber,
      source: 'warranty',
      sourceId: params.warrantyDefectId,
      title: `保固問題: ${params.title}`,
      description: params.description,
      location: params.location,
      severity: params.severity,
      category: 'warranty',
      responsibleParty: params.warrantor,
      status: 'open',
      beforePhotos: params.photos || [],
      afterPhotos: [],
      createdBy: params.reportedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await this.repository.create(issueData);
    
    this.emitEvent('ISSUE_CREATED_FROM_WARRANTY', {
      warrantyDefectId: params.warrantyDefectId,
      issueId: id
    });
    
    return { ...issueData, id } as Issue;
  }
  
  /**
   * 從安全事故建立問題單
   */
  async autoCreateFromSafety(
    params: IssueFromSafetyParams
  ): Promise<Issue> {
    const issueNumber = await this.generateIssueNumber();
    
    const issueData: Omit<Issue, 'id'> = {
      blueprintId: params.blueprintId,
      issueNumber,
      source: 'safety',
      sourceId: params.incidentId,
      title: `安全問題: ${params.title}`,
      description: params.description,
      location: params.location,
      severity: params.severity,
      category: 'safety',
      responsibleParty: params.responsibleParty,
      status: 'open',
      beforePhotos: params.photos || [],
      afterPhotos: [],
      createdBy: params.reportedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await this.repository.create(issueData);
    
    this.emitEvent('ISSUE_CREATED_FROM_SAFETY', {
      incidentId: params.incidentId,
      issueId: id
    });
    
    return { ...issueData, id } as Issue;
  }
  
  /**
   * 根據描述判斷嚴重程度
   */
  private determineSeverity(notes?: string): IssueSeverity {
    if (!notes) return 'minor';
    
    const lowerNotes = notes.toLowerCase();
    
    if (lowerNotes.includes('嚴重') || lowerNotes.includes('critical') ||
        lowerNotes.includes('阻斷') || lowerNotes.includes('blocking')) {
      return 'critical';
    }
    
    if (lowerNotes.includes('重要') || lowerNotes.includes('major') ||
        lowerNotes.includes('影響') || lowerNotes.includes('問題')) {
      return 'major';
    }
    
    return 'minor';
  }
  
  private async generateIssueNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ISS-${dateStr}-${random}`;
  }
  
  private emitEvent(eventType: string, data: any): void {
    console.log(`[IssueCreationService] Event: ${eventType}`, data);
  }
}
```

---

## ✅ Acceptance Criteria

- [ ] IssueManagementService 已實現
- [ ] IssueCreationService 已實現
- [ ] Issue 編號自動生成正確
- [ ] 所有 5 種來源的建立方法已實現
- [ ] Event Bus 整合點已預留
- [ ] 單元測試通過（覆蓋率 80%+）
- [ ] 錯誤處理完整

---

## 🔗 Related Tasks

- **Previous**: SETC-003
- **Next**: SETC-005
- **Depends On**: SETC-003
- **Blocks**: SETC-005

---

**Created**: 2025-12-15
