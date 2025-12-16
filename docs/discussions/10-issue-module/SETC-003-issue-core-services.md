# SETC-003: Issue Core Services

> **任務 ID**: SETC-003  
> **任務名稱**: Issue Core Services Implementation  
> **優先級**: P1 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-002 (Issue Repository Layer)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單核心服務實作

### 背景 / 目的
實作 Issue Module 的核心服務層，包括 IssueCreationService、IssueManagementService，提供問題單的建立、更新、狀態管理等核心功能。

### 需求說明
1. 實作 IssueCreationService
2. 實作 IssueManagementService
3. 狀態機管理
4. 事件發送
5. 與來源模組整合準備

### In Scope / Out of Scope

#### ✅ In Scope
- IssueCreationService 實作
- IssueManagementService 實作
- 狀態機管理
- 事件發送
- 單元測試

#### ❌ Out of Scope
- 解決與驗證服務（SETC-004）
- UI 元件（SETC-007）

### 功能行為
提供問題單的核心建立與管理功能。

### 資料 / API

#### IssueCreationService

```typescript
@Injectable({ providedIn: 'root' })
export class IssueCreationService {
  private issueRepository = inject(IssueRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 手動建立問題單
   */
  async createManual(
    data: CreateIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    const issue: Omit<Issue, 'id'> = {
      blueprintId: data.blueprintId,
      issueNumber: this.generateIssueNumber(),
      source: 'manual',
      sourceId: null,
      title: data.title,
      description: data.description,
      location: data.location,
      severity: data.severity,
      category: data.category,
      responsibleParty: data.responsibleParty,
      assignedTo: data.assignedTo,
      status: 'open',
      beforePhotos: data.beforePhotos ?? [],
      afterPhotos: [],
      createdBy: actor.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.issueRepository.create(issue);

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CREATED,
      blueprintId: data.blueprintId,
      timestamp: new Date(),
      actor,
      data: { issueId: created.id, source: 'manual' }
    });

    return created;
  }

  /**
   * 從驗收建立問題單
   */
  async autoCreateFromAcceptance(
    data: CreateFromAcceptanceDto
  ): Promise<Issue> {
    const issue: Omit<Issue, 'id'> = {
      blueprintId: data.blueprintId,
      issueNumber: this.generateIssueNumber(),
      source: 'acceptance',
      sourceId: data.acceptanceId,
      title: `驗收問題: ${data.itemDescription}`,
      description: data.description,
      location: data.location,
      severity: data.severity,
      category: 'quality',
      responsibleParty: data.responsibleParty,
      status: 'open',
      beforePhotos: data.photos ?? [],
      afterPhotos: [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.issueRepository.create(issue);

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CREATED_FROM_ACCEPTANCE,
      blueprintId: data.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: { issueId: created.id, acceptanceId: data.acceptanceId }
    });

    return created;
  }

  /**
   * 從 QC 缺失建立問題單
   */
  async autoCreateFromQC(data: CreateFromQCDto): Promise<Issue> {
    const issue: Omit<Issue, 'id'> = {
      blueprintId: data.blueprintId,
      issueNumber: this.generateIssueNumber(),
      source: 'qc',
      sourceId: data.defectId,
      title: data.title,
      description: data.description,
      location: data.location,
      severity: data.severity,
      category: 'quality',
      responsibleParty: data.responsibleParty ?? '',
      status: 'open',
      beforePhotos: data.photos ?? [],
      afterPhotos: [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.issueRepository.create(issue);

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CREATED_FROM_QC,
      blueprintId: data.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: { issueId: created.id, defectId: data.defectId }
    });

    return created;
  }

  /**
   * 從保固缺失建立問題單
   */
  async autoCreateFromWarranty(data: CreateFromWarrantyDto): Promise<Issue> {
    const issue: Omit<Issue, 'id'> = {
      blueprintId: data.blueprintId,
      issueNumber: this.generateIssueNumber(),
      source: 'warranty',
      sourceId: data.defectId,
      title: `保固問題: ${data.description.substring(0, 50)}`,
      description: data.description,
      location: data.location,
      severity: this.mapSeverity(data.severity),
      category: 'warranty',
      responsibleParty: '',
      status: 'open',
      beforePhotos: data.photos ?? [],
      afterPhotos: [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.issueRepository.create(issue);

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CREATED_FROM_WARRANTY,
      blueprintId: data.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: { issueId: created.id, warrantyId: data.warrantyId, defectId: data.defectId }
    });

    return created;
  }

  private generateIssueNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ISS-${timestamp}-${random}`;
  }

  private getSystemActor(): EventActor {
    return { userId: 'system', userName: 'System', role: 'system' };
  }
}
```

#### IssueManagementService

```typescript
@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private issueRepository = inject(IssueRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 更新問題單
   */
  async update(
    issueId: string,
    data: UpdateIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    await this.issueRepository.update(issue.blueprintId, issueId, {
      ...data,
      updatedBy: actor.userId,
      updatedAt: new Date()
    });

    this.eventBus.emit({
      type: SystemEventType.ISSUE_UPDATED,
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor,
      data: { issueId }
    });

    return { ...issue, ...data };
  }

  /**
   * 指派責任人
   */
  async assign(
    issueId: string,
    assignedTo: string,
    actor: EventActor
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    await this.issueRepository.update(issue.blueprintId, issueId, {
      assignedTo,
      status: issue.status === 'open' ? 'in_progress' : issue.status,
      updatedBy: actor.userId
    });

    return { ...issue, assignedTo };
  }

  /**
   * 取得問題單統計
   */
  async getStatistics(blueprintId: string): Promise<IssueStatistics> {
    const issues = await this.issueRepository.getByBlueprintId(blueprintId);

    return {
      total: issues.length,
      byStatus: {
        open: issues.filter(i => i.status === 'open').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        verified: issues.filter(i => i.status === 'verified').length,
        closed: issues.filter(i => i.status === 'closed').length
      },
      bySeverity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        major: issues.filter(i => i.severity === 'major').length,
        minor: issues.filter(i => i.severity === 'minor').length
      },
      bySource: {
        manual: issues.filter(i => i.source === 'manual').length,
        acceptance: issues.filter(i => i.source === 'acceptance').length,
        qc: issues.filter(i => i.source === 'qc').length,
        warranty: issues.filter(i => i.source === 'warranty').length
      }
    };
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/issue/services/`

### 驗收條件
1. ✅ 手動建立問題單正常
2. ✅ 從各來源自動建立正常
3. ✅ 狀態管理正確
4. ✅ 事件發送正確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular Service 最佳實踐

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **建立來源分類**
   - 手動建立
   - 驗收建立
   - QC 建立
   - 保固建立

2. **狀態管理**
   - 狀態機設計
   - 轉換規則

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── IssueCreationService 實作
├── 各來源建立方法
└── 事件發送

Day 2 (8 hours):
├── IssueManagementService 實作
├── 狀態管理
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/issue/services/issue-creation.service.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-creation.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-management.service.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-management.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 各來源建立正常
- [ ] 狀態管理正確
- [ ] 事件發送正確

### 測試檢查
- [ ] 單元測試覆蓋
