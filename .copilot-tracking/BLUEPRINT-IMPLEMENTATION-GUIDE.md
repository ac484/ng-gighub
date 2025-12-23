# Blueprint Layer Implementation - Quick Start Guide

> **Reference**: See complete analysis in `.copilot-tracking/research/blueprint-layer-implementation-analysis.md`

## Overview

This guide provides a quick reference for implementing the Blueprint Layer architecture based on the analysis of `docs/reference/BLUEPRINT_LAYER.md`.

---

## Critical Gaps Summary

### 🔴 HIGH PRIORITY - Must Implement

#### 1. Policies Layer (Missing)
**Location**: Create `/src/app/core/blueprint/policies/`

**Required Files**:
```
/blueprint/policies/
├── access-control.policy.ts
├── state-transition.policy.ts
├── approval.policy.ts
├── contract.policy.ts
├── task.policy.ts
├── finance.policy.ts
├── index.ts
└── README.md
```

**Purpose**: Centralized cross-module policy enforcement

**Example Functions**:
```typescript
canCreateTask(contract: Contract): boolean
canRequestPayment(acceptance: Acceptance): boolean
canEditIssue(issue: Issue): boolean
```

#### 2. Contract Module (Missing)
**Location**: Create `/src/app/core/blueprint/modules/implementations/contract/`

**Required Structure**:
```
contract/
├── contract.module.ts
├── models/
├── services/
├── repositories/
├── events/
├── policies/
├── facade/
├── config/
├── components/
└── exports/
```

**Key Services**:
- `contract.service.ts` - CRUD operations
- `contract-parsing.service.ts` - OCR/AI integration

#### 3. Task Module (Partial - needs migration)
**Current**: `src/app/routes/blueprint/task/` (UI layer)
**Target**: `src/app/core/blueprint/modules/implementations/task/`

**Action**: Migrate task logic from routes to blueprint structure

#### 4. Asset Module (Missing)
**Location**: Create `/src/app/core/blueprint/modules/implementations/asset/`

**Purpose**: Centralized file/asset management with CloudFacade integration

---

## Implementation Priority

### Week 1-2: Phase 1 - Critical Foundation

**Task 1.1: Create Policies Layer** (3-5 days)
1. Create directory structure
2. Implement core policy services
3. Write unit tests
4. Document usage

**Task 1.2: Create Contract Module** (5-7 days)
1. Create module structure
2. Implement models and states
3. Implement service layer
4. Implement repository layer
5. Create event definitions
6. Implement policies
7. Create facade
8. Write tests
9. Document module

### Week 3-4: Phase 2 - Module Integration

**Task 2.1: Integrate Task Module** (4-6 days)
- Migrate task logic to blueprint
- Integrate with workflow
- Update handlers

**Task 2.2: Create Asset Module** (4-5 days)
- Create module structure
- Implement CloudFacade integration
- Implement lifecycle management

### Week 5: Phase 3 - Workflow Enhancements

**Task 3.1: Enhance Workflow Orchestrator** (3-4 days)
- Add contract workflow handlers
- Add task workflow handlers
- Add asset workflow handlers

**Task 3.2: Policy Integration** (3-4 days)
- Integrate policies across modules
- Update workflow handlers

### Week 6: Phase 4 - Standardization

**Task 4.1: Standardization** (2-3 days)
- Add missing directories to existing modules
- Standardize exports

**Task 4.2: Documentation** (3-4 days)
- Create README for each module
- Document event flows
- Create diagrams

---

## Development Standards

### Module Structure Template
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

### Service Layer Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly eventBus = inject(EnhancedEventBus);
  private readonly repository = inject(ModuleRepository);
  private readonly policyService = inject(ModulePolicyService);
  
  async create(data: CreateDTO): Promise<Entity> {
    // 1. Validate policy
    if (!this.policyService.canCreate(data)) {
      throw new Error('Creation not allowed by policy');
    }
    
    // 2. Create entity
    const entity = await this.repository.create(data);
    
    // 3. Emit event
    this.eventBus.emit('module.created', {
      id: entity.id,
      timestamp: new Date(),
      data: entity
    });
    
    return entity;
  }
}
```

### Policy Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class ModulePolicyService {
  canCreate(data: CreateDTO): boolean {
    // Validate business rules
    return data.isValid;
  }
  
  canUpdate(entity: Entity): boolean {
    // Check state and permissions
    return entity.status === Status.Active;
  }
}
```

