# 專案檔案樹狀圖 (Project File Tree)

> **文件版本**: 1.0.0  
> **建立日期**: 2025-12-16  
> **目的**: 提供 GigHub 專案完整的檔案結構視覺化

---

## 📂 專案根目錄結構

```
ng-gighub/
├── .github/                           # GitHub 配置與 Copilot 設定
│   ├── agents/                        # 統一開發代理
│   │   └── ng-gighub.agent.md
│   ├── copilot/                       # Copilot 配置
│   │   ├── constraints.md
│   │   ├── mcp-servers.yml
│   │   ├── security-rules.yml
│   │   └── shortcuts/
│   ├── instructions/                  # 開發指引文檔
│   │   ├── angular-modern-features.instructions.md
│   │   ├── enterprise-angular-architecture.instructions.md
│   │   ├── typescript-5-es2022.instructions.md
│   │   ├── ng-alain-delon.instructions.md
│   │   ├── ng-zorro-antd.instructions.md
│   │   ├── sql-sp-generation.instructions.md
│   │   ├── memory-bank.instructions.md
│   │   └── quick-reference.instructions.md
│   ├── workflows/                     # CI/CD 工作流程
│   ├── copilot-instructions.md
│   ├── COPILOT_INSTRUCTIONS_VALIDATION.md
│   ├── COPILOT_SECRETS_SETUP.md
│   └── README.md
│
├── docs/                              # 專案文檔
│   ├── Archived/                      # 已歸檔的舊文檔
│   │   └── SETC-000-*.md
│   ├── discussions/                   # SETC 工作流程文檔
│   │   ├── 00-core/                   # 核心文檔
│   │   │   ├── ⭐.md
│   │   │   ├── README.md
│   │   │   ├── SUMMARY.md
│   │   │   ├── TREE.md               # 本文件
│   │   │   └── TREE-EXPANSION.md
│   │   ├── 01-overview/               # 總覽文檔
│   │   │   ├── README.md
│   │   │   ├── SETC.md
│   │   │   ├── SETC-MASTER-INDEX.md
│   │   │   ├── SETC-ANALYSIS.md
│   │   │   ├── SETC-TASKS-SUMMARY.md
│   │   │   ├── SETC-COMPLETION-PLAN.md
│   │   │   ├── SETC-DOCUMENTATION-VALIDATION.md
│   │   │   └── SETC-NEXT-MODULES-PLANNING.md
│   │   ├── 02-planning/               # 規劃文檔
│   │   │   ├── README.md
│   │   │   ├── MODULE-PLANNING.md
│   │   │   └── MODULE-MODIFICATIONS.md
│   │   ├── 03-implementation/         # 實作指南
│   │   │   ├── README.md
│   │   │   ├── SETC-IMPLEMENTATION-INDEX.md
│   │   │   ├── SETC-IMPLEMENTATION-READINESS.md
│   │   │   ├── SETC-IMPLEMENTATION-SUMMARY.md
│   │   │   └── SETC-IMPLEMENTATION-001 ~ 008.md
│   │   ├── 10-issue-module/           # Issue Module (SETC-001~008)
│   │   │   ├── README.md
│   │   │   └── SETC-001 ~ 008.md
│   │   ├── 20-contract-module/        # Contract Module (SETC-009~017)
│   │   │   ├── README.md
│   │   │   └── SETC-009 ~ 017.md
│   │   ├── 30-automation/             # Event Automation (SETC-018~023)
│   │   │   ├── README.md
│   │   │   └── SETC-018 ~ 023.md
│   │   ├── 40-finance/                # Finance Module (SETC-024~031, 062~069)
│   │   │   ├── README.md
│   │   │   └── SETC-024 ~ 031, 062 ~ 069.md
│   │   ├── 50-warranty-module/        # Warranty Module (SETC-032~039)
│   │   │   ├── README.md
│   │   │   └── SETC-032 ~ 039.md
│   │   ├── 60-defect-module/          # Defect Module (SETC-040~045)
│   │   │   ├── README.md
│   │   │   └── SETC-040 ~ 045.md
│   │   ├── 70-task-module/            # Task Module (SETC-046~053)
│   │   │   ├── README.md
│   │   │   └── SETC-046 ~ 053.md
│   │   ├── 80-acceptance-module/      # Acceptance Module (SETC-054~061)
│   │   │   ├── README.md
│   │   │   └── SETC-054 ~ 061.md
│   │   └── README.md
│   ├── ARCHITECTURE.md
│   ├── README.md
│   └── SETC.md
│
├── src/                               # 應用程式原始碼
│   ├── app/                           # Angular 應用
│   │   ├── core/                      # 核心模組
│   │   │   ├── blueprint/             # 藍圖模組
│   │   │   │   ├── models/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── implementations/
│   │   │   │   │   │   ├── issue/
│   │   │   │   │   │   ├── contract/
│   │   │   │   │   │   ├── warranty/
│   │   │   │   │   │   ├── defect/
│   │   │   │   │   │   ├── task/
│   │   │   │   │   │   ├── acceptance/
│   │   │   │   │   │   ├── invoice/
│   │   │   │   │   │   ├── payment/
│   │   │   │   │   │   └── log/
│   │   │   │   │   ├── module-factory.ts
│   │   │   │   │   └── module-registry.ts
│   │   │   │   ├── repositories/
│   │   │   │   ├── services/
│   │   │   │   └── index.ts
│   │   │   ├── data-access/           # 資料存取層
│   │   │   │   ├── repositories/
│   │   │   │   └── models/
│   │   │   ├── services/              # 核心服務
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── permission.service.ts
│   │   │   │   ├── blueprint-context.service.ts
│   │   │   │   ├── organization-context.service.ts
│   │   │   │   ├── user-context.service.ts
│   │   │   │   └── enhanced-event-bus.service.ts
│   │   │   └── guards/                # 路由守衛
│   │   ├── shared/                    # 共享模組
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── routes/                    # 路由與頁面
│   │   │   ├── dashboard/
│   │   │   ├── blueprint/
│   │   │   ├── organization/
│   │   │   └── ...
│   │   ├── layout/                    # 佈局元件
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.component.ts
│   ├── assets/                        # 靜態資源
│   ├── environments/                  # 環境配置
│   ├── styles/                        # 全域樣式
│   ├── index.html
│   ├── main.ts
│   └── styles.less
│
├── functions/                         # Firebase Cloud Functions
│   ├── src/
│   │   ├── ai/
│   │   ├── notifications.ts
│   │   └── index.ts
│   └── package.json
│
├── functions-ai/                      # AI 相關 Functions
├── functions-analytics/               # 分析相關 Functions
├── functions-auth/                    # 認證相關 Functions
├── functions-calculation/             # 計算相關 Functions
├── functions-notification/            # 通知相關 Functions
├── functions-realtime/                # 即時功能 Functions
│
├── e2e/                               # E2E 測試
│   └── src/
│
├── _mock/                             # Mock 資料
├── _cli-tpl/                          # CLI 模板
│
├── .vscode/                           # VS Code 配置
├── firebase.json                      # Firebase 配置
├── firestore.rules                    # Firestore 安全規則
├── firestore.indexes.json             # Firestore 索引
├── angular.json                       # Angular 配置
├── tsconfig.json                      # TypeScript 配置
├── package.json                       # 套件管理
├── yarn.lock                          # Yarn 鎖定檔
├── ⭐.md                              # 核心開發規範
└── README.md
```

