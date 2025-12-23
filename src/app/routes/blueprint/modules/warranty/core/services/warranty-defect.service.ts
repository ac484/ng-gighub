/**
 * Warranty Defect Service - 保固缺失管理服務
 *
 * SETC-035: Warranty Defect Management Service
 *
 * 提供缺失登記、確認、拒絕、狀態管理功能
 *
 * @module WarrantyDefectService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';

import type {
  WarrantyDefect,
  WarrantyDefectStatus,
  DefectCategory,
  DefectSeverity,
  CreateDefectOptions
} from '../models/warranty-defect.model';
import { DefectStateMachine } from '../models/warranty-status-machine';
import type { FileAttachment } from '../models/warranty.model';
import { WarrantyDefectRepository } from '../repositories/warranty-defect.repository';
import { WarrantyRepository } from '../repositories/warranty.repository';

/**
 * 報告缺失 DTO
 */
export interface ReportDefectDto {
  /** 藍圖 ID */
  blueprintId: string;
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
}

/**
 * 缺失統計
 */
export interface DefectStatistics {
  /** 總數 */
  total: number;
  /** 按嚴重程度分類 */
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
  };
  /** 按狀態分類 */
  byStatus: {
    open: number;
    resolved: number;
    rejected: number;
  };
  /** 按類別分類 */
  byCategory: Record<DefectCategory, number>;
}

/**
 * 保固缺失管理服務
 */
@Injectable({ providedIn: 'root' })
export class WarrantyDefectService {
  private readonly warrantyRepository = inject(WarrantyRepository);
  private readonly defectRepository = inject(WarrantyDefectRepository);
  private readonly logger = inject(LoggerService);

  /**
   * 登記保固缺失
   */
  async reportDefect(data: ReportDefectDto, actorId: string): Promise<WarrantyDefect> {
    this.logger.info('[WarrantyDefectService]', `Reporting defect for warranty ${data.warrantyId}`);

    // 檢查保固是否存在且處於有效狀態
    const warranty = await this.warrantyRepository.getById(data.blueprintId, data.warrantyId);

    if (!warranty) {
      throw new Error(`Warranty not found: ${data.warrantyId}`);
    }

    if (warranty.status !== 'active' && warranty.status !== 'expiring') {
      throw new Error(`Cannot report defect for warranty in status: ${warranty.status}`);
    }

    const createOptions: CreateDefectOptions = {
      warrantyId: data.warrantyId,
      description: data.description,
      location: data.location,
      category: data.category,
      severity: data.severity,
      discoveredDate: data.discoveredDate,
      reporterContact: data.reporterContact,
      photos: data.photos,
      createdBy: actorId
    };

    try {
      const defect = await this.defectRepository.create(data.blueprintId, data.warrantyId, createOptions);

      // 更新保固記錄的缺失計數
      await this.warrantyRepository.incrementDefectCount(data.blueprintId, data.warrantyId);

      this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} reported`);

      return defect;
    } catch (error) {
      this.logger.error('[WarrantyDefectService]', 'Failed to report defect', error as Error);
      throw error;
    }
  }

  /**
   * 確認缺失
   */
  async confirmDefect(blueprintId: string, warrantyId: string, defectId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'confirmed');

    await this.defectRepository.updateStatus(blueprintId, warrantyId, defectId, 'confirmed', actorId);

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} confirmed`);

