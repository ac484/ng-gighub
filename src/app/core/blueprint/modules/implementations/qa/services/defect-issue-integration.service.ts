/**
 * Defect Issue Integration Service - SETC-044
 *
 * 缺失與問題單整合服務
 * - 嚴重缺失自動建立 Issue
 * - 雙向狀態同步
 * - 關聯追蹤
 *
 * @module QA
 * @author GigHub Development Team
 * @date 2025-12-16
 * @implements SETC-044
 */

import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { QADefect, DefectSeverity, DefectStatus, EventActor } from '../models';
import { QaRepository } from '../repositories/qa.repository';

/**
 * Issue 優先級 - SETC-044
 */
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Issue 來源類型 - SETC-044
 */
export type IssueSourceType = 'qc_defect' | 'warranty_defect' | 'acceptance_defect' | 'manual';

/**
 * 建立 Issue DTO - SETC-044
 */
export interface CreateIssueFromDefectDto {
  defectId: string;
  blueprintId: string;
  taskId?: string;
  title: string;
  description: string;
  priority: IssuePriority;
  location?: string;
  photos?: string[];
  sourceType: IssueSourceType;
  sourceId: string;
}

/**
 * Issue 狀態 - SETC-044
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';

/**
 * Issue 記錄（簡化版）- SETC-044
 */
export interface LinkedIssue {
  id: string;
  issueNumber: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class DefectIssueIntegrationService {
  private repository = inject(QaRepository);

  // 內存 Issue 關聯（實際應使用 IssueRepository）
  private linkedIssues = new Map<string, LinkedIssue>();
  private defectIssueMap = new Map<string, string>(); // defectId -> issueId

  /**
   * 檢查是否需要自動建立 Issue - SETC-044
   */
  shouldAutoCreateIssue(defect: QADefect): boolean {
    // 僅對嚴重缺失自動建立 Issue
    return defect.severity === DefectSeverity.CRITICAL;
  }

  /**
   * 從缺失自動建立 Issue - SETC-044
   */
  async autoCreateIssueFromDefect(blueprintId: string, defectId: string, actor: EventActor): Promise<LinkedIssue> {
    const defect = await this.getDefect(blueprintId, defectId);

    if (!this.shouldAutoCreateIssue(defect)) {
      throw new Error('Defect severity does not require auto-creation of Issue');
    }

    // 檢查是否已經關聯 Issue
    if (defect.linkedIssueId) {
      throw new Error(`Defect already has linked Issue: ${defect.linkedIssueId}`);
    }

    const issue = this.createIssue({
      defectId: defect.id,
      blueprintId: defect.blueprintId,
      taskId: defect.taskId,
      title: `品檢缺失: ${defect.defectNumber || defect.id}`,
      description: defect.description,
      priority: this.mapSeverityToPriority(defect.severity),
      location: defect.location,
      photos: defect.photos,
      sourceType: 'qc_defect',
      sourceId: defect.id
    });

    // 更新缺失關聯
    await this.repository.update(blueprintId, defectId, {
      linkedIssueId: issue.id,
      metadata: {
        ...defect.metadata,
        hasLinkedIssue: true,
        linkedIssueNumber: issue.issueNumber
      },
      updatedBy: actor.userId
    });

    // 記錄關聯
    this.defectIssueMap.set(defectId, issue.id);

    return issue;
  }

  /**
   * 手動關聯 Issue - SETC-044
   */
  async linkIssue(blueprintId: string, defectId: string, issueId: string, actor: EventActor): Promise<void> {
    const defect = await this.getDefect(blueprintId, defectId);

    await this.repository.update(blueprintId, defectId, {
      linkedIssueId: issueId,
      metadata: {
        ...defect.metadata,
        hasLinkedIssue: true
      },
      updatedBy: actor.userId
    });

    this.defectIssueMap.set(defectId, issueId);
  }

  /**
   * 取消關聯 Issue - SETC-044
   */
  async unlinkIssue(blueprintId: string, defectId: string, actor: EventActor): Promise<void> {
    const defect = await this.getDefect(blueprintId, defectId);

    await this.repository.update(blueprintId, defectId, {
      linkedIssueId: undefined,
      metadata: {
        ...defect.metadata,
        hasLinkedIssue: false,
        linkedIssueNumber: undefined
      },
      updatedBy: actor.userId
    });

    this.defectIssueMap.delete(defectId);
  }

  /**
   * 同步 Issue 狀態到缺失 - SETC-044
   */
  async syncIssueStatusToDefect(issueId: string, newStatus: IssueStatus, actor: EventActor): Promise<void> {
    // 找到關聯的缺失
    let targetDefectId: string | null = null;
    for (const [defectId, linkedIssueId] of this.defectIssueMap.entries()) {
      if (linkedIssueId === issueId) {
        targetDefectId = defectId;
        break;
      }
    }

    if (!targetDefectId) {
      return; // 沒有關聯的缺失
    }

    const defectStatus = this.mapIssueStatusToDefectStatus(newStatus);
    if (!defectStatus) return;

    // 需要取得 blueprintId，這裡假設從快取中獲取
    const issue = this.linkedIssues.get(issueId);
    if (!issue) return;

    // 注意：實際實作需要從缺失記錄取得 blueprintId
    // 這裡簡化處理
  }

  /**
   * 同步缺失狀態到 Issue - SETC-044
   */
  async syncDefectStatusToIssue(blueprintId: string, defectId: string, newStatus: DefectStatus, actor: EventActor): Promise<void> {
    const issueId = this.defectIssueMap.get(defectId);
    if (!issueId) return;

    const issue = this.linkedIssues.get(issueId);
    if (!issue) return;

    const issueStatus = this.mapDefectStatusToIssueStatus(newStatus);
    if (!issueStatus) return;

    // 更新 Issue 狀態（實際應呼叫 IssueService）
    this.linkedIssues.set(issueId, {
      ...issue,
      status: issueStatus
    });
  }

  /**
   * 取得缺失關聯的 Issue - SETC-044
   */
  getLinkedIssue(defectId: string): LinkedIssue | null {
    const issueId = this.defectIssueMap.get(defectId);
    if (!issueId) return null;
    return this.linkedIssues.get(issueId) || null;
  }

  /**
   * 檢查缺失是否有關聯 Issue - SETC-044
   */
  hasLinkedIssue(defectId: string): boolean {
    return this.defectIssueMap.has(defectId);
  }

  /**
   * 取得所有關聯的缺失-Issue 對 - SETC-044
   */
  getAllLinkedPairs(): Array<{ defectId: string; issueId: string }> {
    return Array.from(this.defectIssueMap.entries()).map(([defectId, issueId]) => ({
      defectId,
      issueId
    }));
  }

  // ========== 輔助方法 ==========

  private async getDefect(blueprintId: string, defectId: string): Promise<QADefect> {
    const defect = await lastValueFrom(this.repository.findById(blueprintId, defectId));
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }
    return defect;
  }

