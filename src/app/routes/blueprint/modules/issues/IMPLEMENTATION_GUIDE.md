# 問題模組實作指南 (Issues Module Implementation Guide)

> **補充文件**: 搭配 `design.md` 使用，提供實作細節與最佳實踐  
> **版本**: v1.0.0  
> **最後更新**: 2025-12-22

## 📋 目的

本文件針對 `design.md` 提供以下補充：
1. **實作順序**: 明確的開發步驟與檢查清單
2. **程式碼範例**: 完整可執行的程式碼片段
3. **常見陷阱**: 實作時容易出錯的地方及解決方案
4. **測試策略**: 如何測試每個層級的程式碼
5. **跨模組整合**: 如何與其他模組協作

---

## 🚀 實作路徑 (Implementation Roadmap)

### Phase 0: 準備工作 (Prerequisites)

**檢查清單**:
- [ ] 確認已閱讀 `design.md` 完整內容
- [ ] 確認了解三層架構: UI → Service → Repository → Firestore
- [ ] 確認專案使用 `@angular/fire` 直接注入 Firestore
- [ ] 確認已設定 Firebase Emulator（用於本地測試）
- [ ] 確認了解跨模組協作機制

**關鍵檔案**:
- `.github/instructions/ng-gighub-architecture.instructions.md`
- `.github/instructions/ng-gighub-firestore-repository.instructions.md`
- `src/app/core/data-access/repositories/base/firestore-base.repository.ts`
- `src/app/core/blueprint/events/enhanced-event-bus.service.ts`

---

### Phase 1: 資料模型定義 (Data Models)

#### 步驟 1.1: 建立 Issue Model

**目標**: 定義完整的問題模型

**檔案**: `src/app/routes/blueprint/modules/issues/data-access/models/issue.model.ts`

**階段 1 - 核心欄位**:
```typescript
export interface Issue {
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
  
  // 元數據
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
}

export type IssueType = 
  | 'bug' 
  | 'defect' 
  | 'payment_issue' 
  | 'contract_issue' 
  | 'quality_issue' 
  | 'task_issue' 
  | 'other';

export type IssueStatus = 
  | 'open' 
  | 'in_progress' 
  | 'pending_verification' 
  | 'resolved' 
  | 'closed' 
  | 'wont_fix' 
  | 'reopened';

export type IssuePriority = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'low';

export type SourceModule = 
  | 'tasks' 
  | 'qa' 
  | 'finance' 
  | 'contract' 
  | 'manual';
```

**階段 2 - 添加附件與活動**:
```typescript
export interface Issue {
  // ... 階段 1 欄位
  
  // 附件與資源
  attachments: IssueAttachment[];
  relatedIssues?: string[];
  
  // 活動與歷史
  activities: IssueActivity[];
  comments: IssueComment[];
  
  // 額外資訊
  tags?: string[];
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IssueAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface IssueActivity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  };
  comment?: string;
}

export type ActivityType = 
  | 'created' 
  | 'status_changed' 
  | 'assigned' 
  | 'priority_changed' 
  | 'commented' 
  | 'attachment_added' 
  | 'attachment_removed' 
  | 'reopened' 
  | 'closed';

export interface IssueComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  attachments?: string[];
}
```

**⚠️ 重要**: 採用漸進式擴展，每個階段完成後都要測試

---

### Phase 2: Repository 實作 (Data Access Layer)

#### 步驟 2.1: 建立 IssueRepository

**檔案**: `src/app/routes/blueprint/modules/issues/data-access/repositories/issue.repository.ts`

**⚠️ 關鍵注意事項**:
1. 專案使用 `@angular/fire` 直接注入 `Firestore`
2. 必須繼承 `FirestoreBaseRepository<T>`
3. 必須實作 `collectionName` 和 `toEntity` 方法
4. Firestore 使用 `snake_case`，TypeScript 使用 `camelCase`

**完整實作範例**:

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData 
} from '@angular/fire/firestore';
import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { Issue, IssueStatus, IssuePriority, IssueType, SourceModule } from '../models/issue.model';

@Injectable({ providedIn: 'root' })
export class IssueRepository extends FirestoreBaseRepository<Issue> {
  // ✅ 必須: 定義 collection 名稱
  protected collectionName = 'issues';
  
