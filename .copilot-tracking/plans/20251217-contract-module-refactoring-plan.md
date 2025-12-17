# Contract Module Complete Refactoring Plan

**Date**: 2025-12-17  
**Author**: GigHub Development Team  
**Status**: Awaiting Approval  
**Estimated Effort**: 3-5 days

---

## 📋 Executive Summary

重構整個 Contract Module，解決當前架構混亂問題，遵循 **⭐.md** 規範，實現清晰的三層架構。

### Current Problems
- ❌ 8個服務層過度分散 (~120KB 程式碼)
- ❌ UI 元件過大 (32KB wizard)
- ❌ 缺乏統一狀態管理
- ❌ 不符合專案架構規範

### Target Goals
- ✅ 簡化為 3層架構 (Store → Facade → Repository)
- ✅ Signal-based 響應式狀態管理
- ✅ 元件化 UI，提高可重用性
- ✅ 事件驅動架構整合

---

## 🔍 Current State Analysis

### Service Layer Issues (8 Services → Too Many)

```typescript
// Current scattered services
services/
├── contract-management.service.ts    (16KB) ❌ Redundant
├── contract-creation.service.ts      (12KB) ❌ Redundant
├── contract-status.service.ts        (12KB) ❌ Redundant
├── contract-lifecycle.service.ts     (12KB) ❌ Redundant
├── contract-work-items.service.ts    (15KB) ❌ Redundant
├── contract-event.service.ts         (15KB) ❌ Redundant
├── contract-upload.service.ts        (10KB) ✅ Keep (specialized)
└── contract-parsing.service.ts       (16KB) ✅ Keep (specialized)
```

**Problems**:
1. **職責重疊**: 多個服務處理相似功能
2. **依賴複雜**: 服務間相互依賴形成複雜網絡
3. **狀態分散**: 各服務自行管理狀態
4. **錯誤處理重複**: 每個服務重複實作錯誤處理邏輯

### UI Component Issues

```typescript
// Current monolithic components
routes/blueprint/modules/
├── contract-creation-wizard.component.ts  (32KB) ❌ Too large
├── contract-module-view.component.ts      (17KB) ❌ Too large
├── contract-detail-drawer.component.ts    (15KB) ⚠️  OK
└── contract-modal.component.ts            (11KB) ✅ OK
```

**Problems**:
1. **單一元件過大**: wizard 包含所有步驟邏輯
2. **難以測試**: 過多職責導致測試困難
3. **低可重用性**: 缺乏可提取的子元件
4. **業務邏輯混合**: UI 邏輯與業務邏輯耦合

---

## 🏗️ Target Architecture

### New Directory Structure

```
contract/
├── store/                           ✨ NEW - 狀態管理
│   ├── contract.store.ts
│   ├── contract.state.ts
│   └── index.ts
│
├── facades/                         ✨ NEW - 業務門面
│   ├── contract.facade.ts           # 統一業務入口
│   └── index.ts
│
├── repositories/                    ✅ KEEP - 資料存取
│   ├── contract.repository.ts
│   ├── work-item.repository.ts
│   └── index.ts
│
├── services/                        🔄 SIMPLIFY - 輔助服務
│   ├── contract-upload.service.ts  # 檔案上傳專用
│   ├── contract-parsing.service.ts # AI 解析專用
│   └── index.ts
│
├── components/                      ✨ NEW - 可重用元件
│   ├── contract-form/               # 基本資料表單
│   ├── contract-party-form/         # 業主/承商表單
│   ├── contract-verification/       # 解析驗證 (已建立)
│   ├── work-item-list/              # 工項列表
│   ├── contract-summary/            # 合約摘要
│   └── index.ts
│
├── models/                          ✅ KEEP - 領域模型
│   ├── contract.model.ts
│   ├── dtos.ts
│   └── index.ts
│
├── utils/                           ✅ KEEP - 工具函數
│   ├── enhanced-parsing-converter.ts
│   └── index.ts
│
├── config/                          ✅ KEEP - 配置
│   ├── contract.config.ts
│   └── index.ts
│
├── contract.module.ts               🔄 UPDATE - 模組定義
├── module.metadata.ts               ✅ KEEP - 元資料
├── index.ts                         🔄 UPDATE - 主匯出
└── README.md                        🔄 UPDATE - 文檔
```

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│            UI Layer (Components)                 │
│  - Wizard Steps (modular)                       │
│  - Reusable Forms                               │
│  - Lists & Tables                               │
└─────────────────┬───────────────────────────────┘
                  │ inject()
