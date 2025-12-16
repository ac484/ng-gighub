/**
 * ContractCreationService Unit Tests
 *
 * Tests for Contract creation workflow and validation.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';

import type { Contract, CreateContractDto, CreateWorkItemDto, ContractParty } from '../models';
import { ContractCreationService } from './contract-creation.service';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

describe('ContractCreationService', () => {
  let service: ContractCreationService;
  let mockContractRepository: jasmine.SpyObj<ContractRepository>;
  let mockWorkItemRepository: jasmine.SpyObj<ContractWorkItemRepository>;
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

  const sampleWorkItems: CreateWorkItemDto[] = [
    {
      name: 'Foundation Work',
      description: 'Foundation construction',
      unit: '式',
      quantity: 1,
      unitPrice: 300000,
      category: 'foundation'
    },
    {
      name: 'Steel Structure',
      description: 'Steel frame installation',
      unit: '噸',
      quantity: 50,
      unitPrice: 4000,
      category: 'structure'
    }
  ];

  beforeEach(() => {
    mockContractRepository = jasmine.createSpyObj('ContractRepository', ['create', 'generateContractNumber']);
    mockWorkItemRepository = jasmine.createSpyObj('ContractWorkItemRepository', ['create']);
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        ContractCreationService,
        { provide: ContractRepository, useValue: mockContractRepository },
        { provide: ContractWorkItemRepository, useValue: mockWorkItemRepository },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    service = TestBed.inject(ContractCreationService);
  });

  describe('createDraft', () => {
    it('should create a draft contract with generated contract number', async () => {
      mockContractRepository.generateContractNumber.and.returnValue(Promise.resolve('CON-20251215-002'));
      mockContractRepository.create.and.returnValue(
        Promise.resolve({
          ...sampleContract,
          id: 'contract-002',
          contractNumber: 'CON-20251215-002',
          status: 'draft'
        })
      );

      const result = await service.createDraft('bp-001', sampleCreateData);

      expect(result.status).toBe('draft');
      expect(result.contractNumber).toBe('CON-20251215-002');
      expect(mockContractRepository.generateContractNumber).toHaveBeenCalledWith('bp-001');
      expect(mockContractRepository.create).toHaveBeenCalled();
    });

    it('should validate contract data before creation', async () => {
      const invalidData = { ...sampleCreateData, title: '' };

      await expectAsync(service.createDraft('bp-001', invalidData)).toBeRejected();
    });
  });

  describe('createWithWorkItems', () => {
    it('should create contract with work items', async () => {
      mockContractRepository.generateContractNumber.and.returnValue(Promise.resolve('CON-20251215-003'));
      mockContractRepository.create.and.returnValue(
        Promise.resolve({
          ...sampleContract,
          id: 'contract-003',
          contractNumber: 'CON-20251215-003',
          totalAmount: 500000
        })
      );
      mockWorkItemRepository.create.and.returnValue(
        Promise.resolve({
          id: 'item-001',
          ...sampleWorkItems[0]
        })
      );

      const result = await service.createWithWorkItems(
        'bp-001',
        {
          ...sampleCreateData,
          totalAmount: 500000
        },
        sampleWorkItems
      );

      expect(result.id).toBe('contract-003');
      expect(mockWorkItemRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should validate work items before creation', async () => {
      const invalidWorkItems = [{ ...sampleWorkItems[0], quantity: -1 }];

      await expectAsync(service.createWithWorkItems('bp-001', sampleCreateData, invalidWorkItems)).toBeRejected();
    });
  });

  describe('validateContractData', () => {
    it('should return valid for correct data', () => {
      const result = service.validateContractData(sampleCreateData);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail if title is missing', () => {
      const invalidData = { ...sampleCreateData, title: '' };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/title/i));
    });

    it('should fail if title is too short', () => {
      const invalidData = { ...sampleCreateData, title: 'Hi' };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/5/));
    });

    it('should fail if title is too long', () => {
      const invalidData = { ...sampleCreateData, title: 'A'.repeat(201) };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/200/));
    });

    it('should fail if owner information is missing', () => {
      const invalidData = { ...sampleCreateData, owner: undefined as unknown as ContractParty };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/owner/i));
    });

    it('should fail if contractor information is missing', () => {
      const invalidData = { ...sampleCreateData, contractor: undefined as unknown as ContractParty };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/contractor/i));
    });

    it('should fail if amount is not positive', () => {
      const invalidData = { ...sampleCreateData, totalAmount: 0 };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/amount/i));
    });

    it('should fail if dates are invalid', () => {
      const invalidData = {
        ...sampleCreateData,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01')
      };

      const result = service.validateContractData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/date/i));
    });
  });

  describe('validateContractParty', () => {
    it('should return valid for correct party data', () => {
      const result = service.validateContractParty(sampleOwner, 'owner');

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail if party name is missing', () => {
      const invalidParty = { ...sampleOwner, name: '' };

      const result = service.validateContractParty(invalidParty, 'owner');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/name/i));
    });

    it('should fail if contact person is missing', () => {
      const invalidParty = { ...sampleOwner, contactPerson: '' };

      const result = service.validateContractParty(invalidParty, 'contractor');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/contact/i));
    });
  });

  describe('validateWorkItemData', () => {
    it('should return valid for correct work item data', () => {
      const result = service.validateWorkItemData(sampleWorkItems[0]);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail if name is missing', () => {
      const invalidItem = { ...sampleWorkItems[0], name: '' };

      const result = service.validateWorkItemData(invalidItem);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/name/i));
    });

    it('should fail if quantity is not positive', () => {
      const invalidItem = { ...sampleWorkItems[0], quantity: 0 };

      const result = service.validateWorkItemData(invalidItem);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/quantity/i));
    });

    it('should fail if unit price is negative', () => {
      const invalidItem = { ...sampleWorkItems[0], unitPrice: -100 };

      const result = service.validateWorkItemData(invalidItem);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(jasmine.stringMatching(/price/i));
    });
  });

  describe('validateContractAmount', () => {
    it('should return valid when amounts match', () => {
      const result = service.validateContractAmount(500000, sampleWorkItems);

      expect(result.valid).toBe(true);
    });

    it('should return warning when amounts do not match exactly', () => {
      const result = service.validateContractAmount(600000, sampleWorkItems);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('calculateWorkItemTotals', () => {
    it('should calculate total amount from work items', () => {
      const result = service.calculateWorkItemTotals(sampleWorkItems);

      // 300000 * 1 + 4000 * 50 = 500000
      expect(result.totalAmount).toBe(500000);
      expect(result.itemCount).toBe(2);
    });

    it('should return zero for empty array', () => {
      const result = service.calculateWorkItemTotals([]);

      expect(result.totalAmount).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe('generateContractNumber', () => {
    it('should generate contract number with correct format', async () => {
      mockContractRepository.generateContractNumber.and.returnValue(Promise.resolve('CON-20251215-001'));

      const result = await service.generateContractNumber('bp-001');

      expect(result).toMatch(/^CON-\d{8}-\d{3}$/);
      expect(mockContractRepository.generateContractNumber).toHaveBeenCalledWith('bp-001');
    });
  });
});
