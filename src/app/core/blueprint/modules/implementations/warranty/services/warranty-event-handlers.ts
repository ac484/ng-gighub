/**
 * Warranty Event Handlers - 保固事件處理器
 *
 * SETC-037: Warranty Event Integration
 *
 * 提供保固模組與事件總線的整合，實現事件驅動的保固管理
 *
 * @module WarrantyEventHandlers
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';

import { WarrantyPeriodService } from './warranty-period.service';
import type { WarrantyDefect } from '../models/warranty-defect.model';
import type { WarrantyRepair } from '../models/warranty-repair.model';
import type { Warranty } from '../models/warranty.model';
import { WARRANTY_MODULE_EVENTS, WarrantyEventType } from '../module.metadata';

/**
 * 事件資料介面
 */
export interface WarrantyEventData {
  warrantyId: string;
  blueprintId: string;
  [key: string]: unknown;
}

export interface DefectEventData extends WarrantyEventData {
  defectId: string;
  severity?: string;
}

export interface RepairEventData extends WarrantyEventData {
  repairId: string;
  defectId: string;
}

/**
 * 事件回調類型
 */
export type WarrantyEventCallback<T = WarrantyEventData> = (data: T) => void | Promise<void>;

/**
 * 事件訂閱
 */
interface EventSubscription {
  eventType: WarrantyEventType;
  callback: WarrantyEventCallback;
  id: string;
}

/**
 * 保固事件處理器
 */
@Injectable({ providedIn: 'root' })
export class WarrantyEventHandlers {
  private readonly logger = inject(LoggerService);
  private readonly warrantyPeriodService = inject(WarrantyPeriodService);

  private subscriptions: EventSubscription[] = [];
  private subscriptionIdCounter = 0;

  /**
   * 訂閱事件
   */
  subscribe<T extends WarrantyEventData>(eventType: WarrantyEventType, callback: WarrantyEventCallback<T>): string {
    const id = `sub-${++this.subscriptionIdCounter}`;
    this.subscriptions.push({
      eventType,
      callback: callback as WarrantyEventCallback,
      id
    });
    this.logger.debug('[WarrantyEventHandlers]', `Subscribed to ${eventType} with id ${id}`);
    return id;
  }

