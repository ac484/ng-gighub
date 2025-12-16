# SETC-024: Invoice Service 擴展規劃

> **任務 ID**: SETC-024  
> **任務名稱**: Invoice Service Expansion Planning  
> **優先級**: P1 (Important)  
> **預估工時**: 1 天  
> **依賴**: SETC-023 (Acceptance → Invoice/Warranty Automation)  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
請款/付款服務擴展架構規劃

### 背景 / 目的
基於 SETC.md 定義的財務階段流程，需要擴展現有的 Finance Module，實作完整的請款與付款功能。本任務為規劃階段，定義架構設計與 API 契約。

### 需求說明
1. 分析現有 Finance Module 架構
2. 設計請款/付款服務擴展方案
3. 定義 Invoice 與 Payment 資料模型
4. 設計審核流程 API 契約
5. 規劃 Firestore Collection 結構

### In Scope / Out of Scope

#### ✅ In Scope
- 架構設計文檔
- API 契約定義
- 資料模型設計
- Firestore Collection 規劃
- 審核流程設計
- 技術可行性評估

#### ❌ Out of Scope
- 實際程式碼實作（SETC-025~030）
- UI 元件設計（SETC-030）
- 測試撰寫（SETC-031）

### 功能行為
提供完整的請款/付款服務擴展規劃，作為後續實作的藍圖。

### 資料 / API

#### Invoice 資料模型

```typescript
/**
 * 請款單/付款單資料模型
 */
export interface Invoice {
  id: string;
  blueprintId: string;
  invoiceNumber: string;
  
  // 類型: receivable=應收(向業主請款), payable=應付(付款給承商)
  invoiceType: 'receivable' | 'payable';
  
  // 關聯
  contractId: string;
  acceptanceId?: string;
  taskIds: string[];
  
  // 請款項目
  invoiceItems: InvoiceItem[];
  
  // 金額計算
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  
  // 請款百分比
  billingPercentage: number;
  
  // 雙方資訊
  billingParty: PartyInfo;    // 開票方
  payingParty: PartyInfo;     // 付款方
  
  // 狀態
  status: InvoiceStatus;
  
  // 審核流程
  approvalWorkflow: ApprovalWorkflow;
  
  // 付款資訊
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  
  // 備註
  notes?: string;
  attachments: FileAttachment[];
  
  // 審計欄位
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export type InvoiceStatus = 
  | 'draft'          // 草稿
  | 'submitted'      // 已送出
  | 'under_review'   // 審核中
  | 'approved'       // 已核准
  | 'rejected'       // 已退回
  | 'invoiced'       // 已開票
  | 'partial_paid'   // 部分付款
  | 'paid'           // 已付款
  | 'cancelled';     // 已取消

export interface InvoiceItem {
  id: string;
  contractWorkItemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  completionPercentage: number;
  previousBilled: number;
  currentBilling: number;
}

export interface PartyInfo {
  id: string;
  name: string;
  taxId: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bankAccount?: BankAccount;
}

export interface BankAccount {
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountName: string;
}

export interface ApprovalWorkflow {
  currentStep: number;
  totalSteps: number;
  approvers: Approver[];
  history: ApprovalHistory[];
}

export interface Approver {
  stepNumber: number;
  userId: string;
  userName: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedAt?: Date;
  comments?: string;
}

export interface ApprovalHistory {
  stepNumber: number;
  action: 'submit' | 'approve' | 'reject' | 'return';
  userId: string;
  userName: string;
  timestamp: Date;
  comments?: string;
  previousStatus: InvoiceStatus;
  newStatus: InvoiceStatus;
}

export type PaymentMethod = 
  | 'bank_transfer'
  | 'check'
  | 'cash'
  | 'credit_card';
```

#### Invoice Service API 契約

```typescript
export interface IInvoiceService {
  // CRUD 操作
  create(invoice: CreateInvoiceDto): Promise<Invoice>;
  update(id: string, invoice: UpdateInvoiceDto): Promise<Invoice>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Invoice | null>;
  getByBlueprintId(blueprintId: string): Promise<Invoice[]>;
  
  // 自動生成
  autoGenerateFromAcceptance(acceptanceId: string): Promise<Invoice>;
  autoGenerateReceivable(data: GenerateInvoiceData): Promise<Invoice>;
  autoGeneratePayable(data: GenerateInvoiceData): Promise<Invoice>;
  
  // 狀態管理
  submit(id: string): Promise<Invoice>;
  approve(id: string, comments?: string): Promise<Invoice>;
  reject(id: string, reason: string): Promise<Invoice>;
  markAsInvoiced(id: string, invoiceInfo: InvoiceInfo): Promise<Invoice>;
  markAsPaid(id: string, paymentInfo: PaymentInfo): Promise<Invoice>;
  cancel(id: string, reason: string): Promise<Invoice>;
  
  // 查詢
  getPendingApproval(userId: string): Promise<Invoice[]>;
  getByStatus(blueprintId: string, status: InvoiceStatus): Promise<Invoice[]>;
  getByDateRange(blueprintId: string, start: Date, end: Date): Promise<Invoice[]>;
  
  // 統計
  getSummary(blueprintId: string): Promise<InvoiceSummary>;
}
```

