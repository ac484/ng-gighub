# Firebase Emulator Integration Tests

This directory contains integration tests for the Contract module using Firebase Emulator Suite.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase Emulator Suite configured (already set in `firebase.json`)

## Quick Start

### Option 1: Auto-start Emulator (Recommended)

Automatically starts emulator, runs tests, and shuts down:

```bash
yarn test:emulator
```

### Option 2: Manual Emulator Control

For interactive testing with emulator running:

```bash
# Terminal 1: Start emulator
yarn emulator:start

# Terminal 2: Run integration tests
yarn test:integration
```

## What Gets Tested

### ContractRepository Integration Tests (13 tests)

Located in: `src/app/core/blueprint/modules/implementations/contract/repositories/contract-firestore.repository.integration.spec.ts`

**Test Categories:**

1. **CRUD Operations** (5 tests)
   - ✅ Create a new contract
   - ✅ Find contract by ID
   - ✅ Find all contracts for a blueprint
   - ✅ Update an existing contract
   - ✅ Delete a contract

2. **Real-time Subscriptions** (2 tests)
   - ✅ Subscribe to contract changes
   - ✅ Subscribe to collection changes

3. **Query Operations** (3 tests)
   - ✅ Filter contracts by status
   - ✅ Handle empty results
   - ✅ Handle non-existent contract

4. **Error Handling** (2 tests)
   - ✅ Handle invalid blueprint ID
   - ✅ Handle concurrent updates

5. **Performance** (1 test)
   - ✅ Batch creation efficiency (10 contracts < 5s)

## Test Infrastructure

### Firebase Emulator Setup (`src/test/firebase-emulator.setup.ts`)

Utilities for connecting to Firebase Emulator:

```typescript
import { connectToEmulators, EMULATOR_CONFIG } from '@test/firebase-emulator.setup';

// In test setup
const firestore = inject(Firestore);
const storage = inject(Storage);
connectToEmulators(firestore, storage);
```

**Configuration:**
- Firestore: `127.0.0.1:8080`
- Storage: `127.0.0.1:9199`
- UI: `http://127.0.0.1:4000`

### Test Data Factory (`src/test/test-data.factory.ts`)

Factory functions for creating test data:

```typescript
import { createTestContract, createTestWorkItem } from '@test/test-data.factory';

// Create a test contract
const contract = createTestContract(blueprintId, {
  title: 'Custom Title',
  status: ContractStatus.Active
});

// Create multiple contracts
const contracts = createTestContracts(blueprintId, 5);

// Create work items
const workItems = createTestWorkItems(contractId, 3);

// Create contract with work items
const { contract, workItems } = createTestContractWithWorkItems(blueprintId, 3);
```

## Viewing Test Results

### Emulator UI

While emulator is running, open the UI to view database state:

```
http://127.0.0.1:4000
```

### Test Output

Tests run in headless Chrome and output to console:

```bash
ContractRepository Integration Tests
  CRUD Operations
    ✅ should create a new contract
    ✅ should find contract by ID
    ✅ should find all contracts for a blueprint
    ✅ should update an existing contract
    ✅ should delete a contract
  Real-time Subscriptions
    ✅ should subscribe to contract changes
    ✅ should subscribe to collection changes
  ...
```

## Test Isolation

Each test uses a unique `blueprintId` to avoid conflicts:

```typescript
beforeEach(() => {
  testBlueprintId = generateTestId(); // Unique ID per test
});
```

## Common Issues

### Issue: Emulator not starting

**Solution:**
```bash
# Check if emulator ports are in use
lsof -ti:8080 -ti:9199 | xargs kill -9

# Restart emulator
yarn emulator:start
```

### Issue: Tests timing out

**Solution:**
- Ensure emulator is running
- Check firewall/network settings
- Increase test timeout in `karma.conf.js`

### Issue: "Cannot connect to emulator"

**Solution:**
```bash
# Verify emulator is running
firebase emulators:start --only firestore

# Check emulator status
curl http://127.0.0.1:8080
```

## Adding New Integration Tests

1. **Create test file** with `.integration.spec.ts` suffix:
```typescript
// my-feature.integration.spec.ts
import { connectToEmulators } from '@test/firebase-emulator.setup';

describe('MyFeature Integration Tests', () => {
  beforeAll(() => {
    const firestore = inject(Firestore);
    connectToEmulators(firestore);
  });

  it('should perform integration test', async () => {
    // Test implementation
  });
});
```

2. **Run tests:**
```bash
yarn test:integration
```

## Best Practices

1. **Always use unique IDs** for test data to avoid conflicts
2. **Clean up test data** in `afterEach` hooks (optional with emulator)
3. **Use `waitFor()` utility** for real-time subscription tests
4. **Test both success and error paths**
5. **Keep tests focused** on integration points (Firestore operations)

## Documentation References

- [Firebase Emulator Suite Docs](https://firebase.google.com/docs/emulator-suite)
- [Firestore Testing Best Practices](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Angular Testing Guide](https://angular.dev/guide/testing)

## CI/CD Integration

For automated testing in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Start Firebase Emulator
  run: yarn emulator:start &
  
- name: Wait for Emulator
  run: sleep 5
  
- name: Run Integration Tests
  run: yarn test:integration
```

Or use the all-in-one command:

```yaml
- name: Run Integration Tests
  run: yarn test:emulator
```

---

**Last Updated:** 2025-12-18  
**Maintained By:** GigHub Development Team  
**Test Coverage:** ContractRepository (CRUD + Real-time)
