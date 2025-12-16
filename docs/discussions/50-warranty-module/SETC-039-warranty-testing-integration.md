# SETC-039: Warranty Testing & Integration

> **任務 ID**: SETC-039  
> **任務名稱**: Warranty Testing & Integration  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-038 (Warranty UI Components)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固模組測試與整合

### 背景 / 目的
對 Warranty Module 進行完整的測試，確保與 Blueprint 系統、Acceptance Module、Issue Module 正確整合。

### 需求說明
1. 單元測試套件
2. 整合測試
3. E2E 測試（關鍵流程）
4. Blueprint 整合驗證
5. 文檔更新

### In Scope / Out of Scope

#### ✅ In Scope
- 單元測試
- 整合測試
- E2E 測試
- Blueprint 整合
- 文檔更新

#### ❌ Out of Scope
- 壓力測試
- 安全測試

### 功能行為
驗證保固模組的完整功能，確保與系統其他模組正確整合。

### 資料 / API

#### 整合測試

```typescript
describe('Warranty Module Integration', () => {
  let warrantyPeriodService: WarrantyPeriodService;
  let warrantyDefectService: WarrantyDefectService;
  let warrantyRepairService: WarrantyRepairService;
  let eventBus: BlueprintEventBusService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        WarrantyPeriodService,
        WarrantyDefectService,
        WarrantyRepairService,
        BlueprintEventBusService
      ]
    }).compileComponents();

    warrantyPeriodService = TestBed.inject(WarrantyPeriodService);
    warrantyDefectService = TestBed.inject(WarrantyDefectService);
    warrantyRepairService = TestBed.inject(WarrantyRepairService);
    eventBus = TestBed.inject(BlueprintEventBusService);
  });

  describe('Complete Warranty Flow', () => {
    it('should create warranty from acceptance', async () => {
      const warranty = await warrantyPeriodService.autoCreateFromAcceptance(
        testAcceptanceId
      );
      
      expect(warranty.status).toBe('active');
      expect(warranty.periodInMonths).toBe(12);
    });

    it('should complete defect → repair → verification flow', async () => {
      // 1. 登記缺失
      const defect = await warrantyDefectService.reportDefect({
        warrantyId: testWarrantyId,
        blueprintId: testBlueprintId,
        description: 'Test defect',
        location: 'A區',
        category: 'structural',
        severity: 'major',
        reporterContact: '0912345678'
      }, testActor);
      expect(defect.status).toBe('reported');

      // 2. 確認缺失
      await warrantyDefectService.confirmDefect(
        testBlueprintId,
        testWarrantyId,
        defect.id,
        testActor
      );

      // 3. 建立維修
      const repair = await warrantyRepairService.createRepair({
        blueprintId: testBlueprintId,
        warrantyId: testWarrantyId,
        defectId: defect.id,
        description: 'Repair work',
        repairMethod: 'Standard repair',
        contractor: testContractor
      }, testActor);
      expect(repair.status).toBe('pending');

      // 4. 開始維修
      await warrantyRepairService.startRepair(
        testBlueprintId,
        testWarrantyId,
        repair.id,
        testActor
      );

      // 5. 完成維修
      await warrantyRepairService.completeRepair(
        testBlueprintId,
        testWarrantyId,
        repair.id,
        { photos: [], notes: 'Completed' },
        testActor
      );

      // 6. 驗收維修
      const verified = await warrantyRepairService.verifyRepair(
        testBlueprintId,
        testWarrantyId,
        repair.id,
        true,
        'Verified OK',
        testActor
      );
      expect(verified.status).toBe('verified');
    });

    it('should emit correct events', async () => {
      const events: string[] = [];
      
      eventBus.on('*', (event) => {
        if (event.type.startsWith('warranty')) {
          events.push(event.type);
        }
      });

      await warrantyDefectService.reportDefect(testDefectData, testActor);
      
      expect(events).toContain(SystemEventType.WARRANTY_DEFECT_REPORTED);
    });
  });

  describe('Issue Integration', () => {
    it('should create issue for critical defect', async () => {
      const defect = await warrantyDefectService.reportDefect({
        ...testDefectData,
        severity: 'critical'
      }, testActor);

      expect(defect.issueId).toBeDefined();
    });
  });
});
```

#### E2E 測試

```typescript
// e2e/warranty.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Warranty Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // ... login
  });

  test('should display warranty list', async ({ page }) => {
    await page.goto('/warranty');
    await expect(page.locator('st')).toBeVisible();
  });

  test('should report defect', async ({ page }) => {
    await page.goto('/warranty/test-warranty-id/defects');
    
    await page.click('text=登記缺失');
    await page.fill('[id="description"]', 'Test defect');
    await page.fill('[id="location"]', 'A區');
    await page.click('[id="category"]');
    await page.click('text=結構');
    await page.click('text=重要');
    await page.fill('[id="reporterContact"]', '0912345678');
    await page.click('text=提交');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('should track repair progress', async ({ page }) => {
    await page.goto('/warranty/test-warranty-id/repairs/test-repair-id');
    
    await expect(page.locator('.ant-steps')).toBeVisible();
    await expect(page.locator('text=維修編號')).toBeVisible();
  });
});
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/`
- `e2e/warranty.spec.ts`

### 驗收條件
1. ✅ 單元測試覆蓋率 > 80%
2. ✅ 整合測試通過
3. ✅ E2E 測試通過
4. ✅ Blueprint 整合驗證
5. ✅ 文檔完成

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular 測試最佳實踐

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **測試範圍**
   - 服務單元測試
   - 元件測試
   - 整合測試

2. **測試資料**
   - 測試 Fixtures
   - Mock 服務

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 單元測試
├── 整合測試
└── 測試資料準備

Day 2 (8 hours):
├── E2E 測試
├── Blueprint 整合驗證
└── 文檔更新
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/warranty.integration.spec.ts`
- `e2e/warranty.spec.ts`
- `src/app/core/blueprint/modules/implementations/warranty/README.md`

---

## ✅ 檢查清單

### 測試檢查
- [ ] 單元測試覆蓋
- [ ] 整合測試通過
- [ ] E2E 測試通過

### 文檔檢查
- [ ] README 完整
- [ ] API 文檔更新
