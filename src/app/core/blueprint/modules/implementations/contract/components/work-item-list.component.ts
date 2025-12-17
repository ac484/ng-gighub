/**
 * Work Item List Component
 * 工項清單元件
 *
 * Reusable component for displaying and managing work items.
 * Can be used in contract creation wizard, contract detail view, etc.
 *
 * ✅ Modern Angular 20+ patterns:
 * - Standalone Component
 * - Signals for reactive state
 * - Modern input()/output() functions
 * - OnPush change detection
 * - Type-safe with WorkItem model
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, computed, signal, input, output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

export interface WorkItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
}

@Component({
  selector: 'app-work-item-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  templateUrl: './work-item-list.component.html',
  styleUrl: './work-item-list.component.scss'
})
export class WorkItemListComponent {
  private fb = inject(FormBuilder);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // ==================== INPUTS ====================
  
  /** Work items data (initial or current) */
  workItems = input<WorkItem[]>([]);
  
  /** Read-only mode (no add/edit/delete) */
  readonly = input(false);
  
  /** Show total amount summary */
  showTotal = input(true);

  // ==================== OUTPUTS ====================
  
  /** Emitted when work items change */
  workItemsChange = output<WorkItem[]>();
  
  /** Emitted when a work item is added */
  workItemAdded = output<WorkItem>();
  
  /** Emitted when a work item is edited */
  workItemEdited = output<WorkItem>();
  
  /** Emitted when a work item is deleted */
  workItemDeleted = output<WorkItem>();

  // ==================== INTERNAL STATE ====================
  
  /** Local work items state */
  private _items = signal<WorkItem[]>([]);
  
  /** Currently editing work item */
  editingItem = signal<WorkItem | null>(null);
  
  /** Edit/Add form visibility */
  showEditForm = signal(false);
  
  /** Edit/Add form */
  editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    unit: ['式', [Validators.required, Validators.maxLength(10)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    notes: ['', Validators.maxLength(500)]
  });

  // ==================== COMPUTED SIGNALS ====================
  
  /** Current work items (synced with input) */
  items = computed(() => {
    const inputItems = this.workItems();
    if (inputItems && inputItems.length > 0) {
      this._items.set(inputItems);
    }
    return this._items();
  });
  
  /** Total amount of all work items */
  totalAmount = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  });
  
  /** Total items count */
  itemCount = computed(() => this.items().length);
  
  /** Whether list is empty */
  isEmpty = computed(() => this.itemCount() === 0);
  
  /** Form mode: 'add' or 'edit' */
  formMode = computed(() => this.editingItem() ? 'edit' : 'add');
  
  /** Form title based on mode */
  
  // ==================== FORMATTERS & PARSERS ====================
  
  /** Formatter for price input (add currency prefix and commas) */
  priceFormatter = (value: number): string => {
    return 'NT$ ' + value;
  };

  /** Parser for price input (remove currency prefix, return number) */
  priceParser = (value: string): number => {
    const cleaned = value.replace('NT$ ', '');
    return cleaned ? parseFloat(cleaned) : 0;
  };
  formTitle = computed(() => this.formMode() === 'edit' ? '編輯工項' : '新增工項');

  // ==================== LIFECYCLE ====================
  
  constructor() {
    // Watch unit price and quantity changes to update total
    this.editForm.get('quantity')?.valueChanges.subscribe(() => this.updateTotalAmount());
    this.editForm.get('unitPrice')?.valueChanges.subscribe(() => this.updateTotalAmount());
  }

  // ==================== PUBLIC METHODS ====================
  
  /**
   * Get current work items
   */
  getWorkItems(): WorkItem[] {
    return this.items();
  }
  
  /**
   * Set work items
   */
  setWorkItems(items: WorkItem[]): void {
    this._items.set(items);
    this.workItemsChange.emit(items);
  }
  
  /**
   * Add a new work item
   */
  addWorkItem(): void {
    if (this.readonly()) {
      this.message.warning('唯讀模式下無法新增工項');
      return;
    }
    
    this.editingItem.set(null);
    this.editForm.reset({
      quantity: 1,
      unit: '式',
      unitPrice: 0
    });
    this.showEditForm.set(true);
  }
  
  /**
   * Edit an existing work item
   */
  editWorkItem(item: WorkItem): void {
    if (this.readonly()) {
      this.message.warning('唯讀模式下無法編輯工項');
      return;
    }
    
    this.editingItem.set(item);
    this.editForm.patchValue({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      notes: item.notes || ''
    });
    this.showEditForm.set(true);
  }
  
  /**
   * Delete a work item
   */
  deleteWorkItem(item: WorkItem): void {
    if (this.readonly()) {
      this.message.warning('唯讀模式下無法刪除工項');
      return;
    }
    
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除工項「${item.name}」嗎？`,
      nzOkText: '刪除',
      nzOkDanger: true,
      nzOnOk: () => {
        const newItems = this.items().filter(i => i !== item);
        this._items.set(newItems);
        this.workItemsChange.emit(newItems);
        this.workItemDeleted.emit(item);
        this.message.success('工項已刪除');
      }
    });
  }
  
  /**
   * Save edited/new work item
   */
  saveWorkItem(): void {
    if (!this.editForm.valid) {
      Object.values(this.editForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      this.message.warning('請填寫所有必填欄位');
      return;
    }
    
    const formValue = this.editForm.value;
    const quantity = Number(formValue.quantity) || 0;
    const unitPrice = Number(formValue.unitPrice) || 0;
    const totalAmount = quantity * unitPrice;
    
    const workItem: WorkItem = {
      ...formValue,
      quantity,
      unitPrice,
      totalAmount
    };
    
    const editing = this.editingItem();
    if (editing) {
      // Edit existing item
      workItem.id = editing.id;
      const newItems = this.items().map(i => i === editing ? workItem : i);
      this._items.set(newItems);
      this.workItemsChange.emit(newItems);
      this.workItemEdited.emit(workItem);
      this.message.success('工項已更新');
    } else {
      // Add new item
      const newItems = [...this.items(), workItem];
      this._items.set(newItems);
      this.workItemsChange.emit(newItems);
      this.workItemAdded.emit(workItem);
      this.message.success('工項已新增');
    }
    
    this.cancelEditForm();
  }
  
  /**
   * Cancel edit form
   */
  cancelEditForm(): void {
    this.showEditForm.set(false);
    this.editingItem.set(null);
    this.editForm.reset();
  }
  
  /**
   * Clear all work items
   */
  clearAll(): void {
    if (this.readonly()) {
      this.message.warning('唯讀模式下無法清空工項');
      return;
    }
    
    if (this.isEmpty()) {
      this.message.info('工項清單已經是空的');
      return;
    }
    
    this.modal.confirm({
      nzTitle: '確認清空',
      nzContent: '確定要清空所有工項嗎？此操作無法復原。',
      nzOkText: '清空',
      nzOkDanger: true,
      nzOnOk: () => {
        this._items.set([]);
        this.workItemsChange.emit([]);
        this.message.success('工項清單已清空');
      }
    });
  }

  // ==================== PRIVATE METHODS ====================
  
  /**
   * Update total amount based on quantity and unit price
   */
  private updateTotalAmount(): void {
    const quantity = Number(this.editForm.get('quantity')?.value) || 0;
    const unitPrice = Number(this.editForm.get('unitPrice')?.value) || 0;
    // Total is computed but we can show it in form if needed
  }
}
