# SETC-007: Issue UI Components

> **任務 ID**: SETC-007  
> **任務名稱**: Issue UI Components  
> **優先級**: P1 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-006 (Issue Module Facade)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單 UI 元件實作

### 背景 / 目的
實作問題單管理的使用者介面，包括列表、詳情、建立表單、解決流程介面。使用 ng-alain 的 ST 表格和 SF 動態表單元件。

### 需求說明
1. 實作問題單列表元件
2. 實作問題單詳情元件
3. 實作建立表單
4. 實作解決流程介面
5. 遵循 Angular 20 Standalone Components

### In Scope / Out of Scope

#### ✅ In Scope
- IssueListComponent
- IssueDetailComponent
- IssueCreateFormComponent
- IssueResolutionFormComponent
- IssueVerificationFormComponent
- 路由配置

#### ❌ Out of Scope
- 複雜圖表
- 打印功能

### 功能行為
提供完整的問題單管理介面。

### 資料 / API

#### IssueListComponent

```typescript
@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header title="問題單管理">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="create()">
          <i nz-icon nzType="plus"></i>
          新增問題單
        </button>
      </ng-template>
    </page-header>

    <nz-card>
      <!-- 篩選區域 -->
      <div class="filter-bar mb-md">
        <nz-radio-group [(ngModel)]="statusFilter" (ngModelChange)="reload()">
          <label nz-radio-button nzValue="">全部</label>
          <label nz-radio-button nzValue="open">待處理</label>
          <label nz-radio-button nzValue="in_progress">處理中</label>
          <label nz-radio-button nzValue="resolved">已解決</label>
          <label nz-radio-button nzValue="verified">已驗證</label>
          <label nz-radio-button nzValue="closed">已結案</label>
        </nz-radio-group>

        <nz-select [(ngModel)]="sourceFilter" style="width: 150px;">
          <nz-option nzValue="" nzLabel="所有來源"></nz-option>
          <nz-option nzValue="manual" nzLabel="手動建立"></nz-option>
          <nz-option nzValue="acceptance" nzLabel="驗收"></nz-option>
          <nz-option nzValue="qc" nzLabel="品檢"></nz-option>
          <nz-option nzValue="warranty" nzLabel="保固"></nz-option>
        </nz-select>
      </div>

      <!-- 表格 -->
      <st 
        [data]="issues()" 
        [columns]="columns"
        [loading]="loading()"
        (change)="handleChange($event)">
      </st>
    </nz-card>
  `
})
export class IssueListComponent implements OnInit {
  private issueFacade = inject(IssueModuleFacade);
  private modal = inject(NzModalService);
  private router = inject(Router);
  private blueprintContext = inject(BlueprintContextService);
  private destroyRef = inject(DestroyRef);

  issues = signal<Issue[]>([]);
  loading = signal(false);
  statusFilter = '';
  sourceFilter = '';

