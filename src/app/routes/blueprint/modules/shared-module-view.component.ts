/**
 * Shared Module View Component
 * 共享域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 功能：
 * - 共享資源統計摘要
 * - 共享文件管理
 * - 共享資源庫
 * - 共享模板管理
 * - 跨藍圖資源連結
 *
 * @module SharedModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzUploadModule } from 'ng-zorro-antd/upload';

/** 共享文件介面 */
interface SharedDocument {
  id: string;
  name: string;
  type: 'document' | 'image' | 'spreadsheet' | 'pdf' | 'other';
  size: number;
  sharedBy: string;
  sharedWith: string[];
  permissions: 'view' | 'edit' | 'admin';
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 共享資源介面 */
interface SharedResource {
  id: string;
  name: string;
  category: string;
  description?: string;
  type: 'material' | 'equipment' | 'template' | 'specification';
  linkedBlueprints: number;
  status: 'available' | 'in_use' | 'reserved';
  createdAt: Date;
}

/** 共享模板介面 */
interface SharedTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  version: string;
  usageCount: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
}

/** 藍圖連結介面 */
interface BlueprintLink {
  id: string;
  linkedBlueprintId: string;
  linkedBlueprintName: string;
  linkType: 'reference' | 'dependency' | 'clone';
  sharedItems: number;
  createdAt: Date;
}