  /**
   * ✅ 必須: 將 Firestore DocumentData 轉換為 TypeScript 實體
   * 
   * 重要: Firestore 使用 snake_case，TypeScript 使用 camelCase
   */
  protected toEntity(data: DocumentData, id: string): Issue {
    return {
      // 識別資訊
      id,
      blueprintId: data['blueprint_id'] || data['blueprintId'],
      
      // 基本資訊
      title: data['title'],
      description: data['description'],
      type: this.mapIssueType(data['type']),
      priority: this.mapPriority(data['priority']),
      status: this.mapStatus(data['status']),
      
      // 來源追蹤
      sourceModule: this.mapSourceModule(data['source_module']),
      sourceEntityId: data['source_entity_id'] || data['sourceEntityId'],
      sourceEntityTitle: data['source_entity_title'] || data['sourceEntityTitle'],
      
      // 責任與指派
      reporterId: data['reporter_id'] || data['reporterId'],
      reporterName: data['reporter_name'] || data['reporterName'],
      assigneeId: data['assignee_id'] || data['assigneeId'],
      assigneeName: data['assignee_name'] || data['assigneeName'],
      assigneeType: data['assignee_type'] || data['assigneeType'],
      
      // 時間資訊
      dueDate: data['due_date'] ? this.toDate(data['due_date']) : undefined,
      resolvedAt: data['resolved_at'] ? this.toDate(data['resolved_at']) : undefined,
      closedAt: data['closed_at'] ? this.toDate(data['closed_at']) : undefined,
      
      // 附件與資源
      attachments: data['attachments'] || [],
      relatedIssues: data['related_issues'] || [],
      
      // 活動與歷史
      activities: data['activities'] || [],
      comments: data['comments'] || [],
      
      // 元數據
      createdAt: this.toDate(data['created_at']),
      createdBy: data['created_by'] || data['createdBy'],
      updatedAt: this.toDate(data['updated_at']),
      updatedBy: data['updated_by'] || data['updatedBy'],
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null,
      
      // 額外資訊
      tags: data['tags'] || [],
      customFields: data['custom_fields'] || {},
      metadata: data['metadata'] || {}
    };
  }
  
  /**
   * ✅ 可選: 將 TypeScript 實體轉換為 Firestore DocumentData
   * 
   * 重要: 移除 undefined 值，Firestore 不接受 undefined
   */
  protected override toDocument(issue: Partial<Issue>): DocumentData {
    const doc: DocumentData = {};
    
    // 只添加有值的欄位
    if (issue.blueprintId) doc['blueprint_id'] = issue.blueprintId;
    if (issue.title) doc['title'] = issue.title;
    if (issue.description !== undefined) doc['description'] = issue.description;
    if (issue.type) doc['type'] = issue.type.toUpperCase();
    if (issue.priority) doc['priority'] = issue.priority.toUpperCase();
    if (issue.status) doc['status'] = issue.status.toUpperCase();
    
    // 來源追蹤
    if (issue.sourceModule) doc['source_module'] = issue.sourceModule;
    if (issue.sourceEntityId) doc['source_entity_id'] = issue.sourceEntityId;
    if (issue.sourceEntityTitle !== undefined) doc['source_entity_title'] = issue.sourceEntityTitle;
    
    // 責任與指派
    if (issue.reporterId) doc['reporter_id'] = issue.reporterId;
    if (issue.reporterName) doc['reporter_name'] = issue.reporterName;
    if (issue.assigneeId !== undefined) doc['assignee_id'] = issue.assigneeId;
    if (issue.assigneeName !== undefined) doc['assignee_name'] = issue.assigneeName;
    if (issue.assigneeType !== undefined) doc['assignee_type'] = issue.assigneeType;
    
    // 時間資訊
    if (issue.dueDate) doc['due_date'] = Timestamp.fromDate(issue.dueDate);
    if (issue.resolvedAt) doc['resolved_at'] = Timestamp.fromDate(issue.resolvedAt);
    if (issue.closedAt) doc['closed_at'] = Timestamp.fromDate(issue.closedAt);
    
    // 附件與資源
    if (issue.attachments) doc['attachments'] = issue.attachments;
    if (issue.relatedIssues) doc['related_issues'] = issue.relatedIssues;
    
    // 活動與歷史
    if (issue.activities) doc['activities'] = issue.activities;
    if (issue.comments) doc['comments'] = issue.comments;
    
    // 額外資訊
    if (issue.tags) doc['tags'] = issue.tags;
    if (issue.customFields) doc['custom_fields'] = issue.customFields;
    if (issue.metadata) doc['metadata'] = issue.metadata;
    
    return doc;
  }
  
