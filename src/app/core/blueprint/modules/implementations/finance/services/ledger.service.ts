/**
 * Ledger Service
 *
 * SETC-067: Ledger & Accounting Service
 *
 * 提供帳務管理功能，包括：
 * - 會計分錄記錄
 * - 科目餘額查詢
 * - 試算表生成
 * - 自動分錄（從請款、付款事件）
 *
 * @module LedgerService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from '@core';
import { lastValueFrom } from 'rxjs';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type {
  LedgerEntry,
  LedgerLine,
  AccountBalance,
  TrialBalance,
  InvoiceEventData,
  PaymentEventData,
  CreateLedgerEntryDto,
  LedgerQueryOptions,
  IncomeStatement,
  BalanceSheet
} from '../models/ledger.model';
import { LedgerRepository } from '../repositories/ledger.repository';

// 會計科目代碼常數
const ACCOUNTS = {
  CASH: '1111',
  BANK: '1121',
  ACCOUNTS_RECEIVABLE: '1131',
  ACCOUNTS_PAYABLE: '2141',
  RETENTION_PAYABLE: '2191',
  REVENUE: '4100',
  COST_OF_GOODS_SOLD: '5100',
  OPERATING_EXPENSES: '6100'
};

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly repository = inject(LedgerRepository);
  private readonly eventBus = inject(EnhancedEventBusService);
  private readonly logger = inject(LoggerService);

  // Signals
  data = signal<LedgerEntry[]>([]);
  loading = signal(false);
  error = signal<Error | null>(null);

  /**
   * Load data
   */
  async load(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));
      this.data.set(result);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 建立分錄
   */
  async createEntry(data: CreateLedgerEntryDto): Promise<LedgerEntry> {
    this.logger.info('[LedgerService]', `Creating entry: ${data.description}`);

    // 驗證借貸平衡
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Entry is not balanced: debits must equal credits');
    }

    try {
      const entry = await this.repository.create(data.blueprintId, data);

      // 更新本地狀態
      this.data.update(entries => [entry, ...entries]);

      // 發送事件
      this.eventBus.emit('ledger.entry_created', {
        entryId: entry.id,
        entryNumber: entry.entryNumber,
        blueprintId: entry.blueprintId,
        amount: totalDebit,
        timestamp: new Date()
      });

      this.logger.info('[LedgerService]', `Entry created: ${entry.id}`);
      return entry;
    } catch (err) {
      this.logger.error('[LedgerService]', 'createEntry failed', err as Error);
      throw err;
    }
  }

  /**
   * 從請款自動建立分錄
   */
  async autoRecordFromInvoice(invoiceData: InvoiceEventData): Promise<LedgerEntry> {
    this.logger.info('[LedgerService]', `Recording invoice: ${invoiceData.invoiceId}`);

    const isReceivable = invoiceData.invoiceType === 'receivable';

    const lines: Array<Omit<LedgerLine, 'id'>> = isReceivable
      ? [
          {
            accountCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
            accountName: '應收帳款',
            debit: invoiceData.totalAmount,
            credit: 0,
            description: `請款 ${invoiceData.invoiceNumber}`
          },
          {
            accountCode: ACCOUNTS.REVENUE,
            accountName: '營業收入',
            debit: 0,
            credit: invoiceData.subtotal,
            description: '請款收入'
          }
        ]
      : [
          {
            accountCode: ACCOUNTS.COST_OF_GOODS_SOLD,
            accountName: '銷貨成本',
            debit: invoiceData.subtotal,
            credit: 0,
            description: `付款單 ${invoiceData.invoiceNumber}`
          },
          {
            accountCode: ACCOUNTS.ACCOUNTS_PAYABLE,
            accountName: '應付帳款',
            debit: 0,
            credit: invoiceData.totalAmount,
            description: '應付款項'
          }
        ];

    // 如果有保留款
    if (invoiceData.retainageAmount && invoiceData.retainageAmount > 0) {
      if (isReceivable) {
        // 調整收入金額
        const revenueIndex = lines.findIndex(l => l.accountCode === ACCOUNTS.REVENUE);
        if (revenueIndex >= 0) {
          lines[revenueIndex].credit = invoiceData.subtotal - invoiceData.retainageAmount;
        }
        lines.push({
          accountCode: ACCOUNTS.RETENTION_PAYABLE,
          accountName: '應付保留款',
          debit: 0,
          credit: invoiceData.retainageAmount,
          description: '保留款'
        });
      }
    }

    // 處理稅額
    if (invoiceData.tax > 0) {
      // 簡化處理：將稅額合併到主要科目
      if (isReceivable) {
        const revenueIndex = lines.findIndex(l => l.accountCode === ACCOUNTS.REVENUE);
        if (revenueIndex >= 0) {
          lines[revenueIndex].credit += invoiceData.tax;
        }
      }
    }

    return this.createEntry({
      blueprintId: invoiceData.blueprintId,
      entryDate: new Date(),
      description: `${isReceivable ? '請款' : '付款單'} ${invoiceData.invoiceNumber}`,
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
    this.logger.info('[LedgerService]', `Recording payment: ${paymentData.paymentId}`);

    const lines: Array<Omit<LedgerLine, 'id'>> = [
      {
        accountCode: ACCOUNTS.BANK,
        accountName: '銀行存款',
        debit: paymentData.amount,
        credit: 0,
        description: `收款 ${paymentData.paymentNumber}`
      },
      {
        accountCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
        accountName: '應收帳款',
        debit: 0,
        credit: paymentData.amount,
        description: '沖銷應收帳款'
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
  async getAccountBalance(blueprintId: string, accountCode: string): Promise<AccountBalance> {
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
    const entries = await this.repository.findByPeriod(
      blueprintId,
      new Date(0), // 從最早開始
      asOfDate
    );

    const accountBalances = new Map<
      string,
      {
        name: string;
        debit: number;
        credit: number;
      }
    >();

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

  /**
   * 產生損益表
   */
  async generateIncomeStatement(blueprintId: string, startDate: Date, endDate: Date): Promise<IncomeStatement> {
    const entries = await this.repository.findByPeriod(blueprintId, startDate, endDate);

    const revenues: Array<{ accountCode: string; accountName: string; amount: number }> = [];
    const expenses: Array<{ accountCode: string; accountName: string; amount: number }> = [];

    const revenueAccounts = new Map<string, { name: string; amount: number }>();
    const expenseAccounts = new Map<string, { name: string; amount: number }>();

    for (const entry of entries) {
      for (const line of entry.lines) {
        const code = line.accountCode;
        // 收入科目 (4xxx)
        if (code.startsWith('4')) {
          const existing = revenueAccounts.get(code) || { name: line.accountName, amount: 0 };
          existing.amount += line.credit - line.debit;
          revenueAccounts.set(code, existing);
        }
        // 費用科目 (5xxx, 6xxx)
        if (code.startsWith('5') || code.startsWith('6')) {
          const existing = expenseAccounts.get(code) || { name: line.accountName, amount: 0 };
          existing.amount += line.debit - line.credit;
          expenseAccounts.set(code, existing);
        }
      }
    }

    for (const [code, data] of revenueAccounts) {
      revenues.push({ accountCode: code, accountName: data.name, amount: data.amount });
    }

    for (const [code, data] of expenseAccounts) {
      expenses.push({ accountCode: code, accountName: data.name, amount: data.amount });
    }

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      blueprintId,
      startDate,
      endDate,
      revenues,
      totalRevenue,
      expenses,
      totalExpense,
      netIncome: totalRevenue - totalExpense
    };
  }

  /**
   * 產生資產負債表
   */
  async generateBalanceSheet(blueprintId: string, asOfDate: Date): Promise<BalanceSheet> {
    const trialBalance = await this.getTrialBalance(blueprintId, asOfDate);

    const assets: Array<{ accountCode: string; accountName: string; balance: number }> = [];
    const liabilities: Array<{ accountCode: string; accountName: string; balance: number }> = [];

    for (const account of trialBalance.accounts) {
      const code = account.accountCode;
      // 資產科目 (1xxx)
      if (code.startsWith('1')) {
        assets.push({
          accountCode: code,
          accountName: account.accountName,
          balance: account.netBalance
        });
      }
      // 負債科目 (2xxx)
      if (code.startsWith('2')) {
        liabilities.push({
          accountCode: code,
          accountName: account.accountName,
          balance: -account.netBalance // 負債是貸方餘額
        });
      }
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);

    return {
      blueprintId,
      asOfDate,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity: totalAssets - totalLiabilities
    };
  }

  /**
   * 查詢分錄
   */
  async getEntriesByBlueprint(blueprintId: string, options?: LedgerQueryOptions): Promise<LedgerEntry[]> {
    return this.repository.findByBlueprint(blueprintId, options);
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.data.set([]);
    this.error.set(null);
  }
}
