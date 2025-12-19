# GigHub Copilot 強制規則系統

> **🎯 目標**: 確保 GitHub Copilot 被動 100% 遵守專案規範與開發原則

## 📋 規則檔案結構

本目錄包含 GigHub 專案的核心規則與原則,所有規則以**強制性語言**描述，確保 Copilot 必須遵守。

### 核心規則檔案

1. **`mandatory-workflow.md`** - 強制工作流程規範
   - 必須使用的工具 (Context7, Sequential Thinking, Software Planning Tool)
   - 強制執行的開發流程
   - 檢查清單與驗證機制

2. **`project-rules.md`** - 專案開發規則
   - 從 `docs/principles/rules.md` 提取並強化
   - 任務定義與格式規範
   - 開發檢查清單
   - 禁止行為清單

3. **`architectural-principles.md`** - 架構設計原則
   - 從 `docs/principles/principles.md` 提取並強化
   - 十大設計原則
   - 技術實作考量
   - 安全性與效能規範

4. **`enforcement-policy.md`** - 遵守政策與執行機制
   - 違規處理機制
   - 自動檢查流程
   - 例外處理政策

## 🔴 強制遵守層級

### Level 1: MUST (必須) 🔴
- 使用指定的 MCP 工具 (Context7, Sequential Thinking, Software Planning Tool)
- 遵循三層架構分離原則
- 使用 Repository 模式存取 Firestore
- 實作 Firestore Security Rules
- 遵循生命週期管理標準

### Level 2: MUST NOT (絕對禁止) 🚫
- 禁止直接操作 Firestore
- 禁止使用 NgModule
- 禁止使用 any 類型
- 禁止在 constructor 執行業務邏輯
- 禁止手動管理訂閱

### Level 3: SHOULD (應該) ⚠️
- 使用 OnPush 變更檢測策略
- 使用 TrackBy 優化列表渲染
- 實作單元測試覆蓋率 > 80%
- 撰寫 JSDoc 註解

### Level 4: MAY (可選) ℹ️
- 使用 Virtual Scrolling 處理大量資料
- 實作 E2E 測試

## 🔍 使用方式

### 對開發者
1. 閱讀所有規則檔案，理解專案規範
2. 在開發前檢查 `mandatory-workflow.md` 的強制流程
3. 使用檢查清單驗證實作符合規範

### 對 Copilot
1. **自動載入**: 所有規則檔案會被 Copilot 自動讀取
2. **被動遵守**: Copilot 必須在每個回應前檢查相關規則
3. **主動驗證**: Copilot 應在提供方案前驗證是否符合規範

## 📚 相關文檔

- [主配置檔案](../copilot-instructions.md)
- [約束規則](../copilot/constraints.md)
- [快速參考](../instructions/quick-reference.instructions.md)
- [架構文檔](../../docs/architecture/)

## 🔄 更新機制

規則更新流程：
1. 識別需要新增或修改的規則
2. 使用 Context7 查詢最新最佳實踐
3. 使用 Sequential Thinking 分析影響
4. 更新對應規則檔案
5. 更新主配置檔案引用
6. 驗證 Copilot 正確讀取

---

**最後更新**: 2025-12-17  
**維護者**: GigHub 開發團隊
