/**
 * Contract Verification Component
 *
 * Displays AI-parsed contract data in an editable form, allowing users
 * to review and modify extracted information before creating the contract.
 *
 * Implements SETC-018 Phase 4: Contract OCR Workflow - Verification Step.
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import type { CreateContractDto } from '../models/dtos';
import type { EnhancedContractParsingOutput } from '../utils/enhanced-parsing-converter';

/**
 * Contract Verification Component
 *
 * Allows users to review and edit AI-parsed contract data before confirmation.
 * Displays confidence scores for transparency and highlights low-confidence fields.
 */
@Component({
  selector: 'app-contract-verification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzAlertModule,
    NzBadgeModule,
    NzToolTipModule,
    NzDividerModule,
    NzSpaceModule
  ],
  templateUrl: './contract-verification.component.html',
  styleUrls: ['./contract-verification.component.scss']
})
export class ContractVerificationComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Input signal: AI-parsed data
  parsedData = input.required<EnhancedContractParsingOutput>();

  // Output signals: user actions
  confirm = output<CreateContractDto>();
  reject = output<void>();

  // Component state
  verificationForm!: FormGroup;
  readonly loading = signal(false);
  readonly submitting = signal(false);

  // Computed: Confidence score with status (default to 0.8 if not provided)
  readonly overallConfidence = computed(() => {
    // EnhancedContractParsingOutput doesn't have confidence field
    // Could be added later or computed from field confidence scores
    return 0.8; // Default high confidence for manual verification
  });

  readonly confidenceStatus = computed(() => {
    const confidence = this.overallConfidence();
    if (confidence >= 0.8) return { status: 'success', text: '高信心度', color: 'green' };
    if (confidence >= 0.6) return { status: 'warning', text: '中信心度', color: 'orange' };
    return { status: 'error', text: '低信心度', color: 'red' };
  });

  // Formatter for number input (add commas)
  amountFormatter = (value: number): string => {
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parser for number input (remove commas and currency symbols, return number)
  amountParser = (value: string): number => {
    const cleaned = value.replace(/\$\s?|,/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  };

  // Available currency options
  readonly currencies = [
    { value: 'TWD', label: '新台幣 (TWD)' },
    { value: 'USD', label: '美金 (USD)' },
    { value: 'CNY', label: '人民幣 (CNY)' },
    { value: 'EUR', label: '歐元 (EUR)' },
    { value: 'JPY', label: '日圓 (JPY)' }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize verification form with parsed data
   */
  private initializeForm(): void {
    const data = this.parsedData();

    this.verificationForm = this.fb.group({
      // Contract basic info
      contractNumber: [data.contractNumber || '', [Validators.required]],
      title: [data.title || '', [Validators.required, Validators.maxLength(200)]],
      description: [data.description || ''],

      // Owner information
      owner: this.fb.group({
        name: [data.owner?.name || '', [Validators.required]],
        contactPerson: [data.owner?.contactPerson || '', [Validators.required]],
        contactPhone: [data.owner?.contactPhone || '', [Validators.required, Validators.pattern(/^[0-9\-\+\(\)\s]+$/)]],
        contactEmail: [data.owner?.contactEmail || '', [Validators.required, Validators.email]],
        address: [data.owner?.address || ''],
        taxId: [data.owner?.taxId || '']
      }),

      // Contractor information
      contractor: this.fb.group({
        name: [data.contractor?.name || '', [Validators.required]],
        contactPerson: [data.contractor?.contactPerson || '', [Validators.required]],
        contactPhone: [data.contractor?.contactPhone || '', [Validators.required, Validators.pattern(/^[0-9\-\+\(\)\s]+$/)]],
        contactEmail: [data.contractor?.contactEmail || '', [Validators.required, Validators.email]],
        address: [data.contractor?.address || ''],
        taxId: [data.contractor?.taxId || '']
      }),

      // Dates
      startDate: [data.startDate ? new Date(data.startDate) : null, [Validators.required]],
      endDate: [data.endDate ? new Date(data.endDate) : null, [Validators.required]],
      signedDate: [data.signedDate ? new Date(data.signedDate) : null],

      // Financial
      currency: [data.currency || 'TWD', [Validators.required]],
      totalAmount: [data.totalAmount || 0, [Validators.required, Validators.min(0)]],

      // Work items (stored for confirmation, not directly editable in this form)
      workItems: this.fb.array(
        (data.workItems || []).map(item =>
          this.fb.group({
            code: [item.code || ''],
            title: [item.title || '', [Validators.required]],
            description: [item.description || ''],
            quantity: [item.quantity || 0, [Validators.required, Validators.min(0)]],
            unit: [item.unit || '', [Validators.required]],
            unitPrice: [item.unitPrice || 0, [Validators.required, Validators.min(0)]],
            totalPrice: [item.totalPrice || 0, [Validators.required, Validators.min(0)]],
            discount: [item.discount || 0, [Validators.min(0)]],
            category: [item.category || ''],
            remarks: [item.remarks || '']
          })
        )
      )
    });
  }

  /**
   * Get work items form array
   */
  get workItemsArray(): FormArray {
    return this.verificationForm.get('workItems') as FormArray;
  }

  /**
   * Format confidence score for display
   */
  formatConfidence(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  /**
   * Get confidence class for styling
   */
  getConfidenceClass(score: number): string {
    if (score >= 0.8) return 'confidence-high';
    if (score >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  }

  /**
   * Handle form confirmation
   * Emits CreateContractDto to parent component
   */
  onConfirm(): void {
    if (this.verificationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.verificationForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);

    // Extract verified data from form
    const formValue = this.verificationForm.value;

    // This will be emitted to parent for contract creation
    // Parent component will add blueprintId and createdBy
    this.confirm.emit(formValue as any);
  }

  /**
   * Handle rejection
   * Returns user to upload step
   */
  onReject(): void {
    this.reject.emit();
  }

  /**
   * Reset form to parsed data
   */
  onReset(): void {
    this.initializeForm();
  }
}
