# 問題模組設計概覽 (Issues Module Design Overview)

> **版本**: v1.0.0  
> **最後更新**: 2025-12-22  
> **維護者**: GigHub 開發團隊

## 目錄

1. [核心設計概念](#核心設計概念)
2. [模組架構](#模組架構)
3. [核心功能](#核心功能)
4. [技術棧與實作](#技術棧與實作)
5. [資料模型](#資料模型)
6. [安全與權限](#安全與權限)
7. [跨模組協作](#跨模組協作)
8. [狀態管理與事件](#狀態管理與事件)
9. [使用者介面流程](#使用者介面流程)
10. [擴展性與維護](#擴展性與維護)

---

## 核心設計概念

### 問題核心實體 (Domain Core / Issue Core)

問題模組的核心實體，提供跨模組協作的問題追蹤與管理機制。問題單是各業務模組（任務、品質、財務、合約）發現問題時統一的記錄與處理流程。

### 設計原則

#### 1. **跨模組協作中心 (Cross-Module Collaboration Hub)**
- 問題可由任何模組創建（tasks、qa、finance、contract）
- 問題解決流程統一管理
- 問題狀態可追蹤與回報至來源模組

#### 2. **單一資料來源 (Single Source of Truth)**
- 問題資料統一管理於 Firestore
- 所有問題操作必須透過 Repository 層
- 避免資料散佈或重複

#### 3. **業務邏輯集中**
- 驗證規則集中於 Service/Facade 層
- 狀態變更邏輯統一管理
- 權限控制與授權檢查集中處理

#### 4. **解耦 UI 與業務邏輯**
- UI 元件僅負責展示與使用者互動
- 核心模型處理業務邏輯與資料轉換
- 透過 Signals 進行響應式狀態管理

#### 5. **模組化與可擴展性**
- 遵循 Angular 20 Standalone 架構
- 功能模組化，易於擴展新功能
- 保持清晰的模組邊界與公開 API

---

## 模組架構

### 三層架構 (Three-Layer Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer (UI)                 │
│  issue-list, issue-detail, issue-edit,                  │
│  issue-create, issue-board                              │
│  - 展示邏輯 (Display Logic)                              │
│  - 使用者互動 (User Interaction)                         │
│  - Signals for state (signal(), computed())              │
└─────────────────────────────────────────────────────────┘
                         ↓ inject()
┌─────────────────────────────────────────────────────────┐
│               Business Layer (Service/Facade)            │
│  IssueFacade, IssueService                              │
│  - 業務邏輯協調 (Business Logic Coordination)            │
│  - 狀態管理 (State Management with Signals)             │
│  - 事件發布訂閱 (BlueprintEventBus)                      │
│  - 跨模組整合 (Cross-Module Integration)                │
│  - 權限驗證 (Permission Checks)                          │
└─────────────────────────────────────────────────────────┘
                         ↓ inject()
┌─────────────────────────────────────────────────────────┐
│                  Data Layer (Repository)                 │
│  IssueRepository                                         │
│  - 資料存取抽象 (Data Access Abstraction)                │
│  - Firestore 操作封裝                                     │
│  - CRUD 操作 (Create, Read, Update, Delete)             │
│  - 欄位轉換 (snake_case ↔ camelCase)                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Firebase/Firestore + Storage                │
│  - Database (Firestore)                                  │
│  - File Storage (Cloud Storage)                          │
│  - Security Rules                                        │
└─────────────────────────────────────────────────────────┘
```

### 目錄結構

```
issues/
├─ design.md                          # 本文件
├─ README.md                          # 模組使用說明
├─ IMPLEMENTATION_GUIDE.md            # 實作指南
├─ routes.ts                          # 路由配置
├─ index.ts                           # 公開 API
├─ issues-shell.component.ts          # Shell 協調層
│
├─ components/                        # UI 元件
│   ├─ issue-list.component.ts        # 問題列表頁
│   ├─ issue-detail.component.ts      # 問題詳情頁
│   ├─ issue-edit.component.ts        # 問題編輯頁
│   ├─ issue-create.component.ts      # 問題建立表單
│   └─ issue-board.component.ts       # 問題看板（看板視圖）
│
├─ ui/                                # 展示型元件
│   ├─ issue-card.component.ts
│   ├─ issue-status-badge.component.ts
│   ├─ issue-priority-icon.component.ts
│   └─ issue-timeline.component.ts
│
├─ services/                          # 業務邏輯層
│   ├─ issue.facade.ts                # Facade Pattern (主要 API)
│   └─ issue.service.ts               # 業務邏輯服務
│
├─ data-access/                       # 資料存取層
│   ├─ repositories/
│   │   └─ issue.repository.ts        # Firestore Repository
│   └─ models/
│       └─ issue.model.ts             # Domain Model
│
├─ state/                             # 狀態管理
│   └─ issue.store.ts                 # Signals Store (可選)
│
└─ shared/                            # 模組內共用
    └─ types/
        └─ issue.types.ts             # 類型定義
```

---

## 核心功能

### 1. 問題管理 (Issue Management)

#### 1.1 問題 CRUD 操作
- **新增問題**: 從各模組創建問題單
- **編輯問題**: 更新問題資訊、狀態、指派人
- **刪除問題**: 軟刪除（設定 `deletedAt` 欄位）
- **查詢問題**: 依 Blueprint、來源模組、狀態、優先級篩選

#### 1.2 問題狀態管理
問題生命週期狀態流轉：

```
開啟 (Open)
    ↓
處理中 (In Progress)
    ↓
待驗證 (Pending Verification)
    ↓
已解決 (Resolved) / 已關閉 (Closed) / 無法解決 (Won't Fix)
```

**狀態定義**:
- `open`: 開啟，新建立的問題
- `in_progress`: 處理中，正在解決
- `pending_verification`: 待驗證，等待確認解決
- `resolved`: 已解決，問題已修復並驗證
- `closed`: 已關閉，問題處理完畢
- `wont_fix`: 無法解決，決定不處理此問題
- `reopened`: 重新開啟，已解決但問題再次發生

#### 1.3 問題優先級管理
- `critical`: 緊急，嚴重影響專案進度
- `high`: 高優先級，重要但不緊急
- `medium`: 中優先級，一般問題
- `low`: 低優先級，輕微問題

#### 1.4 問題類型分類
- `bug`: 錯誤，程式或流程錯誤
- `defect`: 缺陷，品質不符合標準
- `payment_issue`: 付款問題，財務相關
- `contract_issue`: 合約問題，合約相關
- `quality_issue`: 品質問題，QA 相關
- `task_issue`: 任務問題，任務執行相關
- `other`: 其他

### 2. 跨模組整合 (Cross-Module Integration)

#### 2.1 來源模組追蹤
- 記錄問題來自哪個模組（tasks、qa、finance、contract）
- 保存來源實體 ID（如 taskId、qaId、contractId）
- 支援快速導航回來源實體

#### 2.2 問題創建流程
各模組可透過統一介面創建問題：

```typescript
// 從任務模組創建問題
issueService.createIssue({
  blueprintId: 'blueprint-1',
  sourceModule: 'tasks',
  sourceEntityId: 'task-123',
  title: '任務執行發現問題',
  description: '任務施作時發現材料不符',
  type: 'task_issue',
  priority: 'high'
});

// 從品質模組創建問題
issueService.createIssue({
  blueprintId: 'blueprint-1',
  sourceModule: 'qa',
  sourceEntityId: 'qa-456',
  title: '品質檢查不合格',
  description: '發現品質缺陷',
  type: 'quality_issue',
  priority: 'critical'
});
```

#### 2.3 問題回報機制
- 問題狀態變更時通知來源模組
- 支援雙向關聯（問題 ↔ 來源實體）
- 提供問題統計 API 供其他模組查詢

### 3. 附件與文件管理 (Attachment & Document Management)

#### 3.1 文件上傳
- **支援格式**: PDF, DOC, DOCX, JPG, PNG, MP4（影片證據）
- **檔案大小限制**: 單檔最大 20MB
- **路徑管理**: `issues/{blueprintId}/{issueId}/attachments/{fileId}`

#### 3.2 文件操作
- **上傳**: 透過 Cloud Storage API
- **預覽**: 內建圖片/PDF 預覽器
- **下載**: 產生臨時下載連結
- **刪除**: 軟刪除或硬刪除

### 4. 權限控制 (Permission Control)

#### 4.1 角色定義
| 角色 | 權限 |
|-----|------|
| **Owner** | 完整權限（CRUD、指派、關閉） |
| **Admin** | 管理權限（CRUD、指派） |
| **Member** | 基本權限（讀取、建立、編輯自己的問題、回應） |
| **Viewer** | 唯讀權限 |

#### 4.2 權限檢查層級
1. **UI 層**: 按鈕/操作顯示控制
2. **Guard 層**: 路由守衛
3. **Service 層**: 業務邏輯驗證
4. **Security Rules**: Firestore 最終防線

### 5. 問題追蹤與歷史 (Issue Tracking & History)

#### 5.1 活動記錄
- 狀態變更記錄
- 指派人變更記錄
- 優先級調整記錄
- 回應與討論記錄

#### 5.2 通知機制
- **狀態變更**: 自動通知相關人員
- **指派提醒**: 新指派問題提醒
- **逾期警告**: 問題逾期自動警告
- **解決確認**: 問題解決後通知創建者驗證

### 6. 統計與報表 (Statistics & Reports)

- 問題總數與狀態分布
- 問題優先級統計
- 問題來源模組分析
- 問題解決時間統計
- 問題類型分布
- 責任人問題負載統計

---

## 技術棧與實作

### 前端框架
- **Angular 20.3.x**: 主框架
- **ng-alain 20.1.x**: 企業級 UI 框架
- **ng-zorro-antd 20.3.x**: UI 元件庫
- **TypeScript 5.9.x**: 類型系統
- **RxJS 7.8.x**: 響應式程式設計

### Firebase 整合
- **@angular/fire 20.0.1**: Firebase Angular SDK

#### Firebase 服務
| 服務 | 用途 |
|-----|------|
| **Authentication** | 使用者認證與授權 |
| **Firestore** | 問題資料存取 |
| **Cloud Storage** | 附件與文件管理 |
| **Cloud Functions** | 通知、跨模組整合 |
| **Security Rules** | 資料存取權限控制 |

### 資料存取模式
- **Repository Pattern**: 統一資料存取介面
- **FirestoreBaseRepository**: 繼承基礎 Repository
- **executeWithRetry**: 自動重試機制（處理暫時性失敗）

### 狀態管理
- **Angular Signals**: 細粒度響應式狀態
  - `signal()`: 可寫信號
  - `computed()`: 衍生狀態
  - `effect()`: 副作用處理
- **Facade Pattern**: 統一狀態管理 API
- **BlueprintEventBus**: 跨模組事件通訊

### UI 模式
- **Standalone Components**: 無 NgModule
- **OnPush Change Detection**: 效能優化
- **新控制流**: `@if`, `@for`, `@switch`
- **Signals + OnPush**: 細粒度變更檢測

---

## 資料模型

### Issue Model (問題實體)

```typescript
export interface Issue {
  // 識別資訊
  id: string;                          // 問題 ID
  blueprintId: string;                 // 所屬 Blueprint ID
  
  // 基本資訊
  title: string;                       // 問題標題
  description: string;                 // 問題描述
  type: IssueType;                     // 問題類型
  priority: IssuePriority;             // 優先級
  status: IssueStatus;                 // 問題狀態
  
  // 來源追蹤
  sourceModule: SourceModule;          // 來源模組
  sourceEntityId: string;              // 來源實體 ID
  sourceEntityTitle?: string;          // 來源實體標題（快取）
  
  // 責任與指派
  reporterId: string;                  // 回報人 ID
  reporterName: string;                // 回報人名稱
  assigneeId?: string;                 // 指派人 ID
  assigneeName?: string;               // 指派人名稱
  assigneeType?: 'user' | 'team';      // 指派類型
  
  // 時間資訊
  dueDate?: Date;                      // 截止日期
  resolvedAt?: Date;                   // 解決時間
  closedAt?: Date;                     // 關閉時間
  
  // 附件與資源
  attachments: IssueAttachment[];      // 附件列表
  relatedIssues?: string[];            // 相關問題 ID
  
  // 活動與歷史
  activities: IssueActivity[];         // 活動記錄
  comments: IssueComment[];            // 回應與討論
  
  // 元數據
  createdAt: Date;                     // 建立時間
  createdBy: string;                   // 建立者 ID
  updatedAt: Date;                     // 更新時間
  updatedBy: string;                   // 更新者 ID
  deletedAt: Date | null;              // 刪除時間（軟刪除）
  
  // 額外資訊
  tags?: string[];                     // 標籤
  customFields?: Record<string, any>;  // 自訂欄位
  metadata?: Record<string, any>;      // 擴展欄位
}

// 問題類型
export type IssueType = 
  | 'bug'                // 錯誤
  | 'defect'             // 缺陷
  | 'payment_issue'      // 付款問題
  | 'contract_issue'     // 合約問題
  | 'quality_issue'      // 品質問題
  | 'task_issue'         // 任務問題
  | 'other';             // 其他

// 問題狀態
export type IssueStatus = 
  | 'open'                      // 開啟
  | 'in_progress'               // 處理中
  | 'pending_verification'      // 待驗證
  | 'resolved'                  // 已解決
  | 'closed'                    // 已關閉
  | 'wont_fix'                  // 無法解決
  | 'reopened';                 // 重新開啟

// 優先級
export type IssuePriority = 
  | 'critical'           // 緊急
  | 'high'               // 高
  | 'medium'             // 中
  | 'low';               // 低

// 來源模組
export type SourceModule = 
  | 'tasks'              // 任務模組
  | 'qa'                 // 品質模組
  | 'finance'            // 財務模組
  | 'contract'           // 合約模組
  | 'manual';            // 手動建立（非來自其他模組）

// 附件資訊
export interface IssueAttachment {
  id: string;              // 附件 ID
  fileName: string;        // 檔案名稱
  fileType: string;        // 檔案類型（MIME）
  fileSize: number;        // 檔案大小（bytes）
  storagePath: string;     // Storage 路徑
  downloadUrl?: string;    // 下載 URL（臨時）
  thumbnailUrl?: string;   // 縮圖 URL（圖片）
  uploadedAt: Date;        // 上傳時間
  uploadedBy: string;      // 上傳者 ID
}

// 活動記錄
export interface IssueActivity {
  id: string;              // 活動 ID
  type: ActivityType;      // 活動類型
  userId: string;          // 執行者 ID
  userName: string;        // 執行者名稱
  timestamp: Date;         // 時間戳記
  changes?: {              // 變更內容
    field: string;
    oldValue: any;
    newValue: any;
  };
  comment?: string;        // 備註
}

export type ActivityType = 
  | 'created'              // 建立
  | 'status_changed'       // 狀態變更
  | 'assigned'             // 指派
  | 'priority_changed'     // 優先級變更
  | 'commented'            // 回應
  | 'attachment_added'     // 附件新增
  | 'attachment_removed'   // 附件移除
  | 'reopened'             // 重新開啟
  | 'closed';              // 關閉

// 回應與討論
export interface IssueComment {
  id: string;              // 回應 ID
  userId: string;          // 回應者 ID
  userName: string;        // 回應者名稱
  content: string;         // 回應內容
  timestamp: Date;         // 回應時間
  edited?: boolean;        // 是否已編輯
  editedAt?: Date;         // 編輯時間
  attachments?: string[];  // 附件 ID
}
```

### Firestore Collection 結構

```
/issues/{issueId}
  - 問題主文件

/issues/{issueId}/activities/{activityId}
  - 活動記錄（可選，也可合併在主文件）

/issues/{issueId}/comments/{commentId}
  - 回應記錄（可選，也可合併在主文件）

/blueprintMembers/{userId_blueprintId}
  - 成員資格（用於權限檢查）
```

### Firestore 索引需求

```javascript
// 複合索引
issues:
  - blueprintId (ASC), status (ASC), createdAt (DESC)
  - blueprintId (ASC), sourceModule (ASC), createdAt (DESC)
  - blueprintId (ASC), priority (ASC), createdAt (DESC)
  - blueprintId (ASC), assigneeId (ASC), status (ASC)
  - blueprintId (ASC), deletedAt (ASC), createdAt (DESC)
  - sourceModule (ASC), sourceEntityId (ASC)
```

---

## 安全與權限

### Security Rules 設計

#### 基本原則
1. **Blueprint 為權限邊界**: 所有問題必須屬於特定 Blueprint
2. **成員資格驗證**: 檢查 `blueprintMembers` 集合
3. **權限層級控制**: 依角色區分操作權限
4. **資料完整性驗證**: 欄位類型、必填欄位檢查

### 權限矩陣

| 操作 | Owner | Admin | Member | Viewer |
|-----|-------|-------|--------|--------|
| 讀取問題 | ✅ | ✅ | ✅ | ✅ |
| 建立問題 | ✅ | ✅ | ✅ | ❌ |
| 編輯自己的問題 | ✅ | ✅ | ✅ | ❌ |
| 編輯他人的問題 | ✅ | ✅ | ❌ | ❌ |
| 刪除問題 | ✅ | ✅ | ❌ | ❌ |
| 指派問題 | ✅ | ✅ | ❌ | ❌ |
| 變更狀態 | ✅ | ✅ | 僅自己被指派 | ❌ |
| 關閉問題 | ✅ | ✅ | ❌ | ❌ |
| 回應問題 | ✅ | ✅ | ✅ | ❌ |
| 上傳附件 | ✅ | ✅ | ✅ | ❌ |
| 刪除附件 | ✅ | ✅ | 僅自己上傳 | ❌ |

---

## 跨模組協作

### 整合介面設計

#### 1. 統一創建介面

```typescript
// 各模組透過統一介面創建問題
interface CreateIssueRequest {
  blueprintId: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  attachments?: File[];
}
```

#### 2. 事件通知機制

```typescript
// 問題模組發布事件
export type IssueEventType =
  | 'issue.created'        // 問題建立
  | 'issue.updated'        // 問題更新
  | 'issue.assigned'       // 問題指派
  | 'issue.resolved'       // 問題解決
  | 'issue.closed'         // 問題關閉
  | 'issue.reopened';      // 問題重開

// 來源模組可訂閱相關事件
eventBus.subscribe('issue.resolved', (event) => {
  if (event.data.sourceModule === 'tasks') {
    // 更新任務相關狀態
  }
});
```

#### 3. 問題查詢 API

```typescript
// 供其他模組查詢相關問題
interface IssueQueryService {
  // 查詢特定實體的問題
  getIssuesBySource(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<Issue[]>;
  
  // 查詢問題統計
  getIssueStats(
    blueprintId: string,
    sourceModule?: SourceModule
  ): Promise<IssueStats>;
  
  // 檢查是否有未解決問題
  hasUnresolvedIssues(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<boolean>;
}
```

### 模組整合範例

#### Tasks 模組整合

```typescript
// 任務詳情頁顯示相關問題
@Component({
  selector: 'app-task-detail',
  template: `
    <nz-card>
      <h3>任務資訊</h3>
      <!-- 任務詳情 -->
      
      <!-- 相關問題區塊 -->
      <nz-divider></nz-divider>
      <h4>相關問題 ({{ relatedIssues().length }})</h4>
      @if (relatedIssues().length > 0) {
        @for (issue of relatedIssues(); track issue.id) {
          <app-issue-card [issue]="issue" />
        }
      } @else {
        <nz-empty nzNotFoundContent="無相關問題" />
      }
      
      <button 
        nz-button 
        nzType="primary"
        (click)="createIssue()">
        建立問題單
      </button>
    </nz-card>
  `
})
export class TaskDetailComponent {
  private issueService = inject(IssueService);
  
  relatedIssues = signal<Issue[]>([]);
  
  async ngOnInit() {
    const taskId = this.taskId();
    const issues = await this.issueService.getIssuesBySource('tasks', taskId);
    this.relatedIssues.set(issues);
  }
  
  createIssue() {
    this.issueService.createIssueFromTask(this.task());
  }
}
```

#### QA 模組整合

```typescript
// 品質檢查失敗自動建立問題
@Injectable()
export class QAService {
  private issueService = inject(IssueService);
  
  async submitQAReport(report: QAReport): Promise<void> {
    // 如果品質不合格，自動建立問題
    if (report.result === 'failed') {
      await this.issueService.createIssue({
        blueprintId: report.blueprintId,
        sourceModule: 'qa',
        sourceEntityId: report.id,
        title: `品質檢查不合格: ${report.checkItem}`,
        description: `檢查項目: ${report.checkItem}\n不合格原因: ${report.failureReason}`,
        type: 'quality_issue',
        priority: this.calculatePriority(report.severity),
        attachments: report.evidenceFiles
      });
    }
  }
}
```

---

## 狀態管理與事件

### Signals-based State Management

#### IssueFacade (主要狀態管理)

問題模組使用 Facade Pattern 統一管理狀態，透過 Angular Signals 提供細粒度的響應式更新。

**核心 Signals**:
- `issues`: 問題列表
- `selectedIssue`: 當前選中的問題
- `loading`: 載入狀態
- `error`: 錯誤訊息

**Computed Signals**:
- `issuesByStatus`: 依狀態分類的問題
- `issuesByPriority`: 依優先級分類的問題
- `issuesBySource`: 依來源模組分類的問題
- `statistics`: 統計資訊

### 事件驅動整合 (BlueprintEventBus)

#### 問題事件類型

```typescript
// 問題事件類型
export type IssueEventType =
  | 'issue.created'         // 問題建立
  | 'issue.updated'         // 問題更新
  | 'issue.deleted'         // 問題刪除
  | 'issue.assigned'        // 問題指派
  | 'issue.status_changed'  // 問題狀態變更
  | 'issue.resolved'        // 問題解決
  | 'issue.closed'          // 問題關閉
  | 'issue.reopened'        // 問題重開
  | 'issue.commented';      // 問題回應
```

---

## 使用者介面流程

### 1. 問題列表頁 (Issue List)

#### 功能
- 顯示問題列表（表格或看板模式）
- 狀態篩選（開啟、處理中、已解決、已關閉）
- 優先級篩選（緊急、高、中、低）
- 來源模組篩選（tasks、qa、finance、contract）
- 搜尋（問題標題、描述、ID）
- 排序（日期、優先級、狀態）
- 統計資訊（總數、狀態分布、優先級分布）

### 2. 問題建立表單 (Issue Create)

#### 流程步驟
1. **基本資訊**: 標題、描述、類型
2. **來源追蹤**: 來源模組、來源實體 ID
3. **優先級**: 設定優先級
4. **指派**: 選擇指派人（可選）
5. **附件**: 上傳相關檔案（可選）
6. **確認送出**: 檢視摘要並建立

### 3. 問題詳情頁 (Issue Detail)

#### 功能
- 顯示完整問題資訊
- 附件列表與預覽
- 活動歷史
- 回應與討論
- 相關問題連結
- 來源實體快速導航

### 4. 問題編輯頁 (Issue Edit)

#### 功能
- 編輯問題欄位
- 變更狀態
- 調整優先級
- 重新指派
- 上傳/刪除附件
- 新增回應

### 5. 問題看板 (Issue Board)

#### 功能
- 看板視圖（類似 Kanban）
- 依狀態分欄顯示
- 拖拽變更狀態
- 快速篩選與搜尋

---

## 擴展性與維護

### 未來擴展方向

#### 1. 進階功能
- **問題範本**: 預設問題範本庫
- **自動化規則**: 自動指派、自動升級
- **SLA 管理**: 服務級別協議追蹤
- **問題合併**: 重複問題合併

#### 2. 整合功能
- **通知中心**: 即時通知與提醒
- **統計儀表板**: 視覺化統計分析
- **匯出功能**: Excel、PDF 匯出
- **批次操作**: 批次變更狀態、指派

#### 3. AI 增強
- **智能分類**: AI 自動分類問題類型
- **優先級建議**: AI 建議優先級
- **重複檢測**: 自動檢測重複問題
- **解決方案推薦**: 基於歷史問題推薦解決方案

#### 4. 報表與分析
- **問題趨勢**: 問題數量趨勢分析
- **解決時間**: 平均解決時間統計
- **責任人績效**: 問題處理效率分析
- **模組分析**: 各模組問題分布分析

### 維護指南

#### 程式碼維護
1. **遵循三層架構**: UI → Service → Repository
2. **使用 Signals**: 優先使用 Signals 管理狀態
3. **事件驅動**: 跨模組互動使用 EventBus
4. **類型安全**: 避免使用 `any`，定義完整介面

#### 測試策略
1. **單元測試**: Repository、Service、Facade
2. **元件測試**: UI 元件互動測試
3. **整合測試**: Firestore Emulator 測試
4. **E2E 測試**: 關鍵流程端到端測試
5. **跨模組測試**: 測試與其他模組的整合

#### 效能優化
1. **OnPush 變更檢測**: 所有元件使用 OnPush
2. **虛擬卷動**: 大型列表使用 CDK Virtual Scroll
3. **trackBy**: `@for` 迴圈使用 trackBy
4. **分頁載入**: 避免一次載入所有資料

#### 文檔維護
1. **保持文檔更新**: 功能變更時同步更新文檔
2. **API 文檔**: 使用 JSDoc 註解公開 API
3. **變更記錄**: 記錄重要變更與版本
4. **範例程式碼**: 提供使用範例

---

## 參考資源

### 專案文檔
- [架構總覽](../../../../docs/architecture(架構)/01-architecture-overview.md)
- [三層架構](../../../../docs/architecture(架構)/02-three-layer-architecture.md)
- [模組範本](../README.md)

### Angular 文檔
- [Angular Signals](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/guide/components/importing)
- [Dependency Injection](https://angular.dev/guide/di)

### Firebase 文檔
- [Firestore](https://firebase.google.com/docs/firestore)
- [Cloud Storage](https://firebase.google.com/docs/storage)
- [Security Rules](https://firebase.google.com/docs/rules)
- [Cloud Functions](https://firebase.google.com/docs/functions)

### ng-alain 文檔
- [ST 表格](https://ng-alain.com/components/st)
- [SF 動態表單](https://ng-alain.com/form)
- [ACL 權限](https://ng-alain.com/acl)

---

**💡 設計思路總結**
- **專注跨模組協作的問題追蹤機制**
- **清楚界定資料、邏輯、UI 三者的責任**
- **使用 `@angular/fire` 實現與 Firebase 的高效整合**
- **保持可擴展性與可維護性，支持未來功能延伸**

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0
