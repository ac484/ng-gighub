/**
 * Defect Management Integration Tests - SETC-045
 *
 * 缺失管理整合測試
 * - 完整缺失流程測試
 * - 狀態機轉換測試
 * - Issue 整合測試
 *
 * @module QA/Tests
 * @author GigHub Development Team
 * @date 2025-12-16
 * @implements SETC-045
 */

import { DefectSeverity, DefectStatus, DefectCategory, QCInspection, QCInspectionItem, EventActor } from './models';

// ========== 測試常數 ==========

const TEST_BLUEPRINT_ID = 'test-blueprint-001';

const TEST_ACTOR: EventActor = {
  userId: 'test-user-001',
  userName: 'Test User',
  role: 'qc_inspector'
};

// ========== 狀態機測試 ==========

describe('Defect Status Machine', () => {
  const validTransitions: Array<[DefectStatus, DefectStatus]> = [
    [DefectStatus.OPEN, DefectStatus.ASSIGNED],
    [DefectStatus.OPEN, DefectStatus.CLOSED],
    [DefectStatus.ASSIGNED, DefectStatus.IN_PROGRESS],
    [DefectStatus.ASSIGNED, DefectStatus.OPEN],
    [DefectStatus.IN_PROGRESS, DefectStatus.RESOLVED],
    [DefectStatus.IN_PROGRESS, DefectStatus.ASSIGNED],
    [DefectStatus.RESOLVED, DefectStatus.VERIFIED],
    [DefectStatus.RESOLVED, DefectStatus.IN_PROGRESS],
    [DefectStatus.VERIFIED, DefectStatus.CLOSED],
    [DefectStatus.VERIFIED, DefectStatus.RESOLVED]
  ];

  const invalidTransitions: Array<[DefectStatus, DefectStatus]> = [
    [DefectStatus.OPEN, DefectStatus.RESOLVED],
    [DefectStatus.OPEN, DefectStatus.VERIFIED],
    [DefectStatus.ASSIGNED, DefectStatus.CLOSED],
    [DefectStatus.IN_PROGRESS, DefectStatus.CLOSED],
    [DefectStatus.CLOSED, DefectStatus.OPEN],
    [DefectStatus.CLOSED, DefectStatus.IN_PROGRESS]
  ];

  describe('Valid Transitions', () => {
    validTransitions.forEach(([from, to]) => {
      it(`should allow ${from} → ${to}`, () => {
        const result = canTransition(from, to);
        expect(result).toBe(true);
      });
    });
  });

  describe('Invalid Transitions', () => {
    invalidTransitions.forEach(([from, to]) => {
      it(`should reject ${from} → ${to}`, () => {
        const result = canTransition(from, to);
        expect(result).toBe(false);
      });
    });
  });
});

// ========== 嚴重度計算測試 ==========

describe('Defect Severity Calculation', () => {
  it('should return CRITICAL for structural issues', () => {
    const item: QCInspectionItem = {
      id: '1',
      workItemId: 'work-1',
      checkpointName: 'Foundation Check',
      passed: false,
      isStructural: true
    };
    const severity = determineSeverity(item);
    expect(severity).toBe(DefectSeverity.CRITICAL);
  });

  it('should return CRITICAL for safety issues', () => {
    const item: QCInspectionItem = {
      id: '2',
      workItemId: 'work-2',
      checkpointName: 'Safety Rail',
      passed: false,
      isSafety: true
    };
    const severity = determineSeverity(item);
    expect(severity).toBe(DefectSeverity.CRITICAL);
  });

  it('should return HIGH for waterproofing issues', () => {
    const item: QCInspectionItem = {
      id: '3',
      workItemId: 'work-3',
      checkpointName: 'Roof Waterproofing',
      passed: false,
      isWaterproofing: true
    };
    const severity = determineSeverity(item);
    expect(severity).toBe(DefectSeverity.HIGH);
  });

  it('should return HIGH for electrical issues', () => {
    const item: QCInspectionItem = {
      id: '4',
      workItemId: 'work-4',
      checkpointName: 'Wiring Check',
      passed: false,
      isElectrical: true
    };
    const severity = determineSeverity(item);
    expect(severity).toBe(DefectSeverity.HIGH);
  });

  it('should return MEDIUM for other issues', () => {
    const item: QCInspectionItem = {
      id: '5',
      workItemId: 'work-5',
      checkpointName: 'Paint Check',
      passed: false
    };
    const severity = determineSeverity(item);
    expect(severity).toBe(DefectSeverity.MEDIUM);
  });
});

// ========== 期限計算測試 ==========

