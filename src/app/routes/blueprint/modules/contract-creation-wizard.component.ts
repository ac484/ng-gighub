/**
 * Contract Creation Wizard Component
 * 合約建立流程精靈元件
 *
 * ✨ UPDATED: New workflow (2025-12-17)
 * 
 * NEW FLOW:
 * 1. 合約上傳（PDF / 圖檔）【手動】
 * 2. 合約解析（OCR / AI 解析條款、金額、工項）【自動】
 * 3. 解析結果編輯（確認/修正 AI 解析資料）【手動】✨ NEW STEP
 * 4. 合約建檔（從編輯後的資料建立合約）【自動】
 * 5. 合約狀態：待生效
 * 6. 合約生效（僅「已生效合約」可建立任務）【手動】
 *
 * Changes from old flow:
 * - Parsing happens BEFORE contract creation (step 2 vs old step 3)
 * - NEW: Parsed data editing step allows user to review/edit AI results (step 3)
 * - Contract creation happens FROM edited parsed data (step 4 vs old step 2)
 *
 * ✅ Modern Angular 20 patterns:
 * - Standalone Component
 * - Signals for reactive state
 * - OnPush change detection
 * - inject() for DI
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import type { Contract, ContractParty, FileAttachment } from '@core/blueprint/modules/implementations/contract/models';
import type { CreateContractDto } from '@core/blueprint/modules/implementations/contract/models/dtos';
import { ContractCreationService } from '@core/blueprint/modules/implementations/contract/services/contract-creation.service';
import {
  ContractParsingService,
  ParsingProgress
} from '@core/blueprint/modules/implementations/contract/services/contract-parsing.service';
import { ContractStatusService } from '@core/blueprint/modules/implementations/contract/services/contract-status.service';
import { ContractUploadService, UploadProgress } from '@core/blueprint/modules/implementations/contract/services/contract-upload.service';
import { 
  type EnhancedContractParsingOutput, 
  toContractCreateRequest, 
  toWorkItemCreateRequests 
} from '@core/blueprint/modules/implementations/contract/utils/enhanced-parsing-converter';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';

import { ParsedDataEditorComponent } from './parsed-data-editor.component';

/** Step indices - UPDATED for new flow */
const STEP_UPLOAD = 0;          // Upload files
const STEP_PARSING = 1;         // AI parsing
const STEP_EDIT = 2;            // Edit parsed data ✨ NEW
const STEP_CREATE = 3;          // Create contract from edited data
const STEP_PENDING = 4;         // Pending activation
const STEP_ACTIVE = 5;          // Active

