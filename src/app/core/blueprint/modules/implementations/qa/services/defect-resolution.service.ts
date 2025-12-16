/**
 * Defect Resolution Service - SETC-042
 *
 * 缺失整改服務
 * - 開始整改
 * - 進度追蹤
 * - 完成回報
 * - 附件管理
 *
 * @module QA
 * @author GigHub Development Team
 * @date 2025-12-16
 * @implements SETC-042
 */

import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { QADefect, DefectStatus, EventActor } from '../models';
import { QaRepository } from '../repositories/qa.repository';

/**
 * 整改進度記錄 - SETC-042
 */
export interface ResolutionProgress {
  id: string;
  description: string;
  percentage: number;
  photos: string[];
  createdBy: string;
  createdAt: Date;
}

/**
 * 開始整改 DTO - SETC-042
 */
export interface StartResolutionDto {
  plan: string;
  estimatedCompletionDate?: Date;
  assignedWorkers?: string[];
}

/**
 * 更新進度 DTO - SETC-042
 */
export interface UpdateProgressDto {
  description: string;
  percentage: number;
  photos?: string[];
}

/**
 * 完成整改 DTO - SETC-042
 */
export interface CompleteResolutionDto {
  summary: string;
  photos?: string[];
  attachments?: string[];
}

@Injectable({ providedIn: 'root' })
export class DefectResolutionService {
  private repository = inject(QaRepository);

  /**
   * 開始整改 - SETC-042
   */
  async startResolution(blueprintId: string, defectId: string, data: StartResolutionDto, actor: EventActor): Promise<QADefect> {
    const defect = await this.getDefect(blueprintId, defectId);

    // 驗證狀態
    if (defect.status !== DefectStatus.ASSIGNED) {
      throw new Error(`Defect must be assigned before starting resolution: ${defect.status}`);
    }

    await this.repository.update(blueprintId, defectId, {
      status: DefectStatus.IN_PROGRESS,
      metadata: {
        ...defect.metadata,
        resolutionPlan: data.plan,
        resolutionStartedAt: new Date(),
        estimatedCompletionDate: data.estimatedCompletionDate,
        assignedWorkers: data.assignedWorkers,
        progressUpdates: [],
        currentProgress: 0
      },
      updatedBy: actor.userId
    });

    return {
      ...defect,
      status: DefectStatus.IN_PROGRESS
    };
  }

  /**
   * 更新進度 - SETC-042
   */
  async updateProgress(blueprintId: string, defectId: string, data: UpdateProgressDto, actor: EventActor): Promise<QADefect> {
    const defect = await this.getDefect(blueprintId, defectId);

    if (defect.status !== DefectStatus.IN_PROGRESS) {
      throw new Error(`Can only update progress for in-progress defects: ${defect.status}`);
    }

    const progress: ResolutionProgress = {
      id: this.generateProgressId(),
      description: data.description,
      percentage: data.percentage,
      photos: data.photos || [],
      createdBy: actor.userId,
      createdAt: new Date()
    };

    const existingProgress = (defect.metadata?.['progressUpdates'] as ResolutionProgress[]) || [];

    await this.repository.update(blueprintId, defectId, {
      metadata: {
        ...defect.metadata,
        progressUpdates: [...existingProgress, progress],
        currentProgress: data.percentage
      },
      updatedBy: actor.userId
    });

    return {
      ...defect,
      metadata: {
        ...defect.metadata,
        currentProgress: data.percentage
      }
    };
  }

  /**
   * 完成整改 - SETC-042
   */
  async completeResolution(blueprintId: string, defectId: string, data: CompleteResolutionDto, actor: EventActor): Promise<QADefect> {
    const defect = await this.getDefect(blueprintId, defectId);

    if (defect.status !== DefectStatus.IN_PROGRESS) {
      throw new Error(`Can only complete in-progress defects: ${defect.status}`);
    }

    await this.repository.update(blueprintId, defectId, {
      status: DefectStatus.RESOLVED,
      resolvedDate: new Date(),
      metadata: {
        ...defect.metadata,
        resolutionSummary: data.summary,
        resolutionPhotos: data.photos,
        resolutionAttachments: data.attachments,
        resolutionCompletedAt: new Date(),
        currentProgress: 100
      },
      updatedBy: actor.userId
    });

    return {
      ...defect,
      status: DefectStatus.RESOLVED,
      resolvedDate: new Date()
    };
  }

  /**
   * 添加附件 - SETC-042
   */
  async addAttachment(
    blueprintId: string,
    defectId: string,
    attachment: { url: string; name: string; type: string },
    actor: EventActor
  ): Promise<QADefect> {
    const defect = await this.getDefect(blueprintId, defectId);

    const existingAttachments = (defect.metadata?.['attachments'] as unknown[]) || [];

    await this.repository.update(blueprintId, defectId, {
      metadata: {
        ...defect.metadata,
        attachments: [...existingAttachments, attachment]
      },
      updatedBy: actor.userId
    });

    return defect;
  }

  /**
   * 添加整改照片 - SETC-042
   */
  async addResolutionPhoto(blueprintId: string, defectId: string, photoUrl: string, actor: EventActor): Promise<QADefect> {
    const defect = await this.getDefect(blueprintId, defectId);

    const existingPhotos = defect.photos || [];

    await this.repository.update(blueprintId, defectId, {
      photos: [...existingPhotos, photoUrl],
      updatedBy: actor.userId
    });

    return {
      ...defect,
      photos: [...existingPhotos, photoUrl]
    };
  }

  /**
   * 取得進度歷史 - SETC-042
   */
  async getProgressHistory(blueprintId: string, defectId: string): Promise<ResolutionProgress[]> {
    const defect = await this.getDefect(blueprintId, defectId);
    return (defect.metadata?.['progressUpdates'] as ResolutionProgress[]) || [];
  }

  /**
   * 取得當前進度 - SETC-042
   */
  async getCurrentProgress(blueprintId: string, defectId: string): Promise<number> {
    const defect = await this.getDefect(blueprintId, defectId);
    return (defect.metadata?.['currentProgress'] as number) || 0;
  }

  // ========== 輔助方法 ==========

  private async getDefect(blueprintId: string, defectId: string): Promise<QADefect> {
    const defect = await lastValueFrom(this.repository.findById(blueprintId, defectId));
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }
    return defect;
  }

  private generateProgressId(): string {
    return `PROG-${Date.now().toString(36).toUpperCase()}`;
  }
}