  // ===== 輔助方法 =====
  
  private toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
  
  private mapStatus(status: string): IssueStatus {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'open': return 'open';
      case 'in_progress': return 'in_progress';
      case 'pending_verification': return 'pending_verification';
      case 'resolved': return 'resolved';
      case 'closed': return 'closed';
      case 'wont_fix': return 'wont_fix';
      case 'reopened': return 'reopened';
      default: return 'open';
    }
  }
  
  private mapPriority(priority: string): IssuePriority {
    const normalized = priority?.toLowerCase();
    switch (normalized) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
  
  private mapIssueType(type: string): IssueType {
    const normalized = type?.toLowerCase();
    switch (normalized) {
      case 'bug': return 'bug';
      case 'defect': return 'defect';
      case 'payment_issue': return 'payment_issue';
      case 'contract_issue': return 'contract_issue';
      case 'quality_issue': return 'quality_issue';
      case 'task_issue': return 'task_issue';
      default: return 'other';
    }
  }
  
  private mapSourceModule(module: string): SourceModule {
    const normalized = module?.toLowerCase();
    switch (normalized) {
      case 'tasks': return 'tasks';
      case 'qa': return 'qa';
      case 'finance': return 'finance';
      case 'contract': return 'contract';
      default: return 'manual';
    }
  }
  
  // ===== 業務查詢方法 =====
  
  /**
   * 依 Blueprint ID 查詢問題（不含已刪除）
   */
  async findByBlueprintId(blueprintId: string): Promise<Issue[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('blueprint_id', '==', blueprintId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 依狀態查詢問題
   */
  async findByStatus(
    blueprintId: string, 
    status: IssueStatus
  ): Promise<Issue[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('blueprint_id', '==', blueprintId),
        where('status', '==', status.toUpperCase()),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 依來源模組與實體 ID 查詢問題
   */
  async findBySource(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<Issue[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('source_module', '==', sourceModule),
        where('source_entity_id', '==', sourceEntityId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 檢查是否有未解決問題
   */
  async hasUnresolvedIssues(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<boolean> {
    const issues = await this.findBySource(sourceModule, sourceEntityId);
    return issues.some(issue => 
      issue.status !== 'resolved' && 
      issue.status !== 'closed' && 
      issue.status !== 'wont_fix'
    );
  }
  
  /**
   * 依 ID 查詢單一問題
   */
  async findById(id: string): Promise<Issue | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }
  
  /**
   * 建立問題
   */
  async create(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Issue> {
    return this.executeWithRetry(async () => {
      return this.createDocument(issue);
    });
  }
  
  /**
   * 更新問題
   */
  async update(id: string, issue: Partial<Issue>): Promise<Issue> {
    return this.executeWithRetry(async () => {
      return this.updateDocument(id, issue);
    });
  }
  
  /**
   * 刪除問題（軟刪除）
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      return this.deleteDocument(id, false);  // false = 軟刪除
    });
  }
}
```

**✅ 檢查清單**:
- [ ] Repository 繼承 `FirestoreBaseRepository<Issue>`
- [ ] 實作 `collectionName`
- [ ] 實作 `toEntity` (Firestore → TypeScript)
- [ ] 實作 `toDocument` (TypeScript → Firestore)
- [ ] 所有查詢使用 `executeWithRetry`
- [ ] 欄位命名: Firestore 用 snake_case，TypeScript 用 camelCase
- [ ] 處理 Timestamp 轉換
- [ ] 處理 null vs undefined
- [ ] 軟刪除使用 `deleted_at` 欄位
- [ ] 實作跨模組查詢方法 (`findBySource`, `hasUnresolvedIssues`)

---

### Phase 3: Service/Facade 實作 (Business Layer)

#### 步驟 3.1: 實作 IssueFacade

**檔案**: `src/app/routes/blueprint/modules/issues/services/issue.facade.ts`

**完整實作** (包含錯誤處理、事件、權限、跨模組整合):

```typescript
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { IssueRepository } from '../data-access/repositories/issue.repository';
import { Issue, IssueStatus, SourceModule } from '../data-access/models/issue.model';
import { BlueprintEventBus } from '@core/blueprint/events/enhanced-event-bus.service';
import { PermissionService } from '@core/services/permission.service';

@Injectable({ providedIn: 'root' })
export class IssueFacade {
  private readonly repository = inject(IssueRepository);
  private readonly eventBus = inject(BlueprintEventBus);
  private readonly permissionService = inject(PermissionService);
  
  // ===== Private Signals =====
  private readonly _issues = signal<Issue[]>([]);
  private readonly _selectedIssue = signal<Issue | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  // ===== Public Readonly Signals =====
  readonly issues = this._issues.asReadonly();
  readonly selectedIssue = this._selectedIssue.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // ===== Computed Signals =====
  readonly issuesByStatus = computed(() => {
    const issues = this._issues();
    return {
      open: issues.filter(i => i.status === 'open'),
      inProgress: issues.filter(i => i.status === 'in_progress'),
      pendingVerification: issues.filter(i => i.status === 'pending_verification'),
      resolved: issues.filter(i => i.status === 'resolved'),
      closed: issues.filter(i => i.status === 'closed'),
      wontFix: issues.filter(i => i.status === 'wont_fix'),
      reopened: issues.filter(i => i.status === 'reopened')
    };
  });
  
  readonly issuesByPriority = computed(() => {
    const issues = this._issues();
    return {
      critical: issues.filter(i => i.priority === 'critical'),
      high: issues.filter(i => i.priority === 'high'),
      medium: issues.filter(i => i.priority === 'medium'),
      low: issues.filter(i => i.priority === 'low')
    };
  });
  
  readonly issuesBySource = computed(() => {
    const issues = this._issues();
    return {
      tasks: issues.filter(i => i.sourceModule === 'tasks'),
      qa: issues.filter(i => i.sourceModule === 'qa'),
      finance: issues.filter(i => i.sourceModule === 'finance'),
      contract: issues.filter(i => i.sourceModule === 'contract'),
      manual: issues.filter(i => i.sourceModule === 'manual')
    };
  });
  
  readonly statistics = computed(() => {
    const issues = this._issues();
    const total = issues.length;
    const byStatus = this.issuesByStatus();
    const byPriority = this.issuesByPriority();
    
    return {
      total,
      open: byStatus.open.length,
      inProgress: byStatus.inProgress.length,
      resolved: byStatus.resolved.length,
      closed: byStatus.closed.length,
      critical: byPriority.critical.length,
      high: byPriority.high.length,
      medium: byPriority.medium.length,
      low: byPriority.low.length
    };
  });
  
  // ===== Actions =====
  
  /**
   * 載入 Blueprint 的所有問題
   */
  async loadIssues(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const issues = await this.repository.findByBlueprintId(blueprintId);
      this._issues.set(issues);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to load issues:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * 建立新問題
   */
  async createIssue(
    blueprintId: string, 
    issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<Issue> {
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(blueprintId, 'issue:create')) {
      throw new Error('沒有建立問題的權限');
    }
    
    try {
      const created = await this.repository.create(issue);
      
      // ✅ 更新本地狀態
      this._issues.update(issues => [...issues, created]);
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'issue.created',
        blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id', // TODO: 從 AuthService 獲取
        data: created
      });
      
      return created;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to create issue:', error);
      throw error;
    }
  }
  
  /**
   * 更新問題
   */
  async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
    const issue = this._issues().find(i => i.id === id);
    if (!issue) {
      throw new Error('找不到問題');
    }
    
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(issue.blueprintId, 'issue:update')) {
      throw new Error('沒有更新問題的權限');
    }
    
    try {
      const updated = await this.repository.update(id, updates);
      
      // ✅ 更新本地狀態
      this._issues.update(issues =>
        issues.map(i => i.id === id ? updated : i)
      );
      
      // ✅ 更新選中的問題
      if (this._selectedIssue()?.id === id) {
        this._selectedIssue.set(updated);
      }
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'issue.updated',
        blueprintId: issue.blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: updated
      });
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to update issue:', error);
      throw error;
    }
  }
  
  /**
   * 刪除問題（軟刪除）
   */
  async deleteIssue(id: string): Promise<void> {
    const issue = this._issues().find(i => i.id === id);
    if (!issue) {
      throw new Error('找不到問題');
    }
    
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(issue.blueprintId, 'issue:delete')) {
      throw new Error('沒有刪除問題的權限');
    }
    
    try {
      await this.repository.delete(id);
      
      // ✅ 更新本地狀態
      this._issues.update(issues => issues.filter(i => i.id !== id));
      
      // ✅ 清除選中狀態
      if (this._selectedIssue()?.id === id) {
        this._selectedIssue.set(null);
      }
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'issue.deleted',
        blueprintId: issue.blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: { id }
      });
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to delete issue:', error);
      throw error;
    }
  }
  
  /**
   * 變更問題狀態
   */
  async changeStatus(id: string, newStatus: IssueStatus): Promise<void> {
    const issue = this._issues().find(i => i.id === id);
    if (!issue) {
      throw new Error('找不到問題');
    }
    
    const updates: Partial<Issue> = { status: newStatus };
    
    // 如果狀態變更為已解決，記錄解決時間
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date();
    }
    
    // 如果狀態變更為已關閉，記錄關閉時間
    if (newStatus === 'closed') {
      updates.closedAt = new Date();
    }
    
    await this.updateIssue(id, updates);
    
    // ✅ 發布狀態變更事件
    this.eventBus.publish({
      type: 'issue.status_changed',
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor: 'current-user-id',
      data: { id, oldStatus: issue.status, newStatus }
    });
  }
  
  /**
   * 指派問題
   */
  async assignIssue(
    id: string, 
    assigneeId: string, 
    assigneeName: string,
    assigneeType: 'user' | 'team' = 'user'
  ): Promise<void> {
    const issue = this._issues().find(i => i.id === id);
    if (!issue) {
      throw new Error('找不到問題');
    }
    
    await this.updateIssue(id, { 
      assigneeId, 
      assigneeName,
      assigneeType 
    });
    
    // ✅ 發布指派事件
    this.eventBus.publish({
      type: 'issue.assigned',
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor: 'current-user-id',
      data: { id, assigneeId, assigneeName }
    });
  }
  
  /**
   * 查詢特定來源的問題（跨模組整合）
   */
  async getIssuesBySource(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<Issue[]> {
    try {
      return await this.repository.findBySource(sourceModule, sourceEntityId);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to get issues by source:', error);
      throw error;
    }
  }
  
  /**
   * 檢查是否有未解決問題（跨模組整合）
   */
  async hasUnresolvedIssues(
    sourceModule: SourceModule,
    sourceEntityId: string
  ): Promise<boolean> {
    try {
      return await this.repository.hasUnresolvedIssues(sourceModule, sourceEntityId);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[IssueFacade] Failed to check unresolved issues:', error);
      throw error;
    }
  }
  
  /**
   * 選擇問題
   */
  selectIssue(id: string): void {
    const issue = this._issues().find(i => i.id === id);
    this._selectedIssue.set(issue || null);
  }
  
  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }
  
  /**
   * 重置狀態
   */
  reset(): void {
    this._issues.set([]);
    this._selectedIssue.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
  
  // ===== 輔助方法 =====
  
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      // Firestore 錯誤處理
      if (error.message.includes('permission-denied')) {
        return '沒有存取權限';
      }
      if (error.message.includes('not-found')) {
        return '找不到資料';
      }
      if (error.message.includes('unavailable')) {
        return '服務暫時無法使用，請稍後再試';
      }
      return error.message;
    }
    return '未知錯誤';
  }
}
```

**✅ 檢查清單**:
- [ ] Facade 注入 Repository, EventBus, PermissionService
- [ ] 使用 private writable signals 和 public readonly signals
- [ ] 實作 computed signals (issuesByStatus, issuesByPriority, issuesBySource, statistics)
- [ ] 所有操作包含權限檢查
- [ ] 所有操作包含錯誤處理
- [ ] 所有操作發布對應事件
- [ ] 提供友善的錯誤訊息
- [ ] 實作跨模組整合方法 (getIssuesBySource, hasUnresolvedIssues)

---

### Phase 4: UI 元件實作 (Presentation Layer)

#### 步驟 4.1: 實作 IssueListComponent

**檔案**: `src/app/routes/blueprint/modules/issues/components/issue-list.component.ts`

```typescript
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { STColumn, STModule } from '@delon/abc/st';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { IssueFacade } from '../services/issue.facade';
import { Issue, IssueStatus } from '../data-access/models/issue.model';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    STModule,
    NzButtonModule,
    NzCardModule,
    NzStatisticModule,
    NzSelectModule,
    NzInputModule
  ],
  template: `
    <nz-card>
      <!-- 統計卡片 -->
      <div class="stats-row" style="display: flex; gap: 16px; margin-bottom: 16px;">
        <nz-statistic 
          [nzValue]="statistics().total" 
          nzTitle="總問題數">
        </nz-statistic>
        <nz-statistic 
          [nzValue]="statistics().open" 
          nzTitle="開啟中"
          [nzValueStyle]="{ color: '#1890ff' }">
        </nz-statistic>
        <nz-statistic 
          [nzValue]="statistics().critical" 
          nzTitle="緊急問題"
          [nzValueStyle]="{ color: '#f5222d' }">
        </nz-statistic>
      </div>
      
      <!-- 篩選與搜尋 -->
      <div class="toolbar" style="display: flex; gap: 16px; margin-bottom: 16px;">
        <nz-input-group nzSearch style="flex: 1;">
          <input 
            nz-input 
            [(ngModel)]="searchText"
            (ngModelChange)="onSearchChange()"
            placeholder="搜尋問題標題、描述..."
          />
        </nz-input-group>
        
        <nz-select 
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
          placeholder="選擇狀態"
          style="width: 150px;">
          <nz-option nzValue="all" nzLabel="全部"></nz-option>
          <nz-option nzValue="open" nzLabel="開啟"></nz-option>
          <nz-option nzValue="in_progress" nzLabel="處理中"></nz-option>
          <nz-option nzValue="pending_verification" nzLabel="待驗證"></nz-option>
          <nz-option nzValue="resolved" nzLabel="已解決"></nz-option>
          <nz-option nzValue="closed" nzLabel="已關閉"></nz-option>
        </nz-select>
        
        <nz-select 
          [(ngModel)]="priorityFilter"
          (ngModelChange)="onFilterChange()"
          placeholder="選擇優先級"
          style="width: 150px;">
          <nz-option nzValue="all" nzLabel="全部"></nz-option>
          <nz-option nzValue="critical" nzLabel="緊急"></nz-option>
          <nz-option nzValue="high" nzLabel="高"></nz-option>
          <nz-option nzValue="medium" nzLabel="中"></nz-option>
          <nz-option nzValue="low" nzLabel="低"></nz-option>
        </nz-select>
        
        <button 
          nz-button 
          nzType="primary"
          (click)="openCreateModal()">
          <i nz-icon nzType="plus"></i>
          新增問題
        </button>
      </div>
      
      <!-- 錯誤訊息 -->
      @if (facade.error(); as errorMsg) {
        <nz-alert 
          nzType="error" 
          [nzMessage]="errorMsg"
          nzShowIcon
          nzCloseable
          (nzOnClose)="facade.clearError()"
          style="margin-bottom: 16px;">
        </nz-alert>
      }
      
      <!-- 問題表格 -->
      <st 
        [data]="filteredIssues()"
        [columns]="columns"
        [loading]="facade.loading()"
        [page]="{ show: true, showSize: true }"
        (change)="handleTableChange($event)">
      </st>
    </nz-card>
  `
})
export class IssueListComponent {
  readonly facade = inject(IssueFacade);
  readonly router = inject(Router);
  
