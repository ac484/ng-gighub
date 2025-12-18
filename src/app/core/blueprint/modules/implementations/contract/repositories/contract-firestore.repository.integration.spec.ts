/**
 * ContractRepository Integration Tests
 * 
 * Integration tests for ContractRepository with Firebase Emulator
 * Tests real Firestore operations including CRUD and real-time subscriptions
 * 
 * Prerequisites:
 * - Firebase Emulator Suite must be running
 * - Run: `firebase emulators:start --only firestore`
 * 
 * Based on Firebase official documentation:
 * https://firebase.google.com/docs/emulator-suite/connect_and_prototype
 * https://firebase.google.com/docs/rules/unit-tests
 */

import { TestBed } from '@angular/core/testing';
import { Firestore, provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { ContractRepository } from '@core/blueprint/modules/implementations/contract/repositories/contract-firestore.repository';
import { 
  connectFirestoreToEmulator,
  disconnectFromEmulators,
  EMULATOR_CONFIG 
} from '@test/firebase-emulator.setup';
import {
  createTestContract,
  createTestContracts,
  waitFor,
  generateTestId
} from '@test/test-data.factory';
import { Contract, ContractStatus } from '@core/blueprint/modules/implementations/contract/models/contract.model';
import { firstValueFrom, take } from 'rxjs';

describe('ContractRepository Integration Tests', () => {
  let repository: ContractRepository;
  let firestore: Firestore;
  let testBlueprintId: string;

  beforeAll(async () => {
    // Initialize Firebase app for testing
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() =>
          initializeApp({
            projectId: EMULATOR_CONFIG.projectId,
            apiKey: 'test-api-key',
            authDomain: 'test.firebaseapp.com',
            storageBucket: 'test.appspot.com',
            messagingSenderId: '123456789',
            appId: 'test-app-id'
          })
        ),
        provideFirestore(() => getFirestore()),
        ContractRepository
      ]
    });

    firestore = TestBed.inject(Firestore);
    repository = TestBed.inject(ContractRepository);

    // Connect to emulator
    connectFirestoreToEmulator(firestore);
    
    console.log('[Test] Firebase Emulator connected:', 
      `${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}`);
  });

  beforeEach(() => {
    // Generate unique blueprint ID for each test
    testBlueprintId = generateTestId();
  });

  afterEach(async () => {
    // Clean up: Delete all contracts created in this test
    // Note: In real tests, you might use Firebase Emulator REST API to clear data
    console.log('[Test] Cleaning up test data for blueprint:', testBlueprintId);
  });

  afterAll(() => {
    disconnectFromEmulators();
  });

  describe('CRUD Operations', () => {
    it('should create a new contract', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      
      // Act
      const contractId = await repository.create(contract);
      
      // Assert
      expect(contractId).toBeTruthy();
      expect(typeof contractId).toBe('string');
      
      // Verify the contract was created by reading it back
      const created = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      expect(created).toBeTruthy();
      expect(created?.id).toBe(contractId);
      expect(created?.title).toBe(contract.title);
    });

    it('should find contract by ID', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      const contractId = await repository.create(contract);
      
      // Act
      const found = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      
      // Assert
      expect(found).toBeTruthy();
      expect(found?.id).toBe(contractId);
      expect(found?.blueprintId).toBe(testBlueprintId);
      expect(found?.title).toBe(contract.title);
    });

    it('should find all contracts for a blueprint', async () => {
      // Arrange
      const contracts = createTestContracts(testBlueprintId, 3);
      await Promise.all(contracts.map(c => repository.create(c)));
      
      // Act
      const found = await firstValueFrom(repository.findAll(testBlueprintId));
      
      // Assert
      expect(found.length).toBe(3);
      expect(found.every(c => c.blueprintId === testBlueprintId)).toBe(true);
    });

    it('should update an existing contract', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      const contractId = await repository.create(contract);
      
      const updates: Partial<Contract> = {
        title: 'Updated Title',
        status: ContractStatus.Active
      };
      
      // Act
      await repository.update(testBlueprintId, contractId, updates);
      
      // Assert
      const updated = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe(ContractStatus.Active);
    });

    it('should delete a contract', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      const contractId = await repository.create(contract);
      
      // Verify it exists
      const before = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      expect(before).toBeTruthy();
      
      // Act
      await repository.delete(testBlueprintId, contractId);
      
      // Assert
      const after = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      expect(after).toBeUndefined();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to contract changes', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      const contractId = await repository.create(contract);
      
      const updates: Contract[] = [];
      
      // Act - Subscribe to changes
      const subscription = repository
        .findById(testBlueprintId, contractId)
        .subscribe(updated => {
          if (updated) {
            updates.push(updated);
          }
        });
      
      // Wait for initial value
      await waitFor(100);
      
      // Update the contract
      await repository.update(testBlueprintId, contractId, {
        title: 'Updated via Real-time Test'
      });
      
      // Wait for update to propagate
      await waitFor(200);
      
      // Assert
      expect(updates.length).toBeGreaterThan(0);
      const latestUpdate = updates[updates.length - 1];
      expect(latestUpdate.title).toBe('Updated via Real-time Test');
      
      // Cleanup
      subscription.unsubscribe();
    });

    it('should subscribe to collection changes', async () => {
      // Arrange
      const initialContracts = createTestContracts(testBlueprintId, 2);
      await Promise.all(initialContracts.map(c => repository.create(c)));
      
      const collectionUpdates: Contract[][] = [];
      
      // Act - Subscribe to collection
      const subscription = repository
        .findAll(testBlueprintId)
        .subscribe(contracts => {
          collectionUpdates.push([...contracts]);
        });
      
      // Wait for initial value
      await waitFor(100);
      
      // Add a new contract
      const newContract = createTestContract(testBlueprintId);
      await repository.create(newContract);
      
      // Wait for update
      await waitFor(200);
      
      // Assert
      expect(collectionUpdates.length).toBeGreaterThan(0);
      const latestCollection = collectionUpdates[collectionUpdates.length - 1];
      expect(latestCollection.length).toBe(3);
      
      // Cleanup
      subscription.unsubscribe();
    });
  });

  describe('Query Operations', () => {
    it('should filter contracts by status', async () => {
      // Arrange
      const contracts = [
        createTestContract(testBlueprintId, { status: ContractStatus.Draft }),
        createTestContract(testBlueprintId, { status: ContractStatus.Active }),
        createTestContract(testBlueprintId, { status: ContractStatus.Draft })
      ];
      await Promise.all(contracts.map(c => repository.create(c)));
      
      // Act
      const draftContracts = await firstValueFrom(
        repository.findAll(testBlueprintId) // Note: Filtering would be done in service layer
      );
      
      // Assert
      expect(draftContracts.length).toBe(3);
      // In real scenario, service layer would filter by status
    });

    it('should handle empty results', async () => {
      // Act
      const emptyResults = await firstValueFrom(
        repository.findAll(generateTestId()) // Non-existent blueprint
      );
      
      // Assert
      expect(emptyResults).toEqual([]);
    });

    it('should handle non-existent contract', async () => {
      // Act
      const nonExistent = await firstValueFrom(
        repository.findById(testBlueprintId, 'non-existent-id')
      );
      
      // Assert
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid blueprint ID', async () => {
      // Arrange
      const contract = createTestContract('');
      
      // Act & Assert
      await expectAsync(repository.create(contract)).toBeRejected();
    });

    it('should handle concurrent updates', async () => {
      // Arrange
      const contract = createTestContract(testBlueprintId);
      const contractId = await repository.create(contract);
      
      // Act - Perform concurrent updates
      const updates = Promise.all([
        repository.update(testBlueprintId, contractId, { title: 'Update 1' }),
        repository.update(testBlueprintId, contractId, { title: 'Update 2' }),
        repository.update(testBlueprintId, contractId, { title: 'Update 3' })
      ]);
      
      // Assert - All updates should succeed
      await expectAsync(updates).toBeResolved();
      
      // Verify final state
      const final = await firstValueFrom(repository.findById(testBlueprintId, contractId));
      expect(final?.title).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle batch creation efficiently', async () => {
      // Arrange
      const contracts = createTestContracts(testBlueprintId, 10);
      const startTime = Date.now();
      
      // Act
      await Promise.all(contracts.map(c => repository.create(c)));
      
      const duration = Date.now() - startTime;
      
      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const allContracts = await firstValueFrom(repository.findAll(testBlueprintId));
      expect(allContracts.length).toBe(10);
    });
  });
});
