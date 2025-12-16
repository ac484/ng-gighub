# SETC 工作流程定義

> **文件版本**: 3.23.0  
> **更新日期**: 2025-12-16  
> **變更說明**: SETC-040 ~ SETC-045 (Defect Management Integration) 程式碼實作完成！🎉
> **實作狀態**: ✅ Contract Module 完成 | ✅ Event Automation 完成 (6/6) | ✅ Invoice/Payment 完成 (8/8) | ✅ Warranty Module 完成 (8/8) | ✅ Defect Management 完成 (6/6) 🎉

---

## 📊 實作進度總覽

| 模組 | 狀態 | 詳細文檔 | 備註 |
|------|------|---------|------|
| 問題模組 (Issue Module) | ✅ 實作完成 | 8/8 ✅ | SETC-001 ~ SETC-008 |
| 合約模組 (Contract Module) | ✅ 實作完成 | 9/9 ✅ | SETC-009 ~ SETC-017 全部完成 |
| 事件驅動自動化 (Event Automation) | ✅ 實作完成 | 6/6 ✅ | SETC-018 ~ SETC-023 全部完成 🎉 |
| 請款付款強化 (Invoice/Payment) | ✅ 實作完成 | 8/8 ✅ | SETC-024 ~ SETC-031 全部完成 🎉 |
| 保固模組 (Warranty Module) | ✅ 實作完成 | 8/8 ✅ | SETC-032 ~ SETC-039 全部完成 🎉 |
| 缺失管理整合 (Defect Management) | ✅ 實作完成 | 6/6 ✅ | SETC-040 ~ SETC-045 全部完成 🎉 |
| 任務模組 (Task Module) | ✅ 文檔完成 | 8/8 ✅ | SETC-046 ~ SETC-053 |
| 驗收模組 (Acceptance Module) | ✅ 文檔完成 | 8/8 ✅ | SETC-054 ~ SETC-061 |
| 財務模組 (Finance Module) | ✅ 文檔完成 | 8/8 ✅ | SETC-062 ~ SETC-069 |

---

# 零、合約建立與來源
合約上傳（PDF / 圖檔）【手動】
↓
合約建檔（基本資料、業主、承商）【手動】
↓
合約解析（OCR / AI 解析條款、金額、工項）【自動】
↓
合約確認(確認解析結果或人工補齊)【手動】
↓
合約狀態：待生效
↓
合約生效（⚠️ 僅「已生效合約」可建立任務）【手動】
↓
# 一、任務與施工階段
任務建立（關聯合約/工項/金額）【手動】
↓
指派用戶 / 團隊【手動】
↓
施工執行
↓
提報完成【手動】
↓
管理確認完成【手動】（關鍵控制點） ※ 此節點僅確認施工責任完成，不等同於驗收完成
↓
# 二、品質與驗收階段
自動建立施工日誌【自動】(由任務資料自動產生一筆施工日誌)
↓
自動建立 QC 待驗【自動】
↓
QC 通過？
  ├─ 否 → 建立缺失單【自動】 → 整改【手動】 → 複驗【手動】 ↺ QC
  └─ 是
↓
驗收【手動】
↓
驗收通過？
  ├─ 否 → 建立問題單【可手動 / 可自動】⭐ → 處理【手動】 ↺ 驗收
  └─ 是
↓
驗收資料封存【自動】
↓
進入保固期【自動】

保固期管理
├─ 保固缺失？
│ ├─ 是 → 建立問題單【可手動 / 可自動】⭐ → 保固維修【手動】 → 結案【手動】
│ └─ 否
└─ 保固期滿【自動】 → 驗收最終結案【手動】
↓
# 三、財務與成本階段
金額 / 比例確認（可請款% / 可付款%）【手動】
↓
建立可請款清單 + 可付款清單【自動】(各建立一筆（業主 / 承商分離）)
↓
請款 / 付款流程【手動】
（草稿 → 送出 → 審核 → 開票 → 收/付款）

審核
├─ 通過
└─ 退回補件 → 修正 ↺ 審核
↓
更新任務款項狀態【自動】
  ├─ 請款進度 %
  └─ 付款進度 %
↓
計入成本管理【自動】(實際成本 / 應收 / 應付統計)
實際成本

