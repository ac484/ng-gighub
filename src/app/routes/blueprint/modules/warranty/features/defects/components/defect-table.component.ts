/**
 * Defect Table Component
 * 缺失表格元件
 *
 * 使用 ng-alain ST 顯示缺失列表
 *
 * @module DefectTableComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { WarrantyDefect } from '../../../core';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

/**
 * 缺失表格元件
 */
@Component({
  selector: 'app-defect-table',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <st
      #st
      [data]="defects()"
      [columns]="columns"
      [loading]="loading()"
      [page]="{ show: true, showSize: false }"
      [ps]="10"
      (change)="change.emit($event)"
    />
  `
})
export class DefectTableComponent {
  /**
   * 缺失列表
   */
  defects = input.required<WarrantyDefect[]>();

  /**
   * 載入狀態
   */
  loading = input<boolean>(false);

  /**
   * 表格變更事件
   */
  change = output<STChange>();

  /**
   * 確認缺失事件
   */
  confirmDefect = output<WarrantyDefect>();

  /**
   * 建立維修事件
   */
  createRepair = output<WarrantyDefect>();

  /**
   * 查看詳情事件
   */
  viewDetail = output<WarrantyDefect>();

  /**
   * ST 表格欄位定義
   */
  columns: STColumn[] = [
    { title: '缺失編號', index: 'defectNumber', width: 150 },
    {
      title: '嚴重程度',
      index: 'severity',
      width: 100,
      type: 'badge',
      badge: {
        critical: { text: '嚴重', color: 'error' },
        major: { text: '主要', color: 'warning' },
        minor: { text: '輕微', color: 'success' }
      }
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        reported: { text: '已回報', color: 'default' },
        confirmed: { text: '已確認', color: 'processing' },
        under_repair: { text: '維修中', color: 'warning' },
        repaired: { text: '已維修', color: 'success' },
        verified: { text: '已驗收', color: 'success' },
        closed: { text: '已結案', color: 'default' },
        rejected: { text: '已拒絕', color: 'error' }
      }
    },
    { title: '類別', index: 'category', width: 100 },
    { title: '位置', index: 'location', width: 150 },
    { title: '說明', index: 'description', width: 200 },
    {
      title: '發現日期',
      index: 'discoveredDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        {
          text: '確認',
          type: 'link',
          iif: (record: WarrantyDefect) => record.status === 'reported',
          click: (record: WarrantyDefect) => this.confirmDefect.emit(record)
        },
        {
          text: '維修',
          type: 'link',
          iif: (record: WarrantyDefect) => record.status === 'confirmed',
          click: (record: WarrantyDefect) => this.createRepair.emit(record)
        },
        {
          text: '詳情',
          type: 'link',
          click: (record: WarrantyDefect) => this.viewDetail.emit(record)
        }
      ]
    }
  ];
}
