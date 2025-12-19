/**
 * Contract Module Integration Tests
 *
 * Integration tests for Contract and WorkItem services.
 * Validates business logic, validation rules, and service coordination.
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';

import type { CreateContractDto, CreateWorkItemDto } from './models';
import { ContractRepository, ContractWorkItemRepository } from './repositories';
import { ContractService, WorkItemService } from './services';

describe('Contract Module Integration', () => {
  describe('ContractService Validation', () => {
    let service: ContractService;
    let mockRepo: jasmine.SpyObj<ContractRepository>;
    let mockEventBus: jasmine.SpyObj<EnhancedEventBusService>;
    let mockLogger: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
      mockRepo = jasmine.createSpyObj('ContractRepository', [
        'create',
        'update',
        'delete',
        'findByIdOnce',
        'findByBlueprint',
        'countByStatus',
        'updateStatus'
      ]);
      mockEventBus = jasmine.createSpyObj('EnhancedEventBusService', ['publishSystemEvent']);
      mockLogger = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']);

      TestBed.configureTestingModule({
        providers: [
          ContractService,
          { provide: ContractRepository, useValue: mockRepo },
          { provide: EnhancedEventBusService, useValue: mockEventBus },
          { provide: LoggerService, useValue: mockLogger }
        ]
      });

      service = TestBed.inject(ContractService);
    });

    describe('Create Contract Validation', () => {
      it('should reject empty title', async () => {
        const dto: CreateContractDto = {
          blueprintId: 'bp-1',
          title: '',
          owner: { id: 'o-1', name: 'Owner', type: 'owner', contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor', contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          createdBy: 'user-1'
        };

        await expectAsync(service.createContract('bp-1', dto, 'user-1')).toBeRejectedWithError('Contract title is required');
      });

      it('should reject title longer than 200 characters', async () => {
        const dto: CreateContractDto = {
          blueprintId: 'bp-1',
          title: 'A'.repeat(201),
          owner: { id: 'o-1', name: 'Owner', type: 'owner', contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor', contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          createdBy: 'user-1'
        };

        await expectAsync(service.createContract('bp-1', dto, 'user-1')).toBeRejectedWithError('Contract title must be less than 200 characters');
      });

      it('should reject invalid owner information', async () => {
        const dto: CreateContractDto = {
          blueprintId: 'bp-1',
          title: 'Test Contract',
          owner: { id: '', name: '', type: 'owner', contactPerson: '', contactPhone: '', contactEmail: '' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor', contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          createdBy: 'user-1'
        };

        await expectAsync(service.createContract('bp-1', dto, 'user-1')).toBeRejectedWithError('Contract owner information is required');
      });

      it('should reject zero or negative amount', async () => {
        const dto: CreateContractDto = {
          blueprintId: 'bp-1',
          title: 'Test Contract',
          owner: { id: 'o-1', name: 'Owner', type: 'owner', contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor', contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 0,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          createdBy: 'user-1'
        };

        await expectAsync(service.createContract('bp-1', dto, 'user-1')).toBeRejectedWithError('Contract total amount must be greater than zero');
      });

      it('should reject end date before start date', async () => {
        const dto: CreateContractDto = {
          blueprintId: 'bp-1',
          title: 'Test Contract',
          owner: { id: 'o-1', name: 'Owner', type: 'owner', contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor', contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          startDate: new Date('2025-12-31'),
          endDate: new Date('2025-01-01'),
          createdBy: 'user-1'
        };

        await expectAsync(service.createContract('bp-1', dto, 'user-1')).toBeRejectedWithError('Contract end date must be after start date');
      });
    });

    describe('Contract Status Transitions', () => {
      it('should allow transition from draft to pending_activation', async () => {
        const mockContract = {
          id: 'c-1',
          blueprintId: 'bp-1',
          contractNumber: 'CON-0001',
          title: 'Test Contract',
          status: 'draft' as const,
          owner: { id: 'o-1', name: 'Owner', type: 'owner' as const, contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor' as const, contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          currency: 'TWD',
          signingDate: new Date(),
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          originalFiles: [],
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedBy: 'user-1',
          updatedAt: new Date(),
          activatedBy: 'user-1',
          attachments: []
        };

        mockRepo.findByIdOnce.and.returnValue(Promise.resolve(mockContract));
        mockRepo.updateStatus.and.returnValue(Promise.resolve());
        mockEventBus.publishSystemEvent.and.returnValue(Promise.resolve());

        await expectAsync(service.updateContractStatus('bp-1', 'c-1', 'pending_activation', 'user-1')).toBeResolved();
        expect(mockRepo.updateStatus).toHaveBeenCalledWith('bp-1', 'c-1', 'pending_activation');
      });

      it('should reject invalid transition from completed to active', async () => {
        const mockContract = {
          id: 'c-1',
          blueprintId: 'bp-1',
          contractNumber: 'CON-0001',
          title: 'Test Contract',
          status: 'completed' as const,
          owner: { id: 'o-1', name: 'Owner', type: 'owner' as const, contactPerson: 'John', contactPhone: '123', contactEmail: 'j@test.com' },
          contractor: { id: 'c-1', name: 'Contractor', type: 'contractor' as const, contactPerson: 'Jane', contactPhone: '456', contactEmail: 'jane@test.com' },
          totalAmount: 1000000,
          currency: 'TWD',
          signingDate: new Date(),
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          originalFiles: [],
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedBy: 'user-1',
          updatedAt: new Date(),
          activatedBy: 'user-1',
          attachments: []
        };

        mockRepo.findByIdOnce.and.returnValue(Promise.resolve(mockContract));

        await expectAsync(service.updateContractStatus('bp-1', 'c-1', 'active', 'user-1')).toBeRejectedWithError(/Invalid status transition/);
      });
    });
  });

  describe('WorkItemService Validation', () => {
    let service: WorkItemService;
    let mockRepo: jasmine.SpyObj<ContractWorkItemRepository>;
    let mockEventBus: jasmine.SpyObj<EnhancedEventBusService>;
    let mockLogger: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
      mockRepo = jasmine.createSpyObj('ContractWorkItemRepository', [
        'create',
        'update',
        'delete',
        'findByIdOnce',
        'findByContract',
        'updateProgress',
        'linkTask',
        'unlinkTask'
      ]);
      mockEventBus = jasmine.createSpyObj('EnhancedEventBusService', ['publishSystemEvent']);
      mockLogger = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']);

      TestBed.configureTestingModule({
        providers: [
          WorkItemService,
          { provide: ContractWorkItemRepository, useValue: mockRepo },
          { provide: EnhancedEventBusService, useValue: mockEventBus },
          { provide: LoggerService, useValue: mockLogger }
        ]
      });

      service = TestBed.inject(WorkItemService);
    });

    describe('Create Work Item Validation', () => {
      it('should reject empty code', async () => {
        const dto: CreateWorkItemDto = {
          code: '',
          name: 'Test Work Item',
          unit: 'piece',
          quantity: 100,
          unitPrice: 1000
        };

        // Mock empty existing items
        mockRepo.findByContract.and.returnValue({ toPromise: () => Promise.resolve([]) } as any);

        await expectAsync(service.createWorkItem('bp-1', 'c-1', dto, 'user-1')).toBeRejectedWithError('Work item code is required');
      });

      it('should reject code longer than 50 characters', async () => {
        const dto: CreateWorkItemDto = {
          code: 'A'.repeat(51),
          name: 'Test Work Item',
          unit: 'piece',
          quantity: 100,
          unitPrice: 1000
        };

        mockRepo.findByContract.and.returnValue({ toPromise: () => Promise.resolve([]) } as any);

        await expectAsync(service.createWorkItem('bp-1', 'c-1', dto, 'user-1')).toBeRejectedWithError('Work item code must be less than 50 characters');
      });

      it('should reject zero or negative quantity', async () => {
        const dto: CreateWorkItemDto = {
          code: 'WI-001',
          name: 'Test Work Item',
          unit: 'piece',
          quantity: 0,
          unitPrice: 1000
        };

        mockRepo.findByContract.and.returnValue({ toPromise: () => Promise.resolve([]) } as any);

        await expectAsync(service.createWorkItem('bp-1', 'c-1', dto, 'user-1')).toBeRejectedWithError('Work item quantity must be greater than zero');
      });

      it('should reject duplicate code', async () => {
        const dto: CreateWorkItemDto = {
          code: 'WI-001',
          name: 'Test Work Item',
          unit: 'piece',
          quantity: 100,
          unitPrice: 1000
        };

        const existingItem = {
          id: 'wi-1',
          contractId: 'c-1',
          code: 'WI-001',
          name: 'Existing Item',
          unit: 'piece',
          quantity: 50,
          unitPrice: 500,
          totalPrice: 25000,
          linkedTaskIds: [],
          completedQuantity: 0,
          completedAmount: 0,
          completionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepo.findByContract.and.returnValue({ toPromise: () => Promise.resolve([existingItem]) } as any);

        await expectAsync(service.createWorkItem('bp-1', 'c-1', dto, 'user-1')).toBeRejectedWithError(/Work item with code WI-001 already exists/);
      });
    });

    describe('Progress Update Validation', () => {
      it('should reject negative completed quantity', async () => {
        const mockItem = {
          id: 'wi-1',
          contractId: 'c-1',
          code: 'WI-001',
          name: 'Test Item',
          unit: 'piece',
          quantity: 100,
          unitPrice: 1000,
          totalPrice: 100000,
          linkedTaskIds: [],
          completedQuantity: 0,
          completedAmount: 0,
          completionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepo.findByIdOnce.and.returnValue(Promise.resolve(mockItem));

        await expectAsync(
          service.updateWorkItemProgress('bp-1', 'c-1', 'wi-1', { completedQuantity: -10, completedAmount: 0 }, 'user-1')
        ).toBeRejectedWithError('Completed quantity cannot be negative');
      });

      it('should reject completed quantity exceeding total quantity', async () => {
        const mockItem = {
          id: 'wi-1',
          contractId: 'c-1',
          code: 'WI-001',
          name: 'Test Item',
          unit: 'piece',
          quantity: 100,
          unitPrice: 1000,
          totalPrice: 100000,
          linkedTaskIds: [],
          completedQuantity: 0,
          completedAmount: 0,
          completionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepo.findByIdOnce.and.returnValue(Promise.resolve(mockItem));

        await expectAsync(
          service.updateWorkItemProgress('bp-1', 'c-1', 'wi-1', { completedQuantity: 150, completedAmount: 0 }, 'user-1')
        ).toBeRejectedWithError(/Completed quantity.*cannot exceed total quantity/);
      });
    });
  });
});
