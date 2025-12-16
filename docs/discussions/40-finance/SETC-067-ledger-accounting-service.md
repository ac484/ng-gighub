# SETC-067: Ledger & Accounting Service

> **任務編號**: SETC-067  
> **模組**: Finance Module (財務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-065  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作帳務服務，管理會計分錄記錄、帳務查詢和財務結算。

### 範圍
- 會計分錄記錄
- 帳務查詢
- 財務結算
- 帳務報表
- 審計追蹤

---

## 🏗️ 技術實作

### 服務介面

```typescript
import { Observable } from 'rxjs';

export interface ILedgerService {
  // 分錄記錄
  createEntry(data: CreateLedgerEntryInput): Promise<LedgerEntry>;
  
  // 自動分錄（從請款、付款事件）
  autoRecordFromInvoice(invoiceData: InvoiceEventData): Promise<LedgerEntry>;
  autoRecordFromPayment(paymentData: PaymentEventData): Promise<LedgerEntry>;
  
  // 查詢
  getEntry(id: string): Promise<LedgerEntry | null>;
  getEntriesByBlueprint(blueprintId: string, filters?: LedgerFilters): Observable<LedgerEntry[]>;
  getEntriesByAccount(accountCode: string): Promise<LedgerEntry[]>;
  getEntriesByPeriod(blueprintId: string, startDate: Date, endDate: Date): Promise<LedgerEntry[]>;
  
  // 餘額
  getAccountBalance(blueprintId: string, accountCode: string): Promise<AccountBalance>;
  getTrialBalance(blueprintId: string, asOfDate: Date): Promise<TrialBalance>;
  
  // 結算
  performPeriodClose(blueprintId: string, periodEnd: Date): Promise<PeriodCloseResult>;
  
  // 報表
  generateIncomeStatement(blueprintId: string, startDate: Date, endDate: Date): Promise<IncomeStatement>;
  generateBalanceSheet(blueprintId: string, asOfDate: Date): Promise<BalanceSheet>;
}

export interface LedgerEntry {
  id: string;
  blueprintId: string;
  entryNumber: string;
  
  // 分錄資訊
  entryDate: Date;
  description: string;
  reference?: string;
  
  // 來源
  sourceType: LedgerSourceType;
  sourceId?: string;
  
  // 借貸
  lines: LedgerLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  
  // 狀態
  status: LedgerEntryStatus;
  postedAt?: Date;
  
  // 期間
  fiscalYear: number;
  fiscalPeriod: number;
  
  // 審計
  createdBy: string;
  createdAt: Date;
}

export interface LedgerLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export type LedgerSourceType = 
  | 'invoice'
  | 'payment'
  | 'adjustment'
  | 'closing'
  | 'manual';

export type LedgerEntryStatus = 
  | 'draft'
  | 'posted'
  | 'reversed';

export interface AccountBalance {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  asOfDate: Date;
}

export interface TrialBalance {
  blueprintId: string;
  asOfDate: Date;
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}
```

### 服務實作

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LedgerRepository } from '../repositories/ledger.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  ILedgerService,
  LedgerEntry,
  CreateLedgerEntryInput,
  AccountBalance,
  TrialBalance
} from './ledger.interface';

@Injectable({ providedIn: 'root' })
export class LedgerService implements ILedgerService {
  private repository = inject(LedgerRepository);
  private eventBus = inject(IEventBus);

  // 預設會計科目
  private readonly ACCOUNTS = {
    ACCOUNTS_RECEIVABLE: '1131',    // 應收帳款
    ACCOUNTS_PAYABLE: '2141',       // 應付帳款
    REVENUE: '4100',                // 營業收入
    CASH: '1111',                   // 現金
    BANK: '1121',                   // 銀行存款
    RETENTION_PAYABLE: '2191'       // 應付保留款
  };

  /**
   * 建立分錄
   */
  async createEntry(data: CreateLedgerEntryInput): Promise<LedgerEntry> {
    // 驗證借貸平衡
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Entry is not balanced: debits must equal credits');
    }
    
    const entryNumber = await this.generateEntryNumber(data.blueprintId);
    const fiscalInfo = this.getFiscalPeriod(data.entryDate);
    
    const entry = await this.repository.create({
      ...data,
      entryNumber,
      totalDebit,
      totalCredit,
      isBalanced: true,
      status: 'posted',
      postedAt: new Date(),
      fiscalYear: fiscalInfo.year,
      fiscalPeriod: fiscalInfo.period
    });
    
    this.eventBus.emit('ledger.entry_created', {
      entryId: entry.id,
      entryNumber: entry.entryNumber,
      blueprintId: entry.blueprintId,
      amount: totalDebit,
      timestamp: new Date()
    });
    
