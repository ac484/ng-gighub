/**
 * 自訂圖標靜態資源
 * Custom icon static resources
 *
 * 此檔案包含專案特定的自訂圖標。
 * 這些圖標不會被自動生成腳本覆蓋。
 *
 * 使用方式：
 * 1. 在此處添加專案需要的自訂圖標
 * 2. 這些圖標會與 ICONS_AUTO 一起註冊到 ng-alain
 * 3. 在模板中使用: <i nz-icon nzType="info"></i>
 *
 * 維護建議：
 * - 只添加專案特定的圖標
 * - 如果圖標在多個專案中通用，考慮貢獻到 @ant-design/icons-angular
 * - 保持圖標名稱的一致性和語義化
 */

import {
  BulbOutline,
  ExceptionOutline,
  InfoOutline,
  InfoCircleOutline,
  LinkOutline,
  ProfileOutline,
  BellOutline,
  CalendarOutline,
  CloseCircleOutline,
  DownOutline,
  EllipsisOutline,
  FileOutline,
  LoadingOutline,
  PlusOutline,
  PlusCircleOutline,
  RobotOutline,
  SearchOutline,
  UsergroupAddOutline,
  // Added common app icons referenced in `app-data.json`
  DashboardOutline,
  ProjectOutline,
  SettingOutline,
  TeamOutline,
  UserOutline
} from '@ant-design/icons-angular/icons';

/**
 * 自訂圖標列表
 * 包含專案特定需求的圖標
 *
 * 當前包含的圖標：
 * - InfoOutline, InfoCircleOutline: 資訊提示
 * - BulbOutline: 想法/提示
 * - ProfileOutline: 個人資料
 * - ExceptionOutline: 異常/錯誤
 * - LinkOutline: 連結
 * - BellOutline: 通知
 * - CalendarOutline: 日曆
 * - CloseCircleOutline: 關閉
 * - DownOutline: 向下箭頭
 * - EllipsisOutline: 更多操作
 * - FileOutline: 文件
 * - LoadingOutline: 載入中
 * - PlusOutline, PlusCircleOutline: 新增
 * - RobotOutline: 機器人/AI
 * - SearchOutline: 搜尋
 * - UsergroupAddOutline: 新增用戶組
 */
export const ICONS = [
  // Core app icons (added to match `src/assets/tmp/app-data.json`)
  DashboardOutline,
  ProjectOutline,
  SettingOutline,
  TeamOutline,
  UserOutline,

  InfoOutline,
  InfoCircleOutline,
  BulbOutline,
  ProfileOutline,
  ExceptionOutline,
  LinkOutline,
  BellOutline,
  CalendarOutline,
  CloseCircleOutline,
  DownOutline,
  EllipsisOutline,
  FileOutline,
  LoadingOutline,
  PlusOutline,
  PlusCircleOutline,
  RobotOutline,
  SearchOutline,
  UsergroupAddOutline
];
