/**
 * Defect Lifecycle Service - SETC-041
 *
 * 缺失生命週期管理服務
 * - QC 失敗自動建立缺失
 * - 狀態機管理
 * - 責任人分配
 * - 期限管理
 *
 * @module QA
 * @author GigHub Development Team
 * @date 2025-12-16
 * @implements SETC-041
 */

import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import {
  QADefect,
  DefectSeverity,
  DefectStatus,
  DefectCategory,
  DefectStatistics,
  QCInspection,
  QCInspectionItem,
  EventActor
} from '../models';
import { QaRepository } from '../repositories/qa.repository';

/**
 * 缺失狀態機 - SETC-041
 * 定義合法的狀態轉換
 */
const DEFECT_STATUS_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  [DefectStatus.OPEN]: [DefectStatus.ASSIGNED, DefectStatus.CLOSED],
  [DefectStatus.ASSIGNED]: [DefectStatus.IN_PROGRESS, DefectStatus.OPEN],
  [DefectStatus.IN_PROGRESS]: [DefectStatus.RESOLVED, DefectStatus.ASSIGNED],
  [DefectStatus.RESOLVED]: [DefectStatus.VERIFIED, DefectStatus.IN_PROGRESS],
  [DefectStatus.VERIFIED]: [DefectStatus.CLOSED, DefectStatus.RESOLVED],
  [DefectStatus.CLOSED]: []
};

/**
 * 嚴重度對應期限天數 - SETC-041
 */
const SEVERITY_DEADLINE_DAYS: Record<DefectSeverity, number> = {
  [DefectSeverity.CRITICAL]: 3,
  [DefectSeverity.HIGH]: 5,
  [DefectSeverity.MEDIUM]: 7,
  [DefectSeverity.LOW]: 14
};

@Injectable({ providedIn: 'root' })
export class DefectLifecycleService {
  private repository = inject(QaRepository);

  // ========== 自動建立機制 ==========

  /**
   * 從 QC 檢查失敗項目自動建立缺失 - SETC-041
   */
  async autoCreateFromQCInspection(inspection: QCInspection, failedItems: QCInspectionItem[], actor: EventActor): Promise<QADefect[]> {
    const defects: QADefect[] = [];

    for (const item of failedItems) {
      const severity = this.determineSeverity(item);
      const category = this.determineCategory(item);
      const deadline = this.calculateDeadline(severity);

      const defect = await this.repository.create(inspection.blueprintId, {
        blueprintId: inspection.blueprintId,
        defectNumber: this.generateDefectNumber(),
        title: `QC 缺失 - ${item.checkpointName}`,
        description: item.failureReason || '檢查未通過',
        severity,
        category,
        location: item.location,
        inspectionId: inspection.id,
        taskId: inspection.taskId,
        workItemId: item.workItemId,
        deadline,
        createdBy: actor.userId
      });

      defects.push(defect);
    }

    return defects;
  }

  /**
   * 手動建立缺失 - SETC-041
   */
  async createDefect(
    blueprintId: string,
    data: {
      title: string;
      description: string;
      severity: DefectSeverity;
      category?: DefectCategory;
      location?: string;
      taskId?: string;
      workItemId?: string;
    },
    actor: EventActor
  ): Promise<QADefect> {
    const deadline = this.calculateDeadline(data.severity);

    return this.repository.create(blueprintId, {
      blueprintId,
      defectNumber: this.generateDefectNumber(),
      title: data.title,
      description: data.description,
      severity: data.severity,
      category: data.category,
      location: data.location,
      taskId: data.taskId,
      workItemId: data.workItemId,
      deadline,
      createdBy: actor.userId
    });
  }

  // ========== 責任分配 ==========

  /**
   * 指派責任人 - SETC-041
   */
  async assignResponsible(blueprintId: string, defectId: string, responsibleUserId: string, actor: EventActor): Promise<QADefect> {
    const defect = await this.getById(blueprintId, defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    // 驗證狀態轉換
    this.validateStatusTransition(defect.status, DefectStatus.ASSIGNED);

    await this.repository.update(blueprintId, defectId, {
      responsibleUserId,
      assignedAt: new Date(),
      status: DefectStatus.ASSIGNED,
      updatedBy: actor.userId
    });

    return {
      ...defect,
      responsibleUserId,
      assignedAt: new Date(),
      status: DefectStatus.ASSIGNED
    };
  }

  // ========== 狀態管理 ==========

  /**
   * 更新缺失狀態 - SETC-041
   */
  async updateStatus(blueprintId: string, defectId: string, newStatus: DefectStatus, actor: EventActor): Promise<QADefect> {
    const defect = await this.getById(blueprintId, defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    // 驗證狀態轉換
    this.validateStatusTransition(defect.status, newStatus);

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedBy: actor.userId
    };

    // 根據狀態設定對應日期
    if (newStatus === DefectStatus.RESOLVED) {
      updateData['resolvedDate'] = new Date();
    } else if (newStatus === DefectStatus.VERIFIED) {
      updateData['verifiedDate'] = new Date();
    } else if (newStatus === DefectStatus.CLOSED) {
      updateData['closedDate'] = new Date();
    }

    await this.repository.update(blueprintId, defectId, updateData);

    return { ...defect, status: newStatus };
  }

  /**
   * 開始處理缺失 - SETC-041
   */
  async startProgress(blueprintId: string, defectId: string, actor: EventActor): Promise<QADefect> {
    return this.updateStatus(blueprintId, defectId, DefectStatus.IN_PROGRESS, actor);
  }

  /**
   * 標記解決 - SETC-041
   */
  async markResolved(blueprintId: string, defectId: string, actor: EventActor): Promise<QADefect> {
    return this.updateStatus(blueprintId, defectId, DefectStatus.RESOLVED, actor);
  }

  /**
   * 驗證通過 - SETC-041
   */
  async verify(blueprintId: string, defectId: string, actor: EventActor): Promise<QADefect> {
    return this.updateStatus(blueprintId, defectId, DefectStatus.VERIFIED, actor);
  }

  /**
   * 結案 - SETC-041
   */
  async close(blueprintId: string, defectId: string, actor: EventActor): Promise<QADefect> {
    return this.updateStatus(blueprintId, defectId, DefectStatus.CLOSED, actor);
  }

  // ========== 期限管理 ==========

  /**
   * 設定/更新期限 - SETC-041
   */
  async setDeadline(blueprintId: string, defectId: string, deadline: Date, actor: EventActor): Promise<QADefect> {
    const defect = await this.getById(blueprintId, defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    await this.repository.update(blueprintId, defectId, {
      deadline,
      updatedBy: actor.userId
    });

    return { ...defect, deadline };
  }

  /**
   * 取得逾期缺失 - SETC-041
   */
  async getOverdueDefects(blueprintId: string): Promise<QADefect[]> {
    const now = new Date();
    const openStatuses = [DefectStatus.OPEN, DefectStatus.ASSIGNED, DefectStatus.IN_PROGRESS];

    const defects = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));

    return defects.filter(d => openStatuses.includes(d.status) && d.deadline && d.deadline < now);
  }