    return { ...defect, status: 'confirmed' };
  }

  /**
   * 拒絕缺失（非保固範圍）
   */
  async rejectDefect(blueprintId: string, warrantyId: string, defectId: string, reason: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'rejected');

    await this.defectRepository.update(blueprintId, warrantyId, defectId, {
      status: 'rejected',
      updatedBy: actorId
    });

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} rejected: ${reason}`);

    return { ...defect, status: 'rejected' };
  }

  /**
   * 開始維修
   */
  async startRepair(blueprintId: string, warrantyId: string, defectId: string, repairId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'under_repair');

    await this.defectRepository.update(blueprintId, warrantyId, defectId, {
      status: 'under_repair',
      repairId,
      updatedBy: actorId
    });

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} under repair`);

    return { ...defect, status: 'under_repair', repairId };
  }

  /**
   * 標記維修完成
   */
  async markRepaired(blueprintId: string, warrantyId: string, defectId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'repaired');

    await this.defectRepository.updateStatus(blueprintId, warrantyId, defectId, 'repaired', actorId);

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} repaired`);

    return { ...defect, status: 'repaired' };
  }

  /**
   * 驗證維修結果
   */
  async verifyRepair(blueprintId: string, warrantyId: string, defectId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'verified');

    await this.defectRepository.updateStatus(blueprintId, warrantyId, defectId, 'verified', actorId);

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} verified`);

    return { ...defect, status: 'verified' };
  }

  /**
   * 結案缺失
   */
  async closeDefect(blueprintId: string, warrantyId: string, defectId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'closed');

    await this.defectRepository.updateStatus(blueprintId, warrantyId, defectId, 'closed', actorId);

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} closed`);

    return { ...defect, status: 'closed' };
  }

  /**
   * 關聯 Issue
   */
  async linkIssue(blueprintId: string, warrantyId: string, defectId: string, issueId: string, actorId: string): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(blueprintId, warrantyId, defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    await this.defectRepository.update(blueprintId, warrantyId, defectId, {
      issueId,
      updatedBy: actorId
    });

    this.logger.info('[WarrantyDefectService]', `Defect ${defect.defectNumber} linked to issue ${issueId}`);

    return { ...defect, issueId };
  }

  /**
   * 取得未結案的缺失
   */
  async getOpenDefects(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]> {
    return this.defectRepository.getOpenDefects(blueprintId, warrantyId);
  }

  /**
   * 取得所有缺失
   */
  async getAllDefects(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]> {
    return this.defectRepository.getByWarrantyId(blueprintId, warrantyId);
  }

  /**
   * 取得指定嚴重程度的缺失
   */
  async getDefectsBySeverity(blueprintId: string, warrantyId: string, severity: DefectSeverity): Promise<WarrantyDefect[]> {
    return this.defectRepository.getBySeverity(blueprintId, warrantyId, severity);
  }

  /**
   * 取得嚴重缺失（需要建立 Issue）
   */
  async getCriticalDefects(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]> {
    return this.defectRepository.getBySeverity(blueprintId, warrantyId, 'critical');
  }

  /**
   * 取得缺失統計
   */
  async getDefectStatistics(blueprintId: string, warrantyId: string): Promise<DefectStatistics> {
    const defects = await this.defectRepository.getByWarrantyId(blueprintId, warrantyId);

    const openStatuses: WarrantyDefectStatus[] = ['reported', 'confirmed', 'under_repair'];
    const resolvedStatuses: WarrantyDefectStatus[] = ['repaired', 'verified', 'closed'];

    const byCategory: Record<DefectCategory, number> = {
      structural: 0,
      waterproofing: 0,
      electrical: 0,
      plumbing: 0,
      finishing: 0,
      mechanical: 0,
      other: 0
    };

    defects.forEach(d => {
      if (d.category in byCategory) {
        byCategory[d.category]++;
      }
    });

    return {
      total: defects.length,
      bySeverity: {
        critical: defects.filter(d => d.severity === 'critical').length,
        major: defects.filter(d => d.severity === 'major').length,
        minor: defects.filter(d => d.severity === 'minor').length
      },
      byStatus: {
        open: defects.filter(d => openStatuses.includes(d.status)).length,
        resolved: defects.filter(d => resolvedStatuses.includes(d.status)).length,
        rejected: defects.filter(d => d.status === 'rejected').length
      },
      byCategory
    };
  }

  /**
   * 檢查是否需要建立 Issue
   */
  shouldCreateIssue(defect: WarrantyDefect): boolean {
    return defect.severity === 'critical' && !defect.issueId;
  }
}
