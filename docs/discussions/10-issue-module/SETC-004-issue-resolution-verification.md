# SETC-004: Issue Resolution Verification Service

> **任務 ID**: SETC-004  
> **任務名稱**: Issue Resolution & Verification Service  
> **優先級**: P1 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-003 (Issue Core Services)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單解決與驗證服務實作

### 背景 / 目的
實作問題單的解決與驗證流程服務，包括解決方案記錄、驗證執行、通過/不通過處理。根據 SETC.md：問題單解決 → 解決驗證 → 結案。

### 需求說明
1. 實作 IssueResolutionService
2. 實作 IssueVerificationService
3. 解決方案記錄
4. 驗證流程
5. 結案處理

### In Scope / Out of Scope

#### ✅ In Scope
- IssueResolutionService 實作
- IssueVerificationService 實作
- 解決方案記錄
- 驗證流程
- 結案處理

#### ❌ Out of Scope
- 事件整合（SETC-005）
- UI 元件（SETC-007）

### 功能行為
管理問題單的解決與驗證流程，確保問題得到正確處理。

### 資料 / API

#### IssueResolutionService

```typescript
@Injectable({ providedIn: 'root' })
export class IssueResolutionService {
  private issueRepository = inject(IssueRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 開始處理問題單
   */
  async startProgress(
    issueId: string,
    actor: EventActor
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    IssueStateMachine.validateTransition(issue.status, 'in_progress');

    await this.issueRepository.update(issue.blueprintId, issueId, {
      status: 'in_progress',
      progressStartedAt: new Date(),
      updatedBy: actor.userId
    });

    return { ...issue, status: 'in_progress' };
  }

  /**
   * 提交解決方案
   */
  async submitResolution(
    issueId: string,
    data: SubmitResolutionDto,
    actor: EventActor
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    IssueStateMachine.validateTransition(issue.status, 'resolved');

    const resolution: IssueResolution = {
      description: data.description,
      method: data.method,
      resolvedBy: actor.userId,
      resolvedByName: actor.userName,
      resolvedAt: new Date(),
      photos: data.photos ?? [],
      documents: data.documents ?? [],
      cost: data.cost,
      notes: data.notes
    };

    await this.issueRepository.update(issue.blueprintId, issueId, {
      status: 'resolved',
      resolution,
      afterPhotos: data.photos ?? [],
      updatedBy: actor.userId
    });

    this.eventBus.emit({
      type: SystemEventType.ISSUE_RESOLVED,
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        issueId,
        sourceType: issue.source,
        sourceId: issue.sourceId
      }
    });

    return { ...issue, status: 'resolved', resolution };
  }

  /**
   * 取得解決報表
   */
  async getResolutionReport(blueprintId: string): Promise<ResolutionReport> {
    const issues = await this.issueRepository.getByBlueprintId(blueprintId);
    const resolved = issues.filter(i => 
      ['resolved', 'verified', 'closed'].includes(i.status)
    );

    const avgResolutionTime = this.calculateAverageResolutionTime(resolved);

    return {
      totalResolved: resolved.length,
      averageResolutionDays: avgResolutionTime,
      resolvedBySeverity: {
        critical: resolved.filter(i => i.severity === 'critical').length,
        major: resolved.filter(i => i.severity === 'major').length,
        minor: resolved.filter(i => i.severity === 'minor').length
      },
      totalCost: resolved.reduce((sum, i) => sum + (i.resolution?.cost ?? 0), 0)
    };
  }

  private calculateAverageResolutionTime(issues: Issue[]): number {
    if (issues.length === 0) return 0;
    
    const totalDays = issues.reduce((sum, issue) => {
      if (!issue.resolution?.resolvedAt || !issue.createdAt) return sum;
      const days = (issue.resolution.resolvedAt.getTime() - issue.createdAt.getTime()) 
        / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / issues.length);
  }
}
```

#### IssueVerificationService

