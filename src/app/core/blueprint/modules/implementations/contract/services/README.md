# Contract Module Services Documentation

## Overview

The Contract Module services layer provides complete business logic for contract and work item management using @angular/fire for Firestore integration.

## Architecture

```
UI Components (routes/)
    ↓
ContractFacade (orchestration)
    ↓
Services (business logic)
    ↓
Repositories (data access)
    ↓
Firestore (@angular/fire)
```

## Services

### ContractService

**Location**: `src/app/core/blueprint/modules/implementations/contract/services/contract.service.ts`

**Purpose**: Business logic layer for contract management including validation, lifecycle management, and event coordination.

#### Key Features

1. **Complete CRUD Operations**
   - Create, read, update, delete contracts
   - Comprehensive validation rules
   - Error handling and logging

2. **Contract Lifecycle Management**
   - Status transitions with validation
   - State machine enforcement
   - Lifecycle events emission

3. **Contract Status Flow**
   ```
   draft → pending_activation → active → completed
                                      ↓
                                  terminated
   ```

4. **Validation Rules**
   - Title: Required, 1-200 characters
   - Owner/Contractor: Complete information required
   - Amount: Must be greater than zero
   - Dates: End date must be after start date
   - Status transitions: Only valid transitions allowed

#### Status Transition Matrix

| From | To | Allowed |
|------|----|----|
| draft | pending_activation | ✅ |
| pending_activation | active, draft | ✅ |
| active | completed, terminated | ✅ |
| completed | - | ❌ |
| terminated | - | ❌ |

#### API Methods

##### Query Operations

```typescript
// Get all contracts for a blueprint
getContractsByBlueprint(
  blueprintId: string, 
  filters?: ContractFilters
): Promise<Contract[]>

// Get single contract by ID
getContractById(
  blueprintId: string, 
  contractId: string
): Promise<Contract | null>

// Get contract statistics
getContractStatistics(
  blueprintId: string
): Promise<ContractStatistics>
```

##### Create Operations

```typescript
// Create new contract
createContract(
  blueprintId: string,
  dto: CreateContractDto,
  actorId: string
): Promise<Contract>
```

##### Update Operations

```typescript
// Update contract
updateContract(
  blueprintId: string,
  contractId: string,
  dto: UpdateContractDto,
  actorId: string
): Promise<Contract>

// Update contract status
updateContractStatus(
  blueprintId: string,
  contractId: string,
  newStatus: ContractStatus,
  actorId: string
): Promise<void>

// Activate contract
activateContract(
  blueprintId: string,
  contractId: string,
  actorId: string
): Promise<void>

// Complete contract
completeContract(
  blueprintId: string,
  contractId: string,
  actorId: string
): Promise<void>

// Terminate contract
terminateContract(
  blueprintId: string,
  contractId: string,
  actorId: string,
  reason?: string
): Promise<void>
```

##### Delete Operations

```typescript
// Delete contract (only draft contracts)
deleteContract(
  blueprintId: string,
  contractId: string,
  actorId: string
): Promise<void>
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { ContractService } from '@core/blueprint/modules/implementations/contract/services';

export class ContractComponent {
  private contractService = inject(ContractService);
  
  async createContract() {
    const dto: CreateContractDto = {
      blueprintId: 'bp-1',
      title: 'Construction Contract',
      owner: {
        id: 'owner-1',
        name: 'ABC Company',
        type: 'owner',
        contactPerson: 'John Doe',
        contactPhone: '+886-123-456',
        contactEmail: 'john@abc.com'
      },
      contractor: {
        id: 'contractor-1',
        name: 'XYZ Builders',
        type: 'contractor',
        contactPerson: 'Jane Smith',
        contactPhone: '+886-789-012',
        contactEmail: 'jane@xyz.com'
      },
      totalAmount: 5000000,
      currency: 'TWD',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      createdBy: 'current-user-id'
    };
    
    try {
      const contract = await this.contractService.createContract(
        'bp-1',
        dto,
        'current-user-id'
      );
      console.log('Contract created:', contract.id);
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
  }
  
  async activateContract(contractId: string) {
    try {
      await this.contractService.activateContract(
        'bp-1',
        contractId,
        'current-user-id'
      );
      console.log('Contract activated');
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  }
}
```