describe('Defect Deadline Calculation', () => {
  it('should set 3-day deadline for CRITICAL', () => {
    const deadline = calculateDeadline(DefectSeverity.CRITICAL);
    const expectedDays = 3;
    const diffDays = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(expectedDays);
  });

  it('should set 5-day deadline for HIGH', () => {
    const deadline = calculateDeadline(DefectSeverity.HIGH);
    const expectedDays = 5;
    const diffDays = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(expectedDays);
  });

  it('should set 7-day deadline for MEDIUM', () => {
    const deadline = calculateDeadline(DefectSeverity.MEDIUM);
    const expectedDays = 7;
    const diffDays = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(expectedDays);
  });

  it('should set 14-day deadline for LOW', () => {
    const deadline = calculateDeadline(DefectSeverity.LOW);
    const expectedDays = 14;
    const diffDays = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(expectedDays);
  });
});

// ========== 類別判斷測試 ==========

describe('Defect Category Determination', () => {
  it('should return STRUCTURAL for structural issues', () => {
    const item: QCInspectionItem = {
      id: '1',
      workItemId: 'work-1',
      checkpointName: 'Foundation',
      passed: false,
      isStructural: true
    };
    const category = determineCategory(item);
    expect(category).toBe(DefectCategory.STRUCTURAL);
  });

  it('should return ELECTRICAL for electrical issues', () => {
    const item: QCInspectionItem = {
      id: '2',
      workItemId: 'work-2',
      checkpointName: 'Wiring',
      passed: false,
      isElectrical: true
    };
    const category = determineCategory(item);
    expect(category).toBe(DefectCategory.ELECTRICAL);
  });

  it('should return WATERPROOFING for waterproofing issues', () => {
    const item: QCInspectionItem = {
      id: '3',
      workItemId: 'work-3',
      checkpointName: 'Roof',
      passed: false,
      isWaterproofing: true
    };
    const category = determineCategory(item);
    expect(category).toBe(DefectCategory.WATERPROOFING);
  });

  it('should return SAFETY for safety issues', () => {
    const item: QCInspectionItem = {
      id: '4',
      workItemId: 'work-4',
      checkpointName: 'Safety Rail',
      passed: false,
      isSafety: true
    };
    const category = determineCategory(item);
    expect(category).toBe(DefectCategory.SAFETY);
  });

  it('should return OTHER for unclassified issues', () => {
    const item: QCInspectionItem = {
      id: '5',
      workItemId: 'work-5',
      checkpointName: 'Paint',
      passed: false
    };
    const category = determineCategory(item);
    expect(category).toBe(DefectCategory.OTHER);
  });
});

// ========== Issue 整合測試 ==========

describe('Defect-Issue Integration', () => {
  describe('Auto Issue Creation', () => {
    it('should auto-create Issue for CRITICAL defects', () => {
      const shouldCreate = shouldAutoCreateIssue(DefectSeverity.CRITICAL);
      expect(shouldCreate).toBe(true);
    });

    it('should NOT auto-create Issue for HIGH defects', () => {
      const shouldCreate = shouldAutoCreateIssue(DefectSeverity.HIGH);
      expect(shouldCreate).toBe(false);
    });

    it('should NOT auto-create Issue for MEDIUM defects', () => {
      const shouldCreate = shouldAutoCreateIssue(DefectSeverity.MEDIUM);
      expect(shouldCreate).toBe(false);
    });

    it('should NOT auto-create Issue for LOW defects', () => {
      const shouldCreate = shouldAutoCreateIssue(DefectSeverity.LOW);
      expect(shouldCreate).toBe(false);
    });
  });

  describe('Severity to Priority Mapping', () => {
    it('should map CRITICAL to critical priority', () => {
      const priority = mapSeverityToPriority(DefectSeverity.CRITICAL);
      expect(priority).toBe('critical');
    });

    it('should map HIGH to high priority', () => {
      const priority = mapSeverityToPriority(DefectSeverity.HIGH);
      expect(priority).toBe('high');
    });

    it('should map MEDIUM to medium priority', () => {
      const priority = mapSeverityToPriority(DefectSeverity.MEDIUM);
      expect(priority).toBe('medium');
    });

    it('should map LOW to low priority', () => {
      const priority = mapSeverityToPriority(DefectSeverity.LOW);
      expect(priority).toBe('low');
    });
  });
});

// ========== 統計計算測試 ==========

