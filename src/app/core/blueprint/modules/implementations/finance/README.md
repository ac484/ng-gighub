# Finance Domain (財務域)

> **Domain ID**: `finance`  
> **Version**: 1.1.0  
> **Status**: ✅ Implementation Complete (Invoice/Payment Enhancement)  
> **Architecture**: Blueprint Container Module  
> **Priority**: P2 (必要)
> **Test Coverage**: 整合測試 + E2E 測試

## 📋 Overview

財務域負責所有財務管理相關功能，提供成本管理、請款管理、付款管理、預算管理、帳務管理及財務報表等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

所有財務管理相關功能，包括：
- 成本記錄、分析與預測
- 請款單管理與請款流程
- 付款管理與付款審核
- 預算編列、追蹤與控管
- 會計分錄與帳務記錄
- 財務報表生成與分析

### 核心特性

- ✅ **完整成本追蹤**: 即時成本記錄與分析
- ✅ **請款管理**: 規範化的請款流程與審核
- ✅ **預算控管**: 預算編列與執行控管
- ✅ **帳務管理**: 會計分錄與帳務核對
- ✅ **財務報表**: 自動生成多種財務報表
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **財務準確性**: 所有財務資料必須精確無誤
2. **審計追蹤**: 完整的財務操作記錄
3. **權限控制**: 嚴格的財務操作權限管理
4. **合規性**: 符合會計準則與稅務規定

## 🏗️ Architecture

### Domain 結構

```
finance/
├── finance.module.ts                 # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── finance.repository.ts             # 共用資料存取層
├── finance.routes.ts                 # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── cost-management.service.ts    # Sub-Module: Cost Management
│   ├── invoice.service.ts            # Sub-Module: Invoice
│   ├── payment.service.ts            # Sub-Module: Payment
│   ├── budget.service.ts             # Sub-Module: Budget
│   ├── ledger.service.ts             # Sub-Module: Ledger
│   └── financial-report.service.ts   # Sub-Module: Financial Report
├── models/                           # Domain 模型
│   ├── cost.model.ts
│   ├── invoice.model.ts
│   ├── payment.model.ts
│   ├── budget.model.ts
│   └── ledger.model.ts
├── views/                            # Domain UI 元件
│   ├── cost-management/
│   ├── invoice/
│   ├── payment/
│   └── budget/
├── config/
│   └── finance.config.ts             # 模組配置
├── exports/
│   └── finance-api.exports.ts        # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Cost Management Sub-Module (成本管理)

成本記錄、分析與預測功能。

### 2️⃣ Invoice Sub-Module (請款)

請款單管理、請款流程與請款記錄功能。

### 3️⃣ Payment Sub-Module (付款)

付款管理、付款記錄與付款審核功能。

### 4️⃣ Budget Sub-Module (預算)

預算編列、預算追蹤與預算控管功能。

### 5️⃣ Ledger Sub-Module (帳務)

會計分錄、帳務記錄與帳務核對功能。

### 6️⃣ Financial Report Sub-Module (財務報表)

財務報表生成、報表匯出與報表分析功能。

## 🧪 Testing

### 整合測試

執行財務模組整合測試：

```bash
# 執行單元測試
yarn test --include="**/finance/**/*.spec.ts"

# 執行整合測試
yarn test --include="**/finance.integration.spec.ts"
```

### 測試覆蓋範圍

- ✅ **Invoice State Machine**: 請款單狀態機轉換邏輯
- ✅ **Payment Status Tracking**: 款項進度計算與追蹤
- ✅ **Financial Summary**: 財務摘要計算
- ✅ **Overdue Calculation**: 逾期款項統計
- ✅ **Data Consistency**: 資料一致性驗證

### E2E 測試

```bash
# 執行 E2E 測試
yarn e2e
```

E2E 測試檔案位置：`e2e/src/finance.e2e-spec.ts`

## 📦 Services

### SETC-025: InvoiceGenerationService (請款單自動生成)
- `autoGenerateReceivable()` - 從驗收結果自動生成應收請款單
- `autoGeneratePayable()` - 從驗收結果自動生成應付付款單
- `autoGenerateBoth()` - 同時生成應收和應付

### SETC-026: InvoiceApprovalService (請款審核工作流程)
- `submit()` - 送出審核
- `approve()` - 核准請款
- `reject()` - 退回請款
- `cancel()` - 取消請款單
- `returnToDraft()` - 退回草稿

### SETC-027: PaymentGenerationService (付款單自動生成)
- `autoGeneratePayable()` - 自動生成付款單
- `batchGeneratePayables()` - 批次生成多個承商付款單
- `calculateContractorSummary()` - 計算承商付款摘要

### SETC-028: PaymentApprovalService (付款審核工作流程)
- `submit()` - 送出審核
- `approve()` - 核准付款
- `reject()` - 退回付款
- `cancel()` - 取消付款單

### SETC-029: PaymentStatusTrackingService (款項狀態追蹤)
- `calculateBillingProgress()` - 計算請款進度
- `calculatePaymentProgress()` - 計算付款進度
- `calculateFinancialSummary()` - 計算藍圖財務摘要
- `calculateOverdueSummary()` - 計算逾期款項摘要
- `calculateContractorSummary()` - 計算承商付款摘要

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [next.md - Domain 架構說明](../../../../../../next.md)
- [SETC-024 ~ SETC-031](../../../../../../docs/discussions/SETC.md) - Invoice/Payment Enhancement

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-16  
**Domain Priority**: P2 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題