  // ✅ 使用 input() 接收 blueprintId
  readonly blueprintId = input.required<string>();
  
  // ✅ 本地 UI 狀態
  searchText = signal('');
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  
  // ✅ Computed signals
  statistics = computed(() => this.facade.statistics());
  
  filteredIssues = computed(() => {
    let issues = this.facade.issues();
    
    // 狀態篩選
    const status = this.statusFilter();
    if (status !== 'all') {
      issues = issues.filter(i => i.status === status);
    }
    
    // 優先級篩選
    const priority = this.priorityFilter();
    if (priority !== 'all') {
      issues = issues.filter(i => i.priority === priority);
    }
    
    // 搜尋
    const search = this.searchText().toLowerCase();
    if (search) {
      issues = issues.filter(i => 
        i.title.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search)
      );
    }
    
    return issues;
  });
  
  // ✅ ST 表格欄位定義
  columns: STColumn[] = [
    { 
      title: 'ID', 
      index: 'id', 
      width: 100,
      format: (item: Issue) => `#${item.id.slice(0, 8)}`
    },
    { 
      title: '標題', 
      index: 'title',
      sort: true
    },
    { 
      title: '狀態', 
      index: 'status', 
      type: 'badge',
      width: 100,
      badge: {
        open: { text: '開啟', color: 'default' },
        in_progress: { text: '處理中', color: 'processing' },
        pending_verification: { text: '待驗證', color: 'warning' },
        resolved: { text: '已解決', color: 'success' },
        closed: { text: '已關閉', color: 'default' },
        wont_fix: { text: '無法解決', color: 'error' },
        reopened: { text: '重新開啟', color: 'processing' }
      }
    },
    { 
      title: '優先級', 
      index: 'priority', 
      type: 'badge',
      width: 100,
      badge: {
        critical: { text: '緊急', color: 'red' },
        high: { text: '高', color: 'orange' },
        medium: { text: '中', color: 'blue' },
        low: { text: '低', color: 'default' }
      }
    },
    { 
      title: '來源模組', 
      index: 'sourceModule', 
      width: 120,
      format: (item: Issue) => {
        const moduleNames = {
          tasks: '任務',
          qa: '品質',
          finance: '財務',
          contract: '合約',
          manual: '手動'
        };
        return moduleNames[item.sourceModule] || item.sourceModule;
      }
    },
    { 
      title: '回報人', 
      index: 'reporterName', 
      width: 100
    },
    { 
      title: '指派人', 
      index: 'assigneeName', 
      width: 100
    },
    { 
      title: '建立時間', 
      index: 'createdAt', 
      type: 'date',
      width: 120,
      sort: true
    },
    {
      title: '操作',
      width: 200,
      buttons: [
        { 
          text: '查看', 
          icon: 'eye',
          click: (record: Issue) => this.viewIssue(record) 
        },
        { 
          text: '編輯', 
          icon: 'edit',
          click: (record: Issue) => this.editIssue(record),
          iif: (record: Issue) => record.status === 'open'
        },
        { 
          text: '刪除', 
          icon: 'delete',
          type: 'del',
          click: (record: Issue) => this.deleteIssue(record),
          pop: {
            title: '確定要刪除此問題嗎？',
            okType: 'danger'
          }
        }
      ]
    }
  ];
  
  // ✅ 生命週期
  constructor() {
    // 使用 effect 監聽 blueprintId 變化
    effect(() => {
      const blueprintId = this.blueprintId();
      if (blueprintId) {
        this.facade.loadIssues(blueprintId);
      }
    }, { allowSignalWrites: true });
  }
  
  // ===== 事件處理 =====
  
  onSearchChange(): void {
    // 搜尋會透過 computed signal 自動更新
  }
  
  onFilterChange(): void {
    // 篩選會透過 computed signal 自動更新
  }
  
  handleTableChange(event: any): void {
    console.log('Table change:', event);
  }
  
  viewIssue(issue: Issue): void {
    this.router.navigate(['issues', issue.id]);
  }
  
  editIssue(issue: Issue): void {
    this.router.navigate(['issues', issue.id, 'edit']);
  }
  
  async deleteIssue(issue: Issue): Promise<void> {
    try {
      await this.facade.deleteIssue(issue.id);
      // 成功訊息由 nz-message 顯示
    } catch (error) {
      // 錯誤已由 facade 處理並設定到 error signal
    }
  }
  
  openCreateModal(): void {
    // TODO: 開啟建立表單
    this.router.navigate(['issues', 'new']);
  }
}
```

**✅ 檢查清單**:
- [ ] 使用 `input()` 接收參數
- [ ] 使用 `inject()` 注入服務
- [ ] 使用 Signals 管理本地狀態
- [ ] 使用 `computed()` 衍生狀態
- [ ] 使用 `effect()` 監聽變化
- [ ] 使用 `@if` / `@for` 新控制流
- [ ] ST 表格使用 `trackBy`
- [ ] 錯誤訊息顯示與清除
- [ ] 權限控制按鈕顯示

---

### Phase 5: Security Rules 實作與測試

#### 步驟 5.1: 更新 Security Rules

**檔案**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== 輔助函數 =====
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function isMemberActive(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    // ===== Issues Collection =====
    
    match /issues/{issueId} {
      // 讀取：Blueprint 活躍成員可讀取未刪除的問題
      allow read: if isAuthenticated() 
                     && isBlueprintMember(resource.data.blueprint_id)
                     && isMemberActive(resource.data.blueprint_id)
                     && resource.data.deleted_at == null;
      
      // 建立：有 issue:create 權限的活躍成員可建立
      allow create: if isAuthenticated() 
                       && isBlueprintMember(request.resource.data.blueprint_id)
                       && isMemberActive(request.resource.data.blueprint_id)
                       && hasPermission(request.resource.data.blueprint_id, 'issue:create')
                       && request.resource.data.blueprint_id is string
                       && request.resource.data.title is string
                       && request.resource.data.description is string
                       && request.resource.data.status in ['OPEN', 'IN_PROGRESS'];
      
      // 更新：有 issue:update 權限或為回報者或被指派者可更新
      allow update: if isAuthenticated() 
                       && isBlueprintMember(resource.data.blueprint_id)
                       && isMemberActive(resource.data.blueprint_id)
                       && (hasPermission(resource.data.blueprint_id, 'issue:update')
                           || resource.data.reporter_id == getCurrentUserId()
                           || resource.data.assignee_id == getCurrentUserId())
                       && request.resource.data.blueprint_id == resource.data.blueprint_id;
      
      // 刪除：有 issue:delete 權限可刪除
      allow delete: if isAuthenticated() 
                       && isBlueprintMember(resource.data.blueprint_id)
                       && isMemberActive(resource.data.blueprint_id)
                       && hasPermission(resource.data.blueprint_id, 'issue:delete');
    }
  }
}
```

