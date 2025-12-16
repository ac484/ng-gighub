/**
 * Defect Reinspection Service - SETC-043
 *
 * 缺失複驗服務
 * - 複驗排程
 * - 執行驗證
 * - 通過/不通過處理
 * - 多次複驗追蹤
 *
 * @module QA
 * @author GigHub Development Team
 * @date 2025-12-16
 * @implements SETC-043
 */

import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { QADefect, DefectStatus, EventActor } from '../models';
import { QaRepository } from '../repositories/qa.repository';

/**
 * 複驗狀態 - SETC-043
 */
export type ReinspectionStatus = 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'cancelled';

/**
 * 複驗結果 - SETC-043
 */
export type ReinspectionResult = 'pass' | 'fail';

/**
 * 複驗記錄 - SETC-043
 */
export interface Reinspection {
  id: string;
  defectId: string;
  blueprintId: string;
  reinspectionNumber: string;
  scheduledDate: Date;
  performedDate?: Date;
  inspectorId: string;
  status: ReinspectionStatus;
  result?: ReinspectionResult;
  attempt: number;
  notes?: string;
  photos?: string[];
  checklistResults?: ReinspectionCheckItem[];
  createdBy: string;
  createdAt: Date;
}

/**
 * 複驗檢查項 - SETC-043
 */
export interface ReinspectionCheckItem {
  name: string;
  passed: boolean;
  notes?: string;
}

/**
 * 排程複驗 DTO - SETC-043
 */
export interface ScheduleReinspectionDto {
  scheduledDate: Date;
  inspectorId: string;
}

/**
 * 執行複驗 DTO - SETC-043
 */
export interface PerformReinspectionDto {
  result: ReinspectionResult;
  notes?: string;
  photos?: string[];
  checklistResults?: ReinspectionCheckItem[];
}

@Injectable({ providedIn: 'root' })
export class DefectReinspectionService {
  private repository = inject(QaRepository);

  // 內存複驗記錄（實際應使用 Repository）
  private reinspections = new Map<string, Reinspection>();

  /**
   * 安排複驗 - SETC-043
   */
  async scheduleReinspection(
    blueprintId: string,
    defectId: string,
    data: ScheduleReinspectionDto,
    actor: EventActor
  ): Promise<Reinspection> {
    const defect = await this.getDefect(blueprintId, defectId);

    if (defect.status !== DefectStatus.RESOLVED) {
      throw new Error(`Defect must be resolved before scheduling reinspection: ${defect.status}`);
    }

    const attempt = this.getReinspectionAttempt(defectId);
    const reinspectionNumber = this.generateReinspectionNumber(defect.defectNumber || defectId, attempt);

    const reinspection: Reinspection = {
      id: this.generateReinspectionId(),
      defectId,
      blueprintId,
      reinspectionNumber,
      scheduledDate: data.scheduledDate,
      inspectorId: data.inspectorId,
      status: 'scheduled',
      attempt,
      createdBy: actor.userId,
      createdAt: new Date()
    };

    this.reinspections.set(reinspection.id, reinspection);

    // 更新缺失的複驗資訊
    await this.repository.update(blueprintId, defectId, {
      metadata: {
        ...defect.metadata,
        pendingReinspectionId: reinspection.id,
        scheduledReinspectionDate: data.scheduledDate
      },
      updatedBy: actor.userId
    });

    return reinspection;
  }

  /**
   * 執行複驗 - SETC-043
   */
  async performReinspection(reinspectionId: string, data: PerformReinspectionDto, actor: EventActor): Promise<Reinspection> {
    const reinspection = this.reinspections.get(reinspectionId);
    if (!reinspection) {
      throw new Error(`Reinspection not found: ${reinspectionId}`);
    }

    if (reinspection.status !== 'scheduled' && reinspection.status !== 'in_progress') {
      throw new Error(`Invalid reinspection status for perform: ${reinspection.status}`);
    }

    const passed = data.result === 'pass';
    const status: ReinspectionStatus = passed ? 'passed' : 'failed';

    const updated: Reinspection = {
      ...reinspection,
      status,
      result: data.result,
      performedDate: new Date(),
      notes: data.notes,
      photos: data.photos,
      checklistResults: data.checklistResults
    };

    this.reinspections.set(reinspectionId, updated);

    // 更新缺失狀態
    const newDefectStatus = passed ? DefectStatus.VERIFIED : DefectStatus.IN_PROGRESS;

    await this.repository.update(reinspection.blueprintId, reinspection.defectId, {
      status: newDefectStatus,
      verifiedDate: passed ? new Date() : undefined,
      metadata: {
        lastReinspectionId: reinspectionId,
        lastReinspectionResult: data.result,
        reinspectionCount: reinspection.attempt,
        pendingReinspectionId: null
      },
      updatedBy: actor.userId
    });

    return updated;
  }

