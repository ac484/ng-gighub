/**
 * Issue Resolution Service
 *
 * Handles issue resolution and verification workflows.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';

import type { Issue, IssueResolution, IssueVerification } from '../models';
import { ISSUE_MODULE_EVENTS } from '../module.metadata';
import { IssueRepository } from '../repositories';

@Injectable({ providedIn: 'root' })
export class IssueResolutionService {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  /**
   * Resolve an issue
   */
  async resolveIssue(issueId: string, resolution: IssueResolution): Promise<Issue> {
    this.logger.info('[IssueResolutionService]', `Resolving issue: ${issueId}`);

    try {
      const issue = await this.repository.update(issueId, {
        resolution,
        status: 'resolved',
        resolvedAt: new Date()
      });

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_RESOLVED,
        {
          issueId,
          resolution: {
            method: resolution.resolutionMethod,
            resolvedBy: resolution.resolvedBy,
            cost: resolution.cost
          }
        },
        'issue'
      );

      this.logger.info('[IssueResolutionService]', `Issue resolved: ${issueId}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueResolutionService]', 'Failed to resolve issue', error as Error);
      throw error;
    }
  }

  /**
   * Verify an issue resolution
   */
  async verifyIssue(issueId: string, verification: IssueVerification): Promise<Issue> {
    this.logger.info('[IssueResolutionService]', `Verifying issue: ${issueId}`);

    try {
      const currentIssue = await this.repository.findByIdOnce(issueId);
      if (!currentIssue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      if (!currentIssue.resolution) {
        throw new Error('Issue must be resolved before verification');
      }

      // Determine new status based on verification result
      const newStatus = verification.result === 'approved' ? 'closed' : 'in_progress';
      const updates: Partial<Issue> = {
        verification,
        status: newStatus
      };

      // If approved, also set closedAt timestamp
      if (verification.result === 'approved') {
        updates.closedAt = new Date();
      }

      const issue = await this.repository.update(issueId, updates);

      if (verification.result === 'approved') {
        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_VERIFIED,
          {
            issueId,
            verifiedBy: verification.verifiedBy
          },
          'issue'
        );

        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_CLOSED,
          {
            issueId
          },
          'issue'
        );

        this.logger.info('[IssueResolutionService]', `Issue verified and closed: ${issueId}`);
      } else {
        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_VERIFICATION_FAILED,
          {
            issueId,
            reason: verification.notes
          },
          'issue'
        );

        this.logger.info('[IssueResolutionService]', `Issue verification failed: ${issueId}`);
      }

      return issue;
    } catch (error) {
      this.logger.error('[IssueResolutionService]', 'Failed to verify issue', error as Error);
      throw error;
    }
  }

  /**
   * Reopen an issue
   */
  async reopenIssue(issueId: string, reason: string): Promise<Issue> {
    this.logger.info('[IssueResolutionService]', `Reopening issue: ${issueId}`);

    try {
      const issue = await this.repository.update(issueId, {
        status: 'open',
        resolution: undefined,
        verification: undefined,
        resolvedAt: undefined,
        closedAt: undefined
      });

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_UPDATED,
        {
          issueId,
          action: 'reopened',
          reason
        },
        'issue'
      );

      this.logger.info('[IssueResolutionService]', `Issue reopened: ${issueId}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueResolutionService]', 'Failed to reopen issue', error as Error);
      throw error;
    }
  }
}
