# SETC-000-06: Finance Module (財務管理模組)

> **模組 ID**: `finance`  
> **版本**: 1.1.0  
> **狀態**: ✅ 已實作完成 (Invoice/Payment Enhancement)  
> **優先級**: P2 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

財務域負責所有財務管理相關功能，提供成本管理、請款管理、付款管理、預算管理、帳務管理及財務報表等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

所有財務管理相關功能，包括：
- 成本記錄、分析與預測
- 請款單管理與請款流程
- 付款管理與付款審核
- 預算編列、追蹤與控管
- 會計分錄與帳務記錄
- 財務報表生成與分析

### 核心特性

- ✅ **完整成本追蹤**: 即時成本記錄與分析
- ✅ **請款管理**: 規範化的請款流程與審核
- ✅ **預算控管**: 預算編列與執行控管
- ✅ **帳務管理**: 會計分錄與帳務核對
- ✅ **財務報表**: 自動生成多種財務報表
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **財務準確性**: 所有財務資料必須精確無誤
2. **審計追蹤**: 完整的財務操作記錄
3. **權限控制**: 嚴格的財務操作權限管理
4. **合規性**: 符合會計準則與稅務規定

---

## 🏗️ 架構設計

### 目錄結構

```
finance/
├── finance.module.ts                 # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── finance.repository.ts             # 共用資料存取層
├── finance.routes.ts                 # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── cost-management.service.ts    # Sub-Module: Cost Management
│   ├── invoice.service.ts            # Sub-Module: Invoice
│   ├── invoice-generation.service.ts # Invoice Auto-generation (SETC-025)
│   ├── invoice-approval.service.ts   # Invoice Approval Workflow (SETC-026)
│   ├── payment.service.ts            # Sub-Module: Payment
│   ├── payment-generation.service.ts # Payment Auto-generation (SETC-027)
│   ├── payment-approval.service.ts   # Payment Approval Workflow (SETC-028)
│   ├── payment-tracking.service.ts   # Payment Status Tracking (SETC-029)
│   ├── budget.service.ts             # Sub-Module: Budget
│   ├── ledger.service.ts             # Sub-Module: Ledger
│   └── financial-report.service.ts   # Sub-Module: Financial Report
├── models/                           # Domain 模型
│   ├── cost.model.ts
│   ├── invoice.model.ts
│   ├── payment.model.ts
│   ├── budget.model.ts
│   └── ledger.model.ts
├── components/                       # Domain UI 元件
│   ├── cost-management/
│   ├── invoice/
│   ├── payment/
│   └── budget/
├── config/
│   └── finance.config.ts             # 模組配置
├── exports/
│   └── finance-api.exports.ts        # 公開 API
├── index.ts                          # 統一匯出
├── finance.integration.spec.ts       # 整合測試
└── README.md                         # 模組文檔
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Cost Management Sub-Module (成本管理)

**職責**: 成本記錄、分析與預測功能

**核心功能**:
- 成本項目建立與分類
- 實際成本記錄
- 成本預測與分析
- 成本超支預警

### 2️⃣ Invoice Sub-Module (請款) - SETC-025/026

**職責**: 請款單管理、請款流程與請款記錄功能

**核心功能**:
- 請款單建立與編輯
- 自動生成應收/應付請款單 (SETC-025)
- 請款審核工作流程 (SETC-026)
- 請款狀態追蹤
- 請款單匯出

**資料模型**:
```typescript
interface Invoice {
  id: string;
  blueprintId: string;
  invoiceNumber: string;
  type: InvoiceType;         // 'receivable' | 'payable'
  
  // 關聯資訊
  contractId?: string;
  acceptanceId?: string;      // 從驗收自動生成
  workItems?: WorkItemInvoice[];
  
  // 金額
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  
  // 狀態與流程
  status: InvoiceStatus;      // 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  approvalWorkflow?: ApprovalStep[];
  
  // 付款資訊
  paymentTerms?: string;
  dueDate?: Date;
  paymentRecords?: PaymentRecord[];
  
