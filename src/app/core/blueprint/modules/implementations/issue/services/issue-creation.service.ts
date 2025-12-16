/**
 * Issue Creation Service
 *
 * Handles auto-creation of issues from multiple sources:
 * - Acceptance failures
 * - QC inspection failures
 * - Warranty defects
 * - Safety incidents
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';

import type {
  Issue,
  IssueFromAcceptanceParams,
  IssueFromQCParams,
  IssueFromWarrantyParams,
  IssueFromSafetyParams,
  IssueSeverity
} from '../models';
import { ISSUE_MODULE_EVENTS } from '../module.metadata';
import { IssueRepository } from '../repositories';

@Injectable({ providedIn: 'root' })
export class IssueCreationService {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  /**
   * Auto-create issues from acceptance failure
   */
  async autoCreateFromAcceptance(params: IssueFromAcceptanceParams): Promise<Issue[]> {
    this.logger.info('[IssueCreationService]', `Creating issues from acceptance: ${params.acceptanceId}`);

    try {
      const issues: Issue[] = [];

      for (const item of params.failedItems) {
        const issueNumber = await this.repository.generateIssueNumber(params.blueprintId);

        const issue = await this.repository.create({
          blueprintId: params.blueprintId,
          issueNumber,
          source: 'acceptance',
          sourceId: params.acceptanceId,
          title: `驗收問題: ${item.itemName}`,
          description: item.notes || `${item.itemName} 驗收不合格`,
          location: item.location,
          severity: this.determineSeverity(item.notes),
          category: 'quality',
          responsibleParty: params.contractorId,
          assignedTo: params.contractorId,
          status: 'open',
          beforePhotos: item.photos || [],
          afterPhotos: [],
          createdBy: params.inspectorId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        issues.push(issue);
      }

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUES_CREATED_FROM_ACCEPTANCE,
        {
          acceptanceId: params.acceptanceId,
          issueIds: issues.map(i => i.id),
          count: issues.length
        },
        'issue'
      );

      this.logger.info('[IssueCreationService]', `Created ${issues.length} issues from acceptance`);
      return issues;
    } catch (error) {
      this.logger.error('[IssueCreationService]', 'Failed to create issues from acceptance', error as Error);
      throw error;
    }
  }

  /**
   * Auto-create issues from QC failure
   */
  async autoCreateFromQC(params: IssueFromQCParams): Promise<Issue[]> {
    this.logger.info('[IssueCreationService]', `Creating issues from QC: ${params.inspectionId}`);

    try {
      const issues: Issue[] = [];

      for (const item of params.failedItems) {
        const issueNumber = await this.repository.generateIssueNumber(params.blueprintId);

        const issue = await this.repository.create({
          blueprintId: params.blueprintId,
          issueNumber,
          source: 'qc',
          sourceId: params.inspectionId,
          title: `QC 問題: ${item.itemName}`,
          description: item.notes || `${item.itemName} QC 檢查不合格`,
          location: item.location,
          severity: this.determineSeverity(item.notes),
          category: 'quality',
          responsibleParty: params.contractorId,
          status: 'open',
          beforePhotos: item.photos || [],
          afterPhotos: [],
          createdBy: params.inspectorId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        issues.push(issue);
      }

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUES_CREATED_FROM_QC,
        {
          inspectionId: params.inspectionId,
          issueIds: issues.map(i => i.id),
          count: issues.length
        },
        'issue'
      );

      this.logger.info('[IssueCreationService]', `Created ${issues.length} issues from QC`);
      return issues;
    } catch (error) {
      this.logger.error('[IssueCreationService]', 'Failed to create issues from QC', error as Error);
      throw error;
    }
  }

  /**
   * Auto-create issue from warranty defect
   */
  async autoCreateFromWarranty(params: IssueFromWarrantyParams): Promise<Issue> {
    this.logger.info('[IssueCreationService]', `Creating issue from warranty: ${params.warrantyDefectId}`);

    try {
      const issueNumber = await this.repository.generateIssueNumber(params.blueprintId);

      const issue = await this.repository.create({
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
      });

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_CREATED_FROM_WARRANTY,
        {
          warrantyDefectId: params.warrantyDefectId,
          issueId: issue.id
        },
        'issue'
      );

      this.logger.info('[IssueCreationService]', `Created issue from warranty: ${issue.issueNumber}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueCreationService]', 'Failed to create issue from warranty', error as Error);
      throw error;
    }
  }

  /**
   * Auto-create issue from safety incident
   */
  async autoCreateFromSafety(params: IssueFromSafetyParams): Promise<Issue> {
    this.logger.info('[IssueCreationService]', `Creating issue from safety: ${params.incidentId}`);

    try {
      const issueNumber = await this.repository.generateIssueNumber(params.blueprintId);

      const issue = await this.repository.create({
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
      });

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_CREATED_FROM_SAFETY,
        {
          incidentId: params.incidentId,
          issueId: issue.id
        },
        'issue'
      );

      this.logger.info('[IssueCreationService]', `Created issue from safety: ${issue.issueNumber}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueCreationService]', 'Failed to create issue from safety', error as Error);
      throw error;
    }
  }

  /**
   * Determine severity based on notes content
   * Simple heuristic - can be enhanced with more sophisticated logic
   */
  private determineSeverity(notes?: string): IssueSeverity {
    if (!notes) return 'minor';

    const lowerNotes = notes.toLowerCase();

    if (lowerNotes.includes('critical') || lowerNotes.includes('嚴重') || lowerNotes.includes('危險')) {
      return 'critical';
    }

    if (lowerNotes.includes('major') || lowerNotes.includes('重大') || lowerNotes.includes('重要')) {
      return 'major';
    }

    return 'minor';
  }
}
