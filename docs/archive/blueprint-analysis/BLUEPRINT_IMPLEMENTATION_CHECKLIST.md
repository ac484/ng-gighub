# Blueprint 實作檢查清單

> **目的**: 逐步指引如何補足缺少的 5 個業務域  
> **目標**: 完整實作 next.md 定義的 Blueprint V2.0 架構

---

## 📋 總體進度追蹤

### 完成度概覽

| 階段 | 任務 | 狀態 | 完成日期 |
|------|------|------|----------|
| **準備階段** | 資料夾結構重組 | ⬜ 待辦 | - |
| **Phase 2.1** | Log Domain | ⬜ 待辦 | - |
| **Phase 2.2** | Workflow Domain | ⬜ 待辦 | - |
| **Phase 2.3** | QA Domain | ⬜ 待辦 | - |
| **Phase 2.4** | Acceptance Domain | ⬜ 待辦 | - |
| **Phase 2.5** | Finance Domain | ⬜ 待辦 | - |
| **Phase 3** | Material Domain | ⬜ 待辦 | - |
| **Phase 4** | Optional Domains | ⬜ 待辦 | - |

**進度**: 0/8 完成

---

## 🏗️ 準備階段：資料夾結構重組

### 目標
清楚分離平台層（Platform Layer）與業務域（Business Domains）

### 任務清單

#### 1. 建立新的資料夾結構

- [ ] 建立 `src/app/core/blueprint/platform/` 資料夾
- [ ] 建立 `src/app/core/blueprint/domains/` 資料夾

#### 2. 移動平台層檔案到 platform/

- [ ] 移動 `context/` 到 `platform/context/`
- [ ] 移動 `events/` 到 `platform/events/`
- [ ] 移動 `container/` 到 `platform/container/`
- [ ] 移動 `services/` 到 `platform/services/`
- [ ] 移動 `repositories/` 到 `platform/repositories/`
- [ ] 移動 `config/` 到 `platform/config/`
- [ ] 移動 `models/` 到 `platform/models/`

#### 3. 移動業務域到 domains/

- [ ] 移動 `modules/implementations/tasks/` 到 `domains/task/`
- [ ] 重命名相關檔案符合新命名慣例

#### 4. 更新 import 路徑

- [ ] 更新所有檔案中的 import 路徑
- [ ] 更新 `index.ts` 匯出路徑
- [ ] 更新測試檔案路徑

#### 5. 驗證重組

- [ ] 執行 `yarn build` 確認編譯成功
- [ ] 執行 `yarn test` 確認測試通過
- [ ] 執行 `yarn lint` 確認無 linting 錯誤
- [ ] 手動測試 Task Domain 功能正常

#### 6. 更新文件

- [ ] 更新 README.md 反映新結構
- [ ] 更新架構文件
- [ ] 更新開發者指南

**預計時間**: 1 週  
**風險**: 中 - Import 路徑可能遺漏  
**緩解**: 使用 IDE 的全域搜尋取代功能

---

## 📝 Phase 2.1: Log Domain 實作

