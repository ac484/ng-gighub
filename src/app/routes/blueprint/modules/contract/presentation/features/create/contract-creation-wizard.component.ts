/**
 * Contract Creation Wizard Component (Refactored)
 * 合約建立流程精靈元件
 *
 * Feature: Create
 * Responsibility: Orchestrate creation workflow steps
 * Cohesion: High - manages creation flow logic
 * Coupling: Low - uses step components via interface
 * Extensibility: Easy to add/modify steps
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractFacade } from '@routes/blueprint/modules/contract/application/facades';
import type { Contract, ContractParty } from '@routes/blueprint/modules/contract/data/models';
import type { CreateContractDto } from '@routes/blueprint/modules/contract/data/models/dtos';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStepsModule } from 'ng-zorro-antd/steps';

import { BasicInfoStepComponent } from './components/basic-info-step.component';
import { CompletionStepComponent } from './components/completion-step.component';
import { ConfirmStepComponent } from './components/confirm-step.component';
import { ContractUploadStepComponent } from '../upload/contract-upload-step.component';
import type { FileAttachment } from '@routes/blueprint/modules/contract/data/models';

/** Step indices */
const STEP_UPLOAD = 0;
const STEP_BASIC_INFO = 1;
const STEP_CONFIRM = 2;
const STEP_COMPLETE = 3;

@Component({
  selector: 'app-contract-creation-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStepsModule, ContractUploadStepComponent, BasicInfoStepComponent, ConfirmStepComponent, CompletionStepComponent],
  template: `
    <div class="wizard-container">
      <!-- Steps Progress -->
      <nz-steps [nzCurrent]="currentStep()" nzSize="small" class="mb-lg">
        <nz-step nzTitle="上傳文件" nzDescription="上傳合約文件（可選）" />
        <nz-step nzTitle="基本資料" nzDescription="填寫合約基本資訊" />
        <nz-step nzTitle="確認資料" nzDescription="檢查合約資料" />
        <nz-step nzTitle="完成" nzDescription="合約建立完成" />
      </nz-steps>

      <!-- Step: Upload -->
      @if (currentStep() === 0) {
        <app-contract-upload-step
          [blueprintId]="blueprintId()"
          [contractId]="tempContractId()"
          (fileUploaded)="onFileUploaded($event)"
        />
        <div class="step-actions">
          <button nz-button nzType="default" (click)="cancel()">取消</button>
          <button nz-button nzType="default" (click)="skipUpload()">跳過</button>
          <button nz-button nzType="primary" (click)="nextStep()" [disabled]="!canProceedFromUpload()">
            下一步
          </button>
        </div>
      }

      <!-- Step: Basic Info -->
      @if (currentStep() === 1) {
        <app-basic-info-step [form]="contractForm" />
        <div class="step-actions">
          <button nz-button nzType="default" (click)="prevStep()">上一步</button>
          <button nz-button nzType="primary" (click)="nextStep()" [disabled]="!contractForm.valid"> 下一步 </button>
        </div>
      }

      <!-- Step: Confirm -->
      @if (currentStep() === 2) {
        <app-confirm-step [formValue]="contractForm.value" />
        <div class="step-actions">
          <button nz-button nzType="default" (click)="prevStep()">上一步</button>
          <button nz-button nzType="primary" (click)="createContract()" [nzLoading]="submitting()"> 建立合約 </button>
        </div>
      }

      <!-- Step: Complete -->
      @if (currentStep() === 3) {
        <app-completion-step [createdContract]="createdContract()" (viewContract)="onViewContract()" (createAnother)="onCreateAnother()" />
      }
    </div>
  `,
  styles: [
    `
      .wizard-container {
        padding: 24px;
      }
      .step-actions {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    `
  ]
})
export class ContractCreationWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contractFacade = inject(ContractFacade);
  private readonly message = inject(NzMessageService);

  // Inputs
  blueprintId = input.required<string>();

  // Outputs
  contractCreated = output<Contract>();
  cancelled = output<void>();

  // State
  currentStep = signal(STEP_UPLOAD);
  submitting = signal(false);
  createdContract = signal<Contract | null>(null);
  uploadedFile = signal<FileAttachment | null>(null);
  tempContractId = signal<string>(`temp-${Date.now()}`);

  // Form
  contractForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize contract form
   */
  private initForm(): void {
    this.contractForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]]
    });
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep() < STEP_COMPLETE) {
      this.currentStep.update(s => s + 1);
    }
  }

  /**
   * Navigate to previous step
   */
  prevStep(): void {
    if (this.currentStep() > STEP_UPLOAD) {
      this.currentStep.update(s => s - 1);
    }
  }

  /**
   * Handle file uploaded
   */
  onFileUploaded(file: FileAttachment): void {
    this.uploadedFile.set(file);
    this.message.success('文件上傳成功');
  }

  /**
   * Skip upload step
   */
  skipUpload(): void {
    this.uploadedFile.set(null);
    this.nextStep();
  }

  /**
   * Check if can proceed from upload step
   */
  canProceedFromUpload(): boolean {
    return this.uploadedFile() !== null;
  }

  /**
   * Create contract
   */
  async createContract(): Promise<void> {
    if (!this.contractForm.valid) {
      this.message.error('請填寫完整資料');
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.contractForm.value;

      // TODO: Replace with actual party data from expanded wizard
      const ownerParty: ContractParty = {
        id: 'owner-1',
        name: '業主名稱',
        type: 'owner',
        contactPerson: '聯絡人',
        contactPhone: '0912345678',
        contactEmail: 'owner@example.com'
      };

      const contractorParty: ContractParty = {
        id: 'contractor-1',
        name: '承包商名稱',
        type: 'contractor',
        contactPerson: '聯絡人',
        contactPhone: '0912345678',
        contactEmail: 'contractor@example.com'
      };

      const createDto: CreateContractDto = {
        blueprintId: this.blueprintId(),
        title: formValue.title,
        description: formValue.description,
        owner: ownerParty,
        contractor: contractorParty,
        totalAmount: formValue.totalAmount,
        currency: 'TWD',
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        terms: [],
        originalFiles: this.uploadedFile() ? [this.uploadedFile()!] : [],
        createdBy: 'current-user-id'
      };

      const contract = await this.contractFacade.createContract(createDto);
      this.createdContract.set(contract);
      this.message.success('合約建立成功');
      this.nextStep();
      this.contractCreated.emit(contract);
    } catch (error) {
      this.message.error('建立合約失敗');
      console.error('Create contract error:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * View created contract
   */
  onViewContract(): void {
    this.cancelled.emit();
  }

  /**
   * Create another contract
   */
  onCreateAnother(): void {
    this.currentStep.set(STEP_BASIC_INFO);
    this.createdContract.set(null);
    this.contractForm.reset();
  }

  /**
   * Cancel wizard
   */
  cancel(): void {
    this.cancelled.emit();
  }
}
