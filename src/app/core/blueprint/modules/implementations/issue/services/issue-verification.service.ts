/**
 * Issue Verification Service
 *
 * Handles issue verification workflows.
 * Separated from resolution for single responsibility principle.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';

import type { Issue, IssueVerification } from '../models';
import { ISSUE_MODULE_EVENTS } from '../module.metadata';
import { IssueRepository } from '../repositories';

@Injectable({ providedIn: 'root' })
export class IssueVerificationService {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  /**
   * Verify an issue resolution
   *
   * @param issueId Issue ID to verify
   * @param verificationData Verification details
   * @returns Updated issue
   */
  async verifyIssue(issueId: string, verificationData: Omit<IssueVerification, 'verifiedAt'>): Promise<Issue> {
    this.logger.info('[IssueVerificationService]', `Verifying issue: ${issueId}`);

    try {
      const currentIssue = await this.repository.findByIdOnce(issueId);
      if (!currentIssue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      if (currentIssue.status !== 'resolved') {
        throw new Error(`Issue ${issueId} is not in resolved status. Current status: ${currentIssue.status}`);
      }

      const verification: IssueVerification = {
        ...verificationData,
        verifiedAt: new Date()
      };

      if (verificationData.result === 'approved') {
        // Verification passed - close the issue
        const issue = await this.repository.update(issueId, {
          verification,
          status: 'closed',
          closedAt: new Date()
        });

        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_VERIFIED,
          {
            issueId,
            verifiedBy: verificationData.verifiedBy
          },
          'issue'
        );

        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_CLOSED,
          {
            issueId,
            closedBy: verificationData.verifiedBy
          },
          'issue'
        );

        this.logger.info('[IssueVerificationService]', `Issue verified and closed: ${issueId}`);
        return issue;
      } else {
        // Verification failed - return to in_progress status
        const issue = await this.repository.update(issueId, {
          verification,
          status: 'in_progress'
        });

        this.eventBus.emit(
          ISSUE_MODULE_EVENTS.ISSUE_VERIFICATION_FAILED,
          {
            issueId,
            reason: verificationData.notes
          },
          'issue'
        );

        this.logger.info('[IssueVerificationService]', `Issue verification failed: ${issueId}`);
        return issue;
      }
    } catch (error) {
      this.logger.error('[IssueVerificationService]', 'Failed to verify issue', error as Error);
      throw error;
    }
  }

  /**
   * Close an issue manually (without verification)
   *
   * @param issueId Issue ID to close
   * @param userId User ID who closes the issue
   * @param notes Optional closing notes
   * @returns Updated issue
   */
  async closeIssue(issueId: string, userId: string, notes?: string): Promise<Issue> {
    this.logger.info('[IssueVerificationService]', `Closing issue: ${issueId}`);

    try {
      const currentIssue = await this.repository.findByIdOnce(issueId);
      if (!currentIssue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      if (currentIssue.status === 'closed') {
        throw new Error(`Issue ${issueId} is already closed`);
      }

      const issue = await this.repository.update(issueId, {
        status: 'closed',
        closedAt: new Date()
      });

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_CLOSED,
        {
          issueId,
          closedBy: userId,
          notes
        },
        'issue'
      );

      this.logger.info('[IssueVerificationService]', `Issue closed: ${issueId}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueVerificationService]', 'Failed to close issue', error as Error);
      throw error;
    }
  }

  /**
   * Reopen a closed issue
   *
   * @param issueId Issue ID to reopen
   * @param userId User ID who reopens the issue
   * @param reason Reason for reopening
   * @returns Updated issue
   */
  async reopenIssue(issueId: string, userId: string, reason: string): Promise<Issue> {
    this.logger.info('[IssueVerificationService]', `Reopening issue: ${issueId}`);

    try {
      const currentIssue = await this.repository.findByIdOnce(issueId);
      if (!currentIssue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      if (currentIssue.status !== 'closed' && currentIssue.status !== 'verified') {
        throw new Error(`Issue ${issueId} is not in closed or verified status`);
      }

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
          reopenedBy: userId,
          reason
        },
        'issue'
      );

      this.logger.info('[IssueVerificationService]', `Issue reopened: ${issueId}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueVerificationService]', 'Failed to reopen issue', error as Error);
      throw error;
    }
  }
}