┌─────────────────▼───────────────────────────────┐
│         Facade Layer (Business Logic)           │
│  - ContractFacade                               │
│    • CRUD operations                            │
│    • Workflow orchestration                     │
│    • Event emission                             │
└─────────────────┬───────────────────────────────┘
                  │ inject()
┌─────────────────▼───────────────────────────────┐
│          Store Layer (State Management)         │
│  - ContractStore (Signal-based)                 │
│    • Reactive state                             │
│    • Computed selectors                         │
│    • State mutations                            │
└─────────────────┬───────────────────────────────┘
                  │ inject()
┌─────────────────▼───────────────────────────────┐
│       Repository Layer (Data Access)            │
│  - ContractRepository                           │
│  - WorkItemRepository                           │
│    • Firestore operations                       │
│    • Real-time listeners                        │
└─────────────────────────────────────────────────┘
```

---

## 📝 Implementation Phases

### ✅ Phase 1: Core Store Creation (狀態管理)

**Objectives**: 建立 Signal-based 中央狀態管理

#### Tasks

**1.1: Define State Interface**
```typescript
// store/contract.state.ts
export interface ContractState {
  contracts: Contract[];
  selectedContract: Contract | null;
  loading: boolean;
  error: string | null;
  filter: ContractFilter;
  pagination: PaginationState;
}
```

**1.2: Create Contract Store**
```typescript
// store/contract.store.ts
@Injectable({ providedIn: 'root' })
export class ContractStore {
  // Private state signals
  private _contracts = signal<Contract[]>([]);
  private _selectedContract = signal<Contract | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  contracts = this._contracts.asReadonly();
  selectedContract = this._selectedContract.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  // Computed signals
  activeContracts = computed(() => 
    this._contracts().filter(c => c.status === 'active')
  );
  
  contractCount = computed(() => this._contracts().length);

  // State mutations
  setContracts(contracts: Contract[]): void {
    this._contracts.set(contracts);
  }

  addContract(contract: Contract): void {
    this._contracts.update(contracts => [...contracts, contract]);
  }