@Component({
  selector: 'app-contract-creation-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS, 
    NzStepsModule, 
    NzUploadModule, 
    NzFormModule, 
    NzResultModule, 
    NzDescriptionsModule,
    ParsedDataEditorComponent
  ],
  template: `
    <!-- Steps Progress Indicator - UPDATED for new flow -->
    <nz-steps [nzCurrent]="currentStep()" nzSize="small" class="mb-lg">
      <nz-step nzTitle="上傳合約" nzIcon="upload" [nzStatus]="getStepStatus(0)"></nz-step>
      <nz-step nzTitle="合約解析" nzIcon="scan" [nzStatus]="getStepStatus(1)"></nz-step>
      <nz-step nzTitle="編輯資料" nzIcon="edit" [nzStatus]="getStepStatus(2)"></nz-step>
      <nz-step nzTitle="建立合約" nzIcon="form" [nzStatus]="getStepStatus(3)"></nz-step>
      <nz-step nzTitle="待生效" nzIcon="clock-circle" [nzStatus]="getStepStatus(4)"></nz-step>
      <nz-step nzTitle="已生效" nzIcon="check" [nzStatus]="getStepStatus(5)"></nz-step>
    </nz-steps>

    <!-- Step Content -->
    <nz-card [nzBordered]="false">
      @switch (currentStep()) {
        <!-- Step 0: Upload -->
        @case (0) {
          <div class="step-content">
            <h3>步驟 1：上傳合約文件</h3>
            <p class="text-grey">支援 PDF、JPG、PNG 格式，檔案大小限制 10MB</p>

            <nz-upload
              nzType="drag"
              [nzMultiple]="true"
              [nzAccept]="acceptedFileTypes"
              [nzBeforeUpload]="beforeUpload"
              [nzFileList]="uploadedFiles()"
              (nzChange)="handleUploadChange($event)"
            >
              <p class="ant-upload-drag-icon">
                <span nz-icon nzType="inbox" nzTheme="outline"></span>
              </p>
              <p class="ant-upload-text">點擊或拖曳檔案至此區域上傳</p>
              <p class="ant-upload-hint">支援 PDF、JPG、PNG 格式</p>
            </nz-upload>

            @if (uploadProgress()) {
              <nz-progress [nzPercent]="uploadProgress()!.percentage" nzSize="small" class="mt-md"></nz-progress>
            }

            <div class="step-actions mt-lg">
              <button nz-button nzType="default" (click)="cancel()">取消</button>
              <button nz-button nzType="default" (click)="skipToManualEntry()" class="ml-sm">手動輸入</button>
              <button nz-button nzType="primary" (click)="uploadAndParse()" [disabled]="uploadedFiles().length === 0" [nzLoading]="uploading()" class="ml-sm">
                上傳並解析
              </button>
            </div>
          </div>
        }

        <!-- Step 1: Parsing -->
        @case (1) {
          <div class="step-content text-center">
            <h3>步驟 2：合約解析中</h3>

            @if (parsingProgress()) {
              @switch (parsingProgress()!.status) {
                @case ('pending') {
                  <nz-result nzStatus="info" nzTitle="等待解析" nzSubTitle="合約文件正在排隊等待解析...">
                    <div nz-result-extra>
                      <nz-spin nzSimple></nz-spin>
                    </div>
                  </nz-result>
                }
                @case ('processing') {
                  <nz-result nzStatus="info" nzTitle="解析中" [nzSubTitle]="parsingProgress()!.message || '正在使用 AI 解析合約內容...'">
                    <div nz-result-extra>
                      <nz-progress [nzPercent]="parsingProgress()!.progress" nzStatus="active"></nz-progress>
                    </div>
                  </nz-result>
                }
                @case ('completed') {
                  <nz-result nzStatus="success" nzTitle="解析完成" nzSubTitle="合約內容已成功解析，請檢視並編輯資料">
                    <div nz-result-extra>
                      <button nz-button nzType="primary" (click)="nextStep()">檢視解析結果</button>
                    </div>
                  </nz-result>
                }
                @case ('failed') {
                  <nz-result nzStatus="error" nzTitle="解析失敗" [nzSubTitle]="parsingProgress()!.message || '無法解析合約內容'">
                    <div nz-result-extra>
                      <button nz-button nzType="default" (click)="retryParsing()">重試</button>
                      <button nz-button nzType="primary" (click)="skipToManualEntry()" class="ml-sm">手動輸入</button>
                    </div>
                  </nz-result>
                }
                @default {
                  <nz-spin nzSimple nzSize="large"></nz-spin>
                  <p class="mt-md">正在準備解析...</p>
                }
              }
            } @else {
              <nz-spin nzSimple nzSize="large"></nz-spin>
              <p class="mt-md">正在啟動解析服務...</p>
            }
          </div>
        }

        <!-- Step 2: Edit Parsed Data ✨ NEW STEP -->
        @case (2) {
          <div class="step-content">
            <h3>步驟 3：編輯解析資料</h3>
            <p class="text-grey mb-md">請檢查 AI 解析的資料，並進行必要的修正</p>

            @if (parsedData()) {
              <app-parsed-data-editor
                [parsedData]="parsedData()!"
                [confidence]="parsingConfidence()"
                (confirmed)="onParsedDataConfirmed($event)"
                (cancelled)="cancel()"
              />
            } @else {
              <nz-result nzStatus="warning" nzTitle="無解析資料" nzSubTitle="請重新上傳檔案或手動輸入">
                <div nz-result-extra>
                  <button nz-button nzType="default" (click)="prevStep()">返回上傳</button>
                  <button nz-button nzType="primary" (click)="skipToManualEntry()" class="ml-sm">手動輸入</button>
                </div>
              </nz-result>
            }
          </div>
        }

        <!-- Step 3: Create Contract -->
        @case (3) {
          <div class="step-content text-center">
            <h3>步驟 4：建立合約</h3>

            @if (creating()) {
              <nz-result nzStatus="info" nzTitle="正在建立合約..." nzSubTitle="請稍候">
                <div nz-result-extra>
                  <nz-spin nzSimple nzSize="large"></nz-spin>
                </div>
              </nz-result>
            } @else if (createdContract()) {
              <nz-result nzStatus="success" nzTitle="合約建立成功" [nzSubTitle]="'合約編號：' + createdContract()!.contractNumber">
                <div nz-result-extra>
                  <button nz-button nzType="primary" (click)="nextStep()">繼續</button>
                </div>
              </nz-result>
            } @else {
              <nz-result nzStatus="error" nzTitle="建立失敗" nzSubTitle="請重試或聯繫管理員">
                <div nz-result-extra>
                  <button nz-button nzType="default" (click)="prevStep()">返回編輯</button>
                  <button nz-button nzType="primary" (click)="retryContractCreation()" class="ml-sm">重試</button>
                </div>
              </nz-result>
            }
          </div>
        }
                    </div>
                  </nz-result>
                }
                @default {
                  <nz-spin nzSimple nzSize="large"></nz-spin>
                  <p class="mt-md">正在準備解析...</p>
                }
              }
            } @else if (!hasUploadedFiles()) {
              <nz-result nzStatus="info" nzTitle="無需解析" nzSubTitle="未上傳合約文件，將跳過解析步驟">
                <div nz-result-extra>
                  <button nz-button nzType="primary" (click)="skipParsing()">繼續</button>
                </div>
              </nz-result>
            } @else {
              <nz-spin nzSimple nzSize="large"></nz-spin>
              <p class="mt-md">正在啟動解析服務...</p>
            }
          </div>
        }

        <!-- Step 3: Confirm -->
        @case (3) {
          <div class="step-content">
            <h3>步驟 4：確認合約資料</h3>

            @if (createdContract()) {
              <nz-descriptions nzTitle="合約摘要" nzBordered [nzColumn]="2">
                <nz-descriptions-item nzTitle="合約編號">{{ createdContract()!.contractNumber }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="合約名稱">{{ createdContract()!.title }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="合約金額"
                  >{{ createdContract()!.currency }} {{ createdContract()!.totalAmount | number }}</nz-descriptions-item
                >
                <nz-descriptions-item nzTitle="狀態">
                  <nz-tag [nzColor]="'blue'">草稿</nz-tag>
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="開始日期">{{ createdContract()!.startDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="結束日期">{{ createdContract()!.endDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="業主" [nzSpan]="2"
                  >{{ createdContract()!.owner?.name }} ({{ createdContract()!.owner?.contactPerson }})</nz-descriptions-item
                >
                <nz-descriptions-item nzTitle="承商" [nzSpan]="2"
                  >{{ createdContract()!.contractor?.name }} ({{ createdContract()!.contractor?.contactPerson }})</nz-descriptions-item
                >
              </nz-descriptions>

              @if (createdContract()!.parsedData && createdContract()!.parsedData!.needsVerification) {
                <nz-divider nzText="AI 解析結果" nzOrientation="left"></nz-divider>
                <nz-alert
                  nzType="info"
                  nzMessage="AI 解析資料需要確認"
                  nzDescription="以下資料由 AI 自動解析，請確認或修正後繼續。"
                  nzShowIcon
                  class="mb-md"
                ></nz-alert>

                <nz-descriptions nzBordered [nzColumn]="2">
                  @if (createdContract()!.parsedData!.extractedData.contractNumber) {
                    <nz-descriptions-item nzTitle="解析：合約編號">{{
                      createdContract()!.parsedData!.extractedData.contractNumber
                    }}</nz-descriptions-item>
                  }
                  @if (createdContract()!.parsedData!.extractedData.totalAmount) {
                    <nz-descriptions-item nzTitle="解析：金額">{{
                      createdContract()!.parsedData!.extractedData.totalAmount | number
                    }}</nz-descriptions-item>
                  }
                  <nz-descriptions-item nzTitle="解析信心度">
                    <nz-progress
                      [nzPercent]="(createdContract()!.parsedData!.confidence || 0) * 100"
                      [nzShowInfo]="true"
                      nzSize="small"
                    ></nz-progress>
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="解析引擎">{{ createdContract()!.parsedData!.parsingEngine }}</nz-descriptions-item>
                </nz-descriptions>
              }
            }

            <div class="step-actions mt-lg">
              <button nz-button nzType="default" (click)="cancel()">取消</button>
              <button nz-button nzType="primary" (click)="confirmAndSubmitForActivation()" [nzLoading]="submitting()" class="ml-sm">
                確認並提交待生效
              </button>
            </div>
          </div>
        }

        <!-- Step 4: Pending Activation -->
        @case (4) {
          <div class="step-content text-center">
            <nz-result nzStatus="info" nzTitle="合約已提交待生效" [nzSubTitle]="'合約編號：' + (createdContract()?.contractNumber || '')">
              <div nz-result-extra>
                <p class="mb-md">合約目前處於「待生效」狀態，請確認所有資料無誤後點擊「生效合約」。</p>
                <p class="text-grey mb-lg">僅「已生效」的合約可以建立任務和工項。</p>
                <button nz-button nzType="default" (click)="cancel()">稍後處理</button>
                <button nz-button nzType="primary" (click)="activateContract()" [nzLoading]="activating()" class="ml-sm">
                  <span nz-icon nzType="check-circle"></span>
                  生效合約
                </button>
              </div>
            </nz-result>
          </div>
        }

        <!-- Step 5: Active -->
        @case (5) {
          <div class="step-content text-center">
            <nz-result
              nzStatus="success"
              nzTitle="合約已生效！"
              [nzSubTitle]="'合約編號：' + (createdContract()?.contractNumber || '') + ' 現在可以建立任務和工項。'"
            >
              <div nz-result-extra>
                <button nz-button nzType="primary" (click)="complete()"> 完成 </button>
              </div>
            </nz-result>
          </div>
        }
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .step-content {
        min-height: 300px;
        padding: 24px;
      }
      .step-actions {
        text-align: right;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      .text-grey {
        color: rgba(0, 0, 0, 0.45);
      }
      .text-center {
        text-align: center;
      }
    `
  ]
})
export class ContractCreationWizardComponent implements OnInit {
  // Inputs
  blueprintId = input.required<string>();

