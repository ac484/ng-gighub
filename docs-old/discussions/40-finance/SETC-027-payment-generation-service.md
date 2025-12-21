# SETC-027: Payment Generation Service

> **任務 ID**: SETC-027  
> **任務名稱**: Payment Generation Service Implementation  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-024 (Invoice Service Expansion Planning)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
付款單自動生成服務實作

### 背景 / 目的
實作付款單自動生成服務，支援從驗收結果自動生成可付款清單（給承商）。根據 SETC.md 定義，驗收通過後需自動建立可付款清單。

### 需求說明
1. 實作 PaymentGenerationService
2. 從驗收結果自動計算可付款金額
3. 支援付款百分比設定
4. 關聯合約工項與任務
5. 產生付款明細
6. 承商資訊管理

### In Scope / Out of Scope

#### ✅ In Scope
- PaymentGenerationService 實作
- 付款金額計算邏輯
- 付款百分比處理
- 明細項目生成
- 承商資訊管理
- 與驗收模組整合
- 單元測試

#### ❌ Out of Scope
- 付款審核流程（SETC-028）
- 請款單生成（SETC-025）
- UI 元件（SETC-030）

### 功能行為
根據驗收結果自動生成付款單，計算可付款金額，建立付款明細。

### 資料 / API

#### PaymentGenerationService API

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentGenerationService {
  private invoiceRepository = inject(InvoiceRepository);
  private contractRepository = inject(ContractRepository);
  private acceptanceRepository = inject(AcceptanceRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 從驗收結果自動生成應付款單（付款給承商）
   */
  async autoGeneratePayable(
    acceptanceId: string,
    options?: GeneratePaymentOptions
  ): Promise<Invoice> {
    const acceptance = await this.acceptanceRepository.getById(acceptanceId);
    if (!acceptance) {
      throw new Error(`Acceptance not found: ${acceptanceId}`);
    }
    
    const contract = await this.contractRepository.getById(acceptance.contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${acceptance.contractId}`);
    }

    // 計算承商應付金額（可能與請款金額不同）
    const paymentItems = this.calculatePaymentItems(
      acceptance,
      contract,
      options?.paymentPercentage ?? 100
    );

    const payment = await this.createPayment({
      blueprintId: acceptance.blueprintId,
      invoiceType: 'payable',
      contractId: contract.id,
      acceptanceId: acceptanceId,
      taskIds: acceptance.taskIds,
      invoiceItems: paymentItems,
      billingParty: this.mapToPartyInfo(contract.owner),      // 付款方
      payingParty: this.mapToPartyInfo(contract.contractor),  // 收款方
      billingPercentage: options?.paymentPercentage ?? 100,
      dueDate: this.calculateDueDate(contract.paymentTerms)
    });

    // 發送事件
    this.eventBus.emit({
      type: SystemEventType.PAYMENT_GENERATED,
      blueprintId: payment.blueprintId,
      timestamp: new Date(),
      actor: options?.actor ?? this.getSystemActor(),
      data: { paymentId: payment.id, contractorId: contract.contractor.id }
    });

    return payment;
  }

  /**
   * 批次生成多個承商的付款單
   */
  async batchGeneratePayables(
    acceptanceId: string,
    contractorIds: string[]
  ): Promise<Invoice[]> {
    const payments: Invoice[] = [];
    
    for (const contractorId of contractorIds) {
      const payment = await this.autoGeneratePayable(acceptanceId, {
        contractorId
      });
      payments.push(payment);
    }
    
    return payments;
  }

  /**
   * 計算付款明細項目（考慮承商分潤比例）
   */
  private calculatePaymentItems(
    acceptance: Acceptance,
    contract: Contract,
    paymentPercentage: number
  ): InvoiceItem[] {
    return acceptance.inspectedItems.map(item => {
      const workItem = contract.workItems.find(w => w.id === item.workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${item.workItemId}`);
      }

      // 承商付款金額可能需要扣除管理費等
      const grossAmount = item.acceptedQuantity * workItem.unitPrice;
      const contractorRate = workItem.contractorRate ?? 1.0;
      const netAmount = grossAmount * contractorRate;
      
      const previousPaid = this.getPreviousPaidAmount(workItem.id);
      const currentPayment = (netAmount - previousPaid) * (paymentPercentage / 100);

      return {
        id: this.generateId(),
        contractWorkItemId: workItem.id,
        description: workItem.name,
        unit: workItem.unit,
        quantity: item.acceptedQuantity,
        unitPrice: workItem.unitPrice * contractorRate,
        amount: netAmount,
        completionPercentage: (item.acceptedQuantity / workItem.quantity) * 100,
        previousBilled: previousPaid,
        currentBilling: currentPayment
      };
    });
  }
}
```

#### 相關介面

```typescript
export interface GeneratePaymentOptions {
  paymentPercentage?: number;
  contractorId?: string;
  actor?: EventActor;
  notes?: string;
  dueDate?: Date;
}

