# Issues Module (問題模組)

> 跨模組協作的問題追蹤與管理系統

## 📋 概述

問題模組是 GigHub 工地施工進度追蹤管理系統的核心協作機制，提供統一的問題追蹤與管理功能。各業務模組（任務、品質、財務、合約）發現問題時，可透過此模組建立問題單，進行追蹤、指派、解決與驗證。

### 核心特性

- ✅ **跨模組整合**: 統一的問題創建與追蹤機制
- ✅ **狀態流程管理**: 完整的問題生命週期管理
- ✅ **優先級分類**: 緊急、高、中、低四級優先級
- ✅ **來源追蹤**: 記錄問題來自哪個模組與實體
- ✅ **附件管理**: 支援上傳證據檔案（圖片、文件、影片）
- ✅ **活動歷史**: 完整的操作記錄與審計追蹤
- ✅ **即時通知**: 問題狀態變更自動通知相關人員
- ✅ **權限控制**: 基於 Blueprint 的細粒度權限管理

---

## 🏗️ 架構設計

### 三層架構

問題模組遵循 GigHub 的標準三層架構：

```
UI 元件 (Presentation Layer)
    ↓ inject()
Service/Facade (Business Layer)
    ↓ inject()
Repository (Data Access Layer)
    ↓
Firestore (Database)
```

**設計原則**:
- UI 元件僅負責展示與使用者互動
- Service/Facade 處理業務邏輯與跨模組協調
- Repository 統一管理 Firestore 資料存取
- 使用 Angular Signals 進行響應式狀態管理

---

## 📁 目錄結構

```
issues/
├─ design.md                          # 設計文件
├─ README.md                          # 本文件
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
│   └─ issue-board.component.ts       # 問題看板
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

## 🚀 快速開始

### 安裝與配置

1. 確認專案已安裝必要依賴：
```bash
# 檢查依賴版本
yarn list @angular/fire
yarn list ng-zorro-antd
yarn list @delon/abc
```

2. 確認 Firebase 配置：
```typescript
// src/app/app.config.ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    // ...
  ]
};
```

3. 配置路由：
```typescript
// src/app/routes/blueprint/routes.ts
{
  path: 'issues',
  loadChildren: () => import('./modules/issues/routes').then(m => m.ISSUE_ROUTES)
}
```

---

## 💡 使用範例

### 1. 在其他模組創建問題

#### 從任務模組創建問題

```typescript
// tasks/components/task-detail.component.ts
import { Component, inject } from '@angular/core';
import { IssueFacade } from '../../../issues/services/issue.facade';