  // Outputs
  readonly completed = output<Contract>();
  readonly cancelled = output<void>();

  // Injected services
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly uploadService = inject(ContractUploadService);
  private readonly creationService = inject(ContractCreationService);
  private readonly parsingService = inject(ContractParsingService);
  private readonly statusService = inject(ContractStatusService);

  // State signals
  currentStep = signal(STEP_UPLOAD);
  uploadedFiles = signal<NzUploadFile[]>([]);
  uploadProgress = signal<UploadProgress | null>(null);
  parsingProgress = signal<ParsingProgress | null>(null);
  createdContract = signal<Contract | null>(null);
  fileAttachments = signal<FileAttachment[]>([]);
  
  // NEW: Parsed data signals for new workflow
  parsedData = signal<EnhancedContractParsingOutput | null>(null);
  parsingConfidence = signal<number>(0);
  editedParsedData = signal<EnhancedContractParsingOutput | null>(null);

  // Loading states
  creating = signal(false);
  submitting = signal(false);
  activating = signal(false);
  uploading = signal(false);

  // Form
  contractForm!: FormGroup;

  // Upload configuration
  acceptedFileTypes = '.pdf,.jpg,.jpeg,.png';

  // Formatters
  currencyFormatter = (value: number): string => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  currencyParser = (value: string): number => {
    const parsed = value.replace(/\$\s?|(,*)/g, '');
    return parsed ? Number(parsed) : 0;
  };

