/**
 * Warranty API Exports
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 定義保固模組的公開 API 契約
 *
 * @module WarrantyAPI
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type {
  WarrantyDefect,
  WarrantyDefectStatus,
  DefectCategory,
  DefectSeverity,
  CreateDefectOptions,
  UpdateDefectOptions
} from '../models/warranty-defect.model';
import type {
  WarrantyRepair,
  RepairStatus,
  CreateRepairOptions,
  UpdateRepairOptions,
  CompleteRepairOptions,
  VerifyRepairOptions
} from '../models/warranty-repair.model';
import type {
  Warranty,
  WarrantyStatus,
  WarrantyType,
  WarrantorInfo,
  WarrantyItem,
  CreateWarrantyOptions,
  UpdateWarrantyOptions
} from '../models/warranty.model';

/**
 * 保固服務 API 契約
 */
export interface IWarrantyService {
  /**
   * 從驗收記錄自動建立保固
   */
  createFromAcceptance(acceptanceId: string, options: CreateWarrantyOptions): Promise<Warranty>;

  /**
   * 取得保固記錄
   */
  getById(blueprintId: string, warrantyId: string): Promise<Warranty | null>;

  /**
   * 取得藍圖的所有保固記錄
   */
  getByBlueprintId(blueprintId: string): Promise<Warranty[]>;

  /**
   * 更新保固記錄
   */
  update(blueprintId: string, warrantyId: string, options: UpdateWarrantyOptions): Promise<Warranty>;

  /**
   * 更新保固狀態
   */
  updateStatus(blueprintId: string, warrantyId: string, status: WarrantyStatus, actorId: string): Promise<Warranty>;

  /**
   * 檢查並更新到期狀態
   */
  checkAndUpdateExpiryStatus(blueprintId: string): Promise<void>;
}

/**
 * 缺失服務 API 契約
 */
export interface IDefectService {
  /**
   * 報告缺失
   */
  report(blueprintId: string, options: CreateDefectOptions): Promise<WarrantyDefect>;

  /**
   * 取得缺失記錄
   */
  getById(blueprintId: string, defectId: string): Promise<WarrantyDefect | null>;

  /**
   * 取得保固的所有缺失
   */
  getByWarrantyId(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]>;

  /**
   * 更新缺失
   */
  update(blueprintId: string, defectId: string, options: UpdateDefectOptions): Promise<WarrantyDefect>;

  /**
   * 確認缺失
   */
  confirm(blueprintId: string, defectId: string, actorId: string): Promise<WarrantyDefect>;

  /**
   * 拒絕缺失（非保固範圍）
   */
  reject(blueprintId: string, defectId: string, reason: string, actorId: string): Promise<WarrantyDefect>;

  /**
   * 關閉缺失
   */
  close(blueprintId: string, defectId: string, actorId: string): Promise<WarrantyDefect>;
}

/**
 * 維修服務 API 契約
 */
export interface IRepairService {
  /**
   * 建立維修記錄
   */
  create(blueprintId: string, options: CreateRepairOptions): Promise<WarrantyRepair>;

  /**
   * 取得維修記錄
   */
  getById(blueprintId: string, repairId: string): Promise<WarrantyRepair | null>;

  /**
   * 取得缺失的維修記錄
   */
  getByDefectId(blueprintId: string, defectId: string): Promise<WarrantyRepair | null>;

  /**
   * 更新維修記錄
   */
  update(blueprintId: string, repairId: string, options: UpdateRepairOptions): Promise<WarrantyRepair>;

  /**
   * 排程維修
   */
  schedule(blueprintId: string, repairId: string, scheduledDate: Date, actorId: string): Promise<WarrantyRepair>;

  /**
   * 開始維修
   */
  start(blueprintId: string, repairId: string, actorId: string): Promise<WarrantyRepair>;

  /**
   * 完成維修
   */
  complete(blueprintId: string, repairId: string, options: CompleteRepairOptions): Promise<WarrantyRepair>;

  /**
   * 驗收維修
   */
  verify(blueprintId: string, repairId: string, options: VerifyRepairOptions): Promise<WarrantyRepair>;

  /**
   * 取消維修
   */
  cancel(blueprintId: string, repairId: string, reason: string, actorId: string): Promise<WarrantyRepair>;
}

/**
 * 保固統計 API 契約
 */
export interface IWarrantyStatsService {
  /**
   * 取得保固統計摘要
   */
  getSummary(blueprintId: string): Promise<WarrantySummary>;

  /**
   * 取得即將到期的保固列表
   */
  getExpiring(blueprintId: string, days?: number): Promise<Warranty[]>;

  /**
   * 取得已過期的保固列表
   */
  getExpired(blueprintId: string): Promise<Warranty[]>;

  /**
   * 取得待處理缺失列表
   */
  getPendingDefects(blueprintId: string): Promise<WarrantyDefect[]>;

  /**
   * 取得進行中維修列表
   */
  getActiveRepairs(blueprintId: string): Promise<WarrantyRepair[]>;
}

/**
 * 保固統計摘要
 */
export interface WarrantySummary {
  /** 藍圖 ID */
  blueprintId: string;
  /** 總保固數 */
  totalWarranties: number;
  /** 活動中保固數 */
  activeWarranties: number;
  /** 即將到期數 */
  expiringCount: number;
  /** 已過期數 */
  expiredCount: number;
  /** 總缺失數 */
  totalDefects: number;
  /** 待處理缺失數 */
  pendingDefects: number;
  /** 進行中維修數 */
  activeRepairs: number;
  /** 統計時間 */
  asOf: Date;
}

// Re-export types for convenience
export type {
  Warranty,
  WarrantyStatus,
  WarrantyType,
  WarrantorInfo,
  WarrantyItem,
  CreateWarrantyOptions,
  UpdateWarrantyOptions,
  WarrantyDefect,
  WarrantyDefectStatus,
  DefectCategory,
  DefectSeverity,
  CreateDefectOptions,
  UpdateDefectOptions,
  WarrantyRepair,
  RepairStatus,
  CreateRepairOptions,
  UpdateRepairOptions,
  CompleteRepairOptions,
  VerifyRepairOptions
};
