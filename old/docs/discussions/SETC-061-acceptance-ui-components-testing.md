# SETC-061: Acceptance UI Components & Testing

> **任務編號**: SETC-061  
> **模組**: Acceptance Module (驗收模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-060  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作 Acceptance Module 的 UI 元件庫和完整測試套件，提供驗收申請列表、初驗檢查表、複驗對比等視覺化元件。

### 範圍
- 驗收申請列表元件
- 驗收申請表單元件
- 初驗檢查表元件
- 複驗對比元件
- 驗收結論報告元件
- 單元測試與整合測試

---

## 🏗️ UI 元件實作

### 1. 驗收申請列表元件

```typescript
import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { STColumn } from '@delon/abc/st';
import { AcceptanceRequestRepository } from '../repositories/acceptance-request.repository';
import { AcceptanceRequest, RequestStatus } from '../models/acceptance-request.model';

@Component({
  selector: 'app-acceptance-request-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card [nzTitle]="titleTpl" [nzExtra]="extraTpl">
      <ng-template #titleTpl>
        <span>驗收申請</span>
        <nz-badge [nzCount]="requests().length" nzShowZero class="ml-sm" />
      </ng-template>
      
      <ng-template #extraTpl>
        <button nz-button nzType="primary" (click)="onCreateRequest()">
          <i nz-icon nzType="plus"></i>
          新增申請
        </button>
      </ng-template>

      <st 
        [data]="requests()" 
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, pageSize: 15 }"
        (change)="handleTableChange($event)"
      />
    </nz-card>
  `
})
export class AcceptanceRequestListComponent implements OnInit {
  blueprintId = input.required<string>();
  
  requestSelected = output<AcceptanceRequest>();
  createRequest = output<void>();
  
  private repository = inject(AcceptanceRequestRepository);
  
  requests = signal<AcceptanceRequest[]>([]);
  loading = signal(false);
  
  columns: STColumn[] = [
    { title: '申請編號', index: 'requestNumber', width: 120 },
    { title: '標題', index: 'title', width: 200 },
    { 
      title: '類型', 
      index: 'requestType',
      width: 100,
      type: 'tag',
      tag: {
        preliminary: { text: '初驗', color: 'blue' },
        final: { text: '正式驗收', color: 'green' },
        partial: { text: '部分驗收', color: 'orange' },
        phased: { text: '分階段', color: 'purple' }
      }
    },
    { 
      title: '狀態', 
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        submitted: { text: '已提交', color: 'processing' },
        under_review: { text: '審核中', color: 'warning' },
        approved: { text: '已核准', color: 'success' },
        rejected: { text: '退回', color: 'error' },
        withdrawn: { text: '已撤回', color: 'default' }
      }
    },
    { 
      title: '申請日期', 
      index: 'requestedAt',
      type: 'date',
      width: 120
    },
    { 
      title: '預定日期', 
      index: 'proposedDate',
      type: 'date',
      width: 120
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (item: any) => this.viewRequest(item) },
        { 
          text: '提交', 
          click: (item: any) => this.submitRequest(item),
          iif: (item: any) => item.status === 'draft'
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.loading.set(true);
    try {
      const requests = await this.repository.findByBlueprint(this.blueprintId());
      this.requests.set(requests);
    } finally {
      this.loading.set(false);
    }
  }

  onCreateRequest(): void {
    this.createRequest.emit();
  }

  viewRequest(request: AcceptanceRequest): void {
    this.requestSelected.emit(request);
  }

  submitRequest(request: AcceptanceRequest): void {
    // TODO: 提交驗收申請
  }

