/**
 * Issue Management Service
 *
 * Handles CRUD operations for issues including manual creation.
 * Provides statistics and filtering capabilities.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';
import { firstValueFrom } from 'rxjs';

import type { Issue, CreateIssueData, UpdateIssueData, IssueFilters, IssueStatistics, IssueSource } from '../models';
import { ISSUE_MODULE_EVENTS } from '../module.metadata';
import { IssueRepository } from '../repositories';

@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  /**
   * Create a new issue manually
   */
  async createIssue(data: CreateIssueData): Promise<Issue> {
    this.logger.info('[IssueManagementService]', 'Creating issue', { blueprintId: data.blueprintId, title: data.title });

    try {
      // Generate issue number
      const issueNumber = await this.repository.generateIssueNumber(data.blueprintId);

      // Create issue
      const issue = await this.repository.create({
        blueprintId: data.blueprintId,
        issueNumber,
        source: 'manual' as IssueSource,
        sourceId: null,
        title: data.title,
        description: data.description,
        location: data.location,
        severity: data.severity,
        category: data.category,
        responsibleParty: data.responsibleParty,
        assignedTo: data.assignedTo,
        status: 'open',
        beforePhotos: data.beforePhotos || [],
        afterPhotos: [],
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Emit event
      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_CREATED,
        { issueId: issue.id, source: 'manual', blueprintId: data.blueprintId },
        'issue'
      );

      this.logger.info('[IssueManagementService]', `Issue created: ${issue.issueNumber}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueManagementService]', 'Failed to create issue', error as Error);
      throw error;
    }
  }

  /**
   * Get an issue by ID
   */
  async getIssue(issueId: string): Promise<Issue | null> {
    return this.repository.findByIdOnce(issueId);
  }

  /**
   * List issues for a blueprint
   */
  async listIssues(blueprintId: string, filters?: IssueFilters): Promise<Issue[]> {
    return firstValueFrom(this.repository.findByBlueprint(blueprintId, filters));
  }

  /**
   * Get issue statistics for a blueprint
   */
  async getIssueStatistics(blueprintId: string): Promise<IssueStatistics> {
    const issues = await this.listIssues(blueprintId);

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
      }
    };
  }

  /**
   * Update an issue
   */
  async updateIssue(issueId: string, data: UpdateIssueData): Promise<Issue> {
    this.logger.info('[IssueManagementService]', `Updating issue: ${issueId}`);

    try {
      const issue = await this.repository.update(issueId, data);

      this.eventBus.emit(ISSUE_MODULE_EVENTS.ISSUE_UPDATED, { issueId }, 'issue');

      return issue;
    } catch (error) {
      this.logger.error('[IssueManagementService]', 'Failed to update issue', error as Error);
      throw error;
    }
  }

  /**
   * Assign an issue to a user
   */
  async assignIssue(issueId: string, assignedTo: string): Promise<Issue> {
    this.logger.info('[IssueManagementService]', `Assigning issue ${issueId} to ${assignedTo}`);

    const issue = await this.repository.update(issueId, { assignedTo });

    this.eventBus.emit(ISSUE_MODULE_EVENTS.ISSUE_ASSIGNED, { issueId, assignedTo }, 'issue');

    return issue;
  }

  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string): Promise<void> {
    this.logger.info('[IssueManagementService]', `Deleting issue: ${issueId}`);

    await this.repository.delete(issueId);
  }
}
