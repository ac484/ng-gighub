# SETC-028: Payment Approval Workflow

> **任務 ID**: SETC-028  
> **任務名稱**: Payment Approval Workflow Implementation  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-027 (Payment Generation Service)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
付款審核工作流程實作

### 背景 / 目的
實作付款審核工作流程，支援多級審核、開票流程、收/付款記錄。根據 SETC.md 定義的付款流程：草稿 → 送出 → 審核 → 開票 → 收/付款。

### 需求說明
1. 實作 PaymentApprovalService
2. 支援多級審核機制
3. 實作開票流程
4. 記錄收/付款資訊
5. 銀行轉帳整合準備
6. 審核歷史記錄

### In Scope / Out of Scope

#### ✅ In Scope
- PaymentApprovalService 實作
- 多級審核機制
- 開票流程管理
- 付款記錄
- 狀態機管理
- 事件通知
- 單元測試

#### ❌ Out of Scope
- 付款單生成（SETC-027）
- 銀行 API 整合（未來階段）
- UI 元件（SETC-030）

### 功能行為
管理付款單的完整審核流程，從送出到開票、付款完成。

### 資料 / API

#### PaymentApprovalService API

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentApprovalService {
  private paymentRepository = inject(PaymentRepository);
  private eventBus = inject(BlueprintEventBusService);
  private permissionService = inject(PermissionService);

  /**
   * 送出付款單進行審核
   */
  async submit(paymentId: string, actor: EventActor): Promise<Invoice> {
    const payment = await this.getPayment(paymentId);
    
    PaymentStateMachine.validateTransition(payment.status, 'submitted');
    this.validatePaymentData(payment);
    
    const updatedPayment = await this.updatePaymentStatus(
      payment,
      'submitted',
      actor
    );
    
    this.eventBus.emit({
      type: SystemEventType.PAYMENT_SUBMITTED,
      blueprintId: payment.blueprintId,
      timestamp: new Date(),
      actor,
      data: { paymentId, contractorId: payment.payingParty.id }
    });
    
    return updatedPayment;
  }

  /**
   * 核准付款單
   */
  async approve(
    paymentId: string,
    actor: EventActor,
    comments?: string
  ): Promise<Invoice> {
    const payment = await this.getPayment(paymentId);
    
    await this.validateApprovalPermission(payment, actor);
    
    const workflow = this.updateApprovalStep(
      payment.approvalWorkflow,
      actor,
      'approved',
      comments
    );
    
    const isFullyApproved = workflow.currentStep >= workflow.totalSteps;
    const newStatus: InvoiceStatus = isFullyApproved ? 'approved' : 'under_review';
    
    const updatedPayment = await this.paymentRepository.update(
      payment.blueprintId,
      paymentId,
      {
        status: newStatus,
        approvalWorkflow: workflow,
        updatedBy: actor.userId
      }
    );
    
    this.eventBus.emit({
      type: SystemEventType.PAYMENT_APPROVED,
      blueprintId: payment.blueprintId,
      timestamp: new Date(),
      actor,
      data: { paymentId, isFullyApproved }
    });
    
    return updatedPayment;
  }

  /**
   * 標記已開票
   */
  async markAsInvoiced(
    paymentId: string,
    actor: EventActor,
    invoiceInfo: PaymentInvoiceInfo
  ): Promise<Invoice> {
    const payment = await this.getPayment(paymentId);
    
    PaymentStateMachine.validateTransition(payment.status, 'invoiced');
    
    const updatedPayment = await this.paymentRepository.update(
      payment.blueprintId,
      paymentId,
      {
        status: 'invoiced',
        invoiceInfo,
        updatedBy: actor.userId
      }
    );
    
    return updatedPayment;
  }

  /**
   * 記錄付款完成
   */
  async markAsPaid(
    paymentId: string,
    actor: EventActor,
    paymentInfo: PaymentCompleteInfo
  ): Promise<Invoice> {
    const payment = await this.getPayment(paymentId);
    
    const newStatus = paymentInfo.amount >= payment.total 
      ? 'paid' 
      : 'partial_paid';
    
    PaymentStateMachine.validateTransition(payment.status, newStatus);
    
    const updatedPayment = await this.paymentRepository.update(
      payment.blueprintId,
      paymentId,
      {
        status: newStatus,
        paidDate: paymentInfo.paidDate ?? new Date(),
        paidAmount: paymentInfo.amount,
        paymentMethod: paymentInfo.method,
        paymentReference: paymentInfo.reference,
        updatedBy: actor.userId
      }
    );
    
    this.eventBus.emit({
      type: SystemEventType.PAYMENT_COMPLETED,
      blueprintId: payment.blueprintId,
      timestamp: new Date(),
      actor,
      data: { 
        paymentId, 
        amount: paymentInfo.amount,
        method: paymentInfo.method 
      }
    });
    
    return updatedPayment;
  }

  /**
   * 取得承商待付款清單
   */
  async getContractorPendingPayments(
    blueprintId: string,
    contractorId: string
  ): Promise<Invoice[]> {
    return this.paymentRepository.getByContractorAndStatus(
      blueprintId,
      contractorId,
      ['approved', 'invoiced']
    );
  }
}
```

#### 付款資訊介面

```typescript
export interface PaymentInvoiceInfo {
  invoiceNumber: string;
  invoiceDate: Date;
  taxId: string;
  attachments?: FileAttachment[];
}

