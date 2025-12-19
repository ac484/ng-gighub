/**
 * Warranty Status Badge Component
 * 保固狀態標籤元件
 *
 * 可重用的狀態標籤元件，用於顯示保固狀態
 *
 * @module WarrantyStatusBadgeComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import type { WarrantyStatus } from '@core/blueprint/modules/implementations/warranty';

/**
 * 保固狀態標籤元件
 */
@Component({
  selector: 'app-warranty-status-badge',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('pending') {
        <nz-tag nzColor="default">待啟動</nz-tag>
      }
      @case ('active') {
        <nz-tag nzColor="success">活動中</nz-tag>
      }
      @case ('expiring') {
        <nz-tag nzColor="warning">即將到期</nz-tag>
      }
      @case ('expired') {
        <nz-tag nzColor="error">已過期</nz-tag>
      }
      @case ('completed') {
        <nz-tag nzColor="processing">已完成</nz-tag>
      }
      @case ('voided') {
        <nz-tag nzColor="default">已作廢</nz-tag>
      }
      @default {
        <nz-tag>未知</nz-tag>
      }
    }
  `
})
export class WarrantyStatusBadgeComponent {
  /**
   * 保固狀態
   */
  status = input.required<WarrantyStatus>();
}
