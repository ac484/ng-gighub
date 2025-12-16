/**
 * Warranty Model - 保固記錄資料模型
 *
 * SETC-032: Warranty Module Foundation Setup
 *
 * 定義保固記錄的資料結構
 *
 * @module WarrantyModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

/**
 * 保固類型
 */
export type WarrantyType = 'standard' | 'extended' | 'special';

/**
 * 保固狀態
 */
export type WarrantyStatus =
  | 'pending' // 待生效
  | 'active' // 進行中
  | 'expiring' // 即將到期（30天內）
  | 'expired' // 已到期
  | 'completed' // 已結案
  | 'voided'; // 已作廢

/**
 * 檔案附件
 */
export interface FileAttachment {
  /** 附件 ID */
  id: string;
  /** 檔案名稱 */
  fileName: string;
  /** 檔案類型 */
  fileType: string;
  /** 檔案大小 (bytes) */
  fileSize: number;
  /** 存儲路徑或 URL */
  url: string;
  /** 縮圖 URL（如果是圖片） */
  thumbnailUrl?: string;
  /** 上傳日期 */
  uploadedAt: Date;
  /** 上傳者 */
  uploadedBy: string;
}

/**
 * 保固項目
 */
export interface WarrantyItem {
  /** 項目 ID */
  id: string;
  /** 關聯的合約工項 ID */
  contractWorkItemId: string;
  /** 說明 */
  description: string;
  /** 保固期限（月） */
  warrantyPeriodMonths: number;
  /** 開始日期 */
  startDate: Date;
  /** 結束日期 */
  endDate: Date;
  /** 狀態 */
  status: 'active' | 'expired';
}

/**
 * 保固責任方資訊
 */
export interface WarrantorInfo {
  /** 廠商 ID */
  id: string;
  /** 廠商名稱 */
  name: string;
  /** 聯絡人姓名 */
  contactName: string;
  /** 聯絡電話 */
  contactPhone: string;
  /** 聯絡 Email */
  contactEmail: string;
  /** 地址 */
  address: string;
}

/**
 * 通知設定
 */
export interface NotificationSettings {
  /** 是否啟用通知 */
  enabled: boolean;
  /** 到期前幾天通知 */
  notifyDaysBefore: number[];
  /** 通知 Email 列表 */
  notifyEmails: string[];
}

/**
 * 保固記錄
 */
export interface Warranty {
  /** 保固 ID */
  id: string;
  /** 藍圖 ID */
  blueprintId: string;

  // 關聯
  /** 驗收 ID */
  acceptanceId: string;
  /** 合約 ID */
  contractId: string;
  /** 任務 ID 列表 */
  taskIds: string[];

  // 編號
  /** 保固編號 */
  warrantyNumber: string;

  // 類型
  /** 保固類型 */
  warrantyType: WarrantyType;

  // 保固項目
  /** 保固項目列表 */
  items: WarrantyItem[];

  // 保固期限
  /** 開始日期 */
  startDate: Date;
  /** 結束日期 */
  endDate: Date;
  /** 保固期限（月） */
  periodInMonths: number;

  // 保固責任方
  /** 保固責任方 */
  warrantor: WarrantorInfo;

  // 狀態
  /** 保固狀態 */
  status: WarrantyStatus;

  // 保固缺失與維修
  /** 缺失數量 */
  defectCount: number;
  /** 維修數量 */
  repairCount: number;

  // 通知設定
  /** 通知設定 */
  notificationSettings: NotificationSettings;

  // 備註
  /** 備註 */
  notes?: string;

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
 * 保固建立選項
 */
export interface CreateWarrantyOptions {
  /** 驗收 ID */
  acceptanceId: string;
  /** 合約 ID */
  contractId: string;
  /** 任務 ID 列表 */
  taskIds: string[];
  /** 保固類型 */
  warrantyType?: WarrantyType;
  /** 保固期限（月） */
  periodInMonths?: number;
  /** 保固責任方 */
  warrantor: WarrantorInfo;
  /** 保固項目 */
  items?: Array<Omit<WarrantyItem, 'id' | 'startDate' | 'endDate' | 'status'>>;
  /** 操作者 ID */
  createdBy: string;
}

/**
 * 保固更新選項
 */
export interface UpdateWarrantyOptions {
  /** 保固類型 */
  warrantyType?: WarrantyType;
  /** 保固責任方 */
  warrantor?: Partial<WarrantorInfo>;
  /** 通知設定 */
  notificationSettings?: Partial<NotificationSettings>;
  /** 備註 */
  notes?: string;
  /** 更新者 ID */
  updatedBy: string;
}
