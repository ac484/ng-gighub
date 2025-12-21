
# ng-gighub-docs — 文件總覽（規範化版）

此資料夾包含 GigHub 專案的設計與操作文件，依業務能力模組化組織。文件以清楚的目錄與命名慣例呈現，供開發、維運與稽核使用。

---

## 主要目錄

```
api/                     # API
├─ interface-spec/        # API 介面規格
architecture/            # 系統架構
data-model/              # 資料模型
deployment/              # 部署
design/                  # 設計
functions/               # 函數
getting-started/         # 快速開始
operations/              # 維運
overview/                # 總覽
principles/              # 原則
security/                # 安全
ui-theme/                # 主題
```

### 目錄說明

* **api/**：外部與內部 API 規格、版本控制與變更記錄
* **api/interface-spec/**：JSON、Firestore 資料結構與契約（契約導向實作指南）
* **architecture/**：系統高階架構圖、三層架構（UI → Service → Repository）與模組邊界
* **data-model/**：Firestore collection 結構、索引與資料關聯圖
* **deployment/**：Firebase 部署流程、CI/CD 指南、資源計價與成本控制
* **design/**：介面流程、UI 元件設計原則、可存取性與主題指引
* **functions/**：Firebase Functions（含 functions-ai、functions-ai-document）使用規範、權限與測試方法
* **getting-started/**：開發者上手指引、環境設定、本地啟動步驟與測試指令
* **operations/**：監控、日誌、錯誤處理、備援與跑版回報流程
* **overview/**：專案摘要、核心目標、範圍與關鍵限制
* **principles/**：編碼、架構與安全原則（含 Three-Layer、Repository pattern、Signals、inject() 等）
* **security/**：Firestore Security Rules、Firebase Auth 驗證流程、機密管理、前端安全限制
* **ui-theme/**：主題變數、樣式指南與 Angular Signals 範例

---

## 檔案命名規範

1. **統一格式**：`序號-模組-說明.md`

   * 例：`01-api-overview.md`、`02-api-interface-spec.md`
2. **規格檔**：

   * JSON Schema：`*.schema.json`
   * API 契約：`*.contract.md`
3. **序號**：章節檔以序號開頭維持順序
4. **版本化**：多版本放子資料夾 `v1/`、`v2/`，首頁維護變更摘要
5. **說明**：英文短語描述文件核心內容，避免過長

---

## 結構與維護規範

* 資料夾以 **業務能力** 為單位，對外暴露穩定文件
* 文件變更需在 PR 中附上摘要、影響範圍與相關實作檔案連結
* 文件保持最小但完整，只加入當前必要資訊，避免未實作設計
* 安全與合規事項在相關模組文件明確標註

  * 例：functions-ai 使用限制、OCR 使用 functions-ai-document 流程
* 重要文件（架構、部署、安全）每 6 個月檢視一次並紀錄變更

---

## 聯絡與貢獻

* 補充或修改文件請開 PR，描述目的與影響範圍
* 文件審查者列表請在 repo README 指定

---

## 建議起始檔名範例

```
01-api-overview.md
02-api-interface-spec.md
03-api-architecture-system-diagram.md
04-api-data-model-firestore-schema.md
05-api-deployment-firebase-ci-cd.md
06-api-design-ui-flow.md
07-api-design-ui-components.md
08-api-ui-theme-variables.md
09-api-ui-theme-angular-signals.md
10-api-functions-ai-guidelines.md
11-api-functions-ai-document-workflow.md
12-api-getting-started-environment-setup.md
13-api-getting-started-local-testing.md
14-api-operations-monitoring-logs.md
15-api-operations-error-handling.md
16-api-security-firestore-rules.md
17-api-security-authentication.md
18-api-security-secret-management.md
```

---