### 目標
實作活動日誌、評論與附件管理系統

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/log/` 資料夾
- [ ] 建立 `log.module.ts` (實作 IBlueprintModule)
- [ ] 建立 `module.metadata.ts`
- [ ] 建立 `index.ts` 匯出檔案

#### 2. 定義資料模型

- [ ] 建立 `activity-log.model.ts`
  - id, blueprint_id, domain_name, entity_type, entity_id
  - action, user_id, metadata, created_at
- [ ] 建立 `comment.model.ts`
  - id, activity_log_id, user_id, content, created_at
- [ ] 建立 `attachment.model.ts`
  - id, activity_log_id, file_name, file_url, file_size, mime_type

#### 3. 建立資料庫 Schema

- [ ] 建立 Firebase migration: `create_comments_table.sql`
- [ ] 建立 RLS policies
- [ ] 執行 migrations 並驗證

#### 4. 實作 Repository 層

- [ ] 建立 `log.repository.ts`
  - createActivityLog()
  - getActivityLogs()
  - getActivityLogById()
  - searchActivityLogs()
- [ ] 建立 `comment.repository.ts`
  - createComment()
  - getComments()
  - updateComment()
  - deleteComment()
- [ ] 建立 `attachment.repository.ts`
  - uploadAttachment()
  - getAttachments()
  - deleteAttachment()

#### 5. 實作 Service 層

- [ ] 建立 `log.service.ts`
  - logActivity()
  - getActivityTimeline()
  - searchLogs()
- [ ] 實作事件訂閱邏輯
  - 監聽 TASK_CREATED, TASK_UPDATED 等事件
  - 自動建立活動日誌

#### 6. 實作 UI 元件

- [ ] 建立 `activity-timeline.component.ts`
- [ ] 建立 `comment-list.component.ts`
- [ ] 建立 `attachment-upload.component.ts`
- [ ] 建立相關樣式檔案

#### 7. 建立路由

- [ ] 建立 `log.routes.ts`
- [ ] 註冊路由到 app routing

#### 8. 撰寫測試

- [ ] `log.repository.spec.ts`
- [ ] `log.service.spec.ts`
- [ ] `log.module.spec.ts`
- [ ] 整合測試

#### 9. 整合與驗證

- [ ] 整合到 Module Registry
- [ ] 測試與 Task Domain 的互動
- [ ] 驗證事件訂閱正常運作
- [ ] 效能測試（大量日誌）

#### 10. 文件撰寫

- [ ] API 文件
- [ ] 使用者指南
- [ ] 開發者文件

**預計時間**: 2 週  
**依賴**: 無  
**關鍵成功因素**: 事件訂閱機制正確運作

---

## 🔄 Phase 2.2: Workflow Domain 實作

### 目標
實作可配置的狀態機與自動化規則引擎

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/workflow/` 資料夾
- [ ] 建立 `workflow.module.ts`
- [ ] 建立 `module.metadata.ts`
- [ ] 建立 `index.ts`

#### 2. 定義資料模型

- [ ] 建立 `workflow.model.ts`
  - id, blueprint_id, name, description, definition, status
- [ ] 建立 `state-machine.model.ts`
  - id, workflow_id, name, states, transitions, initial_state
- [ ] 建立 `automation-rule.model.ts`
  - id, workflow_id, trigger_type, trigger_config, action_type, action_config

#### 3. 建立資料庫 Schema

- [ ] 建立 migration: `create_workflows_table.sql`
- [ ] 建立 migration: `create_state_machines_table.sql`
- [ ] 建立 migration: `create_automation_rules_table.sql`
- [ ] 建立 RLS policies
- [ ] 執行 migrations

#### 4. 實作 Repository 層

- [ ] 建立 `workflow.repository.ts`
- [ ] 建立 `state-machine.repository.ts`
- [ ] 建立 `automation-rule.repository.ts`

#### 5. 實作核心引擎

- [ ] 建立 `state-machine.service.ts`
  - 狀態機引擎
  - 狀態轉換驗證
  - 狀態歷史追蹤
- [ ] 建立 `automation.service.ts`
  - 規則評估引擎
  - 觸發器處理
  - 動作執行

#### 6. 實作 Service 層

- [ ] 建立 `workflow.service.ts`
  - 工作流程定義管理
  - 工作流程執行協調
  - 工作流程監控

#### 7. 實作 UI 元件

- [ ] 建立 `workflow-builder.component.ts` (視覺化流程建構器)
- [ ] 建立 `state-machine-config.component.ts`
- [ ] 建立 `automation-rules.component.ts`
- [ ] 建立 `workflow-monitor.component.ts`

#### 8. 建立路由與測試

- [ ] 建立 `workflow.routes.ts`
- [ ] 撰寫單元測試
- [ ] 撰寫整合測試

#### 9. 整合其他域

- [ ] 整合 Task Domain 狀態機
- [ ] 提供 API 給其他域使用
- [ ] 驗證跨域工作流程

