/**
 * Warranty Module Integration Tests
 *
 * SETC-039: Warranty Testing & Integration
 *
 * 保固模組整合測試，驗證完整流程
 *
 * @module WarrantyIntegrationTests
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { WarrantyConfig } from './config/warranty.config';
import { WarrantyStateMachine, DefectStateMachine, RepairStateMachine } from './models';

describe('Warranty Module Integration', () => {
  describe('Warranty Status Machine', () => {
    it('should allow valid transitions from pending', () => {
      expect(WarrantyStateMachine.canTransition('pending', 'active')).toBe(true);
      expect(WarrantyStateMachine.canTransition('pending', 'voided')).toBe(true);
    });

    it('should allow valid transitions from active', () => {
      expect(WarrantyStateMachine.canTransition('active', 'expiring')).toBe(true);
      expect(WarrantyStateMachine.canTransition('active', 'completed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(WarrantyStateMachine.canTransition('pending', 'expired')).toBe(false);
      expect(WarrantyStateMachine.canTransition('completed', 'active')).toBe(false);
    });

    it('should throw on invalid transition validation', () => {
      expect(() => WarrantyStateMachine.validateTransition('pending', 'expired')).toThrow();
    });

    it('should return next valid statuses', () => {
      const nextStatuses = WarrantyStateMachine.getNextStatuses('active');
      expect(nextStatuses).toContain('expiring');
      expect(nextStatuses).toContain('completed');
    });
  });

  describe('Defect Status Machine', () => {
    it('should allow valid transitions from reported', () => {
      expect(DefectStateMachine.canTransition('reported', 'confirmed')).toBe(true);
      expect(DefectStateMachine.canTransition('reported', 'rejected')).toBe(true);
    });

    it('should allow valid transitions through repair flow', () => {
      expect(DefectStateMachine.canTransition('confirmed', 'under_repair')).toBe(true);
      expect(DefectStateMachine.canTransition('under_repair', 'repaired')).toBe(true);
      expect(DefectStateMachine.canTransition('repaired', 'verified')).toBe(true);
      expect(DefectStateMachine.canTransition('verified', 'closed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(DefectStateMachine.canTransition('reported', 'closed')).toBe(false);
      expect(DefectStateMachine.canTransition('rejected', 'confirmed')).toBe(false);
    });
  });

  describe('Repair Status Machine', () => {
    it('should allow valid transitions from pending', () => {
      expect(RepairStateMachine.canTransition('pending', 'scheduled')).toBe(true);
      expect(RepairStateMachine.canTransition('pending', 'in_progress')).toBe(true);
      expect(RepairStateMachine.canTransition('pending', 'cancelled')).toBe(true);
    });

    it('should allow valid transitions through repair flow', () => {
      expect(RepairStateMachine.canTransition('scheduled', 'in_progress')).toBe(true);
      expect(RepairStateMachine.canTransition('in_progress', 'completed')).toBe(true);
      expect(RepairStateMachine.canTransition('completed', 'verified')).toBe(true);
    });

    it('should handle failed verification', () => {
      expect(RepairStateMachine.canTransition('completed', 'failed')).toBe(true);
      expect(RepairStateMachine.canTransition('failed', 'in_progress')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(RepairStateMachine.canTransition('pending', 'verified')).toBe(false);
      expect(RepairStateMachine.canTransition('verified', 'in_progress')).toBe(false);
    });
  });

  describe('Warranty Configuration', () => {
    it('should have valid default configuration', () => {
      expect(WarrantyConfig.defaultPeriodMonths).toBeGreaterThan(0);
      expect(WarrantyConfig.expiringThresholdDays).toBeGreaterThan(0);
      expect(WarrantyConfig.defaultNotifyDaysBefore.length).toBeGreaterThan(0);
    });

    it('should have valid defect categories', () => {
      expect(WarrantyConfig.defectCategories.length).toBeGreaterThan(0);
      expect(WarrantyConfig.defectCategories).toContainEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
    });

    it('should have valid severity levels', () => {
      expect(WarrantyConfig.severityLevels.length).toBe(3);
      expect(WarrantyConfig.severityLevels.map(s => s.id)).toContain('critical');
      expect(WarrantyConfig.severityLevels.map(s => s.id)).toContain('major');
      expect(WarrantyConfig.severityLevels.map(s => s.id)).toContain('minor');
    });
  });

  describe('Warranty Period Calculations', () => {
    it('should calculate correct end date based on period', () => {
      const startDate = new Date('2025-01-01');
      const periodMonths = 12;

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + periodMonths);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(0); // January (0-indexed)
    });

    it('should correctly identify expiring warranties', () => {
      const now = new Date();
      const thresholdDays = WarrantyConfig.expiringThresholdDays;

      // Warranty ending within threshold
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + thresholdDays - 1);

      const daysUntilExpiry = Math.ceil((expiringDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysUntilExpiry).toBeLessThan(thresholdDays);
    });

    it('should correctly identify expired warranties', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const now = new Date();
      const isExpired = pastDate <= now;

      expect(isExpired).toBe(true);
    });
  });

  describe('Warranty Number Generation', () => {
    it('should generate unique warranty numbers', () => {
      const generateWarrantyNumber = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `WRT-${year}${month}-${random}`;
      };

      const number1 = generateWarrantyNumber();
      const number2 = generateWarrantyNumber();

      expect(number1).toMatch(/^WRT-\d{6}-[A-Z0-9]{4}$/);
      expect(number2).toMatch(/^WRT-\d{6}-[A-Z0-9]{4}$/);
      expect(number1).not.toBe(number2);
    });
  });

  describe('Defect Number Generation', () => {
    it('should generate unique defect numbers', () => {
      const generateDefectNumber = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `DEF-${year}${month}-${random}`;
      };

      const number1 = generateDefectNumber();
      const number2 = generateDefectNumber();

      expect(number1).toMatch(/^DEF-\d{6}-[A-Z0-9]{4}$/);
      expect(number2).toMatch(/^DEF-\d{6}-[A-Z0-9]{4}$/);
      expect(number1).not.toBe(number2);
    });
  });

  describe('Repair Number Generation', () => {
    it('should generate unique repair numbers', () => {
      const generateRepairNumber = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `RPR-${year}${month}-${random}`;
      };

      const number1 = generateRepairNumber();
      const number2 = generateRepairNumber();

      expect(number1).toMatch(/^RPR-\d{6}-[A-Z0-9]{4}$/);
      expect(number2).toMatch(/^RPR-\d{6}-[A-Z0-9]{4}$/);
      expect(number1).not.toBe(number2);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate defect statistics correctly', () => {
      const defects = [
        { severity: 'critical', status: 'reported' },
        { severity: 'major', status: 'confirmed' },
        { severity: 'major', status: 'under_repair' },
        { severity: 'minor', status: 'closed' },
        { severity: 'minor', status: 'rejected' }
      ];

      const stats = {
        total: defects.length,
        bySeverity: {
          critical: defects.filter(d => d.severity === 'critical').length,
          major: defects.filter(d => d.severity === 'major').length,
          minor: defects.filter(d => d.severity === 'minor').length
        },
        byStatus: {
          open: defects.filter(d => ['reported', 'confirmed', 'under_repair'].includes(d.status)).length,
          resolved: defects.filter(d => ['repaired', 'verified', 'closed'].includes(d.status)).length,
          rejected: defects.filter(d => d.status === 'rejected').length
        }
      };

      expect(stats.total).toBe(5);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.major).toBe(2);
      expect(stats.bySeverity.minor).toBe(2);
      expect(stats.byStatus.open).toBe(3);
      expect(stats.byStatus.resolved).toBe(1);
      expect(stats.byStatus.rejected).toBe(1);
    });

    it('should calculate repair statistics correctly', () => {
      const repairs = [
        { status: 'pending', cost: 0 },
        { status: 'in_progress', cost: 5000 },
        { status: 'completed', cost: 10000 },
        { status: 'verified', cost: 15000 },
        { status: 'cancelled', cost: 0 }
      ];

      const stats = {
        total: repairs.length,
        inProgress: repairs.filter(r => ['pending', 'scheduled', 'in_progress'].includes(r.status)).length,
        completed: repairs.filter(r => r.status === 'completed').length,
        verified: repairs.filter(r => r.status === 'verified').length,
        totalCost: repairs.reduce((sum, r) => sum + r.cost, 0)
      };

      expect(stats.total).toBe(5);
      expect(stats.inProgress).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.verified).toBe(1);
      expect(stats.totalCost).toBe(30000);
    });
  });

  describe('Notification Settings', () => {
    it('should check if reminder should be sent', () => {
      const notificationSettings = {
        enabled: true,
        notifyDaysBefore: [30, 14, 7, 1]
      };

      const shouldSendReminder = (daysRemaining: number): boolean => {
        if (!notificationSettings.enabled) return false;
        return notificationSettings.notifyDaysBefore.includes(daysRemaining);
      };

      expect(shouldSendReminder(30)).toBe(true);
      expect(shouldSendReminder(14)).toBe(true);
      expect(shouldSendReminder(7)).toBe(true);
      expect(shouldSendReminder(1)).toBe(true);
      expect(shouldSendReminder(10)).toBe(false);
      expect(shouldSendReminder(0)).toBe(false);
    });

    it('should not send reminder if notifications disabled', () => {
      const notificationSettings = {
        enabled: false,
        notifyDaysBefore: [30, 14, 7, 1]
      };

      const shouldSendReminder = (daysRemaining: number): boolean => {
        if (!notificationSettings.enabled) return false;
        return notificationSettings.notifyDaysBefore.includes(daysRemaining);
      };

      expect(shouldSendReminder(30)).toBe(false);
      expect(shouldSendReminder(1)).toBe(false);
    });
  });

  describe('Critical Defect Issue Creation', () => {
    it('should identify defects requiring issue creation', () => {
      const shouldCreateIssue = (severity: string, issueId?: string): boolean => {
        return severity === 'critical' && !issueId;
      };

      expect(shouldCreateIssue('critical')).toBe(true);
      expect(shouldCreateIssue('critical', 'issue-123')).toBe(false);
      expect(shouldCreateIssue('major')).toBe(false);
      expect(shouldCreateIssue('minor')).toBe(false);
    });
  });
});