@Component({
  selector: 'app-task-detail',
  template: `
    <nz-card>
      <!-- 任務詳情 -->
      
      <!-- 相關問題區塊 -->
      <h4>相關問題 ({{ relatedIssues().length }})</h4>
      @for (issue of relatedIssues(); track issue.id) {
        <app-issue-card [issue]="issue" />
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
  private issueFacade = inject(IssueFacade);
  
  relatedIssues = signal<Issue[]>([]);
  
  async ngOnInit() {
    // 載入相關問題
    const issues = await this.issueFacade.getIssuesBySource('tasks', this.taskId());
    this.relatedIssues.set(issues);
  }
  
  async createIssue() {
    const task = this.task();
    
    await this.issueFacade.createIssue(task.blueprintId, {
      sourceModule: 'tasks',
      sourceEntityId: task.id,
      sourceEntityTitle: task.title,
      title: `任務執行問題: ${task.title}`,
      description: '任務施作時發現問題，需要處理',
      type: 'task_issue',
      priority: 'high',
      reporterId: 'current-user-id',
      reporterName: '當前使用者',
      status: 'open',
      attachments: [],
      activities: [],
      comments: []
    });
  }
}
```

#### 從品質模組自動創建問題

```typescript
// qa/services/qa.service.ts
import { Injectable, inject } from '@angular/core';
import { IssueFacade } from '../../issues/services/issue.facade';

@Injectable({ providedIn: 'root' })
export class QAService {
  private issueFacade = inject(IssueFacade);
  
  async submitQAReport(report: QAReport): Promise<void> {
    // 如果品質檢查不合格，自動建立問題
    if (report.result === 'failed') {
      await this.issueFacade.createIssue(report.blueprintId, {
        sourceModule: 'qa',
        sourceEntityId: report.id,
        sourceEntityTitle: report.checkItem,
        title: `品質檢查不合格: ${report.checkItem}`,
        description: `檢查項目: ${report.checkItem}\n不合格原因: ${report.failureReason}`,
        type: 'quality_issue',
        priority: this.calculatePriority(report.severity),
        reporterId: report.inspectorId,
        reporterName: report.inspectorName,
        status: 'open',
        attachments: report.evidenceFiles || [],
        activities: [],
        comments: []
      });
    }
  }
  
  private calculatePriority(severity: string): IssuePriority {
    switch (severity) {
      case 'critical': return 'critical';
      case 'major': return 'high';
      case 'minor': return 'medium';
      default: return 'low';
    }
  }
}
```

### 2. 查詢問題

#### 查詢特定來源的問題

```typescript
// 查詢任務的相關問題
const issues = await issueFacade.getIssuesBySource('tasks', taskId);

// 檢查是否有未解決問題
const hasUnresolved = await issueFacade.hasUnresolvedIssues('tasks', taskId);
```

#### 依狀態篩選問題

```typescript
// 使用 Computed Signal
const openIssues = computed(() => {
  return issueFacade.issuesByStatus().open;
});

const criticalIssues = computed(() => {
  return issueFacade.issuesByPriority().critical;
});
```

### 3. 更新問題

#### 變更問題狀態

```typescript
// 變更為處理中
await issueFacade.changeStatus(issueId, 'in_progress');

// 變更為已解決
await issueFacade.changeStatus(issueId, 'resolved');

// 變更為已關閉
await issueFacade.changeStatus(issueId, 'closed');
```

#### 指派問題

```typescript
// 指派給使用者
await issueFacade.assignIssue(issueId, userId, userName, 'user');

// 指派給團隊
await issueFacade.assignIssue(issueId, teamId, teamName, 'team');
```

### 4. 訂閱問題事件

```typescript
// 訂閱問題建立事件
eventBus.subscribe('issue.created', (event) => {
  console.log('新問題建立:', event.data);
  
  // 如果是來自任務模組，更新任務狀態
  if (event.data.sourceModule === 'tasks') {
    taskService.markAsHavingIssues(event.data.sourceEntityId);
  }
});

// 訂閱問題解決事件
eventBus.subscribe('issue.resolved', (event) => {
  console.log('問題已解決:', event.data);
  
  // 通知來源模組
  if (event.data.sourceModule === 'qa') {
    qaService.notifyIssueResolved(event.data.sourceEntityId);
  }
});
```

---

## 🔧 資料模型

### Issue 實體

```typescript
interface Issue {
  // 識別資訊
  id: string;
  blueprintId: string;
  
  // 基本資訊
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  
  // 來源追蹤
  sourceModule: SourceModule;
  sourceEntityId: string;
  sourceEntityTitle?: string;
  
  // 責任與指派
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeType?: 'user' | 'team';
  
  // 時間資訊
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // 附件與資源
  attachments: IssueAttachment[];
  relatedIssues?: string[];
  
  // 活動與歷史
  activities: IssueActivity[];
  comments: IssueComment[];
  
  // 元數據
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
  
  // 額外資訊
  tags?: string[];
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

### 問題狀態流轉

```
開啟 (open)
    ↓
處理中 (in_progress)
    ↓
待驗證 (pending_verification)
    ↓
已解決 (resolved) / 已關閉 (closed) / 無法解決 (wont_fix)
    ↓
重新開啟 (reopened) → 回到處理中
```

---

## 🔒 權限管理

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

### 權限檢查範例

```typescript
// UI 層權限控制
@if (permissionService.hasPermission(blueprintId, 'issue:create')) {
  <button nz-button (click)="createIssue()">建立問題</button>
}

@if (permissionService.hasPermission(blueprintId, 'issue:delete')) {
  <button nz-button nzDanger (click)="deleteIssue()">刪除問題</button>
}

// Service 層權限檢查
async createIssue(blueprintId: string, issue: Issue): Promise<Issue> {
  if (!this.permissionService.hasPermission(blueprintId, 'issue:create')) {
    throw new Error('沒有建立問題的權限');
  }
  
  return await this.repository.create(issue);
}
```

---

## 🧪 測試

### 單元測試

```typescript
// issue.repository.spec.ts
describe('IssueRepository', () => {
  let repository: IssueRepository;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IssueRepository]
    });
    repository = TestBed.inject(IssueRepository);
  });
  
  it('should create issue with source tracking', async () => {
    const issue = {
      blueprintId: 'blueprint-1',
      sourceModule: 'tasks',
      sourceEntityId: 'task-123',
      title: 'Test Issue',
      description: 'Test',
      type: 'task_issue',
      priority: 'high',
      status: 'open'
    };
    
    const created = await repository.create(issue);
    
    expect(created.id).toBeDefined();
    expect(created.sourceModule).toBe('tasks');
    expect(created.sourceEntityId).toBe('task-123');
  });
});
```

### E2E 測試

```typescript
// issue.e2e-spec.ts
describe('Issue Management', () => {
  it('should create issue from task module', async () => {
    await page.goto('/blueprints/blueprint-1/tasks/task-123');
    await page.click('button:has-text("建立問題單")');
    
    await page.fill('input[name="title"]', '測試問題');
    await page.fill('textarea[name="description"]', '問題描述');
    await page.click('button:has-text("送出")');
    
    await expect(page.locator('text=問題建立成功')).toBeVisible();
  });
});
```

---

## 📊 效能優化

### 1. 分頁載入

```typescript
// 大量問題時使用分頁
<st 
  [data]="filteredIssues()"
  [page]="{ show: true, showSize: true, pageSizes: [10, 20, 50] }">
