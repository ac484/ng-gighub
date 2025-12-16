# SETC-063: Finance Repository Implementation

> **任務編號**: SETC-063  
> **模組**: Finance Module (財務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-062  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作 Finance Module 的 Firestore Repository 層，支援請款、付款、預算和帳務的完整 CRUD 操作。

### 範圍
- InvoiceRepository
- PaymentRepository
- BudgetRepository
- LedgerRepository
- Firestore Security Rules

---

## 🏗️ 技術實作

### 請款 (Invoice) Repository

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Invoice, CreateInvoiceData, InvoiceFilters, InvoiceStatus } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceRepository {
  private firestore = inject(Firestore);
  private readonly collectionName = 'invoices';

  async create(data: CreateInvoiceData): Promise<Invoice> {
    const col = collection(this.firestore, this.collectionName);
    
    const invoiceNumber = await this.generateInvoiceNumber(data.blueprintId);
    
    const invoiceData = {
      ...data,
      invoiceNumber,
      status: 'draft' as InvoiceStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(col, invoiceData);
    
    return {
      id: docRef.id,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Invoice;
  }

  async findById(id: string): Promise<Invoice | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    return this.convertToModel(snapshot.id, snapshot.data());
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    const updated = await this.findById(id);
    if (!updated) throw new Error(`Invoice ${id} not found`);
    return updated;
  }

  async findByBlueprint(
    blueprintId: string, 
    filters?: InvoiceFilters
  ): Promise<Invoice[]> {
    const col = collection(this.firestore, this.collectionName);
    
    let q = query(
      col,
      where('blueprintId', '==', blueprintId),
      orderBy('createdAt', 'desc')
    );
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertToModel(doc.id, doc.data()));
  }

  watchByBlueprint(blueprintId: string): Observable<Invoice[]> {
    return new Observable(subscriber => {
      const col = collection(this.firestore, this.collectionName);
      const q = query(
        col,
        where('blueprintId', '==', blueprintId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const invoices = snapshot.docs.map(doc => 
            this.convertToModel(doc.id, doc.data())
          );
          subscriber.next(invoices);
        },
        (error) => subscriber.error(error)
      );
      
      return () => unsubscribe();
    });
  }

  private async generateInvoiceNumber(blueprintId: string): Promise<string> {
    const invoices = await this.findByBlueprint(blueprintId);
    const count = invoices.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  private convertToModel(id: string, data: any): Invoice {
    return {
      id,
      ...data,
      invoiceDate: data.invoiceDate instanceof Timestamp 
        ? data.invoiceDate.toDate() 
        : new Date(data.invoiceDate),
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : new Date(data.updatedAt)
    } as Invoice;
  }
}
```

### 資料模型定義

```typescript
// Invoice Model
export interface Invoice {
  id: string;
  blueprintId: string;
  invoiceNumber: string;
  
  // 來源
  acceptanceId?: string;
  contractId?: string;
  
  // 請款資訊
  title: string;
  description?: string;
  invoiceDate: Date;
  dueDate?: Date;
  
  // 金額
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  deductions: InvoiceDeduction[];
  totalDeductions: number;
  totalAmount: number;
  
  // 明細
  lineItems: InvoiceLineItem[];
  
  // 狀態
  status: InvoiceStatus;
  
  // 審核
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // 付款
  paidAmount: number;
  unpaidAmount: number;
  paymentStatus: PaymentStatus;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export type PaymentStatus = 
  | 'unpaid'
  | 'partial'
  | 'paid';

export interface InvoiceLineItem {
  id: string;
  workItemId?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDeduction {
  id: string;
  type: DeductionType;
  description: string;
  amount: number;
  percentage?: number;
}

export type DeductionType = 
  | 'retention'
  | 'penalty'
  | 'defect_repair'
  | 'other';
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Invoices Collection
    match /invoices/{invoiceId} {
      allow read: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId);
      
      allow create: if request.auth != null && 
        isBlueprintMember(request.resource.data.blueprintId) &&
        hasFinancePermission('invoice:create');
      
      allow update: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId) &&
        hasFinancePermission('invoice:edit');
    }
    
    // Payments Collection
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        hasFinancePermission('payment:manage');
    }
    
    // Budgets Collection
    match /budgets/{budgetId} {
      allow read: if request.auth != null && 
        isBlueprintMember(resource.data.blueprintId);
      allow create, update: if request.auth != null && 
        hasFinancePermission('budget:manage');
    }
    
    // Ledger Entries Collection
    match /ledger_entries/{entryId} {
      allow read: if request.auth != null && 
        hasFinancePermission('ledger:read');
      allow create: if request.auth != null && 
        hasFinancePermission('ledger:write');
      // 帳務記錄不可修改或刪除
      allow update, delete: if false;
    }
    
    function hasFinancePermission(permission) {
      return request.auth.token.permissions[permission] == true;
    }
  }
}
```

---

## ✅ 交付物

- [ ] `invoice.repository.ts`
- [ ] `payment.repository.ts`
- [ ] `budget.repository.ts`
- [ ] `ledger.repository.ts`
- [ ] 資料模型定義
- [ ] Firestore Security Rules
- [ ] 單元測試

---

## 🎯 驗收標準

1. ✅ 所有 Repository 方法正確實作
2. ✅ 金額計算精確
3. ✅ 即時訂閱功能正常
4. ✅ Security Rules 測試通過
5. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
