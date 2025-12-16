/**
 * Payment Status Tracking Service - 單元測試
 *
 * SETC-029: Payment Status Tracking Service Implementation
 *
 * @module PaymentStatusTrackingServiceSpec
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService } from '@core';

import { PaymentStatusTrackingService } from './payment-status-tracking.service';
import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { BillingProgress, PaymentProgress, FinancialSummary } from '../models/financial-summary.model';
import type { Invoice, InvoiceStatus } from '../models/invoice.model';

describe('PaymentStatusTrackingService', () => {
  let service: PaymentStatusTrackingService;
  let loggerMock: jasmine.SpyObj<LoggerService>;
  let eventBusMock: jasmine.SpyObj<EnhancedEventBusService>;

  const createMockInvoice = (overrides?: Partial<Invoice>): Invoice => ({
    id: 'invoice-001',
    blueprintId: 'bp-001',
    invoiceNumber: 'INV-20251216-ABC1',
    invoiceType: 'receivable',
    contractId: 'contract-001',
    taskIds: ['task-001'],
    invoiceItems: [],
    subtotal: 100000,
    tax: 5000,
    taxRate: 0.05,
    total: 105000,
    billingPercentage: 100,
    billingParty: {
      id: 'org-001',
      name: 'Test Contractor',
      taxId: '12345678',
      address: 'Address',
      contactName: 'Contact',
      contactPhone: '0912345678',
      contactEmail: 'test@example.com'
    },
    payingParty: {
      id: 'org-002',
      name: 'Test Owner',
      taxId: '87654321',
      address: 'Address',
      contactName: 'Contact',
      contactPhone: '0987654321',
      contactEmail: 'owner@example.com'
    },
    status: 'approved',
    approvalWorkflow: {
      currentStep: 0,
      totalSteps: 2,
      approvers: [],
      history: []
    },
    dueDate: new Date('2025-12-31'),
    attachments: [],
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(() => {
    loggerMock = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error']);
    eventBusMock = jasmine.createSpyObj('EnhancedEventBusService', ['onEvent', 'emit']);

    TestBed.configureTestingModule({
      providers: [
        PaymentStatusTrackingService,
        { provide: LoggerService, useValue: loggerMock },
        { provide: EnhancedEventBusService, useValue: eventBusMock }
      ]
    });

    service = TestBed.inject(PaymentStatusTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateBillingProgress', () => {
    it('should calculate billing progress correctly', () => {
      const invoices: Invoice[] = [
        createMockInvoice({ id: 'inv-1', total: 50000, status: 'approved', taskIds: ['task-001'] }),
        createMockInvoice({ id: 'inv-2', total: 30000, status: 'paid', paidAmount: 30000, taskIds: ['task-001'] })
      ];

      const progress = service.calculateBillingProgress(invoices, 'task-001', 100000);

      expect(progress.taskId).toBe('task-001');
      expect(progress.totalBillable).toBe(100000);
      expect(progress.billedAmount).toBe(80000); // 50000 + 30000
      expect(progress.paidAmount).toBe(30000);
      expect(progress.billingPercentage).toBe(80);
      expect(progress.collectionPercentage).toBe(37.5); // 30000 / 80000 * 100
    });

    it('should return 0% for no invoices', () => {
      const progress = service.calculateBillingProgress([], 'task-001', 100000);

      expect(progress.billingPercentage).toBe(0);
      expect(progress.collectionPercentage).toBe(0);
    });

    it('should handle 0 totalBillable', () => {
      const progress = service.calculateBillingProgress([], 'task-001', 0);

      expect(progress.billingPercentage).toBe(0);
    });

    it('should filter by task ID', () => {
      const invoices: Invoice[] = [
        createMockInvoice({ id: 'inv-1', total: 50000, taskIds: ['task-001'] }),
        createMockInvoice({ id: 'inv-2', total: 30000, taskIds: ['task-002'] }) // Different task
      ];

      const progress = service.calculateBillingProgress(invoices, 'task-001', 100000);

      expect(progress.billedAmount).toBe(50000);
    });

    it('should filter by receivable type', () => {
      const invoices: Invoice[] = [
        createMockInvoice({ id: 'inv-1', total: 50000, invoiceType: 'receivable', taskIds: ['task-001'] }),
        createMockInvoice({ id: 'inv-2', total: 30000, invoiceType: 'payable', taskIds: ['task-001'] }) // Different type
      ];

      const progress = service.calculateBillingProgress(invoices, 'task-001', 100000);

      expect(progress.billedAmount).toBe(50000);
    });
  });

  describe('calculatePaymentProgress', () => {
    it('should calculate payment progress correctly', () => {
      const invoices: Invoice[] = [
        createMockInvoice({ id: 'pay-1', total: 40000, status: 'approved', invoiceType: 'payable', taskIds: ['task-001'] }),
        createMockInvoice({ id: 'pay-2', total: 20000, status: 'paid', paidAmount: 20000, invoiceType: 'payable', taskIds: ['task-001'] })
      ];

      const progress = service.calculatePaymentProgress(invoices, 'task-001', 80000);

      expect(progress.taskId).toBe('task-001');
      expect(progress.totalPayable).toBe(80000);
      expect(progress.approvedAmount).toBe(60000); // 40000 + 20000
      expect(progress.paidAmount).toBe(20000);
      expect(progress.approvalPercentage).toBe(75); // 60000 / 80000 * 100
      expect(progress.paymentPercentage).toBe(33.33); // 20000 / 60000 * 100 (rounded)
    });

    it('should filter by payable type', () => {
      const invoices: Invoice[] = [
        createMockInvoice({ id: 'pay-1', total: 40000, invoiceType: 'payable', taskIds: ['task-001'] }),
        createMockInvoice({ id: 'inv-1', total: 30000, invoiceType: 'receivable', taskIds: ['task-001'] }) // Different type
      ];

      const progress = service.calculatePaymentProgress(invoices, 'task-001', 80000);

      expect(progress.approvedAmount).toBe(40000);
    });
  });

  describe('calculateFinancialSummary', () => {
    it('should calculate financial summary correctly', () => {
      const invoices: Invoice[] = [
        // Receivables
        createMockInvoice({ id: 'inv-1', total: 100000, status: 'paid', paidAmount: 100000, invoiceType: 'receivable' }),
        createMockInvoice({ id: 'inv-2', total: 50000, status: 'approved', invoiceType: 'receivable' }),
        // Payables
        createMockInvoice({ id: 'pay-1', total: 60000, status: 'paid', paidAmount: 60000, invoiceType: 'payable' }),
        createMockInvoice({ id: 'pay-2', total: 30000, status: 'approved', invoiceType: 'payable' })
      ];

      const summary = service.calculateFinancialSummary(invoices, 'bp-001');

      expect(summary.blueprintId).toBe('bp-001');

      // Receivables: total = 150000, collected = 100000
      expect(summary.receivables.total).toBe(150000);
      expect(summary.receivables.collected).toBe(100000);
      expect(summary.receivables.pending).toBe(50000);
      expect(summary.receivables.collectionRate).toBe(66.67);

      // Payables: total = 90000, paid = 60000
      expect(summary.payables.total).toBe(90000);
      expect(summary.payables.paid).toBe(60000);
      expect(summary.payables.pending).toBe(30000);
      expect(summary.payables.paymentRate).toBe(66.67);

      // Gross profit: 100000 - 60000 = 40000
      expect(summary.grossProfit).toBe(40000);
      // Gross profit margin: 40000 / 100000 * 100 = 40%
      expect(summary.grossProfitMargin).toBe(40);
    });

    it('should handle empty invoices', () => {
      const summary = service.calculateFinancialSummary([], 'bp-001');

      expect(summary.receivables.total).toBe(0);
      expect(summary.payables.total).toBe(0);
      expect(summary.grossProfit).toBe(0);
      expect(summary.grossProfitMargin).toBe(0);
    });

    it('should cache the result', () => {
      const invoices: Invoice[] = [createMockInvoice({ total: 100000, status: 'paid', paidAmount: 100000 })];

      service.calculateFinancialSummary(invoices, 'bp-001');
      const cached = service.getCachedSummary('bp-001');

      expect(cached).toBeDefined();
      expect(cached?.blueprintId).toBe('bp-001');
    });
  });

  describe('calculateOverdueSummary', () => {
    it('should identify overdue receivables', () => {
      const pastDate = new Date('2025-01-01');
      const futureDate = new Date('2025-12-31');

      const invoices: Invoice[] = [
        createMockInvoice({ id: 'inv-1', total: 50000, status: 'approved', dueDate: pastDate, invoiceType: 'receivable' }), // Overdue
        createMockInvoice({ id: 'inv-2', total: 30000, status: 'approved', dueDate: futureDate, invoiceType: 'receivable' }) // Not overdue
      ];

      const summary = service.calculateOverdueSummary(invoices, 'bp-001');

      expect(summary.overdueReceivableCount).toBe(1);
      expect(summary.overdueReceivableAmount).toBe(50000);
    });

    it('should identify overdue payables', () => {
      const pastDate = new Date('2025-01-01');

      const invoices: Invoice[] = [
        createMockInvoice({ id: 'pay-1', total: 40000, status: 'approved', dueDate: pastDate, invoiceType: 'payable' })
      ];

      const summary = service.calculateOverdueSummary(invoices, 'bp-001');

      expect(summary.overduePayableCount).toBe(1);
      expect(summary.overduePayableAmount).toBe(40000);
    });

    it('should not count paid invoices as overdue', () => {
      const pastDate = new Date('2025-01-01');

      const invoices: Invoice[] = [
        createMockInvoice({ id: 'inv-1', total: 50000, status: 'paid', dueDate: pastDate, invoiceType: 'receivable' })
      ];

      const summary = service.calculateOverdueSummary(invoices, 'bp-001');

      expect(summary.overdueReceivableCount).toBe(0);
    });
  });

  describe('calculateContractorSummary', () => {
    it('should calculate contractor payment summary', () => {
      const invoices: Invoice[] = [
        createMockInvoice({
          id: 'pay-1',
          total: 50000,
          status: 'paid',
          paidAmount: 50000,
          invoiceType: 'payable',
          payingParty: {
            id: 'contractor-001',
            name: 'Contractor A',
            taxId: '',
            address: '',
            contactName: '',
            contactPhone: '',
            contactEmail: ''
          }
        }),
        createMockInvoice({
          id: 'pay-2',
          total: 30000,
          status: 'approved',
          invoiceType: 'payable',
          payingParty: {
            id: 'contractor-001',
            name: 'Contractor A',
            taxId: '',
            address: '',
            contactName: '',
            contactPhone: '',
            contactEmail: ''
          }
        })
      ];

      const summary = service.calculateContractorSummary(invoices, 'contractor-001');

      expect(summary.contractorId).toBe('contractor-001');
      expect(summary.contractorName).toBe('Contractor A');
      expect(summary.totalPayable).toBe(80000);
      expect(summary.paidAmount).toBe(50000);
      expect(summary.pendingAmount).toBe(30000);
      expect(summary.paymentCount).toBe(2);
    });

    it('should filter by contractor ID', () => {
      const invoices: Invoice[] = [
        createMockInvoice({
          id: 'pay-1',
          total: 50000,
          invoiceType: 'payable',
          payingParty: {
            id: 'contractor-001',
            name: 'Contractor A',
            taxId: '',
            address: '',
            contactName: '',
            contactPhone: '',
            contactEmail: ''
          }
        }),
        createMockInvoice({
          id: 'pay-2',
          total: 30000,
          invoiceType: 'payable',
          payingParty: {
            id: 'contractor-002',
            name: 'Contractor B',
            taxId: '',
            address: '',
            contactName: '',
            contactPhone: '',
            contactEmail: ''
          }
        })
      ];

      const summary = service.calculateContractorSummary(invoices, 'contractor-001');

      expect(summary.totalPayable).toBe(50000);
      expect(summary.paymentCount).toBe(1);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const invoices: Invoice[] = [createMockInvoice({ total: 100000, status: 'paid', paidAmount: 100000 })];

      service.calculateFinancialSummary(invoices, 'bp-001');
      expect(service.getCachedSummary('bp-001')).toBeDefined();

      service.clearCache();
      expect(service.getCachedSummary('bp-001')).toBeUndefined();
    });

    it('should update lastUpdated on calculation', () => {
      const invoices: Invoice[] = [createMockInvoice({ total: 100000, status: 'paid', paidAmount: 100000 })];

      service.calculateFinancialSummary(invoices, 'bp-001');
      const lastUpdated = service.getLastUpdated();

      expect(lastUpdated).toBeDefined();
      expect(lastUpdated).toBeInstanceOf(Date);
    });
  });
});
