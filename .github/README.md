# GigHub - GitHub Configuration

## 🎯 核心理念

**統一代理** (Unified Agent) - 像一位訓練有素的士兵，熟知所有武器（工具）與戰術（規範）

## 📂 精簡後結構

```
.github/
├── agents/
│   └── gighub-unified.agent.md      ⭐ 唯一代理 (整合所有規範)
│
├── instructions/                     📚 專業知識庫 (8 個檔案)
│   ├── quick-reference.instructions.md
│   ├── angular-modern-features.instructions.md
│   ├── enterprise-angular-architecture.instructions.md
│   ├── typescript-5-es2022.instructions.md
│   ├── ng-alain-delon.instructions.md
│   ├── ng-zorro-antd.instructions.md
│   ├── sql-sp-generation.instructions.md
│   └── memory-bank.instructions.md
│
├── copilot/                          🔧 配置與規則
│   ├── mcp-servers.yml
│   ├── constraints.md
│   ├── security-rules.yml
│   ├── memory.jsonl
│   └── shortcuts/
│       └── chat-shortcuts.md
│
├── workflows/                        🤖 CI/CD 工作流
│   ├── ci.yml
│   ├── copilot-setup-steps.yml
│   └── deploy-site.yml
│
├── ISSUE_TEMPLATE/                   📋 問題模板
├── PULL_REQUEST_TEMPLATE/            📋 PR 模板
│
├── copilot-instructions.md           📖 Copilot 入口
├── README.md                         📌 本檔案
├── COPILOT_INSTRUCTIONS_VALIDATION.md 🧪 驗證指南
└── COPILOT_SECRETS_SETUP.md          🔐 祕密配置
```

## 🚀 快速開始

### For Developers
```bash
# 1. 讀取統一代理（你的指揮官）
cat .github/agents/gighub-unified.agent.md

# 2. 查看快速參考（速查表）
cat .github/instructions/quick-reference.instructions.md

# 3. 閱讀核心規範（作戰手冊）
cat ⭐.md

# 4. 開始開發
yarn start
```

### For GitHub Copilot
```
@workspace 請根據統一代理規範建立任務管理元件
```

## 🛠️ 統一代理的武器庫

### 📚 知識庫 (代理會自動使用)
1. **快速參考** (11KB) - 常用模式速查表
2. **Angular 現代特性** (23KB) - Signals、Standalone、新控制流
3. **企業架構** (18KB) - 三層架構、Repository、Store 模式
4. **TypeScript 標準** (9.9KB) - 嚴格模式、型別安全
5. **ng-alain 框架** (15KB) - @delon/* 商業元件
6. **ng-zorro 元件** (18KB) - Ant Design UI 元件
7. **SQL 規範** (5.8KB) - 資料庫設計與查詢
8. **文檔模式** (19KB) - 記憶庫與任務管理

### 🔧 必要工具 (強制使用)
1. **context7** 🔍 - 查詢官方文檔與最佳實踐
2. **sequential-thinking** 🧠 - 邏輯分析與問題拆解
3. **software-planning-tool** 📋 - 實施計畫制定

### 📜 規則與配置
- **constraints.md** - 禁止模式清單 (絕對不可違反)
- **security-rules.yml** - 安全規範
- **mcp-servers.yml** - MCP 工具配置
- **⭐.md** - 核心開發規範 (KISS, YAGNI, MVP, SRP)

## 🎯 核心原則

### 架構規範
- **三層架構**: UI → Service → Repository → Firestore
- **Repository 模式**: 強制使用，禁止直接操作 Firestore
- **事件驅動**: 所有模組事件透過 BlueprintEventBus

### 程式碼標準
- ✅ Standalone Components
- ✅ Signals 狀態管理
- ✅ inject() 注入
- ✅ input()/output() 通訊
- ✅ 新控制流 (@if, @for, @switch)
- ✅ OnPush 變更檢測

### 禁止行為
- ❌ NgModule
- ❌ `any` 類型
- ❌ 直接 Firestore 操作
- ❌ 手動訂閱管理
- ❌ Constructor 業務邏輯

## 📊 精簡成果

| 項目 | 精簡前 | 精簡後 | 減少 |
|------|--------|--------|------|
| 代理檔案 | 14 | 1 | -93% |
| 文檔檔案 | 12 | 4 | -67% |
| 總行數 | ~4,500 | ~800 | -82% |
| 維護點 | 26 | 5 | -81% |

## 🔗 重要連結

### 核心文件
- **統一代理**: `.github/agents/gighub-unified.agent.md` ⭐
- **核心規範**: `⭐.md`
- **快速參考**: `.github/instructions/quick-reference.instructions.md`

### 配置與設置
- **Copilot 指引**: `.github/copilot-instructions.md`
- **MCP 配置**: `.github/copilot/mcp-servers.yml`
- **祕密設置**: `.github/COPILOT_SECRETS_SETUP.md`

### 測試與驗證
- **驗證指南**: `.github/COPILOT_INSTRUCTIONS_VALIDATION.md`
- **快捷指令**: `.github/copilot/shortcuts/chat-shortcuts.md`

## 💡 設計哲學

**統一代理就像一位士兵**:
- 🎯 **知道目標** - 明確的開發規範與原則
- 🛠️ **熟知武器** - 清楚每個工具的用途與時機
- 📚 **掌握戰術** - 完整的工作流程與檢查清單
- 🚫 **遵守紀律** - 嚴格的禁止行為清單
- 🎓 **持續學習** - 隨時查詢最新文檔與最佳實踐

## 📞 需要協助？

- **文檔問題**: 查閱此 README
- **配置問題**: 參考 COPILOT_SECRETS_SETUP.md
- **驗證問題**: 使用 COPILOT_INSTRUCTIONS_VALIDATION.md
- **快捷指令**: 查看 copilot/shortcuts/chat-shortcuts.md

---

**最後更新**: 2025-12-16  
**版本**: 3.0 (Streamlined & Intelligent)  
**哲學**: 統一代理 - 訓練有素的士兵，熟知所有武器與戰術