---

### WorkItemService

**Location**: `src/app/core/blueprint/modules/implementations/contract/services/work-item.service.ts`

**Purpose**: Business logic layer for work item management including progress tracking, task linking, and validation.

#### Key Features

1. **Complete CRUD Operations**
   - Create, read, update, delete work items
   - Batch creation support
   - Validation rules

2. **Progress Tracking**
   - Update completed quantity/amount
   - Automatic percentage calculation
   - Progress validation

3. **Task Linking**
   - Link tasks to work items
   - Unlink tasks from work items
   - Prevent deletion with linked tasks

4. **Statistics**
   - Total quantity/price calculation
   - Completion percentage
   - Work items with linked tasks

#### Validation Rules

- **Code**: Required, 1-50 characters, unique within contract
- **Name**: Required, 1-200 characters
- **Unit**: Required, non-empty
- **Quantity**: Must be greater than zero
- **Unit Price**: Must be greater than zero
- **Progress**: 
  - Completed quantity cannot be negative
  - Completed quantity cannot exceed total quantity
  - Completed amount cannot be negative
  - Completed amount cannot exceed total price

#### API Methods

##### Query Operations

```typescript
// Get all work items for a contract
getWorkItemsByContract(
  blueprintId: string,
  contractId: string
): Promise<ContractWorkItem[]>

// Get single work item by ID
getWorkItemById(
  blueprintId: string,
  contractId: string,
  workItemId: string
): Promise<ContractWorkItem | null>

// Get work item statistics
getWorkItemStatistics(
  blueprintId: string,
  contractId: string
): Promise<WorkItemStatistics>
```

##### Create Operations

```typescript
// Create work item
createWorkItem(
  blueprintId: string,
  contractId: string,
  dto: CreateWorkItemDto,
  actorId: string
): Promise<ContractWorkItem>

// Batch create work items
createWorkItemsBatch(
  blueprintId: string,
  contractId: string,
  items: CreateWorkItemDto[],
  actorId: string
): Promise<ContractWorkItem[]>
```

##### Update Operations

```typescript
// Update work item
updateWorkItem(
  blueprintId: string,
  contractId: string,
  workItemId: string,
  dto: UpdateWorkItemDto,
  actorId: string
): Promise<ContractWorkItem>

// Update progress
updateWorkItemProgress(
  blueprintId: string,
  contractId: string,
  workItemId: string,
  progress: WorkItemProgress,
  actorId: string
): Promise<void>
```

##### Task Linking Operations

```typescript
// Link task to work item
linkTaskToWorkItem(
  blueprintId: string,
  contractId: string,
  workItemId: string,
  taskId: string,
  actorId: string
): Promise<void>

// Unlink task from work item
unlinkTaskFromWorkItem(
  blueprintId: string,
  contractId: string,
  workItemId: string,
  taskId: string,
  actorId: string
): Promise<void>
```

##### Delete Operations

```typescript
// Delete work item
// (only if no linked tasks and no progress)
deleteWorkItem(
  blueprintId: string,
  contractId: string,
  workItemId: string,
  actorId: string
): Promise<void>
```

#### Usage Example