```typescript
@Injectable({ providedIn: 'root' })
export class IssueVerificationService {
  private issueRepository = inject(IssueRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 驗證解決方案
   */
  async verify(
    issueId: string,
    data: VerifyIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    if (issue.status !== 'resolved') {
      throw new Error(`Issue must be resolved before verification: ${issue.status}`);
    }

    const passed = data.result === 'pass';
    const newStatus = passed ? 'verified' : 'in_progress';

    const verification: IssueVerification = {
      result: data.result,
      verifiedBy: actor.userId,
      verifiedByName: actor.userName,
      verifiedAt: new Date(),
      notes: data.notes,
      photos: data.photos
    };

    await this.issueRepository.update(issue.blueprintId, issueId, {
      status: newStatus,
      verification: passed ? verification : undefined,
      verificationHistory: [
        ...(issue.verificationHistory ?? []),
        verification
      ],
      updatedBy: actor.userId
    });

    this.eventBus.emit({
      type: passed ? SystemEventType.ISSUE_VERIFIED : 'issue.verification_failed',
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        issueId,
        result: data.result,
        sourceType: issue.source,
        sourceId: issue.sourceId
      }
    });

    return { ...issue, status: newStatus };
  }

  /**
   * 結案
   */
  async close(
    issueId: string,
    actor: EventActor,
    notes?: string
  ): Promise<Issue> {
    const issue = await this.issueRepository.getById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    if (issue.status !== 'verified') {
      throw new Error(`Issue must be verified before closing: ${issue.status}`);
    }

    await this.issueRepository.update(issue.blueprintId, issueId, {
      status: 'closed',
      closedAt: new Date(),
      closedBy: actor.userId,
      closingNotes: notes,
      updatedBy: actor.userId
    });

    this.eventBus.emit({
      type: SystemEventType.ISSUE_CLOSED,
      blueprintId: issue.blueprintId,
      timestamp: new Date(),
      actor,
      data: { issueId }
    });

    return { ...issue, status: 'closed' };
  }

  /**
   * 取得驗證統計
   */
  async getVerificationStatistics(blueprintId: string): Promise<VerificationStats> {
    const issues = await this.issueRepository.getByBlueprintId(blueprintId);
    const withVerification = issues.filter(i => i.verificationHistory?.length);

    const passCount = withVerification.filter(i => 
      i.verificationHistory?.some(v => v.result === 'pass')
    ).length;

    const failCount = withVerification.reduce((sum, i) => 
      sum + (i.verificationHistory?.filter(v => v.result === 'fail').length ?? 0), 0
    );

    return {
      totalVerified: issues.filter(i => i.status === 'verified' || i.status === 'closed').length,
      verificationPassRate: withVerification.length > 0 
        ? (passCount / withVerification.length) * 100 
        : 0,
      averageVerificationAttempts: withVerification.length > 0
        ? withVerification.reduce((sum, i) => sum + (i.verificationHistory?.length ?? 0), 0) / withVerification.length
        : 0,
      failureCount: failCount
    };
  }
}
```

#### 相關介面

```typescript
export interface SubmitResolutionDto {
  description: string;
  method: string;
  photos?: FileAttachment[];
  documents?: FileAttachment[];
  cost?: number;
  notes?: string;
}

export interface VerifyIssueDto {
  result: 'pass' | 'fail';
  notes?: string;
  photos?: FileAttachment[];
}

export interface IssueResolution {
  description: string;
  method: string;
  resolvedBy: string;
  resolvedByName: string;
  resolvedAt: Date;
  photos: FileAttachment[];
  documents: FileAttachment[];
  cost?: number;
  notes?: string;
}

export interface IssueVerification {
  result: 'pass' | 'fail';
  verifiedBy: string;
  verifiedByName: string;
  verifiedAt: Date;
  notes?: string;
  photos?: FileAttachment[];
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/issue/services/`

### 驗收條件
1. ✅ 解決方案提交正常
2. ✅ 驗證流程完整
3. ✅ 通過/不通過處理正確
4. ✅ 結案流程正確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢問題解決流程最佳實踐

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **解決流程**
   - 開始處理 → 提交解決 → 驗證

2. **驗證流程**
   - 通過 → 結案
   - 不通過 → 重新處理

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── IssueResolutionService 實作
├── 解決方案記錄
└── 報表功能

Day 2 (8 hours):
├── IssueVerificationService 實作
├── 驗證流程
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/issue/services/issue-resolution.service.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-resolution.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-verification.service.ts`
- `src/app/core/blueprint/modules/implementations/issue/services/issue-verification.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 解決方案提交正常
- [ ] 驗證流程完整
- [ ] 結案正確

### 測試檢查
- [ ] 單元測試覆蓋