</st>
```

### 2. 虛擬滾動

```typescript
// 超長列表使用虛擬滾動
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

<cdk-virtual-scroll-viewport itemSize="50" style="height: 600px;">
  @for (issue of issues(); track issue.id) {
    <app-issue-card [issue]="issue" />
  }
</cdk-virtual-scroll-viewport>
```

### 3. OnPush 變更檢測

```typescript
@Component({
  selector: 'app-issue-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class IssueListComponent { }
```

---

## 🔄 跨模組整合

### 整合介面

```typescript
// 統一創建介面
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

// 查詢介面
interface IssueQueryService {
  getIssuesBySource(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<Issue[]>;
  
  hasUnresolvedIssues(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<boolean>;
  
  getIssueStats(
    blueprintId: string,
    sourceModule?: SourceModule
  ): Promise<IssueStats>;
}
```

### 事件通知

```typescript
// 問題事件類型
export type IssueEventType =
  | 'issue.created'
  | 'issue.updated'
  | 'issue.assigned'
  | 'issue.status_changed'
  | 'issue.resolved'
  | 'issue.closed'
  | 'issue.reopened'
  | 'issue.commented';

// 訂閱事件
eventBus.subscribe('issue.created', (event) => {
  // 處理問題建立事件
});
```

---

## 📚 參考文檔

### 內部文檔
- [design.md](./design.md) - 詳細設計文件
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - 實作指南
- [../README.md](../README.md) - Blueprint 模組範本

### 架構文檔
- [架構總覽](../../../../docs/architecture(架構)/01-architecture-overview.md)
- [三層架構](../../../../docs/architecture(架構)/02-three-layer-architecture.md)

### 技術文檔
- [Angular Signals](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/guide/components/importing)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [ng-zorro-antd](https://ng.ant.design/)
- [ng-alain](https://ng-alain.com/)

---

## 🤝 貢獻指南

### 開發流程

1. 閱讀 `design.md` 了解整體設計
2. 閱讀 `IMPLEMENTATION_GUIDE.md` 了解實作細節
3. 遵循三層架構原則
4. 撰寫單元測試與整合測試
5. 確保 Security Rules 正確配置
6. 提交 Pull Request

### 程式碼規範

- 使用 Standalone Components
- 使用 Angular Signals 管理狀態
- 使用 `inject()` 依賴注入
- 使用 `@if/@for/@switch` 新控制流
- 遵循 Repository Pattern
- 所有操作包含權限檢查
- 所有操作發布對應事件

---

## 📝 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| v1.0.0 | 2025-12-22 | 初始版本 | GigHub 開發團隊 |

---

## 📧 聯絡方式

如有問題或建議，請聯絡 GigHub 開發團隊。

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0