  /**
   * 取消訂閱
   */
  unsubscribe(subscriptionId: string): void {
    const index = this.subscriptions.findIndex(s => s.id === subscriptionId);
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
      this.logger.debug('[WarrantyEventHandlers]', `Unsubscribed ${subscriptionId}`);
    }
  }

  /**
   * 發送事件
   */
  async emit(eventType: WarrantyEventType, data: WarrantyEventData): Promise<void> {
    this.logger.info('[WarrantyEventHandlers]', `Emitting ${eventType}`, data);

    const subscribers = this.subscriptions.filter(s => s.eventType === eventType);

    for (const subscriber of subscribers) {
      try {
        await subscriber.callback(data);
      } catch (error) {
        this.logger.error('[WarrantyEventHandlers]', `Error in subscriber ${subscriber.id} for ${eventType}`, error as Error);
      }
    }
  }

  // =====================================
  // 保固生命週期事件
  // =====================================

  /**
   * 發送：保固期開始
   */
  async emitWarrantyStarted(warranty: Warranty): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.WARRANTY_ACTIVATED as WarrantyEventType, {
      warrantyId: warranty.id,
      blueprintId: warranty.blueprintId,
      warrantyNumber: warranty.warrantyNumber,
      startDate: warranty.startDate,
      endDate: warranty.endDate,
      periodInMonths: warranty.periodInMonths
    });
  }

  /**
   * 發送：保固狀態變更
   */
  async emitWarrantyStatusChanged(warranty: Warranty, previousStatus: string, newStatus: string): Promise<void> {
    // Note: This event doesn't exist in WARRANTY_MODULE_EVENTS, using a generic approach
    await this.emit('warranty.status_changed' as WarrantyEventType, {
      warrantyId: warranty.id,
      blueprintId: warranty.blueprintId,
      warrantyNumber: warranty.warrantyNumber,
      previousStatus,
      newStatus
    });
  }

  /**
   * 發送：保固即將到期
   */
  async emitWarrantyExpiringSoon(warranty: Warranty, daysRemaining: number): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.WARRANTY_EXPIRING as WarrantyEventType, {
      warrantyId: warranty.id,
      blueprintId: warranty.blueprintId,
      warrantyNumber: warranty.warrantyNumber,
      endDate: warranty.endDate,
      daysRemaining
    });
  }

  /**
   * 發送：保固已過期
   */
  async emitWarrantyExpired(warranty: Warranty): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.WARRANTY_EXPIRED as WarrantyEventType, {
      warrantyId: warranty.id,
      blueprintId: warranty.blueprintId,
      warrantyNumber: warranty.warrantyNumber,
      endDate: warranty.endDate
    });
  }

  /**
   * 發送：保固完成
   */
  async emitWarrantyCompleted(warranty: Warranty): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.WARRANTY_COMPLETED as WarrantyEventType, {
      warrantyId: warranty.id,
      blueprintId: warranty.blueprintId,
      warrantyNumber: warranty.warrantyNumber,
      defectCount: warranty.defectCount,
      repairCount: warranty.repairCount
    });
  }

  // =====================================
  // 缺失事件
  // =====================================

  /**
   * 發送：缺失已報告
   */
  async emitDefectReported(defect: WarrantyDefect): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.DEFECT_REPORTED as WarrantyEventType, {
      warrantyId: defect.warrantyId,
      blueprintId: defect.blueprintId,
      defectId: defect.id,
      defectNumber: defect.defectNumber,
      severity: defect.severity,
      category: defect.category
    });
  }

  /**
   * 發送：缺失已確認
   */
  async emitDefectConfirmed(defect: WarrantyDefect): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.DEFECT_CONFIRMED as WarrantyEventType, {
      warrantyId: defect.warrantyId,
      blueprintId: defect.blueprintId,
      defectId: defect.id,
      defectNumber: defect.defectNumber,
      severity: defect.severity
    });
  }

  /**
   * 發送：缺失已拒絕
   */
  async emitDefectRejected(defect: WarrantyDefect, reason: string): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.DEFECT_REJECTED as WarrantyEventType, {
      warrantyId: defect.warrantyId,
      blueprintId: defect.blueprintId,
      defectId: defect.id,
      defectNumber: defect.defectNumber,
      reason
    });
  }

  /**
   * 發送：缺失已結案
   */
  async emitDefectClosed(defect: WarrantyDefect): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.DEFECT_CLOSED as WarrantyEventType, {
      warrantyId: defect.warrantyId,
      blueprintId: defect.blueprintId,
      defectId: defect.id,
      defectNumber: defect.defectNumber
    });
  }

  // =====================================
  // 維修事件
  // =====================================

  /**
   * 發送：維修已建立
   */
  async emitRepairCreated(repair: WarrantyRepair): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.REPAIR_CREATED as WarrantyEventType, {
      warrantyId: repair.warrantyId,
      blueprintId: repair.blueprintId,
      repairId: repair.id,
      defectId: repair.defectId,
      repairNumber: repair.repairNumber
    });
  }

  /**
   * 發送：維修已開始
   */
  async emitRepairStarted(repair: WarrantyRepair): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.REPAIR_STARTED as WarrantyEventType, {
      warrantyId: repair.warrantyId,
      blueprintId: repair.blueprintId,
      repairId: repair.id,
      defectId: repair.defectId,
      repairNumber: repair.repairNumber
    });
  }

  /**
   * 發送：維修已完成
   */
  async emitRepairCompleted(repair: WarrantyRepair): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.REPAIR_COMPLETED as WarrantyEventType, {
      warrantyId: repair.warrantyId,
      blueprintId: repair.blueprintId,
      repairId: repair.id,
      defectId: repair.defectId,
      repairNumber: repair.repairNumber,
      cost: repair.cost
    });
  }

  /**
   * 發送：維修已驗收
   */
  async emitRepairVerified(repair: WarrantyRepair, passed: boolean): Promise<void> {
    await this.emit(WARRANTY_MODULE_EVENTS.REPAIR_VERIFIED as WarrantyEventType, {
      warrantyId: repair.warrantyId,
      blueprintId: repair.blueprintId,
      repairId: repair.id,
      defectId: repair.defectId,
      repairNumber: repair.repairNumber,
      passed
    });
  }

  // =====================================
  // 外部事件處理
  // =====================================

  /**
   * 處理驗收完成事件（從 Acceptance Module）
   */
  async handleAcceptanceCompleted(data: {
    blueprintId: string;
    acceptanceId: string;
    contractId: string;
    taskIds: string[];
    warrantor: unknown;
    actorId: string;
  }): Promise<void> {
    this.logger.info('[WarrantyEventHandlers]', 'Handling acceptance completed event', data);

    try {
      // 自動建立保固記錄
      const warranty = await this.warrantyPeriodService.autoCreateFromAcceptance(
        data.blueprintId,
        data.acceptanceId,
        data.contractId,
        data.taskIds,
        data.warrantor as import('../models/warranty.model').WarrantorInfo,
        { actorId: data.actorId }
      );

      await this.emitWarrantyStarted(warranty);

      this.logger.info('[WarrantyEventHandlers]', `Warranty ${warranty.warrantyNumber} created from acceptance ${data.acceptanceId}`);
    } catch (error) {
      this.logger.error('[WarrantyEventHandlers]', 'Failed to create warranty from acceptance', error as Error);
    }
  }

  /**
   * 清理所有訂閱
   */
  clearAllSubscriptions(): void {
    this.subscriptions = [];
    this.logger.info('[WarrantyEventHandlers]', 'All subscriptions cleared');
  }
}