  columns: STColumn[] = [
    { title: '編號', index: 'issueNumber', width: 150 },
    { title: '標題', index: 'title' },
    { 
      title: '嚴重度', 
      index: 'severity',
      type: 'badge',
      badge: {
        critical: { text: '嚴重', color: 'error' },
        major: { text: '重要', color: 'warning' },
        minor: { text: '輕微', color: 'default' }
      }
    },
    { 
      title: '來源', 
      index: 'source',
      type: 'tag',
      tag: {
        manual: { text: '手動', color: 'blue' },
        acceptance: { text: '驗收', color: 'green' },
        qc: { text: '品檢', color: 'orange' },
        warranty: { text: '保固', color: 'purple' }
      }
    },
    { 
      title: '狀態', 
      index: 'status',
      type: 'badge',
      badge: {
        open: { text: '待處理', color: 'default' },
        in_progress: { text: '處理中', color: 'processing' },
        resolved: { text: '已解決', color: 'success' },
        verified: { text: '已驗證', color: 'success' },
        closed: { text: '已結案', color: 'default' }
      }
    },
    { title: '建立日期', index: 'createdAt', type: 'date' },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record) => this.view(record) },
        { 
          text: '解決', 
          click: (record) => this.resolve(record),
          iif: (record) => ['open', 'in_progress'].includes(record.status)
        },
        { 
          text: '驗證', 
          click: (record) => this.verify(record),
          iif: (record) => record.status === 'resolved'
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    const blueprintId = this.blueprintContext.currentBlueprintId();
    
    this.issueFacade.getIssues$(blueprintId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (issues) => {
          let filtered = issues;
          if (this.statusFilter) {
            filtered = filtered.filter(i => i.status === this.statusFilter);
          }
          if (this.sourceFilter) {
            filtered = filtered.filter(i => i.source === this.sourceFilter);
          }
          this.issues.set(filtered);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  create(): void {
    this.modal.create({
      nzTitle: '新增問題單',
      nzContent: IssueCreateFormComponent,
      nzWidth: 800,
      nzOnOk: () => this.loadData()
    });
  }

  view(record: Issue): void {
    this.router.navigate(['/issue', record.id]);
  }

  resolve(record: Issue): void {
    this.modal.create({
      nzTitle: '解決問題單',
      nzContent: IssueResolutionFormComponent,
      nzData: { issue: record },
      nzWidth: 800,
      nzOnOk: () => this.loadData()
    });
  }

  verify(record: Issue): void {
    this.modal.create({
      nzTitle: '驗證問題單',
      nzContent: IssueVerificationFormComponent,
      nzData: { issue: record },
      nzWidth: 600,
      nzOnOk: () => this.loadData()
    });
  }
}
```

#### IssueCreateFormComponent

```typescript
@Component({
  selector: 'app-issue-create-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <sf [schema]="schema" (formSubmit)="submit($event)">
      <ng-template sf-template="beforePhotos" let-control>
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
export class IssueCreateFormComponent {
  private issueFacade = inject(IssueModuleFacade);
  private authService = inject(AuthService);
  private modal = inject(NzModalRef);
  private message = inject(NzMessageService);
  private blueprintContext = inject(BlueprintContextService);

  fileList: NzUploadFile[] = [];

  schema: SFSchema = {
    properties: {
      title: {
        type: 'string',
        title: '問題標題',
        maxLength: 200
      },
      description: {
        type: 'string',
        title: '問題描述',
        ui: { widget: 'textarea', rows: 4 }
      },
      location: {
        type: 'string',
        title: '位置'
      },
      severity: {
        type: 'string',
        title: '嚴重度',
        enum: [
          { label: '嚴重', value: 'critical' },
          { label: '重要', value: 'major' },
          { label: '輕微', value: 'minor' }
        ],
        ui: { widget: 'radio' },
        default: 'major'
      },
      category: {
        type: 'string',
        title: '類別',
        enum: [
          { label: '品質', value: 'quality' },
          { label: '安全', value: 'safety' },
          { label: '保固', value: 'warranty' },
          { label: '其他', value: 'other' }
        ],
        ui: { widget: 'select' },
        default: 'quality'
      },
      responsibleParty: {
        type: 'string',
        title: '責任方'
      },
      beforePhotos: {
        type: 'string',
        title: '現場照片',
        ui: { widget: 'custom' }
      }
    },
    required: ['title', 'description', 'location', 'severity', 'category']
  };

  async submit(formData: any): Promise<void> {
    try {
      await this.issueFacade.createIssue({
        blueprintId: this.blueprintContext.currentBlueprintId(),
        ...formData,
        beforePhotos: this.fileList.map(f => ({ url: f.url, name: f.name }))
      }, this.getCurrentActor());
      
      this.message.success('問題單已建立');
      this.modal.close(true);
    } catch (error) {
      this.message.error('建立失敗');
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [...this.fileList, file];
    return false;
  };

  private getCurrentActor(): EventActor {
    const user = this.authService.currentUser();
    return {
      userId: user?.uid ?? '',
      userName: user?.displayName ?? '',
      role: 'user'
    };
  }
}
```

#### IssueResolutionFormComponent

```typescript
@Component({
  selector: 'app-issue-resolution-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions [nzColumn]="2" nzBordered class="mb-md">
      <nz-descriptions-item nzTitle="問題編號">
        {{ issue.issueNumber }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="嚴重度">
        <nz-tag [nzColor]="severityColor">{{ issue.severity }}</nz-tag>
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="問題描述" [nzSpan]="2">
        {{ issue.description }}
      </nz-descriptions-item>
    </nz-descriptions>

    <nz-divider nzText="解決方案"></nz-divider>

    <sf [schema]="schema" (formSubmit)="submit($event)">
      <ng-template sf-template="photos" let-control>
        <nz-upload
          nzListType="picture-card"
          [(nzFileList)]="fileList"
          [nzBeforeUpload]="beforeUpload">
          <div>
            <i nz-icon nzType="plus"></i>
            <div>完工照片</div>
          </div>
        </nz-upload>
      </ng-template>
    </sf>
  `
})
export class IssueResolutionFormComponent {
  @Input() issue!: Issue;

  private issueFacade = inject(IssueModuleFacade);
  private authService = inject(AuthService);
  private modal = inject(NzModalRef);
  private message = inject(NzMessageService);

  fileList: NzUploadFile[] = [];

  schema: SFSchema = {
    properties: {
      description: {
        type: 'string',
        title: '解決說明',
        ui: { widget: 'textarea', rows: 4 }
      },
      method: {
        type: 'string',
        title: '解決方法'
      },
      cost: {
        type: 'number',
        title: '處理成本',
        minimum: 0
      },
      notes: {
        type: 'string',
        title: '備註',
        ui: { widget: 'textarea', rows: 2 }
      },
      photos: {
        type: 'string',
        title: '完工照片',
        ui: { widget: 'custom' }
      }
    },
    required: ['description', 'method']
  };

  get severityColor(): string {
    const colors: Record<string, string> = {
      critical: 'red',
      major: 'orange',
      minor: 'blue'
    };
    return colors[this.issue.severity] ?? 'default';
  }

  async submit(formData: any): Promise<void> {
    try {
      await this.issueFacade.submitResolution(
        this.issue.id,
        {
          ...formData,
          photos: this.fileList.map(f => ({ url: f.url, name: f.name }))
        },
        this.getCurrentActor()
      );
      
      this.message.success('解決方案已提交');
      this.modal.close(true);
    } catch (error) {
      this.message.error('提交失敗');
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [...this.fileList, file];
    return false;
  };

  private getCurrentActor(): EventActor {
    const user = this.authService.currentUser();
    return {
      userId: user?.uid ?? '',
      userName: user?.displayName ?? '',
      role: 'user'
    };
  }
}
```

### 影響範圍
- `src/app/routes/issue/`

### 驗收條件
1. ✅ 列表元件正常
2. ✅ 建立表單完整
3. ✅ 解決流程介面正確
4. ✅ 驗證流程介面正確
5. ✅ 符合 ng-alain 設計規範

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 ng-alain ST 表格與 SF 表單

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **元件拆分**
   - 列表
   - 建立表單
   - 解決表單
   - 驗證表單

2. **使用者流程**
   - 查看列表 → 建立/查看 → 解決 → 驗證 → 結案

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── IssueListComponent
├── IssueCreateFormComponent
└── 路由配置

Day 2 (8 hours):
├── IssueResolutionFormComponent
├── IssueVerificationFormComponent
├── IssueDetailComponent
└── 樣式調整
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/routes/issue/issue-list/issue-list.component.ts`
- `src/app/routes/issue/issue-detail/issue-detail.component.ts`
- `src/app/routes/issue/issue-create-form/issue-create-form.component.ts`
- `src/app/routes/issue/issue-resolution-form/issue-resolution-form.component.ts`
- `src/app/routes/issue/issue-verification-form/issue-verification-form.component.ts`
- `src/app/routes/issue/issue.routes.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 列表顯示正常
- [ ] 建立表單完整
- [ ] 解決流程正確

### UI/UX 檢查
- [ ] 響應式設計
- [ ] 載入指示
- [ ] 錯誤處理