應收

應付

毛利 / 成本分析
↓
# 📌 補充說明
- ⚙️ 自動節點皆應由事件（Event）或 Queue 觸發，狀態改變即觸發後續流程
- 🧾 稽核與操作紀錄（Audit Log）：所有【手動】節點必記錄：操作人/操作時間/前後狀態/備註
- 🔐 權限與角色控制（不同角色可操作不同節點）
- ⭐ **問題單 (Issue) 獨立管理** ✅ **已完成實作**:
  - ✅ 可從多個來源自動建立（驗收失敗、QC 失敗、保固缺失、安全事故等）
  - ✅ 也可由使用者手動建立
  - ✅ 獨立的問題追蹤生命週期：open → in_progress → resolved → verified → closed
  - ✅ 不限於驗收模組使用
  - ✅ 透過事件總線與其他模組整合

---

## 📂 模組實作詳情

### ✅ 已完成的 SETC 任務（問題模組）

| 任務 | 描述 | 狀態 |
|------|------|------|
| [SETC-001](./SETC-001-issue-module-foundation.md) | 模組基礎設定 | ✅ |
| [SETC-002](./SETC-002-issue-repository-layer.md) | Repository 層 | ✅ |
| [SETC-003](./SETC-003-issue-core-services.md) | 核心服務 (IssueManagementService, IssueCreationService) | ✅ |
| [SETC-004](./SETC-004-issue-resolution-verification.md) | 進階服務 (Resolution, Verification, Lifecycle) | ✅ |
| [SETC-005](./SETC-005-issue-event-integration.md) | 事件整合 (IssueEventService) | ✅ |
| [SETC-006](./SETC-006-issue-module-facade.md) | 模組註冊與整合 | ✅ |
| [SETC-007](./SETC-007-issue-ui-components.md) | UI 元件 | ✅ |
| [SETC-008](./SETC-008-issue-module-testing.md) | 測試與整合 | ✅ |

### 📝 已完成詳細文檔的 SETC 任務

#### Contract Module (SETC-009 ~ SETC-017) - ✅ 9 個詳細任務文檔完成
- [SETC-009: Contract Module Foundation Setup](./SETC-009-contract-module-foundation.md) - 模組基礎設定
- [SETC-010: Contract Repository Implementation](./SETC-010-contract-repository-layer.md) - Repository 層實作
- [SETC-011: Contract Management Service](./SETC-011-contract-management-service.md) - 核心業務邏輯
- [SETC-012: Contract Upload & Parsing Service](./SETC-012-contract-upload-parsing-service.md) - 檔案上傳服務
- [SETC-013: Contract Status & Lifecycle Service](./SETC-013-contract-status-lifecycle-service.md) - 狀態管理
- [SETC-014: Contract Work Items Management](./SETC-014-contract-work-items-management.md) - 工項管理
- [SETC-015: Contract Event Integration](./SETC-015-contract-event-integration.md) - 事件整合
- [SETC-016: Contract UI Components](./SETC-016-contract-ui-components.md) - UI 元件
- [SETC-017: Contract Testing & Integration](./SETC-017-contract-testing-integration.md) - 測試與整合

#### Event-Driven Automation (SETC-018 ~ SETC-023) - ✅ 6 個詳細任務文檔完成
- [SETC-018: Event Bus Enhancement](./SETC-018-event-bus-enhancement.md) - Event Bus 強化與事件類型定義
- [SETC-019: Workflow Orchestrator](./SETC-019-workflow-orchestrator.md) - 工作流程編排器實作
- [SETC-020: Task → Log Automation](./SETC-020-task-to-log-automation.md) - 任務完成自動建立日誌
- [SETC-021: Log → QC Automation](./SETC-021-log-to-qc-automation.md) - 日誌自動建立 QC 待驗
- [SETC-022: QC → Acceptance/Defect Automation](./SETC-022-qc-to-acceptance-defect-automation.md) - QC 結果自動化處理
- [SETC-023: Acceptance → Invoice/Warranty Automation](./SETC-023-acceptance-to-invoice-warranty-automation.md) - 驗收後自動化流程

