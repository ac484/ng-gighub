# 💰 Finance Module (財務模組)

> **SETC 任務編號**: SETC-024 ~ 031, SETC-062 ~ 069  
> **模組狀態**: ✅ 文檔完成  
> **預估工時**: 36 天 (初期 20 天 + 擴展 16 天)

---

## 🏗️ Blueprint Event Bus 整合 (MANDATORY)

### 🚨 核心要求
- ✅ **零直接依賴**: Finance Module 不得直接注入其他模組服務
- ✅ **事件驅動**: 所有模組間通訊透過 BlueprintEventBus
- ✅ **訂閱上游事件**: 監聽 Acceptance、Contract 事件
- ✅ **發送領域事件**: 發送 invoice.*, payment.*, finance.* 系列事件
- ✅ **階段三模組**: 作為財務流程終點，整合所有財務資料

### 📡 事件整合

#### 訂閱事件 (Subscribe)
```typescript
// Finance Module 監聽其他模組事件
'acceptance.passed'          → 🔥 自動產生計價單（Invoice）
'contract.activated'         → 建立預算記錄
'contract.work_item_updated' → 更新預算項目
'task.completed'             → 更新工項進度（用於計價）
```

#### 發送事件 (Emit)
```typescript
// Invoice 領域事件
'invoice.generated'          → 計價單產生
'invoice.submitted'          → 提交審核
'invoice.approved'           → 審核通過
'invoice.rejected'           → 審核拒絕
'invoice.paid'               → 已付款

// Payment 領域事件
'payment.requested'          → 請款申請
'payment.approved'           → 付款核准
'payment.processed'          → 付款處理中
'payment.completed'          → 付款完成
'payment.failed'             → 付款失敗

// Budget & Ledger 事件
'budget.updated'             → 預算更新
'budget.exceeded'            → 預算超支預警
'ledger.entry_created'       → 分錄建立
'finance.report_generated'   → 財務報表產生
```

#### 自動產生計價單流程
```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceEventService {
  private eventBus = inject(BlueprintEventBusService);
  private destroyRef = inject(DestroyRef);
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 🔥 監聽驗收通過 → 自動產生計價單
    this.eventBus.on('acceptance.passed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.autoGenerateInvoice(event);
      });
    
    // 監聽合約啟動 → 建立預算
    this.eventBus.on('contract.activated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.initializeBudget(event);
      });
  }
  
  private async autoGenerateInvoice(event: BlueprintEvent): Promise<void> {
    const { acceptanceId, workItems, totalAmount, blueprintId } = event.data;
    
    // 自動產生計價單
    const invoice = await this.invoiceRepository.create({
      blueprintId,
      acceptanceId,
      items: workItems,
      totalAmount,
      status: 'draft',
      generatedAt: new Date()
    });
    
    // 發送計價單產生事件
    this.eventBus.emit({
      type: 'invoice.generated',
      blueprintId,
      timestamp: new Date(),
      data: {
        invoiceId: invoice.id,
        acceptanceId,
        totalAmount,
        dueDate: this.calculateDueDate()
      }
    });
  }
}
```

#### 財務資料聚合（不直接查詢其他模組）
```typescript
@Injectable({ providedIn: 'root' })
export class FinanceReportService {
  private eventBus = inject(BlueprintEventBusService);
  
  // ✅ 正確: 透過訂閱事件收集資料
  private contractData = signal<ContractData[]>([]);
  private taskData = signal<TaskData[]>([]);
  
  constructor() {
    // 訂閱相關事件，收集財務資料
    this.eventBus.on('contract.activated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.contractData.update(data => [...data, event.data]);
      });
    
    this.eventBus.on('task.completed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.taskData.update(data => [...data, event.data]);
      });
  }
  
  // 基於收集的資料產生報表（不跨模組查詢）
  generateReport(): FinanceReport {
    return {
      contracts: this.contractData(),
      tasks: this.taskData(),
      invoices: this.invoiceRepository.findAll(),
      payments: this.paymentRepository.findAll()
    };
  }
}
```

### 🚫 禁止模式
```typescript
// ❌ 禁止: 直接注入其他模組
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private acceptanceService = inject(AcceptanceService); // ❌ 禁止
  private contractService = inject(ContractService);     // ❌ 禁止
  private taskService = inject(TaskService);             // ❌ 禁止
  
  async generateInvoice(acceptanceId: string) {
    const acceptance = await this.acceptanceService.getById(acceptanceId); // ❌
    const contract = await this.contractService.getById(acceptance.contractId); // ❌
  }
}

// ❌ 禁止: 跨模組 Firestore 查詢
async getContractData(contractId: string) {
  const doc = await getDoc(
    doc(this.firestore, 'contracts', contractId)  // ❌ 跨模組查詢
  );
}
```

### ✅ 正確模式
```typescript
// ✅ 正確: 透過事件訂閱收集資料
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private eventBus = inject(BlueprintEventBusService);
  
  async approveInvoice(invoiceId: string): Promise<void> {
    await this.repository.update(invoiceId, {
      status: 'approved',
      approvedAt: new Date()
    });
    
    // 發送事件
    this.eventBus.emit({
      type: 'invoice.approved',
      blueprintId: this.blueprintContext.currentBlueprint()?.id,
      timestamp: new Date(),
      data: { invoiceId }
    });
  }
}
```

---