#### 10. 文件撰寫

- [ ] 狀態機使用指南
- [ ] 自動化規則設定文件
- [ ] API 文件

**預計時間**: 2 週  
**依賴**: Log Domain (記錄工作流程執行)  
**關鍵成功因素**: 狀態機引擎穩定性

---

## ✅ Phase 2.3: QA Domain 實作

### 目標
實作品質檢驗、缺失追蹤與檢查清單系統

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/qa/` 資料夾
- [ ] 建立 `qa.module.ts`
- [ ] 建立 `module.metadata.ts`

#### 2. 定義資料模型

- [ ] 建立 `qa-inspection.model.ts`
- [ ] 建立 `qa-checklist.model.ts`
- [ ] 建立 `qa-issue.model.ts`

#### 3. 建立資料庫 Schema

- [ ] 建立 migration: `create_qa_inspections_table.sql`
- [ ] 建立 migration: `create_qa_checklists_table.sql`
- [ ] 建立 migration: `create_qa_issues_table.sql`
- [ ] 建立 RLS policies

#### 4. 實作 Repository 與 Service 層

- [ ] 建立 `qa.repository.ts`
- [ ] 建立 `qa.service.ts`
- [ ] 建立 `checklist.service.ts`
- [ ] 建立 `issue.service.ts`

#### 5. 實作 UI 元件

- [ ] 建立 `inspection.component.ts`
- [ ] 建立 `checklist.component.ts`
- [ ] 建立 `issue-tracker.component.ts`
- [ ] 建立 `qa-report.component.ts`

#### 6. 整合與測試

- [ ] 整合 Task Domain
- [ ] 整合 Workflow Domain (檢驗流程)
- [ ] 整合 Log Domain (檢驗記錄)
- [ ] 撰寫測試
- [ ] 效能測試

#### 7. 文件撰寫

- [ ] 品質檢驗指南
- [ ] 缺失處理流程文件
- [ ] API 文件

**預計時間**: 2 週  
**依賴**: Log Domain, Workflow Domain  
**關鍵成功因素**: 檢查清單可自訂性

---

## 📋 Phase 2.4: Acceptance Domain 實作

### 目標
實作正式驗收流程，包含初驗、複驗與審核

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/acceptance/` 資料夾
- [ ] 建立 `acceptance.module.ts`
- [ ] 建立 `module.metadata.ts`

#### 2. 定義資料模型

- [ ] 建立 `acceptance-request.model.ts`
- [ ] 建立 `acceptance-review.model.ts`
- [ ] 建立 `acceptance-result.model.ts`

#### 3. 建立資料庫 Schema

- [ ] 建立 migration: `create_acceptance_requests_table.sql`
- [ ] 建立 migration: `create_acceptance_reviews_table.sql`
- [ ] 建立 migration: `create_acceptance_results_table.sql`
- [ ] 建立 RLS policies

#### 4. 實作 Repository 與 Service 層

- [ ] 建立 `acceptance.repository.ts`
- [ ] 建立 `acceptance.service.ts`
- [ ] 實作驗收流程邏輯

#### 5. 實作 UI 元件

- [ ] 建立 `acceptance-request.component.ts`
- [ ] 建立 `acceptance-review.component.ts`
- [ ] 建立 `acceptance-result.component.ts`

#### 6. 整合與測試

- [ ] 整合 Task Domain
- [ ] 整合 QA Domain (驗收前品質檢查)
- [ ] 整合 Workflow Domain (審核流程)
- [ ] 驗收通過觸發 Finance Domain 事件
- [ ] 撰寫測試

#### 7. 文件撰寫

- [ ] 驗收流程指南
- [ ] API 文件

**預計時間**: 2 週  
**依賴**: Log Domain, Workflow Domain, QA Domain  
**關鍵成功因素**: 與 Finance Domain 的整合

---

## 💰 Phase 2.5: Finance Domain 實作

