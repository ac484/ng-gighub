/**
 * Warranty Configuration
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 保固模組配置
 *
 * @module WarrantyConfig
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { WarrantyDefectStatus } from '../models/warranty-defect.model';
import type { RepairStatus } from '../models/warranty-repair.model';
import type { WarrantyStatus } from '../models/warranty.model';

/**
 * 保固模組配置
 */
export const WarrantyConfig = {
  /** 預設保固期限（月） */
  defaultPeriodMonths: 12,

  /** 預設到期通知天數 */
  defaultNotifyDaysBefore: [30, 14, 7, 1],

  /** 即將到期天數閾值 */
  expiringThresholdDays: 30,

  /** 最大缺失照片數量 */
  maxDefectPhotos: 10,

  /** 最大維修照片數量 */
  maxRepairPhotos: 10,

  /** 最大附件大小（bytes） */
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB

  /** 允許的圖片類型 */
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  /** 允許的文件類型 */
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],

  /**
   * 狀態轉換規則
   */
  statusTransitions: {
    warranty: {
      pending: ['active', 'voided'],
      active: ['expiring', 'completed', 'voided'],
      expiring: ['active', 'expired', 'completed'],
      expired: ['completed'],
      completed: [],
      voided: []
    } as Record<WarrantyStatus, WarrantyStatus[]>,

    defect: {
      reported: ['confirmed', 'rejected'],
      confirmed: ['under_repair'],
      under_repair: ['repaired'],
      repaired: ['verified', 'under_repair'],
      verified: ['closed'],
      closed: [],
      rejected: []
    } as Record<WarrantyDefectStatus, WarrantyDefectStatus[]>,

    repair: {
      pending: ['scheduled', 'cancelled'],
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['verified', 'failed'],
      verified: [],
      failed: ['in_progress'],
      cancelled: []
    } as Record<RepairStatus, RepairStatus[]>
  },

  /**
   * 保固類型預設期限（月）
   */
  warrantyTypePeriods: {
    standard: 12,
    extended: 24,
    special: 36
  },

  /**
   * 缺失嚴重程度權重（用於排序）
   */
  severityWeights: {
    critical: 3,
    major: 2,
    minor: 1
  },

  /**
   * 自動狀態更新設定
   */
  autoStatusUpdate: {
    /** 啟用自動更新到期狀態 */
    enabled: true,
    /** 檢查間隔（毫秒） */
    checkInterval: 24 * 60 * 60 * 1000 // 每天
  }
} as const;

/**
 * 取得保固類型的預設期限
 */
export function getDefaultPeriodForType(warrantyType: string): number {
  return (
    WarrantyConfig.warrantyTypePeriods[warrantyType as keyof typeof WarrantyConfig.warrantyTypePeriods] ??
    WarrantyConfig.defaultPeriodMonths
  );
}

/**
 * 檢查是否接近到期
 */
export function isNearExpiry(endDate: Date, thresholdDays: number = WarrantyConfig.expiringThresholdDays): boolean {
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= thresholdDays;
}

/**
 * 檢查是否已過期
 */
export function isExpired(endDate: Date): boolean {
  return new Date() > endDate;
}