export interface PaymentCompleteInfo {
  amount: number;
  method: PaymentMethod;
  paidDate?: Date;
  reference?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    transactionId: string;
  };
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/services/` - 審核服務
- 財務報表模組整合

### 驗收條件
1. ✅ 多級審核流程正常運作
2. ✅ 開票流程完整
3. ✅ 付款記錄正確
4. ✅ 部分付款支援
5. ✅ 狀態機轉換正確
6. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢付款流程最佳實踐

**查詢重點**:
- 財務審核流程
- 付款記錄追蹤
- 銀行轉帳整合模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **付款流程特殊性**
   - 與請款流程的差異
   - 開票環節處理
   - 銀行轉帳資訊

2. **部分付款處理**
   - 多次付款記錄
   - 餘額計算
   - 完成判斷

3. **承商通知**
   - 審核通過通知
   - 付款完成通知
   - 到帳確認

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── PaymentStateMachine 實作
├── 審核服務骨架
└── 權限驗證

Day 2 (8 hours):
├── 開票流程實作
├── 付款記錄實作
└── 部分付款支援

Day 3 (8 hours):
├── 承商查詢功能
├── 單元測試
└── 整合測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 狀態機 (Day 1)

**檔案**: `payment-status-machine.ts`

```typescript
export class PaymentStateMachine {
  private static transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['under_review', 'approved', 'rejected'],
    under_review: ['approved', 'rejected'],
    approved: ['invoiced', 'cancelled'],
    rejected: ['draft'],
    invoiced: ['partial_paid', 'paid'],
    partial_paid: ['paid'],
    paid: [],
    cancelled: []
  };

  static canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }

  static validateTransition(from: InvoiceStatus, to: InvoiceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new PaymentStatusError(
        `Invalid payment status transition: ${from} → ${to}`,
        { from, to }
      );
    }
  }
}
```

#### Phase 2: 審核服務 (Day 2)

**檔案**: `payment-approval.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentApprovalService {
  // 完整實作如 API 定義
}
```

#### Phase 3: 測試 (Day 3)

```typescript
describe('PaymentApprovalService', () => {
  it('should submit payment for approval', async () => {});
  it('should mark as invoiced after approval', async () => {});
  it('should record partial payment', async () => {});
  it('should complete payment flow', async () => {});
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/models/payment-status-machine.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment-approval.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment-approval.service.spec.ts`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用狀態機管理轉換
- ✅ 所有付款記錄歷史
- ✅ 支援部分付款
- ✅ 事件驅動通知

### Angular 20 規範
- ✅ 使用 inject() 注入依賴
- ✅ 錯誤處理完整

---

## ✅ 檢查清單

### 功能檢查
- [ ] 多級審核運作正常
- [ ] 開票流程完整
- [ ] 付款記錄準確
- [ ] 部分付款支援

### 測試檢查
- [ ] 狀態轉換測試
- [ ] 付款記錄測試
- [ ] 承商查詢測試