#### Invoice/Payment Enhancement (SETC-024 ~ SETC-031) - ✅ 8 個詳細任務文檔完成
- [SETC-024: Invoice Service Expansion Planning](./SETC-024-invoice-service-expansion.md) - 請款服務擴展規劃
- [SETC-025: Invoice Generation Service](./SETC-025-invoice-generation-service.md) - 請款單自動生成服務
- [SETC-026: Invoice Approval Workflow](./SETC-026-invoice-approval-workflow.md) - 請款審核工作流程
- [SETC-027: Payment Generation Service](./SETC-027-payment-generation-service.md) - 付款單生成服務
- [SETC-028: Payment Approval Workflow](./SETC-028-payment-approval-workflow.md) - 付款審核工作流程
- [SETC-029: Payment Status Tracking](./SETC-029-payment-status-tracking.md) - 款項狀態追蹤
- [SETC-030: Invoice/Payment UI Components](./SETC-030-invoice-payment-ui-components.md) - 請款付款 UI 元件
- [SETC-031: Finance Integration Testing](./SETC-031-finance-integration-testing.md) - 財務模組整合測試

#### Warranty Module (SETC-032 ~ SETC-039) - ✅ 8 個詳細任務文檔完成
- [SETC-032: Warranty Module Foundation Setup](./SETC-032-warranty-module-foundation.md) - 保固模組基礎設定
- [SETC-033: Warranty Repository Implementation](./SETC-033-warranty-repository-implementation.md) - 保固資料存取層實作
- [SETC-034: Warranty Period Management](./SETC-034-warranty-period-management.md) - 保固期管理服務
- [SETC-035: Warranty Defect Management](./SETC-035-warranty-defect-management.md) - 保固缺失管理服務
- [SETC-036: Warranty Repair Management](./SETC-036-warranty-repair-management.md) - 保固維修管理服務
- [SETC-037: Warranty Event Integration](./SETC-037-warranty-event-integration.md) - 保固事件整合
- [SETC-038: Warranty UI Components](./SETC-038-warranty-ui-components.md) - 保固 UI 元件
- [SETC-039: Warranty Testing & Integration](./SETC-039-warranty-testing-integration.md) - 保固測試與整合

#### Defect Management Integration (SETC-040 ~ SETC-045) - ✅ 6 個詳細任務文檔完成
- [SETC-040: Defect Service Expansion Planning](./SETC-040-defect-service-expansion.md) - 缺失服務擴展規劃
- [SETC-041: Defect Lifecycle Service](./SETC-041-defect-lifecycle-service.md) - 缺失生命週期服務
- [SETC-042: Defect Resolution Service](./SETC-042-defect-resolution-service.md) - 缺失解決服務
- [SETC-043: Defect Reinspection Service](./SETC-043-defect-reinspection-service.md) - 缺失複驗服務
- [SETC-044: Defect-Issue Integration](./SETC-044-defect-issue-integration.md) - 缺失問題單整合
- [SETC-045: Defect Testing & Integration](./SETC-045-defect-testing-integration.md) - 缺失測試與整合

#### Task Module Enhancement (SETC-046 ~ SETC-053) - ✅ 8 個詳細任務文檔完成
- [SETC-046: Task Module Enhancement Planning](./SETC-046-task-module-enhancement-planning.md) - 任務模組擴展規劃
- [SETC-047: Task Repository Enhancement](./SETC-047-task-repository-enhancement.md) - 任務 Repository 增強
- [SETC-048: Task Assignment Service](./SETC-048-task-assignment-service.md) - 任務指派服務
- [SETC-049: Task State Machine Service](./SETC-049-task-state-machine-service.md) - 任務狀態機服務
- [SETC-050: Task Progress Tracking Service](./SETC-050-task-progress-tracking-service.md) - 任務進度追蹤服務
- [SETC-051: Task Schedule Management Service](./SETC-051-task-schedule-management-service.md) - 任務排程管理服務
- [SETC-052: Task Event Integration](./SETC-052-task-event-integration.md) - 任務事件整合
- [SETC-053: Task UI Components & Testing](./SETC-053-task-ui-components-testing.md) - 任務 UI 元件與測試

