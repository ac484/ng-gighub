/**
 * IssueLifecycleService Unit Tests
 *
 * Tests for Issue lifecycle state transitions and validation.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';
import { of } from 'rxjs';

import type { Issue, IssueStatus } from '../models';
import { IssueRepository } from '../repositories';
import { IssueLifecycleService } from './issue-lifecycle.service';

describe('IssueLifecycleService', () => {
  let service: IssueLifecycleService;
  let mockRepository: jasmine.SpyObj<IssueRepository>;
  let mockEventBus: jasmine.SpyObj<EventBus>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample issue for testing
  const createMockIssue = (status: IssueStatus = 'open'): Issue => ({
    id: 'issue-001',
    blueprintId: 'bp-001',
    issueNumber: 'ISS-0001',
    source: 'manual',
    sourceId: null,
    title: 'Test Issue',
    description: 'Test description',
    location: 'Test location',
    severity: 'major',
    category: 'quality',
    responsibleParty: 'contractor-001',
    status,
    beforePhotos: [],
    afterPhotos: [],
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IssueRepository', ['findByIdOnce', 'update']);
    mockEventBus = jasmine.createSpyObj('EventBus', ['emit']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        IssueLifecycleService,
        { provide: IssueRepository, useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(IssueLifecycleService);
  });

  describe('Status Transition Validation', () => {
    it('should allow transition from open to in_progress', () => {
      expect(service.canTransitionTo('open', 'in_progress')).toBe(true);
    });

    it('should allow transition from open to closed', () => {
      expect(service.canTransitionTo('open', 'closed')).toBe(true);
    });

    it('should allow transition from in_progress to resolved', () => {
      expect(service.canTransitionTo('in_progress', 'resolved')).toBe(true);
    });

    it('should allow transition from in_progress to open (back to queue)', () => {
      expect(service.canTransitionTo('in_progress', 'open')).toBe(true);
    });

    it('should allow transition from resolved to verified', () => {
      expect(service.canTransitionTo('resolved', 'verified')).toBe(true);
    });

    it('should allow transition from resolved to in_progress (back to work)', () => {
      expect(service.canTransitionTo('resolved', 'in_progress')).toBe(true);
    });

    it('should allow transition from verified to closed', () => {
      expect(service.canTransitionTo('verified', 'closed')).toBe(true);
    });

    it('should allow transition from closed to open (reopen)', () => {
      expect(service.canTransitionTo('closed', 'open')).toBe(true);
    });

    it('should not allow invalid transition from open to verified', () => {
      expect(service.canTransitionTo('open', 'verified')).toBe(false);
    });

    it('should not allow invalid transition from open to resolved', () => {
      expect(service.canTransitionTo('open', 'resolved')).toBe(false);
    });
  });

  describe('getNextPossibleStatuses', () => {
    it('should return [in_progress, closed] for open status', () => {
      const nextStatuses = service.getNextPossibleStatuses('open');
      expect(nextStatuses).toContain('in_progress');
      expect(nextStatuses).toContain('closed');
      expect(nextStatuses.length).toBe(2);
    });

    it('should return [open, resolved, closed] for in_progress status', () => {
      const nextStatuses = service.getNextPossibleStatuses('in_progress');
      expect(nextStatuses).toContain('open');
      expect(nextStatuses).toContain('resolved');
      expect(nextStatuses).toContain('closed');
      expect(nextStatuses.length).toBe(3);
    });

    it('should return [in_progress, verified, closed] for resolved status', () => {
      const nextStatuses = service.getNextPossibleStatuses('resolved');
      expect(nextStatuses).toContain('in_progress');
      expect(nextStatuses).toContain('verified');
      expect(nextStatuses).toContain('closed');
      expect(nextStatuses.length).toBe(3);
    });

    it('should return [in_progress, closed] for verified status', () => {
      const nextStatuses = service.getNextPossibleStatuses('verified');
      expect(nextStatuses).toContain('in_progress');
      expect(nextStatuses).toContain('closed');
      expect(nextStatuses.length).toBe(2);
    });

    it('should return [open] for closed status', () => {
      const nextStatuses = service.getNextPossibleStatuses('closed');
      expect(nextStatuses).toContain('open');
      expect(nextStatuses.length).toBe(1);
    });
  });

  describe('getProgressPercentage', () => {
    it('should return 0 for open status', () => {
      expect(service.getProgressPercentage('open')).toBe(0);
    });

    it('should return 25 for in_progress status', () => {
      expect(service.getProgressPercentage('in_progress')).toBe(25);
    });

    it('should return 50 for resolved status', () => {
      expect(service.getProgressPercentage('resolved')).toBe(50);
    });

    it('should return 75 for verified status', () => {
      expect(service.getProgressPercentage('verified')).toBe(75);
    });

    it('should return 100 for closed status', () => {
      expect(service.getProgressPercentage('closed')).toBe(100);
    });
  });

  describe('canEdit', () => {
    it('should return true for open issues', () => {
      const issue = createMockIssue('open');
      expect(service.canEdit(issue)).toBe(true);
    });

    it('should return true for in_progress issues', () => {
      const issue = createMockIssue('in_progress');
      expect(service.canEdit(issue)).toBe(true);
    });

    it('should return true for resolved issues', () => {
      const issue = createMockIssue('resolved');
      expect(service.canEdit(issue)).toBe(true);
    });

    it('should return false for verified issues', () => {
      const issue = createMockIssue('verified');
      expect(service.canEdit(issue)).toBe(false);
    });

    it('should return false for closed issues', () => {
      const issue = createMockIssue('closed');
      expect(service.canEdit(issue)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true for open issues', () => {
      const issue = createMockIssue('open');
      expect(service.canDelete(issue)).toBe(true);
    });

    it('should return false for in_progress issues', () => {
      const issue = createMockIssue('in_progress');
      expect(service.canDelete(issue)).toBe(false);
    });

    it('should return false for resolved issues', () => {
      const issue = createMockIssue('resolved');
      expect(service.canDelete(issue)).toBe(false);
    });

    it('should return false for verified issues', () => {
      const issue = createMockIssue('verified');
      expect(service.canDelete(issue)).toBe(false);
    });

    it('should return false for closed issues', () => {
      const issue = createMockIssue('closed');
      expect(service.canDelete(issue)).toBe(false);
    });
  });

  describe('startProgress', () => {
    it('should transition issue from open to in_progress', async () => {
      const mockIssue = createMockIssue('open');
      const updatedIssue = { ...mockIssue, status: 'in_progress' as IssueStatus };

      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));
      mockRepository.update.and.returnValue(Promise.resolve(updatedIssue));

      const result = await service.startProgress('issue-001', 'user-001');

      expect(result.status).toBe('in_progress');
      expect(mockRepository.update).toHaveBeenCalledWith('issue-001', jasmine.objectContaining({ status: 'in_progress' }));
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for invalid transition', async () => {
      const mockIssue = createMockIssue('closed');
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));

      await expectAsync(service.startProgress('issue-001', 'user-001')).toBeRejectedWithError(/Invalid status transition/);
    });
  });

  describe('markResolved', () => {
    it('should transition issue from in_progress to resolved', async () => {
      const mockIssue = createMockIssue('in_progress');
      const updatedIssue = { ...mockIssue, status: 'resolved' as IssueStatus, resolvedAt: new Date() };

      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));
      mockRepository.update.and.returnValue(Promise.resolve(updatedIssue));

      const result = await service.markResolved('issue-001', 'user-001');

      expect(result.status).toBe('resolved');
      expect(mockRepository.update).toHaveBeenCalledWith(
        'issue-001',
        jasmine.objectContaining({
          status: 'resolved',
          resolvedAt: jasmine.any(Date)
        })
      );
    });
  });

  describe('markVerified', () => {
    it('should transition issue from resolved to verified', async () => {
      const mockIssue = createMockIssue('resolved');
      const updatedIssue = { ...mockIssue, status: 'verified' as IssueStatus };

      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));
      mockRepository.update.and.returnValue(Promise.resolve(updatedIssue));

      const result = await service.markVerified('issue-001', 'user-001');

      expect(result.status).toBe('verified');
    });
  });

  describe('closeIssue', () => {
    it('should transition issue to closed and emit event', async () => {
      const mockIssue = createMockIssue('verified');
      const updatedIssue = { ...mockIssue, status: 'closed' as IssueStatus, closedAt: new Date() };

      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));
      mockRepository.update.and.returnValue(Promise.resolve(updatedIssue));

      const result = await service.closeIssue('issue-001', 'user-001');

      expect(result.status).toBe('closed');
      // Check that ISSUE_CLOSED event was emitted
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2); // Once for update, once for closed
    });
  });

  describe('getLifecycleHistory', () => {
    it('should return basic history for a new issue', async () => {
      const mockIssue = createMockIssue('open');
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));

      const history = await service.getLifecycleHistory('issue-001');

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].status).toBe('open');
      expect(history[0].notes).toBe('Issue created');
    });

    it('should return empty array for non-existent issue', async () => {
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      const history = await service.getLifecycleHistory('non-existent');

      expect(history.length).toBe(0);
    });

    it('should include resolution in history', async () => {
      const mockIssue: Issue = {
        ...createMockIssue('resolved'),
        resolvedAt: new Date(),
        resolution: {
          resolutionMethod: 'Fixed',
          resolutionDate: new Date(),
          resolvedBy: 'user-002',
          notes: 'Fixed the issue',
          evidencePhotos: []
        }
      };
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(mockIssue));

      const history = await service.getLifecycleHistory('issue-001');

      expect(history.some(h => h.status === 'resolved')).toBe(true);
    });
  });
});
