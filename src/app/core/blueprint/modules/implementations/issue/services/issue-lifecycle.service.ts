/**
 * Issue Lifecycle Service
 *
 * Handles issue state transitions and lifecycle management.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';

import type { Issue, IssueStatus } from '../models';
import { ISSUE_MODULE_EVENTS } from '../module.metadata';
import { IssueRepository } from '../repositories';

/**
 * Lifecycle history entry
 */
export interface LifecycleHistoryEntry {
  status: string;
  timestamp: Date;
  userId: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class IssueLifecycleService {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);

  /**
   * Valid status transitions
   */
  private readonly validTransitions: Record<IssueStatus, IssueStatus[]> = {
    open: ['in_progress', 'closed'],
    in_progress: ['open', 'resolved', 'closed'],
    resolved: ['in_progress', 'verified', 'closed'],
    verified: ['in_progress', 'closed'],
    closed: ['open'] // Can reopen closed issues
  };

  /**
   * Start progress on an issue
   */
  async startProgress(issueId: string, userId: string): Promise<Issue> {
    return this.transitionStatus(issueId, 'in_progress', userId);
  }

  /**
   * Mark issue as resolved
   */
  async markResolved(issueId: string, userId: string): Promise<Issue> {
    return this.transitionStatus(issueId, 'resolved', userId);
  }

  /**
   * Mark issue as verified
   */
  async markVerified(issueId: string, userId: string): Promise<Issue> {
    return this.transitionStatus(issueId, 'verified', userId);
  }

  /**
   * Close an issue
   */
  async closeIssue(issueId: string, userId: string): Promise<Issue> {
    const issue = await this.transitionStatus(issueId, 'closed', userId);

    this.eventBus.emit(
      ISSUE_MODULE_EVENTS.ISSUE_CLOSED,
      {
        issueId,
        closedBy: userId
      },
      'issue'
    );

    return issue;
  }

  /**
   * Transition issue status with validation
   */
  private async transitionStatus(issueId: string, newStatus: IssueStatus, userId: string): Promise<Issue> {
    this.logger.info('[IssueLifecycleService]', `Transitioning issue ${issueId} to ${newStatus}`);

    try {
      const currentIssue = await this.repository.findByIdOnce(issueId);
      if (!currentIssue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      // Validate transition
      const allowedNextStatuses = this.validTransitions[currentIssue.status];
      if (!allowedNextStatuses.includes(newStatus)) {
        throw new Error(`Invalid status transition: ${currentIssue.status} → ${newStatus}`);
      }

      const updates: Partial<Issue> = {
        status: newStatus
      };

      // Set timestamps based on status
      if (newStatus === 'resolved') {
        updates.resolvedAt = new Date();
      } else if (newStatus === 'closed') {
        updates.closedAt = new Date();
      } else if (newStatus === 'open') {
        // Reopening - clear timestamps
        updates.resolvedAt = undefined;
        updates.closedAt = undefined;
      }

      const issue = await this.repository.update(issueId, updates);

      this.eventBus.emit(
        ISSUE_MODULE_EVENTS.ISSUE_UPDATED,
        {
          issueId,
          previousStatus: currentIssue.status,
          newStatus,
          changedBy: userId
        },
        'issue'
      );

      this.logger.info('[IssueLifecycleService]', `Issue ${issueId} transitioned to ${newStatus}`);
      return issue;
    } catch (error) {
      this.logger.error('[IssueLifecycleService]', 'Failed to transition status', error as Error);
      throw error;
    }
  }

  /**
   * Get lifecycle history for an issue
   * Note: This is a simplified implementation. In production, you would
   * store history in a separate subcollection or use audit logs.
   */
  async getLifecycleHistory(issueId: string): Promise<LifecycleHistoryEntry[]> {
    const issue = await this.repository.findByIdOnce(issueId);
    if (!issue) {
      return [];
    }

    // Build history from available timestamps
    const history: LifecycleHistoryEntry[] = [
      {
        status: 'open',
        timestamp: issue.createdAt,
        userId: issue.createdBy,
        notes: 'Issue created'
      }
    ];

    if (issue.resolvedAt && issue.resolution) {
      history.push({
        status: 'resolved',
        timestamp: issue.resolvedAt,
        userId: issue.resolution.resolvedBy,
        notes: issue.resolution.notes
      });
    }

    if (issue.verification) {
      history.push({
        status: issue.verification.result === 'approved' ? 'verified' : 'in_progress',
        timestamp: issue.verification.verifiedAt,
        userId: issue.verification.verifiedBy,
        notes: issue.verification.notes
      });
    }

    if (issue.closedAt) {
      // Use the verifier as the one who closed, or resolution.resolvedBy if available
      const closedBy = issue.verification?.verifiedBy || issue.resolution?.resolvedBy || issue.createdBy;
      history.push({
        status: 'closed',
        timestamp: issue.closedAt,
        userId: closedBy,
        notes: 'Issue closed'
      });
    }

    return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Check if an issue can be edited
   * Issues can be edited if they are not closed or verified
   */
  canEdit(issue: Issue): boolean {
    return issue.status !== 'closed' && issue.status !== 'verified';
  }

  /**
   * Check if an issue can be deleted
   * Only open issues can be deleted
   */
  canDelete(issue: Issue): boolean {
    return issue.status === 'open';
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(currentStatus: IssueStatus, targetStatus: IssueStatus): boolean {
    const allowedTransitions = this.validTransitions[currentStatus];
    return allowedTransitions?.includes(targetStatus) ?? false;
  }

  /**
   * Get next possible statuses for a given status
   */
  getNextPossibleStatuses(currentStatus: IssueStatus): IssueStatus[] {
    return this.validTransitions[currentStatus] ?? [];
  }

  /**
   * Get progress percentage for a status
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
}
