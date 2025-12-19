/**
 * Contract Creation Wizard Component (Simplified Skeleton)
 * 合約建立流程精靈元件 (簡化版)
 *
 * SIMPLIFIED FLOW (3 steps):
 * 1. 填寫基本資料 (Basic Info)
 * 2. 確認資料 (Confirm)
 * 3. 完成 (Complete)
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract/facades';
import type { Contract, ContractParty } from '@core/blueprint/modules/implementations/contract/models';
import type { CreateContractDto } from '@core/blueprint/modules/implementations/contract/models/dtos';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStepsModule } from 'ng-zorro-antd/steps';

/** Step indices - Simplified 3-step flow */
const STEP_BASIC_INFO = 0;
const STEP_CONFIRM = 1;
const STEP_COMPLETE = 2;

@Component({
  selector: 'app-contract-creation-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStepsModule, NzFormModule, NzResultModule, NzDescriptionsModule],
  template: `
    <!-- Steps Progress Indicator -->
    <nz-steps [nzCurrent]="currentStep()" nzSize="small" class="mb-lg">
      <nz-step nzTitle="基本資料" nzDescription="填寫合約基本資訊" />
      <nz-step nzTitle="確認資料" nzDescription="檢查合約資料" />
      <nz-step nzTitle="完成" nzDescription="合約建立完成" />
    </nz-steps>

    <!-- Step Content -->
    <div class="wizard-content">
      <!-- Step 1: Basic Info -->
      @if (currentStep() === 0) {
        <div class="step-content">
          <h3>填寫合約基本資料</h3>
          <form nz-form [formGroup]="contractForm" nzLayout="vertical">
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

          <div class="step-actions">
            <button nz-button nzType="default" (click)="cancel()">取消</button>
            <button nz-button nzType="primary" (click)="nextStep()" [disabled]="!contractForm.valid">下一步</button>
          </div>
        </div>
      }

      <!-- Step 2: Confirm -->
      @if (currentStep() === 1) {
        <div class="step-content">
          <h3>確認合約資料</h3>
          <nz-descriptions nzBordered [nzColumn]="2">
            <nz-descriptions-item nzTitle="合約標題" [nzSpan]="2">{{ contractForm.value.title }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="合約描述" [nzSpan]="2">{{ contractForm.value.description || '-' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="合約金額">{{ contractForm.value.totalAmount | currency: 'TWD' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="幣別">TWD</nz-descriptions-item>
            <nz-descriptions-item nzTitle="開始日期">{{ contractForm.value.startDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="結束日期">{{ contractForm.value.endDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
          </nz-descriptions>

          <div class="step-actions">
            <button nz-button nzType="default" (click)="prevStep()">上一步</button>
            <button nz-button nzType="primary" (click)="createContract()" [nzLoading]="submitting()">建立合約</button>
          </div>
        </div>
      }

      <!-- Step 3: Complete -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <nz-result nzStatus="success" nzTitle="合約建立成功！" [nzSubTitle]="'合約編號: ' + createdContract()?.contractNumber">
            <div nz-result-extra>
              <button nz-button nzType="primary" (click)="viewContract()">查看合約</button>
              <button nz-button nzType="default" (click)="createAnother()">建立另一筆合約</button>
            </div>
          </nz-result>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wizard-content {
        padding: 24px;
      }
      .step-content {
        max-width: 800px;
        margin: 0 auto;
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
  currentStep = signal(STEP_BASIC_INFO);
  submitting = signal(false);
  createdContract = signal<Contract | null>(null);

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
   * Go to next step
   */
  nextStep(): void {
    if (this.currentStep() < STEP_COMPLETE) {
      this.currentStep.update(s => s + 1);
    }
  }

  /**
   * Go to previous step
   */
  prevStep(): void {
    if (this.currentStep() > STEP_BASIC_INFO) {
      this.currentStep.update(s => s - 1);
    }
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

      // Create dummy parties (skeleton - should be filled by user in real implementation)
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
        createdBy: 'current-user-id' // TODO: Get from auth service
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
  viewContract(): void {
    // Navigate to contract detail (implement in parent component)
    this.cancelled.emit();
  }

  /**
   * Create another contract
   */
  createAnother(): void {
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