---

## 🚨 常見陷阱與解決方案

### 1. ❌ 陷阱: 忘記處理 Timestamp 轉換

**錯誤**:
```typescript
// Firestore 返回 Timestamp 物件
const issue: Issue = {
  createdAt: doc.data()['created_at']  // ❌ Timestamp 物件而非 Date
};
```

**正確**:
```typescript
private toDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

const issue: Issue = {
  createdAt: this.toDate(doc.data()['created_at'])  // ✅ 轉換為 Date
};
```

### 2. ❌ 陷阱: 跨模組查詢時遺漏權限檢查

**錯誤**:
```typescript
// 其他模組直接查詢問題
const issues = await issueRepository.findBySource('tasks', taskId);  // ❌ 沒有權限檢查
```

**正確**:
```typescript
// 透過 Facade 查詢，自動包含權限檢查
const issues = await issueFacade.getIssuesBySource('tasks', taskId);  // ✅ 有權限檢查
```

### 3. ❌ 陷阱: 事件發布時機不正確

**錯誤**:
```typescript
async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
  // ❌ 在更新前發布事件
  this.eventBus.publish({ type: 'issue.updated', ... });
  await this.repository.update(id, updates);
}
```

**正確**:
```typescript
async updateIssue(id: string, updates: Partial<Issue>): Promise<void> {
  await this.repository.update(id, updates);
  // ✅ 在更新成功後發布事件
  this.eventBus.publish({ type: 'issue.updated', ... });
}
```