## 📋 任務清單

### 初期開發 (SETC-024 ~ 031)

#### SETC-024: Invoice Service Expansion
**檔案**: `SETC-024-invoice-service-expansion.md`  
**目的**: 擴展計價服務基礎功能

#### SETC-025: Invoice Generation Service
**檔案**: `SETC-025-invoice-generation-service.md`  
**目的**: 計價單自動產生服務

#### SETC-026: Invoice Approval Workflow
**檔案**: `SETC-026-invoice-approval-workflow.md`  
**目的**: 計價單審批流程

#### SETC-027: Payment Generation Service
**檔案**: `SETC-027-payment-generation-service.md`  
**目的**: 付款單產生服務

#### SETC-028: Payment Approval Workflow
**檔案**: `SETC-028-payment-approval-workflow.md`  
**目的**: 付款單審批流程

#### SETC-029: Payment Status Tracking
**檔案**: `SETC-029-payment-status-tracking.md`  
**目的**: 付款狀態追蹤

#### SETC-030: Invoice/Payment UI Components
**檔案**: `SETC-030-invoice-payment-ui-components.md`  
**目的**: 計價/付款介面元件

#### SETC-031: Finance Integration Testing
**檔案**: `SETC-031-finance-integration-testing.md`  
**目的**: 財務整合測試

---

### 模組增強 (SETC-062 ~ 069)

#### SETC-062: Finance Module Enhancement Planning
**檔案**: `SETC-062-finance-module-enhancement-planning.md`  
**目的**: 財務模組增強規劃

#### SETC-063: Finance Repository Implementation
**檔案**: `SETC-063-finance-repository-implementation.md`  
**目的**: Repository 層完整實作

#### SETC-064: Invoice Service
**檔案**: `SETC-064-invoice-service.md`  
**目的**: 完整計價服務

#### SETC-065: Payment Service
**檔案**: `SETC-065-payment-service.md`  
**目的**: 完整付款服務

#### SETC-066: Budget Management Service
**檔案**: `SETC-066-budget-management-service.md`  
**目的**: 預算管理服務

#### SETC-067: Ledger & Accounting Service
**檔案**: `SETC-067-ledger-accounting-service.md`  
**目的**: 總帳與會計服務

#### SETC-068: Finance Event Integration
**檔案**: `SETC-068-finance-event-integration.md`  
**目的**: 財務事件整合

#### SETC-069: Finance UI Components & Testing
**檔案**: `SETC-069-finance-ui-components-testing.md`  
**目的**: 完整 UI 與測試

---

## 🏗️ 核心功能

### 計價管理 (Invoice)
- ✅ 自動產生計價單
- ✅ 審批流程管理
- ✅ 計價項目明細
- ✅ 金額計算與追蹤

### 付款管理 (Payment)
- ✅ 付款單產生
- ✅ 審批流程
- ✅ 付款狀態追蹤
- ✅ 付款記錄管理

### 預算管理 (Budget)
- ✅ 預算編列
- ✅ 預算執行追蹤
- ✅ 預算警示
- ✅ 預算報表

### 總帳與會計 (Ledger)
- ✅ 會計科目管理
- ✅ 分錄產生
- ✅ 財務報表
- ✅ 成本中心追蹤

---

## 📊 進度追蹤

### 初期開發 (SETC-024 ~ 031)
| 任務編號 | 任務名稱 | 文檔狀態 | 實作狀態 |
|---------|---------|---------|---------|
| SETC-024 | Expansion | ✅ 完成 | ⏳ 未開始 |
| SETC-025 | Generation | ✅ 完成 | ⏳ 未開始 |
| SETC-026 | Inv Approval | ✅ 完成 | ⏳ 未開始 |
| SETC-027 | Pay Generation | ✅ 完成 | ⏳ 未開始 |
| SETC-028 | Pay Approval | ✅ 完成 | ⏳ 未開始 |
| SETC-029 | Tracking | ✅ 完成 | ⏳ 未開始 |
| SETC-030 | UI | ✅ 完成 | ⏳ 未開始 |
| SETC-031 | Testing | ✅ 完成 | ⏳ 未開始 |

### 模組增強 (SETC-062 ~ 069)
| 任務編號 | 任務名稱 | 文檔狀態 | 實作狀態 |
|---------|---------|---------|---------|
| SETC-062 | Planning | ✅ 完成 | ⏳ 未開始 |
| SETC-063 | Repository | ✅ 完成 | ⏳ 未開始 |
| SETC-064 | Invoice Svc | ✅ 完成 | ⏳ 未開始 |
| SETC-065 | Payment Svc | ✅ 完成 | ⏳ 未開始 |
| SETC-066 | Budget | ✅ 完成 | ⏳ 未開始 |
| SETC-067 | Ledger | ✅ 完成 | ⏳ 未開始 |
| SETC-068 | Events | ✅ 完成 | ⏳ 未開始 |
| SETC-069 | UI & Test | ✅ 完成 | ⏳ 未開始 |

---

## 🔗 相關連結

- **上層目錄**: [返回 discussions](../)
- **Automation**: [30-automation](../30-automation/)
- **Acceptance**: [80-acceptance-module](../80-acceptance-module/)

---

**優先級**: P1 (中高優先級)  
**最後更新**: 2025-12-16  
**任務數**: 16 個  
**狀態**: ✅ 文檔完成
