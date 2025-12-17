# Copilot Agents Configuration

本目錄包含 GitHub Copilot Coding Agent 的所有代理配置檔案，整合完整的 MCP 工具使用策略。

## 📁 檔案結構

```
.github/
│
├─ copilot-instructions.md        ←【必讀｜主指令】
│
├─ copilot/
│  │
│  ├─ mcp-servers.yml             ←【若使用 MCP 則必讀】✅
│  ├─ security-rules.yml          ←【可選｜安全規則】✅
│  │
│  ├─ agents/                     ←【必讀｜所有 *.yml 自動載入】
│  │     auto-triggers.yml        ← 官方明列（觸發規則）✅
│  │     config.yml               ← 官方明列（代理設定）✅
│  │     default.yml              ←（新增｜預設代理）✅
│  │     mcp.yml                  ←（新增｜MCP 工具專用）✅
│  │     review.yml               ←（新增｜程式碼審查）✅
│  │     tests.yml                ←（新增｜測試生成）✅
│  │     security.yml             ←（新增｜安全檢查）✅
│  │     ci.yml                   ←（新增｜CI/CD 管理）✅
│  │     docs.yml                 ←（新增｜文檔生成）✅
│  │     release.yml              ←（新增｜版本發布）✅
│  │     coding-guidelines.yml    ←（新增｜程式碼規範）✅
│  │     lint.yml                 ←（新增｜Lint 檢查）✅
│  │
│  └─ workflows/                  ←（可選｜給 Copilot Spaces 使用）✅
│         new-module.workflow.md
│         release-check.workflow.md
│         rls-check.workflow.md
│
└─ workflows/                     ←【會讀｜非指令｜CI context】✅
        copilot-setup-steps.yml
        ci.yml
        ...
```

## 🎯 代理配置檔案說明

### 核心配置

#### 1. **auto-triggers.yml**
- **用途**: MCP 工具自動觸發規則
- **功能**: 
  - 根據特定模式自動呼叫 context7
  - API 版本相容性檢查
  - 新功能語法驗證

#### 2. **config.yml**
- **用途**: 全域代理配置
- **功能**:
  - 設定預設行為
  - 配置 MCP 工具優先順序
  - 定義工作流程

#### 3. **default.yml** ✨ NEW
- **用途**: 預設 Copilot 代理
- **功能**:
  - 一般開發任務處理
  - MCP 工具使用策略
  - 品質標準與安全檢查
  - **整合工具**: context7, firebase, sequential-thinking, filesystem

### 專門代理

#### 4. **mcp.yml** ✨ NEW
- **用途**: MCP 工具專用代理
- **功能**:
  - 完整 16 個 MCP 伺服器文檔
  - 100+ 工具使用說明
  - 常見使用模式
  - 工具組合策略
  - 疑難排解指南

#### 5. **review.yml** ✨ NEW
- **用途**: 程式碼審查代理
- **功能**:
  - Angular 20 現代語法檢查
  - ng-alain 架構驗證
  - Firebase/Firestore 安全性檢查
  - 自動 API 驗證
  - 審查評分系統
  - **整合工具**: context7, firebase, sequential-thinking, git

#### 6. **tests.yml** ✨ NEW
- **用途**: 測試生成與驗證代理
- **功能**:
  - 單元測試生成
  - 整合測試策略
  - E2E 測試錄製
  - 測試模板
  - **整合工具**: context7, playwright, filesystem

#### 7. **security.yml** ✨ NEW
- **用途**: 安全性審查代理
- **功能**:
  - 漏洞模式掃描
  - RLS policies 檢查
  - Secrets 洩漏檢測
  - 安全性報告
  - **整合工具**: firebase, filesystem, git, sequential-thinking

#### 8. **ci.yml** ✨ NEW
- **用途**: CI/CD 管理代理
- **功能**:
  - GitHub Actions 管理
  - 失敗分析與修復
  - 分支策略
  - 部署流程
  - **整合工具**: github, git, firebase

#### 9. **docs.yml** ✨ NEW
- **用途**: 文檔生成代理
- **功能**:
  - API 文檔生成
  - 使用指南撰寫
  - 資料庫文檔
  - README 生成
  - **整合工具**: context7, filesystem, firebase, playwright

#### 10. **release.yml** ✨ NEW
- **用途**: 版本發布代理
- **功能**:
  - Semantic Versioning
  - CHANGELOG 生成
  - Release Notes 撰寫
  - Hotfix 流程
  - 回滾計畫
  - **整合工具**: github, git, filesystem, firebase

