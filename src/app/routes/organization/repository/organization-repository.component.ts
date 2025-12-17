import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

interface RepositoryItem {
  id: string;
  name: string;
  type: 'document' | 'code' | 'design' | 'other';
  size: string;
  updatedAt: Date;
  updatedBy: string;
  tags: string[];
}

@Component({
  selector: 'app-organization-repository',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'組織倉庫'" [content]="headerContent">
      <ng-template #extra>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
        <button nz-button nzType="primary" (click)="showUploadModal()" class="ml-sm">
          <span nz-icon nzType="upload"></span>
          上傳檔案
        </button>
      </ng-template>
    </page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="database" nzTheme="outline" class="mr-xs"></span>
        集中管理組織文檔與資源
      </div>
    </ng-template>

    <nz-card [nzBordered]="false">
      <!-- Filter tabs -->
      <nz-radio-group [(ngModel)]="currentTypeValue" (ngModelChange)="onTypeChange()" class="mb-lg">
        <label nz-radio-button nzValue="all">全部</label>
        <label nz-radio-button nzValue="document">文檔</label>
        <label nz-radio-button nzValue="code">代碼</label>
        <label nz-radio-button nzValue="design">設計</label>
        <label nz-radio-button nzValue="other">其他</label>
      </nz-radio-group>

      <!-- Table -->
      <st [data]="filteredItems()" [columns]="columns" [loading]="loading()" [page]="{ show: true, showSize: true }"></st>
    </nz-card>

    <!-- Upload Modal -->
    <nz-modal
      [nzVisible]="uploadModalVisible()"
      [nzTitle]="'上傳檔案'"
      (nzOnCancel)="handleUploadCancel()"
      (nzOnOk)="handleUploadOk()"
      (nzVisibleChange)="uploadModalVisible.set($event)"
      [nzOkLoading]="uploading()"
    >
      <ng-container *nzModalContent>
        <nz-upload nzType="drag" [nzMultiple]="true" [nzBeforeUpload]="beforeUpload" class="upload-area">
          <p class="ant-upload-drag-icon">
            <span nz-icon nzType="inbox" nzTheme="outline"></span>
          </p>
          <p class="ant-upload-text">點擊或拖曳檔案到此區域上傳</p>
          <p class="ant-upload-hint"> 支援單個或批次上傳，嚴禁上傳公司資料或其他敏感檔案 </p>
        </nz-upload>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .header-desc {
        color: #9ca3af;
        font-size: 14px;
      }

      .upload-area {
        margin-bottom: 16px;
      }

      ::ng-deep .ant-upload.ant-upload-drag {
        background: #0f172a;
        border-color: #1f2937;
      }

      ::ng-deep .ant-upload.ant-upload-drag:hover {
        border-color: #1e3a8a;
      }
    `
  ]
})
export class OrganizationRepositoryComponent implements OnInit {
  private message = inject(NzMessageService);

  // State signals
  loading = signal(false);
  uploading = signal(false);
  uploadModalVisible = signal(false);
  currentType = signal<string>('all');
  currentTypeValue = 'all'; // For template binding
  items = signal<RepositoryItem[]>([]);

  // Table columns
  columns: STColumn[] = [
    {
      title: '檔案名稱',
      index: 'name',
      render: 'name',
      width: '30%'
    },
    {
      title: '類型',
      index: 'type',
      type: 'badge',
      badge: {
        document: { text: '文檔', color: 'blue' },
        code: { text: '代碼', color: 'green' },
        design: { text: '設計', color: 'purple' },
        other: { text: '其他', color: 'default' }
      },
      width: '10%'
    },
    {
      title: '大小',
      index: 'size',
      width: '10%'
    },
    {
      title: '標籤',
      index: 'tags',
      render: 'tags',
      width: '20%'
    },
    {
      title: '更新時間',
      index: 'updatedAt',
      type: 'date',
      dateFormat: 'yyyy/MM/dd HH:mm',
      width: '15%'
    },
    {
      title: '更新者',
      index: 'updatedBy',
      width: '10%'
    },
    {
      title: '操作',
      buttons: [
        {
          text: '下載',
          icon: 'download',
          click: (record: RepositoryItem) => this.download(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除嗎？',
            okType: 'danger'
          },
          click: (record: RepositoryItem) => this.delete(record)
        }
      ],
      width: '15%'
    }
  ];

  // Computed signals
  filteredItems = computed(() => {
    const type = this.currentType();
    const allItems = this.items();

    if (type === 'all') {
      return allItems;
    }

    return allItems.filter(item => item.type === type);
  });

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);

    // Mock data
    setTimeout(() => {
      this.items.set([
        {
          id: '1',
          name: '專案架構設計文檔.pdf',
          type: 'document',
          size: '2.5 MB',
          updatedAt: new Date(),
          updatedBy: '張三',
          tags: ['架構', '設計']
        },
        {
          id: '2',
          name: 'API 接口規範.docx',
          type: 'document',
          size: '856 KB',
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedBy: '李四',
          tags: ['API', '規範']
        },
        {
          id: '3',
          name: 'UI 設計稿.fig',
          type: 'design',
          size: '15.2 MB',
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedBy: '王五',
          tags: ['UI', 'Figma']
        },
        {
          id: '4',
          name: 'database-schema.sql',
          type: 'code',
          size: '128 KB',
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedBy: '趙六',
          tags: ['資料庫', 'SQL']
        }
      ]);
      this.loading.set(false);
    }, 500);
  }

  onTypeChange(): void {
    this.currentType.set(this.currentTypeValue);
  }

  refresh(): void {
    this.loadItems();
    this.message.info('已重新整理');
  }

  showUploadModal(): void {
    this.uploadModalVisible.set(true);
  }

  handleUploadCancel(): void {
    this.uploadModalVisible.set(false);
  }

  handleUploadOk(): void {
    this.uploading.set(true);

    setTimeout(() => {
      this.message.success('上傳成功');
      this.uploading.set(false);
      this.uploadModalVisible.set(false);
      this.loadItems();
    }, 1000);
  }

  beforeUpload = (): boolean => {
    return false; // Prevent auto upload
  };

  download(item: RepositoryItem): void {
    this.message.info(`下載檔案: ${item.name}`);
  }

  delete(item: RepositoryItem): void {
    this.items.update(items => items.filter(i => i.id !== item.id));
    this.message.success('已刪除檔案');
  }
}
