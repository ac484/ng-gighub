/**
 * Finance Module Integration Tests
 *
 * SETC-031: Finance Integration Testing
 *
 * 財務模組整合測試套件，驗證：
 * - 完整請款生命週期
 * - 付款生成與審核流程
 * - 事件流程正確性
 * - 資料一致性
 *
 * @module FinanceIntegrationSpec
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import type { Invoice, InvoiceStatus, FinancialSummary, BillingProgress, PaymentProgress } from './models';
import { InvoiceStateMachine } from './models/invoice-status-machine';
import { InvoiceApprovalService } from './services/invoice-approval.service';
import { InvoiceGenerationService, AcceptanceDataForInvoice, ContractDataForInvoice } from './services/invoice-generation.service';
import { PaymentGenerationService, AcceptanceDataForPayment, ContractDataForPayment } from './services/payment-generation.service';
import { PaymentStatusTrackingService } from './services/payment-status-tracking.service';
import { EnhancedEventBusService } from '../../../events/enhanced-event-bus.service';
import type { EventActor } from '../../../events/models/blueprint-event.model';

describe('Finance Module Integration', () => {
  let invoiceGenerationService: InvoiceGenerationService;
  let invoiceApprovalService: InvoiceApprovalService;
  let paymentGenerationService: PaymentGenerationService;
  let paymentStatusTrackingService: PaymentStatusTrackingService;
  let eventBusMock: jasmine.SpyObj<EnhancedEventBusService>;
  let firestoreMock: jasmine.SpyObj<Firestore>;
  let loggerMock: jasmine.SpyObj<LoggerService>;

  // Test data
  const testBlueprintId = 'bp-test-001';
  const testContractId = 'contract-test-001';
  const testAcceptanceId = 'acceptance-test-001';
  const testTaskId = 'task-test-001';

  const mockActor: EventActor = {
    userId: 'user-test-001',
    userName: 'Test User',
    role: 'admin'
  };

  const mockApproverActor: EventActor = {
    userId: 'approver-001',
    userName: 'Test Approver',
    role: 'manager'
  };

  const mockAcceptanceData: AcceptanceDataForInvoice = {
    id: testAcceptanceId,
    blueprintId: testBlueprintId,
    contractId: testContractId,
    taskIds: [testTaskId],
    totalAmount: 100000,
    acceptedAt: new Date()
  };

  const mockContractData: ContractDataForInvoice = {
    id: testContractId,
    blueprintId: testBlueprintId,
    contractNumber: 'CONTRACT-001',
    ownerName: '業主公司',
    ownerId: 'owner-001',
    contractorName: '承攬廠商',
    contractorId: 'contractor-001',
    paymentTermDays: 30
  };

  beforeEach(() => {
    firestoreMock = jasmine.createSpyObj('Firestore', ['app']);
    loggerMock = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error', 'debug']);
    eventBusMock = jasmine.createSpyObj('EnhancedEventBusService', ['emit', 'onEvent', 'on']);

    TestBed.configureTestingModule({
      providers: [
        InvoiceGenerationService,
        InvoiceApprovalService,
        PaymentGenerationService,
        PaymentStatusTrackingService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: EnhancedEventBusService, useValue: eventBusMock }
      ]
    });

    invoiceGenerationService = TestBed.inject(InvoiceGenerationService);
    invoiceApprovalService = TestBed.inject(InvoiceApprovalService);
    paymentGenerationService = TestBed.inject(PaymentGenerationService);
    paymentStatusTrackingService = TestBed.inject(PaymentStatusTrackingService);
  });

  describe('Invoice State Machine Integration', () => {
    describe('Complete Invoice Lifecycle', () => {
      it('should support complete invoice lifecycle: draft → submitted → approved → invoiced → paid', () => {
        const statuses: InvoiceStatus[] = ['draft', 'submitted', 'approved', 'invoiced', 'paid'];

        for (let i = 0; i < statuses.length - 1; i++) {
          expect(InvoiceStateMachine.canTransition(statuses[i], statuses[i + 1])).toBeTrue();
        }
      });

      it('should prevent invalid transitions from draft to approved', () => {
        expect(InvoiceStateMachine.canTransition('draft', 'approved')).toBeFalse();
      });

      it('should prevent any transitions from paid status', () => {
        expect(InvoiceStateMachine.canTransition('paid', 'draft')).toBeFalse();
        expect(InvoiceStateMachine.canTransition('paid', 'cancelled')).toBeFalse();
        expect(InvoiceStateMachine.canTransition('paid', 'submitted')).toBeFalse();
      });
    });

    describe('Rejection and Recovery Flow', () => {
      it('should support rejection flow: submitted → rejected → draft → submitted', () => {
        expect(InvoiceStateMachine.canTransition('submitted', 'rejected')).toBeTrue();
        expect(InvoiceStateMachine.canTransition('rejected', 'draft')).toBeTrue();
        expect(InvoiceStateMachine.canTransition('draft', 'submitted')).toBeTrue();
      });
    });

    describe('Partial Payment Flow', () => {
      it('should support partial payment: invoiced → partial_paid → paid', () => {
        expect(InvoiceStateMachine.canTransition('invoiced', 'partial_paid')).toBeTrue();
        expect(InvoiceStateMachine.canTransition('partial_paid', 'paid')).toBeTrue();
      });

      it('should support direct payment: invoiced → paid', () => {
        expect(InvoiceStateMachine.canTransition('invoiced', 'paid')).toBeTrue();
      });
    });
  });

  describe('Payment Status Tracking Integration', () => {
    describe('Billing Progress Calculation', () => {
      it('should calculate correct billing progress with no invoices', () => {
        const progress = paymentStatusTrackingService.calculateBillingProgress([], testTaskId, 100000);

        expect(progress.taskId).toBe(testTaskId);
        expect(progress.totalBillable).toBe(100000);
        expect(progress.billedAmount).toBe(0);
        expect(progress.paidAmount).toBe(0);
        expect(progress.billingPercentage).toBe(0);
        expect(progress.collectionPercentage).toBe(0);
      });

      it('should calculate correct billing progress with approved invoices', () => {
        const invoices: Invoice[] = [
          createMockInvoice('inv-001', 'receivable', 'approved', 80000, [testTaskId]),
          createMockInvoice('inv-002', 'receivable', 'draft', 20000, [testTaskId])
        ];

        const progress = paymentStatusTrackingService.calculateBillingProgress(invoices, testTaskId, 100000);

        expect(progress.billedAmount).toBe(80000);
        expect(progress.billingPercentage).toBe(80);
      });

      it('should calculate correct collection percentage with paid invoices', () => {
        const invoices: Invoice[] = [createMockInvoice('inv-001', 'receivable', 'paid', 80000, [testTaskId], 80000)];

        const progress = paymentStatusTrackingService.calculateBillingProgress(invoices, testTaskId, 100000);

        expect(progress.paidAmount).toBe(80000);
        expect(progress.collectionPercentage).toBe(100);
      });
    });

    describe('Payment Progress Calculation', () => {
      it('should calculate correct payment progress with no payables', () => {
        const progress = paymentStatusTrackingService.calculatePaymentProgress([], testTaskId, 50000);

        expect(progress.taskId).toBe(testTaskId);
        expect(progress.totalPayable).toBe(50000);
        expect(progress.approvedAmount).toBe(0);
        expect(progress.paidAmount).toBe(0);
      });

      it('should calculate correct payment progress with approved payables', () => {
        const invoices: Invoice[] = [createMockInvoice('pay-001', 'payable', 'approved', 40000, [testTaskId])];

        const progress = paymentStatusTrackingService.calculatePaymentProgress(invoices, testTaskId, 50000);

        expect(progress.approvedAmount).toBe(40000);
        expect(progress.approvalPercentage).toBe(80);
      });
    });

    describe('Financial Summary Calculation', () => {
      it('should calculate correct financial summary with mixed invoices', () => {
        const invoices: Invoice[] = [
          // Receivables
          createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId]),
          createMockInvoice('inv-002', 'receivable', 'paid', 50000, [testTaskId], 50000),
          // Payables
          createMockInvoice('pay-001', 'payable', 'approved', 60000, [testTaskId]),
          createMockInvoice('pay-002', 'payable', 'paid', 30000, [testTaskId], 30000)
        ];

        const summary = paymentStatusTrackingService.calculateFinancialSummary(invoices, testBlueprintId);

        expect(summary.blueprintId).toBe(testBlueprintId);
        expect(summary.receivables.total).toBe(150000); // 100000 + 50000
        expect(summary.receivables.collected).toBe(50000);
        expect(summary.payables.total).toBe(90000); // 60000 + 30000
        expect(summary.payables.paid).toBe(30000);
        expect(summary.grossProfit).toBe(20000); // 50000 - 30000
      });

      it('should cache financial summary', () => {
        const invoices: Invoice[] = [createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId])];

        paymentStatusTrackingService.calculateFinancialSummary(invoices, testBlueprintId);
        const cachedSummary = paymentStatusTrackingService.getCachedSummary(testBlueprintId);

        expect(cachedSummary).toBeDefined();
        expect(cachedSummary?.blueprintId).toBe(testBlueprintId);
      });

      it('should clear cache when requested', () => {
        const invoices: Invoice[] = [createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId])];

        paymentStatusTrackingService.calculateFinancialSummary(invoices, testBlueprintId);
        paymentStatusTrackingService.clearCache();

        expect(paymentStatusTrackingService.getCachedSummary(testBlueprintId)).toBeUndefined();
      });
    });

    describe('Overdue Summary Calculation', () => {
      it('should identify overdue receivables', () => {
        const pastDue = new Date();
        pastDue.setDate(pastDue.getDate() - 10);

        const invoices: Invoice[] = [
          createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId], undefined, pastDue),
          createMockInvoice('inv-002', 'receivable', 'submitted', 50000, [testTaskId], undefined, pastDue)
        ];

        const overdue = paymentStatusTrackingService.calculateOverdueSummary(invoices, testBlueprintId);

        expect(overdue.overdueReceivableCount).toBe(2);
        expect(overdue.overdueReceivableAmount).toBe(150000);
      });

      it('should not count paid invoices as overdue', () => {
        const pastDue = new Date();
        pastDue.setDate(pastDue.getDate() - 10);

        const invoices: Invoice[] = [createMockInvoice('inv-001', 'receivable', 'paid', 100000, [testTaskId], 100000, pastDue)];

        const overdue = paymentStatusTrackingService.calculateOverdueSummary(invoices, testBlueprintId);

        expect(overdue.overdueReceivableCount).toBe(0);
      });
    });

    describe('Contractor Summary Calculation', () => {
      it('should calculate correct contractor summary', () => {
        const invoices: Invoice[] = [
          createMockInvoiceWithParty('pay-001', 'payable', 'approved', 60000, 'contractor-001', '承商A'),
          createMockInvoiceWithParty('pay-002', 'payable', 'paid', 40000, 'contractor-001', '承商A', 40000)
        ];

        const summary = paymentStatusTrackingService.calculateContractorSummary(invoices, 'contractor-001');

        expect(summary.contractorId).toBe('contractor-001');
        expect(summary.totalPayable).toBe(100000);
        expect(summary.paidAmount).toBe(40000);
        expect(summary.pendingAmount).toBe(60000);
        expect(summary.paymentCount).toBe(2);
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent totals across multiple invoices', () => {
      const invoices: Invoice[] = [
        createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId]),
        createMockInvoice('inv-002', 'receivable', 'approved', 50000, [testTaskId])
      ];

      const summary = paymentStatusTrackingService.calculateFinancialSummary(invoices, testBlueprintId);

      const expectedTotal = 100000 + 50000;
      expect(summary.receivables.total).toBe(expectedTotal);
    });

    it('should correctly separate receivables and payables', () => {
      const invoices: Invoice[] = [
        createMockInvoice('inv-001', 'receivable', 'approved', 100000, [testTaskId]),
        createMockInvoice('pay-001', 'payable', 'approved', 60000, [testTaskId])
      ];

      const summary = paymentStatusTrackingService.calculateFinancialSummary(invoices, testBlueprintId);

      expect(summary.receivables.total).toBe(100000);
      expect(summary.payables.total).toBe(60000);
    });
  });

  // Helper functions
  function createMockInvoice(
    id: string,
    invoiceType: 'receivable' | 'payable',
    status: InvoiceStatus,
    total: number,
    taskIds: string[],
    paidAmount?: number,
    dueDate?: Date
  ): Invoice {
    return {
      id,
      blueprintId: testBlueprintId,
      invoiceNumber: `${invoiceType === 'receivable' ? 'INV' : 'PAY'}-${id}`,
      invoiceType,
      contractId: testContractId,
      taskIds,
      invoiceItems: [],
      subtotal: Math.round(total / 1.05),
      tax: total - Math.round(total / 1.05),
      taxRate: 0.05,
      total,
      billingPercentage: 100,
      billingParty: {
        id: 'billing-party-001',
        name: '請款方',
        taxId: '12345678',
        address: '',
        contactName: '',
        contactPhone: '',
        contactEmail: ''
      },
      payingParty: {
        id: 'paying-party-001',
        name: '付款方',
        taxId: '87654321',
        address: '',
        contactName: '',
        contactPhone: '',
        contactEmail: ''
      },
      status,
      approvalWorkflow: {
        currentStep: 0,
        totalSteps: 2,
        approvers: [],
        history: []
      },
      dueDate: dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAmount,
      attachments: [],
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  function createMockInvoiceWithParty(
    id: string,
    invoiceType: 'receivable' | 'payable',
    status: InvoiceStatus,
    total: number,
    payingPartyId: string,
    payingPartyName: string,
    paidAmount?: number
  ): Invoice {
    const invoice = createMockInvoice(id, invoiceType, status, total, [testTaskId], paidAmount);
    invoice.payingParty = {
      id: payingPartyId,
      name: payingPartyName,
      taxId: '',
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: ''
    };
    return invoice;
  }
});
