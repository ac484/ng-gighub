/**
 * Warranty Table Component
 * 保固表格元件
 *
 * 使用 ng-alain ST 顯示保固列表
 *
 * @module WarrantyTableComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import type { Warranty } from '@core/blueprint/modules/implementations/warranty';

/**
 * 保固表格元件
 */
@Component({
  selector: 'app-warranty-table',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <st
      #st
      [data]="warranties()"
      [columns]="columns"
      [loading]="loading()"
      [page]="{ show: true, pageSize: 10 }"
      (change)="change.emit($event)"
    />
  `
})
export class WarrantyTableComponent {
  /**
   * 保固列表
   */
  warranties = input.required<Warranty[]>();

  /**
   * 載入狀態
   */
  loading = input<boolean>(false);

  /**
   * 表格變更事件
   */
  change = output<STChange>();

  /**
   * 查看詳情事件
   */
  viewDetail = output<Warranty>();

  /**
   * 查看缺失事件
   */
  viewDefects = output<Warranty>();

  /**
   * ST 表格欄位定義
   */
  columns: STColumn[] = [
    { title: '保固編號', index: 'warrantyNumber', width: 150 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待啟動', color: 'default' },
        active: { text: '活動中', color: 'success' },
        expiring: { text: '即將到期', color: 'warning' },
        expired: { text: '已過期', color: 'error' },
        completed: { text: '已完成', color: 'processing' },
        voided: { text: '已作廢', color: 'default' }
      }
    },
    { title: '保固責任方', index: 'warrantor.name', width: 150 },
    {
      title: '保固期限',
      index: 'periodInMonths',
      width: 80,
      format: item => `${item.periodInMonths} 個月`
    },
    {
      title: '開始日期',
      index: 'startDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    {
      title: '結束日期',
      index: 'endDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    { title: '缺失數', index: 'defectCount', width: 80, className: 'text-center' },
    { title: '維修數', index: 'repairCount', width: 80, className: 'text-center' },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '查看',
          type: 'link',
          click: (record: Warranty) => this.viewDetail.emit(record)
        },
        {
          text: '缺失',
          type: 'link',
          click: (record: Warranty) => this.viewDefects.emit(record)
        }
      ]
    }
  ];
}