  // 文件
  attachments?: string[];
  receiptUrl?: string;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**狀態機** (SETC-026):
```
draft → submitted → approved → paid
         ↓           ↓
      cancelled   rejected
```

### 3️⃣ Payment Sub-Module (付款) - SETC-027/028/029

**職責**: 付款管理、付款記錄與付款審核功能

**核心功能**:
- 付款單建立與編輯
- 自動生成付款單 (SETC-027)
- 付款審核工作流程 (SETC-028)
- 付款進度追蹤 (SETC-029)
- 付款記錄管理

**資料模型**:
```typescript
interface Payment {
  id: string;
  blueprintId: string;
  paymentNumber: string;
  invoiceId: string;
  
  // 金額
  amount: number;
  paymentMethod: PaymentMethod;
  
  // 狀態與流程
  status: PaymentStatus;      // 'pending' | 'approved' | 'rejected' | 'completed'
  approvalWorkflow?: ApprovalStep[];
  
  // 付款資訊
  scheduledDate: Date;
  actualDate?: Date;
  transactionId?: string;
  
  // 文件
  receiptUrl?: string;
  attachments?: string[];
  
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 4️⃣ Budget Sub-Module (預算)

**職責**: 預算編列、預算追蹤與預算控管功能

**核心功能**:
- 預算編列
- 預算執行追蹤
- 預算超支預警
- 預算調整記錄

### 5️⃣ Ledger Sub-Module (帳務)

**職責**: 會計分錄、帳務記錄與帳務核對功能

**核心功能**:
- 會計分錄建立
- 帳務記錄管理
- 帳務核對
- 帳簿報表

### 6️⃣ Financial Report Sub-Module (財務報表)

**職責**: 財務報表生成、報表匯出與報表分析功能

**核心功能**:
- 成本報表
- 收支報表
- 預算執行報表
- 財務摘要報表

---

## 🔌 公開 API

### IFinanceModuleApi

```typescript
interface IFinanceModuleApi {
  cost: ICostManagementApi;
  invoice: IInvoiceApi;
  invoiceGeneration: IInvoiceGenerationApi;    // SETC-025
  invoiceApproval: IInvoiceApprovalApi;        // SETC-026
  payment: IPaymentApi;
  paymentGeneration: IPaymentGenerationApi;    // SETC-027
  paymentApproval: IPaymentApprovalApi;        // SETC-028
  paymentTracking: IPaymentTrackingApi;        // SETC-029
  budget: IBudgetApi;
  ledger: ILedgerApi;
  report: IFinancialReportApi;
}
```

### IInvoiceGenerationApi (SETC-025)

```typescript
interface IInvoiceGenerationApi {
  autoGenerateReceivable(acceptanceId: string): Promise<Invoice>;
  autoGeneratePayable(acceptanceId: string): Promise<Invoice>;
  autoGenerateBoth(acceptanceId: string): Promise<{ receivable: Invoice; payable: Invoice }>;
}
```

### IInvoiceApprovalApi (SETC-026)

```typescript
interface IInvoiceApprovalApi {
  submit(invoiceId: string): Promise<void>;
  approve(invoiceId: string, approverId: string, comment?: string): Promise<void>;
  reject(invoiceId: string, approverId: string, reason: string): Promise<void>;
  cancel(invoiceId: string, reason: string): Promise<void>;
  returnToDraft(invoiceId: string): Promise<void>;
}
```

---

## 📡 事件整合

### 訂閱驗收事件並自動生成請款單

```typescript
// 驗收通過後自動生成請款單 (SETC-025)
this.eventBus.on('acceptance.passed')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(async event => {
    const result = await this.invoiceGenerationService.autoGenerateBoth(
      event.data.acceptanceId
    );
    console.log('Auto-generated invoices:', result);
  });
```

### 發送財務事件

```typescript
// 請款單核准事件
this.eventBus.emit({
  type: 'finance.invoice.approved',
  blueprintId: invoice.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { 
    invoiceId: invoice.id,
    amount: invoice.totalAmount
  }
});

// 付款完成事件
this.eventBus.emit({
  type: 'finance.payment.completed',
  blueprintId: payment.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: {
    paymentId: payment.id,
    invoiceId: payment.invoiceId,
    amount: payment.amount
  }
});
```

---

## 🚀 使用範例

### 1. 從驗收自動生成請款單

```typescript
// 驗收通過後，自動生成應收與應付請款單
const result = await this.invoiceGenerationService.autoGenerateBoth(
  'acceptance-123'
);

console.log('應收請款單:', result.receivable);
console.log('應付請款單:', result.payable);
```

### 2. 請款審核流程

```typescript
const invoice = await this.invoiceService.findById('invoice-123');

// 提交審核
await this.invoiceApprovalService.submit(invoice.id);

// 核准
await this.invoiceApprovalService.approve(
  invoice.id,
  'approver-001',
  '已審核通過'
);

// 或退回
await this.invoiceApprovalService.reject(
  invoice.id,
  'approver-001',
  '文件不齊全，請補件'
);
```

### 3. 付款追蹤

```typescript
// 查詢逾期付款
const overduePayments = await this.paymentTrackingService.getOverduePayments(
  'bp-123'
);

// 查詢付款進度
const summary = await this.paymentTrackingService.getPaymentSummary(
  'bp-123'
);
console.log('總應付:', summary.totalPayable);
console.log('已付款:', summary.totalPaid);
console.log('待付款:', summary.totalPending);
```

---

## 🧪 測試

### 單元測試

```bash
# 執行財務模組單元測試
yarn test --include="**/finance/**/*.spec.ts"
```

### 整合測試

```bash
# 執行財務模組整合測試
yarn test --include="**/finance.integration.spec.ts"
```

### 測試覆蓋範圍

- ✅ **Invoice State Machine**: 請款單狀態機轉換邏輯
- ✅ **Payment Status Tracking**: 款項進度計算與追蹤
- ✅ **Financial Summary**: 財務摘要計算
- ✅ **Overdue Calculation**: 逾期款項統計
- ✅ **Data Consistency**: 資料一致性驗證

---

## 📝 待實作功能

1. ⏳ **電子發票**: 整合電子發票系統
2. ⏳ **銀行對帳**: 自動銀行對帳功能
3. ⏳ **稅務申報**: 自動生成稅務申報文件
4. ⏳ **財務預測**: AI 財務預測與分析
5. ⏳ **多幣別支援**: 支援多種貨幣與匯率
6. ⏳ **行動付款**: 整合行動付款方式

---

## 🔗 相關模組

- **Contract Module**: 合約金額與財務關聯
- **Acceptance Module**: 驗收與請款關聯
- **Task Module**: 任務成本追蹤
- **Log Module**: 記錄財務操作
- **Workflow Module**: 審核工作流程

---

## 📚 參考資源

- [財務模組 README](../../src/app/core/blueprint/modules/implementations/finance/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-062-finance-module-enhancement-planning.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
