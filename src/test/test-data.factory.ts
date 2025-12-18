/**
 * Test Data Factory
 *
 * Provides factory functions for creating test data for Contract module
 * Follows the Model definitions in contract.model.ts and dtos.ts
 *
 * Usage:
 * - Use createTestContract() to generate Contract instances
 * - Use createTestWorkItem() to generate WorkItem instances
 * - Use createTestContractParty() to generate ContractParty instances
 */

import { Timestamp } from '@angular/fire/firestore';
import {
  Contract,
  ContractStatus,
  ContractParty,
  ContractPartyType,
  WorkItem,
  WorkItemStatus
} from '@core/blueprint/modules/implementations/contract/models/contract.model';

/**
 * Generate a unique ID for testing
 *
 * @returns string - Random ID
 */
export function generateTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a test ContractParty
 *
 * @param overrides - Optional property overrides
 * @returns ContractParty
 */
export function createTestContractParty(overrides: Partial<ContractParty> = {}): ContractParty {
  return {
    id: generateTestId(),
    type: ContractPartyType.Organization,
    name: 'Test Company Ltd.',
    ...overrides
  };
}

/**
 * Create a test Contract
 *
 * @param blueprintId - Blueprint ID
 * @param overrides - Optional property overrides
 * @returns Contract
 */
export function createTestContract(blueprintId: string, overrides: Partial<Contract> = {}): Contract {
  const now = Timestamp.now();

  return {
    id: generateTestId(),
    blueprintId,
    title: 'Test Contract',
    contractNumber: `C-${Date.now()}`,
    owner: createTestContractParty({ name: 'Owner Company' }),
    contractor: createTestContractParty({ name: 'Contractor Company' }),
    status: ContractStatus.Draft,
    contractAmount: 1000000,
    currency: 'TWD',
    signingDate: now,
    createdBy: 'test-user-id',
    createdAt: now,
    updatedBy: 'test-user-id',
    updatedAt: now,
    ...overrides
  };
}

/**
 * Create multiple test Contracts
 *
 * @param blueprintId - Blueprint ID
 * @param count - Number of contracts to create
 * @returns Contract[]
 */
export function createTestContracts(blueprintId: string, count: number): Contract[] {
  return Array.from({ length: count }, (_, index) =>
    createTestContract(blueprintId, {
      title: `Test Contract ${index + 1}`,
      contractNumber: `C-${Date.now()}-${index + 1}`
    })
  );
}

/**
 * Create a test WorkItem
 *
 * @param contractId - Contract ID
 * @param overrides - Optional property overrides
 * @returns WorkItem
 */
export function createTestWorkItem(contractId: string, overrides: Partial<WorkItem> = {}): WorkItem {
  const now = Timestamp.now();

  return {
    id: generateTestId(),
    contractId,
    code: `WI-${Date.now()}`,
    name: 'Test Work Item',
    description: 'Test work item description',
    quantity: 1,
    unit: '式',
    unitPrice: 10000,
    totalPrice: 10000,
    status: WorkItemStatus.Active,
    order: 1,
    createdBy: 'test-user-id',
    createdAt: now,
    updatedBy: 'test-user-id',
    updatedAt: now,
    ...overrides
  };
}

/**
 * Create multiple test WorkItems
 *
 * @param contractId - Contract ID
 * @param count - Number of work items to create
 * @returns WorkItem[]
 */
export function createTestWorkItems(contractId: string, count: number): WorkItem[] {
  return Array.from({ length: count }, (_, index) =>
    createTestWorkItem(contractId, {
      code: `WI-${Date.now()}-${index + 1}`,
      name: `Test Work Item ${index + 1}`,
      order: index + 1
    })
  );
}

/**
 * Create a Contract with associated WorkItems
 *
 * @param blueprintId - Blueprint ID
 * @param workItemCount - Number of work items to create
 * @returns { contract: Contract, workItems: WorkItem[] }
 */
export function createTestContractWithWorkItems(blueprintId: string, workItemCount = 3): { contract: Contract; workItems: WorkItem[] } {
  const contract = createTestContract(blueprintId);
  const workItems = createTestWorkItems(contract.id!, workItemCount);

  return { contract, workItems };
}

/**
 * Wait for async operations to complete
 * Useful for testing real-time subscriptions
 *
 * @param ms - Milliseconds to wait (default: 500ms)
 * @returns Promise<void>
 */
export function waitFor(ms = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean up test data from Firestore
 * Use this in afterEach to clean up test collections
 *
 * Note: This requires Firebase Emulator to be running
 * Never use in production!
 *
 * @param firestore - Firestore instance
 * @param collectionPath - Collection path to clear
 * @returns Promise<void>
 */
export async function clearTestCollection(firestore: any, collectionPath: string): Promise<void> {
  // This is a simplified version
  // In practice, you would use Firebase Admin SDK or Emulator REST API
  console.log(`[Test] Clearing collection: ${collectionPath}`);
}
