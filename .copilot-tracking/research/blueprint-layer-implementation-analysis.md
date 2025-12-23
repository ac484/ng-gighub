# Blueprint Layer Implementation Analysis

## Task Researcher: Deep Analysis of Blueprint Layer Architecture Implementation

**Research Date**: 2025-12-23  
**Document Version**: 1.0  
**Research Topic**: Implementation strategy for Blueprint Layer as defined in `docs/reference/BLUEPRINT_LAYER.md`

---

## Executive Summary

This research analyzes the current state of the Blueprint Layer implementation in the GigHub project and compares it against the architectural specifications outlined in `docs/reference/BLUEPRINT_LAYER.md` (v3.23.0). The goal is to identify gaps, recommend implementation strategies, and provide a clear roadmap for achieving the target architecture.

### Key Findings

1. **Event-Bus**: ✅ Already implemented with comprehensive event handling
2. **Workflow**: ✅ Implemented with orchestrator and handlers
3. **Audit**: ✅ Implemented as audit-logs module
4. **Policies**: ❌ Not found as a separate layer/component
5. **Modules**: ⚠️ Partially implemented (acceptance, finance, warranty exist; contract and task modules missing)

---

## 1. Current State Analysis

### 1.1 Existing Blueprint Structure

```
src/app/core/blueprint/
├── config/              # Configuration management
├── container/           # Dependency injection container
├── context/            # Context management
├── events/             # ✅ Event-bus implementation
│   ├── enhanced-event-bus.service.ts
│   ├── event-bus.ts
│   ├── event-bus.interface.ts
│   ├── event-types.ts
│   └── models/
├── integration/        # Integration tests
├── models/            # Shared models
├── modules/           # Module implementations
│   └── implementations/
│       ├── acceptance/     # ✅ Acceptance module
│       ├── audit-logs/     # ✅ Audit module
│       ├── cloud/          # Infrastructure
│       ├── communication/  # Communication module
│       ├── finance/        # ✅ Finance module
│       ├── issue/          # ✅ Issue module
│       ├── log/            # Logging module
│       ├── qa/             # QA module
│       ├── safety/         # Safety module
│       ├── warranty/       # ✅ Warranty module
│       └── workflow/       # Workflow module (separate)
├── repositories/      # Base repository patterns
├── services/         # Shared services
└── workflow/         # ✅ Workflow engine implementation
    ├── setc-workflow-orchestrator.service.ts
    ├── handlers/
    │   ├── task-completed.handler.ts
    │   ├── qc-passed.handler.ts
    │   ├── qc-failed.handler.ts
    │   ├── acceptance-finalized.handler.ts
    │   └── log-created.handler.ts
    └── models/
```

### 1.2 Blueprint Layer Components Status

