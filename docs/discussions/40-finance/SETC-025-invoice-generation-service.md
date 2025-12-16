# SETC-025: Invoice Generation Service

> **任務 ID**: SETC-025  
> **任務名稱**: Invoice Generation Service Implementation  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-024 (Invoice Service Expansion Planning)  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
請款單自動生成服務實作

### 背景 / 目的
實作請款單自動生成服務，支援從驗收結果自動生成可請款清單（業主）。根據 SETC.md 定義，驗收通過後需自動建立可請款清單。

### 需求說明
1. 實作 InvoiceGenerationService
2. 從驗收結果自動計算可請款金額
3. 支援請款百分比設定
4. 關聯合約工項與任務
5. 產生請款明細

### In Scope / Out of Scope

#### ✅ In Scope
- InvoiceGenerationService 實作
- 請款金額計算邏輯
- 請款百分比處理
- 明細項目生成
- 與驗收模組整合
- 單元測試

#### ❌ Out of Scope
- 審核流程（SETC-026）
- 付款單生成（SETC-027）
- UI 元件（SETC-030）

### 功能行為
根據驗收結果自動生成請款單，計算可請款金額，建立請款明細。

### 資料 / API

#### InvoiceGenerationService API

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceGenerationService {
  private invoiceRepository = inject(InvoiceRepository);
  private contractRepository = inject(ContractRepository);
  private acceptanceRepository = inject(AcceptanceRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 從驗收結果自動生成應收請款單（向業主請款）
   */
  async autoGenerateReceivable(
    acceptanceId: string,
    options?: GenerateInvoiceOptions
  ): Promise<Invoice> {
    const acceptance = await this.acceptanceRepository.getById(acceptanceId);
    if (!acceptance) {
      throw new Error(`Acceptance not found: ${acceptanceId}`);
    }
    
    const contract = await this.contractRepository.getById(acceptance.contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${acceptance.contractId}`);
    }

    const invoiceItems = this.calculateInvoiceItems(
      acceptance,
      contract,
      options?.billingPercentage ?? 100
    );

    const invoice = await this.createInvoice({
      blueprintId: acceptance.blueprintId,
      invoiceType: 'receivable',
      contractId: contract.id,
      acceptanceId: acceptanceId,
      taskIds: acceptance.taskIds,
      invoiceItems,
      billingParty: this.mapToPartyInfo(contract.contractor),
      payingParty: this.mapToPartyInfo(contract.owner),
      billingPercentage: options?.billingPercentage ?? 100,
      dueDate: this.calculateDueDate(contract.paymentTerms)
    });

    // 發送事件
    this.eventBus.emit({
      type: SystemEventType.INVOICE_GENERATED,
      blueprintId: invoice.blueprintId,
      timestamp: new Date(),
      actor: options?.actor ?? this.getSystemActor(),
      data: { invoiceId: invoice.id, invoiceType: 'receivable' }
    });

    return invoice;
  }

  /**
   * 計算請款明細項目
   */
  private calculateInvoiceItems(
    acceptance: Acceptance,
    contract: Contract,
    billingPercentage: number
  ): InvoiceItem[] {
    return acceptance.inspectedItems.map(item => {
      const workItem = contract.workItems.find(w => w.id === item.workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${item.workItemId}`);
      }

      const completedAmount = item.acceptedQuantity * workItem.unitPrice;
      const previousBilled = this.getPreviousBilledAmount(workItem.id);
      const currentBilling = (completedAmount - previousBilled) * (billingPercentage / 100);

      return {
        id: this.generateId(),
        contractWorkItemId: workItem.id,
        description: workItem.name,
        unit: workItem.unit,
        quantity: item.acceptedQuantity,
        unitPrice: workItem.unitPrice,
        amount: completedAmount,
        completionPercentage: (item.acceptedQuantity / workItem.quantity) * 100,
        previousBilled,
        currentBilling
      };
    });
  }

  /**
   * 計算稅額與總額
   */
  private calculateTotals(items: InvoiceItem[], taxRate: number): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.currentBilling, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }
}
```

#### 相關介面

```typescript
export interface GenerateInvoiceOptions {
  billingPercentage?: number;
  taxRate?: number;
  actor?: EventActor;
  notes?: string;
  dueDate?: Date;
}

