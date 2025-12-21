# SETC-031: Finance Integration Testing

> **任務 ID**: SETC-031  
> **任務名稱**: Finance Integration Testing  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-030 (Invoice/Payment UI Components)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
財務模組整合測試

### 背景 / 目的
對 Invoice/Payment Enhancement 模組進行完整的整合測試，確保所有元件正確協作，事件流程正確觸發，資料一致性維護。

### 需求說明
1. 整合測試套件實作
2. E2E 測試實作
3. 事件流程驗證
4. 資料一致性測試
5. 效能測試基準
6. 文檔更新

### In Scope / Out of Scope

#### ✅ In Scope
- 整合測試套件
- E2E 測試（關鍵流程）
- 事件流程驗證
- 錯誤場景測試
- 文檔更新
- README 完成

#### ❌ Out of Scope
- 壓力測試
- 安全滲透測試
- 效能調優

### 功能行為
驗證整個財務模組的正確性，確保從請款生成到付款完成的完整流程運作正常。

### 資料 / API

#### 整合測試範例

```typescript
describe('Finance Module Integration', () => {
  let invoiceGenerationService: InvoiceGenerationService;
  let invoiceApprovalService: InvoiceApprovalService;
  let paymentGenerationService: PaymentGenerationService;
  let paymentStatusTrackingService: PaymentStatusTrackingService;
  let eventBus: BlueprintEventBusService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore())
      ],
      providers: [
        InvoiceGenerationService,
        InvoiceApprovalService,
        PaymentGenerationService,
        PaymentStatusTrackingService,
        BlueprintEventBusService
      ]
    }).compileComponents();

    invoiceGenerationService = TestBed.inject(InvoiceGenerationService);
    invoiceApprovalService = TestBed.inject(InvoiceApprovalService);
    paymentGenerationService = TestBed.inject(PaymentGenerationService);
    paymentStatusTrackingService = TestBed.inject(PaymentStatusTrackingService);
    eventBus = TestBed.inject(BlueprintEventBusService);
  });

  describe('Complete Invoice Flow', () => {
    it('should complete full invoice lifecycle: generate → submit → approve → pay', async () => {
      // 1. 從驗收生成請款單
      const invoice = await invoiceGenerationService.autoGenerateReceivable(
        testAcceptanceId
      );
      expect(invoice.status).toBe('draft');
      expect(invoice.invoiceType).toBe('receivable');

      // 2. 送出請款單
      const submitted = await invoiceApprovalService.submit(
        invoice.id,
        testActor
      );
      expect(submitted.status).toBe('submitted');

      // 3. 審核通過
      const approved = await invoiceApprovalService.approve(
        invoice.id,
        approverActor,
        'Approved'
      );
      expect(approved.status).toBe('approved');

      // 4. 標記已付款
      const paid = await invoiceApprovalService.markAsPaid(
        invoice.id,
        testActor,
        { amount: invoice.total, method: 'bank_transfer' }
      );
      expect(paid.status).toBe('paid');

      // 5. 驗證任務狀態更新
      const progress = await paymentStatusTrackingService.calculateTaskBillingProgress(
        testTaskId
      );
      expect(progress.collectionPercentage).toBeGreaterThan(0);
    });

    it('should handle rejection and resubmission', async () => {
      const invoice = await invoiceGenerationService.autoGenerateReceivable(
        testAcceptanceId
      );
      
      await invoiceApprovalService.submit(invoice.id, testActor);
      
      // 退回
      const rejected = await invoiceApprovalService.reject(
        invoice.id,
        approverActor,
        'Missing documents'
      );
      expect(rejected.status).toBe('rejected');

      // 修改後重新送出（模擬）
      // ... update invoice
      
      const resubmitted = await invoiceApprovalService.submit(
        invoice.id,
        testActor
      );
      expect(resubmitted.status).toBe('submitted');
    });
  });

  describe('Event Flow Verification', () => {
    it('should emit correct events throughout invoice lifecycle', async () => {
      const events: string[] = [];
      
      eventBus.on('*', (event) => {
        events.push(event.type);
      });

      const invoice = await invoiceGenerationService.autoGenerateReceivable(
        testAcceptanceId
      );
      await invoiceApprovalService.submit(invoice.id, testActor);
      await invoiceApprovalService.approve(invoice.id, approverActor);

      expect(events).toContain(SystemEventType.INVOICE_GENERATED);
      expect(events).toContain(SystemEventType.INVOICE_SUBMITTED);
      expect(events).toContain(SystemEventType.INVOICE_APPROVED);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent totals after multiple invoices', async () => {
      // Generate multiple invoices
      const invoice1 = await invoiceGenerationService.autoGenerateReceivable(
        acceptance1Id
      );
      const invoice2 = await invoiceGenerationService.autoGenerateReceivable(
        acceptance2Id
      );

      const summary = await paymentStatusTrackingService.getBlueprintFinancialSummary(
        testBlueprintId
      );

      const expectedTotal = invoice1.total + invoice2.total;
      expect(summary.receivables.total).toBeCloseTo(expectedTotal, 2);
    });
  });
});
```

