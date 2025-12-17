# SETC-065: Payment Service

> **任務編號**: SETC-065  
> **模組**: Finance Module (財務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-064  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作付款服務，管理付款作業、付款追蹤和付款記錄，支援部分付款和多次付款。

### 範圍
- 付款記錄建立
- 付款狀態追蹤
- 部分付款處理
- 付款歷史查詢
- 與請款單連動

---

## 🏗️ 技術實作

### 服務介面

```typescript
import { Observable } from 'rxjs';

export interface IPaymentService {
  // 付款操作
  createPayment(data: CreatePaymentInput): Promise<Payment>;
  processPayment(id: string): Promise<Payment>;
  cancelPayment(id: string, reason: string): Promise<Payment>;
  
  // 自動付款（從核准的請款單）
  autoProcessFromApprovedInvoice(invoiceId: string): Promise<Payment>;
  
  // 查詢
  getPayment(id: string): Promise<Payment | null>;
  getPaymentsByInvoice(invoiceId: string): Observable<Payment[]>;
  getPaymentsByBlueprint(blueprintId: string, filters?: PaymentFilters): Observable<Payment[]>;
  getPendingPayments(blueprintId: string): Observable<Payment[]>;
  
  // 統計
  getPaymentSummary(blueprintId: string): Promise<PaymentSummary>;
  getPaymentsByPeriod(blueprintId: string, startDate: Date, endDate: Date): Promise<Payment[]>;
}

export interface CreatePaymentInput {
  blueprintId: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  blueprintId: string;
  invoiceId: string;
  paymentNumber: string;
  
  // 付款資訊
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  
  // 狀態
  status: PaymentStatus;
  processedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  
  // 參考
  reference?: string;
  bankAccount?: string;
  transactionId?: string;
  notes?: string;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 
  | 'bank_transfer'
  | 'check'
  | 'cash'
  | 'credit_card'
  | 'other';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PaymentSummary {
  blueprintId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentRate: number;
}
```

### 服務實作

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRepository } from '../repositories/payment.repository';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  IPaymentService,
  Payment,
  CreatePaymentInput,
  PaymentSummary
} from './payment.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService implements IPaymentService {
  private repository = inject(PaymentRepository);
  private invoiceRepo = inject(InvoiceRepository);
  private eventBus = inject(IEventBus);

  /**
   * 建立付款記錄
   */
  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    // 驗證請款單
    const invoice = await this.invoiceRepo.findById(data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${data.invoiceId} not found`);
    }
    
    if (invoice.status !== 'approved') {
      throw new Error(`Invoice must be approved before payment`);
    }
    
    // 驗證付款金額
    if (data.amount > invoice.unpaidAmount) {
      throw new Error(`Payment amount exceeds unpaid amount`);
    }
    
    const paymentNumber = await this.generatePaymentNumber(data.blueprintId);
    
    const payment = await this.repository.create({
      ...data,
      paymentNumber,
      status: 'pending'
    });
    
    this.eventBus.emit('payment.created', {
      paymentId: payment.id,
      invoiceId: data.invoiceId,
      amount: data.amount,
      timestamp: new Date()
    });
    
    return payment;
  }

  /**
   * 處理付款
   */
  async processPayment(id: string): Promise<Payment> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    
    if (payment.status !== 'pending') {
      throw new Error(`Cannot process payment in status: ${payment.status}`);
    }
    
    // 更新付款狀態
    const updated = await this.repository.update(id, {
      status: 'completed',
      processedAt: new Date()
    });
    
    // 更新請款單付款狀態
    await this.updateInvoicePaymentStatus(payment.invoiceId, payment.amount);
    
    this.eventBus.emit('payment.processed', {
      paymentId: id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      timestamp: new Date()
    });
    
    return updated;
  }

  /**
   * 從核准請款單自動處理付款
   */
  async autoProcessFromApprovedInvoice(invoiceId: string): Promise<Payment> {
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    if (invoice.status !== 'approved') {
      throw new Error(`Invoice is not approved`);
    }
    
    // 建立並處理付款
    const payment = await this.createPayment({
      blueprintId: invoice.blueprintId,
      invoiceId: invoice.id,
      paymentMethod: 'bank_transfer',
      amount: invoice.unpaidAmount,
      paymentDate: new Date(),
      notes: '自動付款',
      createdBy: 'system'
    });
    
    return this.processPayment(payment.id);
  }

  /**
   * 取消付款
   */
  async cancelPayment(id: string, reason: string): Promise<Payment> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    
    if (payment.status === 'completed') {
      throw new Error(`Cannot cancel completed payment`);
    }
    
    const updated = await this.repository.update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason
    });
    
    this.eventBus.emit('payment.cancelled', {
      paymentId: id,
      invoiceId: payment.invoiceId,
      reason,
      timestamp: new Date()
    });
    
    return updated;
  }

  /**
   * 取得付款摘要
   */
  async getPaymentSummary(blueprintId: string): Promise<PaymentSummary> {
    const invoices = await this.invoiceRepo.findByBlueprint(blueprintId);
    
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices
      .filter(inv => inv.status === 'approved' && inv.unpaidAmount > 0)
      .reduce((sum, inv) => sum + inv.unpaidAmount, 0);
    
    // 計算逾期金額
    const now = new Date();
    const totalOverdue = invoices
      .filter(inv => 
        inv.status === 'approved' && 
        inv.unpaidAmount > 0 && 
        inv.dueDate && 
        new Date(inv.dueDate) < now
      )
      .reduce((sum, inv) => sum + inv.unpaidAmount, 0);
    
    const paymentRate = totalInvoiced > 0 
      ? Math.round((totalPaid / totalInvoiced) * 100) 
      : 0;
    
    return {
      blueprintId,
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      paymentRate
    };
  }

  // ============ Private Methods ============

  private async generatePaymentNumber(blueprintId: string): Promise<string> {
    const payments = await this.repository.findByBlueprint(blueprintId);
    const count = payments.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `PAY-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  private async updateInvoicePaymentStatus(invoiceId: string, paidAmount: number): Promise<void> {
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) return;
    
    const newPaidAmount = invoice.paidAmount + paidAmount;
    const newUnpaidAmount = invoice.totalAmount - newPaidAmount;
    
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (newUnpaidAmount <= 0) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }
    
    await this.invoiceRepo.update(invoiceId, {
      paidAmount: newPaidAmount,
      unpaidAmount: Math.max(0, newUnpaidAmount),
      paymentStatus,
      status: paymentStatus === 'paid' ? 'paid' : invoice.status
    });
  }
}
```

---

## ✅ 交付物

- [ ] `payment.service.ts`
- [ ] `payment.interface.ts`
- [ ] `payment.service.spec.ts`
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 付款記錄建立正確
2. ✅ 付款處理流程完整
3. ✅ 部分付款處理正確
4. ✅ 請款單狀態連動
5. ✅ 付款摘要計算正確
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
