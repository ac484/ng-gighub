/**
 * ContractManagementService Unit Tests
 *
 * Tests for Contract CRUD operations and management.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { of } from 'rxjs';

import type { Contract, CreateContractDto, ContractStatus, ContractParty } from '../models';
import { ContractManagementService } from './contract-management.service';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

describe('ContractManagementService', () => {
  let service: ContractManagementService;
  let mockContractRepository: jasmine.SpyObj<ContractRepository>;
  let mockWorkItemRepository: jasmine.SpyObj<ContractWorkItemRepository>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample party data for testing
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

  // Sample contract data for testing
  const sampleContract: Contract = {
    id: 'contract-001',
    blueprintId: 'bp-001',
    contractNumber: 'CON-20251215-001',
    title: 'Test Construction Contract',
    description: 'Test contract description',
    owner: sampleOwner,
    contractor: sampleContractor,
    totalAmount: 1000000,
    currency: 'TWD',
    status: 'draft',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    terms: 'Standard terms and conditions',
    originalFiles: [],
    workItems: [],
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sampleCreateData: CreateContractDto = {
    blueprintId: 'bp-001',
    title: 'New Contract',
    description: 'New contract description',
    owner: sampleOwner,
    contractor: sampleContractor,
    totalAmount: 500000,
    currency: 'TWD',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-11-30'),
    createdBy: 'user-001'
  };

  beforeEach(() => {
    mockContractRepository = jasmine.createSpyObj('ContractRepository', [
      'create',
      'findByIdOnce',
      'findByBlueprint',
      'findByStatus',
      'update',
      'delete',
      'countByStatus',
      'generateContractNumber',
      'subscribeToContract',
      'subscribeToContracts'
    ]);
    mockWorkItemRepository = jasmine.createSpyObj('ContractWorkItemRepository', ['findByContract']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        ContractManagementService,
        { provide: ContractRepository, useValue: mockContractRepository },
        { provide: ContractWorkItemRepository, useValue: mockWorkItemRepository },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(ContractManagementService);
  });

  describe('create', () => {
    it('should create a new contract with valid data', async () => {
      mockContractRepository.create.and.returnValue(
        Promise.resolve({
          ...sampleContract,
          id: 'contract-002',
          title: sampleCreateData.title
        })
      );

      const result = await service.create('bp-001', sampleCreateData);

      expect(result.title).toBe('New Contract');
      expect(mockContractRepository.create).toHaveBeenCalled();
    });

    it('should validate contract title is required', async () => {
      const invalidData = { ...sampleCreateData, title: '' };

      await expectAsync(service.create('bp-001', invalidData)).toBeRejectedWithError(/Contract title is required/);
    });

    it('should validate owner information is required', async () => {
      const invalidData = { ...sampleCreateData, owner: undefined as unknown as ContractParty };

      await expectAsync(service.create('bp-001', invalidData)).toBeRejectedWithError(/Owner information is required/);
    });

    it('should validate contractor information is required', async () => {
      const invalidData = { ...sampleCreateData, contractor: undefined as unknown as ContractParty };

      await expectAsync(service.create('bp-001', invalidData)).toBeRejectedWithError(/Contractor information is required/);
    });

    it('should validate contract amount is greater than 0', async () => {
      const invalidData = { ...sampleCreateData, totalAmount: 0 };

      await expectAsync(service.create('bp-001', invalidData)).toBeRejectedWithError(/Contract amount must be greater than 0/);
    });

    it('should validate end date is after start date', async () => {
      const invalidData = {
        ...sampleCreateData,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01')
      };

      await expectAsync(service.create('bp-001', invalidData)).toBeRejectedWithError(/End date must be after start date/);
    });
  });

  describe('getById', () => {
    it('should return contract by ID', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));

      const result = await service.getById('bp-001', 'contract-001');

      expect(result).toEqual(sampleContract);
      expect(mockContractRepository.findByIdOnce).toHaveBeenCalledWith('bp-001', 'contract-001');
    });

    it('should return null for non-existent contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      const result = await service.getById('bp-001', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return all contracts for a blueprint', async () => {
      const contracts = [sampleContract, { ...sampleContract, id: 'contract-002' }];
      mockContractRepository.findByBlueprint.and.returnValue(of(contracts));

      const result = await service.list('bp-001');

      expect(result.length).toBe(2);
    });

    it('should apply filters when provided', async () => {
      mockContractRepository.findByBlueprint.and.returnValue(of([sampleContract]));

      await service.list('bp-001', { status: ['draft'] });

      expect(mockContractRepository.findByBlueprint).toHaveBeenCalledWith('bp-001', { status: ['draft'] });
    });
  });

  describe('update', () => {
    it('should update contract and return updated data', async () => {
      const updatedContract = { ...sampleContract, title: 'Updated Title' };
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));
      mockContractRepository.update.and.returnValue(Promise.resolve(updatedContract));

      const result = await service.update('bp-001', 'contract-001', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockContractRepository.update).toHaveBeenCalledWith('bp-001', 'contract-001', { title: 'Updated Title' });
    });

    it('should throw error for non-existent contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      await expectAsync(service.update('bp-001', 'non-existent', { title: 'New Title' })).toBeRejectedWithError(/not found/);
    });

    it('should restrict updates for active contracts', async () => {
      const activeContract = { ...sampleContract, status: 'active' as ContractStatus };
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));

      await expectAsync(service.update('bp-001', 'contract-001', { owner: sampleOwner })).toBeRejectedWithError(/Cannot modify owner/);
    });
  });

  describe('delete', () => {
    it('should delete draft contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));
      mockContractRepository.delete.and.returnValue(Promise.resolve());

      await service.delete('bp-001', 'contract-001');

      expect(mockContractRepository.delete).toHaveBeenCalledWith('bp-001', 'contract-001');
    });

    it('should throw error when deleting non-draft contract', async () => {
      const activeContract = { ...sampleContract, status: 'active' as ContractStatus };
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));

      await expectAsync(service.delete('bp-001', 'contract-001')).toBeRejectedWithError(/Only draft contracts can be deleted/);
    });
  });

  describe('validateForTaskCreation', () => {
    it('should validate active contract can create tasks', async () => {
      const activeContract = { ...sampleContract, status: 'active' as ContractStatus };
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));
      mockWorkItemRepository.findByContract.and.returnValue(of([{ id: 'item-001', quantity: 10, completedQuantity: 5 }]));

      const result = await service.validateForTaskCreation('bp-001', 'contract-001');

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail validation for draft contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));
      mockWorkItemRepository.findByContract.and.returnValue(of([]));

      const result = await service.validateForTaskCreation('bp-001', 'contract-001');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/must be active/));
    });

    it('should fail validation for contract without work items', async () => {
      const activeContract = { ...sampleContract, status: 'active' as ContractStatus };
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(activeContract));
      mockWorkItemRepository.findByContract.and.returnValue(of([]));

      const result = await service.validateForTaskCreation('bp-001', 'contract-001');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Contract has no work items');
    });
  });

  describe('calculateContractProgress', () => {
    it('should calculate progress from work items', async () => {
      mockWorkItemRepository.findByContract.and.returnValue(
        of([
          { quantity: 10, completedQuantity: 5, totalPrice: 100000, completedAmount: 50000, completionPercentage: 50 },
          { quantity: 20, completedQuantity: 20, totalPrice: 200000, completedAmount: 200000, completionPercentage: 100 }
        ])
      );

      const result = await service.calculateContractProgress('bp-001', 'contract-001');

      expect(result.totalWorkItems).toBe(2);
      expect(result.completedWorkItems).toBe(1);
      expect(result.totalQuantity).toBe(30);
      expect(result.completedQuantity).toBe(25);
      expect(result.totalAmount).toBe(300000);
      expect(result.completedAmount).toBe(250000);
      expect(result.overallPercentage).toBe(83);
    });
  });

  describe('checkContractExpiry', () => {
    it('should detect expired contract', () => {
      const expiredContract = {
        ...sampleContract,
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
      };

      const result = service.checkContractExpiry(expiredContract);

      expect(result.isExpired).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThan(0);
    });

    it('should detect expiring contract within 30 days', () => {
      const expiringContract = {
        ...sampleContract,
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15) // 15 days from now
      };

      const result = service.checkContractExpiry(expiringContract);

      expect(result.isExpired).toBe(false);
      expect(result.isExpiring).toBe(true);
      expect(result.daysUntilExpiry).toBeGreaterThan(0);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(30);
    });

    it('should not mark contract as expiring if more than 30 days left', () => {
      const normalContract = {
        ...sampleContract,
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) // 60 days from now
      };

      const result = service.checkContractExpiry(normalContract);

      expect(result.isExpired).toBe(false);
      expect(result.isExpiring).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return contract statistics for blueprint', async () => {
      const mockStatusCounts = {
        draft: 2,
        pending_activation: 1,
        active: 3,
        completed: 1,
        terminated: 0
      };
      mockContractRepository.countByStatus.and.returnValue(Promise.resolve(mockStatusCounts));
      mockContractRepository.findByBlueprint.and.returnValue(
        of([
          { ...sampleContract, totalAmount: 100000, status: 'active' },
          { ...sampleContract, totalAmount: 200000, status: 'active' },
          { ...sampleContract, totalAmount: 50000, status: 'draft' }
        ])
      );

      const result = await service.getStatistics('bp-001');

      expect(result.total).toBe(3);
      expect(result.draft).toBe(2);
      expect(result.active).toBe(3);
      expect(result.totalValue).toBe(350000);
      expect(result.activeValue).toBe(300000);
    });
  });

  describe('findActiveContracts', () => {
    it('should return only active contracts', async () => {
      const activeContracts = [
        { ...sampleContract, status: 'active' as ContractStatus },
        { ...sampleContract, id: 'contract-002', status: 'active' as ContractStatus }
      ];
      mockContractRepository.findByStatus.and.returnValue(of(activeContracts));

      const result = await service.findActiveContracts('bp-001');

      expect(result.length).toBe(2);
      expect(result.every(c => c.status === 'active')).toBe(true);
    });
  });

  describe('findExpiringContracts', () => {
    it('should find contracts expiring within specified days', async () => {
      const now = Date.now();
      const activeContracts = [
        { ...sampleContract, status: 'active' as ContractStatus, endDate: new Date(now + 1000 * 60 * 60 * 24 * 10) }, // 10 days
        { ...sampleContract, id: 'contract-002', status: 'active' as ContractStatus, endDate: new Date(now + 1000 * 60 * 60 * 24 * 20) }, // 20 days
        { ...sampleContract, id: 'contract-003', status: 'active' as ContractStatus, endDate: new Date(now + 1000 * 60 * 60 * 24 * 40) } // 40 days
      ];
      mockContractRepository.findByStatus.and.returnValue(of(activeContracts));

      const result = await service.findExpiringContracts('bp-001', 30);

      expect(result.length).toBe(2);
    });
  });

  describe('subscribeToContract', () => {
    it('should return observable for real-time contract updates', () => {
      mockContractRepository.subscribeToContract.and.returnValue(of(sampleContract));

      const observable = service.subscribeToContract('bp-001', 'contract-001');

      expect(observable).toBeDefined();
      expect(mockContractRepository.subscribeToContract).toHaveBeenCalledWith('bp-001', 'contract-001');
    });
  });

  describe('subscribeToContracts', () => {
    it('should return observable for real-time contracts list', () => {
      mockContractRepository.subscribeToContracts.and.returnValue(of([sampleContract]));

      const observable = service.subscribeToContracts('bp-001');

      expect(observable).toBeDefined();
      expect(mockContractRepository.subscribeToContracts).toHaveBeenCalledWith('bp-001', undefined);
    });
  });
});