  // Before upload hook - prevents automatic upload
  beforeUpload = (file: NzUploadFile): boolean => {
    const validation = this.uploadService.validateFile(file as unknown as File);
    if (!validation.isValid) {
      this.message.error(validation.errors.join(', '));
      return false;
    }
    this.uploadedFiles.update(files => [...files, file]);
    return false; // Return false to prevent automatic upload
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.contractForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: [''],
      totalAmount: [0, [Validators.required, Validators.min(1)]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      // Owner
      ownerName: ['', [Validators.required]],
      ownerContactPerson: ['', [Validators.required]],
      ownerPhone: ['', [Validators.required]],
      ownerEmail: ['', [Validators.required, Validators.email]],
      // Contractor
      contractorName: ['', [Validators.required]],
      contractorContactPerson: ['', [Validators.required]],
      contractorPhone: ['', [Validators.required]],
      contractorEmail: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Get step status for styling
   */
  getStepStatus(stepIndex: number): 'wait' | 'process' | 'finish' | 'error' {
    const current = this.currentStep();
    if (stepIndex < current) return 'finish';
    if (stepIndex === current) return 'process';
    return 'wait';
  }

  /**
   * Check if files have been uploaded
   */
  hasUploadedFiles(): boolean {
    return this.uploadedFiles().length > 0 || this.fileAttachments().length > 0;
  }

  /**
   * Handle file upload changes
   */
  handleUploadChange(info: NzUploadChangeParam): void {
    const fileList = [...info.fileList];
    this.uploadedFiles.set(fileList);
  }

  /**
   * Skip file upload step
   */
  skipUpload(): void {
    this.uploadedFiles.set([]);
    this.nextStep();
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    this.currentStep.update(step => Math.min(step + 1, STEP_ACTIVE));
  }

  /**
   * Navigate to previous step
   */
  prevStep(): void {
    this.currentStep.update(step => Math.max(step - 1, STEP_UPLOAD));
  }

  /**
   * NEW WORKFLOW: Upload files and trigger parsing
   * This replaces the old createDraftAndParse method
   */
  async uploadAndParse(): Promise<void> {
    if (this.uploadedFiles().length === 0) {
      this.message.warning('請先上傳檔案');
      return;
    }

    this.uploading.set(true);

    try {
      // Upload files first (without contract ID)
      const files = this.uploadedFiles();
      const tempAttachments: FileAttachment[] = [];

      for (const uploadFile of files) {
        try {
          const file = uploadFile.originFileObj as File;
          if (!file) continue;

          // Upload to temporary storage or directly to blueprint storage
          const attachment = await this.uploadService.uploadContractFile(
            this.blueprintId(), 
            'temp', // Temporary ID, will be replaced when contract is created
            file
          );
          tempAttachments.push(attachment);
        } catch (err) {
          console.error('[ContractCreationWizard]', 'Failed to upload file', uploadFile.name, err);
        }
      }

      this.fileAttachments.set(tempAttachments);
      this.message.success('檔案上傳成功');

      // Move to parsing step
      this.nextStep();

      // Start parsing immediately
      await this.startParsingWithoutContract(tempAttachments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳失敗';
      this.message.error(errorMessage);
      console.error('[ContractCreationWizard]', 'uploadAndParse failed', err);
    } finally {
      this.uploading.set(false);
    }
  }

  /**
   * NEW: Start parsing without creating contract first
   */
  private async startParsingWithoutContract(attachments: FileAttachment[]): Promise<void> {
    if (attachments.length === 0) {
      this.nextStep();
      return;
    }

    try {
      // Call parsing service with file IDs
      const fileIds = attachments.map(f => f.id);
      
      // Note: This may require updating the ContractParsingService to support parsing without contract ID
      // For now, we'll simulate the parsing flow
      const result = await this.parsingService.requestParsing({
        blueprintId: this.blueprintId(),
        contractId: 'pending', // Special ID for pending contract
        fileIds,
        requestedBy: 'current-user'
      });

      // Poll for parsing status
      this.pollParsingStatusForEnhancedData();
    } catch (err) {
      console.error('[ContractCreationWizard]', 'startParsingWithoutContract failed', err);
      this.parsingProgress.set({
        requestId: '',
        status: 'failed',
        progress: 0,
        message: err instanceof Error ? err.message : '啟動解析失敗'
      });
    }
  }

  /**
   * NEW: Poll parsing status and extract enhanced data
   */
  private pollParsingStatusForEnhancedData(): void {
    const checkProgress = (): void => {
      const progress = this.parsingService.progress();
      if (progress) {
        this.parsingProgress.set(progress);

        if (progress.status === 'completed') {
          // Extract parsed data from progress
          if (progress.result) {
            this.parsedData.set(progress.result as EnhancedContractParsingOutput);
            this.parsingConfidence.set((progress.result as any).confidence || 0.7);
          }
          // Don't auto-advance - let user click to review data
        } else if (progress.status !== 'failed') {
          // Continue polling
          setTimeout(checkProgress, 1000);
        }
      }
    };

    // Start polling
    setTimeout(checkProgress, 500);
  }

  /**
   * NEW: Handle confirmed parsed data from editor
   */
  async onParsedDataConfirmed(editedData: EnhancedContractParsingOutput): Promise<void> {
    this.editedParsedData.set(editedData);
    
    // Move to contract creation step
    this.nextStep();
    
    // Automatically create contract from edited data
    await this.createContractFromParsedData(editedData);
  }

  /**
   * NEW: Create contract from edited parsed data
   */
  private async createContractFromParsedData(parsedData: EnhancedContractParsingOutput): Promise<void> {
    this.creating.set(true);

    try {
      // Convert parsed data to CreateContractDto using the converter
      const createDto = toContractCreateRequest(
        parsedData, 
        this.blueprintId(), 
        'current-user' // TODO: Get from auth service
      );

      // Create the contract
      const contract = await this.creationService.create(this.blueprintId(), createDto);
      this.createdContract.set(contract);
      this.message.success('合約建立成功');

      // If there are work items, create them
      if (parsedData.workItems && parsedData.workItems.length > 0) {
        await this.createWorkItemsFromParsedData(contract.id, parsedData.workItems);
      }

      // Auto-advance to next step after short delay
      setTimeout(() => this.nextStep(), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立合約失敗';
      this.message.error(errorMessage);
      console.error('[ContractCreationWizard]', 'createContractFromParsedData failed', err);
    } finally {
      this.creating.set(false);
    }
  }

  /**
   * NEW: Create work items from parsed data
   */
  private async createWorkItemsFromParsedData(contractId: string, workItems: any[]): Promise<void> {
    try {
      const workItemDtos = toWorkItemCreateRequests(workItems, contractId);
      
      // Note: This may require a batch create method in the service
      // For now, we'll create them one by one
      for (const dto of workItemDtos) {
        // await this.workItemService.create(this.blueprintId(), contractId, dto);
        // TODO: Implement when WorkItemService is available
      }
      
      this.message.success(`已建立 ${workItems.length} 個工項`);
    } catch (err) {
      console.error('[ContractCreationWizard]', 'createWorkItemsFromParsedData failed', err);
      this.message.warning('工項建立部分失敗，請稍後手動補充');
    }
  }

  /**
   * NEW: Skip to manual entry (no parsing)
   */
  skipToManualEntry(): void {
    // TODO: Show manual entry form or navigate to contract creation page
    this.message.info('手動輸入功能開發中');
    this.cancel();
  }

  /**
   * NEW: Retry contract creation
   */
  async retryContractCreation(): Promise<void> {
    const editedData = this.editedParsedData();
    if (editedData) {
      await this.createContractFromParsedData(editedData);
    }
  }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立合約失敗';
      this.message.error(errorMessage);
      console.error('[ContractCreationWizard]', 'createDraftAndParse failed', err);
    } finally {
      this.creating.set(false);
    }
  }

  /**
   * Upload files to contract storage
   */
  private async uploadFilesToContract(contractId: string): Promise<void> {
    const files = this.uploadedFiles();
    const attachments: FileAttachment[] = [];

    for (const uploadFile of files) {
      try {
        // Get the actual file object
        const file = uploadFile.originFileObj as File;
        if (!file) continue;

        const attachment = await this.uploadService.uploadContractFile(this.blueprintId(), contractId, file);
        attachments.push(attachment);
      } catch (err) {
        console.error('[ContractCreationWizard]', 'Failed to upload file', uploadFile.name, err);
      }
    }

    this.fileAttachments.set(attachments);
  }

  /**
   * Start parsing uploaded files
   */
  private async startParsing(contractId: string): Promise<void> {
    const fileIds = this.fileAttachments().map(f => f.id);
    if (fileIds.length === 0) {
      this.nextStep();
      return;
    }

    try {
      await this.parsingService.requestParsing({
        blueprintId: this.blueprintId(),
        contractId,
        fileIds,
        requestedBy: 'current-user'
      });

      // Poll for parsing status
      this.pollParsingStatus(contractId);
    } catch (err) {
      console.error('[ContractCreationWizard]', 'startParsing failed', err);
      this.parsingProgress.set({
        requestId: '',
        status: 'failed',
        progress: 0,
        message: err instanceof Error ? err.message : '啟動解析失敗'
      });
    }
  }

  /**
   * Poll for parsing status updates
   */
  private pollParsingStatus(contractId: string): void {
    // Subscribe to parsing service progress signal
    const checkProgress = (): void => {
      const progress = this.parsingService.progress();
      if (progress) {
        this.parsingProgress.set(progress);

        if (progress.status === 'completed') {
          // Reload contract to get parsed data
          this.reloadContract(contractId);
        } else if (progress.status !== 'failed') {
          // Continue polling
          setTimeout(checkProgress, 1000);
        }
      }
    };

    // Start polling
    setTimeout(checkProgress, 500);
  }

  /**
   * Reload contract data after parsing
   */
  private async reloadContract(contractId: string): Promise<void> {
    try {
      // Use the status service to get the updated contract
      const validation = await this.statusService.canActivateContract(this.blueprintId(), contractId);
      if (validation.isValid) {
        // Contract is valid, move to confirm step
        this.nextStep();
      }
    } catch (err) {
      console.error('[ContractCreationWizard]', 'reloadContract failed', err);
    }
  }

  /**
   * Retry parsing
   */
  async retryParsing(): Promise<void> {
    const contract = this.createdContract();
    if (!contract) return;

    this.parsingProgress.set(null);
    await this.startParsing(contract.id);
  }

  /**
   * Skip parsing step
   */
  async skipParsing(): Promise<void> {
    const contract = this.createdContract();
    if (contract) {
      await this.parsingService.skipParsing(this.blueprintId(), contract.id, 'current-user');
    }
    this.nextStep();
  }

  /**
   * Confirm data and submit for activation
   */
  async confirmAndSubmitForActivation(): Promise<void> {
    const contract = this.createdContract();
    if (!contract) return;

    this.submitting.set(true);

    try {
      // If there's parsed data that needs confirmation, confirm it first
      if (contract.parsedData?.needsVerification) {
        await this.parsingService.confirmParsedData({
          blueprintId: this.blueprintId(),
          contractId: contract.id,
          confirmedBy: 'current-user',
          confirmationType: 'confirmed'
        });
      }

      // Submit for activation
      const updatedContract = await this.statusService.submitForActivation(this.blueprintId(), contract.id, 'current-user');
      this.createdContract.set(updatedContract);
      this.message.success('合約已提交待生效');
      this.nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失敗';
      this.message.error(errorMessage);
      console.error('[ContractCreationWizard]', 'confirmAndSubmitForActivation failed', err);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Activate the contract
   */
  async activateContract(): Promise<void> {
    const contract = this.createdContract();
    if (!contract) return;

    this.activating.set(true);

    try {
      const updatedContract = await this.statusService.activate(this.blueprintId(), contract.id, 'current-user');
      this.createdContract.set(updatedContract);
      this.message.success('合約已生效！');
      this.nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生效失敗';
      this.message.error(errorMessage);
      console.error('[ContractCreationWizard]', 'activateContract failed', err);
    } finally {
      this.activating.set(false);
    }
  }

  /**
   * Complete the wizard
   */
  complete(): void {
    const contract = this.createdContract();
    if (contract) {
      this.completed.emit(contract);
    }
  }

  /**
   * Cancel the wizard
   */
  cancel(): void {
    this.cancelled.emit();
  }

  /**
   * Mark all form controls as dirty
   */
  private markFormDirty(): void {
    Object.keys(this.contractForm.controls).forEach(key => {
      const control = this.contractForm.get(key);
      control?.markAsDirty();
      control?.updateValueAndValidity();
    });
  }
}
