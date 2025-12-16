/**
 * IssueManagementService Unit Tests
 *
 * Tests for Issue CRUD operations and management.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';
import { of } from 'rxjs';

import type { Issue, CreateIssueData, IssueStatus } from '../models';
import { IssueRepository } from '../repositories';
import { IssueManagementService } from './issue-management.service';

describe('IssueManagementService', () => {
  let service: IssueManagementService;
  let mockRepository: jasmine.SpyObj<IssueRepository>;
  let mockEventBus: jasmine.SpyObj<EventBus>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample issue data for testing
  const sampleIssue: Issue = {
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
    status: 'open',
    beforePhotos: [],
    afterPhotos: [],
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sampleCreateData: CreateIssueData = {
    blueprintId: 'bp-001',
    title: 'New Issue',
    description: 'New issue description',
    location: 'Location A',
    severity: 'major',
    category: 'quality',
    responsibleParty: 'contractor-001',
    createdBy: 'user-001'
  };

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IssueRepository', [
      'create',
      'findByIdOnce',
      'findByBlueprint',
      'update',
      'delete',
      'getStatistics',
      'generateIssueNumber'
    ]);
    mockEventBus = jasmine.createSpyObj('EventBus', ['emit']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        IssueManagementService,
        { provide: IssueRepository, useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(IssueManagementService);
  });

  describe('createIssue', () => {
    it('should create a new issue with generated issue number', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0002'));
      mockRepository.create.and.returnValue(Promise.resolve({ ...sampleIssue, id: 'issue-002', issueNumber: 'ISS-0002' }));

      const result = await service.createIssue(sampleCreateData);

      expect(result.issueNumber).toBe('ISS-0002');
      expect(result.source).toBe('manual');
      expect(result.status).toBe('open');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should set default values for new issues', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0003'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.source).toBe('manual');
        expect(data.status).toBe('open');
        expect(data.beforePhotos).toEqual([]);
        expect(data.afterPhotos).toEqual([]);
        return Promise.resolve({ ...sampleIssue, ...data } as Issue);
      });

      await service.createIssue(sampleCreateData);

      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should emit ISSUE_CREATED event after creation', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0004'));
      mockRepository.create.and.returnValue(Promise.resolve(sampleIssue));

      await service.createIssue(sampleCreateData);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        jasmine.stringMatching(/ISSUE_CREATED/),
        jasmine.objectContaining({
          issueId: sampleIssue.id
        }),
        'issue'
      );
    });

    it('should handle optional beforePhotos', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0005'));
      mockRepository.create.and.returnValue(Promise.resolve(sampleIssue));

      const dataWithPhotos: CreateIssueData = {
        ...sampleCreateData,
        beforePhotos: ['photo1.jpg', 'photo2.jpg']
      };

      await service.createIssue(dataWithPhotos);

      expect(mockRepository.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beforePhotos: ['photo1.jpg', 'photo2.jpg']
        })
      );
    });
  });

  describe('getIssue', () => {
    it('should return issue by ID', async () => {
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleIssue));

      const result = await service.getIssue('issue-001');

      expect(result).toEqual(sampleIssue);
      expect(mockRepository.findByIdOnce).toHaveBeenCalledWith('issue-001');
    });

    it('should return null for non-existent issue', async () => {
      mockRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      const result = await service.getIssue('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listIssues', () => {
    it('should return all issues for a blueprint', async () => {
      const issues = [sampleIssue, { ...sampleIssue, id: 'issue-002' }];
      mockRepository.findByBlueprint.and.returnValue(of(issues));

      const result = await service.listIssues('bp-001');

      expect(result.length).toBe(2);
    });

    it('should apply filters when provided', async () => {
      mockRepository.findByBlueprint.and.returnValue(of([sampleIssue]));

      await service.listIssues('bp-001', { status: ['open'] });

      expect(mockRepository.findByBlueprint).toHaveBeenCalledWith('bp-001', { status: ['open'] });
    });
  });

  describe('updateIssue', () => {
    it('should update issue and emit event', async () => {
      const updatedIssue = { ...sampleIssue, title: 'Updated Title' };
      mockRepository.update.and.returnValue(Promise.resolve(updatedIssue));

      const result = await service.updateIssue('issue-001', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockRepository.update).toHaveBeenCalledWith('issue-001', { title: 'Updated Title' });
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      mockRepository.update.and.returnValue(Promise.resolve({ ...sampleIssue, description: 'New desc' }));

      await service.updateIssue('issue-001', { description: 'New desc' });

      expect(mockRepository.update).toHaveBeenCalledWith('issue-001', { description: 'New desc' });
    });
  });

  describe('deleteIssue', () => {
    it('should delete issue and emit event', async () => {
      mockRepository.delete.and.returnValue(Promise.resolve());

      await service.deleteIssue('issue-001');

      expect(mockRepository.delete).toHaveBeenCalledWith('issue-001');
      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return issue statistics for blueprint', async () => {
      const mockStats = {
        total: 10,
        open: 3,
        inProgress: 2,
        resolved: 2,
        verified: 1,
        closed: 2,
        bySeverity: { critical: 1, major: 5, minor: 4 },
        bySource: { manual: 5, acceptance: 3, qc: 1, warranty: 1, safety: 0 }
      };
      mockRepository.getStatistics.and.returnValue(Promise.resolve(mockStats));

      const result = await service.getStatistics('bp-001');

      expect(result.total).toBe(10);
      expect(result.open).toBe(3);
      expect(mockRepository.getStatistics).toHaveBeenCalledWith('bp-001');
    });
  });

  describe('assignIssue', () => {
    it('should assign user to issue and emit event', async () => {
      mockRepository.update.and.returnValue(Promise.resolve({ ...sampleIssue, assignedTo: 'user-002' }));

      const result = await service.assignIssue('issue-001', 'user-002');

      expect(result.assignedTo).toBe('user-002');
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        jasmine.stringMatching(/ISSUE_ASSIGNED/),
        jasmine.objectContaining({
          issueId: 'issue-001',
          assignedTo: 'user-002'
        }),
        'issue'
      );
    });
  });
});
