# SETC-038: Warranty UI Components

> **任務 ID**: SETC-038  
> **任務名稱**: Warranty UI Components  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-037 (Warranty Event Integration)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固管理 UI 元件實作

### 背景 / 目的
實作保固管理的使用者介面，包括保固記錄列表、缺失管理介面、維修追蹤看板。使用 ng-alain 的 ST 表格和 ng-zorro 元件。

### 需求說明
1. 保固記錄列表元件
2. 保固詳情元件
3. 缺失管理介面
4. 維修追蹤看板
5. 保固到期提醒介面

### In Scope / Out of Scope

#### ✅ In Scope
- WarrantyListComponent
- WarrantyDetailComponent
- DefectListComponent
- DefectReportFormComponent
- RepairTrackingComponent

#### ❌ Out of Scope
- 複雜報表圖表
- 打印功能

### 功能行為
提供完整的保固管理介面。

### 資料 / API

#### WarrantyListComponent

```typescript
@Component({
  selector: 'app-warranty-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header title="保固管理">
      <ng-template #extra>
        <nz-tag [nzColor]="'volcano'">
          即將到期：{{ expiringCount() }}
        </nz-tag>
      </ng-template>
    </page-header>

    <nz-card>
      <!-- 狀態篩選 -->
      <div class="filter-bar mb-md">
        <nz-radio-group [(ngModel)]="statusFilter" (ngModelChange)="reload()">
          <label nz-radio-button nzValue="">全部</label>
          <label nz-radio-button nzValue="active">進行中</label>
          <label nz-radio-button nzValue="expiring">即將到期</label>
          <label nz-radio-button nzValue="expired">已到期</label>
          <label nz-radio-button nzValue="completed">已結案</label>
        </nz-radio-group>
      </div>

      <!-- 表格 -->
      <st 
        [data]="warranties()" 
        [columns]="columns"
        [loading]="loading()"
        (change)="handleChange($event)">
      </st>
    </nz-card>
  `
})
export class WarrantyListComponent implements OnInit {
  private warrantyService = inject(WarrantyPeriodService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  warranties = signal<Warranty[]>([]);
  loading = signal(false);
  statusFilter = '';

  expiringCount = computed(() => 
    this.warranties().filter(w => w.status === 'expiring').length
  );

  columns: STColumn[] = [
    { title: '保固編號', index: 'warrantyNumber', width: 150 },
    { title: '合約', index: 'contractName' },
    { 
      title: '狀態', 
      index: 'status',
      type: 'badge',
      badge: {
        active: { text: '進行中', color: 'success' },
        expiring: { text: '即將到期', color: 'warning' },
        expired: { text: '已到期', color: 'error' },
        completed: { text: '已結案', color: 'default' }
      }
    },
    { title: '開始日期', index: 'startDate', type: 'date' },
    { title: '結束日期', index: 'endDate', type: 'date' },
    { title: '缺失數', index: 'defectCount' },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record) => this.view(record) },
        { text: '缺失', click: (record) => this.viewDefects(record) }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  view(record: Warranty): void {
    this.router.navigate(['/warranty', record.id]);
  }

