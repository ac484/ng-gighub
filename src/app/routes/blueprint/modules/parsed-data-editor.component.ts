/**
 * Parsed Data Editor Component
 * 解析資料編輯器元件
 *
 * Allows users to review and edit AI-parsed contract data before creating the contract record.
 * Implements the new flow: Upload → Parse → **Edit Results** → Create Record
 *
 * ✅ Modern Angular 20 patterns:
 * - Standalone Component
 * - Signals for reactive state
 * - OnPush change detection
 * - inject() for DI
 * - input()/output() for component communication
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';

import type { EnhancedContractParsingOutput } from '@core/blueprint/modules/implementations/contract/utils/enhanced-parsing-converter';

@Component({
  selector: 'app-parsed-data-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzFormModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzDividerModule,
    NzAlertModule,
    NzProgressModule,
    NzTableModule,
    NzButtonModule
  ],
  template: `
    <div class="parsed-data-editor">
      <!-- Confidence Score Alert -->
      @if (parsedData()) {
        <nz-alert
          nzType="info"
          [nzMessage]="'AI 解析信心度: ' + ((confidence() * 100).toFixed(0)) + '%'"
          [nzDescription]="getConfidenceDescription()"
          nzShowIcon
          class="mb-md"
        >
          <ng-template #description>
            <nz-progress [nzPercent]="confidence() * 100" [nzShowInfo]="false" nzSize="small"></nz-progress>
            <p class="mt-sm text-grey">請仔細檢查並修正 AI 解析的資料，確認無誤後繼續。</p>
          </ng-template>
        </nz-alert>
      }

      <form nz-form [formGroup]="editorForm" nzLayout="vertical">
        <!-- Basic Information -->
        <nz-divider nzText="基本資訊" nzOrientation="left"></nz-divider>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>合約編號</nz-form-label>
              <nz-form-control nzErrorTip="請輸入合約編號">
                <input nz-input formControlName="contractNumber" placeholder="自動生成或手動輸入" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="16">
            <nz-form-item>
              <nz-form-label nzRequired>合約名稱</nz-form-label>
              <nz-form-control nzErrorTip="請輸入合約名稱（至少 5 個字元）">
                <input nz-input formControlName="title" placeholder="輸入合約名稱" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              [nzAutosize]="{ minRows: 2, maxRows: 4 }"
              placeholder="合約描述"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <!-- Financial Information -->
        <nz-divider nzText="金額資訊" nzOrientation="left"></nz-divider>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>合約總金額</nz-form-label>
              <nz-form-control nzErrorTip="請輸入合約總金額">
                <nz-input-number
                  formControlName="totalAmount"
                  [nzMin]="0"
                  [nzStep]="1000"
                  style="width: 100%"
                  [nzFormatter]="currencyFormatter"
                  [nzParser]="currencyParser"
                ></nz-input-number>
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>幣別</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="currency" style="width: 100%">
                  <nz-option nzValue="TWD" nzLabel="TWD (新台幣)"></nz-option>
                  <nz-option nzValue="USD" nzLabel="USD (美元)"></nz-option>
                  <nz-option nzValue="CNY" nzLabel="CNY (人民幣)"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <!-- Date Information -->
        <nz-divider nzText="日期資訊" nzOrientation="left"></nz-divider>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>開始日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇開始日期">
                <nz-date-picker formControlName="startDate" style="width: 100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>結束日期</nz-form-label>
              <nz-form-control nzErrorTip="請選擇結束日期">
                <nz-date-picker formControlName="endDate" style="width: 100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>簽約日期</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="signedDate" style="width: 100%"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <!-- Owner Information -->
        <nz-divider nzText="業主資訊" nzOrientation="left"></nz-divider>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>業主名稱</nz-form-label>
              <nz-form-control nzErrorTip="請輸入業主名稱">
                <input nz-input formControlName="ownerName" placeholder="業主公司名稱" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>聯絡人</nz-form-label>
              <nz-form-control nzErrorTip="請輸入聯絡人">
                <input nz-input formControlName="ownerContactPerson" placeholder="業主聯絡人姓名" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>電話</nz-form-label>
              <nz-form-control nzErrorTip="請輸入電話">
                <input nz-input formControlName="ownerPhone" placeholder="業主聯絡電話" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>電子郵件</nz-form-label>
              <nz-form-control nzErrorTip="請輸入有效的電子郵件">
                <input nz-input formControlName="ownerEmail" placeholder="業主電子郵件" type="email" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>統一編號</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="ownerTaxId" placeholder="業主統一編號" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <!-- Contractor Information -->
        <nz-divider nzText="承商資訊" nzOrientation="left"></nz-divider>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>承商名稱</nz-form-label>
              <nz-form-control nzErrorTip="請輸入承商名稱">
                <input nz-input formControlName="contractorName" placeholder="承商公司名稱" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>聯絡人</nz-form-label>
              <nz-form-control nzErrorTip="請輸入聯絡人">
                <input nz-input formControlName="contractorContactPerson" placeholder="承商聯絡人姓名" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>電話</nz-form-label>
              <nz-form-control nzErrorTip="請輸入電話">
                <input nz-input formControlName="contractorPhone" placeholder="承商聯絡電話" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>電子郵件</nz-form-label>
              <nz-form-control nzErrorTip="請輸入有效的電子郵件">
                <input nz-input formControlName="contractorEmail" placeholder="承商電子郵件" type="email" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
          <nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>統一編號</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="contractorTaxId" placeholder="承商統一編號" />
              </nz-form-control>
            </nz-form-item>
          </nz-col>
        </nz-row>

        <!-- Work Items Table -->
        <nz-divider nzText="工項清單" nzOrientation="left"></nz-divider>

        @if (workItems().length > 0) {
          <nz-table #workItemsTable [nzData]="workItems()" [nzPageSize]="10" nzSize="small">
            <thead>
              <tr>
                <th nzWidth="100px">工項編號</th>
                <th>名稱</th>
                <th nzWidth="100px">數量</th>
                <th nzWidth="80px">單位</th>
                <th nzWidth="120px">單價</th>
                <th nzWidth="120px">總價</th>
                <th nzWidth="100px">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (item of workItemsTable.data; track item.code) {
                <tr>
                  <td>{{ item.code }}</td>
                  <td>{{ item.title }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.unitPrice | number }}</td>
                  <td>{{ item.totalPrice | number }}</td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="editWorkItem(item)">編輯</button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="removeWorkItem(item.code)">刪除</button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>

          <div class="work-items-summary mt-md">
            <nz-statistic [nzValue]="workItemsTotal()" nzTitle="工項總金額" nzPrefix="$" />
          </div>
        } @else {
          <nz-empty nzNotFoundContent="未解析到工項資料"></nz-empty>
        }

        <!-- Actions -->
        <div class="editor-actions mt-lg">
          <button nz-button nzType="default" (click)="onCancel()">取消</button>
          <button nz-button nzType="default" (click)="onReset()" class="ml-sm">重置</button>
          <button nz-button nzType="primary" (click)="onConfirm()" [disabled]="editorForm.invalid" class="ml-sm">
            確認並建立合約
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .parsed-data-editor {
        padding: 16px;
      }
      .editor-actions {
        text-align: right;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
      }
      .work-items-summary {
        text-align: right;
        padding: 16px;
        background: #fafafa;
        border-radius: 4px;
      }
      .text-grey {
        color: rgba(0, 0, 0, 0.45);
      }
    `
  ]
})
export class ParsedDataEditorComponent implements OnInit {
  // Inputs
  parsedData = input.required<EnhancedContractParsingOutput>();
  confidence = input<number>(0.7);

  // Outputs
  readonly confirmed = output<EnhancedContractParsingOutput>();
  readonly cancelled = output<void>();

  // Injected services
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // State signals
  workItems = signal<any[]>([]);
  workItemsTotal = signal<number>(0);

  // Form
  editorForm!: FormGroup;

  // Formatters
  currencyFormatter = (value: number): string => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  currencyParser = (value: string): number => {
    const parsed = value.replace(/\$\s?|(,*)/g, '');
    return parsed ? Number(parsed) : 0;
  };

  ngOnInit(): void {
    this.initForm();
    this.populateFormWithParsedData();
  }

  private initForm(): void {
    this.editorForm = this.fb.group({
      // Basic info
      contractNumber: ['', [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      // Financial
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      currency: ['TWD', [Validators.required]],
      // Dates
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      signedDate: [null],
      // Owner
      ownerName: ['', [Validators.required]],
      ownerContactPerson: ['', [Validators.required]],
      ownerPhone: ['', [Validators.required]],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerTaxId: [''],
      // Contractor
      contractorName: ['', [Validators.required]],
      contractorContactPerson: ['', [Validators.required]],
      contractorPhone: ['', [Validators.required]],
      contractorEmail: ['', [Validators.required, Validators.email]],
      contractorTaxId: ['']
    });
  }

  private populateFormWithParsedData(): void {
    const data = this.parsedData();
    if (!data) return;

    // Populate form with parsed data
    this.editorForm.patchValue({
      contractNumber: data.contractNumber || '',
      title: data.title || '',
      description: data.description || '',
      totalAmount: data.totalAmount || 0,
      currency: data.currency || 'TWD',
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      signedDate: data.signedDate ? new Date(data.signedDate) : null,
      // Owner
      ownerName: data.owner?.name || '',
      ownerContactPerson: data.owner?.contactPerson || '',
      ownerPhone: data.owner?.contactPhone || '',
      ownerEmail: data.owner?.contactEmail || '',
      ownerTaxId: data.owner?.taxId || '',
      // Contractor
      contractorName: data.contractor?.name || '',
      contractorContactPerson: data.contractor?.contactPerson || '',
      contractorPhone: data.contractor?.contactPhone || '',
      contractorEmail: data.contractor?.contactEmail || '',
      contractorTaxId: data.contractor?.taxId || ''
    });

    // Populate work items
    if (data.workItems && data.workItems.length > 0) {
      this.workItems.set(data.workItems);
      this.calculateWorkItemsTotal();
    }
  }

  private calculateWorkItemsTotal(): void {
    const total = this.workItems().reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    this.workItemsTotal.set(total);
  }

  getConfidenceDescription(): string {
    const conf = this.confidence();
    if (conf >= 0.9) return '高信心度 - 資料可信度高';
    if (conf >= 0.7) return '中信心度 - 建議檢查資料';
    return '低信心度 - 請仔細核對所有資料';
  }

  editWorkItem(item: any): void {
    // TODO: Implement work item editing modal
    this.message.info('工項編輯功能開發中');
  }

  removeWorkItem(code: string): void {
    this.workItems.update(items => items.filter(item => item.code !== code));
    this.calculateWorkItemsTotal();
    this.message.success('已移除工項');
  }

  onReset(): void {
    this.populateFormWithParsedData();
    this.message.info('已重置為原始解析資料');
  }

  onConfirm(): void {
    if (this.editorForm.invalid) {
      this.markFormDirty();
      this.message.error('請填寫所有必填欄位');
      return;
    }

    const formValue = this.editorForm.value;

    // Build enhanced parsing output with edited data
    const editedData: EnhancedContractParsingOutput = {
      contractNumber: formValue.contractNumber,
      title: formValue.title,
      description: formValue.description,
      owner: {
        name: formValue.ownerName,
        type: 'owner',
        contactPerson: formValue.ownerContactPerson,
        contactPhone: formValue.ownerPhone,
        contactEmail: formValue.ownerEmail,
        taxId: formValue.ownerTaxId
      },
      contractor: {
        name: formValue.contractorName,
        type: 'contractor',
        contactPerson: formValue.contractorContactPerson,
        contactPhone: formValue.contractorPhone,
        contactEmail: formValue.contractorEmail,
        taxId: formValue.contractorTaxId
      },
      totalAmount: formValue.totalAmount,
      currency: formValue.currency,
      startDate: formValue.startDate ? formValue.startDate.toISOString() : '',
      endDate: formValue.endDate ? formValue.endDate.toISOString() : '',
      signedDate: formValue.signedDate ? formValue.signedDate.toISOString() : undefined,
      workItems: this.workItems(),
      terms: this.parsedData().terms,
      paymentTerms: this.parsedData().paymentTerms,
      warrantyPeriod: this.parsedData().warrantyPeriod
    };

    this.confirmed.emit(editedData);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markFormDirty(): void {
    Object.keys(this.editorForm.controls).forEach(key => {
      const control = this.editorForm.get(key);
      control?.markAsDirty();
      control?.updateValueAndValidity();
    });
  }
}