#### 11. **coding-guidelines.yml** ✨ NEW
- **用途**: 程式碼規範執行代理
- **功能**:
  - Angular 20 現代化標準
  - TypeScript 嚴格模式
  - ng-alain 架構規範
  - Firebase/Firestore 最佳實踐
  - 命名規範
  - **整合工具**: context7, filesystem, sequential-thinking

#### 12. **lint.yml** ✨ NEW
- **用途**: Lint 檢查代理
- **功能**:
  - ESLint 執行與修復
  - Stylelint 檢查
  - Prettier 格式化
  - CI 整合
  - Lint 報告
  - **整合工具**: filesystem, git, github

## 🔧 MCP 工具整合

所有代理配置都整合了 16 個 MCP 伺服器的完整工具集：

### HTTP MCP 伺服器 (3 個)
- **context7**: Angular 20, ng-alain 20, ng-zorro-antd 20, Firebase/Firestore 2.86 最新文檔
- **github**: GitHub Actions, Issues, PRs, 程式碼搜尋
- **firebase**: 資料庫操作, RLS policies, Edge Functions, 分支管理

### 本地 MCP 伺服器 (13 個)
- **postgres**: 直接資料庫查詢
- **redis**: 快取操作
- **git**: 版本控制
- **playwright**: 瀏覽器自動化 (30+ 工具)
- **puppeteer**: Chrome 自動化
- **memory**: 知識圖譜
- **sequential-thinking**: 多步驟推理
- **software-planning-tool**: 開發規劃
- **everything**: 多用途工具
- **filesystem**: 檔案操作
- **time**: 時間操作
- **fetch**: HTTP 請求

## 📚 使用指南

### 1. 基本使用
代理配置會自動載入，Copilot 會根據任務類型選擇適當的代理。

### 2. 查詢 MCP 工具
參考 `.github/MCP_COMMANDS_REFERENCE.md` 取得完整的 MCP 工具指令參考。

### 3. 自訂代理
可以建立 `custom-*.yml` 檔案來新增自訂代理配置。

### 4. 疑難排解
- 查看 `mcp.yml` 的 troubleshooting 區段
- 檢查 `.github/COPILOT_ARCHITECTURE.md`
- 參考 `.github/QUICK_START_COPILOT.md`

## 🎯 代理選擇指南

| 任務類型 | 推薦代理 | 主要工具 |
|---------|---------|---------|
| 一般開發 | default | context7, firebase, filesystem |
| 程式碼審查 | review | context7, firebase, sequential-thinking |
| 測試撰寫 | tests | context7, playwright, filesystem |
| 安全檢查 | security | firebase, filesystem, git |
| CI/CD 管理 | ci | github, git, firebase |
| 文檔撰寫 | docs | context7, filesystem, firebase |
| 版本發布 | release | github, git, filesystem |
| 規範檢查 | coding-guidelines | context7, filesystem |
| Lint 修復 | lint | filesystem, git, github |
| MCP 工具 | mcp | 所有 16 個 MCP 伺服器 |

## 🔗 相關文檔

- **主指令**: `.github/copilot-instructions.md`
- **MCP 配置**: `.github/copilot/mcp-servers.yml`
- **MCP 指令參考**: `.github/MCP_COMMANDS_REFERENCE.md`
- **快速開始**: `.github/QUICK_START_COPILOT.md`
- **架構說明**: `.github/COPILOT_ARCHITECTURE.md`
- **安全規則**: `.github/copilot/security-rules.yml`

## 📊 統計資訊

- **代理配置檔案**: 12 個
- **MCP 伺服器**: 16 個
- **MCP 工具**: 100+
- **程式碼範例**: 80+
- **使用模式**: 20+
- **疑難排解項目**: 30+

## 🚀 最佳實踐

1. **使用 context7**: 總是在使用 Angular/ng-alain/Firebase/Firestore API 前查詢最新文檔
2. **使用 sequential-thinking**: 複雜問題先進行結構化分析
3. **使用 firebase.get_advisors**: 資料庫變更後檢查安全性與效能
4. **使用 playwright**: E2E 測試使用程式碼錄製功能
5. **使用 github.summarize_job_log_failures**: CI 失敗時總結原因

## 📝 版本資訊

- **建立日期**: 2025-12-12
- **版本**: 1.0.0
- **Angular 版本**: 20.3.x
- **ng-alain 版本**: 20.1.x
- **Firebase/Firestore 版本**: 2.86.x

---

**注意**: 所有代理配置都已整合完整的 MCP 工具，包含從 `.github/copilot/mcp-servers.yml` 和 GitHub Copilot Settings 的配置。