| Component | Target (BLUEPRINT_LAYER.md) | Current Status | Gap Analysis |
|-----------|----------------------------|----------------|--------------|
| **event-bus/** | Event dispatch & subscription system | ✅ Implemented | Complete with enhanced features |
| **workflow/** | Process orchestration engine | ✅ Implemented | Has orchestrator and handlers |
| **audit/** | System audit logging | ✅ Implemented (as audit-logs) | Complete module implementation |
| **policies/** | Cross-module policy rules | ❌ Missing | **Needs to be created** |
| **modules/contract/** | Contract lifecycle management | ❌ Missing | **Needs to be created** |
| **modules/task/** | Task management | ⚠️ Partial | Exists in routes but not in blueprint |
| **modules/issue/** | Issue tracking | ✅ Implemented | Complete |
| **modules/acceptance/** | Acceptance workflow | ✅ Implemented | Complete |
| **modules/finance/** | Financial operations | ✅ Implemented | Complete |
| **modules/warranty/** | Warranty management | ✅ Implemented | Complete |
| **asset/** | Asset/file management | ❌ Missing | **Needs to be created** |

---

## 2. Target Architecture Specifications

### 2.1 Blueprint Layer Components (from BLUEPRINT_LAYER.md)

#### 2.1.1 Event-Bus (`/blueprint/event-bus`)

**Purpose**: System event transmission and dispatch hub

**Responsibilities**:
- Publish events (emit/publish)
- Subscribe to events
- Dispatch events
- Ensure event structure consistency
- Provide event traceability (Correlation ID)
- Handle retries and dead letter queues (DLQ)

**Forbidden Actions**:
- ❌ Cannot determine if an event should occur
- ❌ Cannot modify event payload
- ❌ Cannot execute business logic based on event content
- ❌ Cannot depend on any Domain Module

**Current Implementation**: ✅ **Complete**
- `enhanced-event-bus.service.ts` provides comprehensive event handling
- Supports subscription, publishing, and event logging
- Has correlation ID tracking

#### 2.1.2 Workflow (`/blueprint/workflow`)

**Purpose**: Cross-module process coordinator for high-risk or multi-step workflows

**When to Use**:
- Involves multiple modules
- Intermediate steps may fail
- Requires compensation (Rollback/Saga)
- Cannot rely solely on event propagation

**Capabilities**:
- Subscribe to multiple events
- Manage process state
- Issue next-step command events
- Trigger compensation events

**Forbidden Actions**:
- ❌ Cannot access Domain Repository
- ❌ Cannot modify Domain state
- ❌ Cannot implement UI or permission logic
- ❌ Cannot become "workflow god"

**Current Implementation**: ✅ **Complete**
- `setc-workflow-orchestrator.service.ts` manages workflow coordination
- Handlers for key workflow steps:
  - task-completed.handler.ts
  - qc-passed.handler.ts
  - qc-failed.handler.ts
  - acceptance-finalized.handler.ts
  - log-created.handler.ts

#### 2.1.3 Audit (`/blueprint/audit`)

**Purpose**: Immutable historical record layer for system behavior

**Responsibilities**:
- Record all manual operations
- Track important state changes
- Log critical events
- Provide audit trails
- Support compliance queries
- Enable accountability

**What to Record**:
- Operator
- Operation time
- Module source
- Action type
- State before/after
- Correlation ID

**Forbidden Actions**:
- ❌ Cannot affect workflow
- ❌ Cannot block operations
- ❌ Cannot serve as business data source
- ❌ Cannot write back to Domain

**Current Implementation**: ✅ **Complete** (as audit-logs module)
- Located at `modules/implementations/audit-logs/`
- Has models, services, repositories, and components
- Includes audit-log.types.ts and audit-log.model.ts

#### 2.1.4 Policies (`/blueprint/policies`)

**Purpose**: Cross-module consistency rules and constraints

**Suitable for**:
- State transition rules
- Operation prerequisites
- Role/permission matrix (logic layer)
- System-level guards

**Examples**:
- Inactive contracts cannot create tasks
- Unverified acceptance cannot request payment
- Closed issues cannot be edited

**Capabilities**:
- Provide pure logic judgments
- Reusable validation code
- Can be shared by multiple modules
- Independent of UI/DB

**Forbidden Actions**:
- ❌ Cannot store data
- ❌ Cannot emit events
- ❌ Cannot execute workflows
- ❌ Cannot handle exception flows

**Current Implementation**: ❌ **Missing**
- No dedicated policies directory found
- **Action Required**: Create `/blueprint/policies/` structure

---

## 3. Module Structure Standards

### 3.1 Standard Module Template

According to BLUEPRINT_LAYER.md, each module should follow this structure:

```
/blueprint/modules/{module-name}/
├── models/                    # Aggregate / Value Objects
│   └── index.ts
├── states/                    # State definitions
│   └── {module}.states.ts
├── services/                  # Business logic services
│   └── {module}.service.ts
├── repositories/              # Data access layer
│   ├── {module}.repository.ts
│   └── {module}.repository.impl.ts
├── events/                    # Module-specific events
│   └── {module}.events.ts
├── policies/                  # Module-specific policies
│   └── {module}.policies.ts
├── facade/                    # Public API facade
│   └── {module}.facade.ts
├── config/                    # Module configuration
│   └── {module}.config.ts
├── module.metadata.ts         # Module metadata
├── {module}.module.ts         # Module definition
└── README.md                  # Module documentation
```

### 3.2 Current Module Implementation Analysis

#### Acceptance Module ✅
```
modules/implementations/acceptance/
├── acceptance.module.ts
├── components/
├── config/
├── exports/
├── models/
├── repositories/
└── services/
```
**Status**: Well-structured, follows most conventions

#### Finance Module ✅
```
modules/implementations/finance/
├── finance.module.ts
├── components/
├── config/
├── exports/
├── models/
├── repositories/
└── services/
```
**Status**: Well-structured, follows most conventions

#### Warranty Module ✅
```
modules/implementations/warranty/
├── warranty.module.ts
├── components/
├── config/
├── exports/
├── models/
├── repositories/
└── services/
```
**Status**: Well-structured, follows most conventions

#### Audit-Logs Module ✅
```
modules/implementations/audit-logs/
├── audit-logs.module.ts
├── components/
├── config/
├── exports/
├── models/
├── repositories/
└── services/
```
**Status**: Well-structured, follows most conventions

### 3.3 Missing Modules

#### Contract Module ❌
**Required By**: BLUEPRINT_LAYER.md Section 2.1 (Contract Creation Workflow)
**Status**: **Not found in blueprint modules**
**Location**: May exist in routes but not properly integrated into blueprint layer

#### Task Module ❌
**Required By**: BLUEPRINT_LAYER.md Section 2.2 (Task & Construction Phase)
**Status**: **Not found in blueprint modules**
**Location**: May exist in routes but not properly integrated into blueprint layer

#### Asset Module ❌
**Required By**: BLUEPRINT_LAYER.md Section 3.1 (Asset Management)
**Status**: **Completely missing**
**Purpose**: File/attachment lifecycle management, calls CloudFacade for storage

---

## 4. Workflow Definitions Analysis

### 4.1 Required Workflows (from BLUEPRINT_LAYER.md)

#### Workflow 1: Contract Creation & Source Process (Section 2.1)
```
Contract Upload (PDF/Image) [Manual]
↓
Contract Registration (Basic info, Owner, Contractor) [Manual]
↓
Contract Parsing (OCR/AI parse terms, amounts, items) [Auto]
↓
Contract Confirmation (Verify parse results or manual fill) [Manual]
↓
Contract Status: Pending Activation
↓
Contract Activation (Only activated contracts can create tasks) [Manual]
```

**Current Implementation**: ⚠️ Workflow handlers exist but contract module missing

#### Workflow 2: Task & Construction Phase (Section 2.2)
```
Task Creation (Link to contract/item/amount) [Manual]
↓
Assign User or Team [Manual]
↓
Construction Execution
↓
Submit Completion [Manual]
↓
Manager Confirm Completion [Manual]
```

**Current Implementation**: ✅ `task-completed.handler.ts` exists

#### Workflow 3: Quality & Acceptance Phase (Section 2.3)
```
Auto-create Construction Log [Auto]
↓
Auto-create QC Pending [Auto]
↓
QC Pass?
```

**QC Decision Flow**:
- **No**: Create Defect Report [Auto] → Remediation [Manual] → Re-inspection [Manual] → Back to QC
- **Yes**: Acceptance [Manual]

**Acceptance Decision Flow**:
- **No**: Create Issue [Manual/Auto] → Issue Handling [Manual] → Back to Acceptance
- **Yes**: Archive Acceptance Data [Auto] → Enter Warranty Period [Auto]

**Current Implementation**: ✅ Handlers exist:
- `qc-passed.handler.ts`
- `qc-failed.handler.ts`
- `acceptance-finalized.handler.ts`
- `log-created.handler.ts`

#### Workflow 4: Warranty Period Management (Section 2.4)
```
Warranty Period:
  Warranty Defect Occurs?
    - Yes: Create Issue [Manual/Auto] → Warranty Repair [Manual] → Close [Manual]
    - No: Continue Warranty Monitoring

Warranty Expires:
  → Warranty Expiration [Auto]
  → Final Acceptance Closure [Manual]
```

**Current Implementation**: ✅ Warranty module exists

#### Workflow 5: Finance & Cost Phase (Section 2.5)
```
Amount/Ratio Confirmation (Billable ratio/Payable ratio) [Manual]
↓
Create Billable List + Payable List [Auto]
(Owner/Contractor separate)
↓
Billing/Payment Process [Manual]
```

**Process States**: Draft → Submitted → Review → Invoice → Payment

**Finance Review Flow**:
- Approved → Continue process
- Rejected → Supplement → Revision → Re-review

**Finance Status Sync**: Update Task Payment Status [Auto]
- Billing progress percentage
- Payment progress percentage

**Cost & Analysis**: Auto-include in cost management:
- Actual cost
- Receivable amount
- Payable amount
- Gross profit & cost analysis

**Current Implementation**: ✅ Finance module exists

---

## 5. Gap Analysis & Recommendations

### 5.1 Critical Gaps

#### Gap 1: Missing Policies Layer ❌ **HIGH PRIORITY**

**Problem**: No centralized cross-module policy enforcement
**Impact**: Business rules scattered across modules, inconsistent enforcement
**Recommendation**: Create `/blueprint/policies/` structure

**Proposed Structure**:
```
/blueprint/policies/
├── access-control.policy.ts      # Permission matrix
├── state-transition.policy.ts    # State change rules
├── approval.policy.ts            # Approval workflows
├── contract.policy.ts            # Contract-specific rules
├── task.policy.ts                # Task-specific rules
├── finance.policy.ts             # Finance-specific rules
├── index.ts                      # Policy exports
└── README.md                     # Policy documentation
```

**Example Policy Functions**:
```typescript
// Can create task only if contract is active
canCreateTask(contract: Contract): boolean

// Can request payment only if acceptance passed
canRequestPayment(acceptance: Acceptance): boolean

// Can edit issue only if not closed
canEditIssue(issue: Issue): boolean
```

#### Gap 2: Contract Module Missing ❌ **HIGH PRIORITY**

**Problem**: Contract is a core entity but not properly integrated into blueprint layer
**Impact**: Cannot enforce contract-based workflows and policies
**Recommendation**: Create contract module in blueprint structure

**Required Implementation**:
```
/blueprint/modules/implementations/contract/
├── contract.module.ts
├── models/
│   ├── contract.model.ts
│   ├── contract.states.ts
│   └── index.ts
├── services/
│   ├── contract.service.ts
│   ├── contract-parsing.service.ts  # OCR/AI integration
│   └── index.ts
├── repositories/
│   ├── contract.repository.ts
│   └── contract.repository.impl.ts
├── events/
│   └── contract.events.ts
├── policies/
│   └── contract.policies.ts
├── facade/
│   └── contract.facade.ts
├── config/
│   └── contract.config.ts
├── components/
│   └── # UI components if needed
└── exports/
    └── contract-api.exports.ts
```

#### Gap 3: Task Module in Blueprint ❌ **HIGH PRIORITY**

**Problem**: Task exists in routes but not integrated into blueprint layer
**Impact**: Task workflows cannot properly interact with blueprint orchestration
**Recommendation**: Migrate or create task module in blueprint structure

**Current Location**: `src/app/routes/blueprint/task/` (UI layer)
**Target Location**: `src/app/core/blueprint/modules/implementations/task/`

#### Gap 4: Asset Module Missing ❌ **MEDIUM PRIORITY**

**Problem**: No centralized asset/file management in blueprint layer
**Impact**: File lifecycle not properly managed, inconsistent asset handling
**Recommendation**: Create asset module in blueprint structure

**Required Implementation**:
```
/blueprint/modules/implementations/asset/
├── asset.module.ts
├── models/
│   ├── asset.model.ts
│   ├── asset.states.ts
│   └── index.ts
├── services/
│   ├── asset.service.ts
│   ├── asset-upload.service.ts
│   └── index.ts
├── repositories/
│   ├── asset.repository.ts
│   └── asset.repository.impl.ts
├── events/
│   └── asset.events.ts
├── policies/
│   └── asset.policies.ts
├── facade/
│   └── asset.facade.ts
└── config/
    └── asset.config.ts
```

**Integration with CloudFacade**:
```
ContractFacade.uploadContractPDF(file)
    ↓
AssetFacade.upload(file)
    ↓
AssetService.validatePolicy()
    ↓
CloudFacade.uploadFile()
    ↓
AssetService.updateAssetStatus()
    ↓
event-bus.emit('asset.uploaded')
    ↓
ContractService.onAssetUploaded()
```

### 5.2 Minor Improvements

#### Improvement 1: Module Structure Standardization ⚠️ **LOW PRIORITY**

**Observation**: Current modules lack consistent `policies/`, `facade/`, and `states/` subdirectories
**Recommendation**: Add these subdirectories to all modules for consistency

**Action Items**:
- Add `policies/` to acceptance, finance, warranty, audit-logs modules
- Add `facade/` to modules missing it
- Add `states/` for explicit state management

#### Improvement 2: Module Documentation ⚠️ **LOW PRIORITY**

**Observation**: Most modules lack README.md files
**Recommendation**: Add README.md to each module explaining:
- Module purpose
- Key responsibilities
- API surface
- Integration points
- Event flows

---

## 6. Implementation Roadmap

### Phase 1: Critical Foundation (Week 1-2)

**Priority**: HIGH
**Dependencies**: None

#### Task 1.1: Create Policies Layer
- [ ] Create `/blueprint/policies/` directory structure
- [ ] Implement `access-control.policy.ts`
- [ ] Implement `state-transition.policy.ts`
- [ ] Implement `approval.policy.ts`
- [ ] Create policy index and exports
- [ ] Write policy unit tests
- [ ] Document policy usage in README.md

**Estimated Effort**: 3-5 days
**Risk**: Low

#### Task 1.2: Create Contract Module
- [ ] Create contract module directory structure
- [ ] Implement contract.model.ts with full lifecycle states
- [ ] Implement contract.service.ts with CRUD operations
- [ ] Implement contract.repository.ts with Firestore integration
- [ ] Create contract.events.ts for lifecycle events
- [ ] Implement contract.policies.ts for business rules
- [ ] Create contract.facade.ts as public API
- [ ] Implement contract-parsing.service.ts (OCR/AI integration placeholder)
- [ ] Write unit tests for all services
- [ ] Document contract module in README.md

**Estimated Effort**: 5-7 days
**Risk**: Medium (OCR/AI integration complexity)

### Phase 2: Module Integration (Week 3-4)

**Priority**: HIGH
**Dependencies**: Phase 1 complete

#### Task 2.1: Integrate Task Module into Blueprint
- [ ] Create task module in blueprint structure
- [ ] Migrate task logic from routes to blueprint
- [ ] Implement task.service.ts with workflow integration
- [ ] Implement task.repository.ts
- [ ] Create task.events.ts
- [ ] Implement task.policies.ts
- [ ] Update task-completed.handler.ts to use new structure
- [ ] Write integration tests
- [ ] Document task module

**Estimated Effort**: 4-6 days
**Risk**: Medium (migration complexity)

#### Task 2.2: Create Asset Module
- [ ] Create asset module directory structure
- [ ] Implement asset.model.ts with lifecycle states
- [ ] Implement asset.service.ts with CloudFacade integration
- [ ] Implement asset-upload.service.ts
- [ ] Implement asset.repository.ts
- [ ] Create asset.events.ts
- [ ] Implement asset.policies.ts
- [ ] Create asset.facade.ts
- [ ] Write unit tests
- [ ] Document asset module

**Estimated Effort**: 4-5 days
**Risk**: Low-Medium

### Phase 3: Workflow Enhancements (Week 5)

**Priority**: MEDIUM
**Dependencies**: Phase 2 complete

#### Task 3.1: Enhance Workflow Orchestrator
- [ ] Review and update workflow configurations
- [ ] Add contract-related workflow handlers
- [ ] Add task-related workflow handlers
- [ ] Add asset-related workflow handlers
- [ ] Implement compensation/rollback handlers
- [ ] Write workflow integration tests
- [ ] Document workflow flows

**Estimated Effort**: 3-4 days
**Risk**: Low

#### Task 3.2: Policy Integration Across Modules
- [ ] Integrate policies into contract module
- [ ] Integrate policies into task module
- [ ] Integrate policies into acceptance module
- [ ] Integrate policies into finance module
- [ ] Update workflow handlers to use policies
- [ ] Write policy integration tests
- [ ] Document policy integration patterns

**Estimated Effort**: 3-4 days
**Risk**: Low

### Phase 4: Standardization & Documentation (Week 6)

**Priority**: LOW
**Dependencies**: Phase 3 complete

#### Task 4.1: Module Structure Standardization
- [ ] Add missing policies/ directories to existing modules
- [ ] Add missing facade/ directories to existing modules
- [ ] Add missing states/ directories to existing modules
- [ ] Standardize module.metadata.ts across all modules
- [ ] Update all module exports for consistency

**Estimated Effort**: 2-3 days
**Risk**: Very Low

#### Task 4.2: Comprehensive Documentation
- [ ] Create README.md for each module
- [ ] Document event flows between modules
- [ ] Document policy usage patterns
- [ ] Document workflow orchestration patterns
- [ ] Create architecture diagrams
- [ ] Update BLUEPRINT_LAYER.md with implementation notes

**Estimated Effort**: 3-4 days
**Risk**: Very Low

---

## 7. Technical Specifications

### 7.1 Module Development Standards

#### Service Layer
```typescript
// Example: contract.service.ts
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly eventBus = inject(EnhancedEventBus);
  private readonly repository = inject(ContractRepository);
  private readonly policyService = inject(ContractPolicyService);
  
  async createContract(data: CreateContractDTO): Promise<Contract> {
    // 1. Validate policy
    if (!this.policyService.canCreateContract(data)) {
      throw new Error('Contract creation not allowed by policy');
    }
    
    // 2. Create entity
    const contract = await this.repository.create(data);
    
    // 3. Emit event
    this.eventBus.emit('contract.created', {
      contractId: contract.id,
      timestamp: new Date(),
      data: contract
    });
    
    return contract;
  }
}
```

#### Repository Layer
```typescript
// Example: contract.repository.ts
export interface ContractRepository {
  create(data: CreateContractDTO): Promise<Contract>;
  findById(id: string): Promise<Contract | null>;
  update(id: string, data: UpdateContractDTO): Promise<Contract>;
  delete(id: string): Promise<void>;
  findByStatus(status: ContractStatus): Promise<Contract[]>;
}

@Injectable({ providedIn: 'root' })
export class ContractRepositoryImpl implements ContractRepository {
  private readonly firestore = inject(Firestore);
  
  async create(data: CreateContractDTO): Promise<Contract> {
    const docRef = await addDoc(
      collection(this.firestore, 'contracts'),
      {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );
    
    return this.findById(docRef.id);
  }
  
  // ... other methods
}
```

#### Policy Layer
```typescript
// Example: contract.policies.ts
@Injectable({ providedIn: 'root' })
export class ContractPolicyService {
  canCreateContract(data: CreateContractDTO): boolean {
    // Validate business rules
    return data.owner && data.contractor && data.amount > 0;
  }
  
  canActivateContract(contract: Contract): boolean {
    // Must be in pending status and have required data
    return (
      contract.status === ContractStatus.Pending &&
      contract.parsedData !== null &&
      contract.confirmed === true
    );
  }
  
  canCreateTask(contract: Contract): boolean {
    // Can only create tasks for activated contracts
    return contract.status === ContractStatus.Active;
  }
}
```

#### Event Definitions
```typescript
// Example: contract.events.ts
export const ContractEvents = {
  Created: 'contract.created',
  Uploaded: 'contract.uploaded',
  Parsed: 'contract.parsed',
  Confirmed: 'contract.confirmed',
  Activated: 'contract.activated',
  Suspended: 'contract.suspended',
  Terminated: 'contract.terminated'
} as const;

export interface ContractCreatedEvent {
  type: typeof ContractEvents.Created;
  contractId: string;
  timestamp: Date;
  actor: string;
  data: Contract;
}

// ... other event interfaces
```

#### Facade Layer
```typescript
// Example: contract.facade.ts
@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly service = inject(ContractService);
  private readonly assetFacade = inject(AssetFacade);
  
  async uploadContractPDF(file: File, ownerId: string): Promise<Contract> {
    // 1. Upload file through Asset facade
    const asset = await this.assetFacade.upload(file, ownerId, 'contract');
    
    // 2. Create contract with asset reference
    const contract = await this.service.createContractWithAsset(asset.id);
    
    return contract;
  }
  
  async activateContract(contractId: string): Promise<Contract> {
    return this.service.activateContract(contractId);
  }
  
  // ... other facade methods
}
```

### 7.2 State Management

#### Contract States
```typescript
// contract.states.ts
export enum ContractStatus {
  Draft = 'draft',                    // Initial creation
  Uploaded = 'uploaded',              // PDF uploaded
  Parsing = 'parsing',                // OCR/AI parsing in progress
  Parsed = 'parsed',                  // Parsed, awaiting confirmation
  PendingActivation = 'pending',      // Confirmed, awaiting activation
  Active = 'active',                  // Can create tasks
  Suspended = 'suspended',            // Temporarily inactive
  Completed = 'completed',            // All work done
  Terminated = 'terminated'           // Cancelled
}

export const ContractStatusTransitions: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.Draft]: [ContractStatus.Uploaded],
  [ContractStatus.Uploaded]: [ContractStatus.Parsing],
  [ContractStatus.Parsing]: [ContractStatus.Parsed, ContractStatus.Draft],
  [ContractStatus.Parsed]: [ContractStatus.PendingActivation, ContractStatus.Draft],
  [ContractStatus.PendingActivation]: [ContractStatus.Active, ContractStatus.Draft],
  [ContractStatus.Active]: [ContractStatus.Suspended, ContractStatus.Completed, ContractStatus.Terminated],
  [ContractStatus.Suspended]: [ContractStatus.Active, ContractStatus.Terminated],
  [ContractStatus.Completed]: [],
  [ContractStatus.Terminated]: []
};
```

### 7.3 Event Flow Examples

#### Example 1: Contract Upload Flow
```
User Action: Upload Contract PDF
    ↓
ContractFacade.uploadContractPDF(file)
    ↓
AssetFacade.upload(file)
    ↓
AssetService.validatePolicy()
    ↓
CloudFacade.uploadFile()  [Infrastructure]
    ↓
AssetService.updateAssetStatus()
    ↓
EventBus.emit('asset.uploaded', { assetId, contractId })
    ↓
ContractService.onAssetUploaded()  [Event Handler]
    ↓
ContractService.updateStatus(ContractStatus.Uploaded)
    ↓
EventBus.emit('contract.uploaded', { contractId })
    ↓
ContractParsingService.onContractUploaded()  [Event Handler]
    ↓
AIService.parseContract()  [Async - via Cloud Function]
```

#### Example 2: Task Creation Flow with Policy Check
```
User Action: Create Task
    ↓
TaskFacade.createTask(contractId, taskData)
    ↓
ContractPolicyService.canCreateTask(contract)  [Policy Check]
    ↓ (if false)
    Throw PolicyViolationError
    ↓ (if true)
TaskService.create(taskData)
    ↓
TaskRepository.create()
    ↓
EventBus.emit('task.created', { taskId, contractId })
    ↓
AuditService.log('task.created', taskId, userId)  [Audit]
    ↓
WorkflowOrchestrator.onTaskCreated()  [Workflow]
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Required Coverage**: 80% minimum

#### Service Tests
```typescript
// contract.service.spec.ts
describe('ContractService', () => {
  it('should create contract and emit event', async () => {
    const eventBus = jasmine.createSpyObj('EventBus', ['emit']);
    const repository = jasmine.createSpyObj('Repository', ['create']);
    const service = new ContractService(eventBus, repository);
    
    repository.create.and.returnValue(Promise.resolve(mockContract));
    
    await service.createContract(mockData);
    
    expect(repository.create).toHaveBeenCalledWith(mockData);
    expect(eventBus.emit).toHaveBeenCalledWith('contract.created', jasmine.any(Object));
  });
});
```

#### Policy Tests
```typescript
// contract.policies.spec.ts
describe('ContractPolicyService', () => {
  it('should allow task creation for active contracts', () => {
    const policy = new ContractPolicyService();
    const contract = { ...mockContract, status: ContractStatus.Active };
    
    expect(policy.canCreateTask(contract)).toBe(true);
  });
  
  it('should deny task creation for pending contracts', () => {
    const policy = new ContractPolicyService();
    const contract = { ...mockContract, status: ContractStatus.Pending };
    
    expect(policy.canCreateTask(contract)).toBe(false);
  });
});
```

### 8.2 Integration Tests

**Location**: `/blueprint/integration/`

#### Module Communication Tests
```typescript
// contract-task-integration.spec.ts
describe('Contract-Task Integration', () => {
  it('should create task when contract is active', async () => {
    // Setup: Create and activate contract
    const contract = await contractService.createContract(mockData);
    await contractService.activateContract(contract.id);
    
    // Act: Create task
    const task = await taskService.createTask({
      contractId: contract.id,
      ...mockTaskData
    });
    
    // Assert
    expect(task).toBeDefined();
    expect(task.contractId).toBe(contract.id);
  });
  
  it('should reject task creation when contract is pending', async () => {
    // Setup: Create contract without activation
    const contract = await contractService.createContract(mockData);
    
    // Act & Assert
    await expectAsync(
      taskService.createTask({
        contractId: contract.id,
        ...mockTaskData
      })
    ).toBeRejectedWithError('Contract must be active');
  });
});
```

#### Event Flow Tests
```typescript
// contract-event-flow.spec.ts
describe('Contract Event Flow', () => {
  it('should trigger parsing after contract upload', (done) => {
    let eventReceived = false;
    
    eventBus.subscribe('contract.uploaded', (event) => {
      eventReceived = true;
      expect(event.contractId).toBeDefined();
      done();
    });
    
    contractService.uploadContract(mockFile).then(() => {
      expect(eventReceived).toBe(true);
    });
  });
});
```

### 8.3 Workflow Tests

```typescript
// workflow-orchestrator.spec.ts
describe('Workflow Orchestrator', () => {
  it('should create QC task after task completion', async () => {
    const orchestrator = new WorkflowOrchestrator(eventBus, services);
    
    // Setup: Task completed event
    await orchestrator.handleTaskCompleted({
      taskId: 'task-1',
      timestamp: new Date()
    });
    
    // Assert: QC task created
    expect(qaService.createQCTask).toHaveBeenCalledWith(
      jasmine.objectContaining({ taskId: 'task-1' })
    );
  });
});
```

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OCR/AI integration complexity | Medium | High | Start with manual parsing, add AI later |
| State transition conflicts | Low | Medium | Implement state machine with validation |
| Event ordering issues | Medium | Medium | Add event sequencing and correlation IDs |
| Policy enforcement gaps | Low | High | Comprehensive unit tests for all policies |
| Module coupling | Medium | Medium | Strict facade pattern enforcement |

### 9.2 Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict adherence to phased approach |
| Testing coverage gaps | Medium | High | Minimum 80% coverage requirement |
| Documentation lag | High | Medium | Document-as-you-go approach |
| Resource availability | Medium | High | Clear milestone and dependency tracking |
| Integration issues | Medium | Medium | Integration tests before each phase |

---

## 10. Success Criteria

### 10.1 Completion Criteria

- [x] All critical gaps identified and documented
- [ ] Policies layer implemented and operational
- [ ] Contract module created and integrated
- [ ] Task module migrated to blueprint structure
- [ ] Asset module created and integrated
- [ ] All modules follow standard structure
- [ ] Comprehensive test coverage (>80%)
- [ ] Complete documentation for all components
- [ ] Integration tests passing
- [ ] Workflow orchestration functional

### 10.2 Quality Metrics

**Code Quality**:
- Unit test coverage ≥ 80%
- Integration test coverage ≥ 70%
- No critical or high severity linting errors
- TypeScript strict mode enabled

**Architecture Compliance**:
- All modules follow blueprint structure template
- Clear separation between layers (facade, service, repository)
- No direct module-to-module dependencies
- All cross-module communication via event-bus

**Documentation**:
- README.md in every module
- JSDoc comments for all public APIs
- Event flow diagrams complete
- Policy documentation comprehensive

---

## 11. Next Steps

### Immediate Actions (This Week)

1. **Review and Approve Research**
   - Present findings to team
   - Get stakeholder sign-off on implementation plan
   - Prioritize any additional requirements

2. **Begin Phase 1 Implementation**
   - Start with policies layer creation
   - Set up project structure for contract module
   - Create initial test scaffolding

3. **Establish Development Process**
   - Define code review process
   - Set up CI/CD for blueprint modules
   - Create development branch strategy

### Follow-up Research Needed

1. **OCR/AI Integration Details**
   - Research specific OCR services to use
   - Define AI model requirements for contract parsing
   - Plan integration with Cloud Functions

2. **Performance Optimization**
   - Research event-bus scalability
   - Plan for large-scale workflow orchestration
   - Consider caching strategies for policies

3. **Security Review**
   - Review access control implementation
   - Plan security audit for policy enforcement
   - Define security testing strategy

---

## 12. References

### Internal Documents
- `docs/reference/BLUEPRINT_LAYER.md` (v3.23.0)
- `src/app/core/blueprint/` (current implementation)
- `.github/instructions/ng-gighub-architecture.instructions.md`

### External Resources
- Angular Best Practices: https://angular.dev/best-practices
- Domain-Driven Design: Event-Driven Architecture
- Saga Pattern for Distributed Transactions
- CQRS and Event Sourcing Patterns

---

## Appendix A: Module Comparison Matrix

| Feature | Contract | Task | Issue | Acceptance | Finance | Warranty | Audit-Logs |
|---------|----------|------|-------|------------|---------|----------|------------|
| **Status** | ❌ Missing | ⚠️ Partial | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists | ✅ Exists |
| **Models** | Required | Required | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Services** | Required | Required | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Repository** | Required | Required | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Events** | Required | Required | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Policies** | Required | Required | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Facade** | Required | Required | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Config** | Required | Required | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tests** | Required | Required | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

Legend:
- ✅ Exists and complete
- ⚠️ Exists but incomplete or non-standard
- ❌ Missing

---

## Appendix B: Event Catalog

### Current Events (Implemented)

| Event Name | Producer | Consumers | Purpose |
|------------|----------|-----------|---------|
| `task.completed` | Task Module | Workflow, QA, Audit | Task finished, trigger QC |
| `qc.passed` | QA Module | Workflow, Acceptance | QC approved, ready for acceptance |
| `qc.failed` | QA Module | Workflow, Issue | QC failed, create defect report |
| `acceptance.finalized` | Acceptance | Workflow, Finance, Warranty | Acceptance complete, trigger billing |
| `log.created` | Log Module | Audit | Construction log created |

### Required Events (To Be Implemented)

| Event Name | Producer | Consumers | Purpose |
|------------|----------|-----------|---------|
| `contract.created` | Contract | Audit | Contract registered |
| `contract.uploaded` | Contract | Parsing Service | PDF uploaded, trigger OCR |
| `contract.parsed` | Parsing Service | Contract | OCR complete, ready for review |
| `contract.confirmed` | Contract | Audit | Parsing confirmed by user |
| `contract.activated` | Contract | Task, Audit | Contract active, can create tasks |
| `task.created` | Task | Workflow, Audit | Task created |
| `asset.uploaded` | Asset | Contract, Task | File uploaded successfully |

---

**End of Research Document**

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-12-23
**Next Review Date**: After Phase 1 completion
