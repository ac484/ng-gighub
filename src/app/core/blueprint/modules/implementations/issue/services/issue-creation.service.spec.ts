/**
 * IssueCreationService Unit Tests
 *
 * Tests for auto-creation of issues from multiple sources.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';

import type { Issue, IssueFromAcceptanceParams, IssueFromQCParams, IssueFromWarrantyParams, IssueFromSafetyParams } from '../models';
import { IssueRepository } from '../repositories';
import { IssueCreationService } from './issue-creation.service';

describe('IssueCreationService', () => {
  let service: IssueCreationService;
  let mockRepository: jasmine.SpyObj<IssueRepository>;
  let mockEventBus: jasmine.SpyObj<EventBus>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample issue for testing
  const createMockIssue = (id: string, source: string): Issue => ({
    id,
    blueprintId: 'bp-001',
    issueNumber: `ISS-${id.slice(-4)}`,
    source: source as Issue['source'],
    sourceId: 'source-001',
    title: 'Test Issue',
    description: 'Test description',
    location: 'Test location',
    severity: 'major',
    category: 'quality',
    responsibleParty: 'contractor-001',
    status: 'open',
    beforePhotos: [],
    afterPhotos: [],
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IssueRepository', ['create', 'generateIssueNumber', 'createBatch']);
    mockEventBus = jasmine.createSpyObj('EventBus', ['emit']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        IssueCreationService,
        { provide: IssueRepository, useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(IssueCreationService);
  });

  describe('autoCreateFromAcceptance', () => {
    const acceptanceParams: IssueFromAcceptanceParams = {
      acceptanceId: 'acc-001',
      blueprintId: 'bp-001',
      failedItems: [
        { itemName: '油漆品質', location: '客廳', notes: '有裂紋' },
        { itemName: '地板平整度', location: '主臥' }
      ],
      contractorId: 'contractor-001',
      inspectorId: 'inspector-001'
    };

    it('should create one issue per failed item', async () => {
      mockRepository.generateIssueNumber.and.returnValues(Promise.resolve('ISS-0001'), Promise.resolve('ISS-0002'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        return Promise.resolve({ ...createMockIssue(`issue-${data.issueNumber}`, 'acceptance'), ...data } as Issue);
      });

      const issues = await service.autoCreateFromAcceptance(acceptanceParams);

      expect(issues.length).toBe(2);
      expect(mockRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should set source as acceptance', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.source).toBe('acceptance');
        expect(data.sourceId).toBe('acc-001');
        return Promise.resolve(createMockIssue('issue-001', 'acceptance'));
      });

      await service.autoCreateFromAcceptance({
        ...acceptanceParams,
        failedItems: [acceptanceParams.failedItems[0]]
      });

      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should emit ISSUE_CREATED_FROM_ACCEPTANCE event', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'acceptance')));

      await service.autoCreateFromAcceptance({
        ...acceptanceParams,
        failedItems: [acceptanceParams.failedItems[0]]
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(jasmine.stringMatching(/CREATED_FROM_ACCEPTANCE/), jasmine.any(Object), 'issue');
    });

    it('should include photos from failed items', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.beforePhotos).toEqual(['photo1.jpg', 'photo2.jpg']);
        return Promise.resolve(createMockIssue('issue-001', 'acceptance'));
      });

      await service.autoCreateFromAcceptance({
        ...acceptanceParams,
        failedItems: [{ itemName: '油漆品質', location: '客廳', photos: ['photo1.jpg', 'photo2.jpg'] }]
      });
    });
  });

  describe('autoCreateFromQC', () => {
    const qcParams: IssueFromQCParams = {
      inspectionId: 'qc-001',
      blueprintId: 'bp-001',
      failedItems: [{ itemName: '鋼筋間距', location: '2F', notes: '不符規範' }],
      contractorId: 'contractor-001',
      inspectorId: 'inspector-001'
    };

    it('should create issue from QC failure', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'qc')));

      const issues = await service.autoCreateFromQC(qcParams);

      expect(issues.length).toBe(1);
      expect(issues[0].source).toBe('qc');
    });

    it('should set sourceId to inspectionId', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.sourceId).toBe('qc-001');
        return Promise.resolve(createMockIssue('issue-001', 'qc'));
      });

      await service.autoCreateFromQC(qcParams);
    });

    it('should emit ISSUE_CREATED_FROM_QC event', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'qc')));

      await service.autoCreateFromQC(qcParams);

      expect(mockEventBus.emit).toHaveBeenCalledWith(jasmine.stringMatching(/CREATED_FROM_QC/), jasmine.any(Object), 'issue');
    });
  });

  describe('autoCreateFromWarranty', () => {
    const warrantyParams: IssueFromWarrantyParams = {
      warrantyDefectId: 'wd-001',
      blueprintId: 'bp-001',
      title: '牆面滲水',
      description: '北面牆壁有滲水現象',
      location: '客廳北側',
      severity: 'major',
      warrantor: 'contractor-001',
      reportedBy: 'owner-001'
    };

    it('should create single issue from warranty defect', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'warranty')));

      const issue = await service.autoCreateFromWarranty(warrantyParams);

      expect(issue.source).toBe('warranty');
      expect(issue.sourceId).toBe('wd-001');
    });

    it('should use provided title and description', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.title).toBe('牆面滲水');
        expect(data.description).toBe('北面牆壁有滲水現象');
        return Promise.resolve(createMockIssue('issue-001', 'warranty'));
      });

      await service.autoCreateFromWarranty(warrantyParams);
    });

    it('should set category to warranty', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.category).toBe('warranty');
        return Promise.resolve(createMockIssue('issue-001', 'warranty'));
      });

      await service.autoCreateFromWarranty(warrantyParams);
    });
  });

  describe('autoCreateFromSafety', () => {
    const safetyParams: IssueFromSafetyParams = {
      incidentId: 'si-001',
      blueprintId: 'bp-001',
      title: '安全設施缺失',
      description: '施工區域缺少警示標誌',
      location: '1F 施工區',
      severity: 'critical',
      responsibleParty: 'contractor-001',
      reportedBy: 'safety-officer-001'
    };

    it('should create issue from safety incident', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'safety')));

      const issue = await service.autoCreateFromSafety(safetyParams);

      expect(issue.source).toBe('safety');
    });

    it('should set category to safety', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.callFake((data: Partial<Issue>) => {
        expect(data.category).toBe('safety');
        return Promise.resolve(createMockIssue('issue-001', 'safety'));
      });

      await service.autoCreateFromSafety(safetyParams);
    });

    it('should emit ISSUE_CREATED_FROM_SAFETY event', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.resolve(createMockIssue('issue-001', 'safety')));

      await service.autoCreateFromSafety(safetyParams);

      expect(mockEventBus.emit).toHaveBeenCalledWith(jasmine.stringMatching(/CREATED_FROM_SAFETY/), jasmine.any(Object), 'issue');
    });
  });

  describe('Error Handling', () => {
    it('should log error when creation fails', async () => {
      mockRepository.generateIssueNumber.and.returnValue(Promise.resolve('ISS-0001'));
      mockRepository.create.and.returnValue(Promise.reject(new Error('Database error')));

      await expectAsync(
        service.autoCreateFromAcceptance({
          acceptanceId: 'acc-001',
          blueprintId: 'bp-001',
          failedItems: [{ itemName: 'Test', location: 'Test' }],
          contractorId: 'contractor-001',
          inspectorId: 'inspector-001'
        })
      ).toBeRejectedWithError('Database error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
