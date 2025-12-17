/**
 * Enhanced Parsing Converter Unit Tests
 * SETC-018 Phase 3.2: Unit Tests
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import {
  toContractCreateRequest,
  toWorkItemCreateRequests,
  isEnhancedParsingOutput,
  validateFinancialCalculation,
  calculateTotalAmount,
  type EnhancedContractParsingOutput,
  type EnhancedWorkItemSchema
} from './enhanced-parsing-converter';

describe('EnhancedParsingConverter', () => {
  // Test data
  const mockEnhancedOutput: EnhancedContractParsingOutput = {
    contractNumber: 'PO-4510250181',
    title: 'XX工程專案合約',
    description: '工程施工合約',
    owner: {
      name: '台灣營造股份有限公司',
      type: 'owner',
      contactPerson: '王大明',
      contactPhone: '02-12345678',
      contactEmail: 'wang@example.com',
      address: '台北市中正區XX路XX號',
      taxId: '12345678',
      businessNumber: '87654321'
    },
    contractor: {
      name: '承包商股份有限公司',
      type: 'contractor',
      contactPerson: '李小華',
      contactPhone: '02-87654321',
      contactEmail: 'li@contractor.com',
      address: '新北市板橋區YY路YY號',
      taxId: '87654321'
    },
    totalAmount: 1500000,
    currency: 'TWD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    signedDate: '2023-12-15',
    workItems: [
      {
        code: 'A001',
        title: '基礎工程',
        description: '地基打樁工程',
        quantity: 1,
        unit: '式',
        unitPrice: 500000,
        totalPrice: 500000,
        category: 'foundation'
      },
      {
        code: 'B001',
        title: '結構工程',
        description: '鋼筋混凝土結構',
        quantity: 10,
        unit: '組',
        unitPrice: 100000,
        totalPrice: 1000000,
        category: 'structure'
      }
    ],
    terms: [
      {
        category: 'payment',
        title: '付款條款',
        content: '訂金30%，進度款50%，驗收款20%',
        order: 1
      },
      {
        category: 'warranty',
        title: '保固條款',
        content: '保固期一年',
        order: 2
      }
    ],
    paymentTerms: '訂金30%，進度款50%，驗收款20%',
    warrantyPeriod: '一年'
  };

  describe('toContractCreateRequest', () => {
    it('should convert enhanced output to CreateContractDto', () => {
      const blueprintId = 'blueprint-123';
      const createdBy = 'user-456';

      const result = toContractCreateRequest(mockEnhancedOutput, blueprintId, createdBy);

      expect(result).toBeDefined();
      expect(result.blueprintId).toBe(blueprintId);
      expect(result.contractNumber).toBe('PO-4510250181');
      expect(result.title).toBe('XX工程專案合約');
      expect(result.description).toBe('工程施工合約');
      expect(result.totalAmount).toBe(1500000);
      expect(result.currency).toBe('TWD');
      expect(result.createdBy).toBe(createdBy);
    });

    it('should convert owner party with all fields', () => {
      const result = toContractCreateRequest(mockEnhancedOutput, 'bp-1', 'user-1');

      expect(result.owner).toBeDefined();
      expect(result.owner.id).toBeDefined(); // UUID generated
      expect(result.owner.name).toBe('台灣營造股份有限公司');
      expect(result.owner.type).toBe('owner');
      expect(result.owner.contactPerson).toBe('王大明');
      expect(result.owner.contactPhone).toBe('02-12345678');
      expect(result.owner.contactEmail).toBe('wang@example.com');
      expect(result.owner.address).toBe('台北市中正區XX路XX號');
      expect(result.owner.taxId).toBe('12345678');
      expect(result.owner.businessNumber).toBe('87654321');
    });

    it('should convert contractor party with all fields', () => {
      const result = toContractCreateRequest(mockEnhancedOutput, 'bp-1', 'user-1');

      expect(result.contractor).toBeDefined();
      expect(result.contractor.id).toBeDefined(); // UUID generated
      expect(result.contractor.name).toBe('承包商股份有限公司');
      expect(result.contractor.type).toBe('contractor');
      expect(result.contractor.contactPerson).toBe('李小華');
      expect(result.contractor.contactPhone).toBe('02-87654321');
      expect(result.contractor.contactEmail).toBe('li@contractor.com');
      expect(result.contractor.address).toBe('新北市板橋區YY路YY號');
      expect(result.contractor.taxId).toBe('87654321');
    });

    it('should parse ISO 8601 dates correctly', () => {
      const result = toContractCreateRequest(mockEnhancedOutput, 'bp-1', 'user-1');

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate.getFullYear()).toBe(2024);
      expect(result.startDate.getMonth()).toBe(0); // January
      expect(result.startDate.getDate()).toBe(1);

      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.endDate.getFullYear()).toBe(2024);
      expect(result.endDate.getMonth()).toBe(11); // December
      expect(result.endDate.getDate()).toBe(31);

      expect(result.signedDate).toBeInstanceOf(Date);
      expect(result.signedDate?.getFullYear()).toBe(2023);
    });

    it('should convert terms with UUIDs', () => {
      const result = toContractCreateRequest(mockEnhancedOutput, 'bp-1', 'user-1');

      expect(result.terms).toBeDefined();
      expect(result.terms).toHaveLength(2);
      expect(result.terms![0].id).toBeDefined(); // UUID generated
      expect(result.terms![0].category).toBe('payment');
      expect(result.terms![0].title).toBe('付款條款');
      expect(result.terms![0].content).toBe('訂金30%，進度款50%，驗收款20%');
      expect(result.terms![0].order).toBe(1);
    });

    it('should default currency to TWD when missing', () => {
      const outputWithoutCurrency = { ...mockEnhancedOutput, currency: '' };
      const result = toContractCreateRequest(outputWithoutCurrency, 'bp-1', 'user-1');

      expect(result.currency).toBe('TWD');
    });

    it('should handle missing optional fields', () => {
      const minimalOutput: EnhancedContractParsingOutput = {
        contractNumber: 'C-001',
        title: 'Test Contract',
        owner: {
          name: 'Owner Inc.',
          type: 'owner',
          contactPerson: 'John Doe',
          contactPhone: '123-456-7890',
          contactEmail: 'john@owner.com'
        },
        contractor: {
          name: 'Contractor Inc.',
          type: 'contractor',
          contactPerson: 'Jane Smith',
          contactPhone: '098-765-4321',
          contactEmail: 'jane@contractor.com'
        },
        totalAmount: 100000,
        currency: 'USD',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        workItems: []
      };

      const result = toContractCreateRequest(minimalOutput, 'bp-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.description).toBeUndefined();
      expect(result.signedDate).toBeUndefined();
      expect(result.terms).toBeUndefined();
      expect(result.owner.address).toBeUndefined();
      expect(result.owner.taxId).toBeUndefined();
    });

    it('should throw error for invalid date format', () => {
      const invalidDateOutput = {
        ...mockEnhancedOutput,
        startDate: 'invalid-date'
      };

      expect(() => {
        toContractCreateRequest(invalidDateOutput, 'bp-1', 'user-1');
      }).toThrow('Invalid date format');
    });
  });

  describe('toWorkItemCreateRequests', () => {
    it('should convert work items to CreateWorkItemDto array', () => {
      const result = toWorkItemCreateRequests(mockEnhancedOutput.workItems);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('A001');
      expect(result[0].name).toBe('基礎工程');
      expect(result[0].description).toBe('地基打樁工程');
      expect(result[0].unit).toBe('式');
      expect(result[0].quantity).toBe(1);
      expect(result[0].unitPrice).toBe(500000);
      expect(result[0].category).toBe('foundation');
    });

    it('should use title as description when description is missing', () => {
      const workItemsWithoutDesc: EnhancedWorkItemSchema[] = [
        {
          code: 'X001',
          title: 'Test Item',
          description: '',
          quantity: 5,
          unit: 'EA',
          unitPrice: 1000,
          totalPrice: 5000
        }
      ];

      const result = toWorkItemCreateRequests(workItemsWithoutDesc);

      expect(result[0].description).toBe('Test Item');
    });

    it('should handle empty work items array', () => {
      const result = toWorkItemCreateRequests([]);
      expect(result).toHaveLength(0);
    });

    it('should handle work items with all optional fields', () => {
      const fullWorkItem: EnhancedWorkItemSchema = {
        code: 'F001',
        title: 'Full Item',
        description: 'Full description',
        quantity: 10,
        unit: '組',
        unitPrice: 50000,
        totalPrice: 500000,
        discount: 10000,
        category: 'misc',
        remarks: 'Test remarks'
      };

      const result = toWorkItemCreateRequests([fullWorkItem]);

      expect(result[0].code).toBe('F001');
      expect(result[0].name).toBe('Full Item');
      expect(result[0].category).toBe('misc');
    });
  });

  describe('isEnhancedParsingOutput', () => {
    it('should return true for valid enhanced parsing output', () => {
      expect(isEnhancedParsingOutput(mockEnhancedOutput)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isEnhancedParsingOutput(null)).toBe(false);
      expect(isEnhancedParsingOutput(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isEnhancedParsingOutput('string')).toBe(false);
      expect(isEnhancedParsingOutput(123)).toBe(false);
      expect(isEnhancedParsingOutput(true)).toBe(false);
    });

    it('should return false when missing critical fields', () => {
      const incomplete = { ...mockEnhancedOutput };
      delete (incomplete as any).contractNumber;
      expect(isEnhancedParsingOutput(incomplete)).toBe(false);
    });

    it('should return false when critical field has wrong type', () => {
      const wrongType = { ...mockEnhancedOutput, totalAmount: 'not-a-number' };
      expect(isEnhancedParsingOutput(wrongType)).toBe(false);
    });

    it('should return false when owner is missing required fields', () => {
      const invalidOwner = {
        ...mockEnhancedOutput,
        owner: { name: 'Owner Inc.' } // Missing other required fields
      };
      expect(isEnhancedParsingOutput(invalidOwner)).toBe(false);
    });

    it('should return false when workItems is not an array', () => {
      const invalidWorkItems = { ...mockEnhancedOutput, workItems: 'not-an-array' };
      expect(isEnhancedParsingOutput(invalidWorkItems)).toBe(false);
    });

    it('should return true even when optional fields are missing', () => {
      const minimalValid = {
        contractNumber: 'C-001',
        title: 'Test',
        totalAmount: 100000,
        currency: 'TWD',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        owner: {
          name: 'Owner',
          contactPerson: 'John',
          contactPhone: '123',
          contactEmail: 'john@example.com'
        },
        contractor: {
          name: 'Contractor',
          contactPerson: 'Jane',
          contactPhone: '456',
          contactEmail: 'jane@example.com'
        },
        workItems: []
      };

      expect(isEnhancedParsingOutput(minimalValid)).toBe(true);
    });
  });

  describe('calculateTotalAmount', () => {
    it('should calculate total from work items', () => {
      const result = calculateTotalAmount(mockEnhancedOutput.workItems);
      expect(result).toBe(1500000); // 500000 + 1000000
    });

    it('should use totalPrice when available', () => {
      const workItems: EnhancedWorkItemSchema[] = [
        {
          code: 'A',
          title: 'Item A',
          description: 'Desc A',
          quantity: 10,
          unit: 'EA',
          unitPrice: 1000,
          totalPrice: 12000 // Different from quantity * unitPrice
        }
      ];

      const result = calculateTotalAmount(workItems);
      expect(result).toBe(12000);
    });

    it('should calculate from quantity and unitPrice when totalPrice missing', () => {
      const workItems: EnhancedWorkItemSchema[] = [
        {
          code: 'B',
          title: 'Item B',
          description: 'Desc B',
          quantity: 5,
          unit: 'SET',
          unitPrice: 2000,
          totalPrice: 0
        }
      ];

      const result = calculateTotalAmount(workItems);
      expect(result).toBe(10000); // 5 * 2000
    });

    it('should subtract discount when provided', () => {
      const workItems: EnhancedWorkItemSchema[] = [
        {
          code: 'C',
          title: 'Item C',
          description: 'Desc C',
          quantity: 1,
          unit: '式',
          unitPrice: 100000,
          totalPrice: 100000,
          discount: 10000
        }
      ];

      const result = calculateTotalAmount(workItems);
      expect(result).toBe(90000); // 100000 - 10000
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalAmount([])).toBe(0);
    });
  });

  describe('validateFinancialCalculation', () => {
    it('should validate when amounts match exactly', () => {
      const result = validateFinancialCalculation(1500000, mockEnhancedOutput.workItems);

      expect(result.valid).toBe(true);
      expect(result.calculatedTotal).toBe(1500000);
      expect(result.difference).toBe(0);
    });

    it('should validate when difference is within tolerance', () => {
      const result = validateFinancialCalculation(1500001, mockEnhancedOutput.workItems, 2);

      expect(result.valid).toBe(true);
      expect(result.calculatedTotal).toBe(1500000);
      expect(result.difference).toBe(1);
    });

    it('should fail validation when difference exceeds tolerance', () => {
      const result = validateFinancialCalculation(1510000, mockEnhancedOutput.workItems, 1000);

      expect(result.valid).toBe(false);
      expect(result.calculatedTotal).toBe(1500000);
      expect(result.difference).toBe(10000);
    });

    it('should use default tolerance of 1', () => {
      const result = validateFinancialCalculation(1500002, mockEnhancedOutput.workItems);

      expect(result.valid).toBe(false);
      expect(result.difference).toBe(2);
    });

    it('should handle negative differences', () => {
      const result = validateFinancialCalculation(1499999, mockEnhancedOutput.workItems);

      expect(result.valid).toBe(false);
      expect(result.difference).toBe(1); // Absolute value
    });

    it('should work with custom tolerance', () => {
      const result = validateFinancialCalculation(1505000, mockEnhancedOutput.workItems, 10000);

      expect(result.valid).toBe(true);
      expect(result.difference).toBe(5000);
    });
  });
});