  updateContract(id: string, updates: Partial<Contract>): void {
    this._contracts.update(contracts =>
      contracts.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  removeContract(id: string): void {
    this._contracts.update(contracts => 
      contracts.filter(c => c.id !== id)
    );
  }

  selectContract(contract: Contract | null): void {
    this._selectedContract.set(contract);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  reset(): void {
    this._contracts.set([]);
    this._selectedContract.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

**Estimated Effort**: 4 hours

---

### ✅ Phase 2: Unified Facade Creation (業務門面)

**Objectives**: 建立統一業務入口，整合所有業務邏輯

#### Tasks

**2.1: Create Contract Facade**
```typescript
// facades/contract.facade.ts
@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private store = inject(ContractStore);
  private repository = inject(ContractRepository);
  private workItemRepo = inject(WorkItemRepository);
  private eventBus = inject(BlueprintEventBus);
  private uploadService = inject(ContractUploadService);
  private parsingService = inject(ContractParsingService);
  private destroyRef = inject(DestroyRef);

  // Expose store state
  readonly contracts = this.store.contracts;
  readonly selectedContract = this.store.selectedContract;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly activeContracts = this.store.activeContracts;

  // CRUD Operations
  async loadContracts(blueprintId: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      this.repository.findByBlueprintId(blueprintId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (contracts) => {
            this.store.setContracts(contracts);
            this.store.setLoading(false);
          },
          error: (error) => {
            this.store.setError(error.message);
            this.store.setLoading(false);
          }
        });
    } catch (error) {
      this.store.setError(error.message);
      this.store.setLoading(false);
    }
  }

  async createContract(dto: CreateContractDto): Promise<Contract> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const contract = await this.repository.create(dto);
      this.store.addContract(contract);
      
      // Emit domain event
      this.eventBus.emit({
        type: 'CONTRACT_CREATED',
        moduleId: 'contract',
        payload: { contractId: contract.id }
      });

      this.store.setLoading(false);
      return contract;
    } catch (error) {
      this.store.setError(error.message);
      this.store.setLoading(false);
      throw error;
    }
  }

  async updateContract(id: string, dto: UpdateContractDto): Promise<void> {
    this.store.setLoading(true);
    
    try {
      await this.repository.update(id, dto);
      this.store.updateContract(id, dto);
      
      this.eventBus.emit({
        type: 'CONTRACT_UPDATED',
        moduleId: 'contract',
        payload: { contractId: id }
      });

      this.store.setLoading(false);
    } catch (error) {
      this.store.setError(error.message);
      this.store.setLoading(false);
      throw error;
    }
  }

  async deleteContract(id: string): Promise<void> {
    this.store.setLoading(true);
    
    try {
      await this.repository.delete(id);
      this.store.removeContract(id);
      
      this.eventBus.emit({
        type: 'CONTRACT_DELETED',
        moduleId: 'contract',
        payload: { contractId: id }
      });

      this.store.setLoading(false);
    } catch (error) {
      this.store.setError(error.message);
      this.store.setLoading(false);
      throw error;
    }
  }

  // Workflow Operations
  async uploadAndParseContract(
    file: File,
    blueprintId: string
  ): Promise<EnhancedContractParsingOutput> {
    this.store.setLoading(true);
    
    try {
      // Upload file
      const uploadResult = await this.uploadService.uploadContract(file);
      
      // Parse with AI
      const parsed = await this.parsingService.parseContract(
        uploadResult.fileUrl
      );

      this.store.setLoading(false);
      return parsed;
    } catch (error) {
      this.store.setError(error.message);
      this.store.setLoading(false);
      throw error;
    }
  }

  async activateContract(id: string): Promise<void> {
    await this.updateContract(id, { status: 'active' });
    
    this.eventBus.emit({
      type: 'CONTRACT_ACTIVATED',
      moduleId: 'contract',
      payload: { contractId: id }
    });
  }

  selectContract(contract: Contract | null): void {
    this.store.selectContract(contract);
  }
}
```

**Estimated Effort**: 8 hours

---

### ✅ Phase 3: Service Layer Simplification (精簡服務)

**Objectives**: 刪除冗餘服務，保留專用服務

#### Tasks

**3.1: Keep Specialized Services**
- ✅ `contract-upload.service.ts` (檔案上傳專用)
- ✅ `contract-parsing.service.ts` (AI 解析專用)

**3.2: Delete Redundant Services**
- ❌ DELETE: `contract-management.service.ts` → Moved to Facade
- ❌ DELETE: `contract-creation.service.ts` → Moved to Facade
- ❌ DELETE: `contract-status.service.ts` → Moved to Facade
- ❌ DELETE: `contract-lifecycle.service.ts` → Moved to Facade
- ❌ DELETE: `contract-work-items.service.ts` → Moved to Facade
- ❌ DELETE: `contract-event.service.ts` → Integrated into Facade

**3.3: Update Service Index**
```typescript
// services/index.ts
export * from './contract-upload.service';
export * from './contract-parsing.service';
// Removed 6 redundant exports
```

**Estimated Effort**: 2 hours

---

### ✅ Phase 4: UI Component Refactoring (元件拆分)

**Objectives**: 將大元件拆分為小而專注的可重用元件

#### Tasks

**4.1: Extract Contract Form Component**
```typescript
// components/contract-form/contract-form.component.ts
@Component({
  selector: 'app-contract-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, ReactiveFormsModule, NzFormModule, ...],
  template: './contract-form.component.html'
})
export class ContractFormComponent {
  formData = input<Partial<Contract>>();
  formSubmit = output<CreateContractDto>();
  
  private fb = inject(FormBuilder);
  
  contractForm: FormGroup = this.fb.group({
    contractNumber: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    currency: ['TWD', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0)]],
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    signedDate: [null]
  });

  ngOnInit(): void {
    const data = this.formData();
    if (data) {
      this.contractForm.patchValue(data);
    }
  }

  onSubmit(): void {
    if (this.contractForm.valid) {
      this.formSubmit.emit(this.contractForm.value);
    }
  }
}
```

**4.2: Extract Party Form Component**
```typescript
// components/contract-party-form/contract-party-form.component.ts
@Component({
  selector: 'app-contract-party-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, ReactiveFormsModule, NzFormModule, ...],
  template: './contract-party-form.component.html'
})
export class ContractPartyFormComponent {
  partyType = input.required<'owner' | 'contractor'>();
  partyData = input<ContractParty>();
  partyChange = output<ContractParty>();
  
  private fb = inject(FormBuilder);
  
  partyForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    contactPerson: ['', Validators.required],
    contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\(\)\s]+$/)]],
    contactEmail: ['', [Validators.required, Validators.email]],
    address: [''],
    taxId: ['']
  });

  ngOnInit(): void {
    const data = this.partyData();
    if (data) {
      this.partyForm.patchValue(data);
    }
  }

  onChange(): void {
    if (this.partyForm.valid) {
      this.partyChange.emit(this.partyForm.value);
    }
  }
}
```

**4.3: Extract Work Item List Component**
```typescript
// components/work-item-list/work-item-list.component.ts
@Component({
  selector: 'app-work-item-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, STModule],
  template: './work-item-list.component.html'
})
export class WorkItemListComponent {
  workItems = input.required<WorkItem[]>();
  editable = input(false);
  
  workItemEdit = output<WorkItem>();
  workItemDelete = output<string>();

  columns: STColumn[] = [
    { title: '工項代碼', index: 'code' },
    { title: '工項名稱', index: 'title' },
    { title: '數量', index: 'quantity', type: 'number' },
    { title: '單位', index: 'unit' },
    { title: '單價', index: 'unitPrice', type: 'currency' },
    { title: '總價', index: 'totalPrice', type: 'currency' },
    {
      title: '操作',
      buttons: [
        { text: '編輯', click: (record: WorkItem) => this.onEdit(record) },
        { text: '刪除', click: (record: WorkItem) => this.onDelete(record), pop: true }
      ]
    }
  ];

  onEdit(item: WorkItem): void {
    this.workItemEdit.emit(item);
  }

  onDelete(item: WorkItem): void {
    this.workItemDelete.emit(item.id);
  }
}
```

**4.4: Refactor Wizard to Use Components**
```typescript
// routes/blueprint/modules/contract-creation-wizard.component.ts (simplified)
@Component({
  selector: 'app-contract-creation-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzStepsModule,
    ContractFormComponent,          // ✨ Extracted
    ContractPartyFormComponent,     // ✨ Extracted
    ContractVerificationComponent,  // ✨ Extracted
    WorkItemListComponent          // ✨ Extracted
  ],
  template: './contract-creation-wizard.component.html'
})
export class ContractCreationWizardComponent {
  private facade = inject(ContractFacade);
  
  currentStep = signal(0);
  contractData = signal<Partial<Contract>>({});

  steps = [
    { title: '基本資料', icon: 'file-text' },
    { title: '業主資訊', icon: 'user' },
    { title: '承商資訊', icon: 'team' },
    { title: '上傳解析', icon: 'upload' },
    { title: '確認建檔', icon: 'check-circle' }
  ];

  onContractFormSubmit(data: CreateContractDto): void {
    this.contractData.update(current => ({ ...current, ...data }));
    this.nextStep();
  }

  onOwnerFormSubmit(owner: ContractParty): void {
    this.contractData.update(current => ({ ...current, owner }));
    this.nextStep();
  }

  onContractorFormSubmit(contractor: ContractParty): void {
    this.contractData.update(current => ({ ...current, contractor }));
    this.nextStep();
  }

  async onVerificationConfirm(verified: CreateContractDto): Promise<void> {
    try {
      await this.facade.createContract(verified);
      this.nextStep();
    } catch (error) {
      console.error('Failed to create contract:', error);
    }
  }

  nextStep(): void {
    this.currentStep.update(step => Math.min(step + 1, this.steps.length - 1));
  }

  prevStep(): void {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }
}
```

**Estimated Effort**: 12 hours

---

### ✅ Phase 5: Event-Driven Integration (事件驅動)

**Objectives**: 完整整合 BlueprintEventBus

#### Tasks

**5.1: Define Contract Domain Events**
```typescript
// models/contract.events.ts
export interface ContractEvent {
  type: ContractEventType;
  moduleId: 'contract';
  payload: ContractEventPayload;
  timestamp: Date;
  userId?: string;
}

export type ContractEventType =
  | 'CONTRACT_CREATED'
  | 'CONTRACT_UPDATED'
  | 'CONTRACT_DELETED'
  | 'CONTRACT_ACTIVATED'
  | 'CONTRACT_COMPLETED'
  | 'CONTRACT_TERMINATED'
  | 'WORK_ITEM_ADDED'
  | 'WORK_ITEM_UPDATED'
  | 'WORK_ITEM_DELETED';

export interface ContractEventPayload {
  contractId: string;
  workItemId?: string;
  changes?: Partial<Contract>;
}
```

**5.2: Integrate in Facade**
```typescript
// Already implemented in Phase 2
// All state-changing operations emit events via BlueprintEventBus
```

**5.3: Create Event Handlers**
```typescript
// facades/contract-event-handler.ts
@Injectable({ providedIn: 'root' })
export class ContractEventHandler {
  private eventBus = inject(BlueprintEventBus);
  private destroyRef = inject(DestroyRef);

  initialize(): void {
    this.eventBus.on('CONTRACT_ACTIVATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        console.log('Contract activated:', event.payload);
        // Handle cross-module implications
      });

    // Add more event handlers as needed
  }
}
```

**Estimated Effort**: 4 hours

---

### ✅ Phase 6: Testing & Documentation (測試文檔)

**Objectives**: 確保程式碼品質與可維護性

#### Tasks

**6.1: Write Store Unit Tests**
```typescript
// store/contract.store.spec.ts
describe('ContractStore', () => {
  let store: ContractStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContractStore]
    });
    store = TestBed.inject(ContractStore);
  });

  it('should initialize with empty state', () => {
    expect(store.contracts()).toEqual([]);
    expect(store.selectedContract()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should add contract', () => {
    const contract = createMockContract();
    store.addContract(contract);
    expect(store.contracts()).toContain(contract);
  });

  // More tests...
});
```

**6.2: Write Facade Unit Tests**
**6.3: Write Component Unit Tests**
**6.4: Write E2E Tests**

**6.5: Update Documentation**
- Update README.md with new architecture
- Add architecture diagrams
- Document API interfaces
- Add migration guide

**Estimated Effort**: 16 hours

---

## 📊 Metrics & Benefits

### Code Reduction
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Services | 8 | 2 + 1 Facade + 1 Store | 50% |
| LOC (Services) | ~120KB | ~40KB | 67% |
| LOC (UI) | ~75KB | ~45KB | 40% |
| Total LOC | ~8100 | ~5000 | 38% |

### Architecture Improvements
- ✅ 符合三層架構原則
- ✅ Signal-based 響應式狀態管理
- ✅ 單一職責原則 (SRP)
- ✅ 事件驅動架構
- ✅ 可測試性提升 80%

### Developer Experience
- ✅ 清晰的資料流向
- ✅ 更容易導航
- ✅ 更容易理解
- ✅ 更容易維護

---

## ⏱️ Timeline

### Estimated Total Effort: 46 hours (≈ 6 工作天)

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|--------------|
| Phase 1 | Store Creation | 4h | None |
| Phase 2 | Facade Creation | 8h | Phase 1 |
| Phase 3 | Service Simplification | 2h | Phase 2 |
| Phase 4 | UI Refactoring | 12h | Phase 2 |
| Phase 5 | Event Integration | 4h | Phase 2 |
| Phase 6 | Testing & Docs | 16h | All |

### Suggested Schedule

**Week 1** (Days 1-3):
- Day 1: Phase 1 (Store) + Phase 2 (Facade) - 12h
- Day 2: Phase 3 (Services) + Phase 4 Part 1 (Components) - 8h
- Day 3: Phase 4 Part 2 (Wizard) + Phase 5 (Events) - 10h

**Week 2** (Days 4-6):
- Day 4-5: Phase 6 Part 1 (Unit Tests) - 12h
- Day 6: Phase 6 Part 2 (E2E + Docs) - 4h

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**:
- Feature flag for gradual rollout
- Keep old code until new implementation verified
- Comprehensive test coverage

### Risk 2: Integration Issues
**Mitigation**:
- Phase-by-phase implementation
- Continuous integration testing
- Rollback plan ready

### Risk 3: Performance Regression
**Mitigation**:
- Performance benchmarks
- Load testing
- Signal-based optimizations

---

## 🚀 Migration Strategy

### Approach: **Parallel Development**

```
Current State → Transition State → Target State
   (Old)       (Old + New)          (New)
```

#### Step 1: Parallel Implementation
- Implement new architecture alongside old
- Use feature flags to control switching
- No breaking changes to existing features

#### Step 2: Gradual Migration
- Migrate one feature at a time
- Start with least critical features
- Monitor for issues after each migration

#### Step 3: Complete Transition
- Remove old code after all features migrated
- Clean up feature flags
- Update all documentation

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] All existing features work correctly
- [ ] No data loss during migration
- [ ] No performance degradation
- [ ] All tests pass

### Non-Functional Requirements
- [ ] Code coverage > 80%
- [ ] Architecture complies with ⭐.md
- [ ] Documentation complete and accurate
- [ ] No TypeScript errors
- [ ] All ESLint rules pass

---

## 📞 Decision Required

Please confirm the following before starting implementation:

### Questions
1. **Scope**: Include functions-ai refactoring?
2. **Timeline**: Target completion date?
3. **Priority**: Which features need priority?
4. **Breaking Changes**: Acceptable or need backward compatibility?
5. **Deployment**: Gradual rollout or single release?

### Approval Needed
- [ ] Architecture design approved
- [ ] Timeline acceptable
- [ ] Resource allocation confirmed
- [ ] Begin implementation

---

**Status**: ⏸️ Awaiting Approval  
**Next Action**: Confirm scope and start Phase 1
