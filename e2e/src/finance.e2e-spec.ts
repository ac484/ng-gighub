/**
 * Finance Module E2E Tests
 *
 * SETC-031: Finance Integration Testing
 *
 * 財務模組端對端測試，驗證：
 * - 請款單列表顯示
 * - 付款單列表顯示
 * - 財務儀表板顯示
 * - 基本操作流程
 *
 * @module FinanceE2ESpec
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { browser, by, element, logging, ExpectedConditions as EC } from 'protractor';

import { AppPage } from './app.po';

describe('Finance Module E2E', () => {
  const page = new AppPage();
  const defaultTimeout = 10000;

  beforeEach(async () => {
    // 設定預設等待時間
    await browser.waitForAngularEnabled(true);
  });

  afterEach(async () => {
    // 檢查瀏覽器錯誤
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    const severeErrors = logs.filter(log => log.level === logging.Level.SEVERE);

    if (severeErrors.length > 0) {
      console.warn('Browser errors detected:', severeErrors);
    }
  });

  describe('Invoice List', () => {
    it('should display invoice list page when navigated', async () => {
      // 注意：需要先登入和選擇藍圖，這裡假設已有測試數據
      // 實際測試需要 mock 或 seed data

      // 跳過此測試直到測試環境完備
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance/invoices');

      // 等待頁面載入
      const card = element(by.css('nz-card'));
      await browser.wait(EC.presenceOf(card), defaultTimeout);

      expect(await card.isPresent()).toBeTruthy();
    });

    it('should display invoice table with columns', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance/invoices');

      const table = element(by.css('st'));
      await browser.wait(EC.presenceOf(table), defaultTimeout);

      expect(await table.isPresent()).toBeTruthy();
    });

    it('should have status filter dropdown', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance/invoices');

      const statusFilter = element(by.css('nz-select'));
      await browser.wait(EC.presenceOf(statusFilter), defaultTimeout);

      expect(await statusFilter.isPresent()).toBeTruthy();
    });
  });

  describe('Payment List', () => {
    it('should display payment list page when navigated', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance/payments');

      const card = element(by.css('nz-card'));
      await browser.wait(EC.presenceOf(card), defaultTimeout);

      expect(await card.isPresent()).toBeTruthy();
    });
  });

  describe('Finance Dashboard', () => {
    it('should display financial overview', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance');

      // 等待頁面載入
      const header = element(by.css('page-header'));
      await browser.wait(EC.presenceOf(header), defaultTimeout);

      expect(await header.isPresent()).toBeTruthy();
    });

    it('should display receivables card', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance');

      // 查找應收帳款卡片
      const receivablesCard = element(by.cssContainingText('nz-card', '應收帳款'));
      await browser.wait(EC.presenceOf(receivablesCard), defaultTimeout);

      expect(await receivablesCard.isPresent()).toBeTruthy();
    });

    it('should display payables card', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance');

      // 查找應付帳款卡片
      const payablesCard = element(by.cssContainingText('nz-card', '應付帳款'));
      await browser.wait(EC.presenceOf(payablesCard), defaultTimeout);

      expect(await payablesCard.isPresent()).toBeTruthy();
    });

    it('should display profit statistics', async () => {
      pending('需要完整的測試環境設定');

      await browser.get('/blueprints/user/test-blueprint/finance');

      // 查找毛利統計
      const profitCard = element(by.cssContainingText('nz-card', '損益概覽'));
      await browser.wait(EC.presenceOf(profitCard), defaultTimeout);

      expect(await profitCard.isPresent()).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate between finance pages', async () => {
      pending('需要完整的測試環境設定');

      // 從儀表板導航到請款單列表
      await browser.get('/blueprints/user/test-blueprint/finance');

      // 點擊請款單連結
      const invoiceLink = element(by.cssContainingText('a', '請款單'));
      if (await invoiceLink.isPresent()) {
        await invoiceLink.click();
        await browser.wait(EC.urlContains('/invoices'), defaultTimeout);
        expect(await browser.getCurrentUrl()).toContain('/invoices');
      }
    });
  });
});

/**
 * Finance Page Object
 *
 * 提供財務模組頁面的輔助方法
 */
export class FinancePage {
  navigateToInvoiceList(blueprintId: string) {
    return browser.get(`/blueprints/user/${blueprintId}/finance/invoices`);
  }

  navigateToPaymentList(blueprintId: string) {
    return browser.get(`/blueprints/user/${blueprintId}/finance/payments`);
  }

  navigateToDashboard(blueprintId: string) {
    return browser.get(`/blueprints/user/${blueprintId}/finance`);
  }

  async getPageTitle() {
    const title = element(by.css('nz-card nz-card-meta'));
    return await title.getText();
  }

  async getInvoiceRows() {
    const rows = element.all(by.css('st tbody tr'));
    return await rows.count();
  }

  async filterByStatus(status: string) {
    const select = element(by.css('nz-select'));
    await select.click();
    const option = element(by.cssContainingText('nz-option', status));
    await option.click();
  }

  async clickViewButton(rowIndex: number) {
    const rows = element.all(by.css('st tbody tr'));
    const row = await rows.get(rowIndex);
    const viewButton = row.element(by.cssContainingText('button', '查看'));
    await viewButton.click();
  }
}