```typescript
import { inject } from '@angular/core';
import { WorkItemService } from '@core/blueprint/modules/implementations/contract/services';

export class WorkItemComponent {
  private workItemService = inject(WorkItemService);
  
  async createWorkItem() {
    const dto: CreateWorkItemDto = {
      code: 'WI-001',
      name: 'Foundation Excavation',
      description: 'Excavate foundation to 3m depth',
      category: 'Civil Works',
      unit: 'm³',
      quantity: 500,
      unitPrice: 1200
    };
    
    try {
      const workItem = await this.workItemService.createWorkItem(
        'bp-1',
        'contract-1',
        dto,
        'current-user-id'
      );
      console.log('Work item created:', workItem.id);
    } catch (error) {
      console.error('Failed to create work item:', error);
    }
  }
  
  async updateProgress(workItemId: string) {
    const progress: WorkItemProgress = {
      completedQuantity: 250,
      completedAmount: 300000
    };
    
    try {
      await this.workItemService.updateWorkItemProgress(
        'bp-1',
        'contract-1',
        workItemId,
        progress,
        'current-user-id'
      );
      console.log('Progress updated');
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }
  
  async linkTask(workItemId: string, taskId: string) {
    try {
      await this.workItemService.linkTaskToWorkItem(
        'bp-1',
        'contract-1',
        workItemId,
        taskId,
        'current-user-id'
      );
      console.log('Task linked to work item');
    } catch (error) {
      console.error('Failed to link task:', error);
    }
  }
}
```

---

## Event-Driven Architecture

Both services emit domain events through `EnhancedEventBusService` for all state changes:

### Contract Events

- `ENTITY_CREATED`: Contract created
- `ENTITY_UPDATED`: Contract updated
- `STATE_CHANGED`: Contract status changed
- `ENTITY_DELETED`: Contract deleted

### Work Item Events

- `ENTITY_CREATED`: Work item created
- `ENTITY_UPDATED`: Work item updated (includes progress updates and task linking)
- `ENTITY_DELETED`: Work item deleted

### Event Example

```typescript
{
  type: SystemEventType.ENTITY_CREATED,
  blueprintId: 'bp-1',
  entityType: 'contract',
  entityId: 'contract-1',
  actorId: 'user-1',
  actorType: 'user',
  metadata: {
    contractNumber: 'CON-0001',
    title: 'Construction Contract',
    status: 'draft'
  },
  timestamp: new Date()
}
```

---

## Error Handling

All services include comprehensive error handling:

1. **Validation Errors**: Thrown immediately with descriptive messages
2. **Repository Errors**: Caught, logged, and re-thrown
3. **Business Logic Errors**: Thrown with clear context
4. **Logging**: All operations logged with appropriate levels (debug, info, warn, error)

### Error Example

```typescript
try {
  await contractService.activateContract(blueprintId, contractId, actorId);
} catch (error) {
  if (error.message.includes('Cannot activate contract in status')) {
    // Handle invalid status transition
  } else if (error.message.includes('Contract must have')) {
    // Handle missing required data
  } else {
    // Handle general error
  }
}
```

---

## Testing

Integration tests are provided in `contract.integration.spec.ts` covering:

- ✅ Create contract validation
- ✅ Status transition validation
- ✅ Create work item validation
- ✅ Progress update validation
- ✅ Duplicate code detection
- ✅ Business rule enforcement

Run tests:
```bash
npm run test:integration
```

---

## Dependencies

### Required Services

- `LoggerService`: Logging operations
- `EnhancedEventBusService`: Domain event emission

### Required Repositories

- `ContractRepository`: Contract data access
- `ContractWorkItemRepository`: Work item data access

### Firebase/Firestore

All data operations use `@angular/fire` v20.0.1 with Firestore.

---

## Best Practices

1. **Always use the service layer**: Never call repositories directly from UI components
2. **Handle errors gracefully**: Wrap service calls in try-catch blocks
3. **Validate early**: Services validate input before calling repositories
4. **Emit events**: Services automatically emit domain events for all state changes
5. **Log appropriately**: All operations are logged at appropriate levels
6. **Use TypeScript types**: All DTOs and models are strongly typed

---

## Future Enhancements

Potential improvements:

- [ ] Transaction support for multi-step operations
- [ ] Optimistic locking for concurrent updates
- [ ] Undo/redo functionality
- [ ] Audit trail details
- [ ] Performance metrics collection
- [ ] Caching strategies

---

**Author**: GigHub Development Team  
**Date**: 2025-12-19  
**Version**: 1.0.0