  viewDefects(record: Warranty): void {
    this.router.navigate(['/warranty', record.id, 'defects']);
  }
}
```

#### DefectReportFormComponent

```typescript
@Component({
  selector: 'app-defect-report-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <sf [schema]="schema" (formSubmit)="submit($event)">
      <ng-template sf-template="photos" let-control>
        <nz-upload
          nzListType="picture-card"
          [(nzFileList)]="fileList"
          [nzBeforeUpload]="beforeUpload">
          <div>
            <i nz-icon nzType="plus"></i>
            <div style="margin-top: 8px">上傳照片</div>
          </div>
        </nz-upload>
      </ng-template>
    </sf>
  `
})
export class DefectReportFormComponent {
  @Input() warrantyId!: string;
  @Output() submitted = new EventEmitter<void>();

  private defectService = inject(WarrantyDefectService);
  private message = inject(NzMessageService);

  fileList: NzUploadFile[] = [];

  schema: SFSchema = {
    properties: {
      description: {
        type: 'string',
        title: '缺失描述',
        ui: { widget: 'textarea', rows: 4 }
      },
      location: {
        type: 'string',
        title: '位置'
      },
      category: {
        type: 'string',
        title: '類別',
        enum: [
          { label: '結構', value: 'structural' },
          { label: '防水', value: 'waterproofing' },
          { label: '電氣', value: 'electrical' },
          { label: '管線', value: 'plumbing' },
          { label: '裝修', value: 'finishing' },
          { label: '機械', value: 'mechanical' },
          { label: '其他', value: 'other' }
        ],
        ui: { widget: 'select' }
      },
      severity: {
        type: 'string',
        title: '嚴重度',
        enum: [
          { label: '嚴重', value: 'critical' },
          { label: '重要', value: 'major' },
          { label: '輕微', value: 'minor' }
        ],
        ui: { widget: 'radio' }
      },
      reporterContact: {
        type: 'string',
        title: '聯絡電話'
      },
      photos: {
        type: 'string',
        title: '現場照片',
        ui: { widget: 'custom' }
      }
    },
    required: ['description', 'location', 'category', 'severity', 'reporterContact']
  };

  async submit(formData: any): Promise<void> {
    try {
      await this.defectService.reportDefect({
        warrantyId: this.warrantyId,
        ...formData,
        photos: this.fileList.map(f => ({ url: f.url, name: f.name }))
      });
      this.message.success('缺失已登記');
      this.submitted.emit();
    } catch (error) {
      this.message.error('登記失敗');
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [...this.fileList, file];
    return false;
  };
}
```

#### RepairTrackingComponent

```typescript
@Component({
  selector: 'app-repair-tracking',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="維修進度">
      <nz-steps [nzCurrent]="currentStep()">
        <nz-step nzTitle="待派工"></nz-step>
        <nz-step nzTitle="已排程"></nz-step>
        <nz-step nzTitle="進行中"></nz-step>
        <nz-step nzTitle="已完成"></nz-step>
        <nz-step nzTitle="已驗收"></nz-step>
      </nz-steps>

      <nz-divider></nz-divider>

      <nz-descriptions [nzColumn]="2">
        <nz-descriptions-item nzTitle="維修編號">
          {{ repair().repairNumber }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="維修單位">
          {{ repair().contractor.name }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="排程日期">
          {{ repair().scheduledDate | date }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="開始日期">
          {{ repair().startedDate | date }}
        </nz-descriptions-item>
      </nz-descriptions>

      @if (repair().completionPhotos.length > 0) {
        <nz-divider nzText="完工照片"></nz-divider>
        <nz-image-group>
          @for (photo of repair().completionPhotos; track photo.url) {
            <nz-image [nzSrc]="photo.url"></nz-image>
          }
        </nz-image-group>
      }
    </nz-card>
  `
})
export class RepairTrackingComponent {
  @Input() repair = signal<WarrantyRepair | null>(null);

  currentStep = computed(() => {
    const statusMap: Record<string, number> = {
      pending: 0,
      scheduled: 1,
      in_progress: 2,
      completed: 3,
      verified: 4
    };
    return statusMap[this.repair()?.status ?? 'pending'] ?? 0;
  });
}
```

### 影響範圍
- `src/app/routes/warranty/`

### 驗收條件
1. ✅ 列表元件正常
2. ✅ 缺失登記完整
3. ✅ 維修追蹤顯示正確
4. ✅ 響應式設計
5. ✅ 符合 ng-alain 規範

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 ng-zorro 進階元件

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **元件拆分**
   - 列表視圖
   - 詳情視圖
   - 表單元件

2. **使用者流程**
   - 查看保固 → 缺失列表 → 登記缺失 → 追蹤維修

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── WarrantyListComponent
├── WarrantyDetailComponent
└── 路由配置

Day 2 (8 hours):
├── DefectListComponent
├── DefectReportFormComponent
├── RepairTrackingComponent
└── 樣式調整
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/routes/warranty/warranty-list/warranty-list.component.ts`
- `src/app/routes/warranty/warranty-detail/warranty-detail.component.ts`
- `src/app/routes/warranty/defect-list/defect-list.component.ts`
- `src/app/routes/warranty/defect-report-form/defect-report-form.component.ts`
- `src/app/routes/warranty/repair-tracking/repair-tracking.component.ts`
- `src/app/routes/warranty/warranty.routes.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 列表顯示正常
- [ ] 缺失登記完整
- [ ] 維修追蹤準確

### UI/UX 檢查
- [ ] 響應式設計
- [ ] 載入指示
- [ ] 錯誤處理
