/**
 * Warranty Repair Model - 保固維修資料模型
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 定義保固維修的資料結構
 *
 * @module WarrantyRepairModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { FileAttachment, WarrantorInfo } from './warranty.model';

/**
 * 維修狀態
 */
export type RepairStatus =
  | 'pending' // 待派工
  | 'scheduled' // 已排程
  | 'in_progress' // 進行中
  | 'completed' // 已完成
  | 'verified' // 已驗收
  | 'failed' // 驗收失敗
  | 'cancelled'; // 已取消

/**
 * 費用責任方
 */
export type CostResponsibility = 'warrantor' | 'owner';

/**
 * 保固維修
 */
export interface WarrantyRepair {
  /** 維修 ID */
  id: string;
  /** 保固 ID */
  warrantyId: string;
  /** 缺失 ID */
  defectId: string;
  /** 藍圖 ID */
  blueprintId: string;

  // 編號
  /** 維修編號 */
  repairNumber: string;

  // 維修資訊
  /** 維修說明 */
  description: string;
  /** 維修方法 */
  repairMethod: string;

  // 維修單位
  /** 承攬廠商 */
  contractor: WarrantorInfo;
  /** 指派工人 */
  assignedWorkers: string[];

  // 時程
  /** 排定日期 */
  scheduledDate?: Date;
  /** 開始日期 */
  startedDate?: Date;
  /** 完成日期 */
  completedDate?: Date;
  /** 驗收日期 */
  verifiedDate?: Date;

  // 狀態
  /** 維修狀態 */
  status: RepairStatus;

  // 成本（如果由業主負擔）
  /** 維修成本 */
  cost?: number;
  /** 費用責任方 */
  costResponsibility: CostResponsibility;

  // 完工記錄
  /** 完工照片 */
  completionPhotos: FileAttachment[];
  /** 完工備註 */
  completionNotes?: string;

  // 驗收記錄
  /** 驗收者 */
  verifiedBy?: string;
  /** 驗收備註 */
  verificationNotes?: string;

  // 審計欄位
  /** 建立者 */
  createdBy: string;
  /** 建立時間 */
  createdAt: Date;
  /** 更新者 */
  updatedBy?: string;
  /** 更新時間 */
  updatedAt: Date;
}

/**
 * 建立維修選項
 */
export interface CreateRepairOptions {
  /** 保固 ID */
  warrantyId: string;
  /** 缺失 ID */
  defectId: string;
  /** 維修說明 */
  description: string;
  /** 維修方法 */
  repairMethod?: string;
  /** 承攬廠商 */
  contractor: WarrantorInfo;
  /** 費用責任方 */
  costResponsibility?: CostResponsibility;
  /** 操作者 ID */
  createdBy: string;
}

/**
 * 更新維修選項
 */
export interface UpdateRepairOptions {
  /** 維修說明 */
  description?: string;
  /** 維修方法 */
  repairMethod?: string;
  /** 指派工人 */
  assignedWorkers?: string[];
  /** 排定日期 */
  scheduledDate?: Date;
  /** 維修成本 */
  cost?: number;
  /** 費用責任方 */
  costResponsibility?: CostResponsibility;
  /** 更新者 ID */
  updatedBy: string;
}

/**
 * 完工選項
 */
export interface CompleteRepairOptions {
  /** 完工照片 */
  completionPhotos?: FileAttachment[];
  /** 完工備註 */
  completionNotes?: string;
  /** 操作者 ID */
  updatedBy: string;
}

/**
 * 驗收選項
 */
export interface VerifyRepairOptions {
  /** 驗收結果: 通過或失敗 */
  passed: boolean;
  /** 驗收備註 */
  verificationNotes?: string;
  /** 驗收者 ID */
  verifiedBy: string;
}

/**
 * 維修狀態顯示名稱
 */
export const RepairStatusDisplayNames: Record<RepairStatus, string> = {
  pending: '待派工',
  scheduled: '已排程',
  in_progress: '進行中',
  completed: '已完成',
  verified: '已驗收',
  failed: '驗收失敗',
  cancelled: '已取消'
};

/**
 * 費用責任方顯示名稱
 */
export const CostResponsibilityDisplayNames: Record<CostResponsibility, string> = {
  warrantor: '保固責任方',
  owner: '業主'
};
