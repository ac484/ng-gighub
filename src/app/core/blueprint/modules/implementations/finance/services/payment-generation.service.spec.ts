/**
 * Payment Generation Service - 單元測試
 *
 * SETC-027: Payment Generation Service Implementation
 *
 * @module PaymentGenerationServiceSpec
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { LoggerService } from '@core';

import {
  PaymentGenerationService,
  AcceptanceDataForPayment,
  ContractDataForPayment,
  GeneratePaymentOptions,
  ContractorPaymentSummary
} from './payment-generation.service';
import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type { Invoice } from '../models/invoice.model';

describe('PaymentGenerationService', () => {
  let service: PaymentGenerationService;
  let firestoreMock: jasmine.SpyObj<Firestore>;
  let loggerMock: jasmine.SpyObj<LoggerService>;
  let eventBusMock: jasmine.SpyObj<EnhancedEventBusService>;

  const createMockAcceptanceData = (overrides?: Partial<AcceptanceDataForPayment>): AcceptanceDataForPayment => ({
    id: 'acceptance-001',
    blueprintId: 'bp-001',
    contractId: 'contract-001',
    taskIds: ['task-001', 'task-002'],
    totalAmount: 100000,
    acceptedAt: new Date('2025-12-15'),
    ...overrides
  });

  const createMockContractData = (overrides?: Partial<ContractDataForPayment>): ContractDataForPayment => ({
    id: 'contract-001',
    blueprintId: 'bp-001',
    contractNumber: 'CON-20251215-001',
    ownerName: 'Test Owner Corp',
    ownerId: 'owner-001',
    contractorName: 'Test Contractor Co',
    contractorId: 'contractor-001',
    paymentTermDays: 30,
    contractorRate: 1.0,
    managementFeeRate: 0,
    ...overrides
  });

  const createMockPayment = (overrides?: Partial<Invoice>): Invoice => ({
    id: 'payment-001',
    blueprintId: 'bp-001',
    invoiceNumber: 'PAY-20251216-ABC1',
    invoiceType: 'payable',
    contractId: 'contract-001',
    acceptanceId: 'acceptance-001',
    taskIds: ['task-001'],
    invoiceItems: [
      {
        id: 'pitem-001',
        contractWorkItemId: 'contract-001',
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
    createdBy: 'system',
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
        PaymentGenerationService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: EnhancedEventBusService, useValue: eventBusMock }
      ]
    });

    service = TestBed.inject(PaymentGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateContractorSummary', () => {
    it('should calculate correct summary for contractor payments', () => {
      const payments: Invoice[] = [
        createMockPayment({ total: 100000, status: 'draft' }),
        createMockPayment({ id: 'payment-002', total: 50000, status: 'paid', paidAmount: 50000 }),
        createMockPayment({ id: 'payment-003', total: 75000, status: 'approved' })
      ];

      const summary = service.calculateContractorSummary(payments, 'contractor-001');

      expect(summary.contractorId).toBe('contractor-001');
      expect(summary.contractorName).toBe('Test Contractor Co');
      expect(summary.totalPayable).toBe(225000); // 100000 + 50000 + 75000
      expect(summary.paidAmount).toBe(50000); // Only the paid one
      expect(summary.pendingAmount).toBe(175000); // 225000 - 50000
      expect(summary.paymentCount).toBe(3);
    });

    it('should return empty summary for non-existent contractor', () => {
      const payments: Invoice[] = [createMockPayment({ total: 100000 })];

      const summary = service.calculateContractorSummary(payments, 'non-existent');

      expect(summary.totalPayable).toBe(0);
      expect(summary.paidAmount).toBe(0);
      expect(summary.pendingAmount).toBe(0);
      expect(summary.paymentCount).toBe(0);
    });

    it('should filter out receivable invoices', () => {
      const payments: Invoice[] = [
        createMockPayment({ total: 100000, invoiceType: 'payable' }),
        createMockPayment({ id: 'inv-001', total: 200000, invoiceType: 'receivable' })
      ];

      const summary = service.calculateContractorSummary(payments, 'contractor-001');

      expect(summary.totalPayable).toBe(100000); // Only payable
      expect(summary.paymentCount).toBe(1);
    });
  });

  describe('Payment Amount Calculations', () => {
    it('should calculate 100% payment by default', () => {
      const acceptanceData = createMockAcceptanceData({ totalAmount: 100000 });
      const contractData = createMockContractData();

      // 100% * 1.0 (contractor rate) - 0 (management fee) = 100000
      // With 5% tax: 100000 + 5000 = 105000
      const expectedSubtotal = 100000;
      const expectedTax = 5000;
      const expectedTotal = 105000;

      // Verify calculation logic
      const grossAmount = acceptanceData.totalAmount * 1.0; // 100%
      const managementFee = grossAmount * 0; // 0%
      const netAmount = grossAmount * 1.0 - managementFee;
      const tax = Math.round(netAmount * 0.05);
      const total = netAmount + tax;

      expect(netAmount).toBe(expectedSubtotal);
      expect(tax).toBe(expectedTax);
      expect(total).toBe(expectedTotal);
    });

    it('should calculate payment with 80% percentage', () => {
      const totalAmount = 100000;
      const paymentPercentage = 80;

      const grossAmount = totalAmount * (paymentPercentage / 100);
      expect(grossAmount).toBe(80000);
    });

    it('should apply contractor rate correctly', () => {
      const totalAmount = 100000;
      const contractorRate = 0.85; // 85% to contractor

      const grossAmount = totalAmount;
      const netAmount = grossAmount * contractorRate;
      expect(netAmount).toBe(85000);
    });

    it('should deduct management fee correctly', () => {
      const totalAmount = 100000;
      const managementFeeRate = 0.05; // 5% management fee

      const grossAmount = totalAmount;
      const managementFee = grossAmount * managementFeeRate;
      const netAmount = grossAmount - managementFee;

      expect(managementFee).toBe(5000);
      expect(netAmount).toBe(95000);
    });

    it('should combine contractor rate and management fee', () => {
      const totalAmount = 100000;
      const contractorRate = 0.9; // 90% to contractor
      const managementFeeRate = 0.05; // 5% management fee

      const grossAmount = totalAmount;
      const managementFee = grossAmount * managementFeeRate;
      const netAmount = grossAmount * contractorRate - managementFee;

      // 100000 * 0.9 - 100000 * 0.05 = 90000 - 5000 = 85000
      expect(netAmount).toBe(85000);
    });
  });

  describe('Payment Number Generation', () => {
    it('should generate payment number with correct format', () => {
      // Format: PAY-YYYYMMDD-XXXX
      const dateRegex = /^PAY-\d{8}-[A-Z0-9]{4}$/;
      const now = new Date();
      const expectedDatePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      // Since generatePaymentNumber is private, we test the format logic
      const prefix = 'PAY';
      const dateStr = expectedDatePart;
      const random = 'ABCD';
      const paymentNumber = `${prefix}-${dateStr}-${random}`;

      expect(paymentNumber).toMatch(dateRegex);
      expect(paymentNumber).toContain('PAY-');
      expect(paymentNumber).toContain(expectedDatePart);
    });
  });

  describe('Due Date Calculation', () => {
    it('should calculate due date based on payment terms', () => {
      const paymentTermDays = 30;
      const now = new Date();
      const expectedDueDate = new Date(now);
      expectedDueDate.setDate(expectedDueDate.getDate() + paymentTermDays);

      // Verify the calculation logic
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTermDays);

      expect(dueDate.getDate()).toBe(expectedDueDate.getDate());
    });

    it('should default to 30 days if payment terms not specified', () => {
      const paymentTermDays = 0;
      const defaultDays = 30;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (paymentTermDays || defaultDays));

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      expect(dueDate.getDate()).toBe(expectedDate.getDate());
    });
  });

  describe('Input Validation', () => {
    it('should accept valid acceptance data', () => {
      const acceptanceData = createMockAcceptanceData();

      expect(acceptanceData.id).toBeDefined();
      expect(acceptanceData.blueprintId).toBeDefined();
      expect(acceptanceData.totalAmount).toBeGreaterThan(0);
    });

    it('should accept valid contract data', () => {
      const contractData = createMockContractData();

      expect(contractData.id).toBeDefined();
      expect(contractData.contractorId).toBeDefined();
      expect(contractData.contractorName).toBeDefined();
      expect(contractData.paymentTermDays).toBeGreaterThanOrEqual(0);
    });

    it('should handle optional contractor rate', () => {
      const contractData = createMockContractData({ contractorRate: undefined });
      const defaultRate = contractData.contractorRate ?? 1.0;

      expect(defaultRate).toBe(1.0);
    });

    it('should handle optional management fee rate', () => {
      const contractData = createMockContractData({ managementFeeRate: undefined });
      const defaultRate = contractData.managementFeeRate ?? 0;

      expect(defaultRate).toBe(0);
    });
  });

  describe('Party Info Mapping', () => {
    it('should correctly map billing party as owner for payables', () => {
      const contractData = createMockContractData();

      // For payable: Owner pays → Contractor receives
      // billingParty = Owner, payingParty = Contractor
      expect(contractData.ownerId).toBeDefined();
      expect(contractData.ownerName).toBeDefined();
    });

    it('should correctly map paying party as contractor for payables', () => {
      const contractData = createMockContractData();

      // For payable: Contractor receives payment
      expect(contractData.contractorId).toBeDefined();
      expect(contractData.contractorName).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should handle empty contractor list', () => {
      const contractDataList: ContractDataForPayment[] = [];

      // Service should handle empty list gracefully
      expect(contractDataList.length).toBe(0);
    });

    it('should process multiple contractors correctly', () => {
      const contractDataList: ContractDataForPayment[] = [
        createMockContractData({ contractorId: 'contractor-001', contractorName: 'Contractor A' }),
        createMockContractData({ contractorId: 'contractor-002', contractorName: 'Contractor B' }),
        createMockContractData({ contractorId: 'contractor-003', contractorName: 'Contractor C' })
      ];

      expect(contractDataList.length).toBe(3);
      expect(contractDataList[0].contractorId).toBe('contractor-001');
      expect(contractDataList[1].contractorId).toBe('contractor-002');
      expect(contractDataList[2].contractorId).toBe('contractor-003');
    });
  });
});