  handleTableChange(e: any): void {
    // 處理表格變更
  }
}
```

### 2. 初驗檢查表元件

```typescript
import { Component, input, output, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { InspectionItem, CheckResultInput } from '../models/preliminary-acceptance.model';

@Component({
  selector: 'app-preliminary-checklist',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="初驗檢查表">
      <nz-table 
        [nzData]="inspectionItems()" 
        [nzLoading]="loading()"
        nzSize="small"
      >
        <thead>
          <tr>
            <th nzWidth="50px">#</th>
            <th nzWidth="120px">分類</th>
            <th>檢查項目</th>
            <th nzWidth="150px">標準</th>
            <th nzWidth="150px">結果</th>
            <th nzWidth="100px">備註</th>
          </tr>
        </thead>
        <tbody>
          @for (item of inspectionItems(); track item.id; let i = $index) {
            <tr>
              <td>{{ i + 1 }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.item }}</td>
              <td>{{ item.acceptanceCriteria }}</td>
              <td>
                <nz-radio-group 
                  [(ngModel)]="checkResults()[item.id]" 
                  (ngModelChange)="onResultChange(item.id, $event)"
                  nzSize="small"
                >
                  <label nz-radio nzValue="passed">
                    <i nz-icon nzType="check" class="text-success"></i>
                  </label>
                  <label nz-radio nzValue="failed">
                    <i nz-icon nzType="close" class="text-error"></i>
                  </label>
                  <label nz-radio nzValue="na">N/A</label>
                </nz-radio-group>
              </td>
              <td>
                <button 
                  nz-button 
                  nzSize="small" 
                  nzType="link"
                  (click)="addNote(item.id)"
                >
                  <i nz-icon nzType="edit"></i>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
      
      <div class="mt-md">
        <nz-space>
          <span *nzSpaceItem>
            通過: <nz-badge [nzCount]="passedCount()" nzStatus="success" />
          </span>
          <span *nzSpaceItem>
            未通過: <nz-badge [nzCount]="failedCount()" nzStatus="error" />
          </span>
          <span *nzSpaceItem>
            通過率: <strong>{{ passRate() }}%</strong>
          </span>
        </nz-space>
      </div>
      
      <div class="mt-md text-right">
        <button 
          nz-button 
          nzType="primary" 
          (click)="submitResults()"
          [disabled]="!canSubmit()"
        >
          提交檢查結果
        </button>
      </div>
    </nz-card>
  `
})
export class PreliminaryChecklistComponent {
  inspectionItems = input.required<InspectionItem[]>();
  loading = input(false);
  
  resultsSubmitted = output<CheckResultInput[]>();
  
  checkResults = signal<Record<string, string>>({});
  notes = signal<Record<string, string>>({});
  
  passedCount = computed(() => 
    Object.values(this.checkResults()).filter(r => r === 'passed').length
  );
  
  failedCount = computed(() => 
    Object.values(this.checkResults()).filter(r => r === 'failed').length
  );
  
  passRate = computed(() => {
    const total = Object.values(this.checkResults()).filter(r => r !== 'na').length;
    return total > 0 ? Math.round((this.passedCount() / total) * 100) : 0;
  });
  
  canSubmit = computed(() => {
    const items = this.inspectionItems();
    const results = this.checkResults();
    return items.every(item => results[item.id]);
  });

  onResultChange(itemId: string, result: string): void {
    const results = { ...this.checkResults() };
    results[itemId] = result;
    this.checkResults.set(results);
  }

  addNote(itemId: string): void {
    // TODO: 開啟備註 modal
  }

  submitResults(): void {
    const items = this.inspectionItems();
    const results = this.checkResults();
    const noteData = this.notes();
    
    const checkResults: CheckResultInput[] = items.map(item => ({
      itemId: item.id,
      result: results[item.id] as any,
      notes: noteData[item.id],
      checkedBy: 'current-user' // TODO: 從 AuthService 取得
    }));
    
    this.resultsSubmitted.emit(checkResults);
  }
}
```

### 3. 複驗對比元件

```typescript
import { Component, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ComparisonPhoto, DefectResolution } from '../models/reinspection.model';

@Component({
  selector: 'app-reinspection-comparison',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="缺失改善對比">
      @for (resolution of resolutions(); track resolution.defectId) {
        <nz-card 
          class="mb-md" 
          [nzTitle]="resolution.defectNumber"
          [nzExtra]="statusTpl"
        >
          <ng-template #statusTpl>
            <nz-tag [nzColor]="getStatusColor(resolution.verificationResult)">
              {{ getStatusText(resolution.verificationResult) }}
            </nz-tag>
          </ng-template>
          
          <p class="text-grey mb-md">{{ resolution.originalDescription }}</p>
          
          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="12">
              <div class="comparison-section">
                <h4>改善前</h4>
                <div class="photo-grid">
                  @for (photo of resolution.beforePhotos; track photo) {
                    <img [src]="photo" class="comparison-photo" />
                  }
                </div>
              </div>
            </nz-col>
            <nz-col [nzSpan]="12">
              <div class="comparison-section">
                <h4>改善後</h4>
                <div class="photo-grid">
                  @for (photo of resolution.afterPhotos; track photo) {
                    <img [src]="photo" class="comparison-photo" />
                  }
                </div>
              </div>
            </nz-col>
          </nz-row>
          
          @if (resolution.verificationNotes) {
            <nz-divider />
            <p><strong>驗證備註:</strong> {{ resolution.verificationNotes }}</p>
          }
        </nz-card>
      }
    </nz-card>
  `,
  styles: [`
    .comparison-section {
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;
    }
    .comparison-section h4 {
      margin-bottom: 8px;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .comparison-photo {
      width: 100%;
      border-radius: 4px;
    }
  `]
})
export class ReinspectionComparisonComponent {
  resolutions = input.required<DefectResolution[]>();

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      acceptable: 'green',
      unacceptable: 'red',
      requires_improvement: 'orange',
      pending: 'default'
    };
    return colors[status] || 'default';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      acceptable: '合格',
      unacceptable: '不合格',
      requires_improvement: '需改進',
      pending: '待驗證'
    };
    return texts[status] || status;
  }
}
```

---

## 🧪 測試規格

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AcceptanceRequestListComponent } from './acceptance-request-list.component';
import { PreliminaryChecklistComponent } from './preliminary-checklist.component';

describe('AcceptanceRequestListComponent', () => {
  let component: AcceptanceRequestListComponent;
  let fixture: ComponentFixture<AcceptanceRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptanceRequestListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptanceRequestListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blueprintId', 'bp-123');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load requests on init', async () => {
    await fixture.whenStable();
    expect(component.requests()).toBeDefined();
  });
});

describe('PreliminaryChecklistComponent', () => {
  let component: PreliminaryChecklistComponent;
  let fixture: ComponentFixture<PreliminaryChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreliminaryChecklistComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreliminaryChecklistComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('inspectionItems', [
      { id: '1', category: 'Test', item: 'Item 1', acceptanceCriteria: 'OK' }
    ]);
  });

  it('should calculate pass rate correctly', () => {
    component.checkResults.set({ '1': 'passed' });
    expect(component.passRate()).toBe(100);
  });
});
```

---

## ✅ 交付物

- [ ] `acceptance-request-list.component.ts`
- [ ] `acceptance-request-form.component.ts`
- [ ] `preliminary-checklist.component.ts`
- [ ] `reinspection-comparison.component.ts`
- [ ] `conclusion-report.component.ts`
- [ ] `*.spec.ts` - 所有單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 所有 UI 元件正確渲染
2. ✅ 元件互動功能正常
3. ✅ 與服務層正確整合
4. ✅ 單元測試覆蓋率 >80%
5. ✅ TypeScript 編譯無錯誤

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