### 目標
實作完整財務管理系統，包含成本、發票、付款、預算

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/finance/` 資料夾
- [ ] 建立 `finance.module.ts`
- [ ] 建立 `module.metadata.ts`

#### 2. 定義資料模型

- [ ] 建立 `cost.model.ts`
- [ ] 建立 `invoice.model.ts`
- [ ] 建立 `payment.model.ts`
- [ ] 建立 `budget.model.ts`
- [ ] 建立 `ledger.model.ts`

#### 3. 建立資料庫 Schema

- [ ] 建立 migration: `create_costs_table.sql`
- [ ] 建立 migration: `create_invoices_table.sql`
- [ ] 建立 migration: `create_payments_table.sql`
- [ ] 建立 migration: `create_budgets_table.sql`
- [ ] 建立 migration: `create_ledger_entries_table.sql`
- [ ] 建立 RLS policies

#### 4. 實作 Repository 層

- [ ] 建立 `cost.repository.ts`
- [ ] 建立 `invoice.repository.ts`
- [ ] 建立 `payment.repository.ts`
- [ ] 建立 `budget.repository.ts`
- [ ] 建立 `ledger.repository.ts`

#### 5. 實作 Service 層（子模組）

- [ ] 建立 `cost.service.ts` (成本追蹤)
- [ ] 建立 `invoice.service.ts` (發票管理)
- [ ] 建立 `payment.service.ts` (付款處理)
- [ ] 建立 `budget.service.ts` (預算管理)
- [ ] 建立 `ledger.service.ts` (總帳)
- [ ] 建立 `finance.service.ts` (統籌服務)

#### 6. 實作 UI 元件

- [ ] 建立 `cost-tracking.component.ts`
- [ ] 建立 `invoice-list.component.ts`
- [ ] 建立 `invoice-detail.component.ts`
- [ ] 建立 `payment-list.component.ts`
- [ ] 建立 `budget-overview.component.ts`
- [ ] 建立 `financial-report.component.ts`

#### 7. 實作報表功能

- [ ] 成本分析報表
- [ ] 預算執行報表
- [ ] 付款狀態報表
- [ ] 財務總覽儀表板

#### 8. 整合與測試

- [ ] 整合 Task Domain (任務成本)
- [ ] 整合 Acceptance Domain (驗收觸發付款)
- [ ] 整合 Material Domain (材料成本)
- [ ] 整合 Workflow Domain (付款審核流程)
- [ ] 撰寫測試
- [ ] 效能測試（大量財務資料）

#### 9. 安全性增強

- [ ] 敏感財務資料加密
- [ ] 存取權限細化
- [ ] 稽核記錄強化

#### 10. 文件撰寫

- [ ] 財務管理指南
- [ ] 成本追蹤文件
- [ ] 發票與付款流程
- [ ] API 文件

**預計時間**: 4 週  
**依賴**: Log Domain, Workflow Domain, Acceptance Domain  
**關鍵成功因素**: 資料安全性與準確性

---

## 📦 Phase 3: Material Domain 實作

### 目標
實作材料庫存、申請與資產管理系統

### 任務清單

#### 1. 建立基礎結構

- [ ] 建立 `domains/material/` 資料夾
- [ ] 建立 `material.module.ts`
- [ ] 建立 `module.metadata.ts`

#### 2. 定義資料模型

- [ ] 建立 `material.model.ts`
- [ ] 建立 `material-transaction.model.ts`
- [ ] 建立 `material-requisition.model.ts`
- [ ] 建立 `asset.model.ts`

#### 3. 建立資料庫 Schema

- [ ] 建立 migration: `create_materials_table.sql`
- [ ] 建立 migration: `create_material_transactions_table.sql`
- [ ] 建立 migration: `create_material_requisitions_table.sql`
- [ ] 建立 migration: `create_assets_table.sql`
- [ ] 建立 RLS policies

#### 4. 實作 Repository 與 Service 層

- [ ] 建立 `material.repository.ts`
- [ ] 建立 `material.service.ts`
- [ ] 建立 `inventory.service.ts`
- [ ] 建立 `requisition.service.ts`
- [ ] 建立 `asset.service.ts`

#### 5. 實作 UI 元件

- [ ] 建立 `material-list.component.ts`
- [ ] 建立 `inventory-management.component.ts`
- [ ] 建立 `requisition-form.component.ts`
- [ ] 建立 `asset-tracker.component.ts`

#### 6. 整合與測試

- [ ] 整合 Task Domain (任務材料)
- [ ] 整合 Finance Domain (材料成本)
- [ ] 整合 Workflow Domain (申請審核)
- [ ] 撰寫測試

#### 7. 文件撰寫

- [ ] 材料管理指南
- [ ] 申請流程文件
- [ ] API 文件

**預計時間**: 4 週  
**依賴**: Log Domain, Workflow Domain, Finance Domain  
**優先級**: 🟠 高（推薦）

---

## 🎯 Phase 4: Optional Domains

### Safety Domain（安全域）

**狀態**: ⬜ 可選  
**預計時間**: 3 週  
**依賴**: Log Domain, Workflow Domain

### Communication Domain（通訊域）

**狀態**: ⬜ 可選  
**預計時間**: 3 週  
**依賴**: Log Domain

---

## 📊 整體驗證檢查清單

### 架構驗證

- [ ] 平台層與業務域清楚分離
- [ ] 資料夾結構符合 next.md 定義
- [ ] 所有 6 個必要域已實作並註冊
- [ ] Module Registry 正確管理所有域
- [ ] 依賴關係正確配置

### 功能驗證

- [ ] 跨域事件通訊正常運作
- [ ] 完整任務管理工作流程可執行
- [ ] 活動日誌正確記錄所有操作
- [ ] 工作流程引擎穩定運作
- [ ] 品質檢驗流程完整
- [ ] 驗收流程可正常執行
- [ ] 財務追蹤與報告功能正常
- [ ] 材料管理系統運作正常

### 效能驗證

- [ ] 事件處理效能測試通過
- [ ] 大量資料處理測試通過
- [ ] 記憶體洩漏測試通過
- [ ] UI 回應時間符合要求

### 測試驗證

- [ ] 所有域單元測試通過
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 測試覆蓋率達 80%+

### 文件驗證

- [ ] 所有域有完整 API 文件
- [ ] 使用者指南完整
- [ ] 開發者指南完整
- [ ] 架構文件更新

### 安全驗證

- [ ] 所有域有 RLS policies
- [ ] 敏感資料加密
- [ ] 存取控制正確配置
- [ ] 安全審計通過

---

## 🚀 快速啟動指令

### 建立新域的模板指令

```bash
# 建立新域資料夾
mkdir -p src/app/core/blueprint/domains/{domain-name}

# 建立基礎檔案
cd src/app/core/blueprint/domains/{domain-name}
touch {domain-name}.module.ts
touch {domain-name}.service.ts
touch {domain-name}.repository.ts
touch {domain-name}.component.ts
touch {domain-name}.model.ts
touch {domain-name}.routes.ts
touch module.metadata.ts
touch index.ts
touch {domain-name}.module.spec.ts
```

### 建立資料庫 Migration

```bash
# 建立新 migration
touch $(date +%Y%m%d)_XX_create_{table-name}_table.sql
```

### 執行測試

```bash
# 執行特定域的測試
yarn test -- domains/{domain-name}

# 執行所有測試
yarn test

# 執行測試並產生覆蓋率報告
yarn test-coverage
```

---

## 📞 支援與資源

### 相關文件
- 架構分析: `GigHub_Blueprint_Architecture_Analysis.md`
- 視覺化總結: `Blueprint_Visual_Gap_Summary.md`
- 藍圖定義: `../next.md`

### 開發資源
- Angular 文件: https://angular.dev
- ng-alain 文件: https://ng-alain.com
- Firebase 文件: https://firebase.com/docs

---

**最後更新**: 2025-12-12  
**版本**: 1.0.0
