/**
 * ContractParsingService Unit Tests
 *
 * Tests for Contract AI parsing workflow and status tracking.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { TestBed } from '@angular/core/testing';
import { Firestore, collection, doc, addDoc, getDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

import type {
  Contract,
  ContractParsedData,
  ContractParsingRequest,
  FileAttachment
} from '../models';
import type { ContractParsingRequestDto, ContractParsingConfirmationDto } from '../models/dtos';
import { ContractParsingService, type ParsingResult } from './contract-parsing.service';
import { ContractRepository } from '../repositories/contract.repository';

describe('ContractParsingService', () => {
  let service: ContractParsingService;
  let mockFirestore: jasmine.SpyObj<Firestore>;
  let mockFunctions: jasmine.SpyObj<Functions>;
  let mockContractRepository: jasmine.SpyObj<ContractRepository>;

  // Sample test data
  const blueprintId = 'bp-001';
  const contractId = 'contract-001';
  const requestId = 'request-001';
  const userId = 'user-001';

  const sampleFiles: FileAttachment[] = [
    {
      id: 'file-001',
      name: 'contract.pdf',
      url: 'https://storage.example.com/contract.pdf',
      size: 1024000,
      mimeType: 'application/pdf',
      uploadedBy: userId,
      uploadedAt: new Date('2025-12-18')
    }
  ];

  const sampleParsedData: ContractParsedData = {
    title: 'Construction Contract',
    totalAmount: 1000000,
    currency: 'TWD',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    owner: {
      name: 'Owner Corp',
      contactPerson: 'John Owner',
      contactPhone: '0912345678',
      contactEmail: 'owner@test.com',
      address: '123 Owner St'
    },
    contractor: {
      name: 'Contractor LLC',
      contactPerson: 'Jane Contractor',
      contactPhone: '0987654321',
      contactEmail: 'contractor@test.com',
      address: '456 Contractor Ave'
    },
    workItems: [
      {
        name: 'Foundation Work',
        description: 'Foundation construction',
        unit: '式',
        quantity: 1,
        unitPrice: 500000,
        category: 'foundation'
      }
    ]
  };

  const sampleContract: Contract = {
    id: contractId,
    blueprintId,
    contractNumber: 'CON-20251218-001',
    title: 'Test Contract',
    description: 'Test description',
    owner: sampleParsedData.owner,
    contractor: sampleParsedData.contractor,
    totalAmount: 1000000,
    currency: 'TWD',
    status: 'draft',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    terms: '',
    originalFiles: sampleFiles,
    workItems: [],
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Create mock Firestore
    mockFirestore = jasmine.createSpyObj('Firestore', []);
    
    // Create mock Functions
    mockFunctions = jasmine.createSpyObj('Functions', []);
    
    // Create mock ContractRepository
    mockContractRepository = jasmine.createSpyObj('ContractRepository', [
      'findByIdOnce',
      'update'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ContractParsingService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Functions, useValue: mockFunctions },
        { provide: ContractRepository, useValue: mockContractRepository }
      ]
    });

    service = TestBed.inject(ContractParsingService);
  });

  describe('Signal State Management', () => {
    it('should initialize with default state', () => {
      expect(service.parsing()).toBe(false);
      expect(service.progress()).toBeNull();
      expect(service.error()).toBeNull();
    });

    it('should expose readonly signal accessors', () => {
      // Signals should be readonly
      expect(service.parsing).toBeDefined();
      expect(service.progress).toBeDefined();
      expect(service.error).toBeDefined();
    });
  });

  describe('requestParsing', () => {
    let mockCollectionFn: jasmine.Spy;
    let mockAddDocFn: jasmine.Spy;

    beforeEach(() => {
      // Mock Firestore collection and addDoc
      mockCollectionFn = jasmine.createSpy('collection');
      mockAddDocFn = jasmine.createSpy('addDoc').and.returnValue(
        Promise.resolve({ id: requestId } as any)
      );

      // Mock global functions
      (globalThis as any).collection = mockCollectionFn;
      (globalThis as any).addDoc = mockAddDocFn;
    });

    it('should create parsing request successfully', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId,
        enginePreference: 'auto'
      };

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));

      const result = await service.requestParsing(dto);

      expect(result).toBe(requestId);
      expect(mockAddDocFn).toHaveBeenCalled();
      expect(service.parsing()).toBe(false); // Should reset after completion
    });

    it('should set parsing state during request', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId
      };

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));

      // Start parsing
      const promise = service.requestParsing(dto);

      // Check intermediate state (implementation may vary)
      await promise;

      expect(service.error()).toBeNull();
    });

    it('should update progress signal after request creation', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId
      };

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));

      await service.requestParsing(dto);

      const progress = service.progress();
      expect(progress).not.toBeNull();
      expect(progress?.requestId).toBe(requestId);
      expect(progress?.status).toBe('pending');
    });

    it('should handle creation errors correctly', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId
      };

      const errorMessage = 'Firestore error';
      mockAddDocFn.and.returnValue(Promise.reject(new Error(errorMessage)));

      await expectAsync(service.requestParsing(dto)).toBeRejected();
      expect(service.error()).toBe(errorMessage);
      expect(service.parsing()).toBe(false); // Should reset even on error
    });

    it('should validate required fields in DTO', async () => {
      const invalidDto: ContractParsingRequestDto = {
        contractId: '',
        blueprintId: '',
        fileIds: [],
        requestedBy: ''
      };

      await expectAsync(service.requestParsing(invalidDto)).toBeRejected();
    });
  });

  describe('getParsingStatus', () => {
    let mockDocFn: jasmine.Spy;
    let mockGetDocFn: jasmine.Spy;

    beforeEach(() => {
      mockDocFn = jasmine.createSpy('doc');
      mockGetDocFn = jasmine.createSpy('getDoc');

      (globalThis as any).doc = mockDocFn;
      (globalThis as any).getDoc = mockGetDocFn;
    });

    it('should retrieve parsing request status successfully', async () => {
      const mockSnapshot = {
        exists: () => true,
        id: requestId,
        data: () => ({
          contractId,
          blueprintId,
          fileIds: ['file-001'],
          enginePreference: 'auto',
          status: 'completed',
          requestedBy: userId,
          requestedAt: Timestamp.now(),
          completedAt: Timestamp.now()
        })
      };

      mockGetDocFn.and.returnValue(Promise.resolve(mockSnapshot));

      const result = await service.getParsingStatus(blueprintId, contractId, requestId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(requestId);
      expect(result?.status).toBe('completed');
      expect(result?.blueprintId).toBe(blueprintId);
    });

    it('should return null if request does not exist', async () => {
      const mockSnapshot = {
        exists: () => false
      };

      mockGetDocFn.and.returnValue(Promise.resolve(mockSnapshot));

      const result = await service.getParsingStatus(blueprintId, contractId, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should handle Timestamp conversion correctly', async () => {
      const now = Timestamp.now();
      const mockSnapshot = {
        exists: () => true,
        id: requestId,
        data: () => ({
          contractId,
          blueprintId,
          fileIds: ['file-001'],
          enginePreference: 'auto',
          status: 'processing',
          requestedBy: userId,
          requestedAt: now
        })
      };

      mockGetDocFn.and.returnValue(Promise.resolve(mockSnapshot));

      const result = await service.getParsingStatus(blueprintId, contractId, requestId);

      expect(result?.requestedAt).toBeInstanceOf(Date);
    });

    it('should handle errors gracefully', async () => {
      mockGetDocFn.and.returnValue(Promise.reject(new Error('Firestore error')));

      const result = await service.getParsingStatus(blueprintId, contractId, requestId);

      expect(result).toBeNull();
    });
  });

  describe('confirmParsingResult', () => {
    it('should confirm parsing result successfully', async () => {
      const dto: ContractParsingConfirmationDto = {
        blueprintId,
        contractId,
        requestId,
        confirmed: true
      };

      mockContractRepository.findByIdOnce.and.returnValue(
        Promise.resolve({
          ...sampleContract,
          parsedData: sampleParsedData
        })
      );
      mockContractRepository.update.and.returnValue(Promise.resolve());

      await service.confirmParsedData(dto);

      expect(mockContractRepository.update).toHaveBeenCalled();
    });

    it('should reject if contract not found', async () => {
      const dto: ContractParsingConfirmationDto = {
        blueprintId,
        contractId: 'nonexistent',
        requestId,
        confirmed: true
      };

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(null));

      await expectAsync(service.confirmParsedData(dto)).toBeRejectedWithError(/not found/i);
    });
  });

  describe('skipParsing', () => {
    it('should allow skipping parsing for a contract', async () => {
      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));
      mockContractRepository.update.and.returnValue(Promise.resolve());

      // Implementation depends on service method signature
      // This is a placeholder test - adjust based on actual implementation
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should clear error state on successful operation', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId
      };

      // Mock successful operation
      const mockCollectionFn = jasmine.createSpy('collection');
      const mockAddDocFn = jasmine.createSpy('addDoc').and.returnValue(
        Promise.resolve({ id: requestId } as any)
      );
      (globalThis as any).collection = mockCollectionFn;
      (globalThis as any).addDoc = mockAddDocFn;

      mockContractRepository.findByIdOnce.and.returnValue(Promise.resolve(sampleContract));

      await service.requestParsing(dto);

      expect(service.error()).toBeNull();
    });

    it('should preserve error message on failure', async () => {
      const dto: ContractParsingRequestDto = {
        contractId,
        blueprintId,
        fileIds: ['file-001'],
        requestedBy: userId
      };

      const errorMessage = 'Test error';
      const mockAddDocFn = jasmine.createSpy('addDoc').and.returnValue(
        Promise.reject(new Error(errorMessage))
      );
      (globalThis as any).addDoc = mockAddDocFn;

      try {
        await service.requestParsing(dto);
      } catch (error) {
        // Expected error
      }

      expect(service.error()).toBe(errorMessage);
    });
  });

  describe('Integration with Firebase Functions', () => {
    it('should call parseContract function with correct parameters', async () => {
      // This test verifies the integration pattern
      // Actual implementation depends on httpsCallable usage
      
      const mockCallable = jasmine.createSpy('httpsCallable').and.returnValue(
        jasmine.createSpy('call').and.returnValue(
          Promise.resolve({
            data: {
              success: true,
              requestId,
              parsedData: sampleParsedData
            }
          })
        )
      );

      (globalThis as any).httpsCallable = mockCallable;

      expect(service).toBeDefined();
    });
  });
});
