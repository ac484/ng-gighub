import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { ContractFacade } from '../services/contract.facade';
import { ContractType } from '../shared/types/contract.types';

@Component({
  selector: 'app-contract-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, ReactiveFormsModule],
  template: `
    <page-header [title]="'建立合約'" />
    <nz-card>
      <form [formGroup]="form" class="grid grid-cols-2 gap-md">
        <nz-form-item>
          <nz-form-label>標題</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="title" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>編號</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="contractNumber" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>類型</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="contractType">
              @for (type of contractTypes; track type) {
                <nz-option [nzLabel]="type" [nzValue]="type" />
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>總額</nz-form-label>
          <nz-form-control>
            <input nz-input type="number" formControlName="totalAmount" />
          </nz-form-control>
        </nz-form-item>
        <nz-form-item class="col-span-2">
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea nz-input rows="3" formControlName="description"></textarea>
          </nz-form-control>
        </nz-form-item>
      </form>
      <div class="flex justify-end gap-sm mt-md">
        <button nz-button nzType="default" (click)="reset()">清除</button>
        <button nz-button nzType="primary" [disabled]="form.invalid" (click)="submit()">送出</button>
      </div>
    </nz-card>
  `
})
export class ContractWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ContractFacade);

  readonly blueprintId = input<string>();
  readonly contractTypes: ContractType[] = ['main_contract', 'sub_contract', 'supplement', 'change_order', 'other'];
  readonly form = this.fb.group({
    title: ['', Validators.required],
    contractNumber: ['', Validators.required],
    contractType: ['main_contract' as ContractType, Validators.required],
    totalAmount: [0, Validators.required],
    description: ['']
  });

  submit(): void {
    // Placeholder submit — real implementation will call repository/service
    this.reset();
  }

  reset(): void {
    this.form.reset({
      title: '',
      contractNumber: '',
      contractType: 'main_contract',
      totalAmount: 0,
      description: ''
    });
  }
}