    return entry;
  }

  /**
   * 從請款自動建立分錄
   */
  async autoRecordFromInvoice(invoiceData: InvoiceEventData): Promise<LedgerEntry> {
    console.log('[LedgerService] Recording invoice:', invoiceData.invoiceId);
    
    const lines: LedgerLine[] = [
      {
        id: 'line-1',
        accountCode: this.ACCOUNTS.ACCOUNTS_RECEIVABLE,
        accountName: '應收帳款',
        debit: invoiceData.totalAmount,
        credit: 0,
        description: `請款 ${invoiceData.invoiceNumber}`
      },
      {
        id: 'line-2',
        accountCode: this.ACCOUNTS.REVENUE,
        accountName: '營業收入',
        debit: 0,
        credit: invoiceData.subtotal,
        description: `請款收入`
      }
    ];
    
    // 如果有保留款，記錄到應付保留款
    if (invoiceData.retainageAmount && invoiceData.retainageAmount > 0) {
      lines.push({
        id: 'line-3',
        accountCode: this.ACCOUNTS.RETENTION_PAYABLE,
        accountName: '應付保留款',
        debit: 0,
        credit: invoiceData.retainageAmount,
        description: '保留款'
      });
    }
    
    return this.createEntry({
      blueprintId: invoiceData.blueprintId,
      entryDate: new Date(),
      description: `請款 ${invoiceData.invoiceNumber}`,
      sourceType: 'invoice',
      sourceId: invoiceData.invoiceId,
      lines,
      createdBy: 'system'
    });
  }

  /**
   * 從付款自動建立分錄
   */
  async autoRecordFromPayment(paymentData: PaymentEventData): Promise<LedgerEntry> {
    console.log('[LedgerService] Recording payment:', paymentData.paymentId);
    
    const lines: LedgerLine[] = [
      {
        id: 'line-1',
        accountCode: this.ACCOUNTS.BANK,
        accountName: '銀行存款',
        debit: paymentData.amount,
        credit: 0,
        description: `收款 ${paymentData.paymentNumber}`
      },
      {
        id: 'line-2',
        accountCode: this.ACCOUNTS.ACCOUNTS_RECEIVABLE,
        accountName: '應收帳款',
        debit: 0,
        credit: paymentData.amount,
        description: `沖銷應收帳款`
      }
    ];
    
    return this.createEntry({
      blueprintId: paymentData.blueprintId,
      entryDate: paymentData.paymentDate,
      description: `收款 ${paymentData.paymentNumber}`,
      sourceType: 'payment',
      sourceId: paymentData.paymentId,
      lines,
      createdBy: 'system'
    });
  }

  /**
   * 取得科目餘額
   */
  async getAccountBalance(
    blueprintId: string, 
    accountCode: string
  ): Promise<AccountBalance> {
    const entries = await this.repository.findByBlueprint(blueprintId);
    
    let debitBalance = 0;
    let creditBalance = 0;
    let accountName = '';
    
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.accountCode === accountCode) {
          accountName = line.accountName;
          debitBalance += line.debit;
          creditBalance += line.credit;
        }
      }
    }
    
    return {
      accountCode,
      accountName,
      debitBalance,
      creditBalance,
      netBalance: debitBalance - creditBalance,
      asOfDate: new Date()
    };
  }

  /**
   * 取得試算表
   */
  async getTrialBalance(blueprintId: string, asOfDate: Date): Promise<TrialBalance> {
    const entries = await this.repository.findByBlueprint(blueprintId, {
      endDate: asOfDate
    });
    
    const accountBalances = new Map<string, { 
      name: string; 
      debit: number; 
      credit: number 
    }>();
    
    for (const entry of entries) {
      for (const line of entry.lines) {
        const existing = accountBalances.get(line.accountCode) || {
          name: line.accountName,
          debit: 0,
          credit: 0
        };
        existing.debit += line.debit;
        existing.credit += line.credit;
        accountBalances.set(line.accountCode, existing);
      }
    }
    
    const accounts: AccountBalance[] = Array.from(accountBalances.entries())
      .map(([code, balance]) => ({
        accountCode: code,
        accountName: balance.name,
        debitBalance: balance.debit,
        creditBalance: balance.credit,
        netBalance: balance.debit - balance.credit,
        asOfDate
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    
    const totalDebits = accounts.reduce((sum, a) => sum + a.debitBalance, 0);
    const totalCredits = accounts.reduce((sum, a) => sum + a.creditBalance, 0);
    
    return {
      blueprintId,
      asOfDate,
      accounts,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  }

  // ============ Private Methods ============

  private async generateEntryNumber(blueprintId: string): Promise<string> {
    const entries = await this.repository.findByBlueprint(blueprintId);
    const count = entries.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `JE-${year}${month}-${String(count).padStart(5, '0')}`;
  }

  private getFiscalPeriod(date: Date): { year: number; period: number } {
    return {
      year: date.getFullYear(),
      period: date.getMonth() + 1
    };
  }
}
```

---

## ✅ 交付物

- [ ] `ledger.service.ts`
- [ ] `ledger.interface.ts`
- [ ] `ledger.service.spec.ts`
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 分錄記錄借貸平衡
2. ✅ 自動分錄正確生成
3. ✅ 科目餘額計算正確
4. ✅ 試算表平衡
5. ✅ 審計追蹤完整
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