---

## 🎯 關鍵目錄說明

### 📚 文檔結構 (docs/)

#### 核心文檔層級
- **00-core/**: 專案核心規範與總覽
- **01-overview/**: SETC 工作流程總體規劃
- **02-planning/**: 模組開發規劃文檔
- **03-implementation/**: 詳細實作指南

#### 模組文檔層級 (10-80 系列)
- **10-issue-module/**: 問題管理模組 (8 任務)
- **20-contract-module/**: 合約管理模組 (9 任務)
- **30-automation/**: 事件驅動自動化 (6 任務)
- **40-finance/**: 財務模組 (16 任務)
- **50-warranty-module/**: 保固管理模組 (8 任務)
- **60-defect-module/**: 缺陷管理模組 (6 任務)
- **70-task-module/**: 任務模組擴展 (8 任務)
- **80-acceptance-module/**: 驗收模組擴展 (8 任務)

---

### 🏗️ 程式碼結構 (src/app/)

#### 三層架構

```
UI 層 (routes/)
    ↓
Service 層 (core/services/)
    ↓
Repository 層 (core/data-access/)
    ↓
Firestore
```

#### 核心模組
- **core/blueprint/**: 藍圖核心邏輯
  - **modules/implementations/**: 各模組實作
  - **services/**: 藍圖服務層
  - **repositories/**: 資料存取層

#### 共享資源
- **shared/**: 共享元件、指令、管道
- **layout/**: 全域佈局元件
- **routes/**: 功能頁面路由

---

### ⚙️ Firebase Functions

| 目錄 | 用途 |
|------|------|
| `functions/` | 主要 Cloud Functions（AI、通知） |
| `functions-ai/` | AI 相關功能 |
| `functions-analytics/` | 數據分析功能 |
| `functions-auth/` | 認證相關功能 |
| `functions-calculation/` | 計算邏輯功能 |
| `functions-notification/` | 通知推送功能 |
| `functions-realtime/` | 即時功能 |

---

## 📊 統計資訊

### 文檔統計
- **總文檔數**: 93+
- **SETC 任務數**: 69
- **模組數**: 8
- **核心指引數**: 8

### 程式碼統計
- **模組實作數**: 9 (Issue, Contract, Warranty, Defect, Task, Acceptance, Invoice, Payment, Log)
- **Cloud Functions 數**: 7 個專案
- **E2E 測試**: 涵蓋主要模組

---

## 🔗 相關文檔

- **專案規範**: `/⭐.md`
- **架構文檔**: `/docs/ARCHITECTURE.md`
- **開發指引**: `/.github/instructions/`
- **SETC 主索引**: `/docs/discussions/01-overview/SETC-MASTER-INDEX.md`

---

## 📝 命名規範

### 文檔命名
- 核心文檔: `00-core/*.md`
- 總覽文檔: `01-overview/SETC-*.md`
- 規劃文檔: `02-planning/MODULE-*.md`
- 實作指南: `03-implementation/SETC-IMPLEMENTATION-*.md`
- 模組任務: `[10-80]-*-module/SETC-NNN-*.md`

### 程式碼命名
- 模組目錄: `kebab-case` (例如: `issue-module`)
- 服務檔案: `*.service.ts`
- Repository: `*.repository.ts`
- 元件: `*.component.ts`
- 模型: `*.model.ts`

---

## 🎯 導航提示

### 新手入門
1. 📖 閱讀 `/⭐.md` - 了解核心規範
2. 📊 查看 `/docs/ARCHITECTURE.md` - 理解系統架構
3. 📋 參考 `/docs/discussions/README.md` - 掌握文檔結構

### 開發人員
1. 🔍 查找對應模組目錄 (`src/app/core/blueprint/modules/implementations/`)
2. 📖 閱讀模組文檔 (`docs/discussions/[10-80]-*-module/`)
3. 🔧 參考實作指南 (`docs/discussions/03-implementation/`)

### 文檔維護
1. 📝 新增文檔遵循命名規範
2. 📂 放置於對應目錄
3. 🔗 更新相關索引文件
4. ✅ 添加至對應 README

---

**最後更新**: 2025-12-16  
**維護者**: GigHub Development Team  
**版本**: 1.0.0
