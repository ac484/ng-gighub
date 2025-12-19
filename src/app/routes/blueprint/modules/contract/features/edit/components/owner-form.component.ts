/**
 * Owner Form Component
 * 業主表單元件
 *
 * Feature: Edit
 * Responsibility: Owner party information form fields
 * Coupling: Low - only requires form group
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-owner-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzFormModule, NzDividerModule],
  template: `
    <nz-divider nzText="業主資訊"></nz-divider>

    <nz-form-item>
      <nz-form-label [nzSpan]="6" nzRequired>業主名稱</nz-form-label>
      <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主名稱">
        <input nz-input [formControl]="form().get('ownerName')!" placeholder="業主公司名稱" />
      </nz-form-control>
    </nz-form-item>

    <nz-form-item>
      <nz-form-label [nzSpan]="6" nzRequired>業主聯絡人</nz-form-label>
      <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主聯絡人">
        <input nz-input [formControl]="form().get('ownerContactPerson')!" placeholder="業主聯絡人姓名" />
      </nz-form-control>
    </nz-form-item>

    <nz-form-item>
      <nz-form-label [nzSpan]="6" nzRequired>業主電話</nz-form-label>
      <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主電話">
        <input nz-input [formControl]="form().get('ownerPhone')!" placeholder="業主聯絡電話" />
      </nz-form-control>
    </nz-form-item>

    <nz-form-item>
      <nz-form-label [nzSpan]="6" nzRequired>業主電子郵件</nz-form-label>
      <nz-form-control [nzSpan]="16" nzErrorTip="請輸入有效的電子郵件">
        <input nz-input [formControl]="form().get('ownerEmail')!" placeholder="業主電子郵件" />
      </nz-form-control>
    </nz-form-item>
  `
})
export class OwnerFormComponent {
  form = input.required<FormGroup>();
}
