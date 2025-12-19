# 專案開發規則

> **來源**: 從 `docs/principles/rules.md` 提取並強化  
> **目的**: 定義 GigHub 專案的開發規範與任務管理流程

## 🎯 任務定義格式 (MANDATORY)

### 必填欄位

#### 1. 任務定義
- **名稱** - 簡短描述任務目標
- **背景/目的** - 說明為什麼需要此功能
- **需求說明** - 詳細描述功能需求
- **In Scope / Out of Scope** - 明確範圍界限
- **功能行為** - 具體的功能行為描述
- **資料/API** - 資料模型、API 端點、Firestore 集合結構
- **影響範圍** - 受影響的模組、元件、服務、路由
- **驗收條件** - 可測試、可驗證的驗收標準

#### 2. 分析階段 (MANDATORY)

**Copilot MUST use these tools:**

##### 步驟 1: Context7 查詢官方文件
- **目的**: 獲取最新最佳實踐
- **MUST**: 查詢 Angular, ng-alain, Firebase, RxJS 相關文檔
- **MUST**: 驗證 API 簽名和版本兼容性

##### 步驟 2: Sequential Thinking 循序思考分析
- **目的**: 將複雜問題拆解成可驗證的步驟
- **MUST**: 問題拆解、方案評估、風險識別

##### 步驟 3: Software Planning Tool 制定開發計畫
- **目的**: 轉化需求為可執行計畫
- **MUST**: 任務分解、複雜度評估、進度追蹤

**分析輸出格式** (MANDATORY):

```markdown
## 技術分析

### 1. 架構影響分析
- [ ] 檢查是否符合 `docs/architecture/FINAL_PROJECT_STRUCTURE.md` 結構
- [ ] 確認 Repository 放置位置（shared/ 或模組專屬）
- [ ] 確認是否需要新增 Store 或使用現有 Store

### 2. 依賴關係分析
- [ ] 識別需要使用的現有服務、Repository、Store
- [ ] 確認模組間依賴關係
- [ ] 檢查是否需要更新 Firestore Security Rules

### 3. 技術方案評估
- [ ] 評估不同實作方案的優缺點
- [ ] 選擇最符合專案規範的方案
- [ ] 確認技術可行性

### 4. 風險識別
- [ ] 列出潛在技術風險
- [ ] 評估風險影響程度
- [ ] 制定風險緩解措施
```

#### 3. 規劃階段 (MANDATORY)

**實施步驟** (5 Phases):

##### Phase 1: 準備階段
- 建立所需資料結構定義
- 規劃 Firestore Security Rules
- 確認相依服務與 Repository

##### Phase 2: 資料層實作
- 實作 Repository (資料存取抽象層)
- 實作 Firestore Security Rules
- 單元測試 Repository

##### Phase 3: 服務層實作
- 實作 Service/Store (業務邏輯協調層)
- 整合 Event Bus
- 單元測試 Service

##### Phase 4: 元件實作
- 實作 UI 元件 (展示與互動層)
- 使用 Standalone Components + Signals
- 元件測試

##### Phase 5: 路由整合
- 註冊路由與守衛
- 整合測試
- E2E 測試

**檔案清單** (MANDATORY):
- 列出所有新增檔案
- 列出所有修改檔案
- 說明變更原因

## 📜 開發規範 (MANDATORY)

### ⭐ 強制規範

1. **Context7** - 即時查詢並引用官方文件
   - 避免憑印象或過時知識做決策
   - 驗證 API 簽名和版本

2. **Sequential Thinking** - 循序思考
   - 一步接一步的邏輯順序
   - 把複雜問題拆解成可驗證流程

3. **Software Planning Tool** - 軟體規劃
   - 轉化需求為可實作計畫
   - 系統性拆解任務、順序、風險