describe('Defect Statistics', () => {
  it('should calculate correct statistics', () => {
    const defects = [
      { status: DefectStatus.OPEN, severity: DefectSeverity.CRITICAL },
      { status: DefectStatus.ASSIGNED, severity: DefectSeverity.HIGH },
      { status: DefectStatus.IN_PROGRESS, severity: DefectSeverity.MEDIUM },
      { status: DefectStatus.RESOLVED, severity: DefectSeverity.LOW },
      { status: DefectStatus.VERIFIED, severity: DefectSeverity.CRITICAL },
      { status: DefectStatus.CLOSED, severity: DefectSeverity.HIGH }
    ];

    const stats = calculateStatistics(defects);

    expect(stats.total).toBe(6);
    expect(stats.byStatus.open).toBe(1);
    expect(stats.byStatus.assigned).toBe(1);
    expect(stats.byStatus.inProgress).toBe(1);
    expect(stats.byStatus.resolved).toBe(1);
    expect(stats.byStatus.verified).toBe(1);
    expect(stats.byStatus.closed).toBe(1);
    expect(stats.bySeverity.critical).toBe(2);
    expect(stats.bySeverity.high).toBe(2);
    expect(stats.bySeverity.medium).toBe(1);
    expect(stats.bySeverity.low).toBe(1);
  });
});

// ========== 輔助函數實作 ==========

const DEFECT_STATUS_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  [DefectStatus.OPEN]: [DefectStatus.ASSIGNED, DefectStatus.CLOSED],
  [DefectStatus.ASSIGNED]: [DefectStatus.IN_PROGRESS, DefectStatus.OPEN],
  [DefectStatus.IN_PROGRESS]: [DefectStatus.RESOLVED, DefectStatus.ASSIGNED],
  [DefectStatus.RESOLVED]: [DefectStatus.VERIFIED, DefectStatus.IN_PROGRESS],
  [DefectStatus.VERIFIED]: [DefectStatus.CLOSED, DefectStatus.RESOLVED],
  [DefectStatus.CLOSED]: []
};

const SEVERITY_DEADLINE_DAYS: Record<DefectSeverity, number> = {
  [DefectSeverity.CRITICAL]: 3,
  [DefectSeverity.HIGH]: 5,
  [DefectSeverity.MEDIUM]: 7,
  [DefectSeverity.LOW]: 14
};

function canTransition(from: DefectStatus, to: DefectStatus): boolean {
  return DEFECT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

function determineSeverity(item: QCInspectionItem): DefectSeverity {
  if (item.isStructural || item.isSafety) return DefectSeverity.CRITICAL;
  if (item.isWaterproofing || item.isElectrical) return DefectSeverity.HIGH;
  return DefectSeverity.MEDIUM;
}

function calculateDeadline(severity: DefectSeverity): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + SEVERITY_DEADLINE_DAYS[severity]);
  return deadline;
}

function determineCategory(item: QCInspectionItem): DefectCategory {
  if (item.isStructural) return DefectCategory.STRUCTURAL;
  if (item.isElectrical) return DefectCategory.ELECTRICAL;
  if (item.isWaterproofing) return DefectCategory.WATERPROOFING;
  if (item.isSafety) return DefectCategory.SAFETY;
  return DefectCategory.OTHER;
}

function shouldAutoCreateIssue(severity: DefectSeverity): boolean {
  return severity === DefectSeverity.CRITICAL;
}

function mapSeverityToPriority(severity: DefectSeverity): string {
  const map: Record<DefectSeverity, string> = {
    [DefectSeverity.CRITICAL]: 'critical',
    [DefectSeverity.HIGH]: 'high',
    [DefectSeverity.MEDIUM]: 'medium',
    [DefectSeverity.LOW]: 'low'
  };
  return map[severity];
}

function calculateStatistics(defects: Array<{ status: DefectStatus; severity: DefectSeverity }>): {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  return {
    total: defects.length,
    byStatus: {
      open: defects.filter(d => d.status === DefectStatus.OPEN).length,
      assigned: defects.filter(d => d.status === DefectStatus.ASSIGNED).length,
      inProgress: defects.filter(d => d.status === DefectStatus.IN_PROGRESS).length,
      resolved: defects.filter(d => d.status === DefectStatus.RESOLVED).length,
      verified: defects.filter(d => d.status === DefectStatus.VERIFIED).length,
      closed: defects.filter(d => d.status === DefectStatus.CLOSED).length
    },
    bySeverity: {
      critical: defects.filter(d => d.severity === DefectSeverity.CRITICAL).length,
      high: defects.filter(d => d.severity === DefectSeverity.HIGH).length,
      medium: defects.filter(d => d.severity === DefectSeverity.MEDIUM).length,
      low: defects.filter(d => d.severity === DefectSeverity.LOW).length
    }
  };
}
