# SETC-029: Payment Status Tracking

> **任務 ID**: SETC-029  
> **任務名稱**: Payment Status Tracking Service  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-028 (Payment Approval Workflow)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
款項狀態追蹤服務實作

### 背景 / 目的
實作款項狀態追蹤服務，自動更新任務款項狀態，計算請款/付款進度，提供成本管理統計。根據 SETC.md 定義：更新任務款項狀態（請款進度 %、付款進度 %）→ 計入成本管理。

### 需求說明
1. 實作 PaymentStatusTrackingService
2. 自動計算請款進度
3. 自動計算付款進度
4. 更新任務款項狀態
5. 提供成本管理統計
6. 實作進度報表

### In Scope / Out of Scope

#### ✅ In Scope
- PaymentStatusTrackingService 實作
- 請款進度計算
- 付款進度計算
- 任務狀態更新
- 成本統計
- 報表資料準備
- 單元測試

#### ❌ Out of Scope
- UI 報表元件（SETC-030）
- 複雜財務分析（未來階段）
- ERP 整合（未來階段）

### 功能行為
追蹤所有款項狀態，自動計算進度，更新相關任務狀態，提供統計資料。

### 資料 / API

#### PaymentStatusTrackingService API

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentStatusTrackingService {
  private invoiceRepository = inject(InvoiceRepository);
  private taskRepository = inject(TaskRepository);
  private contractRepository = inject(ContractRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 計算任務請款進度
   */
  async calculateTaskBillingProgress(taskId: string): Promise<BillingProgress> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const invoices = await this.invoiceRepository.getByTaskId(
      task.blueprintId,
      taskId,
      'receivable'
    );

    const totalBillable = task.totalAmount;
    const billedAmount = invoices
      .filter(inv => ['approved', 'invoiced', 'paid'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0);

    return {
      taskId,
      totalBillable,
      billedAmount,
      paidAmount,
      billingPercentage: totalBillable > 0 
        ? (billedAmount / totalBillable) * 100 
        : 0,
      collectionPercentage: billedAmount > 0 
        ? (paidAmount / billedAmount) * 100 
        : 0
    };
  }

  /**
   * 計算任務付款進度
   */
  async calculateTaskPaymentProgress(taskId: string): Promise<PaymentProgress> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const payments = await this.invoiceRepository.getByTaskId(
      task.blueprintId,
      taskId,
      'payable'
    );

    const totalPayable = task.contractorAmount;
    const approvedAmount = payments
      .filter(p => ['approved', 'invoiced', 'paid'].includes(p.status))
      .reduce((sum, p) => sum + p.total, 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);

    return {
      taskId,
      totalPayable,
      approvedAmount,
      paidAmount,
      approvalPercentage: totalPayable > 0 
        ? (approvedAmount / totalPayable) * 100 
        : 0,
      paymentPercentage: approvedAmount > 0 
        ? (paidAmount / approvedAmount) * 100 
        : 0
    };
  }

  /**
   * 更新任務款項狀態
   */
  async updateTaskPaymentStatus(taskId: string): Promise<void> {
    const billingProgress = await this.calculateTaskBillingProgress(taskId);
    const paymentProgress = await this.calculateTaskPaymentProgress(taskId);

    await this.taskRepository.update(taskId, {
      billingStatus: {
        percentage: billingProgress.billingPercentage,
        billedAmount: billingProgress.billedAmount,
        collectedAmount: billingProgress.paidAmount
      },
      paymentStatus: {
        percentage: paymentProgress.paymentPercentage,
        approvedAmount: paymentProgress.approvedAmount,
        paidAmount: paymentProgress.paidAmount
      },
      updatedAt: new Date()
    });
  }

  /**
   * 取得藍圖財務摘要
   */
  async getBlueprintFinancialSummary(
    blueprintId: string
  ): Promise<FinancialSummary> {
    const receivables = await this.invoiceRepository.getByBlueprintIdAndType(
      blueprintId,
      'receivable'
    );
    const payables = await this.invoiceRepository.getByBlueprintIdAndType(
      blueprintId,
      'payable'
    );

    const totalReceivable = this.calculateTotal(receivables);
    const collectedAmount = this.calculatePaid(receivables);
    const totalPayable = this.calculateTotal(payables);
    const paidAmount = this.calculatePaid(payables);

    return {
      blueprintId,
      receivables: {
        total: totalReceivable,
        collected: collectedAmount,
        pending: totalReceivable - collectedAmount,
        collectionRate: totalReceivable > 0 
          ? (collectedAmount / totalReceivable) * 100 
          : 0
      },
      payables: {
        total: totalPayable,
        paid: paidAmount,
        pending: totalPayable - paidAmount,
        paymentRate: totalPayable > 0 
          ? (paidAmount / totalPayable) * 100 
          : 0
      },
      grossProfit: collectedAmount - paidAmount,
      grossProfitMargin: collectedAmount > 0 
        ? ((collectedAmount - paidAmount) / collectedAmount) * 100 
        : 0,
      asOf: new Date()
    };
  }

  /**
   * 監聽付款事件自動更新
   */
  private setupEventListeners(): void {
    this.eventBus.on(SystemEventType.INVOICE_PAID, async (event) => {
      const { taskIds } = event.data;
      for (const taskId of taskIds) {
        await this.updateTaskPaymentStatus(taskId);
      }
    });

    this.eventBus.on(SystemEventType.PAYMENT_COMPLETED, async (event) => {
      const { taskIds } = event.data;
      for (const taskId of taskIds) {
        await this.updateTaskPaymentStatus(taskId);
      }
    });
  }
}
```

#### 相關介面

```typescript
export interface BillingProgress {
  taskId: string;
  totalBillable: number;
  billedAmount: number;
  paidAmount: number;
  billingPercentage: number;
  collectionPercentage: number;
}

