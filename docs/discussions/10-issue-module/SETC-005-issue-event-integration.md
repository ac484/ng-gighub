# SETC-005: Issue Event Integration

> **任務 ID**: SETC-005  
> **任務名稱**: Issue Event Integration  
> **優先級**: P1 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-004 (Issue Resolution & Verification)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單事件總線整合

### 背景 / 目的
將 Issue Module 與 BlueprintEventBus 整合，實現事件驅動的問題單管理流程，與其他模組（Acceptance、QA、Warranty）進行事件互動。

### 需求說明
1. 定義問題單相關事件類型
2. 實作 IssueEventService
3. 訂閱其他模組事件
4. 發送問題單相關事件
5. 跨模組狀態同步

### In Scope / Out of Scope

#### ✅ In Scope
- 事件類型定義
- IssueEventService 實作
- 事件訂閱與發送
- 跨模組事件整合

#### ❌ Out of Scope
- UI 元件（SETC-007）

### 功能行為
透過事件總線整合問題單模組，實現自動化流程觸發和跨模組通訊。

### 資料 / API

#### 問題單相關事件類型

```typescript
// 在 SystemEventType 中確認/新增
export enum SystemEventType {
  // Issue Events
  ISSUE_CREATED = 'issue.created',
  ISSUE_CREATED_FROM_ACCEPTANCE = 'issue.created_from_acceptance',
  ISSUE_CREATED_FROM_QC = 'issue.created_from_qc',
  ISSUE_CREATED_FROM_WARRANTY = 'issue.created_from_warranty',
  ISSUE_UPDATED = 'issue.updated',
  ISSUE_ASSIGNED = 'issue.assigned',
  ISSUE_RESOLVED = 'issue.resolved',
  ISSUE_VERIFIED = 'issue.verified',
  ISSUE_VERIFICATION_FAILED = 'issue.verification_failed',
  ISSUE_CLOSED = 'issue.closed',
  ISSUE_REOPENED = 'issue.reopened',
}
```

#### IssueEventService