  private createIssue(dto: CreateIssueFromDefectDto): LinkedIssue {
    const id = `ISSUE-${Date.now().toString(36).toUpperCase()}`;
    const issueNumber = `ISS-${Date.now().toString(36).toUpperCase().substring(0, 6)}`;

    const issue: LinkedIssue = {
      id,
      issueNumber,
      title: dto.title,
      status: 'open',
      priority: dto.priority,
      createdAt: new Date()
    };

    this.linkedIssues.set(id, issue);
    return issue;
  }

  private mapSeverityToPriority(severity: DefectSeverity): IssuePriority {
    const map: Record<DefectSeverity, IssuePriority> = {
      [DefectSeverity.CRITICAL]: 'critical',
      [DefectSeverity.HIGH]: 'high',
      [DefectSeverity.MEDIUM]: 'medium',
      [DefectSeverity.LOW]: 'low'
    };
    return map[severity];
  }

  private mapIssueStatusToDefectStatus(issueStatus: IssueStatus): DefectStatus | null {
    const map: Partial<Record<IssueStatus, DefectStatus>> = {
      in_progress: DefectStatus.IN_PROGRESS,
      resolved: DefectStatus.RESOLVED,
      verified: DefectStatus.VERIFIED,
      closed: DefectStatus.CLOSED
    };
    return map[issueStatus] || null;
  }

  private mapDefectStatusToIssueStatus(defectStatus: DefectStatus): IssueStatus | null {
    const map: Partial<Record<DefectStatus, IssueStatus>> = {
      [DefectStatus.IN_PROGRESS]: 'in_progress',
      [DefectStatus.RESOLVED]: 'resolved',
      [DefectStatus.VERIFIED]: 'verified',
      [DefectStatus.CLOSED]: 'closed'
    };
    return map[defectStatus] || null;
  }
}