  // ========== 查詢方法 ==========

  /**
   * 取得單一缺失 - SETC-041
   */
  async getById(blueprintId: string, defectId: string): Promise<QADefect | null> {
    return lastValueFrom(this.repository.findById(blueprintId, defectId));
  }

  /**
   * 取得藍圖所有缺失 - SETC-041
   */
  async getByBlueprintId(blueprintId: string): Promise<QADefect[]> {
    return lastValueFrom(this.repository.findByBlueprintId(blueprintId));
  }

  /**
   * 依狀態取得缺失 - SETC-041
   */
  async getByStatus(blueprintId: string, statuses: DefectStatus[]): Promise<QADefect[]> {
    const allDefects = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));
    return allDefects.filter(d => statuses.includes(d.status));
  }

  /**
   * 取得缺失統計 - SETC-041
   */
  async getDefectStatistics(blueprintId: string): Promise<DefectStatistics> {
    const defects = await this.getByBlueprintId(blueprintId);
    const now = new Date();

    return {
      total: defects.length,
      byStatus: {
        open: defects.filter(d => d.status === DefectStatus.OPEN).length,
        assigned: defects.filter(d => d.status === DefectStatus.ASSIGNED).length,
        inProgress: defects.filter(d => d.status === DefectStatus.IN_PROGRESS).length,
        resolved: defects.filter(d => d.status === DefectStatus.RESOLVED).length,
        verified: defects.filter(d => d.status === DefectStatus.VERIFIED).length,
        closed: defects.filter(d => d.status === DefectStatus.CLOSED).length
      },
      bySeverity: {
        critical: defects.filter(d => d.severity === DefectSeverity.CRITICAL).length,
        high: defects.filter(d => d.severity === DefectSeverity.HIGH).length,
        medium: defects.filter(d => d.severity === DefectSeverity.MEDIUM).length,
        low: defects.filter(d => d.severity === DefectSeverity.LOW).length
      },
      overdue: defects.filter(d => this.isOverdue(d, now)).length
    };
  }

  // ========== 輔助方法 ==========

  /**
   * 驗證狀態轉換合法性 - SETC-041
   */
  private validateStatusTransition(currentStatus: DefectStatus, newStatus: DefectStatus): void {
    const allowedTransitions = DEFECT_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    }
  }

  /**
   * 檢查狀態轉換是否合法 - SETC-041
   */
  canTransition(currentStatus: DefectStatus, newStatus: DefectStatus): boolean {
    return DEFECT_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 生成缺失編號 - SETC-041
   */
  private generateDefectNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DEF-${timestamp}-${random}`;
  }

  /**
   * 決定嚴重度 - SETC-041
   */
  private determineSeverity(item: QCInspectionItem): DefectSeverity {
    if (item.isStructural || item.isSafety) return DefectSeverity.CRITICAL;
    if (item.isWaterproofing || item.isElectrical) return DefectSeverity.HIGH;
    return DefectSeverity.MEDIUM;
  }

  /**
   * 決定類別 - SETC-041
   */
  private determineCategory(item: QCInspectionItem): DefectCategory {
    if (item.isStructural) return DefectCategory.STRUCTURAL;
    if (item.isElectrical) return DefectCategory.ELECTRICAL;
    if (item.isWaterproofing) return DefectCategory.WATERPROOFING;
    if (item.isSafety) return DefectCategory.SAFETY;
    return DefectCategory.OTHER;
  }

  /**
   * 計算期限 - SETC-041
   */
  private calculateDeadline(severity: DefectSeverity): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + SEVERITY_DEADLINE_DAYS[severity]);
    return deadline;
  }

  /**
   * 檢查是否逾期 - SETC-041
   */
  private isOverdue(defect: QADefect, now: Date): boolean {
    if (!defect.deadline) return false;
    const closedStatuses = [DefectStatus.VERIFIED, DefectStatus.CLOSED];
    if (closedStatuses.includes(defect.status)) return false;
    return now > defect.deadline;
  }
}