export interface GenerateInvoiceData {
  acceptanceId: string;
  billingPercentage: number;
  taxRate?: number;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/services/` - 新增服務
- `src/app/core/blueprint/modules/implementations/acceptance/` - 整合
- `src/app/core/blueprint/modules/implementations/contract/` - 查詢

### 驗收條件
1. ✅ 從驗收結果自動生成請款單
2. ✅ 金額計算正確
3. ✅ 請款百分比處理正確
4. ✅ 明細項目關聯合約工項
5. ✅ 事件正確發送
6. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular Signals 與 Firestore 交易處理

**查詢重點**:
- Firestore 批次寫入
- 金額計算精度處理
- 並發控制

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **驗收資料分析**
   - 識別需要的驗收欄位
   - 確認任務與工項關聯
   - 處理部分驗收情況

2. **金額計算邏輯**
   - 本次請款 = (完成金額 - 已請款) × 請款百分比
   - 稅額計算規則
   - 小數點精度處理

3. **並發控制**
   - 防止重複生成
   - 樂觀鎖定策略
   - 錯誤回滾

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── InvoiceRepository 實作
├── 基本 CRUD 操作
└── Firestore Security Rules

Day 2 (8 hours):
├── InvoiceGenerationService 實作
├── 金額計算邏輯
└── 與驗收模組整合

Day 3 (8 hours):
├── 單元測試
├── 整合測試
└── 文檔更新
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: Repository 層 (Day 1)

**檔案**: `src/app/core/blueprint/modules/implementations/finance/repositories/invoice.repository.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceRepository {
  private firestore = inject(Firestore);

  private getInvoicesCollection(blueprintId: string) {
    return collection(
      this.firestore,
      `blueprints/${blueprintId}/invoices`
    );
  }

  async create(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const invoicesCol = this.getInvoicesCollection(invoice.blueprintId);
    const docRef = await addDoc(invoicesCol, {
      ...invoice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { ...invoice, id: docRef.id } as Invoice;
  }

  async update(
    blueprintId: string,
    id: string,
    data: Partial<Invoice>
  ): Promise<void> {
    const docRef = doc(this.firestore, `blueprints/${blueprintId}/invoices/${id}`);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async getById(blueprintId: string, id: string): Promise<Invoice | null> {
    const docRef = doc(this.firestore, `blueprints/${blueprintId}/invoices/${id}`);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() 
      ? { id: snapshot.id, ...snapshot.data() } as Invoice 
      : null;
  }

  getByBlueprintId$(blueprintId: string): Observable<Invoice[]> {
    const invoicesCol = this.getInvoicesCollection(blueprintId);
    return collectionData(invoicesCol, { idField: 'id' }) as Observable<Invoice[]>;
  }
}
```

#### Phase 2: 生成服務 (Day 2)

**檔案**: `src/app/core/blueprint/modules/implementations/finance/services/invoice-generation.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceGenerationService {
  private invoiceRepository = inject(InvoiceRepository);
  private contractRepository = inject(ContractRepository);
  private acceptanceRepository = inject(AcceptanceRepository);
  private eventBus = inject(BlueprintEventBusService);
  private invoiceNumberService = inject(InvoiceNumberService);

  async autoGenerateReceivable(
    acceptanceId: string,
    options?: GenerateInvoiceOptions
  ): Promise<Invoice> {
    // 實作邏輯如上述 API 定義
  }

  private generateInvoiceNumber(type: 'receivable' | 'payable'): string {
    const prefix = type === 'receivable' ? 'INV' : 'PAY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private calculateDueDate(paymentTerms?: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (paymentTerms ?? 30));
    return dueDate;
  }

  private getSystemActor(): EventActor {
    return {
      userId: 'system',
      userName: 'System',
      role: 'system'
    };
  }
}
```

#### Phase 3: 測試 (Day 3)

**檔案**: `invoice-generation.service.spec.ts`

```typescript
describe('InvoiceGenerationService', () => {
  let service: InvoiceGenerationService;
  let mockInvoiceRepository: jasmine.SpyObj<InvoiceRepository>;
  let mockAcceptanceRepository: jasmine.SpyObj<AcceptanceRepository>;

  beforeEach(() => {
    mockInvoiceRepository = jasmine.createSpyObj('InvoiceRepository', ['create']);
    mockAcceptanceRepository = jasmine.createSpyObj('AcceptanceRepository', ['getById']);

    TestBed.configureTestingModule({
      providers: [
        InvoiceGenerationService,
        { provide: InvoiceRepository, useValue: mockInvoiceRepository },
        { provide: AcceptanceRepository, useValue: mockAcceptanceRepository }
      ]
    });

    service = TestBed.inject(InvoiceGenerationService);
  });

  it('should generate receivable invoice from acceptance', async () => {
    // Test implementation
  });

  it('should calculate correct billing amounts', async () => {
    // Test implementation
  });

  it('should emit INVOICE_GENERATED event', async () => {
    // Test implementation
  });
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/repositories/invoice.repository.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice-generation.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice-generation.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice-number.service.ts`

**修改檔案**:
- `src/app/core/blueprint/modules/implementations/finance/index.ts` (exports)
- `firestore.rules` (新增 invoices Collection 規則)

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 Firestore 批次操作
- ✅ 使用 Sequential Thinking 分析金額計算
- ✅ 使用 inject() 注入依賴
- ✅ 基於奧卡姆剃刀定律 (KISS)

### Angular 20 規範
- ✅ Injectable providedIn: 'root'
- ✅ 使用 signal() 管理狀態
- ✅ 錯誤處理完整

### Firestore Security Rules

```firestore-security-rules
match /blueprints/{blueprintId}/invoices/{invoiceId} {
  allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
  allow create: if isAuthenticated() && canCreateInvoice(blueprintId);
  allow update: if isAuthenticated() && canUpdateInvoice(blueprintId, invoiceId);
  allow delete: if isAuthenticated() && isAdmin(blueprintId);
}
```

---

## ✅ 檢查清單

### 架構檢查
- [ ] 遵循三層架構（Repository → Service）
- [ ] 使用 inject() 注入依賴
- [ ] 事件整合正確

### 功能檢查
- [ ] 從驗收自動生成請款單
- [ ] 金額計算準確
- [ ] 請款百分比處理正確
- [ ] 事件正確發送

### 測試檢查
- [ ] 單元測試覆蓋率 > 80%
- [ ] 金額計算測試
- [ ] 邊界情況測試

### 文檔檢查
- [ ] JSDoc 註解完整
- [ ] API 文檔更新