#### E2E 測試範例

```typescript
// e2e/finance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Finance Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should display invoice list', async ({ page }) => {
    await page.goto('/finance/invoices');
    await expect(page.locator('st')).toBeVisible();
    await expect(page.locator('.ant-table-row')).toHaveCount.greaterThan(0);
  });

  test('should create and submit invoice', async ({ page }) => {
    await page.goto('/finance/invoices');
    
    // 查看草稿請款單
    await page.click('[data-testid="status-filter"]');
    await page.click('text=草稿');
    
    // 送出第一筆
    await page.click('text=送出');
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('should approve invoice', async ({ page }) => {
    await page.goto('/finance/invoices');
    
    // 篩選待審核
    await page.click('[data-testid="status-filter"]');
    await page.click('text=已送出');
    
    // 審核
    await page.click('text=審核');
    await page.click('label:has-text("核准")');
    await page.fill('textarea', 'Approved for payment');
    await page.click('text=確定');
    
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('should display financial dashboard', async ({ page }) => {
    await page.goto('/finance/dashboard');
    
    await expect(page.locator('text=應收帳款')).toBeVisible();
    await expect(page.locator('text=應付帳款')).toBeVisible();
    await expect(page.locator('text=毛利')).toBeVisible();
  });
});
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/finance/` - 所有服務
- `e2e/finance.spec.ts` - E2E 測試

### 驗收條件
1. ✅ 整合測試覆蓋率 > 80%
2. ✅ 關鍵流程 E2E 測試通過
3. ✅ 事件流程驗證正確
4. ✅ 錯誤場景處理完整
5. ✅ 文檔更新完成
6. ✅ README 完整

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular 測試與 Playwright E2E

**查詢重點**:
- Jasmine 整合測試模式
- Playwright 最佳實踐
- Firebase 測試配置

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **測試範圍定義**
   - 關鍵業務流程
   - 錯誤場景
   - 邊界情況

2. **測試資料準備**
   - Firebase Emulator
   - 測試資料 Fixtures
   - 清理策略

3. **CI/CD 整合**
   - 測試執行腳本
   - 覆蓋率報告
   - 失敗處理

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 整合測試套件
├── 事件流程測試
└── 資料一致性測試

Day 2 (8 hours):
├── E2E 測試
├── 文檔更新
└── README 完成
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 整合測試 (Day 1)

**檔案**: `finance.integration.spec.ts`

```typescript
// 完整測試套件如上述範例
```

#### Phase 2: E2E 與文檔 (Day 2)

**檔案**:
- `e2e/finance.spec.ts`
- `src/app/routes/finance/README.md`

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/finance/finance.integration.spec.ts`
- `e2e/finance.spec.ts`
- `src/app/routes/finance/README.md`

**修改檔案**:
- `src/app/core/blueprint/modules/implementations/finance/README.md`
- `AGENTS.md` (財務模組說明)

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 測試覆蓋關鍵業務流程
- ✅ 使用 Firebase Emulator
- ✅ 測試隔離與清理
- ✅ E2E 測試穩定性

### 測試規範
- ✅ 每個測試獨立
- ✅ 有意義的斷言
- ✅ 清晰的測試描述

---

## ✅ 檢查清單

### 測試檢查
- [x] 整合測試覆蓋率 > 80%
- [x] E2E 測試通過
- [x] 事件流程驗證
- [x] 錯誤場景覆蓋

### 文檔檢查
- [x] README 完整
- [x] API 文檔更新
- [x] 測試說明文檔

---

## 📁 實作檔案

### 新增檔案
- `src/app/core/blueprint/modules/implementations/finance/finance.integration.spec.ts` - 整合測試套件
- `e2e/src/finance.e2e-spec.ts` - E2E 測試

### 修改檔案
- `src/app/core/blueprint/modules/implementations/finance/README.md` - 測試文檔更新
- `docs/discussions/SETC.md` - 進度更新
