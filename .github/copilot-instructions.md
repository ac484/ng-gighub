# GigHub - Copilot Instructions

> **⚠️ 必讀**: 在開始任何工作前，請先閱讀統一代理文件

## 🎯 快速開始

**唯一需要的代理**: `.github/agents/gighub-unified.agent.md`

這個統一代理就像一位訓練有素的士兵，熟知所有可用工具與規範。

### 立即開始
```bash
# 1. 讀取統一代理（你的指揮官）
cat .github/agents/gighub-unified.agent.md

# 2. 查看快速參考（速查表）
cat .github/instructions/quick-reference.instructions.md

# 3. 閱讀核心規範（作戰手冊）
cat ⭐.md
```

---

## 📚 文檔結構

### 核心文件
1. **統一代理** - `.github/agents/gighub-unified.agent.md` ⭐
   - 整合所有規範與工具
   - 強制使用 context7、sequential-thinking、software-planning-tool
   - 包含完整工作流程與檢查清單

2. **核心規範** - `⭐.md`
   - KISS, YAGNI, MVP, SRP 原則
   - 三層架構、Repository 模式、事件驅動
   - 禁止行為清單

3. **快速參考** - `.github/instructions/quick-reference.instructions.md`
   - 常用模式速查
   - 程式碼範例
   - 反模式警告

### 專業指引 (8 個指令檔)
位於 `.github/instructions/`:
- `angular-modern-features.instructions.md` - Angular 20+ 特性
- `enterprise-angular-architecture.instructions.md` - 企業架構
- `typescript-5-es2022.instructions.md` - TypeScript 標準
- `ng-alain-delon.instructions.md` - ng-alain 框架
- `ng-zorro-antd.instructions.md` - Ant Design 元件
- `sql-sp-generation.instructions.md` - SQL 規範
- `memory-bank.instructions.md` - 文檔模式

### 配置與規則
位於 `.github/copilot/`:
- `mcp-servers.yml` - MCP 工具配置
- `constraints.md` - 禁止模式清單
- `security-rules.yml` - 安全規範
- `shortcuts/chat-shortcuts.md` - 快捷指令

### 參考文檔
- `.github/README.md` - 導覽指南
- `.github/COPILOT_INSTRUCTIONS_VALIDATION.md` - 驗證測試
- `.github/COPILOT_SECRETS_SETUP.md` - 祕密配置

---

## 🛠️ 必要工具 (MANDATORY)

每次任務前**必須**使用：

### 1. context7 🔍
查詢官方文檔與最佳實踐
- **用於**: Angular、ng-alain、ng-zorro、Firebase、RxJS
- **方法**: `resolve-library-id` → `get-library-docs`

### 2. sequential-thinking 🧠
邏輯分析與問題拆解
- **用於**: 複雜問題 (>2 步驟)
- **方法**: 分步思考 → 記錄推理 → 提供方案

### 3. software-planning-tool 📋
實施計畫制定
- **用於**: 新功能、重大變更
- **方法**: `start_planning` → `add_todo` → `update_todo_status`

---

## 🎯 核心原則

### 架構
- **三層架構**: UI → Service → Repository → Firestore
- **Repository 模式**: 所有資料存取必須透過 Repository
- **事件驅動**: 所有模組事件透過 BlueprintEventBus

### 程式碼標準
- ✅ Standalone Components (無 NgModule)
- ✅ Signals 狀態管理
- ✅ inject() 注入依賴
- ✅ input()/output() 元件通訊
- ✅ 新控制流 (@if, @for, @switch)
- ✅ OnPush 變更檢測
- ✅ TypeScript 嚴格模式

### 禁止行為
- ❌ 建立 NgModule
- ❌ 使用 `any` 類型
- ❌ 直接操作 Firestore
- ❌ 手動管理訂閱
- ❌ Constructor 中執行業務邏輯

---

## 🚀 使用範例

### 與 Copilot 對話
```
@workspace 請根據統一代理規範建立任務管理元件
```

### 預期行為
Copilot 會：
1. 讀取統一代理
2. 使用 context7 驗證 API
3. 使用 sequential-thinking 分析需求
4. 使用 software-planning-tool 制定計畫
5. 生成符合所有規範的程式碼

---

## 📖 深入學習

### 新手路徑
1. 讀取統一代理 (`.github/agents/gighub-unified.agent.md`)
2. 查看快速參考 (`.github/instructions/quick-reference.instructions.md`)
3. 閱讀核心規範 (`⭐.md`)
4. 瀏覽禁止模式 (`.github/copilot/constraints.md`)

### 進階路徑
1. 深入理解三層架構 (`enterprise-angular-architecture.instructions.md`)
2. 掌握 Angular 現代特性 (`angular-modern-features.instructions.md`)
3. 學習 ng-alain 整合 (`ng-alain-delon.instructions.md`)
4. 研究安全規範 (`.github/copilot/security-rules.yml`)

---

## ✅ 檢查清單

每次開發前確認：
- [ ] 已讀取統一代理
- [ ] 已使用 context7 查詢文檔
- [ ] 已使用 sequential-thinking 分析
- [ ] 已使用 software-planning-tool 規劃
- [ ] 遵循三層架構
- [ ] 使用 Repository 模式
- [ ] 無禁止行為

---

## 🆘 需要幫助？

- **文檔問題**: 查閱 `.github/README.md`
- **配置問題**: 參考 `.github/COPILOT_SECRETS_SETUP.md`
- **驗證問題**: 使用 `.github/COPILOT_INSTRUCTIONS_VALIDATION.md`
- **快捷指令**: 查看 `.github/copilot/shortcuts/chat-shortcuts.md`

---

**最後更新**: 2025-12-16  
**版本**: 3.0 (Streamlined)  
**核心**: 統一代理 + 8 專業指引 + ⭐.md 規範