### Event Pattern
```typescript
export const ModuleEvents = {
  Created: 'module.created',
  Updated: 'module.updated',
  Deleted: 'module.deleted'
} as const;

export interface ModuleCreatedEvent {
  type: typeof ModuleEvents.Created;
  id: string;
  timestamp: Date;
  actor: string;
  data: Entity;
}
```

---

## Testing Requirements

### Minimum Coverage
- Unit tests: ≥ 80%
- Integration tests: ≥ 70%

### Test Categories

**Unit Tests**:
```typescript
// service.spec.ts
describe('ModuleService', () => {
  it('should create entity and emit event', async () => {
    // Test service logic
  });
  
  it('should enforce policy rules', async () => {
    // Test policy integration
  });
});
```

**Integration Tests**:
```typescript
// module-integration.spec.ts
describe('Module Integration', () => {
  it('should handle cross-module workflow', async () => {
    // Test event flows
  });
});
```

**Workflow Tests**:
```typescript
// workflow.spec.ts
describe('Workflow Orchestrator', () => {
  it('should trigger next step after event', async () => {
    // Test workflow logic
  });
});
```

---

## Event Flow Examples

### Contract Upload Flow
```
User Action: Upload Contract PDF
    ↓
ContractFacade.uploadContractPDF(file)
    ↓
AssetFacade.upload(file)
    ↓
CloudFacade.uploadFile()
    ↓
EventBus.emit('asset.uploaded')
    ↓
ContractService.onAssetUploaded()
    ↓
EventBus.emit('contract.uploaded')
    ↓
ContractParsingService.parseContract()
```

### Task Creation with Policy
```
User Action: Create Task
    ↓
TaskFacade.createTask(contractId, data)
    ↓
ContractPolicyService.canCreateTask(contract) [Policy Check]
    ↓
TaskService.create(data)
    ↓
EventBus.emit('task.created')
    ↓
AuditService.log('task.created') [Audit]
    ↓
WorkflowOrchestrator.onTaskCreated() [Workflow]
```

---

## Key Architectural Principles

### From BLUEPRINT_LAYER.md:

1. **Event-Bus**: Never knows data structure, only events, rules, and workflows
2. **Workflow**: Doesn't "do things", only decides "who should do what next"
3. **Audit**: Is history, not source of truth
4. **Policies**: Answers "can or cannot", not "how to do"

### Layer Responsibilities:

| Layer | Responsibility | Cannot Do |
|-------|---------------|-----------|
| **Event-Bus** | Transmit & dispatch | Judge, modify payload, execute logic, depend on domain |
| **Workflow** | Coordinate processes | Access repository, modify domain, include UI logic |
| **Audit** | Record history | Affect workflow, block operations, serve as data source |
| **Policies** | Enforce rules | Store data, emit events, execute workflows |

---

## Quick Commands

### Create Research Directory
```bash
mkdir -p .copilot-tracking/research
```

### View Current Blueprint Structure
```bash
tree src/app/core/blueprint -L 2
```

### Check Existing Modules
```bash
ls -la src/app/core/blueprint/modules/implementations/
```

### Run Tests
```bash
npm test -- --grep="blueprint"
```

---

## Resources

### Documentation
- **Complete Analysis**: `.copilot-tracking/research/blueprint-layer-implementation-analysis.md`
- **Architecture Spec**: `docs/reference/BLUEPRINT_LAYER.md`
- **Angular Instructions**: `.github/instructions/ng-gighub-architecture.instructions.md`

### Current Implementation
- **Event-Bus**: `src/app/core/blueprint/events/`
- **Workflow**: `src/app/core/blueprint/workflow/`
- **Modules**: `src/app/core/blueprint/modules/implementations/`

---

## Next Actions

### Immediate (This Week)
1. [ ] Review research document with team
2. [ ] Get stakeholder approval for implementation plan
3. [ ] Create development branch for Phase 1
4. [ ] Set up policies directory structure
5. [ ] Begin contract module scaffolding

### Short Term (Next 2 Weeks)
1. [ ] Implement policies layer
2. [ ] Implement contract module
3. [ ] Write comprehensive tests
4. [ ] Document implementations

### Medium Term (Month 2)
1. [ ] Migrate task module
2. [ ] Create asset module
3. [ ] Enhance workflows
4. [ ] Standardize all modules

---

**Last Updated**: 2025-12-23  
**Version**: 1.0  
**Status**: Research Complete, Ready for Implementation
