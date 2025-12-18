/**
 * Contract Form Component
 * 合約表單元件
 *
 * Extracted from contract-creation-wizard for reusability
 * Handles contract basic information and parties (owner/contractor) management
 *
 * ✅ Angular 20+ patterns:
 * - Standalone Component
 * - Signals for reactive state
 * - OnPush change detection
 * - Modern input()/output() functions
 * - Reactive Forms with FormBuilder
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';

import type { Contract, ContractParty } from '../models';
import type { CreateContractDto } from '../models/dtos';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDividerModule
  ],
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss']
})
export class ContractFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  /** Initial contract data (optional, for edit mode) */
  contractData = input<Partial<Contract>>();

  /** Read-only mode flag */
  readonly = input(false);

  // Outputs
  /** Emits when form value changes */
  formChange = output<Partial<CreateContractDto>>();

  /** Emits when form valid state changes */
  formValid = output<boolean>();

  // State signals
  private _form = signal<FormGroup | null>(null);

  /** Form group reference */
  contractForm!: FormGroup;

  /** Form validity state */
  isFormValid = computed(() => {
    const form = this._form();
    return form ? form.valid : false;
  });

  // Formatters and parsers for number inputs
  amountFormatter = (value: number): string => {
    return `NT$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  amountParser = (value: string): number => {
    const cleaned = value.replace(/NT\$\s?|,/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  };

  constructor() {
    // Watch for readonly changes
    effect(() => {
      const form = this._form();
      if (form) {
        const readonlyState = this.readonly();
        if (readonlyState) {
          form.disable();
        } else {
          form.enable();
        }
      }
    });

    // Watch for form validity changes
    effect(() => {
      const valid = this.isFormValid();
      this.formValid.emit(valid);
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValueChanges();
    this.patchInitialData();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.contractForm = this.fb.group({
      // Basic contract info
      contractNumber: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],

      // Owner party
      ownerParty: this.fb.group({
        companyName: ['', [Validators.required]],
        contactPerson: ['', [Validators.required]],
        contactPhone: ['', [Validators.required]],
        contactEmail: ['', [Validators.email]],
        address: ['']
      }),

      // Contractor party
      contractorParty: this.fb.group({
        companyName: ['', [Validators.required]],
        contactPerson: ['', [Validators.required]],
        contactPhone: ['', [Validators.required]],
        contactEmail: ['', [Validators.email]],
        address: ['']
      }),

      // Dates
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],

      // Amount
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      currency: ['TWD', [Validators.required]]
    });

    this._form.set(this.contractForm);
  }

  /**
   * Setup form value changes subscription
   */
  private setupFormValueChanges(): void {
    this.contractForm.valueChanges.subscribe(value => {
      if (this.contractForm.valid) {
        this.formChange.emit(this.getFormValue());
      }
    });
  }

  /**
   * Patch initial data if provided
   */
  private patchInitialData(): void {
    const data = this.contractData();
    if (data) {
      this.setFormValue(data);
    }
  }

  /**
   * Get current form value as CreateContractDto
   */
  getFormValue(): Partial<CreateContractDto> {
    const formValue = this.contractForm.value;

    return {
      contractNumber: formValue.contractNumber,
      title: formValue.name,
      description: formValue.description,
      owner: formValue.ownerParty as ContractParty,
      contractor: formValue.contractorParty as ContractParty,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      totalAmount: formValue.totalAmount,
      currency: formValue.currency
    };
  }

  /**
   * Set form value from contract data
   */
  setFormValue(data: Partial<Contract>): void {
    this.contractForm.patchValue({
      contractNumber: data.contractNumber,
      name: data.title,
      description: data.description,
      ownerParty: data.owner,
      contractorParty: data.contractor,
      startDate: data.startDate,
      endDate: data.endDate,
      totalAmount: data.totalAmount,
      currency: data.currency
    });
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.contractForm.reset();
    const data = this.contractData();
    if (data) {
      this.setFormValue(data);
    }
  }

  /**
   * Validate form and mark all fields as touched
   */
  validateForm(): boolean {
    Object.values(this.contractForm.controls).forEach(control => {
      if (control instanceof FormGroup) {
        Object.values(control.controls).forEach(subControl => {
          subControl.markAsDirty();
          subControl.updateValueAndValidity();
        });
      } else {
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    return this.contractForm.valid;
  }
}
