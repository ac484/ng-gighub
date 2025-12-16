# SETC-026: Invoice Approval Workflow

> **任務 ID**: SETC-026  
> **任務名稱**: Invoice Approval Workflow Implementation  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-025 (Invoice Generation Service)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
請款審核工作流程實作

### 背景 / 目的
實作請款審核工作流程，支援多級審核、退回補件、審核歷史記錄。根據 SETC.md 定義：草稿 → 送出 → 審核 → 開票 → 收/付款。

### 需求說明
1. 實作 InvoiceApprovalService
2. 支援多級審核機制
3. 實作退回補件流程
4. 記錄完整審核歷史
5. 狀態機管理
6. 通知機制整合

### In Scope / Out of Scope

#### ✅ In Scope
- InvoiceApprovalService 實作
- 多級審核機制
- 退回補件流程
- 審核歷史記錄
- 狀態機實作
- 事件通知
- 單元測試

#### ❌ Out of Scope
- 請款單生成（SETC-025）
- 付款流程（SETC-027~028）
- UI 元件（SETC-030）

### 功能行為
管理請款單的完整審核流程，從送出到核准或退回。

### 資料 / API

#### InvoiceApprovalService API

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceApprovalService {
  private invoiceRepository = inject(InvoiceRepository);
  private eventBus = inject(BlueprintEventBusService);
  private permissionService = inject(PermissionService);

  /**
   * 送出請款單進行審核
   */
  async submit(invoiceId: string, actor: EventActor): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    
    this.validateStatusTransition(invoice.status, 'submitted');
    this.validateInvoiceData(invoice);
    
    const updatedInvoice = await this.updateInvoiceStatus(
      invoice,
      'submitted',
      actor
    );
    
    this.eventBus.emit({
      type: SystemEventType.INVOICE_SUBMITTED,
      blueprintId: invoice.blueprintId,
      timestamp: new Date(),
      actor,
      data: { invoiceId, previousStatus: invoice.status }
    });
    
    return updatedInvoice;
  }

  /**
   * 核准請款單
   */
  async approve(
    invoiceId: string,
    actor: EventActor,
    comments?: string
  ): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    
    // 驗證審核權限
    await this.validateApprovalPermission(invoice, actor);
    
    // 更新審核步驟
    const workflow = this.updateApprovalStep(
      invoice.approvalWorkflow,
      actor,
      'approved',
      comments
    );
    
    // 判斷是否所有審核通過
    const isFullyApproved = workflow.currentStep >= workflow.totalSteps;
    const newStatus: InvoiceStatus = isFullyApproved ? 'approved' : 'under_review';
    
    const updatedInvoice = await this.invoiceRepository.update(
      invoice.blueprintId,
      invoiceId,
      {
        status: newStatus,
        approvalWorkflow: workflow,
        updatedBy: actor.userId,
        updatedAt: new Date()
      }
    );
    
    this.eventBus.emit({
      type: SystemEventType.INVOICE_APPROVED,
      blueprintId: invoice.blueprintId,
      timestamp: new Date(),
      actor,
      data: { invoiceId, isFullyApproved, step: workflow.currentStep }
    });
    
    return updatedInvoice;
  }

  /**
   * 退回請款單
   */
  async reject(
    invoiceId: string,
    actor: EventActor,
    reason: string
  ): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    
    await this.validateApprovalPermission(invoice, actor);
    
    const workflow = this.updateApprovalStep(
      invoice.approvalWorkflow,
      actor,
      'rejected',
      reason
    );
    
    const updatedInvoice = await this.invoiceRepository.update(
      invoice.blueprintId,
      invoiceId,
      {
        status: 'rejected',
        approvalWorkflow: workflow,
        updatedBy: actor.userId
      }
    );
    
    this.eventBus.emit({
      type: SystemEventType.INVOICE_REJECTED,
      blueprintId: invoice.blueprintId,
      timestamp: new Date(),
      actor,
      data: { invoiceId, reason }
    });
    
    return updatedInvoice;
  }

  /**
   * 取得待審核清單
   */
  async getPendingApproval(
    blueprintId: string,
    userId: string
  ): Promise<Invoice[]> {
    const invoices = await this.invoiceRepository.getByStatus(
      blueprintId,
      ['submitted', 'under_review']
    );
    
    return invoices.filter(invoice =>
      this.isApproverForCurrentStep(invoice.approvalWorkflow, userId)
    );
  }
}
```

#### 狀態機定義

```typescript
export const InvoiceStatusMachine = {
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

export function validateStatusTransition(
  currentStatus: InvoiceStatus,
  newStatus: InvoiceStatus
): void {
  const allowedTransitions = InvoiceStatusMachine[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}`
    );
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/services/` - 審核服務
- `src/app/core/blueprint/events/` - 事件類型

### 驗收條件
1. ✅ 多級審核流程正常運作
2. ✅ 退回補件機制完整
3. ✅ 審核歷史正確記錄
4. ✅ 狀態機轉換規則正確
5. ✅ 權限驗證完整
6. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢狀態機與工作流程設計模式

**查詢重點**:
- 狀態機實作模式
- 審核流程最佳實踐
- 並發控制

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **審核流程設計**
   - 單級 vs 多級審核
   - 並行 vs 串行審核
   - 緊急審核處理

2. **狀態轉換規則**
   - 有效的狀態轉換
   - 轉換前置條件
   - 轉換後處理

3. **權限控制**
   - 誰可以送出
   - 誰可以審核
   - 審核層級設定

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 狀態機設計與實作
├── 審核服務骨架
└── 權限驗證邏輯

Day 2 (8 hours):
├── 多級審核實作
├── 退回補件流程
└── 審核歷史記錄

Day 3 (8 hours):
├── 事件整合
├── 單元測試
└── 整合測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 狀態機 (Day 1)

**檔案**: `src/app/core/blueprint/modules/implementations/finance/models/invoice-status-machine.ts`

```typescript
export class InvoiceStateMachine {
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

  static getAvailableTransitions(status: InvoiceStatus): InvoiceStatus[] {
    return this.transitions[status] ?? [];
  }

  static validateTransition(from: InvoiceStatus, to: InvoiceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvoiceStatusError(
        `Invalid status transition: ${from} → ${to}`,
        { from, to, allowed: this.transitions[from] }
      );
    }
  }
}
```

#### Phase 2: 審核服務 (Day 2)

**檔案**: `src/app/core/blueprint/modules/implementations/finance/services/invoice-approval.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class InvoiceApprovalService {
  // 完整實作如 API 定義
  
  private updateApprovalStep(
    workflow: ApprovalWorkflow,
    actor: EventActor,
    status: 'approved' | 'rejected',
    comments?: string
  ): ApprovalWorkflow {
    const currentStep = workflow.currentStep;
    const approver = workflow.approvers.find(a => a.stepNumber === currentStep);
    
    if (approver) {
      approver.status = status;
      approver.approvedAt = new Date();
      approver.comments = comments;
    }
    
    workflow.history.push({
      stepNumber: currentStep,
      action: status === 'approved' ? 'approve' : 'reject',
      userId: actor.userId,
      userName: actor.userName,
      timestamp: new Date(),
      comments,
      previousStatus: 'under_review' as InvoiceStatus,
      newStatus: status === 'approved' ? 'approved' : 'rejected'
    });
    
    if (status === 'approved') {
      workflow.currentStep++;
    }
    
    return workflow;
  }
  
  private isApproverForCurrentStep(
    workflow: ApprovalWorkflow,
    userId: string
  ): boolean {
    const currentApprover = workflow.approvers.find(
      a => a.stepNumber === workflow.currentStep
    );
    return currentApprover?.userId === userId;
  }
}
```

#### Phase 3: 測試 (Day 3)

**檔案**: `invoice-approval.service.spec.ts`

```typescript
describe('InvoiceApprovalService', () => {
  it('should submit invoice for approval', async () => {
    // Test implementation
  });

  it('should approve invoice and move to next step', async () => {
    // Test implementation
  });

  it('should reject invoice and record reason', async () => {
    // Test implementation
  });

  it('should validate approval permission', async () => {
    // Test implementation
  });

  it('should throw on invalid status transition', async () => {
    // Test implementation
  });
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/models/invoice-status-machine.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice-approval.service.ts`
- `src/app/core/blueprint/modules/implementations/finance/services/invoice-approval.service.spec.ts`

**修改檔案**:
- `src/app/core/blueprint/modules/implementations/finance/index.ts`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用狀態機管理狀態轉換
- ✅ 所有審核操作記錄歷史
- ✅ 權限檢查在服務層實作
- ✅ 事件驅動通知

### Angular 20 規範
- ✅ 使用 inject() 注入依賴
- ✅ 錯誤處理完整
- ✅ 類型安全

---

## ✅ 檢查清單

### 架構檢查
- [ ] 狀態機設計合理
- [ ] 權限控制完整
- [ ] 事件整合正確

### 功能檢查
- [ ] 多級審核運作正常
- [ ] 退回補件流程完整
- [ ] 歷史記錄準確

### 測試檢查
- [ ] 狀態轉換測試
- [ ] 權限驗證測試
- [ ] 邊界情況測試
