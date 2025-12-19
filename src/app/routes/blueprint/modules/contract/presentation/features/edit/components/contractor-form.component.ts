/**
 * Contractor Form Component
 * 承商表單元件
 *
 * Feature: Edit
 * Responsibility: Contractor party information form fields
 * Coupling: Low - only requires form group
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-contractor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzFormModule, NzDividerModule],
  template: `
    <nz-divider nzText="承商資訊"></nz-divider>

    <div [formGroup]="form()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>承商名稱</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入承商名稱">
          <input nz-input formControlName="contractorName" placeholder="承商公司名稱" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>承商聯絡人</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入承商聯絡人">
          <input nz-input formControlName="contractorContactPerson" placeholder="承商聯絡人姓名" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>承商電話</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入承商電話">
          <input nz-input formControlName="contractorPhone" placeholder="承商聯絡電話" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>承商電子郵件</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入有效的電子郵件">
          <input nz-input formControlName="contractorEmail" placeholder="承商電子郵件" />
        </nz-form-control>
      </nz-form-item>
    </div>
  `
})
export class ContractorFormComponent {
  form = input.required<FormGroup>();
}