export interface ContractorPaymentSummary {
  contractorId: string;
  contractorName: string;
  totalPayable: number;
  paidAmount: number;
  pendingAmount: number;
  payments: Invoice[];
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/services/` - 新增服務
- `src/app/core/blueprint/modules/implementations/acceptance/` - 整合
- `src/app/core/blueprint/modules/implementations/contract/` - 查詢

### 驗收條件
1. ✅ 從驗收結果自動生成付款單
2. ✅ 承商付款金額計算正確
3. ✅ 付款百分比處理正確
4. ✅ 支援多承商情境
5. ✅ 事件正確發送
6. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Firestore 批次操作與交易處理

**查詢重點**:
- 多文件原子操作
- 金額計算精度
- 承商分潤模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **付款與請款差異**
   - 請款對象：業主
   - 付款對象：承商
   - 金額可能不同（扣除管理費）

2. **多承商處理**
   - 一個驗收可能涉及多個承商
   - 按承商分別生成付款單
   - 分潤比例計算

3. **金額計算邏輯**
   - 承商付款 = 完成金額 × 承商比例 × 付款百分比
   - 管理費扣除
   - 保留金處理

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── PaymentRepository 擴展
├── 承商資訊管理
└── 基本付款單生成

Day 2 (8 hours):
├── PaymentGenerationService 實作
├── 金額計算邏輯（含承商比例）
└── 批次生成支援

Day 3 (8 hours):
├── 單元測試
├── 多承商情境測試
└── 文檔更新
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: Repository 擴展 (Day 1)

**檔案**: `payment.repository.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentRepository extends InvoiceRepository {
  async getByContractor(
    blueprintId: string,
    contractorId: string
  ): Promise<Invoice[]> {
    const invoicesCol = this.getInvoicesCollection(blueprintId);
    const q = query(
      invoicesCol,
      where('invoiceType', '==', 'payable'),
      where('payingParty.id', '==', contractorId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  }

  async getContractorPaymentSummary(
    blueprintId: string,
    contractorId: string
  ): Promise<ContractorPaymentSummary> {
    const payments = await this.getByContractor(blueprintId, contractorId);
    
    const totalPayable = payments.reduce((sum, p) => sum + p.total, 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);
    
    return {
      contractorId,
      contractorName: payments[0]?.payingParty.name ?? '',
      totalPayable,
      paidAmount,
      pendingAmount: totalPayable - paidAmount,
      payments
    };
  }
}
```

#### Phase 2: 生成服務 (Day 2)

**檔案**: `payment-generation.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentGenerationService {
  private paymentRepository = inject(PaymentRepository);
  private contractRepository = inject(ContractRepository);
  private acceptanceRepository = inject(AcceptanceRepository);
  private eventBus = inject(BlueprintEventBusService);

  // 完整實作如 API 定義
}
```

#### Phase 3: 測試 (Day 3)

**檔案**: `payment-generation.service.spec.ts`

```typescript
describe('PaymentGenerationService', () => {
  it('should generate payable from acceptance', async () => {
    // Test implementation
  });

  it('should calculate contractor payment with rate', async () => {
    // Test implementation
  });

  it('should batch generate for multiple contractors', async () => {
    // Test implementation
  });

  it('should emit PAYMENT_GENERATED event', async () => {
    // Test implementation
  });
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/repositories/payment.repository.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment-generation.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment-generation.service.spec.ts`

**修改檔案**:
- `src/app/core/blueprint/modules/implementations/finance/index.ts`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 付款與請款使用相同資料結構
- ✅ 承商比例計算可配置
- ✅ 支援多承商情境
- ✅ 事件驅動通知

### Angular 20 規範
- ✅ Injectable providedIn: 'root'
- ✅ 使用 inject() 注入依賴
- ✅ 錯誤處理完整

---

## ✅ 檢查清單

### 架構檢查
- [ ] 遵循三層架構
- [ ] 與請款服務解耦
- [ ] 事件整合正確

### 功能檢查
- [ ] 付款單生成正確
- [ ] 承商比例計算準確
- [ ] 批次生成運作正常

### 測試檢查
- [ ] 單元測試覆蓋率 > 80%
- [ ] 多承商情境測試
- [ ] 金額計算測試
