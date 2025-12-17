# SETC-044: Defect Issue Integration

> **任務 ID**: SETC-044  
> **任務名稱**: Defect Issue Integration  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-043 (Defect Reinspection Service)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失與問題單整合服務

### 背景 / 目的
實作缺失與 Issue Module 的整合，嚴重缺失自動建立 Issue，狀態雙向同步。根據 SETC.md：嚴重缺失 → 自動建立問題單。

### 需求說明
1. 實作 DefectIssueIntegrationService
2. 嚴重缺失自動建立 Issue
3. 雙向狀態同步
4. 關聯追蹤
5. 統一處理流程

### In Scope / Out of Scope

#### ✅ In Scope
- DefectIssueIntegrationService 實作
- 自動建立 Issue
- 雙向狀態同步
- 關聯管理
- 事件整合

#### ❌ Out of Scope
- Issue Module 核心功能
- UI 元件

### 功能行為
將嚴重缺失與問題單系統整合，確保重要問題得到追蹤和處理。

### 資料 / API

#### DefectIssueIntegrationService

```typescript
@Injectable({ providedIn: 'root' })
export class DefectIssueIntegrationService {
  private defectRepository = inject(QCDefectRepository);
  private issueCreationService = inject(IssueCreationService);
  private issueRepository = inject(IssueRepository);
  private eventBus = inject(BlueprintEventBusService);

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 設定事件監聽
   */
  private setupEventListeners(): void {
    // 監聽嚴重缺失建立
    this.eventBus.on(SystemEventType.QC_DEFECT_CREATED, async (event) => {
      if (event.data.severity === 'critical') {
        await this.autoCreateIssueFromDefect(event.data.defectId, event.actor);
      }
    });

    // 監聽 Issue 狀態變更
    this.eventBus.on(SystemEventType.ISSUE_RESOLVED, async (event) => {
      if (event.data.sourceType === 'qc_defect') {
        await this.handleIssueResolved(event);
      }
    });

    this.eventBus.on(SystemEventType.ISSUE_VERIFIED, async (event) => {
      if (event.data.sourceType === 'qc_defect') {
        await this.handleIssueVerified(event);
      }
    });
  }

  /**
   * 從缺失自動建立 Issue
   */
  async autoCreateIssueFromDefect(
    defectId: string,
    actor: EventActor
  ): Promise<Issue> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    const issue = await this.issueCreationService.autoCreateFromQC({
      defectId: defect.id,
      blueprintId: defect.blueprintId,
      taskId: defect.taskId,
      title: `品檢缺失: ${defect.defectNumber}`,
      description: defect.description,
      severity: this.mapSeverity(defect.severity),
      location: defect.location,
      photos: defect.photos,
      sourceType: 'qc_defect',
      sourceId: defect.id
    });

    // 更新缺失關聯的 Issue
    await this.defectRepository.update(defect.blueprintId, defectId, {
      issueId: issue.id,
      hasLinkedIssue: true
    });

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CREATED_FROM_QC,
      blueprintId: defect.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        issueId: issue.id,
        defectId: defect.id,
        severity: defect.severity
      }
    });

    return issue;
  }

  /**
   * 手動建立 Issue 關聯
   */
  async linkDefectToIssue(
    defectId: string,
    issueId: string,
    actor: EventActor
  ): Promise<void> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    await this.defectRepository.update(defect.blueprintId, defectId, {
      issueId,
      hasLinkedIssue: true,
      updatedBy: actor.userId
    });

    await this.issueRepository.update(defect.blueprintId, issueId, {
      sourceType: 'qc_defect',
      sourceId: defectId
    });
  }

  /**
   * 處理 Issue 解決
   */
  private async handleIssueResolved(event: BlueprintEvent): Promise<void> {
    const { sourceId, issueId } = event.data;
    
    // 更新缺失狀態
    const defect = await this.defectRepository.getById(sourceId);
    if (defect && defect.issueId === issueId) {
      await this.defectRepository.update(defect.blueprintId, sourceId, {
        issueStatus: 'resolved',
        updatedBy: event.actor.userId
      });
    }
  }

  /**
   * 處理 Issue 驗證通過
   */
  private async handleIssueVerified(event: BlueprintEvent): Promise<void> {
    const { sourceId, issueId } = event.data;
    
    const defect = await this.defectRepository.getById(sourceId);
    if (defect && defect.issueId === issueId) {
      // Issue 驗證通過可以觸發缺失驗證
      await this.defectRepository.update(defect.blueprintId, sourceId, {
        issueStatus: 'verified',
        status: 'verified',
        updatedBy: event.actor.userId
      });
    }
  }

  /**
   * 取得關聯 Issue
   */
  async getLinkedIssue(defectId: string): Promise<Issue | null> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect?.issueId) return null;
    
    return this.issueRepository.getById(defect.blueprintId, defect.issueId);
  }

  /**
   * 取得關聯缺失
   */
  async getLinkedDefect(issueId: string): Promise<QCDefect | null> {
    const issue = await this.issueRepository.getById('', issueId);
    if (!issue?.sourceId || issue.sourceType !== 'qc_defect') return null;
    
    return this.defectRepository.getById(issue.sourceId);
  }

  /**
   * 同步狀態
   */
  async syncStatus(defectId: string): Promise<void> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect?.issueId) return;

    const issue = await this.issueRepository.getById(
      defect.blueprintId,
      defect.issueId
    );
    if (!issue) return;

    // 根據優先級決定同步方向
    const statusMapping: Record<string, string> = {
      'open': 'open',
      'in_progress': 'in_progress',
      'resolved': 'resolved',
      'verified': 'verified',
      'closed': 'closed'
    };

    const issueStatus = statusMapping[defect.status];
    if (issueStatus && issue.status !== issueStatus) {
      await this.issueRepository.update(
        defect.blueprintId,
        defect.issueId,
        { status: issueStatus }
      );
    }
  }

  private mapSeverity(defectSeverity: DefectSeverity): IssueSeverity {
    const mapping: Record<DefectSeverity, IssueSeverity> = {
      critical: 'critical',
      major: 'high',
      minor: 'medium'
    };
    return mapping[defectSeverity];
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/services/`
- Issue Module 整合

### 驗收條件
1. ✅ 嚴重缺失自動建立 Issue
2. ✅ 雙向狀態同步
3. ✅ 關聯追蹤正確
4. ✅ 事件整合正常
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢事件驅動整合模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **整合策略**
   - 事件驅動
   - 雙向同步

2. **狀態映射**
   - 缺失狀態 ↔ Issue 狀態

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── DefectIssueIntegrationService 實作
├── 自動建立 Issue
└── 事件監聽

Day 2 (8 hours):
├── 狀態同步
├── 關聯管理
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/qa/services/defect-issue-integration.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/defect-issue-integration.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 自動建立正常
- [ ] 狀態同步正確
- [ ] 事件整合正常

### 測試檢查
- [ ] 整合測試通過
