/**
 * QA Models - Quality assurance and defect tracking
 *
 * @module QAModels
 * @author GigHub Development Team
 * @date 2025-12-13
 * @updated 2025-12-16 - SETC-041 擴展生命週期欄位
 */

export enum DefectSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 缺失狀態 - SETC-041 擴展
 * open → assigned → in_progress → resolved → verified → closed
 */
export enum DefectStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  VERIFIED = 'verified',
  CLOSED = 'closed'
}

/**
 * 缺失類別 - SETC-041
 */
export enum DefectCategory {
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FINISHING = 'finishing',
  WATERPROOFING = 'waterproofing',
  SAFETY = 'safety',
  OTHER = 'other'
}

/**
 * QA 缺失資料模型 - SETC-041 擴展
 */
export interface QADefect {
  id: string;
  blueprintId: string;
  defectNumber?: string; // SETC-041: 缺失編號
  title: string;
  description: string;
  severity: DefectSeverity;
  category?: DefectCategory; // SETC-041: 缺失類別
  status: DefectStatus;
  location?: string;
  photos?: string[];
  assigneeId?: string;
  responsibleUserId?: string; // SETC-041: 責任人
  assignedAt?: Date; // SETC-041: 指派時間
  deadline?: Date; // SETC-041: 期限
  inspectionId?: string; // SETC-041: 關聯 QC 檢查
  taskId?: string; // SETC-041: 關聯任務
  workItemId?: string; // SETC-041: 關聯工項
  resolvedDate?: Date;
  verifiedDate?: Date; // SETC-041: 驗證日期
  closedDate?: Date; // SETC-041: 結案日期
  linkedIssueId?: string; // SETC-044: 關聯 Issue
  metadata?: Record<string, unknown>;
  createdBy: string;
  updatedBy?: string; // SETC-041: 更新人
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建立缺失資料 - SETC-041 擴展
 */
export interface CreateQADefectData {
  blueprintId: string;
  defectNumber?: string; // SETC-041: 缺失編號
  title: string;
  description: string;
  severity: DefectSeverity;
  category?: DefectCategory; // SETC-041: 缺失類別
  location?: string;
  assigneeId?: string;
  responsibleUserId?: string; // SETC-041: 責任人
  deadline?: Date; // SETC-041: 期限
  inspectionId?: string; // SETC-041: 關聯 QC 檢查
  taskId?: string; // SETC-041: 關聯任務
  workItemId?: string; // SETC-041: 關聯工項
  createdBy: string;
}

/**
 * 更新缺失資料 - SETC-041 擴展
 */
export interface UpdateQADefectData {
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  category?: DefectCategory; // SETC-041
  status?: DefectStatus;
  location?: string;
  photos?: string[];
  assigneeId?: string;
  responsibleUserId?: string; // SETC-041
  assignedAt?: Date; // SETC-041
  deadline?: Date; // SETC-041
  resolvedDate?: Date;
  verifiedDate?: Date; // SETC-041
  closedDate?: Date; // SETC-041
  linkedIssueId?: string; // SETC-044
  metadata?: Record<string, unknown>;
  updatedBy?: string; // SETC-041
}

export interface QAQueryOptions {
  severity?: DefectSeverity;
  status?: DefectStatus;
  statusIn?: DefectStatus[]; // SETC-041: 多狀態查詢
  assigneeId?: string;
  responsibleUserId?: string; // SETC-041: 責任人查詢
  limit?: number;
}

// ========== SETC-041: 缺失生命週期相關類型 ==========

/**
 * 缺失統計 - SETC-041
 */
export interface DefectStatistics {
  total: number;
  byStatus: {
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    verified: number;
    closed: number;
  };
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  overdue: number;
}

/**
 * QC 檢查項目（用於自動建立缺失）- SETC-041
 */
export interface QCInspectionItem {
  id: string;
  workItemId: string;
  checkpointName: string;
  passed: boolean;
  failureReason?: string;
  location?: string;
  isStructural?: boolean;
  isSafety?: boolean;
  isWaterproofing?: boolean;
  isElectrical?: boolean;
}

/**
 * QC 檢查（用於自動建立缺失）- SETC-041
 */
export interface QCInspection {
  id: string;
  blueprintId: string;
  taskId: string;
  inspectorId: string;
  inspectionDate: Date;
  items: QCInspectionItem[];
  passed: boolean;
}

/**
 * 事件行為者 - 通用類型
 */
export interface EventActor {
  userId: string;
  userName?: string;
  role?: string;
}
