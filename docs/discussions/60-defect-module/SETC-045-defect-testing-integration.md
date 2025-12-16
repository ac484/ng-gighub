# SETC-045: Defect Testing & Integration

> **任務 ID**: SETC-045  
> **任務名稱**: Defect Testing & Integration  
> **優先級**: P1 (Important)  
> **預估工時**: 1 天  
> **依賴**: SETC-044 (Defect Issue Integration)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失管理測試與整合驗證

### 背景 / 目的
對 Defect Management 擴展進行完整測試，確保與 QA Module、Issue Module 正確整合。

### 需求說明
1. 整合測試套件
2. E2E 測試（關鍵流程）
3. Issue 整合驗證
4. 效能驗證
5. 文檔完成

### In Scope / Out of Scope

#### ✅ In Scope
- 整合測試
- E2E 測試
- Issue 整合驗證
- 文檔更新

#### ❌ Out of Scope
- 壓力測試

### 功能行為
驗證缺失管理擴展的完整功能。

### 資料 / API

#### 整合測試

```typescript
describe('Defect Management Integration', () => {
  let defectLifecycleService: DefectLifecycleService;
  let defectResolutionService: DefectResolutionService;
  let defectReinspectionService: DefectReinspectionService;
  let defectIssueIntegrationService: DefectIssueIntegrationService;
  let eventBus: BlueprintEventBusService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        DefectLifecycleService,
        DefectResolutionService,
        DefectReinspectionService,
        DefectIssueIntegrationService,
        BlueprintEventBusService
      ]
    }).compileComponents();

    defectLifecycleService = TestBed.inject(DefectLifecycleService);
    defectResolutionService = TestBed.inject(DefectResolutionService);
    defectReinspectionService = TestBed.inject(DefectReinspectionService);
    defectIssueIntegrationService = TestBed.inject(DefectIssueIntegrationService);
    eventBus = TestBed.inject(BlueprintEventBusService);
  });

  describe('Complete Defect Flow', () => {
    it('should complete: create → resolve → reinspect → close', async () => {
      // 1. 從 QC 失敗建立缺失
      const defects = await defectLifecycleService.autoCreateFromQCInspection(
        testInspection,
        testFailedItems,
        testActor
      );
      expect(defects.length).toBeGreaterThan(0);
      expect(defects[0].status).toBe('open');

      // 2. 指派責任人
      const assigned = await defectLifecycleService.assignResponsible(
        defects[0].id,
        'responsible-user-id',
        testActor
      );
      expect(assigned.status).toBe('assigned');

      // 3. 開始整改
      await defectResolutionService.startResolution(
        defects[0].id,
        { plan: 'Fix it', estimatedCompletionDate: new Date() },
        testActor
      );

      // 4. 完成整改
      const resolved = await defectResolutionService.completeResolution(
        defects[0].id,
        { description: 'Fixed', photos: [] },
        testActor
      );
      expect(resolved.status).toBe('resolved');

      // 5. 安排複驗
      const reinspection = await defectReinspectionService.scheduleReinspection(
        defects[0].id,
        { scheduledDate: new Date(), inspectorId: 'inspector-id' },
        testActor
      );
      expect(reinspection.status).toBe('scheduled');

      // 6. 執行複驗（通過）
      await defectReinspectionService.performReinspection(
        reinspection.id,
        { result: 'pass', notes: 'OK' },
        testActor
      );

      // 7. 結案
      const closed = await defectReinspectionService.closeDefect(
        defects[0].id,
        testActor
      );
      expect(closed.status).toBe('closed');
    });

    it('should handle failed reinspection', async () => {
      // Setup: defect in resolved state
      const defect = await createResolvedDefect();

      // Schedule and perform reinspection (fail)
      const reinspection = await defectReinspectionService.scheduleReinspection(
        defect.id,
        { scheduledDate: new Date(), inspectorId: 'inspector-id' },
        testActor
      );

      await defectReinspectionService.performReinspection(
        reinspection.id,
        { result: 'fail', notes: 'Still has issues' },
        testActor
      );

      // Verify defect goes back to in_progress
      const updated = await defectRepository.getById(defect.id);
      expect(updated.status).toBe('in_progress');
      expect(updated.reinspectionCount).toBe(1);
    });
  });

  describe('Issue Integration', () => {
    it('should auto-create issue for critical defect', async () => {
      const events: any[] = [];
      eventBus.on('*', (e) => events.push(e));

      const defects = await defectLifecycleService.autoCreateFromQCInspection(
        testInspection,
        [{ ...testFailedItem, severity: 'critical' }],
        testActor
      );

      expect(defects[0].issueId).toBeDefined();
      expect(events.some(e => e.type === SystemEventType.ISSUE_CREATED_FROM_QC))
        .toBeTruthy();
    });

    it('should sync status between defect and issue', async () => {
      // Create critical defect with issue
      const defect = await createCriticalDefect();
      const issue = await defectIssueIntegrationService.getLinkedIssue(defect.id);

      // Resolve defect
      await defectResolutionService.completeResolution(
        defect.id,
        { description: 'Fixed', photos: [] },
        testActor
      );

      // Sync status
      await defectIssueIntegrationService.syncStatus(defect.id);

      // Verify issue status
      const updatedIssue = await issueRepository.getById(issue.blueprintId, issue.id);
      expect(updatedIssue.status).toBe('resolved');
    });
  });

  describe('Statistics', () => {
    it('should calculate correct defect statistics', async () => {
      // Create multiple defects with different statuses
      await createMultipleDefects();

      const stats = await defectLifecycleService.getDefectStatistics(testBlueprintId);

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
    });
  });
});
```

#### E2E 測試

```typescript
// e2e/defect.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Defect Management E2E', () => {
  test('should complete defect workflow', async ({ page }) => {
    await page.goto('/qa/defects');
    
    // View defect list
    await expect(page.locator('st')).toBeVisible();
    
    // Click on a defect
    await page.click('.ant-table-row:first-child');
    
    // Start resolution
    await page.click('text=開始整改');
    await page.fill('[id="plan"]', 'Fix the issue');
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/`
- `e2e/defect.spec.ts`

### 驗收條件
1. ✅ 整合測試覆蓋率 > 80%
2. ✅ E2E 測試通過
3. ✅ Issue 整合驗證
4. ✅ 文檔完成

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/qa/defect.integration.spec.ts`
- `e2e/defect.spec.ts`
- `src/app/core/blueprint/modules/implementations/qa/README.md` (更新)

---

## ✅ 檢查清單

### 測試檢查
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] Issue 整合驗證

### 文檔檢查
- [ ] README 更新