export interface PaymentProgress {
  taskId: string;
  totalPayable: number;
  approvedAmount: number;
  paidAmount: number;
  approvalPercentage: number;
  paymentPercentage: number;
}

export interface FinancialSummary {
  blueprintId: string;
  receivables: {
    total: number;
    collected: number;
    pending: number;
    collectionRate: number;
  };
  payables: {
    total: number;
    paid: number;
    pending: number;
    paymentRate: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  asOf: Date;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/services/` - 追蹤服務
- `src/app/core/blueprint/modules/implementations/tasks/` - 任務狀態更新
- 報表模組整合

### 驗收條件
1. ✅ 請款進度自動計算
2. ✅ 付款進度自動計算
3. ✅ 任務狀態自動更新
4. ✅ 財務摘要準確
5. ✅ 事件觸發更新正常
6. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Firestore 聚合查詢與效能優化

**查詢重點**:
- 聚合計算最佳實踐
- 快取策略
- 批次更新

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **進度計算邏輯**
   - 請款進度 = 已請款 / 總可請款
   - 付款進度 = 已付款 / 總應付款
   - 考慮不同狀態

2. **自動更新時機**
   - 請款單狀態變更
   - 付款單狀態變更
   - 定期批次計算

3. **效能考量**
   - 快取統計結果
   - 增量更新
   - 避免過度查詢

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── PaymentStatusTrackingService 實作
├── 進度計算邏輯
└── 事件監聽設定

Day 2 (8 hours):
├── 財務摘要計算
├── 單元測試
└── 效能優化
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 追蹤服務 (Day 1)

**檔案**: `payment-status-tracking.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentStatusTrackingService {
  // 完整實作如 API 定義
  
  constructor() {
    this.setupEventListeners();
  }
}
```

#### Phase 2: 測試與優化 (Day 2)

```typescript
describe('PaymentStatusTrackingService', () => {
  it('should calculate billing progress', async () => {});
  it('should calculate payment progress', async () => {});
  it('should update task status on payment', async () => {});
  it('should generate financial summary', async () => {});
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/services/payment-status-tracking.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/payment-status-tracking.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/finance/models/financial-summary.model.ts`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 事件驅動自動更新
- ✅ 計算結果準確
- ✅ 效能考量（快取）

### Angular 20 規範
- ✅ 使用 inject() 注入依賴
- ✅ 使用 signal() 快取結果
- ✅ takeUntilDestroyed() 管理訂閱

---

## ✅ 檢查清單

### 功能檢查
- [ ] 進度計算準確
- [ ] 自動更新正常
- [ ] 財務摘要正確

### 測試檢查
- [ ] 計算邏輯測試
- [ ] 事件觸發測試
- [ ] 效能測試
