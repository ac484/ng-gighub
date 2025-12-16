import { ModuleType } from '../module/module.types';

/**
 * General blueprint settings
 * 一般藍圖設定
 */
export interface GeneralSettings {
  name: string;
  description?: string;
  timezone?: string;
  locale?: string;
  dateFormat?: string;
}

/**
 * Notification settings
 * 通知設定
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  channels?: string[];
}

/**
 * Retention policy definition
 * 保留政策定義
 */
export interface RetentionPolicy {
  enableAutoArchive?: boolean;
  autoArchiveDays?: number;
  dataExportEnabled?: boolean;
}

/**
 * Module configuration
 * 模組設定
 */
export interface ModuleConfiguration {
  enabled: boolean;
  version?: string;
  settings?: Record<string, unknown>;
}

/**
 * Blueprint configuration schema
 * 藍圖設定架構
 */
export interface BlueprintConfiguration {
  id: string;
  blueprintId: string;
  version: number;
  general: GeneralSettings;
  modules: Partial<Record<ModuleType, ModuleConfiguration>>;
  notifications?: NotificationSettings;
  integrations?: Record<string, unknown>;
  advanced?: RetentionPolicy;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy: string;
}