  /**
   * 開始複驗（標記進行中）- SETC-043
   */
  async startReinspection(reinspectionId: string, actor: EventActor): Promise<Reinspection> {
    const reinspection = this.reinspections.get(reinspectionId);
    if (!reinspection) {
      throw new Error(`Reinspection not found: ${reinspectionId}`);
    }

    if (reinspection.status !== 'scheduled') {
      throw new Error(`Can only start scheduled reinspection: ${reinspection.status}`);
    }

    const updated: Reinspection = {
      ...reinspection,
      status: 'in_progress'
    };

    this.reinspections.set(reinspectionId, updated);

    await this.repository.update(reinspection.blueprintId, reinspection.defectId, {
      metadata: {
        reinspectionStatus: 'in_progress'
      },
      updatedBy: actor.userId
    });

    return updated;
  }

  /**
   * 取消複驗 - SETC-043
   */
  async cancelReinspection(reinspectionId: string, reason: string, actor: EventActor): Promise<Reinspection> {
    const reinspection = this.reinspections.get(reinspectionId);
    if (!reinspection) {
      throw new Error(`Reinspection not found: ${reinspectionId}`);
    }

    if (reinspection.status !== 'scheduled') {
      throw new Error(`Can only cancel scheduled reinspection: ${reinspection.status}`);
    }

    const updated: Reinspection = {
      ...reinspection,
      status: 'cancelled',
      notes: reason
    };

    this.reinspections.set(reinspectionId, updated);

    await this.repository.update(reinspection.blueprintId, reinspection.defectId, {
      metadata: {
        pendingReinspectionId: null,
        lastCancellationReason: reason
      },
      updatedBy: actor.userId
    });

    return updated;
  }

  /**
   * 取得複驗記錄 - SETC-043
   */
  getReinspection(reinspectionId: string): Reinspection | null {
    return this.reinspections.get(reinspectionId) || null;
  }

  /**
   * 取得缺失的所有複驗記錄 - SETC-043
   */
  getReinspectionsByDefect(defectId: string): Reinspection[] {
    return Array.from(this.reinspections.values())
      .filter(r => r.defectId === defectId)
      .sort((a, b) => a.attempt - b.attempt);
  }

  /**
   * 取得缺失的複驗統計 - SETC-043
   */
  getReinspectionStats(defectId: string): {
    totalAttempts: number;
    passedCount: number;
    failedCount: number;
    lastResult?: ReinspectionResult;
  } {
    const reinspections = this.getReinspectionsByDefect(defectId);
    const completed = reinspections.filter(r => r.status === 'passed' || r.status === 'failed');

    return {
      totalAttempts: reinspections.length,
      passedCount: completed.filter(r => r.result === 'pass').length,
      failedCount: completed.filter(r => r.result === 'fail').length,
      lastResult: completed.length > 0 ? completed[completed.length - 1].result : undefined
    };
  }

  // ========== 輔助方法 ==========

  private async getDefect(blueprintId: string, defectId: string): Promise<QADefect> {
    const defect = await lastValueFrom(this.repository.findById(blueprintId, defectId));
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }
    return defect;
  }

  private generateReinspectionId(): string {
    return `REINSP-${Date.now().toString(36).toUpperCase()}`;
  }

  private generateReinspectionNumber(defectNumber: string, attempt: number): string {
    return `${defectNumber}-R${attempt}`;
  }

  private getReinspectionAttempt(defectId: string): number {
    const existing = this.getReinspectionsByDefect(defectId);
    return existing.length + 1;
  }
}
