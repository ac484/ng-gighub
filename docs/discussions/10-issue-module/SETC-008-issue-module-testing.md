# SETC-008: Issue Module Testing

> **任務 ID**: SETC-008  
> **任務名稱**: Issue Module Testing & Integration  
> **優先級**: P1 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-007 (Issue UI Components)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單模組測試與整合驗證

### 背景 / 目的
對 Issue Module 進行完整的測試，確保與 Blueprint 系統及其他模組（Acceptance、QA、Warranty）正確整合。

### 需求說明
1. 單元測試套件
2. 整合測試
3. E2E 測試（關鍵流程）
4. 跨模組整合驗證
5. 文檔完成

### In Scope / Out of Scope

#### ✅ In Scope
- 單元測試
- 整合測試
- E2E 測試
- 跨模組驗證
- 文檔更新

#### ❌ Out of Scope
- 壓力測試
- 安全測試

### 功能行為
驗證問題單模組的完整功能。

### 資料 / API

#### 整合測試

```typescript
describe('Issue Module Integration', () => {
  let issueCreationService: IssueCreationService;
  let issueManagementService: IssueManagementService;
  let issueResolutionService: IssueResolutionService;
  let issueVerificationService: IssueVerificationService;
  let eventBus: BlueprintEventBusService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        IssueCreationService,
        IssueManagementService,
        IssueResolutionService,
        IssueVerificationService,
        BlueprintEventBusService
      ]
    }).compileComponents();

    issueCreationService = TestBed.inject(IssueCreationService);
    issueManagementService = TestBed.inject(IssueManagementService);
    issueResolutionService = TestBed.inject(IssueResolutionService);
    issueVerificationService = TestBed.inject(IssueVerificationService);
    eventBus = TestBed.inject(BlueprintEventBusService);
  });

  describe('Complete Issue Flow', () => {
    it('should complete: create → assign → resolve → verify → close', async () => {
      // 1. 建立問題單
      const issue = await issueCreationService.createManual({
        blueprintId: testBlueprintId,
        title: 'Test Issue',
        description: 'Test description',
        location: 'A區',
        severity: 'major',
        category: 'quality',
        responsibleParty: 'Contractor A'
      }, testActor);
      
      expect(issue.status).toBe('open');
      expect(issue.issueNumber).toBeDefined();

      // 2. 指派
      const assigned = await issueManagementService.assign(
        issue.id,
        'assigned-user-id',
        testActor
      );
      expect(assigned.assignedTo).toBe('assigned-user-id');
      expect(assigned.status).toBe('in_progress');

      // 3. 開始處理
      await issueResolutionService.startProgress(issue.id, testActor);

      // 4. 提交解決
      const resolved = await issueResolutionService.submitResolution(
        issue.id,
        {
          description: 'Fixed the issue',
          method: 'Standard repair',
          photos: []
        },
        testActor
      );
      expect(resolved.status).toBe('resolved');
      expect(resolved.resolution).toBeDefined();

      // 5. 驗證通過
      const verified = await issueVerificationService.verify(
        issue.id,
        { result: 'pass', notes: 'Verified OK' },
        testActor
      );
      expect(verified.status).toBe('verified');

      // 6. 結案
      const closed = await issueVerificationService.close(
        issue.id,
        testActor,
        'Issue resolved successfully'
      );
      expect(closed.status).toBe('closed');
    });

    it('should handle verification failure and re-resolution', async () => {
      // Setup: resolved issue
      const issue = await createResolvedIssue();

      // Verify - fail
      const failed = await issueVerificationService.verify(
        issue.id,
        { result: 'fail', notes: 'Not properly fixed' },
        testActor
      );
      expect(failed.status).toBe('in_progress');

      // Re-resolve
      const reResolved = await issueResolutionService.submitResolution(
        issue.id,
        {
          description: 'Fixed again',
          method: 'Enhanced repair',
          photos: []
        },
        testActor
      );
      expect(reResolved.status).toBe('resolved');

      // Verify - pass
      const verified = await issueVerificationService.verify(
        issue.id,
        { result: 'pass' },
        testActor
      );
      expect(verified.status).toBe('verified');
    });
  });

  describe('Auto-Creation from Sources', () => {
    it('should create issue from acceptance rejection', async () => {
      const events: any[] = [];
      eventBus.on('*', (e) => events.push(e));

      const issue = await issueCreationService.autoCreateFromAcceptance({
        blueprintId: testBlueprintId,
        acceptanceId: 'test-acceptance-id',
        itemDescription: 'Failed item',
        description: 'Quality issue',
        location: 'B區',
        severity: 'major',
        responsibleParty: 'Contractor B'
      });

      expect(issue.source).toBe('acceptance');
      expect(issue.sourceId).toBe('test-acceptance-id');
      expect(events.some(e => 
        e.type === SystemEventType.ISSUE_CREATED_FROM_ACCEPTANCE)
      ).toBeTruthy();
    });

    it('should create issue from QC critical defect', async () => {
      const issue = await issueCreationService.autoCreateFromQC({
        blueprintId: testBlueprintId,
        defectId: 'test-defect-id',
        title: 'Critical QC Defect',
        description: 'Structural issue',
        location: 'C區',
        severity: 'critical'
      });

      expect(issue.source).toBe('qc');
      expect(issue.severity).toBe('critical');
    });

    it('should create issue from warranty critical defect', async () => {
      const issue = await issueCreationService.autoCreateFromWarranty({
        blueprintId: testBlueprintId,
        warrantyId: 'test-warranty-id',
        defectId: 'test-warranty-defect-id',
        description: 'Major warranty issue',
        location: 'D區',
        severity: 'critical'
      });

      expect(issue.source).toBe('warranty');
      expect(issue.category).toBe('warranty');
    });
  });

  describe('Event Integration', () => {
    it('should emit correct events throughout issue lifecycle', async () => {
      const events: string[] = [];
      
      eventBus.on('*', (event) => {
        if (event.type.startsWith('issue')) {
          events.push(event.type);
        }
      });

      const issue = await issueCreationService.createManual(testIssueData, testActor);
      await issueResolutionService.startProgress(issue.id, testActor);
      await issueResolutionService.submitResolution(
        issue.id,
        testResolutionData,
        testActor
      );
      await issueVerificationService.verify(
        issue.id,
        { result: 'pass' },
        testActor
      );
      await issueVerificationService.close(issue.id, testActor);

      expect(events).toContain(SystemEventType.ISSUE_CREATED);
      expect(events).toContain(SystemEventType.ISSUE_RESOLVED);
      expect(events).toContain(SystemEventType.ISSUE_VERIFIED);
      expect(events).toContain(SystemEventType.ISSUE_CLOSED);
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', async () => {
      // Create issues with different statuses and severities
      await createMultipleIssues();

      const stats = await issueManagementService.getStatistics(testBlueprintId);

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.bySource).toBeDefined();
    });
  });
});
```

