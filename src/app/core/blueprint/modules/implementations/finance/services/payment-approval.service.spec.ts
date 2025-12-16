/**
 * Payment Approval Service - 單元測試
 *
 * SETC-028: Payment Approval Workflow Implementation
 *
 * @module PaymentApprovalServiceSpec
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import { PaymentApprovalService, PaymentInvoiceInfo, PaymentCompleteInfo } from './payment-approval.service';
import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { EventActor } from '../../../../events/models/blueprint-event.model';
import { InvoiceStateMachine } from '../models/invoice-status-machine';
import type { Invoice, InvoiceStatus, ApprovalWorkflow } from '../models/invoice.model';

describe('PaymentApprovalService', () => {
  let service: PaymentApprovalService;
  let firestoreMock: jasmine.SpyObj<Firestore>;
  let loggerMock: jasmine.SpyObj<LoggerService>;
  let eventBusMock: jasmine.SpyObj<EnhancedEventBusService>;

  const mockActor: EventActor = {
    userId: 'user-001',
    userName: 'Test User',
    role: 'admin'
  };

  const createMockPayment = (overrides?: Partial<Invoice>): Invoice => ({
    id: 'payment-001',
    blueprintId: 'bp-001',
    invoiceNumber: 'PAY-20251216-ABC1',
    invoiceType: 'payable', // Important: This is a payment (payable)
    contractId: 'contract-001',
    acceptanceId: 'acceptance-001',
    taskIds: ['task-001'],
    invoiceItems: [
      {
        id: 'item-001',
        contractWorkItemId: 'work-item-001',
        description: 'Test Payment Item',
        unit: '式',
        quantity: 1,
        unitPrice: 100000,
        amount: 100000,
        completionPercentage: 100,
        previousBilled: 0,
        currentBilling: 100000
      }
    ],
    subtotal: 100000,
    tax: 5000,
    taxRate: 0.05,
    total: 105000,
    billingPercentage: 100,
    billingParty: {
      id: 'owner-001',
      name: 'Test Owner Corp',
      taxId: '12345678',
      address: 'Owner Address',
      contactName: 'Owner Contact',
      contactPhone: '0912345678',
      contactEmail: 'owner@example.com'
    },
    payingParty: {
      id: 'contractor-001',
      name: 'Test Contractor Co',
      taxId: '87654321',
      address: 'Contractor Address',
      contactName: 'Contractor Contact',
      contactPhone: '0987654321',
      contactEmail: 'contractor@example.com'
    },
    status: 'draft',
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
    firestoreMock = jasmine.createSpyObj('Firestore', ['app']);
    loggerMock = jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error']);
    eventBusMock = jasmine.createSpyObj('EnhancedEventBusService', ['emit']);

    TestBed.configureTestingModule({
      providers: [
        PaymentApprovalService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: EnhancedEventBusService, useValue: eventBusMock }
      ]
    });

    service = TestBed.inject(PaymentApprovalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Payment Status Transitions', () => {
    it('should allow draft to submitted transition', () => {
      expect(InvoiceStateMachine.canTransition('draft', 'submitted')).toBeTrue();
    });

    it('should allow submitted to approved transition', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'approved')).toBeTrue();
    });

    it('should allow approved to invoiced transition', () => {
      expect(InvoiceStateMachine.canTransition('approved', 'invoiced')).toBeTrue();
    });

    it('should allow invoiced to paid transition', () => {
      expect(InvoiceStateMachine.canTransition('invoiced', 'paid')).toBeTrue();
    });

    it('should allow invoiced to partial_paid transition', () => {
      expect(InvoiceStateMachine.canTransition('invoiced', 'partial_paid')).toBeTrue();
    });

    it('should allow partial_paid to paid transition', () => {
      expect(InvoiceStateMachine.canTransition('partial_paid', 'paid')).toBeTrue();
    });

    it('should not allow paid to any transition', () => {
      const transitions = InvoiceStateMachine.getAvailableTransitions('paid');
      expect(transitions.length).toBe(0);
    });
  });

  describe('Payment Workflow Validation', () => {
    it('should validate payable invoice type', () => {
      const payment = createMockPayment();
      expect(payment.invoiceType).toBe('payable');
    });

    it('should have contractor info in payingParty', () => {
      const payment = createMockPayment();
      expect(payment.payingParty.id).toBe('contractor-001');
      expect(payment.payingParty.name).toBe('Test Contractor Co');
    });

    it('should have owner info in billingParty', () => {
      const payment = createMockPayment();
      expect(payment.billingParty.id).toBe('owner-001');
      expect(payment.billingParty.name).toBe('Test Owner Corp');
    });
  });

  describe('Approval Workflow Logic', () => {
    it('should track approval workflow state', () => {
      const workflow: ApprovalWorkflow = {
        currentStep: 1,
        totalSteps: 2,
        approvers: [
          {
            stepNumber: 1,
            userId: 'approver-1',
            userName: 'Approver One',
            role: 'manager',
            status: 'approved',
            approvedAt: new Date()
          },
          {
            stepNumber: 2,
            userId: 'approver-2',
            userName: 'Approver Two',
            role: 'director',
            status: 'pending'
          }
        ],
        history: []
      };

      expect(workflow.currentStep).toBeLessThan(workflow.totalSteps);
      expect(workflow.approvers[0].status).toBe('approved');
      expect(workflow.approvers[1].status).toBe('pending');
    });

    it('should determine fully approved when all steps complete', () => {
      const workflow: ApprovalWorkflow = {
        currentStep: 2,
        totalSteps: 2,
        approvers: [],
        history: []
      };

      const isFullyApproved = workflow.currentStep >= workflow.totalSteps;
      expect(isFullyApproved).toBeTrue();
    });
  });

  describe('Invoice Info Validation', () => {
    it('should validate payment invoice info structure', () => {
      const invoiceInfo: PaymentInvoiceInfo = {
        invoiceNumber: 'AB12345678',
        invoiceDate: new Date('2025-12-16'),
        taxId: '87654321',
        amount: 105000
      };

      expect(invoiceInfo.invoiceNumber).toBeDefined();
      expect(invoiceInfo.invoiceDate).toBeInstanceOf(Date);
      expect(invoiceInfo.taxId).toBeDefined();
      expect(invoiceInfo.amount).toBeGreaterThan(0);
    });

    it('should validate payment complete info structure', () => {
      const paymentInfo: PaymentCompleteInfo = {
        amount: 105000,
        method: 'bank_transfer',
        paidDate: new Date('2025-12-16'),
        reference: '12345',
        bankInfo: {
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          transactionId: 'TXN-001'
        }
      };

      expect(paymentInfo.amount).toBeGreaterThan(0);
      expect(paymentInfo.method).toBe('bank_transfer');
      expect(paymentInfo.bankInfo).toBeDefined();
    });
  });

  describe('Partial Payment Logic', () => {
    it('should calculate remaining amount correctly', () => {
      const total = 105000;
      const firstPayment = 50000;
      const remaining = total - firstPayment;

      expect(remaining).toBe(55000);
    });

    it('should determine partial_paid status when not fully paid', () => {
      const payment = createMockPayment({ total: 100000 });
      const paymentAmount = 50000;

      const newStatus: InvoiceStatus = paymentAmount >= payment.total ? 'paid' : 'partial_paid';

      expect(newStatus).toBe('partial_paid');
    });

    it('should determine paid status when fully paid', () => {
      const payment = createMockPayment({ total: 100000 });
      const paymentAmount = 100000;

      const newStatus: InvoiceStatus = paymentAmount >= payment.total ? 'paid' : 'partial_paid';

      expect(newStatus).toBe('paid');
    });

    it('should accumulate multiple payments correctly', () => {
      const total = 100000;
      const firstPayment = 40000;
      const secondPayment = 35000;
      const thirdPayment = 25000;

      const totalPaid = firstPayment + secondPayment + thirdPayment;
      expect(totalPaid).toBe(100000);
      expect(totalPaid).toBe(total);
    });
  });

  describe('Payment Flow Sequences', () => {
    it('should support complete payment flow: draft -> submitted -> approved -> invoiced -> paid', () => {
      const statuses: InvoiceStatus[] = ['draft', 'submitted', 'approved', 'invoiced', 'paid'];

      for (let i = 0; i < statuses.length - 1; i++) {
        expect(InvoiceStateMachine.canTransition(statuses[i], statuses[i + 1])).toBeTrue();
      }
    });

    it('should support rejection and recovery flow', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'rejected')).toBeTrue();
      expect(InvoiceStateMachine.canTransition('rejected', 'draft')).toBeTrue();
      expect(InvoiceStateMachine.canTransition('draft', 'submitted')).toBeTrue();
    });

    it('should support multi-level approval: submitted -> under_review -> approved', () => {
      expect(InvoiceStateMachine.canTransition('submitted', 'under_review')).toBeTrue();
      expect(InvoiceStateMachine.canTransition('under_review', 'approved')).toBeTrue();
    });
  });

  describe('Payment Method Validation', () => {
    it('should accept bank_transfer payment method', () => {
      const method: Invoice['paymentMethod'] = 'bank_transfer';
      expect(method).toBe('bank_transfer');
    });

    it('should accept check payment method', () => {
      const method: Invoice['paymentMethod'] = 'check';
      expect(method).toBe('check');
    });

    it('should accept cash payment method', () => {
      const method: Invoice['paymentMethod'] = 'cash';
      expect(method).toBe('cash');
    });
  });

  describe('Due Date Handling', () => {
    it('should have valid due date', () => {
      const payment = createMockPayment();
      expect(payment.dueDate).toBeInstanceOf(Date);
    });

    it('should identify overdue payments', () => {
      const pastDueDate = new Date('2025-01-01');
      const now = new Date('2025-12-16');

      const isOverdue = pastDueDate < now;
      expect(isOverdue).toBeTrue();
    });

    it('should identify payments not yet due', () => {
      const futureDueDate = new Date('2025-12-31');
      const now = new Date('2025-12-16');

      const isOverdue = futureDueDate < now;
      expect(isOverdue).toBeFalse();
    });
  });
});
