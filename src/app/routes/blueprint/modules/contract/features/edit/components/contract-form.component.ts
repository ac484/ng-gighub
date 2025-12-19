/**
 * Contract Form Component
 * 合約表單元件
 *
 * Feature: Edit
 * Responsibility: Basic contract information form fields
 * Coupling: Low - only requires form group
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzFormModule],
  template: `
    <div [formGroup]="form()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>合約名稱</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入合約名稱（至少 5 個字元）">
          <input nz-input formControlName="title" placeholder="輸入合約名稱" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="合約描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>合約金額</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入合約金額（必須大於 0）">
          <nz-input-number formControlName="totalAmount" [nzMin]="1" [nzStep]="1000" style="width: 100%"></nz-input-number>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>開始日期</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇開始日期">
          <nz-date-picker formControlName="startDate" style="width: 100%"></nz-date-picker>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>結束日期</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇結束日期（必須晚於開始日期）">
          <nz-date-picker formControlName="endDate" style="width: 100%"></nz-date-picker>
        </nz-form-control>
      </nz-form-item>
    </div>
  `
})
export class ContractFormComponent {
  form = input.required<FormGroup>();
}
