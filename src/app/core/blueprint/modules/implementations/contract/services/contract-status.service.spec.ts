/**
 * ContractStatusService Unit Tests
 *
 * Tests for contract status transitions and lifecycle management.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';

import type { Contract, ContractStatus, ContractParty } from '../models';
import { ContractStatusService } from './contract-status.service';
import { ContractRepository } from '../repositories/contract.repository';

describe('ContractStatusService', () => {
  let service: ContractStatusService;
  let mockContractRepository: jasmine.SpyObj<ContractRepository>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample party data
  const sampleOwner: ContractParty = {
    name: 'Test Owner Corp',
    contactPerson: 'John Owner',
    contactPhone: '0912345678',
    contactEmail: 'owner@test.com',
    address: '123 Owner Street'
  };

  const sampleContractor: ContractParty = {
    name: 'Test Contractor LLC',
    contactPerson: 'Jane Contractor',
    contactPhone: '0987654321',
    contactEmail: 'contractor@test.com',
    address: '456 Contractor Ave'
  };

  // Sample contract data
  const createSampleContract = (status: ContractStatus = 'draft'): Contract => ({
    id: 'contract-001',
    blueprintId: 'bp-001',
    contractNumber: 'CON-20251215-001',
    title: 'Test Construction Contract',
    description: 'Test contract description',
    owner: sampleOwner,
    contractor: sampleContractor,
    totalAmount: 1000000,
    currency: 'TWD',
    status,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    terms: 'Standard terms and conditions',
    originalFiles: [],
    workItems: [],
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    mockContractRepository = jasmine.createSpyObj('ContractRepository', ['findByIdOnce', 'updateStatus']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        ContractStatusService,
        { provide: ContractRepository, useValue: mockContractRepository },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(ContractStatusService);
  });

  describe('validateStatusTransition', () => {
    it('should allow draft -> pending_activation', () => {
      const result = service.validateStatusTransition('draft', 'pending_activation');

      expect(result.valid).toBe(true);
    });

    it('should allow pending_activation -> active', () => {
      const result = service.validateStatusTransition('pending_activation', 'active');

      expect(result.valid).toBe(true);
    });

    it('should allow pending_activation -> draft (reject)', () => {
      const result = service.validateStatusTransition('pending_activation', 'draft');

      expect(result.valid).toBe(true);
    });

    it('should allow active -> completed', () => {
      const result = service.validateStatusTransition('active', 'completed');

      expect(result.valid).toBe(true);
    });

    it('should allow active -> terminated', () => {
      const result = service.validateStatusTransition('active', 'terminated');

      expect(result.valid).toBe(true);
    });

    it('should not allow draft -> active directly', () => {
      const result = service.validateStatusTransition('draft', 'active');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/invalid/i));
    });

    it('should not allow completed -> active', () => {
      const result = service.validateStatusTransition('completed', 'active');

      expect(result.valid).toBe(false);
    });

    it('should not allow terminated -> any status', () => {
      const result = service.validateStatusTransition('terminated', 'draft');

      expect(result.valid).toBe(false);
    });
  });

  describe('changeStatus', () => {
    it('should change status from draft to pending_activation', async () => {
      const draftContract = createSampleContract('draft');
      const updatedContract = createSampleContract('pending_activation');

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));
      mockContractRepository.updateStatus.and.returnValue(Promise.resolve(updatedContract));

      const result = await service.changeStatus('bp-001', 'contract-001', 'pending_activation', 'user-001');

      expect(result.status).toBe('pending_activation');
      expect(mockContractRepository.updateStatus).toHaveBeenCalledWith('bp-001', 'contract-001', 'pending_activation');
    });

    it('should throw error for invalid status transition', async () => {
      const draftContract = createSampleContract('draft');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));

      await expectAsync(service.changeStatus('bp-001', 'contract-001', 'active', 'user-001')).toBeRejectedWithError(/invalid/i);
    });

    it('should throw error for non-existent contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      await expectAsync(service.changeStatus('bp-001', 'non-existent', 'pending_activation', 'user-001')).toBeRejectedWithError(
        /not found/i
      );
    });
  });

  describe('submitForActivation', () => {
    it('should submit draft contract for activation', async () => {
      const draftContract = createSampleContract('draft');
      const pendingContract = createSampleContract('pending_activation');

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));
      mockContractRepository.updateStatus.and.returnValue(Promise.resolve(pendingContract));

      const result = await service.submitForActivation('bp-001', 'contract-001', 'user-001');

      expect(result.status).toBe('pending_activation');
    });

    it('should throw error when submitting non-draft contract', async () => {
      const activeContract = createSampleContract('active');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));

      await expectAsync(service.submitForActivation('bp-001', 'contract-001', 'user-001')).toBeRejectedWithError(/invalid/i);
    });
  });

  describe('activate', () => {
    it('should activate pending contract', async () => {
      const pendingContract = createSampleContract('pending_activation');
      const activeContract = createSampleContract('active');

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(pendingContract));
      mockContractRepository.updateStatus.and.returnValue(Promise.resolve(activeContract));

      const result = await service.activate('bp-001', 'contract-001', 'user-001');

      expect(result.status).toBe('active');
    });

    it('should throw error when activating non-pending contract', async () => {
      const draftContract = createSampleContract('draft');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));

      await expectAsync(service.activate('bp-001', 'contract-001', 'user-001')).toBeRejectedWithError(/invalid/i);
    });
  });

  describe('complete', () => {
    it('should complete active contract', async () => {
      const activeContract = createSampleContract('active');
      const completedContract = createSampleContract('completed');

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));
      mockContractRepository.updateStatus.and.returnValue(Promise.resolve(completedContract));

      const result = await service.complete('bp-001', 'contract-001', 'user-001');

      expect(result.status).toBe('completed');
    });
  });

  describe('terminate', () => {
    it('should terminate active contract with reason', async () => {
      const activeContract = createSampleContract('active');
      const terminatedContract = createSampleContract('terminated');

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));
      mockContractRepository.updateStatus.and.returnValue(Promise.resolve(terminatedContract));

      const result = await service.terminate('bp-001', 'contract-001', 'user-001', 'Contract breach');

      expect(result.status).toBe('terminated');
    });
  });

  describe('canActivateContract', () => {
    it('should return true for pending contract', async () => {
      const pendingContract = createSampleContract('pending_activation');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(pendingContract));

      const result = await service.canActivateContract('bp-001', 'contract-001');

      expect(result.valid).toBe(true);
    });

    it('should return false for draft contract', async () => {
      const draftContract = createSampleContract('draft');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));

      const result = await service.canActivateContract('bp-001', 'contract-001');

      expect(result.valid).toBe(false);
    });
  });

  describe('canCompleteContract', () => {
    it('should return true for active contract', async () => {
      const activeContract = createSampleContract('active');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));

      const result = await service.canCompleteContract('bp-001', 'contract-001');

      expect(result.valid).toBe(true);
    });

    it('should return false for non-active contract', async () => {
      const draftContract = createSampleContract('draft');
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(draftContract));

      const result = await service.canCompleteContract('bp-001', 'contract-001');

      expect(result.valid).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for each status', () => {
      expect(service.getStatusLabel('draft')).toBe('草稿');
      expect(service.getStatusLabel('pending_activation')).toBe('待生效');
      expect(service.getStatusLabel('active')).toBe('已生效');
      expect(service.getStatusLabel('completed')).toBe('已完成');
      expect(service.getStatusLabel('terminated')).toBe('已終止');
    });
  });

  describe('canCreateTasks', () => {
    it('should return true only for active status', () => {
      expect(service.canCreateTasks('active')).toBe(true);
      expect(service.canCreateTasks('draft')).toBe(false);
      expect(service.canCreateTasks('pending_activation')).toBe(false);
      expect(service.canCreateTasks('completed')).toBe(false);
      expect(service.canCreateTasks('terminated')).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should return true for draft and pending_activation', () => {
      expect(service.canEdit('draft')).toBe(true);
      expect(service.canEdit('pending_activation')).toBe(true);
      expect(service.canEdit('active')).toBe(false);
      expect(service.canEdit('completed')).toBe(false);
      expect(service.canEdit('terminated')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true only for draft status', () => {
      expect(service.canDelete('draft')).toBe(true);
      expect(service.canDelete('pending_activation')).toBe(false);
      expect(service.canDelete('active')).toBe(false);
      expect(service.canDelete('completed')).toBe(false);
      expect(service.canDelete('terminated')).toBe(false);
    });
  });
});
