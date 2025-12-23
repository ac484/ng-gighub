/**
 * Warranty Defect Model - 保固缺失資料模型
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 定義保固缺失的資料結構
 *
 * @module WarrantyDefectModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { FileAttachment } from './warranty.model';

/**
 * 缺失類別
 */
export type DefectCategory =
  | 'structural' // 結構
  | 'waterproofing' // 防水
  | 'electrical' // 電氣
  | 'plumbing' // 管線
  | 'finishing' // 裝修
  | 'mechanical' // 機械
  | 'other'; // 其他

/**
 * 缺失嚴重程度
 */
export type DefectSeverity = 'critical' | 'major' | 'minor';

/**
 * 保固缺失狀態
 */
export type WarrantyDefectStatus =
  | 'reported' // 已通報
  | 'confirmed' // 已確認
  | 'under_repair' // 維修中
  | 'repaired' // 維修完成
  | 'verified' // 已驗證
  | 'closed' // 已結案
  | 'rejected'; // 不受理（非保固範圍）

/**
 * 保固缺失
 */
export interface WarrantyDefect {
  /** 缺失 ID */
  id: string;
  /** 保固 ID */
  warrantyId: string;
  /** 藍圖 ID */
  blueprintId: string;

  // 編號
  /** 缺失編號 */
  defectNumber: string;

  // 缺失資訊
  /** 缺失說明 */
  description: string;
  /** 發生位置 */
  location: string;
  /** 缺失類別 */
  category: DefectCategory;
  /** 嚴重程度 */
  severity: DefectSeverity;

  // 發現資訊
  /** 發現日期 */
  discoveredDate: Date;
  /** 通報者 */
  reportedBy: string;
  /** 通報者聯絡方式 */
  reporterContact: string;

  // 證據
  /** 照片 */
  photos: FileAttachment[];
  /** 文件 */
  documents: FileAttachment[];

  // 狀態
  /** 缺失狀態 */
  status: WarrantyDefectStatus;

  // 關聯維修
  /** 維修記錄 ID */
  repairId?: string;

  // 關聯問題單（嚴重缺失）
  /** 問題單 ID */
  issueId?: string;

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
 * 建立缺失選項
 */
export interface CreateDefectOptions {
  /** 保固 ID */
  warrantyId: string;
  /** 缺失說明 */
  description: string;
  /** 發生位置 */
  location: string;
  /** 缺失類別 */
  category: DefectCategory;
  /** 嚴重程度 */
  severity: DefectSeverity;
  /** 發現日期 */
  discoveredDate?: Date;
  /** 通報者聯絡方式 */
  reporterContact?: string;
  /** 照片 */
  photos?: FileAttachment[];
  /** 操作者 ID */
  createdBy: string;
}

/**
 * 更新缺失選項
 */
export interface UpdateDefectOptions {
  /** 缺失說明 */
  description?: string;
  /** 發生位置 */
  location?: string;
  /** 缺失類別 */
  category?: DefectCategory;
  /** 嚴重程度 */
  severity?: DefectSeverity;
  /** 狀態 */
  status?: WarrantyDefectStatus;
  /** 維修記錄 ID */
  repairId?: string;
  /** 問題單 ID */
  issueId?: string;
  /** 更新者 ID */
  updatedBy: string;
}

/**
 * 缺失類別顯示名稱
 */
export const DefectCategoryDisplayNames: Record<DefectCategory, string> = {
  structural: '結構',
  waterproofing: '防水',
  electrical: '電氣',
  plumbing: '管線',
  finishing: '裝修',
  mechanical: '機械',
  other: '其他'
};

/**
 * 缺失嚴重程度顯示名稱
 */
export const DefectSeverityDisplayNames: Record<DefectSeverity, string> = {
  critical: '嚴重',
  major: '重大',
  minor: '輕微'
};

/**
 * 缺失狀態顯示名稱
 */
export const WarrantyDefectStatusDisplayNames: Record<WarrantyDefectStatus, string> = {
  reported: '已通報',
  confirmed: '已確認',
  under_repair: '維修中',
  repaired: '維修完成',
  verified: '已驗證',
  closed: '已結案',
  rejected: '不受理'
};