#### Firestore Collection 設計

```
blueprints/{blueprintId}/invoices/{invoiceId}
├── ... (Invoice document fields)
└── approvalHistory/{historyId}  (Subcollection for audit trail)
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/` - Finance Module
- `src/app/core/blueprint/events/` - 事件類型新增
- Firestore Security Rules - 新增 invoices Collection 規則

### 驗收條件
1. ✅ 架構設計文檔完成
2. ✅ API 契約定義完整
3. ✅ 資料模型設計通過技術審查
4. ✅ Firestore Collection 結構確認
5. ✅ 審核流程設計合理

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Firebase/Firestore 最佳實踐

**查詢重點**:
- Firestore Subcollection vs Embedded Documents
- Firestore Security Rules 進階模式
- 審核流程資料模型設計

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **現有 Finance Module 評估**
   - 檢視現有架構與功能
   - 識別可重用的元件
   - 評估擴展可行性

2. **請款/付款流程設計**
   - 草稿 → 送出 → 審核 → 開票 → 付款
   - 多級審核機制
   - 退回補件流程

3. **資料模型設計**
   - Invoice 主文件結構
   - 審核歷史記錄策略
   - 與 Contract/Task 關聯

4. **安全性考量**
   - 金額修改權限
   - 審核狀態轉換規則
   - 資料驗證規則

### 步驟 3: Software Planning Tool

**開發計畫概覽**:
```
SETC-024: 規劃 (1 day)
├── 架構設計
├── API 契約
└── 資料模型

SETC-025: 請款生成服務 (3 days)
SETC-026: 請款審核流程 (3 days)
SETC-027: 付款生成服務 (3 days)
SETC-028: 付款審核流程 (3 days)
SETC-029: 狀態追蹤服務 (2 days)
SETC-030: UI 元件 (3 days)
SETC-031: 測試整合 (2 days)
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 架構分析 (2 hours)
- 分析現有 Finance Module
- 識別需要擴展的服務
- 確認技術選型

#### Phase 2: 資料模型設計 (4 hours)
- 定義 Invoice 介面
- 定義 ApprovalWorkflow 介面
- 設計 Firestore Collection

#### Phase 3: API 契約定義 (2 hours)
- 定義 IInvoiceService 介面
- 定義 DTO 結構
- 定義事件類型

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/models/invoice.model.ts`
- `src/app/core/blueprint/modules/implementations/finance/models/approval-workflow.model.ts`
- `docs/discussions/SETC-024-invoice-service-expansion.md` (本文件)

**修改檔案**:
- 無（本任務為規劃）

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 Firestore 最佳實踐
- ✅ 使用 Sequential Thinking 分析審核流程
- ✅ 使用 Software Planning Tool 制定後續任務
- ✅ 基於奧卡姆剃刀定律 (KISS, YAGNI, MVP)
- ✅ 事件命名遵循 `[module].[action]` 格式

### 設計原則
- ✅ 請款與付款使用相同資料結構（invoiceType 區分）
- ✅ 審核流程支援多級審核
- ✅ 所有狀態變更記錄歷史
- ✅ 金額計算邏輯可配置

---

## ✅ 檢查清單

### 架構檢查
- [x] 遵循三層架構原則
- [x] 與現有 Finance Module 整合可行
- [x] 資料模型設計完整

### 文檔檢查
- [x] 架構設計文檔完整
- [x] API 契約定義明確
- [x] 資料模型說明清楚
- [x] 後續任務規劃完成

---

## 📝 實作總結

### 實作內容

1. **Invoice 資料模型** (`invoice.model.ts`)
   - `Invoice` 主介面：完整的請款單/付款單資料結構
   - `InvoiceItem` 請款項目
   - `PartyInfo` 請款/付款方資訊
   - `BankAccount` 銀行帳戶資訊
   - `FileAttachment` 附件
   - `ApprovalWorkflow` 審核流程
   - `Approver` 審核者
   - `ApprovalHistory` 審核歷史
   - DTOs: `CreateInvoiceDto`, `UpdateInvoiceDto`, `GenerateInvoiceData`, etc.

2. **Invoice Service 介面** (`invoice-service.interface.ts`)
   - CRUD 操作
   - 自動生成（從驗收）
   - 狀態管理（審核流程）
   - 查詢與統計
   - 工具方法
   - 狀態轉換映射 (`VALID_STATUS_TRANSITIONS`)
   - 狀態顯示名稱 (`INVOICE_STATUS_LABELS`)
   - 狀態顏色 (`INVOICE_STATUS_COLORS`)

### 新增檔案

- `src/app/core/blueprint/modules/implementations/finance/models/invoice.model.ts`
- `src/app/core/blueprint/modules/implementations/finance/models/invoice-service.interface.ts`

### 修改檔案

- `src/app/core/blueprint/modules/implementations/finance/models/index.ts`

### 下一步

SETC-025: Invoice Generation Service - 請款生成服務實作
