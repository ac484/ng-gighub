/**
 * Contract Modal Component
 * 合約建立/編輯模態元件
 *
 * Implements SETC-016: Contract UI Components
 *
 * ✅ Modern Angular 20 patterns:
 * - Signals for reactive state
 * - Standalone component
 * - inject() for DI
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoggerService } from '@core';
import type { Contract, ContractParty } from '@core/blueprint/modules/implementations/contract/models';
import type { CreateContractDto, UpdateContractDto } from '@core/blueprint/modules/implementations/contract/models/dtos';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract/facades';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

interface ContractModalData {
  blueprintId: string;
  contract?: Contract;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzFormModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
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

      <nz-divider nzText="業主資訊"></nz-divider>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>業主名稱</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主名稱">
          <input nz-input formControlName="ownerName" placeholder="業主公司名稱" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>業主聯絡人</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主聯絡人">
          <input nz-input formControlName="ownerContactPerson" placeholder="業主聯絡人姓名" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>業主電話</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入業主電話">
          <input nz-input formControlName="ownerPhone" placeholder="業主聯絡電話" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>業主電子郵件</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入有效的電子郵件">
          <input nz-input formControlName="ownerEmail" placeholder="業主電子郵件" />
        </nz-form-control>
      </nz-form-item>

      <nz-divider nzText="承商資訊"></nz-divider>

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

      <nz-divider nzText="合約資訊"></nz-divider>

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

      <div class="modal-footer">
        <button nz-button nzType="default" type="button" (click)="cancel()">取消</button>
        <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="form.invalid">
          {{ isEdit() ? '更新' : '建立' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .modal-footer {
        text-align: right;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      .modal-footer button {
        margin-left: 8px;
      }
    `
  ]
})
export class ContractModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly modalData = inject<ContractModalData>(NZ_MODAL_DATA);
  private readonly facade = inject(ContractFacade);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);

  // State signals
  submitting = signal(false);
  isEdit = signal(false);

  // Form
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();

    if (this.modalData.contract) {
      this.isEdit.set(true);
      this.populateForm(this.modalData.contract);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: [''],
      ownerName: ['', [Validators.required]],
      ownerContactPerson: ['', [Validators.required]],
      ownerPhone: ['', [Validators.required]],
      ownerEmail: ['', [Validators.required, Validators.email]],
      contractorName: ['', [Validators.required]],
      contractorContactPerson: ['', [Validators.required]],
      contractorPhone: ['', [Validators.required]],
      contractorEmail: ['', [Validators.required, Validators.email]],
      totalAmount: [0, [Validators.required, Validators.min(1)]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]]
    });
  }

  private populateForm(contract: Contract): void {
    this.form.patchValue({
      title: contract.title,
      description: contract.description || '',
      ownerName: contract.owner?.name || '',
      ownerContactPerson: contract.owner?.contactPerson || '',
      ownerPhone: contract.owner?.contactPhone || '',
      ownerEmail: contract.owner?.contactEmail || '',
      contractorName: contract.contractor?.name || '',
      contractorContactPerson: contract.contractor?.contactPerson || '',
      contractorPhone: contract.contractor?.contactPhone || '',
      contractorEmail: contract.contractor?.contactEmail || '',
      totalAmount: contract.totalAmount,
      startDate: contract.startDate,
      endDate: contract.endDate
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsDirty();
        control?.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;

      // Build owner party
      const owner: ContractParty = {
        id: '',
        name: formValue.ownerName,
        contactPerson: formValue.ownerContactPerson || '',
        contactPhone: formValue.ownerPhone || '',
        contactEmail: formValue.ownerEmail || '',
        type: 'owner'
      };

      // Build contractor party
      const contractor: ContractParty = {
        id: '',
        name: formValue.contractorName,
        contactPerson: formValue.contractorContactPerson || '',
        contactPhone: formValue.contractorPhone || '',
        contactEmail: formValue.contractorEmail || '',
        type: 'contractor'
      };

      if (this.isEdit()) {
        // Update existing contract
        const updateData: UpdateContractDto = {
          title: formValue.title,
          description: formValue.description || undefined,
          owner,
          contractor,
          totalAmount: formValue.totalAmount,
          startDate: formValue.startDate,
          endDate: formValue.endDate
        };

        await this.facade.updateContract(this.modalData.contract!.id, updateData);
        this.message.success('合約更新成功');
      } else {
        // Create new contract
        const createData: CreateContractDto = {
          blueprintId: this.modalData.blueprintId,
          title: formValue.title,
          description: formValue.description || undefined,
          owner,
          contractor,
          totalAmount: formValue.totalAmount,
          currency: 'TWD',
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          createdBy: 'current-user' // TODO: Get from auth service
        };

        await this.facade.createContract(createData);
        this.message.success('合約建立成功');
      }

      this.modalRef.close(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失敗';
      this.message.error(errorMessage);
      this.logger.error('[ContractModalComponent]', 'submit failed', err instanceof Error ? err : undefined);
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.modalRef.close(false);
  }
}
