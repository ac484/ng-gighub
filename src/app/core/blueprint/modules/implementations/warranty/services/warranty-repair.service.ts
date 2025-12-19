/**
 * Warranty Repair Service - 保固維修管理服務
 *
 * SETC-036: Warranty Repair Management Service
 *
 * 提供維修派工、進度追蹤、完工驗收功能
 *
 * @module WarrantyRepairService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';

import type {
  WarrantyRepair,
  RepairStatus,
  CostResponsibility,
  CreateRepairOptions,
  CompleteRepairOptions,
  VerifyRepairOptions
} from '../models/warranty-repair.model';
import { RepairStateMachine } from '../models/warranty-status-machine';
import type { WarrantorInfo, FileAttachment } from '../models/warranty.model';
import { WarrantyDefectRepository } from '../repositories/warranty-defect.repository';
import { WarrantyRepairRepository } from '../repositories/warranty-repair.repository';
import { WarrantyRepository } from '../repositories/warranty.repository';

/**
 * 建立維修工單 DTO
 */
export interface CreateRepairDto {
  /** 藍圖 ID */
  blueprintId: string;
  /** 保固 ID */
  warrantyId: string;
  /** 缺失 ID */
  defectId: string;
  /** 維修說明 */
  description: string;
  /** 維修方法 */
  repairMethod?: string;
  /** 承攬廠商 */
  contractor: WarrantorInfo;
  /** 費用責任方 */
  costResponsibility?: CostResponsibility;
}

/**
 * 維修統計
 */
export interface RepairStatistics {
  /** 總數 */
  total: number;
  /** 按狀態分類 */
  byStatus: Record<RepairStatus, number>;
  /** 進行中數量 */
  inProgress: number;
  /** 已完成數量 */
  completed: number;
  /** 已驗收數量 */
  verified: number;
  /** 總成本 */
  totalCost: number;
}

/**
 * 保固維修管理服務
 */
@Injectable({ providedIn: 'root' })
export class WarrantyRepairService {
  private readonly warrantyRepository = inject(WarrantyRepository);
  private readonly defectRepository = inject(WarrantyDefectRepository);
  private readonly repairRepository = inject(WarrantyRepairRepository);
  private readonly logger = inject(LoggerService);

  /**
   * 建立維修工單
   */
  async createRepair(data: CreateRepairDto, actorId: string): Promise<WarrantyRepair> {
    this.logger.info('[WarrantyRepairService]', `Creating repair for defect ${data.defectId}`);

    // 檢查缺失是否存在且已確認
    const defect = await this.defectRepository.getById(data.blueprintId, data.warrantyId, data.defectId);

    if (!defect) {
      throw new Error(`Defect not found: ${data.defectId}`);
    }

    if (defect.status !== 'confirmed') {
      throw new Error(`Defect must be confirmed before repair. Current status: ${defect.status}`);
    }

    const createOptions: CreateRepairOptions = {
      warrantyId: data.warrantyId,
      defectId: data.defectId,
      description: data.description,
      repairMethod: data.repairMethod,
      contractor: data.contractor,
      costResponsibility: data.costResponsibility,
      createdBy: actorId
    };

    try {
      const repair = await this.repairRepository.create(data.blueprintId, data.warrantyId, createOptions);

      // 更新缺失狀態為維修中
      await this.defectRepository.update(data.blueprintId, data.warrantyId, data.defectId, {
        status: 'under_repair',
        repairId: repair.id,
        updatedBy: actorId
      });

      // 更新保固記錄的維修計數
      await this.warrantyRepository.incrementRepairCount(data.blueprintId, data.warrantyId);

      this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} created`);

      return repair;
    } catch (error) {
      this.logger.error('[WarrantyRepairService]', 'Failed to create repair', error as Error);
      throw error;
    }
  }

  /**
   * 排程維修
   */
  async scheduleRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    scheduledDate: Date,
    actorId: string
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'scheduled');

    await this.repairRepository.update(blueprintId, warrantyId, repairId, {
      scheduledDate,
      updatedBy: actorId
    });

    await this.repairRepository.updateStatus(blueprintId, warrantyId, repairId, 'scheduled', actorId);

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} scheduled for ${scheduledDate}`);

