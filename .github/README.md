# GigHub - GitHub Configuration

## 📖 Quick Navigation

### For Developers
- **統一代理** (推薦): [`.github/agents/gighub-unified.agent.md`](./agents/gighub-unified.agent.md) - 所有開發規範的統一入口
- **快速參考**: [`.github/instructions/quick-reference.instructions.md`](./instructions/quick-reference.instructions.md) - 常用模式速查
- **核心規範**: [`⭐.md`](../⭐.md) - 專案開發規範精華

### For GitHub Copilot
- **主要指引**: [`.github/copilot-instructions.md`](./copilot-instructions.md) - Copilot 必讀文件
- **MCP 工具**: [`.github/copilot/mcp-servers.yml`](./copilot/mcp-servers.yml) - context7、sequential-thinking、software-planning-tool
- **約束規則**: [`.github/copilot/constraints.md`](./copilot/constraints.md) - 禁止模式清單

### Setup & Validation
- **Copilot 設置**: [`.github/COPILOT_SETUP.md`](./COPILOT_SETUP.md) - 完整設置指南
- **驗證測試**: [`.github/COPILOT_INSTRUCTIONS_VALIDATION.md`](./COPILOT_INSTRUCTIONS_VALIDATION.md) - 測試與驗證
- **快速開始**: [`.github/QUICK_START_COPILOT.md`](./QUICK_START_COPILOT.md) - 5 分鐘上手

## 📂 Directory Structure

```
.github/
├── agents/
│   └── gighub-unified.agent.md      ⭐ 統一開發代理 (整合所有規範)
├── instructions/                     📚 模組化指引 (8 個檔案)
│   ├── quick-reference.instructions.md
│   ├── angular-modern-features.instructions.md
│   ├── enterprise-angular-architecture.instructions.md
│   ├── typescript-5-es2022.instructions.md
│   ├── ng-alain-delon.instructions.md
│   ├── ng-zorro-antd.instructions.md
│   ├── sql-sp-generation.instructions.md
│   └── memory-bank.instructions.md
├── copilot/
│   ├── mcp-servers.yml              🔧 MCP 工具配置
│   ├── constraints.md               🚫 禁止模式
│   └── shortcuts/
│       └── chat-shortcuts.md        ⌨️ 快捷指令
├── workflows/
│   ├── copilot-setup-steps.yml      🤖 Copilot 環境設置
│   ├── ci.yml                       🔨 持續整合
│   └── deploy-site.yml              🚀 部署工作流
├── copilot-instructions.md          📖 主要指引檔案
├── COPILOT_SETUP.md                 📝 設置文檔
├── COPILOT_INSTRUCTIONS_VALIDATION.md 🧪 驗證指南
└── README.md                        📌 本檔案
```

## 🎯 核心理念

### 必要工具使用 (MANDATORY)
1. **context7** - 查詢官方文檔
2. **sequential-thinking** - 邏輯分析
3. **software-planning-tool** - 計畫制定

### 開發規範
- 三層架構嚴格分離 (UI → Service → Repository)
- Repository 模式強制 (禁止直接操作 Firestore)
- 事件驅動架構 (透過 BlueprintEventBus)
- Signals 狀態管理
- OnPush 變更檢測

### 禁止行為
- ❌ 建立 NgModule
- ❌ 使用 `any` 類型
- ❌ 直接操作 Firestore
- ❌ 手動管理訂閱
- ❌ Constructor 中執行業務邏輯

## 🚀 Quick Start

### 開始開發
```bash
# 1. 讀取統一代理
cat .github/agents/gighub-unified.agent.md

# 2. 查看快速參考
cat .github/instructions/quick-reference.instructions.md

# 3. 閱讀核心規範
cat ⭐.md

# 4. 開始開發
yarn start
```

### 使用 Copilot
```
@workspace 請根據統一代理的規範幫我建立一個任務列表元件
```

## 📚 Documentation

### Essential Reads
1. **統一代理** - 所有規範的統一入口點
2. **快速參考** - 常用模式與反模式
3. **⭐.md** - 專案核心規範

### Framework Guides
- Angular 20 現代特性
- Enterprise 架構模式
- ng-alain/ng-zorro 整合
- TypeScript 5.9 標準

### Tools & Testing
- MCP 工具使用指南
- Copilot 驗證測試
- CI/CD 工作流程

## 🤝 Contributing

開發前請務必：
1. 閱讀統一代理規範
2. 使用 context7 查詢文檔
3. 使用 sequential-thinking 分析
4. 使用 software-planning-tool 計畫
5. 遵循 ⭐.md 核心規範

## 📞 Support

- **文檔問題**: 參考 `.github/agents/gighub-unified.agent.md`
- **設置問題**: 參考 `.github/COPILOT_SETUP.md`
- **驗證問題**: 參考 `.github/COPILOT_INSTRUCTIONS_VALIDATION.md`

---

**Last Updated**: 2025-12-16  
**Version**: 2.0 (Unified Agent)