@Component({
  selector: 'app-shared-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule, NzProgressModule, NzUploadModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="共享資源統計" [nzExtra]="statsExtra" class="mb-md">
      <ng-template #statsExtra>
        <button nz-button nzType="link" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </ng-template>

      @if (loading()) {
        <div style="text-align: center; padding: 24px;">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <nz-row [nzGutter]="[16, 16]">
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 0">
              <nz-statistic [nzValue]="documents().length" nzTitle="共享文件" [nzPrefix]="docIcon" />
              <ng-template #docIcon>
                <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
              </ng-template>
              <div class="stat-detail">
                <span>{{ totalDocumentSize() }}</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 1">
              <nz-statistic [nzValue]="resources().length" nzTitle="共享資源" [nzPrefix]="resourceIcon" />
              <ng-template #resourceIcon>
                <span nz-icon nzType="database" style="color: #52c41a;"></span>
              </ng-template>
              <div class="stat-detail">
                <span class="success">{{ availableResourceCount() }} 可用</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 2">
              <nz-statistic [nzValue]="templates().length" nzTitle="共享模板" [nzPrefix]="templateIcon" />
              <ng-template #templateIcon>
                <span nz-icon nzType="container" style="color: #722ed1;"></span>
              </ng-template>
              <div class="stat-detail">
                <span>{{ totalTemplateUsage() }} 次使用</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 3">
              <nz-statistic [nzValue]="blueprintLinks().length" nzTitle="藍圖連結" [nzPrefix]="linkIcon" />
              <ng-template #linkIcon>
                <span nz-icon nzType="link" style="color: #eb2f96;"></span>
              </ng-template>
              <div class="stat-detail">
                <span>跨藍圖資源共享</span>
              </div>
            </nz-card>
          </nz-col>
        </nz-row>
      }
    </nz-card>

    <!-- Storage Usage -->
    <nz-card nzTitle="儲存空間使用" class="mb-md">
      <nz-row [nzGutter]="24" nzAlign="middle">
        <nz-col [nzXs]="24" [nzMd]="16">
          <div class="storage-info">
            <span>已使用：{{ usedStorage() }} / {{ totalStorage() }}</span>
            <nz-progress
              [nzPercent]="storagePercentage()"
              [nzStatus]="storagePercentage() > 80 ? 'exception' : 'active'"
              [nzStrokeColor]="storagePercentage() > 80 ? '#ff4d4f' : '#1890ff'"
            ></nz-progress>
          </div>
        </nz-col>
        <nz-col [nzXs]="24" [nzMd]="8" style="text-align: right;">
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" (click)="uploadFile()">
              <span nz-icon nzType="upload"></span>
              上傳檔案
            </button>
            <button *nzSpaceItem nz-button (click)="manageStorage()">
              <span nz-icon nzType="setting"></span>
              管理空間
            </button>
          </nz-space>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Shared Content Tabs -->
    <nz-card>
      <nz-tabset [(nzSelectedIndex)]="activeTabIndex">
        <!-- 共享文件 Tab -->
        <nz-tab nzTitle="共享文件">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" [nzMessage]="docAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #docAlertMsg> 共 {{ documents().length }} 個共享文件，總計 {{ totalDocumentSize() }} </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="uploadFile()">
                    <span nz-icon nzType="upload"></span>
                    上傳文件
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (documents().length === 0) {
              <nz-empty nzNotFoundContent="暫無共享文件">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="uploadFile()">
                    <span nz-icon nzType="upload"></span>
                    上傳第一個文件
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <st [data]="documents()" [columns]="documentColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>

        <!-- 共享資源 Tab -->
        <nz-tab nzTitle="共享資源">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="success" [nzMessage]="resourceAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #resourceAlertMsg>
                    共 {{ resources().length }} 個共享資源，{{ availableResourceCount() }} 個可用
                  </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createResource()">
                    <span nz-icon nzType="plus"></span>
                    新增資源
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (resources().length === 0) {
              <nz-empty nzNotFoundContent="暫無共享資源">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createResource()">
                    <span nz-icon nzType="plus"></span>
                    建立第一個資源
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <nz-row [nzGutter]="[16, 16]">
                @for (resource of resources(); track resource.id) {
                  <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card nzSize="small" [nzHoverable]="true" (click)="viewResource(resource)">
                      <div class="resource-card">
                        <div class="resource-header">
                          <span
                            nz-icon
                            [nzType]="getResourceIcon(resource.type)"
                            [ngStyle]="{ 'font-size': '24px', color: getResourceColor(resource.type) }"
                          ></span>
                          <nz-tag [nzColor]="getResourceStatusColor(resource.status)">
                            {{ getResourceStatusText(resource.status) }}
                          </nz-tag>
                        </div>
                        <h4>{{ resource.name }}</h4>
                        <p class="text-grey">{{ resource.description || resource.category }}</p>
                        <div class="resource-footer">
                          <span>
                            <span nz-icon nzType="link"></span>
                            連結 {{ resource.linkedBlueprints }} 個藍圖
                          </span>
                        </div>
                      </div>
                    </nz-card>
                  </nz-col>
                }
              </nz-row>
            }
          </ng-template>
        </nz-tab>

        <!-- 共享模板 Tab -->
        <nz-tab nzTitle="共享模板">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" [nzMessage]="templateAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #templateAlertMsg> 共 {{ templates().length }} 個共享模板可供使用 </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createTemplate()">
                    <span nz-icon nzType="plus"></span>
                    建立模板
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (templates().length === 0) {
              <nz-empty nzNotFoundContent="暫無共享模板">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createTemplate()">
                    <span nz-icon nzType="plus"></span>
                    建立第一個模板
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <nz-row [nzGutter]="[16, 16]">
                @for (template of templates(); track template.id) {
                  <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
                    <nz-card nzSize="small" [nzHoverable]="true" (click)="useTemplate(template)">
                      <div class="template-card">
                        <div class="template-header">
                          <span nz-icon nzType="file-text" style="font-size: 28px; color: #722ed1;"></span>
                        </div>
                        <h4>{{ template.name }}</h4>
                        <nz-tag>{{ template.category }}</nz-tag>
                        <p class="text-grey">{{ template.description || '無描述' }}</p>
                        <div class="template-meta">
                          <span>
                            <span nz-icon nzType="star" nzTheme="fill" style="color: #faad14;"></span>
                            {{ template.rating.toFixed(1) }}
                          </span>
                          <span>v{{ template.version }}</span>
                          <span>{{ template.usageCount }} 次使用</span>
                        </div>
                        <div class="template-footer">
                          <span class="text-grey">{{ template.createdBy }} 建立</span>
                        </div>
                      </div>
                    </nz-card>
                  </nz-col>
                }
              </nz-row>
            }
          </ng-template>
        </nz-tab>

        <!-- 藍圖連結 Tab -->
        <nz-tab nzTitle="藍圖連結">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" nzMessage="管理與其他藍圖的資源連結關係" nzShowIcon></nz-alert>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createLink()">
                    <span nz-icon nzType="link"></span>
                    建立連結
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (blueprintLinks().length === 0) {
              <nz-empty nzNotFoundContent="暫無藍圖連結">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createLink()">
                    <span nz-icon nzType="link"></span>
                    連結第一個藍圖
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <st [data]="blueprintLinks()" [columns]="linkColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stat-detail {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
      }

      .stat-detail .success {
        color: #52c41a;
      }

      .storage-info {
        padding: 8px 0;
      }

      .storage-info span {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
      }

      .tab-header {
        padding: 8px 0;
      }

      .resource-card,
      .template-card {
        text-align: center;
      }

      .resource-header,
      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .template-header {
        justify-content: center;
      }

      .resource-card h4,
      .template-card h4 {
        margin: 8px 0;
      }

      .resource-card p,
      .template-card p {
        font-size: 12px;
        margin-bottom: 8px;
        height: 36px;
        overflow: hidden;
      }

      .resource-footer,
      .template-footer {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
      }

      .template-meta {
        display: flex;
        justify-content: center;
        gap: 12px;
        font-size: 12px;
        color: #666;
        margin-top: 8px;
      }

      .text-grey {
        color: #999;
      }

      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class SharedModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // 狀態
  loading = signal(false);
  activeTabIndex = 0;

  // 資料
  documents = signal<SharedDocument[]>([]);
  resources = signal<SharedResource[]>([]);
  templates = signal<SharedTemplate[]>([]);
  blueprintLinks = signal<BlueprintLink[]>([]);

  // 儲存空間
  private usedStorageBytes = signal(0);
  private totalStorageBytes = signal(5 * 1024 * 1024 * 1024); // 5GB

  // 計算屬性
  totalDocumentSize = computed(() => this.formatFileSize(this.documents().reduce((sum, d) => sum + d.size, 0)));

  availableResourceCount = computed(() => this.resources().filter(r => r.status === 'available').length);

  totalTemplateUsage = computed(() => this.templates().reduce((sum, t) => sum + t.usageCount, 0));

  usedStorage = computed(() => this.formatFileSize(this.usedStorageBytes()));

  totalStorage = computed(() => this.formatFileSize(this.totalStorageBytes()));

  storagePercentage = computed(() => Math.round((this.usedStorageBytes() / this.totalStorageBytes()) * 100));

  // 文件欄位
  documentColumns: STColumn[] = [
    {
      title: '',
      index: 'type',
      width: 50,
      format: (item: SharedDocument) => this.getFileTypeIcon(item.type)
    },
    { title: '檔案名稱', index: 'name', width: 200 },
    {
      title: '大小',
      index: 'size',
      width: 100,
      format: (item: SharedDocument) => this.formatFileSize(item.size)
    },
    { title: '分享者', index: 'sharedBy', width: 100 },
    {
      title: '權限',
      index: 'permissions',
      width: 80,
      type: 'badge',
      badge: {
        view: { text: '檢視', color: 'default' },
        edit: { text: '編輯', color: 'processing' },
        admin: { text: '管理', color: 'success' }
      }
    },
    { title: '下載次數', index: 'downloadCount', type: 'number', width: 100 },
    { title: '更新時間', index: 'updatedAt', type: 'date', dateFormat: 'MM-dd HH:mm', width: 120 },
    {
      title: '操作',
      width: 180,
      buttons: [
        { text: '下載', click: (record: SharedDocument) => this.downloadDocument(record) },
        { text: '分享', click: (record: SharedDocument) => this.shareDocument(record) },
        { text: '刪除', click: (record: SharedDocument) => this.deleteDocument(record) }
      ]
    }
  ];

  // 連結欄位
  linkColumns: STColumn[] = [
    { title: '連結藍圖', index: 'linkedBlueprintName', width: 200 },
    {
      title: '連結類型',
      index: 'linkType',
      width: 100,
      type: 'badge',
      badge: {
        reference: { text: '參照', color: 'processing' },
        dependency: { text: '依賴', color: 'warning' },
        clone: { text: '複製', color: 'success' }
      }
    },
    { title: '共享項目數', index: 'sharedItems', type: 'number', width: 100 },
    { title: '建立時間', index: 'createdAt', type: 'date', dateFormat: 'yyyy-MM-dd', width: 120 },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (record: BlueprintLink) => this.viewLink(record) },
        { text: '解除', click: (record: BlueprintLink) => this.removeLink(record) }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  /** 載入所有資料 */
  private loadAllData(): void {
    this.loading.set(true);

    // 載入模擬資料
    this.loadMockData();
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    setTimeout(() => {
      const now = new Date();

      // 共享文件
      this.documents.set([
        {
          id: '1',
          name: '專案規格書 v2.0.pdf',
          type: 'pdf',
          size: 2.5 * 1024 * 1024,
          sharedBy: '王經理',
          sharedWith: ['設計團隊', '工程團隊'],
          permissions: 'view',
          downloadCount: 45,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '施工進度表.xlsx',
          type: 'spreadsheet',
          size: 156 * 1024,
          sharedBy: '李工程師',
          sharedWith: ['全體成員'],
          permissions: 'edit',
          downloadCount: 89,
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '設計圖 A01.dwg',
          type: 'document',
          size: 8.7 * 1024 * 1024,
          sharedBy: '陳設計師',
          sharedWith: ['設計團隊'],
          permissions: 'admin',
          downloadCount: 23,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: '工地照片集.zip',
          type: 'other',
          size: 125 * 1024 * 1024,
          sharedBy: '張監工',
          sharedWith: ['管理團隊'],
          permissions: 'view',
          downloadCount: 12,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 共享資源
      this.resources.set([
        {
          id: '1',
          name: '鋼筋規格表',
          category: '材料規格',
          description: '標準鋼筋規格與用量計算表',
          type: 'specification',
          linkedBlueprints: 5,
          status: 'available',
          createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '混凝土配比標準',
          category: '材料規格',
          description: '各強度等級混凝土配比',
          type: 'specification',
          linkedBlueprints: 8,
          status: 'available',
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '塔吊設備',
          category: '設備',
          description: '25噸塔式起重機',
          type: 'equipment',
          linkedBlueprints: 2,
          status: 'in_use',
          createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: '施工日報模板',
          category: '表單',
          description: '標準施工日報表單模板',
          type: 'template',
          linkedBlueprints: 12,
          status: 'available',
          createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 共享模板
      this.templates.set([
        {
          id: '1',
          name: '工程日報模板',
          category: '日報',
          description: '標準工程日報格式，含天氣、人力、進度等欄位',
          version: '2.1',
          usageCount: 156,
          rating: 4.8,
          createdBy: '系統管理員',
          createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '品質檢查表',
          category: '品質',
          description: '混凝土澆置前品質檢查清單',
          version: '1.5',
          usageCount: 89,
          rating: 4.5,
          createdBy: '品管部',
          createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '安全巡檢表',
          category: '安全',
          description: '每日安全巡檢標準表單',
          version: '3.0',
          usageCount: 234,
          rating: 4.9,
          createdBy: '安全部',
          createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: '請款單模板',
          category: '財務',
          description: '標準工程請款單格式',
          version: '1.2',
          usageCount: 67,
          rating: 4.2,
          createdBy: '財務部',
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 藍圖連結
      this.blueprintLinks.set([
        {
          id: '1',
          linkedBlueprintId: 'bp-001',
          linkedBlueprintName: '台北大樓新建工程',
          linkType: 'reference',
          sharedItems: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          linkedBlueprintId: 'bp-002',
          linkedBlueprintName: '高雄廠房擴建',
          linkType: 'dependency',
          sharedItems: 5,
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          linkedBlueprintId: 'bp-003',
          linkedBlueprintName: '桃園物流中心',
          linkType: 'clone',
          sharedItems: 8,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 儲存空間
      const totalSize = this.documents().reduce((sum, d) => sum + d.size, 0);
      this.usedStorageBytes.set(totalSize + 500 * 1024 * 1024); // 加上其他使用空間

      this.loading.set(false);
    }, 500);
  }

  /** 重新整理資料 */
  refreshData(): void {
    this.loadAllData();
    this.message.success('資料已重新整理');
  }

  /** 格式化檔案大小 */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /** 取得檔案類型圖示 */
  getFileTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      document: '📄',
      image: '🖼️',
      spreadsheet: '📊',
      pdf: '📕',
      other: '📁'
    };
    return iconMap[type] || '📁';
  }

  /** 上傳檔案 */
  uploadFile(): void {
    this.message.info('上傳檔案功能開發中');
  }

  /** 管理儲存空間 */
  manageStorage(): void {
    this.message.info('管理儲存空間功能開發中');
  }

  /** 下載文件 */
  downloadDocument(doc: SharedDocument): void {
    this.message.success(`開始下載：${doc.name}`);
  }

  /** 分享文件 */
  shareDocument(doc: SharedDocument): void {
    this.message.info(`分享「${doc.name}」功能開發中`);
  }

  /** 刪除文件 */
  deleteDocument(doc: SharedDocument): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除「${doc.name}」嗎？此操作無法復原。`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.documents.update(list => list.filter(d => d.id !== doc.id));
        this.message.success('已刪除文件');
      }
    });
  }

  /** 新增資源 */
  createResource(): void {
    this.message.info('新增資源功能開發中');
  }

  /** 查看資源 */
  viewResource(resource: SharedResource): void {
    this.modal.info({
      nzTitle: resource.name,
      nzContent: `
        <p><strong>類別：</strong>${resource.category}</p>
        <p><strong>類型：</strong>${this.getResourceTypeName(resource.type)}</p>
        <p><strong>狀態：</strong>${this.getResourceStatusText(resource.status)}</p>
        <p><strong>連結藍圖數：</strong>${resource.linkedBlueprints} 個</p>
        <p><strong>描述：</strong>${resource.description || '無'}</p>
      `
    });
  }

  /** 取得資源圖示 */
  getResourceIcon(type: string): string {
    const iconMap: Record<string, string> = {
      material: 'inbox',
      equipment: 'tool',
      template: 'file-text',
      specification: 'profile'
    };
    return iconMap[type] || 'question';
  }

  /** 取得資源顏色 */
  getResourceColor(type: string): string {
    const colorMap: Record<string, string> = {
      material: '#52c41a',
      equipment: '#1890ff',
      template: '#722ed1',
      specification: '#faad14'
    };
    return colorMap[type] || '#666';
  }

  /** 取得資源類型名稱 */
  getResourceTypeName(type: string): string {
    const nameMap: Record<string, string> = {
      material: '材料',
      equipment: '設備',
      template: '模板',
      specification: '規格'
    };
    return nameMap[type] || type;
  }

  /** 取得資源狀態顏色 */
  getResourceStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      available: 'success',
      in_use: 'processing',
      reserved: 'warning'
    };
    return colorMap[status] || 'default';
  }

  /** 取得資源狀態文字 */
  getResourceStatusText(status: string): string {
    const textMap: Record<string, string> = {
      available: '可用',
      in_use: '使用中',
      reserved: '已預約'
    };
    return textMap[status] || status;
  }

  /** 建立模板 */
  createTemplate(): void {
    this.message.info('建立模板功能開發中');
  }

  /** 使用模板 */
  useTemplate(template: SharedTemplate): void {
    this.modal.confirm({
      nzTitle: '使用模板',
      nzContent: `確定要使用「${template.name}」模板嗎？`,
      nzOnOk: () => this.message.success(`已套用模板「${template.name}」`)
    });
  }

  /** 建立連結 */
  createLink(): void {
    this.message.info('建立藍圖連結功能開發中');
  }

  /** 查看連結 */
  viewLink(link: BlueprintLink): void {
    this.message.info(`查看連結藍圖「${link.linkedBlueprintName}」`);
  }

  /** 解除連結 */
  removeLink(link: BlueprintLink): void {
    this.modal.confirm({
      nzTitle: '確認解除連結',
      nzContent: `確定要解除與「${link.linkedBlueprintName}」的連結嗎？共享的 ${link.sharedItems} 個項目將不再同步。`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.blueprintLinks.update(list => list.filter(l => l.id !== link.id));
        this.message.success('已解除連結');
      }
    });
  }
}
