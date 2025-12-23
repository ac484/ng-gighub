/**
 * Warranty Status Machine - 保固狀態機
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 定義保固、缺失、維修的狀態轉換邏輯
 *
 * @module WarrantyStatusMachine
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { WarrantyDefectStatus } from './warranty-defect.model';
import type { RepairStatus } from './warranty-repair.model';
import type { WarrantyStatus } from './warranty.model';

/**
 * 保固狀態轉換規則
 */
const WarrantyTransitions: Record<WarrantyStatus, WarrantyStatus[]> = {
  pending: ['active', 'voided'],
  active: ['expiring', 'completed', 'voided'],
  expiring: ['active', 'expired', 'completed'],
  expired: ['completed'],
  completed: [],
  voided: []
};

/**
 * 缺失狀態轉換規則
 */
const DefectTransitions: Record<WarrantyDefectStatus, WarrantyDefectStatus[]> = {
  reported: ['confirmed', 'rejected'],
  confirmed: ['under_repair'],
  under_repair: ['repaired'],
  repaired: ['verified', 'under_repair'],
  verified: ['closed'],
  closed: [],
  rejected: []
};

/**
 * 維修狀態轉換規則
 */
const RepairTransitions: Record<RepairStatus, RepairStatus[]> = {
  pending: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['verified', 'failed'],
  verified: [],
  failed: ['in_progress'],
  cancelled: []
};

/**
 * 狀態轉換錯誤
 */
export class WarrantyStatusError extends Error {
  constructor(
    message: string,
    public readonly details: {
      type: 'warranty' | 'defect' | 'repair';
      from: string;
      to: string;
      allowed: string[];
    }
  ) {
    super(message);
    this.name = 'WarrantyStatusError';
  }
}

/**
 * 保固狀態機
 */
export class WarrantyStateMachine {
  /**
   * 檢查保固狀態是否可轉換
   */
  static canTransition(from: WarrantyStatus, to: WarrantyStatus): boolean {
    return WarrantyTransitions[from]?.includes(to) ?? false;
  }

  /**
   * 驗證保固狀態轉換
   */
  static validateTransition(from: WarrantyStatus, to: WarrantyStatus): void {
    if (!this.canTransition(from, to)) {
      throw new WarrantyStatusError(`Invalid warranty transition from ${from} to ${to}`, {
        type: 'warranty',
        from,
        to,
        allowed: WarrantyTransitions[from] ?? []
      });
    }
  }

  /**
   * 取得可用的保固狀態轉換
   */
  static getAvailableTransitions(status: WarrantyStatus): WarrantyStatus[] {
    return WarrantyTransitions[status] ?? [];
  }

  /**
   * 檢查是否為終止狀態
   */
  static isTerminalStatus(status: WarrantyStatus): boolean {
    return status === 'completed' || status === 'voided';
  }

  /**
   * 檢查是否為活動狀態
   */
  static isActiveStatus(status: WarrantyStatus): boolean {
    return status === 'active' || status === 'expiring';
  }

  /**
   * 取得保固狀態顯示名稱
   */
  static getDisplayName(status: WarrantyStatus): string {
    const names: Record<WarrantyStatus, string> = {
      pending: '待生效',
      active: '進行中',
      expiring: '即將到期',
      expired: '已到期',
      completed: '已結案',
      voided: '已作廢'
    };
    return names[status] ?? status;
  }
}

/**
 * 缺失狀態機
 */
export class DefectStateMachine {
  /**
   * 檢查缺失狀態是否可轉換
   */
  static canTransition(from: WarrantyDefectStatus, to: WarrantyDefectStatus): boolean {
    return DefectTransitions[from]?.includes(to) ?? false;
  }

  /**
   * 驗證缺失狀態轉換
   */
  static validateTransition(from: WarrantyDefectStatus, to: WarrantyDefectStatus): void {
    if (!this.canTransition(from, to)) {
      throw new WarrantyStatusError(`Invalid defect transition from ${from} to ${to}`, {
        type: 'defect',
        from,
        to,
        allowed: DefectTransitions[from] ?? []
      });
    }
  }

  /**
   * 取得可用的缺失狀態轉換
   */
  static getAvailableTransitions(status: WarrantyDefectStatus): WarrantyDefectStatus[] {
    return DefectTransitions[status] ?? [];
  }

  /**
   * 檢查是否為終止狀態
   */
  static isTerminalStatus(status: WarrantyDefectStatus): boolean {
    return status === 'closed' || status === 'rejected';
  }

  /**
   * 檢查是否正在處理
   */
  static isInProgress(status: WarrantyDefectStatus): boolean {
    return status === 'confirmed' || status === 'under_repair' || status === 'repaired';
  }
}

/**
 * 維修狀態機
 */
export class RepairStateMachine {
  /**
   * 檢查維修狀態是否可轉換
   */
  static canTransition(from: RepairStatus, to: RepairStatus): boolean {
    return RepairTransitions[from]?.includes(to) ?? false;
  }

  /**
   * 驗證維修狀態轉換
   */
  static validateTransition(from: RepairStatus, to: RepairStatus): void {
    if (!this.canTransition(from, to)) {
      throw new WarrantyStatusError(`Invalid repair transition from ${from} to ${to}`, {
        type: 'repair',
        from,
        to,
        allowed: RepairTransitions[from] ?? []
      });
    }
  }

  /**
   * 取得可用的維修狀態轉換
   */
  static getAvailableTransitions(status: RepairStatus): RepairStatus[] {
    return RepairTransitions[status] ?? [];
  }

  /**
   * 檢查是否為終止狀態
   */
  static isTerminalStatus(status: RepairStatus): boolean {
    return status === 'verified' || status === 'cancelled';
  }

  /**
   * 檢查是否正在進行
   */
  static isInProgress(status: RepairStatus): boolean {
    return status === 'scheduled' || status === 'in_progress';
  }
}
