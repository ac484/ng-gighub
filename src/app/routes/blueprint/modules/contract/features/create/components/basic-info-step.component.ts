/**
 * Basic Info Step Component
 * 基本資訊步驟元件
 *
 * Feature: Create
 * Responsibility: Collect basic contract information
 * Interface: Form group input/output for validation
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-basic-info-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzFormModule],
  template: `
    <div class="step-content">
      <h3>填寫合約基本資料</h3>
      <form nz-form [formGroup]="form()" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label nzRequired>合約標題</nz-form-label>
          <nz-form-control nzErrorTip="請輸入合約標題">
            <input nz-input formControlName="title" placeholder="請輸入合約標題" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>合約描述</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="description" placeholder="請輸入合約描述" rows="3"></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label nzRequired>合約金額</nz-form-label>
          <nz-form-control nzErrorTip="請輸入合約金額">
            <nz-input-number formControlName="totalAmount" [nzMin]="0" [nzStep]="1000" style="width: 100%;" placeholder="請輸入金額" />
          </nz-form-control>
        </nz-form-item>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>開始日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇開始日期">
                <nz-date-picker formControlName="startDate" style="width: 100%;" placeholder="請選擇開始日期" />
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>結束日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇結束日期">
                <nz-date-picker formControlName="endDate" style="width: 100%;" placeholder="請選擇結束日期" />
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .step-content {
        max-width: 800px;
        margin: 0 auto;
      }
    `
  ]
})
export class BasicInfoStepComponent {
  form = input.required<FormGroup>();
}