#### E2E 測試

```typescript
// e2e/issue.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Issue Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should display issue list', async ({ page }) => {
    await page.goto('/issue');
    await expect(page.locator('st')).toBeVisible();
  });

  test('should create issue', async ({ page }) => {
    await page.goto('/issue');
    
    await page.click('text=新增問題單');
    
    await page.fill('[id="title"]', 'Test Issue');
    await page.fill('[id="description"]', 'Test description');
    await page.fill('[id="location"]', 'A區');
    await page.click('[id="severity"]');
    await page.click('text=重要');
    await page.click('[id="category"]');
    await page.click('text=品質');
    await page.fill('[id="responsibleParty"]', 'Test Contractor');
    
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Test Issue')).toBeVisible();
  });

  test('should complete issue workflow', async ({ page }) => {
    await page.goto('/issue');
    
    // Click on an open issue
    await page.click('.ant-table-row:has-text("待處理")');
    
    // Resolve
    await page.click('text=解決');
    await page.fill('[id="description"]', 'Fixed the issue');
    await page.fill('[id="method"]', 'Standard repair');
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // Verify
    await page.click('text=驗證');
    await page.click('text=通過');
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('should filter issues by status', async ({ page }) => {
    await page.goto('/issue');
    
    await page.click('text=待處理');
    await expect(page.locator('.ant-table-row')).toHaveCount.greaterThan(0);
    
    await page.click('text=已結案');
    // Verify filter applied
  });
});
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/issue/`
- `e2e/issue.spec.ts`

### 驗收條件
1. ✅ 單元測試覆蓋率 > 80%
2. ✅ 整合測試通過
3. ✅ E2E 測試通過
4. ✅ 跨模組整合驗證
5. ✅ 文檔完成

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular 測試與 Playwright E2E

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **測試範圍**
   - 核心服務測試
   - 事件整合測試
   - UI 元件測試

2. **測試資料**
   - 測試 Fixtures
   - Mock 服務

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 單元測試
├── 整合測試
└── 服務測試

Day 2 (8 hours):
├── E2E 測試
├── 跨模組驗證
└── 文檔完成
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/issue/issue.integration.spec.ts`
- `e2e/issue.spec.ts`
- `src/app/core/blueprint/modules/implementations/issue/README.md`

---

## ✅ 檢查清單

### 測試檢查
- [ ] 單元測試覆蓋 > 80%
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 跨模組驗證

### 文檔檢查
- [ ] README 完整
- [ ] API 文檔更新