4. **奧卡姆剃刀定律** - 最簡化原則
   - KISS (Keep It Simple, Stupid)
   - YAGNI (You Aren't Gonna Need It)
   - 最小可行方案 (MVP)
   - 單一職責原則 (SRP)
   - 低耦合、高內聚

### 🔗 專案特定規範

#### ⭐ Blueprint 模組事件通訊 (MANDATORY)
- 藍圖內所有模組**必須**透過 Events (事件總線) 交互
- 使用 BlueprintEventBus 集中管理
- 事件命名: `[module].[action]`

#### ⭐ 架構結構規範 (MANDATORY)
- 擴展**必須**基於 `docs/architecture/FINAL_PROJECT_STRUCTURE.md` 結構
- 遵循三層架構: UI → Service → Repository
- **禁止**: UI 直接呼叫 Repository

## ✅ 檢查清單 (MANDATORY)

### 📋 程式碼審查檢查點

#### 架構檢查 (MUST) 🔴
- [ ] 遵循三層架構（UI → Service → Repository）
- [ ] 使用 Signals 進行狀態管理
- [ ] 使用 Standalone Components（無 NgModules）
- [ ] 正確使用 inject() 注入依賴

#### 上下文檢查 (MUST) 🔴
- [ ] Blueprint Context 正確傳遞
- [ ] 使用 computed() 計算衍生狀態
- [ ] 上下文清理正確實作

#### 事件檢查 (MUST) 🔴
- [ ] 所有領域事件透過 EventBus 發送
- [ ] 事件命名遵循規範：[module].[action]
- [ ] 事件訂閱使用 takeUntilDestroyed()

#### 錯誤處理檢查 (MUST) 🔴
- [ ] Service 方法包含 try-catch
- [ ] 拋出類型化錯誤
- [ ] UI 使用 Error Boundary Component
- [ ] 錯誤分級正確設定

#### 生命週期檢查 (MUST) 🔴
- [ ] 禁止在 constructor 執行業務邏輯
- [ ] 使用 takeUntilDestroyed() 管理訂閱
- [ ] 手動資源清理在 ngOnDestroy

#### 文檔檢查 (SHOULD) ⚠️
- [ ] 更新或建立模塊 AGENTS.md
- [ ] 程式碼包含 JSDoc 註解
- [ ] 複雜邏輯有文字說明

#### 測試檢查 (SHOULD) ⚠️
- [ ] 單元測試覆蓋率 > 80%
- [ ] 關鍵業務邏輯有測試
- [ ] E2E 測試涵蓋主要流程

### 💎 程式碼品質 (MUST) 🔴

- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 無使用 any 類型
- [ ] 命名清晰且符合規範

### 🏛️ 架構符合性 (MUST) 🔴

- [ ] 遵循三層架構分離
- [ ] Repository 模式正確實作
- [ ] 事件驅動架構正確使用
- [ ] 上下文傳遞模式正確

### ✨ 功能完整性 (MUST) 🔴

- [ ] 功能需求完整實作
- [ ] 邊界情況處理完整
- [ ] 錯誤處理完整
- [ ] 權限檢查完整

### 📖 文檔完整性 (SHOULD) ⚠️

- [ ] README 或 AGENTS.md 已更新
- [ ] API 文檔完整
- [ ] 架構圖已更新（如有變更）
- [ ] 變更日誌已記錄

## 🚫 禁止行為清單 (MUST NOT) 🔴

Copilot **MUST NOT**:

1. ❌ 建立 NgModule
2. ❌ 使用 NgRx/Redux
3. ❌ 建立不必要的 Facade 層
4. ❌ 手動管理訂閱
5. ❌ 使用 any 類型
6. ❌ 忽略錯誤處理
7. ❌ 直接操作 Firestore
8. ❌ 建立 SQL/RLS（使用 Firestore Security Rules）
9. ❌ 在 constructor 執行業務邏輯
10. ❌ UI 層直接呼叫 Repository

## 🎯 決策樹 (Decision Tree)

### 狀態管理決策
- **需要狀態** → 使用 `signal()`
- **不需要狀態** → 無狀態組件

### 衍生狀態決策
- **需要衍生** → 使用 `computed()`
- **不需要衍生** → 直接使用原始 signal

### 訂閱管理決策
- **需要訂閱** → 使用 `takeUntilDestroyed()`
- **不需要訂閱** → 不訂閱

### 新模塊決策
- **需要新模塊** → 遵循「模塊擴展規範」(四階段)
- **不需要新模塊** → 擴展現有模塊

### 錯誤處理決策
- **可恢復錯誤** → `recoverable=true`
- **不可恢復錯誤** → `recoverable=false`

## 📊 模塊擴展規範 (四階段)

### 階段 1: 註冊階段
- 在 `module-registry.ts` 註冊模塊定義
- 定義模塊元數據

### 階段 2: 實作階段
- Repository → Service → Component 順序
- 整合 Event Bus
- 實作業務邏輯

### 階段 3: 整合階段
- 註冊路由與守衛
- 更新 Firestore Security Rules
- 設定權限檢查

### 階段 4: 測試階段
- 單元測試 (Repository, Service)
- 元件測試 (Component)
- 整合測試 (Cross-module)
- E2E 測試 (User flows)

## 🔒 安全性原則 (Security First)

### MUST 遵守

1. **Firestore Security Rules** (MANDATORY)
   - 所有 collection 必須有 Security Rules
   - 實作多租戶資料隔離
   - 驗證使用者權限

2. **角色權限檢查** (MANDATORY)
   - 在守衛使用 `permissionService.hasRole()`
   - 在元件使用 `permissionService.canEdit()`

3. **輸入驗證** (MANDATORY)
   - **禁止**: 在客戶端信任使用者輸入
   - 使用 Angular Reactive Forms 驗證
   - 在 Security Rules 二次驗證

## ⚡ 效能優化原則

### SHOULD 遵守

1. **懶載入** (Lazy Loading)
   - 使用 Angular Router lazy loading
   - 分割大型模組

2. **變更檢測** (Change Detection)
   - 使用 OnPush 策略
   - 使用 Signals 細粒度更新

3. **資料同步** (Real-time)
   - 使用 Firestore Snapshots
   - 只訂閱必要資料

4. **衍生狀態快取** (Computed Cache)
   - 使用 `computed()` 快取計算結果
   - 避免不必要重複計算

## ♿ 可訪問性原則 (Accessibility)

### SHOULD 遵守

1. **WCAG 2.1 指南**
2. **語義化 HTML**
3. **ARIA 標籤**
4. **鍵盤導航支援**

---

**版本**: v1.0  
**最後更新**: 2025-12-17  
**來源**: docs/principles/rules.md  
**強制執行**: MANDATORY for core rules, SHOULD for best practices