```typescript
@Injectable({ providedIn: 'root' })
export class IssueEventService implements OnDestroy {
  private eventBus = inject(BlueprintEventBusService);
  private issueCreationService = inject(IssueCreationService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 設定事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽驗收不通過事件 → 自動建立 Issue
    this.eventBus.on(
      SystemEventType.ACCEPTANCE_REJECTED,
      async (event) => {
        if (event.data.createIssue) {
          await this.handleAcceptanceRejected(event);
        }
      }
    );

    // 監聽 QC 嚴重缺失 → 自動建立 Issue
    this.eventBus.on(
      SystemEventType.QC_DEFECT_CREATED,
      async (event) => {
        if (event.data.severity === 'critical') {
          await this.handleCriticalQCDefect(event);
        }
      }
    );

    // 監聯保固嚴重缺失 → 自動建立 Issue
    this.eventBus.on(
      SystemEventType.WARRANTY_DEFECT_REPORTED,
      async (event) => {
        if (event.data.severity === 'critical') {
          await this.handleCriticalWarrantyDefect(event);
        }
      }
    );
  }

  /**
   * 處理驗收不通過
   */
  private async handleAcceptanceRejected(event: BlueprintEvent): Promise<void> {
    const { acceptanceId, rejectedItems, blueprintId } = event.data;
    
    for (const item of rejectedItems) {
      try {
        await this.issueCreationService.autoCreateFromAcceptance({
          blueprintId,
          acceptanceId,
          itemDescription: item.description,
          description: item.rejectionReason,
          location: item.location,
          severity: this.determineSeverity(item),
          responsibleParty: item.responsibleParty,
          photos: item.photos
        });
      } catch (error) {
        console.error('Failed to create issue from acceptance:', error);
        this.emitError('issue.creation_from_acceptance_failed', event, error);
      }
    }
  }

  /**
   * 處理嚴重 QC 缺失
   */
  private async handleCriticalQCDefect(event: BlueprintEvent): Promise<void> {
    const { defectId, blueprintId, description, location } = event.data;
    
    try {
      await this.issueCreationService.autoCreateFromQC({
        blueprintId,
        defectId,
        title: `嚴重品檢缺失: ${description.substring(0, 30)}`,
        description,
        location,
        severity: 'critical',
        photos: event.data.photos
      });
    } catch (error) {
      console.error('Failed to create issue from QC defect:', error);
      this.emitError('issue.creation_from_qc_failed', event, error);
    }
  }

  /**
   * 處理嚴重保固缺失
   */
  private async handleCriticalWarrantyDefect(event: BlueprintEvent): Promise<void> {
    const { defectId, warrantyId, blueprintId, description, location } = event.data;
    
    try {
      await this.issueCreationService.autoCreateFromWarranty({
        blueprintId,
        warrantyId,
        defectId,
        description,
        location,
        severity: 'critical',
        photos: event.data.photos
      });
    } catch (error) {
      console.error('Failed to create issue from warranty defect:', error);
      this.emitError('issue.creation_from_warranty_failed', event, error);
    }
  }

  /**
   * 發送問題單事件
   */
  emitIssueEvent(
    type: keyof typeof IssueEventTypes,
    issue: Issue,
    actor: EventActor,
    additionalData?: any
  ): void {
    this.eventBus.emit({
      type: IssueEventTypes[type],
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        issueId: issue.id,
        issueNumber: issue.issueNumber,
        severity: issue.severity,
        status: issue.status,
        source: issue.source,
        sourceId: issue.sourceId,
        ...additionalData
      }
    });
  }

  /**
   * 通知來源模組狀態變更
   */
  async notifySourceModule(
    issue: Issue,
    newStatus: IssueStatus
  ): Promise<void> {
    if (!issue.sourceId) return;

    const eventType = this.getSourceUpdateEventType(issue.source);
    if (eventType) {
      this.eventBus.emit({
        type: eventType,
        blueprintId: issue.blueprintId,
        timestamp: new Date(),
        actor: this.getSystemActor(),
        data: {
          issueId: issue.id,
          sourceType: issue.source,
          sourceId: issue.sourceId,
          issueStatus: newStatus
        }
      });
    }
  }

  private getSourceUpdateEventType(source: IssueSource): string | null {
    const mapping: Record<IssueSource, string | null> = {
      manual: null,
      acceptance: 'acceptance.issue_status_changed',
      qc: 'qc.defect_issue_status_changed',
      warranty: 'warranty.defect_issue_status_changed',
      safety: 'safety.issue_status_changed'
    };
    return mapping[source];
  }

  private determineSeverity(item: any): IssueSeverity {
    if (item.isStructural || item.isSafety) return 'critical';
    if (item.isWaterproofing || item.isElectrical) return 'major';
    return 'minor';
  }

  private emitError(type: string, originalEvent: BlueprintEvent, error: any): void {
    this.eventBus.emit({
      type: 'system.error',
      blueprintId: originalEvent.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: {
        errorType: type,
        originalEventType: originalEvent.type,
        error: error.message
      }
    });
  }

  private getSystemActor(): EventActor {
    return { userId: 'system', userName: 'System', role: 'system' };
  }

  ngOnDestroy(): void {
    // Cleanup handled by takeUntilDestroyed
  }
}
```

#### 事件流程圖

```
驗收不通過 (ACCEPTANCE_REJECTED)
    ↓
自動建立問題單 (ISSUE_CREATED_FROM_ACCEPTANCE)
    
QC 嚴重缺失 (QC_DEFECT_CREATED, severity=critical)
    ↓
自動建立問題單 (ISSUE_CREATED_FROM_QC)
    
保固嚴重缺失 (WARRANTY_DEFECT_REPORTED, severity=critical)
    ↓
自動建立問題單 (ISSUE_CREATED_FROM_WARRANTY)
    
問題單解決 (ISSUE_RESOLVED)
    ↓
通知來源模組 (xxx.issue_status_changed)
    
問題單驗證 (ISSUE_VERIFIED)
    ↓
同步來源模組狀態
    
問題單結案 (ISSUE_CLOSED)
    ↓
更新來源模組
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/issue/services/`
- `src/app/core/blueprint/events/types/`

### 驗收條件
1. ✅ 事件類型定義完整
2. ✅ 驗收不通過自動建立問題單
3. ✅ QC/保固嚴重缺失自動建立問題單
4. ✅ 來源模組狀態同步
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 RxJS 事件處理與記憶體管理

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **事件定義**
   - 問題單生命週期事件
   - 來源整合事件

2. **事件訂閱**
   - 驗收、QC、保固事件
   - 自動建立觸發

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 事件類型定義
├── IssueEventService 實作
└── 事件訂閱

Day 2 (8 hours):
├── 來源模組事件處理
├── 狀態同步
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/issue/services/issue-event.service.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-event.service.spec.ts`

**修改檔案**:
- `src/app/core/blueprint/events/types/system-event-type.enum.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 事件定義完整
- [ ] 自動建立正常
- [ ] 狀態同步正確

### 測試檢查
- [ ] 事件處理測試
