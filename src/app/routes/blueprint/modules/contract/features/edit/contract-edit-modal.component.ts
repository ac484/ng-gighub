/**
 * Contract Edit Modal Component (Refactored)
 * 合約編輯模態元件
 *
 * Feature: Edit
 * Responsibility: Orchestrate edit form components in modal
 * Cohesion: High - manages edit workflow
 * Coupling: Low - uses form components via interface
 * Extensibility: Easy to add new form sections
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoggerService } from '@core';
import { FirebaseService } from '@core/services/firebase.service';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract/facades';
import type { Contract, ContractParty } from '@core/blueprint/modules/implementations/contract/models';
import type { CreateContractDto, UpdateContractDto } from '@core/blueprint/modules/implementations/contract/models/dtos';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { ContractFormComponent } from './components/contract-form.component';
import { ContractorFormComponent } from './components/contractor-form.component';
import { OwnerFormComponent } from './components/owner-form.component';

interface ContractModalData {
  blueprintId: string;
  contract?: Contract;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-edit-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzFormModule, ContractFormComponent, OwnerFormComponent, ContractorFormComponent],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Contract Information -->
      <app-contract-form [form]="form" />

      <!-- Owner Information -->
      <app-owner-form [form]="form" />

      <!-- Contractor Information -->
      <app-contractor-form [form]="form" />

      <!-- Footer Actions -->
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
export class ContractEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly modalData = inject<ContractModalData>(NZ_MODAL_DATA);
  private readonly facade = inject(ContractFacade);
  private readonly firebase = inject(FirebaseService);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);

  // State signals
  submitting = signal(false);
  isEdit = signal(false);

  // Form
  form!: FormGroup;

  ngOnInit(): void {
    // Initialize facade with blueprint context
    const user = this.firebase.currentUser();
    if (user && this.modalData.blueprintId) {
      this.facade.initialize(this.modalData.blueprintId, user.uid);
    }

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

      const owner: ContractParty = {
        id: '',
        name: formValue.ownerName,
        contactPerson: formValue.ownerContactPerson || '',
        contactPhone: formValue.ownerPhone || '',
        contactEmail: formValue.ownerEmail || '',
        type: 'owner'
      };

      const contractor: ContractParty = {
        id: '',
        name: formValue.contractorName,
        contactPerson: formValue.contractorContactPerson || '',
        contactPhone: formValue.contractorPhone || '',
        contactEmail: formValue.contractorEmail || '',
        type: 'contractor'
      };

      if (this.isEdit()) {
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
          createdBy: 'current-user'
        };

        await this.facade.createContract(createData);
        this.message.success('合約建立成功');
      }

      this.modalRef.close(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失敗';
      this.message.error(errorMessage);
      this.logger.error('[ContractEditModalComponent]', 'submit failed', err instanceof Error ? err : undefined);
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.modalRef.close(false);
  }
}