#### Acceptance Module Enhancement (SETC-054 ~ SETC-061) - ✅ 8 個詳細任務文檔完成
- [SETC-054: Acceptance Module Enhancement Planning](./SETC-054-acceptance-module-enhancement-planning.md) - 驗收模組擴展規劃
- [SETC-055: Acceptance Repository Implementation](./SETC-055-acceptance-repository-implementation.md) - 驗收 Repository 實作
- [SETC-056: Acceptance Request Service](./SETC-056-acceptance-request-service.md) - 驗收申請服務
- [SETC-057: Preliminary Acceptance Service](./SETC-057-preliminary-acceptance-service.md) - 初驗服務
- [SETC-058: Reinspection Service](./SETC-058-reinspection-service.md) - 複驗服務
- [SETC-059: Acceptance Conclusion Service](./SETC-059-acceptance-conclusion-service.md) - 驗收結論服務
- [SETC-060: Acceptance Event Integration](./SETC-060-acceptance-event-integration.md) - 驗收事件整合
- [SETC-061: Acceptance UI Components & Testing](./SETC-061-acceptance-ui-components-testing.md) - 驗收 UI 元件與測試

#### Finance Module Enhancement (SETC-062 ~ SETC-069) - ✅ 8 個詳細任務文檔完成
- [SETC-062: Finance Module Enhancement Planning](./SETC-062-finance-module-enhancement-planning.md) - 財務模組擴展規劃
- [SETC-063: Finance Repository Implementation](./SETC-063-finance-repository-implementation.md) - 財務 Repository 實作
- [SETC-064: Invoice Service](./SETC-064-invoice-service.md) - 請款服務
- [SETC-065: Payment Service](./SETC-065-payment-service.md) - 付款服務
- [SETC-066: Budget Management Service](./SETC-066-budget-management-service.md) - 預算管理服務
- [SETC-067: Ledger Accounting Service](./SETC-067-ledger-accounting-service.md) - 分類帳會計服務
- [SETC-068: Finance Event Integration](./SETC-068-finance-event-integration.md) - 財務事件整合
- [SETC-069: Finance UI Components & Testing](./SETC-069-finance-ui-components-testing.md) - 財務 UI 元件與測試

### 📋 實作狀態

**所有 69 個 SETC 任務文檔已完成建立**。詳細規劃與實作細節請參考各任務文檔。

### 實作檔案結構

```
src/app/core/blueprint/modules/implementations/issue/
├── models/                           # 領域模型
│   └── issue.model.ts               # Issue, Resolution, Verification 介面
├── repositories/                     # 資料存取層
│   └── issue.repository.ts          # Firestore CRUD 操作
├── services/                         # 業務邏輯層
│   ├── issue-management.service.ts   # 手動建立與 CRUD
│   ├── issue-creation.service.ts     # 自動建立 (4 來源)
│   ├── issue-resolution.service.ts   # 解決工作流程
│   ├── issue-verification.service.ts # 驗證工作流程
│   ├── issue-lifecycle.service.ts    # 狀態管理
│   ├── issue-event.service.ts        # 事件總線整合
│   ├── *.spec.ts                     # 單元測試
├── config/                           # 模組配置
├── exports/                          # 公開 API
├── issue.module.ts                   # Angular 模組
├── module.metadata.ts                # 模組元資料
└── README.md                         # 模組文件
```

### 支援的自動建立來源

1. **驗收失敗 (Acceptance)** - `IssueCreationService.autoCreateFromAcceptance()`
2. **QC 檢驗失敗 (QC)** - `IssueCreationService.autoCreateFromQC()`
3. **保固缺失 (Warranty)** - `IssueCreationService.autoCreateFromWarranty()`
4. **安全事故 (Safety)** - `IssueCreationService.autoCreateFromSafety()`

### 事件類型

所有事件以 `issue.` 為前綴:
- `issue.created` - 問題已建立
- `issue.created_from_acceptance` - 從驗收失敗建立
- `issue.created_from_qc` - 從 QC 失敗建立
- `issue.created_from_warranty` - 從保固缺失建立
- `issue.created_from_safety` - 從安全事故建立
- `issue.updated` - 問題已更新
- `issue.assigned` - 問題已指派
- `issue.resolved` - 問題已解決
- `issue.verified` - 問題已驗證
- `issue.verification_failed` - 驗證失敗
- `issue.closed` - 問題已關閉