---

## ✅ 最終檢查清單

### Repository Layer
- [ ] 繼承 `FirestoreBaseRepository<T>`
- [ ] 實作 `collectionName`
- [ ] 實作 `toEntity` (snake_case → camelCase)
- [ ] 實作 `toDocument` (camelCase → snake_case)
- [ ] 所有操作使用 `executeWithRetry`
- [ ] 處理 Timestamp 轉換
- [ ] 處理 undefined 值
- [ ] 軟刪除使用 `deleted_at`
- [ ] 實作跨模組查詢方法

### Service/Facade Layer
- [ ] 注入 Repository, EventBus, PermissionService
- [ ] 使用 Signals 管理狀態
- [ ] 實作 Computed Signals
- [ ] 所有操作包含權限檢查
- [ ] 所有操作包含錯誤處理
- [ ] 所有操作發布事件
- [ ] 提供友善錯誤訊息
- [ ] 實作跨模組整合 API

### UI Layer
- [ ] 使用 `input()` / `output()`
- [ ] 使用 `inject()` 注入服務
- [ ] 使用 Signals 管理本地狀態
- [ ] 使用 `@if` / `@for` 新控制流
- [ ] 使用 OnPush 變更檢測
- [ ] ST 表格使用 `trackBy`
- [ ] 顯示載入與錯誤狀態
- [ ] 權限控制 UI 元素

### Security Rules
- [ ] Blueprint 成員資格檢查
- [ ] 權限陣列檢查
- [ ] 活躍狀態檢查
- [ ] 資料驗證規則
- [ ] 軟刪除過濾
- [ ] 單元測試覆蓋

### 跨模組整合
- [ ] 實作統一創建介面
- [ ] 實作事件通知機制
- [ ] 實作問題查詢 API
- [ ] 測試與各模組的整合

---

## 📚 參考資源

### 專案文檔
- [design.md](./design.md) - 問題模組設計概覽
- [架構總覽](../../../../docs/architecture(架構)/01-architecture-overview.md)
- [三層架構](../../../../docs/architecture(架構)/02-three-layer-architecture.md)
- [Repository 模式](../../../../.github/instructions/ng-gighub-firestore-repository.instructions.md)
- [Signals 狀態管理](../../../../.github/instructions/ng-gighub-signals-state.instructions.md)

### Firebase 文檔
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0
