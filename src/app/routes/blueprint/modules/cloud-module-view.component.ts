/**
 * Cloud Module View Component
 * 雲端域視圖元件
 *
 * Purpose: Display cloud storage with GitHub-like layout
 * Layout: Left tree view, Middle file list, Right version info
 * Created: 2025-12-14
 * Updated: 2025-12-14 - Redesigned to GitHub-like layout
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, ViewChild, ElementRef, signal, HostListener } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CloudStorageService } from '@core/blueprint/modules/implementations/cloud';
import type { CloudFile } from '@core/blueprint/modules/implementations/cloud';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTreeModule, NzTreeNodeOptions } from 'ng-zorro-antd/tree';

/**
 * Cloud Module View Component
 *
 * GitHub-like Layout:
 * - Left: Folder tree navigation
 * - Middle: File list with actions
 * - Right: File details/version info
 *
 * ✅ Follows Angular 20 Standalone Component pattern
 * ✅ Uses Signals for state management
 * ✅ Implements OnPush change detection
 */
@Component({
  selector: 'app-cloud-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzStatisticModule,
    NzEmptyModule,
    NzTreeModule,
    NzDescriptionsModule,
    NzListModule,
    NzTagModule,
    ReactiveFormsModule,
    NzInputModule,
    NzFormModule
  ],
  template: `
    <!-- Storage Statistics Header -->
    <nz-card nzTitle="雲端儲存" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="(stats().storageUsed / 1024 / 1024).toFixed(2)" nzTitle="已用容量 (MB)">
            <ng-template #nzPrefix>
              <span nz-icon nzType="cloud"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="stats().totalFiles" nzTitle="檔案數量">
            <ng-template #nzPrefix>
              <span nz-icon nzType="file"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="stats().usagePercentage.toFixed(1) + '%'" nzTitle="使用率">
            <ng-template #nzPrefix>
              <span nz-icon nzType="pie-chart"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- GitHub-like 3-column Layout -->
    <nz-card>
      <div class="mb-md">
        <button nz-button nzType="primary" (click)="triggerFileUpload()" [nzLoading]="loading()">
          <span nz-icon nzType="upload"></span>
          上傳檔案
        </button>
        <button nz-button (click)="createFolder()" class="ml-sm">
          <span nz-icon nzType="folder-add"></span>
          新增資料夾
        </button>
        <input #fileInput type="file" style="display: none" (change)="onFileSelected($event)" multiple />
      </div>

      <nz-row [nzGutter]="16">
        <!-- Left: Folder Tree with drag-drop upload support -->
        <nz-col [nzSpan]="6">
          <nz-card nzTitle="資料夾">
            @if (treeData().length > 0) {
              <nz-tree [nzData]="treeData()" [nzSelectedKeys]="selectedFolderKeys()" (nzClick)="onFolderSelect($event)">
                <ng-template #nzTreeTemplate let-node let-origin="origin">
                  <span class="tree-node-title">
                    <span nz-icon [nzType]="node.icon" nzTheme="outline"></span>
                    <span class="node-title">{{ node.title }}</span>
                    @if (node.key !== 'root') {
                      <span class="node-actions" (click)="$event.stopPropagation()">
                        <button nz-button nzType="text" nzSize="small" nz-tooltip="重新命名" (click)="renameFolder(node.key)">
                          <span nz-icon nzType="edit" nzTheme="outline"></span>
                        </button>
                      </span>
                    }
                  </span>
                </ng-template>
              </nz-tree>
            } @else {
              <nz-empty nzNotFoundContent="暫無資料夾" [nzNotFoundImage]="'simple'" />
            }
          </nz-card>
        </nz-col>

        <!-- Middle: File List with drag-drop upload -->
        <nz-col [nzSpan]="12">
          <nz-card
            nzTitle="檔案列表"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.drag-over]="isDraggingOver()"
          >
            @if (isDraggingOver()) {
              <div class="drop-zone-overlay">
                <div class="drop-zone-content">
                  <span nz-icon nzType="cloud-upload" style="font-size: 48px;"></span>
                  <p style="margin-top: 16px; font-size: 16px;">拖放檔案到此處上傳</p>
                </div>
              </div>
            }

            @if (loading() && filteredFiles().length === 0) {
              <nz-spin nzSimple nzTip="載入中..." />
            } @else if (filteredFiles().length === 0) {
              <nz-empty nzNotFoundContent="暫無檔案，請上傳第一個檔案" [nzNotFoundImage]="'simple'" />
            } @else {
              <nz-table #fileTable [nzData]="filteredFiles()" [nzSize]="'small'" [nzLoading]="loading()" [nzPageSize]="20">
                <thead>
                  <tr>
                    <th>檔案名稱</th>
                    <th>大小</th>
                    <th>上傳時間</th>
                    <th nzWidth="120px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  @for (file of fileTable.data; track file.id) {
                    <tr [class.selected-row]="selectedFile()?.id === file.id" (click)="selectFile(file)">
                      <td>
                        <span nz-icon [nzType]="getFileIcon(file)" class="mr-sm"></span>
                        {{ file.name }}
                      </td>
                      <td>{{ formatFileSize(file.size) }}</td>
                      <td>{{ file.uploadedAt | date: 'yyyy-MM-dd HH:mm' }}</td>
                      <td>
                        <button
                          nz-button
                          nzType="link"
                          nzSize="small"
                          (click)="downloadFile(file); $event.stopPropagation()"
                          nz-tooltip
                          nzTooltipTitle="下載"
                        >
                          <span nz-icon nzType="download"></span>
                        </button>
                        <button
                          nz-button
                          nzType="link"
                          nzSize="small"
                          nzDanger
                          nz-popconfirm
                          nzPopconfirmTitle="確定要刪除此檔案嗎？"
                          (nzOnConfirm)="deleteFile(file)"
                          (click)="$event.stopPropagation()"
                          nz-tooltip
                          nzTooltipTitle="刪除"
                        >
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </nz-table>
            }
          </nz-card>
        </nz-col>

        <!-- Right: File Details / Version Info -->
        <nz-col [nzSpan]="6">
          <nz-card nzTitle="檔案詳情">
            @if (selectedFile()) {
              <nz-descriptions [nzColumn]="1" [nzSize]="'small'">
                <nz-descriptions-item nzTitle="檔案名稱">
                  {{ selectedFile()!.name }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="大小">
                  {{ formatFileSize(selectedFile()!.size) }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="類型">
                  {{ selectedFile()!.mimeType }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="副檔名"> .{{ selectedFile()!.extension }} </nz-descriptions-item>
                <nz-descriptions-item nzTitle="上傳者">
                  {{ selectedFile()!.uploadedBy }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="上傳時間">
                  {{ selectedFile()!.uploadedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="更新時間">
                  {{ selectedFile()!.updatedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="狀態">
                  <nz-badge
                    [nzStatus]="selectedFile()!.status === 'synced' ? 'success' : 'processing'"
                    [nzText]="selectedFile()!.status === 'synced' ? '已同步' : '處理中'"
                  />
                </nz-descriptions-item>
              </nz-descriptions>

              <nz-divider />

              <div>
                <h4>版本資訊</h4>
                @if (selectedFile()!.version) {
                  <nz-descriptions [nzColumn]="1" [nzSize]="'small'">
                    <nz-descriptions-item nzTitle="目前版本"> v{{ selectedFile()!.version }} </nz-descriptions-item>
                    @if (selectedFile()!.versionHistory && selectedFile()!.versionHistory!.length > 0) {
                      <nz-descriptions-item nzTitle="歷史版本"> {{ selectedFile()!.versionHistory!.length }} 個版本 </nz-descriptions-item>
                    }
                  </nz-descriptions>

                  @if (selectedFile()!.versionHistory && selectedFile()!.versionHistory!.length > 0) {
                    <nz-divider nzText="版本歷史" nzOrientation="left" />
                    <nz-list [nzDataSource]="selectedFile()!.versionHistory!" [nzSize]="'small'">
                      <ng-template nz-list-item let-item>
                        <nz-list-item>
                          <nz-list-item-meta>
                            <nz-list-item-meta-title>
                              <span nz-icon nzType="history" class="mr-sm"></span>
                              版本 {{ item.versionNumber }}
                              @if (item.isCurrent) {
                                <nz-tag nzColor="blue">當前</nz-tag>
                              }
                            </nz-list-item-meta-title>
                            <nz-list-item-meta-description>
                              <div>{{ item.createdAt | date: 'yyyy-MM-dd HH:mm' }}</div>
                              @if (item.comment) {
                                <div>{{ item.comment }}</div>
                              }
                              <div>大小: {{ formatFileSize(item.size) }}</div>
                            </nz-list-item-meta-description>
                          </nz-list-item-meta>
                        </nz-list-item>
                      </ng-template>
                    </nz-list>
                  }
                } @else {
                  <p>目前版本：1.0（尚未啟用版本控制）</p>
                  <p>版本控制功能可追蹤檔案變更歷史</p>
                }
              </div>
            } @else {
              <nz-empty nzNotFoundContent="請選擇檔案查看詳情" [nzNotFoundImage]="'simple'" />
            }
          </nz-card>
        </nz-col>
      </nz-row>
    </nz-card>
  `,
  styles: [
    `
      tr {
        cursor: pointer;
      }

      .selected-row {
        background-color: var(--ant-primary-color-deprecated-bg);
      }

      .drag-over {
        border: 2px dashed var(--ant-primary-color);
        background-color: var(--ant-primary-color-deprecated-bg);
        position: relative;
      }

      .drop-zone-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--ant-primary-color-deprecated-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: 8px;
      }

      .drop-zone-content {
        text-align: center;
        color: var(--ant-primary-color);
      }

      .tree-node-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .node-title {
        margin-left: 8px;
        flex: 1;
      }

      .node-actions {
        opacity: 0;
        transition: opacity 0.3s;
      }

      .tree-node-title:hover .node-actions {
        opacity: 1;
      }
    `
  ]
})
export class CloudModuleViewComponent implements OnInit {
  private readonly cloudService = inject(CloudStorageService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // ViewChild for file input
  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  // ✅ Modern Angular 20 input pattern
  blueprintId = input.required<string>();

  // ✅ Signal-based state from service
  readonly files = this.cloudService.files;
  readonly loading = this.cloudService.loading;
  readonly stats = this.cloudService.stats;

  // Component-specific signals
  selectedFile = signal<CloudFile | null>(null);
  selectedFolderKeys = signal<string[]>(['root']);
  currentFolder = signal<string>('');
  isDraggingOver = signal<boolean>(false);

  // Computed: Tree data for folder navigation
  readonly treeData = signal<NzTreeNodeOptions[]>([
    {
      title: '全部檔案',
      key: 'root',
      icon: 'folder',
      expanded: true,
      children: []
    }
  ]);

  // Computed: Filtered files based on current folder
  readonly filteredFiles = signal<CloudFile[]>([]);

  ngOnInit(): void {
    this.loadData();

    // Show deployment reminder if no files load initially
    setTimeout(() => {
      if (this.files().length === 0 && !this.loading()) {
        console.info('[CloudModuleView] No files loaded. Please ensure Firestore rules are deployed.');
      }
    }, 3000);
  }

  /**
   * Load cloud data
   */
  private async loadData(): Promise<void> {
    const blueprintId = this.blueprintId();

    try {
      await this.cloudService.loadFiles(blueprintId);
      this.updateFilteredFiles();
      this.buildFolderTree();
    } catch (error) {
      this.message.error('載入雲端資料失敗');
      console.error('[CloudModuleView] Load data failed', error);
    }
  }

  /**
   * Update filtered files based on current folder
   */
  private updateFilteredFiles(): void {
    const folder = this.currentFolder();

    if (!folder || folder === 'root') {
      // Show all files if root or no folder selected
      this.filteredFiles.set(this.files());
    } else {
      // Filter files by folder path
      const filtered = this.files().filter(file => {
        // Extract folder from file path (e.g., "folder1/file.txt" => "folder1")
        const filePath = file.path || '';
        const folderPath = filePath.substring(0, filePath.lastIndexOf('/') || 0);
        return folderPath === folder || filePath.startsWith(`${folder}/`);
      });
      this.filteredFiles.set(filtered);
    }
  }

  /**
   * Build folder tree from files (including file nodes)
   */
  private buildFolderTree(): void {
    const folders = new Set<string>();

    // Extract unique folder paths from files
    this.files().forEach(file => {
      const path = file.path || '';
      if (path.includes('/')) {
        const parts = path.split('/');
        parts.pop(); // Remove filename

        // Add all parent folders
        let currentPath = '';
        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          folders.add(currentPath);
        });
      }
    });