    return { ...repair, status: 'scheduled', scheduledDate };
  }

  /**
   * 開始維修
   */
  async startRepair(blueprintId: string, warrantyId: string, repairId: string, actorId: string): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'in_progress');

    await this.repairRepository.updateStatus(blueprintId, warrantyId, repairId, 'in_progress', actorId);

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} started`);

    return { ...repair, status: 'in_progress', startedDate: new Date() };
  }

  /**
   * 完成維修
   */
  async completeRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    options: {
      completionPhotos?: FileAttachment[];
      completionNotes?: string;
      cost?: number;
      actorId: string;
    }
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'completed');

    const completeOptions: CompleteRepairOptions = {
      completionPhotos: options.completionPhotos,
      completionNotes: options.completionNotes,
      updatedBy: options.actorId
    };

    if (options.cost !== undefined) {
      await this.repairRepository.update(blueprintId, warrantyId, repairId, {
        cost: options.cost,
        updatedBy: options.actorId
      });
    }

    await this.repairRepository.complete(blueprintId, warrantyId, repairId, completeOptions);

    // 更新缺失狀態為已維修
    if (repair.defectId) {
      await this.defectRepository.updateStatus(blueprintId, warrantyId, repair.defectId, 'repaired', options.actorId);
    }

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} completed`);

    return { ...repair, status: 'completed', completedDate: new Date() };
  }

  /**
   * 驗收維修
   */
  async verifyRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    passed: boolean,
    notes: string | undefined,
    actorId: string
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    const targetStatus: RepairStatus = passed ? 'verified' : 'failed';
    RepairStateMachine.validateTransition(repair.status, targetStatus);

    const verifyOptions: VerifyRepairOptions = {
      passed,
      verifiedBy: actorId,
      verificationNotes: notes
    };

    await this.repairRepository.verify(blueprintId, warrantyId, repairId, verifyOptions);

    // 更新缺失狀態
    if (repair.defectId) {
      if (passed) {
        await this.defectRepository.updateStatus(blueprintId, warrantyId, repair.defectId, 'verified', actorId);
      } else {
        // 驗收不通過，缺失回到維修中狀態
        await this.defectRepository.updateStatus(blueprintId, warrantyId, repair.defectId, 'under_repair', actorId);
      }
    }

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} ${passed ? 'verified' : 'failed'}`);

    return { ...repair, status: targetStatus, verifiedDate: new Date() };
  }

  /**
   * 取消維修
   */
  async cancelRepair(blueprintId: string, warrantyId: string, repairId: string, reason: string, actorId: string): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'cancelled');

    await this.repairRepository.updateStatus(blueprintId, warrantyId, repairId, 'cancelled', actorId);

    // 更新缺失狀態回到已確認
    if (repair.defectId) {
      await this.defectRepository.updateStatus(blueprintId, warrantyId, repair.defectId, 'confirmed', actorId);
    }

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} cancelled: ${reason}`);

    return { ...repair, status: 'cancelled' };
  }

  /**
   * 取得進行中的維修
   */
  async getActiveRepairs(blueprintId: string, warrantyId: string): Promise<WarrantyRepair[]> {
    return this.repairRepository.getActiveRepairs(blueprintId, warrantyId);
  }

  /**
   * 取得所有維修
   */
  async getAllRepairs(blueprintId: string, warrantyId: string): Promise<WarrantyRepair[]> {
    return this.repairRepository.getByWarrantyId(blueprintId, warrantyId);
  }

  /**
   * 取得缺失對應的維修
   */
  async getRepairByDefect(blueprintId: string, warrantyId: string, defectId: string): Promise<WarrantyRepair | null> {
    return this.repairRepository.getByDefectId(blueprintId, warrantyId, defectId);
  }

  /**
   * 取得維修統計
   */
  async getRepairStatistics(blueprintId: string, warrantyId: string): Promise<RepairStatistics> {
    const repairs = await this.repairRepository.getByWarrantyId(blueprintId, warrantyId);

    const byStatus: Record<RepairStatus, number> = {
      pending: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      verified: 0,
      failed: 0,
      cancelled: 0
    };

    let totalCost = 0;

    repairs.forEach(r => {
      byStatus[r.status]++;
      if (r.cost) {
        totalCost += r.cost;
      }
    });

    return {
      total: repairs.length,
      byStatus,
      inProgress: repairs.filter(r => ['pending', 'scheduled', 'in_progress'].includes(r.status)).length,
      completed: repairs.filter(r => r.status === 'completed').length,
      verified: repairs.filter(r => r.status === 'verified').length,
      totalCost
    };
  }

  /**
   * 指派維修人員
   */
  async assignWorkers(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    workerIds: string[],
    actorId: string
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    await this.repairRepository.update(blueprintId, warrantyId, repairId, {
      assignedWorkers: workerIds,
      updatedBy: actorId
    });

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} assigned to ${workerIds.length} workers`);

    return { ...repair, assignedWorkers: workerIds };
  }

  /**
   * 更新維修成本
   */
  async updateCost(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    cost: number,
    costResponsibility: CostResponsibility,
    actorId: string
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(blueprintId, warrantyId, repairId);

    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    await this.repairRepository.update(blueprintId, warrantyId, repairId, {
      cost,
      costResponsibility,
      updatedBy: actorId
    });

    this.logger.info('[WarrantyRepairService]', `Repair ${repair.repairNumber} cost updated to ${cost}`);

    return { ...repair, cost, costResponsibility };
  }
}
