/**
 * Unit tests for ContractFacade
 *
 * Tests facade orchestration, state management, repository integration, and event emission.
 * Uses Jasmine Spy Objects to mock Store, Repository, and EventBus dependencies.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';
import { ContractFacade, ContractEvents } from './contract.facade';
import { ContractStore } from '../store';
import { ContractRepository } from '../repositories';
import type {Contract, ContractStatus, CreateContractDto, UpdateContractDto } from '../models';

describe('ContractFacade', () => {
  let facade: ContractFacade;
  let mockStore: jasmine.SpyObj<ContractStore>;
  let mockRepository: jasmine.SpyObj<ContractRepository>;
  let mockEventBus: jasmine.SpyObj<EnhancedEventBusService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Sample test data
  const sampleBlueprintId = 'BP-001';
  const sampleUserId = 'user-123';
  const sampleContractId = 'CONTRACT-001';

  const sampleContract: Contract = {
    id: sampleContractId,
    blueprintId: sampleBlueprintId,
    contractNumber: 'CT-2025-001',
    title: 'Test Contract',
    description: 'Test Description',
    status: 'draft' as ContractStatus,
    owner: {
      type: 'company',
      name: 'Owner Corp',
      contactPerson: 'John Doe',
      contactPhone: '123-456-7890',
      contactEmail: 'john@owner.com',
      address: '123 Main St'
    },
    contractor: {
      type: 'company',
      name: 'Contractor LLC',
      contactPerson: 'Jane Smith',
      contactPhone: '098-765-4321',
      contactEmail: 'jane@contractor.com',
      address: '456 Oak Ave'
    },
    contractAmount: 1000000,
    currency: 'TWD',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    signingDate: new Date('2024-12-15'),
    createdAt: new Date(),
    createdBy: sampleUserId,
    updatedAt: new Date(),
    updatedBy: sampleUserId
  };

  beforeEach(() => {
    // Create mock Store with Signal-like behavior
    mockStore = jasmine.createSpyObj('ContractStore', [
      'setLoading',
      'clearError',
      'setError',
      'setContracts',
      'addContract',
      'updateContract',
      'removeContract',
      'selectContract',
      'clearSelection',
      'setFilters',
      'clearFilters',
      'getContractById',
      'hasContract',
      'getContractsByStatus',
      'reset'
    ]);

    // Mock Store signals
    (mockStore as any).loading = jasmine.createSpy('loading').and.returnValue(false);
    (mockStore as any).error = jasmine.createSpy('error').and.returnValue(null);
    (mockStore as any).contracts = jasmine.createSpy('contracts').and.returnValue([]);
    (mockStore as any).selectedContract = jasmine.createSpy('selectedContract').and.returnValue(null);
    (mockStore as any).filteredContracts = jasmine.createSpy('filteredContracts').and.returnValue([]);
    (mockStore as any).activeContracts = jasmine.createSpy('activeContracts').and.returnValue([]);
    (mockStore as any).draftContracts = jasmine.createSpy('draftContracts').and.returnValue([]);
    (mockStore as any).completedContracts = jasmine.createSpy('completedContracts').and.returnValue([]);
    (mockStore as any).totalContracts = jasmine.createSpy('totalContracts').and.returnValue(0);
    (mockStore as any).totalContractValue = jasmine.createSpy('totalContractValue').and.returnValue(0);
    (mockStore as any).hasSelection = jasmine.createSpy('hasSelection').and.returnValue(false);
    (mockStore as any).hasActiveFilters = jasmine.createSpy('hasActiveFilters').and.returnValue(false);
    (mockStore as any).filteredCount = jasmine.createSpy('filteredCount').and.returnValue(0);
    (mockStore as any).hasError = jasmine.createSpy('hasError').and.returnValue(false);

    // Create mock Repository
    mockRepository = jasmine.createSpyObj('ContractRepository', [
      'findByBlueprint',
      'findById',
      'create',
      'update',
      'delete'
    ]);

    // Create mock EventBus
    mockEventBus = jasmine.createSpyObj('EnhancedEventBusService', [
      'initialize',
      'emitEvent'
    ]);

    // Create mock Logger
    mockLogger = jasmine.createSpyObj('LoggerService', [
      'info',
      'debug',
      'warn',
      'error'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ContractFacade,
        { provide: ContractStore, useValue: mockStore },
        { provide: ContractRepository, useValue: mockRepository },
        { provide: EnhancedEventBusService, useValue: mockEventBus },
        { provide: LoggerService, useValue: mockLogger }
      ]
    });

    facade = TestBed.inject(ContractFacade);
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with blueprint and user context', () => {
      mockRepository.findByBlueprint.and.returnValue(of([sampleContract]));

      facade.initialize(sampleBlueprintId, sampleUserId);

      expect(mockEventBus.initialize).toHaveBeenCalledWith(sampleBlueprintId, sampleUserId);
      expect(mockLogger.info).toHaveBeenCalledWith('[ContractFacade]', 'Initializing', {
        blueprintId: sampleBlueprintId,
        userId: sampleUserId
      });
    });

    it('should load contracts on initialization', async () => {
      mockRepository.findByBlueprint.and.returnValue(of([sampleContract]));

      facade.initialize(sampleBlueprintId, sampleUserId);

      // Wait for async loadContracts
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRepository.findByBlueprint).toHaveBeenCalledWith(sampleBlueprintId);
      expect(mockStore.setContracts).toHaveBeenCalledWith([sampleContract]);
    });

    it('should handle initialization load errors gracefully', async () => {
      const errorMessage = 'Failed to load contracts';
      mockRepository.findByBlueprint.and.returnValue(throwError(() => new Error(errorMessage)));

      facade.initialize(sampleBlueprintId, sampleUserId);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should reset facade state on reset', () => {
      facade.initialize(sampleBlueprintId, sampleUserId);
      facade.reset();

      expect(mockStore.reset).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('[ContractFacade]', 'Resetting facade');
    });
  });

  // ============================================================================
  // Query Operations Tests
  // ============================================================================

  describe('Query Operations', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
    });

    it('should load all contracts for blueprint', async () => {
      const contracts = [sampleContract];
      mockRepository.findByBlueprint.and.returnValue(of(contracts));

      await facade.loadContracts();

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockRepository.findByBlueprint).toHaveBeenCalledWith(sampleBlueprintId);
      expect(mockStore.setContracts).toHaveBeenCalledWith(contracts);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should throw error when loading without initialization', async () => {
      facade.reset(); // Clear initialization

      await expectAsync(facade.loadContracts()).toBeRejectedWithError(/Blueprint ID not set/);
    });

    it('should handle load contracts errors', async () => {
      const errorMessage = 'Network error';
      mockRepository.findByBlueprint.and.returnValue(throwError(() => new Error(errorMessage)));

      await facade.loadContracts();

      expect(mockStore.setError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should load single contract by ID', async () => {
      mockRepository.findById.and.returnValue(of(sampleContract));
      mockStore.hasContract.and.returnValue(false);

      const result = await facade.loadContractById(sampleContractId);

      expect(mockRepository.findById).toHaveBeenCalledWith(sampleBlueprintId, sampleContractId);
      expect(mockStore.addContract).toHaveBeenCalledWith(sampleContract);
      expect(result).toEqual(sampleContract);
    });

    it('should update existing contract in store when loading by ID', async () => {
      mockRepository.findById.and.returnValue(of(sampleContract));
      mockStore.hasContract.and.returnValue(true);

      await facade.loadContractById(sampleContractId);

      expect(mockStore.updateContract).toHaveBeenCalledWith(sampleContractId, sampleContract);
      expect(mockStore.addContract).not.toHaveBeenCalled();
    });

    it('should return null when contract not found', async () => {
      mockRepository.findById.and.returnValue(of(null));

      const result = await facade.loadContractById(sampleContractId);

      expect(result).toBeNull();
    });

    it('should subscribe to real-time contract updates', () => {
      mockRepository.findByBlueprint.and.returnValue(of([sampleContract]));

      facade.subscribeToContracts();

      expect(mockRepository.findByBlueprint).toHaveBeenCalledWith(sampleBlueprintId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[ContractFacade]',
        'Subscribing to real-time updates',
        { blueprintId: sampleBlueprintId }
      );
    });
  });

  // ============================================================================
  // Create Operations Tests
  // ============================================================================

  describe('Create Operations', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
    });

    it('should create new contract successfully', async () => {
      const createDto: CreateContractDto = {
        title: 'New Contract',
        description: 'New Description',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        signingDate: new Date('2024-12-15')
      };

      mockRepository.create.and.returnValue(Promise.resolve(sampleContract));

      const result = await facade.createContract(createDto);

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(sampleBlueprintId, createDto);
      expect(mockStore.addContract).toHaveBeenCalledWith(sampleContract);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
      expect(result).toEqual(sampleContract);
    });

    it('should emit CREATED event after successful creation', async () => {
      const createDto: CreateContractDto = {
        title: 'New Contract',
        description: '',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date(),
        endDate: new Date(),
        signingDate: new Date()
      };

      mockRepository.create.and.returnValue(Promise.resolve(sampleContract));

      await facade.createContract(createDto);

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.CREATED,
          blueprintId: sampleBlueprintId,
          data: jasmine.objectContaining({
            contractId: sampleContract.id,
            contractNumber: sampleContract.contractNumber,
            title: sampleContract.title
          })
        })
      );
    });

    it('should handle create errors', async () => {
      const createDto: CreateContractDto = {
        title: 'New Contract',
        description: '',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date(),
        endDate: new Date(),
        signingDate: new Date()
      };

      const errorMessage = 'Failed to create';
      mockRepository.create.and.returnValue(Promise.reject(new Error(errorMessage)));

      await expectAsync(facade.createContract(createDto)).toBeRejectedWithError(errorMessage);

      expect(mockStore.setError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw error when creating without initialization', async () => {
      facade.reset();

      const createDto: CreateContractDto = {
        title: 'Test',
        description: '',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date(),
        endDate: new Date(),
        signingDate: new Date()
      };

      await expectAsync(facade.createContract(createDto)).toBeRejectedWithError(/Blueprint ID not set/);
    });
  });

  // ============================================================================
  // Update Operations Tests
  // ============================================================================

  describe('Update Operations', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
    });

    it('should update existing contract', async () => {
      const updateDto: UpdateContractDto = {
        title: 'Updated Title',
        updatedAt: new Date(),
        updatedBy: sampleUserId
      };

      mockRepository.update.and.returnValue(Promise.resolve());
      mockRepository.findById.and.returnValue(of({ ...sampleContract, ...updateDto }));

      await facade.updateContract(sampleContractId, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(sampleBlueprintId, sampleContractId, updateDto);
      expect(mockRepository.findById).toHaveBeenCalledWith(sampleBlueprintId, sampleContractId);
    });

    it('should emit UPDATED event after successful update', async () => {
      const updateDto: UpdateContractDto = {
        title: 'Updated Title',
        updatedAt: new Date(),
        updatedBy: sampleUserId
      };

      mockRepository.update.and.returnValue(Promise.resolve());
      mockRepository.findById.and.returnValue(of({ ...sampleContract, ...updateDto }));

      await facade.updateContract(sampleContractId, updateDto);

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.UPDATED,
          data: jasmine.objectContaining({
            contractId: sampleContractId,
            changes: updateDto
          })
        })
      );
    });

    it('should handle update errors', async () => {
      const updateDto: UpdateContractDto = {
        title: 'Updated Title',
        updatedAt: new Date(),
        updatedBy: sampleUserId
      };

      const errorMessage = 'Update failed';
      mockRepository.update.and.returnValue(Promise.reject(new Error(errorMessage)));

      await expectAsync(facade.updateContract(sampleContractId, updateDto)).toBeRejectedWithError(errorMessage);

      expect(mockStore.setError).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Status Change Tests
  // ============================================================================

  describe('Status Change Operations', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
      mockStore.getContractById.and.returnValue(sampleContract);
    });

    it('should change contract status successfully', async () => {
      const newStatus: ContractStatus = 'active';

      mockRepository.update.and.returnValue(Promise.resolve());

      await facade.changeContractStatus(sampleContractId, newStatus);

      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockStore.updateContract).toHaveBeenCalledWith(sampleContractId, { status: newStatus });
    });

    it('should emit STATUS_CHANGED event', async () => {
      const newStatus: ContractStatus = 'active';
      mockRepository.update.and.returnValue(Promise.resolve());

      await facade.changeContractStatus(sampleContractId, newStatus);

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.STATUS_CHANGED,
          data: jasmine.objectContaining({
            contractId: sampleContractId,
            oldStatus: 'draft',
            newStatus: 'active'
          })
        })
      );
    });

    it('should emit ACTIVATED event when status changes to active', async () => {
      mockRepository.update.and.returnValue(Promise.resolve());

      await facade.changeContractStatus(sampleContractId, 'active');

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.ACTIVATED
        })
      );
    });

    it('should emit COMPLETED event when status changes to completed', async () => {
      mockRepository.update.and.returnValue(Promise.resolve());

      await facade.changeContractStatus(sampleContractId, 'completed');

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.COMPLETED
        })
      );
    });

    it('should emit TERMINATED event when status changes to terminated', async () => {
      mockRepository.update.and.returnValue(Promise.resolve());

      await facade.changeContractStatus(sampleContractId, 'terminated');

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.TERMINATED
        })
      );
    });

    it('should throw error when contract not found in store', async () => {
      mockStore.getContractById.and.returnValue(undefined);

      await expectAsync(
        facade.changeContractStatus(sampleContractId, 'active')
      ).toBeRejectedWithError(/not found in store/);
    });
  });

  // ============================================================================
  // Delete Operations Tests
  // ============================================================================

  describe('Delete Operations', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
      mockStore.getContractById.and.returnValue(sampleContract);
    });

    it('should delete contract successfully', async () => {
      mockRepository.delete.and.returnValue(Promise.resolve());

      await facade.deleteContract(sampleContractId);

      expect(mockRepository.delete).toHaveBeenCalledWith(sampleBlueprintId, sampleContractId);
      expect(mockStore.removeContract).toHaveBeenCalledWith(sampleContractId);
    });

    it('should emit DELETED event after successful deletion', async () => {
      mockRepository.delete.and.returnValue(Promise.resolve());

      await facade.deleteContract(sampleContractId);

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.DELETED,
          data: jasmine.objectContaining({
            contractId: sampleContractId,
            contractNumber: sampleContract.contractNumber
          })
        })
      );
    });

    it('should handle delete errors', async () => {
      const errorMessage = 'Delete failed';
      mockRepository.delete.and.returnValue(Promise.reject(new Error(errorMessage)));

      await expectAsync(facade.deleteContract(sampleContractId)).toBeRejectedWithError(errorMessage);

      expect(mockStore.setError).toHaveBeenCalled();
    });

    it('should throw error when contract not found', async () => {
      mockStore.getContractById.and.returnValue(undefined);

      await expectAsync(facade.deleteContract(sampleContractId)).toBeRejectedWithError(/not found in store/);
    });
  });

  // ============================================================================
  // Selection & Filtering Tests
  // ============================================================================

  describe('Selection & Filtering', () => {
    it('should select contract by ID', () => {
      facade.selectContract(sampleContractId);

      expect(mockStore.selectContract).toHaveBeenCalledWith(sampleContractId);
    });

    it('should clear selection', () => {
      facade.clearSelection();

      expect(mockStore.clearSelection).toHaveBeenCalled();
    });

    it('should set filters', () => {
      const filters = { status: 'active' as ContractStatus };

      facade.setFilters(filters);

      expect(mockStore.setFilters).toHaveBeenCalledWith(filters);
    });

    it('should clear filters', () => {
      facade.clearFilters();

      expect(mockStore.clearFilters).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('Utility Methods', () => {
    it('should get contract by ID from store', () => {
      mockStore.getContractById.and.returnValue(sampleContract);

      const result = facade.getContractById(sampleContractId);

      expect(mockStore.getContractById).toHaveBeenCalledWith(sampleContractId);
      expect(result).toEqual(sampleContract);
    });

    it('should check if contract exists', () => {
      mockStore.hasContract.and.returnValue(true);

      const result = facade.hasContract(sampleContractId);

      expect(mockStore.hasContract).toHaveBeenCalledWith(sampleContractId);
      expect(result).toBe(true);
    });

    it('should get contracts by status', () => {
      const draftContracts = [sampleContract];
      mockStore.getContractsByStatus.and.returnValue(draftContracts);

      const result = facade.getContractsByStatus('draft');

      expect(mockStore.getContractsByStatus).toHaveBeenCalledWith('draft');
      expect(result).toEqual(draftContracts);
    });
  });

  // ============================================================================
  // Event Emission Tests
  // ============================================================================

  describe('Event Emission', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
    });

    it('should emit events with correct structure', async () => {
      mockRepository.create.and.returnValue(Promise.resolve(sampleContract));

      const createDto: CreateContractDto = {
        title: 'Test',
        description: '',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date(),
        endDate: new Date(),
        signingDate: new Date()
      };

      await facade.createContract(createDto);

      expect(mockEventBus.emitEvent).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: ContractEvents.CREATED,
          blueprintId: sampleBlueprintId,
          timestamp: jasmine.any(Date),
          actor: jasmine.objectContaining({
            userId: sampleUserId
          })
        })
      );
    });

    it('should handle event emission errors gracefully', async () => {
      mockRepository.create.and.returnValue(Promise.resolve(sampleContract));
      mockEventBus.emitEvent.and.throwError('EventBus error');

      const createDto: CreateContractDto = {
        title: 'Test',
        description: '',
        owner: sampleContract.owner,
        contractor: sampleContract.contractor,
        contractAmount: 500000,
        currency: 'TWD',
        startDate: new Date(),
        endDate: new Date(),
        signingDate: new Date()
      };

      // Should not throw - event emission errors are logged but not propagated
      await facade.createContract(createDto);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // State Accessor Tests
  // ============================================================================

  describe('State Accessors', () => {
    it('should expose loading state from store', () => {
      const loadingState = facade.loading;
      expect(loadingState).toBeDefined();
    });

    it('should expose error state from store', () => {
      const errorState = facade.error;
      expect(errorState).toBeDefined();
    });

    it('should expose all state signals from store', () => {
      expect(facade.contracts).toBeDefined();
      expect(facade.selectedContract).toBeDefined();
      expect(facade.filteredContracts).toBeDefined();
      expect(facade.activeContracts).toBeDefined();
      expect(facade.draftContracts).toBeDefined();
      expect(facade.completedContracts).toBeDefined();
      expect(facade.totalContracts).toBeDefined();
      expect(facade.totalContractValue).toBeDefined();
      expect(facade.hasSelection).toBeDefined();
      expect(facade.hasActiveFilters).toBeDefined();
      expect(facade.filteredCount).toBeDefined();
      expect(facade.hasError).toBeDefined();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      facade.initialize(sampleBlueprintId, sampleUserId);
    });

    it('should clear error before operations', async () => {
      mockRepository.findByBlueprint.and.returnValue(of([]));

      await facade.loadContracts();

      expect(mockStore.clearError).toHaveBeenCalled();
    });

    it('should set loading state correctly for all operations', async () => {
      mockRepository.findByBlueprint.and.returnValue(of([]));

      await facade.loadContracts();

      // Should set loading true at start, false at end
      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should log all errors appropriately', async () => {
      const errorMessage = 'Test error';
      mockRepository.findByBlueprint.and.returnValue(throwError(() => new Error(errorMessage)));

      await facade.loadContracts();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