    // Build tree structure
    const folderArray = Array.from(folders).sort();
    const treeMap = new Map<string, NzTreeNodeOptions>();

    // Create root node
    const rootNode: NzTreeNodeOptions = {
      title: `全部檔案 (${this.files().length})`,
      key: 'root',
      icon: 'folder',
      expanded: true,
      children: [],
      isLeaf: false
    };

    treeMap.set('root', rootNode);

    // Create folder nodes
    folderArray.forEach(folderPath => {
      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';

      // Count files in this folder (direct children only)
      const fileCount = this.files().filter(f => {
        const filePath = f.path || '';
        const fileFolder = filePath.substring(0, filePath.lastIndexOf('/')) || '';
        return fileFolder === folderPath;
      }).length;

      const node: NzTreeNodeOptions = {
        title: `${folderName} (${fileCount})`,
        key: folderPath,
        icon: 'folder',
        expanded: false,
        children: [],
        isLeaf: false
      };

      treeMap.set(folderPath, node);

      // Add to parent
      const parent = treeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      }
    });

    // Add file nodes to their parent folders
    this.files().forEach(file => {
      const path = file.path || '';
      let parentPath: string;

      if (path.includes('/')) {
        // File is in a folder
        parentPath = path.substring(0, path.lastIndexOf('/'));
      } else {
        // File is in root
        parentPath = 'root';
      }

      const fileNode: NzTreeNodeOptions = {
        title: file.name,
        key: `file_${file.id}`,
        icon: this.getFileIconForTree(file),
        isLeaf: true,
        selectable: true
      };

      const parent = treeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileNode);
      }
    });

    this.treeData.set([rootNode]);
  }

  /**
   * Get file icon for tree node
   */
  private getFileIconForTree(file: CloudFile): string {
    const ext = file.extension?.toLowerCase() || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return 'file-image';
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
      return 'video-camera';
    }

    // Documents
    if (ext === 'pdf') {
      return 'file-pdf';
    }
    if (['doc', 'docx'].includes(ext)) {
      return 'file-word';
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return 'file-excel';
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return 'file-ppt';
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'file-zip';
    }

    // Text files
    if (['txt', 'md', 'csv'].includes(ext)) {
      return 'file-text';
    }

    // Default
    return 'file';
  }

  /**
   * Create new folder
   */
  createFolder(): void {
    const folderNameControl = new FormControl('', [Validators.required]);

    const modalRef = this.modal.create({
      nzTitle: '新增資料夾',
      nzContent: FolderNameInputComponent,
      nzData: {
        folderNameControl,
        label: '資料夾名稱'
      },
      nzOnOk: () => {
        const folderName = folderNameControl.value?.trim();

        if (!folderName) {
          this.message.warning('請輸入資料夾名稱');
          return false;
        }

        // Validate folder name
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/.test(folderName)) {
          this.message.warning('資料夾名稱只能包含中英文、數字、底線和連字號');
          return false;
        }

        this.addFolder(folderName);
        return true;
      }
    });
  }

  /**
   * Add folder to tree
   */
  private addFolder(folderName: string): void {
    const currentFolder = this.currentFolder();
    const newFolderPath = currentFolder && currentFolder !== 'root' ? `${currentFolder}/${folderName}` : folderName;

    // Check if folder already exists
    const existingFolders = new Set<string>();
    this.files().forEach(file => {
      const path = file.path || '';
      if (path.includes('/')) {
        const parts = path.split('/');
        parts.pop();
        parts.forEach((part, index) => {
          const folderPath = parts.slice(0, index + 1).join('/');
          existingFolders.add(folderPath);
        });
      }
    });

    if (existingFolders.has(newFolderPath)) {
      this.message.warning('資料夾已存在');
      return;
    }

    // Add folder to tree
    const tree = this.treeData();
    const parentKey = currentFolder && currentFolder !== 'root' ? currentFolder : 'root';

    const addFolderToNode = (nodes: NzTreeNodeOptions[]): boolean => {
      for (const node of nodes) {
        if (node.key === parentKey) {
          if (!node.children) {
            node.children = [];
          }
          node.children.push({
            title: `${folderName} (0)`,
            key: newFolderPath,
            icon: 'folder',
            expanded: false,
            children: [],
            isLeaf: false
          });
          return true;
        }
        if (node.children && addFolderToNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    if (addFolderToNode(tree)) {
      this.treeData.set([...tree]);
      this.message.success(`資料夾 ${folderName} 已建立`);
      this.selectedFolderKeys.set([newFolderPath]);
      this.currentFolder.set(newFolderPath);
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
  }

  /**
   * Handle drop event
   */
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    await this.handleFileUpload(Array.from(files));
  }

  /**
   * Handle file upload (shared logic for button and drag-drop)
   */
  private async handleFileUpload(files: File[]): Promise<void> {
    const blueprintId = this.blueprintId();
    const currentFolder = this.currentFolder();

    for (const file of files) {
      try {
        // Determine file path based on current folder
        const folderPath = currentFolder && currentFolder !== 'root' ? currentFolder : '';
        const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

        await this.cloudService.uploadFile(blueprintId, {
          file,
          metadata: {
            originalName: file.name,
            description: `Uploaded from blueprint ${blueprintId}${folderPath ? ` to folder ${folderPath}` : ''}`
          },
          isPublic: false,
          path: filePath
        });

        this.message.success(`檔案 ${file.name} 上傳成功`);
      } catch (error) {
        console.error('[CloudModuleView] Upload failed for file:', file.name, error);

        const errorMsg = error instanceof Error ? error.message : '未知錯誤';
        this.message.error(`檔案 ${file.name} 上傳失敗: ${errorMsg}`);

        if (errorMsg.includes('permission') || errorMsg.includes('PERMISSION_DENIED')) {
          this.message.warning('請檢查 Firestore 安全規則是否已正確部署', { nzDuration: 5000 });
        }
      }
    }

    // Reload file list
    try {
      await this.cloudService.loadFiles(blueprintId);
      this.updateFilteredFiles();
      this.buildFolderTree();
    } catch (error) {
      console.error('[CloudModuleView] Failed to reload files', error);

      const errorMsg = error instanceof Error ? error.message : '未知錯誤';
      this.message.error(`載入檔案列表失敗: ${errorMsg}`);

      if (errorMsg.includes('permission') || errorMsg.includes('PERMISSION_DENIED')) {
        this.message.warning('請確認 Firestore 規則已部署：firebase deploy --only firestore:rules', { nzDuration: 8000 });
      }
    }
  }

  /**
   * Trigger file input click
   */
  triggerFileUpload(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handle file selection and upload
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    await this.handleFileUpload(Array.from(input.files));

    // Clear input
    input.value = '';
  }

  /**
   * Download file
   */
  async downloadFile(file: CloudFile): Promise<void> {
    try {
      const blueprintId = this.blueprintId();
      const blob = await this.cloudService.downloadFile(blueprintId, { fileId: file.id });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.message.success(`檔案 ${file.name} 下載成功`);
    } catch (error) {
      this.message.error('下載失敗');
      console.error('[CloudModuleView] Download failed', error);
    }
  }

  /**
   * Rename folder
   */
  renameFolder(folderPath: string): void {
    const folderParts = folderPath.split('/');
    const oldFolderName = folderParts[folderParts.length - 1];

    const folderNameControl = new FormControl(oldFolderName, [Validators.required]);

    const modalRef = this.modal.create({
      nzTitle: '重新命名資料夾',
      nzContent: FolderNameInputComponent,
      nzData: {
        folderNameControl,
        label: '新資料夾名稱'
      },
      nzOnOk: async () => {
        const newFolderName = folderNameControl.value?.trim();

        if (!newFolderName || newFolderName === oldFolderName) {
          return true;
        }

        // Validate folder name
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/.test(newFolderName)) {
          this.message.warning('資料夾名稱只能包含中英文、數字、底線和連字號');
          return false;
        }

        // Build new path
        const parentPath = folderParts.slice(0, -1).join('/');
        const newFolderPath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName;

        // Check if new name already exists
        const existingFolders = new Set<string>();
        this.files().forEach(file => {
          const path = file.path || '';
          if (path.includes('/')) {
            const parts = path.split('/');
            parts.pop();
            parts.forEach((part, index) => {
              const folderPath = parts.slice(0, index + 1).join('/');
              existingFolders.add(folderPath);
            });
          }
        });

        if (existingFolders.has(newFolderPath)) {
          this.message.warning('該資料夾名稱已存在');
          return false;
        }

        // Update all files in this folder
        await this.updateFilePaths(folderPath, newFolderPath);

        this.message.success(`資料夾已重新命名為 ${newFolderName}`);

        // Update current folder if it was the renamed one
        if (this.currentFolder() === folderPath) {
          this.currentFolder.set(newFolderPath);
          this.selectedFolderKeys.set([newFolderPath]);
        }

        // Rebuild folder tree
        this.buildFolderTree();
        this.updateFilteredFiles();

        return true;
      }
    });
  }

  /**
   * Update file paths when renaming folder
   */
  private async updateFilePaths(oldFolderPath: string, newFolderPath: string): Promise<void> {
    const blueprintId = this.blueprintId();
    const filesToUpdate = this.files().filter(file => {
      const filePath = file.path || '';
      return filePath.startsWith(`${oldFolderPath}/`) || filePath === oldFolderPath;
    });

    for (const file of filesToUpdate) {
      const oldPath = file.path || '';
      const newPath = oldPath.replace(oldFolderPath, newFolderPath);

      // Update file path in Firestore
      try {
        await this.cloudService.updateFilePath(blueprintId, file.id, newPath);
      } catch (error) {
        console.error('[CloudModuleView] Failed to update file path', error);
      }
    }

    // Reload files
    await this.cloudService.loadFiles(blueprintId);
  }

  /**
   * Delete file
   */
  async deleteFile(file: CloudFile): Promise<void> {
    try {
      const blueprintId = this.blueprintId();
      await this.cloudService.deleteFile(blueprintId, file.id);

      this.message.success(`檔案 ${file.name} 已刪除`);

      // If deleted file was selected, clear selection
      if (this.selectedFile()?.id === file.id) {
        this.selectedFile.set(null);
      }

      // Reload file list
      await this.cloudService.loadFiles(blueprintId);
      this.updateFilteredFiles();
      this.buildFolderTree();
    } catch (error) {
      this.message.error('刪除失敗');
      console.error('[CloudModuleView] Delete failed', error);
    }
  }

  /**
   * Select file to show details
   */
  selectFile(file: CloudFile): void {
    this.selectedFile.set(file);
  }

  /**
   * Handle folder/file selection in tree
   */
  onFolderSelect(event: any): void {
    const key = event.node?.key;
    if (key) {
      // Check if it's a file node (starts with "file_")
      if (key.startsWith('file_')) {
        const fileId = key.replace('file_', '');
        const file = this.files().find(f => f.id === fileId);
        if (file) {
          this.selectFile(file);
        }
      } else {
        // It's a folder node
        this.selectedFolderKeys.set([key]);
        this.currentFolder.set(key === 'root' ? '' : key);
        this.updateFilteredFiles();

        // Log for debugging
        console.log('[CloudModuleView] Folder selected:', key);
        console.log('[CloudModuleView] Filtered files count:', this.filteredFiles().length);
      }
    }
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(file: CloudFile): string {
    const mimeType = file.mimeType.toLowerCase();

    if (mimeType.startsWith('image/')) return 'file-image';
    if (mimeType.startsWith('video/')) return 'video-camera';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-ppt';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'file-zip';
    if (mimeType.includes('text')) return 'file-text';

    return 'file';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

/**
 * Folder Name Input Component
 * Standalone component for folder name input in modal
 */
@Component({
  selector: 'app-folder-name-input',
  standalone: true,
  imports: [ReactiveFormsModule, NzInputModule, NzFormModule, SHARED_IMPORTS],
  template: `
    <nz-form-item>
      <nz-form-label>{{ label }}</nz-form-label>
      <nz-form-control>
        <input nz-input [formControl]="folderNameControl" placeholder="請輸入資料夾名稱" autofocus />
      </nz-form-control>
    </nz-form-item>
  `,
  styles: [
    `
      nz-form-item {
        margin-bottom: 0;
      }
    `
  ]
})
export class FolderNameInputComponent {
  folderNameControl!: FormControl;
  label = '資料夾名稱';
}
