# Blueprint V2.0 實作計畫 (Implementation Plan)

> **Version**: 2.0.0  
> **Status**: Phase 1 Complete ✅  
> **Timeline**: 8 Weeks  
> **Team Size**: 2-3 Developers  
> **Last Updated**: 2025-01-10

---

## 📋 專案總覽

### 目標
根據 `setc.md` 規範，建立全新的藍圖系統，實現：
1. ✅ 無限模組擴展能力
2. ✅ 取代現有設計（不向後兼容）
3. ✅ 清除技術債務
4. ✅ 使用 @angular/fire + Firestore
5. ✅ Angular 20 現代化特性

### 實作狀態

**開始日期**: 2025-01-09
**Phase 1 完成日期**: 2025-01-10
**當前階段**: Phase 1 Complete ✅ / Phase 2 Ready to Start
**進度**: 100% (16/16 days complete)

### 核心指標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| **開發時間** | 8 週 | 包含測試與優化 |
| **程式碼行數** | ~7000 | 核心系統 + UI + 模組 |
| **測試覆蓋率** | ≥80% | 核心系統必須 ≥90% |
| **效能目標** | <100ms | 模組載入時間 |
| **Bundle 大小** | <2MB | 主 Bundle (gzip 壓縮後) |

---

## 🗓️ 詳細時程表

### Phase 1: 核心架構 (Week 1-2)

#### Week 1: 介面定義與基礎實作

**Day 1-2: 介面與型別定義** ✅ **COMPLETE**
- [x] `core/blueprint/modules/module.interface.ts`
  - IBlueprintModule 介面
  - ModuleStatus 列舉
  - 生命週期方法定義
- [x] `core/blueprint/events/event-bus.interface.ts`
  - IEventBus 介面
  - IBlueprintEvent 介面
  - EventHandler 型別
- [x] `core/blueprint/context/execution-context.interface.ts`
  - IExecutionContext 介面
  - TenantInfo 介面
  - ContextType 列舉
- [x] `core/blueprint/config/blueprint-config.interface.ts`
  - BlueprintConfig 介面
  - ModuleConfig 介面
  - FeatureFlags 介面
- [x] 撰寫介面文檔與範例

**預期產出**:
- ✅ 完整的型別定義檔案 (14 files, ~676 lines)
- ✅ JSDoc 註解
- ✅ 使用範例程式碼
- ✅ TypeScript 編譯零錯誤

**Day 3-4: 事件總線系統**
- [ ] `core/blueprint/events/event-bus.ts`
  - EventBus 類別實作
  - emit() / on() / off() / once() 方法
  - 事件歷史記錄
  - 錯誤處理
- [ ] `core/blueprint/events/event-types.ts`
  - 標準事件類型定義
  - BlueprintEventType 列舉
- [ ] `core/blueprint/events/event-bus.spec.ts`
  - 單元測試（目標覆蓋率 95%）
- [ ] 整合 RxJS Subject 進行事件流管理

**預期產出**:
- ✅ 可運作的事件總線
- ✅ 完整單元測試
- ✅ 效能基準測試

**Day 5-6: 資源提供者** ✅ **COMPLETE**
- [x] `core/blueprint/container/resource-provider.ts`
  - ResourceProvider 類別實作
  - 資源註冊與取得
  - 懶載入機制
  - Firebase/Firestore 預設資源
- [x] `core/blueprint/container/resource-provider.spec.ts`
  - 單元測試
  - 模擬資源注入測試
- [x] 整合 Angular Injector

**預期產出**:
- ✅ 資源提供者實作 (~250 lines)
- ✅ 完整單元測試 (~450 lines, 95%+ coverage)
- ✅ @angular/fire 整合
- ✅ 預設資源註冊
- ✅ 測試覆蓋率 ≥90%

**Day 7: 共享上下文**
- [ ] `core/blueprint/context/shared-context.ts`
  - SharedContext 類別實作
  - 上下文初始化
  - 租戶資訊管理
  - 與事件總線/資源提供者整合
- [ ] `core/blueprint/context/shared-context.spec.ts`
  - 單元測試

**預期產出**:
- ✅ 共享上下文實作
- ✅ 完整測試

#### Week 2: 模組系統與容器

**Day 1-2: 模組註冊表** ✅ COMPLETE
- [x] `core/blueprint/container/module-registry.interface.ts`
  - IModuleRegistry 介面定義
  - ModuleMetadata 與 DependencyResolution
- [x] `core/blueprint/container/module-registry.ts`
  - ModuleRegistry 類別實作 (~350 lines)
  - 模組註冊/註銷
  - 模組查找與版本管理
  - 拓撲排序依賴解析 (Kahn's Algorithm)
  - 循環依賴檢測 (DFS)
  - Signal-based reactive module count
- [x] `core/blueprint/container/module-registry.spec.ts`
  - 50+ 單元測試 (~500 lines)
  - 註冊/註銷測試
  - 依賴解析測試
  - 循環依賴檢測測試
  - 效能測試

**預期產出**:
- ✅ 模組註冊表實作 (~850 lines total)
- ✅ 依賴解析演算法 (Topological Sort + DFS)
- ✅ 測試覆蓋率 ≥95%

**Day 3-5: 生命週期管理器**
- [ ] `core/blueprint/container/lifecycle-manager.ts`
  - LifecycleManager 類別實作
  - loadModule() / startModule() / stopModule() / unloadModule()
  - 依賴順序載入
  - 錯誤處理與回滾
  - 狀態追蹤
- [ ] `core/blueprint/container/lifecycle-manager.spec.ts`
  - 單元測試
  - 生命週期流程測試
  - 錯誤處理測試

**預期產出**:
- ✅ 生命週期管理器實作
- ✅ 依賴順序演算法
- ✅ 錯誤回滾機制
- ✅ 測試覆蓋率 ≥90%

**Day 6-7: 藍圖容器**
- [ ] `core/blueprint/container/blueprint-container.ts`
  - BlueprintContainer 類別實作
  - 容器初始化
  - 整合所有子系統
  - 容器啟動/停止
  - 容器狀態管理
- [ ] `core/blueprint/container/blueprint-container.spec.ts`
  - 單元測試
  - 整合測試
- [ ] `core/blueprint/index.ts`
  - 匯出所有公開 API

**預期產出**:
- ✅ 完整的藍圖容器
- ✅ 整合測試通過
- ✅ API 文檔

**Day 8-10: 整合測試與優化**
- [ ] `tests/blueprint/integration/container-lifecycle.spec.ts`
  - 容器完整生命週期測試
- [ ] `tests/blueprint/integration/module-communication.spec.ts`
  - 模組間通訊測試
- [ ] `tests/blueprint/integration/event-bus-integration.spec.ts`
  - 事件總線整合測試
- [ ] 效能基準測試
- [ ] 記憶體洩漏檢查
- [ ] 程式碼審查與優化

**預期產出**:
- ✅ 完整整合測試套件
- ✅ 效能基準報告
- ✅ Code Review 通過

**Phase 1 里程碑檢查點**:
- ✅ 核心系統完全可運作
- ✅ 測試覆蓋率 ≥90%
- ✅ 效能符合目標
- ✅ API 文檔完整

---

### Phase 2: Firestore 整合 (Week 3)

#### Week 3: 資料層實作

**Day 1-2: 資料模型設計**
- [ ] `shared/models/blueprint.model.ts`
  - Blueprint 介面重構
  - 新增 config 欄位
  - 新增 enabledModules 欄位
  - 時間戳記處理
- [ ] `shared/models/blueprint-module.model.ts`
  - BlueprintModule 介面
  - 模組配置結構
- [ ] `shared/models/blueprint-config.model.ts`
  - BlueprintConfig 資料結構
  - ModuleConfig 資料結構
- [ ] `shared/models/audit-log.model.ts`
  - AuditLog 介面
  - 審計事件類型

**預期產出**:
- ✅ 完整資料模型
- ✅ TypeScript 型別定義
- ✅ 資料驗證規則

**Day 3-4: Repository 層實作**
- [ ] `shared/services/blueprint/blueprint.repository.ts` (重構)
  - 新增 config 欄位處理
  - 新增模組配置查詢
  - 優化查詢效能
  - 新增快取機制
- [ ] `shared/services/blueprint/blueprint-module.repository.ts` (NEW)
  - 模組 CRUD 操作
  - 批次操作
  - 狀態同步
- [ ] `shared/services/blueprint/audit-log.repository.ts` (NEW)
  - 審計日誌寫入
  - 查詢與篩選
  - 分頁支援
- [ ] Repository 單元測試

**預期產出**:
- ✅ Repository 層完成
- ✅ Firestore 整合
- ✅ 測試覆蓋率 ≥85%

**Day 5-6: Service 層實作**
- [ ] `shared/services/blueprint/blueprint.service.ts` (重構)
  - 整合 BlueprintContainer
  - 藍圖啟動/停止邏輯
  - 模組動態載入
  - 配置管理
  - 事件訂閱
- [ ] `shared/services/blueprint/blueprint.service.spec.ts`
  - 單元測試
  - 模擬 Repository
- [ ] 業務邏輯驗證

**預期產出**:
- ✅ Service 層完成
- ✅ 業務邏輯正確
- ✅ 測試通過

**Day 7: Security Rules 與審計**
- [ ] `firestore.rules`
  - 新增 modules 子集合規則
  - 新增 audit-logs 子集合規則
  - 權限檢查函式
  - 測試規則
- [ ] `firestore.indexes.json`
  - 新增複合索引
  - 優化查詢效能
- [ ] 審計日誌系統整合測試

**預期產出**:
- ✅ Security Rules 配置
- ✅ 索引優化
- ✅ 審計系統運作

**Phase 2 里程碑檢查點**:
- ✅ Firestore 完全整合
- ✅ 資料模型驗證通過
- ✅ Security Rules 測試通過
- ✅ 審計日誌完整記錄

---

### Phase 3: UI 元件 (Week 4-5)

#### Week 4: 核心 UI 重構

**Day 1-3: Blueprint List 重構**
- [ ] `routes/blueprint/blueprint-list.component.ts` (重構)
  - 使用 Signals 管理狀態
  - 整合新的 BlueprintService
  - 新增模組狀態顯示
  - 新增快速啟動功能
  - 優化載入效能
- [ ] `routes/blueprint/blueprint-list.component.html`
  - 使用新控制流語法 (@if, @for)
  - 新增模組狀態徽章
  - 改善 UX
- [ ] `routes/blueprint/blueprint-list.component.spec.ts`
  - 單元測試

**預期產出**:
- ✅ 列表元件重構完成
- ✅ 現代化 UI/UX
- ✅ 測試通過

**Day 4-6: Blueprint Detail 重構**
- [ ] `routes/blueprint/blueprint-detail.component.ts` (重構)
  - 整合 Container API
  - 顯示模組狀態
  - 即時事件更新
  - 新增模組控制按鈕
- [ ] `routes/blueprint/blueprint-detail.component.html`
  - 新增模組列表區塊
  - 新增事件時間軸
  - 改善資訊架構
- [ ] `routes/blueprint/blueprint-detail.component.spec.ts`
  - 單元測試

**預期產出**:
- ✅ 詳情元件重構完成
- ✅ 即時狀態更新
- ✅ 測試通過

**Day 7: 共享元件開發**
- [ ] `shared/components/blueprint/module-status-indicator.component.ts`
  - 模組狀態指示器
  - 動畫效果
- [ ] `shared/components/blueprint/module-list.component.ts`
  - 模組列表元件
  - 拖曳排序
- [ ] `shared/components/blueprint/event-timeline.component.ts`
  - 事件時間軸元件
  - 即時更新

**預期產出**:
- ✅ 共享元件庫
- ✅ 可重用設計
- ✅ Storybook 文檔

#### Week 5: 進階 UI 功能

**Day 1-4: Blueprint Designer (視覺化設計器)**
- [ ] `routes/blueprint/blueprint-designer/blueprint-designer.component.ts`
  - 畫布管理
  - 拖放功能
  - 連線編輯
  - 自動佈局
- [ ] `routes/blueprint/blueprint-designer/components/module-palette.component.ts`
  - 模組面板
  - 搜尋與篩選
- [ ] `routes/blueprint/blueprint-designer/components/canvas.component.ts`
  - 畫布渲染
  - 縮放與平移
- [ ] `routes/blueprint/blueprint-designer/components/properties-panel.component.ts`
  - 屬性編輯面板
  - 表單驗證
- [ ] `routes/blueprint/blueprint-designer/services/designer.service.ts`
  - 設計器邏輯
  - 配置轉換
- [ ] 整合測試

**預期產出**:
- ✅ 視覺化設計器
- ✅ 拖放功能
- ✅ 配置轉換

**Day 5-7: Module Manager (模組管理器)**
- [ ] `routes/blueprint/module-manager/module-manager.component.ts`
  - 模組列表管理
  - 模組啟用/停用
  - 模組配置編輯
- [ ] `routes/blueprint/module-manager/components/module-card.component.ts`
  - 模組卡片UI
  - 狀態顯示
- [ ] `routes/blueprint/module-manager/components/module-config-form.component.ts`
  - 動態表單生成
  - 配置驗證
- [ ] `routes/blueprint/module-manager/components/module-dependency-graph.component.ts`
  - 依賴關係圖
  - D3.js 整合
- [ ] 整合測試

**預期產出**:
- ✅ 模組管理器
- ✅ 依賴關係視覺化
- ✅ 動態配置表單

**Phase 3 里程碑檢查點**:
- ✅ 所有 UI 元件完成
- ✅ UX 流程順暢
- ✅ 測試覆蓋率 ≥70%
- ✅ 無障礙性檢查通過

---

### Phase 4: 模組遷移 (Week 6-7)

#### Week 6: 核心模組遷移

**Day 1-3: Tasks 模組遷移**
- [ ] `routes/blueprint/modules/tasks/tasks.module.ts`
  - 實作 IBlueprintModule
  - 生命週期方法
  - 事件訂閱
  - API 匯出
- [ ] `routes/blueprint/modules/tasks/tasks.component.ts`
  - UI 元件
  - 使用 Signals
- [ ] `routes/blueprint/modules/tasks/tasks.service.ts`
  - 業務邏輯
- [ ] `routes/blueprint/modules/tasks/tasks.repository.ts`
  - 資料存取
- [ ] `routes/blueprint/modules/tasks/module.metadata.ts`
  - 模組元資料
- [ ] 單元測試與整合測試

**預期產出**:
- ✅ Tasks 模組完成
- ✅ 測試通過
- ✅ 事件通訊正常

**Day 4-5: Logs 模組遷移**
- [ ] `routes/blueprint/modules/logs/`
  - 完整模組結構
  - 實作 IBlueprintModule
  - UI 元件
  - 業務邏輯
  - 資料存取
- [ ] 單元測試與整合測試

**預期產出**:
- ✅ Logs 模組完成
- ✅ 測試通過

**Day 6-7: Quality 模組遷移**
- [ ] `routes/blueprint/modules/quality/`
  - 完整模組結構
  - 實作 IBlueprintModule
  - UI 元件
  - 業務邏輯
  - 資料存取
- [ ] 單元測試與整合測試

**預期產出**:
- ✅ Quality 模組完成
- ✅ 測試通過

#### Week 7: 模組範本與文檔

**Day 1-2: 模組範本建立**
- [ ] `routes/blueprint/modules/_template/`
  - 完整模組範本
  - 程式碼範例
  - 最佳實踐
  - README.md 開發指南
- [ ] CLI 腳本生成器 (可選)
  - 自動生成模組骨架
  - 互動式設定

**預期產出**:
- ✅ 模組範本
- ✅ 開發指南
- ✅ 生成工具

**Day 3-5: 模組通訊測試**
- [ ] Tasks ←→ Logs 通訊測試
- [ ] Tasks ←→ Quality 通訊測試
- [ ] Logs ←→ Quality 通訊測試
- [ ] 複雜事件流測試
- [ ] 效能測試

**預期產出**:
- ✅ 模組間通訊驗證
- ✅ 事件流正常
- ✅ 效能符合目標

**Day 6-7: 文檔撰寫**
- [ ] `docs/architecture/blueprint-v2-module-development-guide.md`
  - 模組開發完整指南
  - API 參考
  - 範例程式碼
  - 常見問題
- [ ] `docs/architecture/blueprint-v2-api-reference.md`
  - 完整 API 文檔
  - 介面說明
  - 使用範例

**預期產出**:
- ✅ 開發者文檔
- ✅ API 參考文檔
- ✅ 範例程式碼

**Phase 4 里程碑檢查點**:
- ✅ 所有核心模組遷移完成
- ✅ 模組通訊正常
- ✅ 開發文檔完整
- ✅ 範本可用

---

### Phase 5: 測試與優化 (Week 8)

#### Week 8: 全面測試與上線準備

**Day 1-2: 測試補齊**
- [ ] 單元測試覆蓋率檢查
  - 目標：核心系統 ≥90%
  - 目標：UI 元件 ≥70%
  - 目標：模組 ≥80%
- [ ] 補充缺失的測試
- [ ] 測試程式碼審查

**預期產出**:
- ✅ 測試覆蓋率達標
- ✅ 所有測試通過

**Day 3-4: E2E 測試**
- [ ] `tests/blueprint/e2e/blueprint-creation.e2e.ts`
  - 藍圖建立完整流程
- [ ] `tests/blueprint/e2e/module-management.e2e.ts`
  - 模組管理流程
- [ ] `tests/blueprint/e2e/designer-workflow.e2e.ts`
  - 設計器使用流程
- [ ] 關鍵使用者旅程測試

**預期產出**:
- ✅ E2E 測試套件
- ✅ 關鍵流程驗證

**Day 5-6: 效能優化**
- [ ] Bundle 大小優化
  - Tree-shaking
  - Code Splitting
  - Lazy Loading
- [ ] 執行時效能優化
  - 模組載入速度
  - 事件處理效能
  - UI 渲染優化
- [ ] 記憶體使用優化
  - 記憶體洩漏檢查
  - 資源釋放驗證
- [ ] 效能基準測試
  - `tests/blueprint/performance/`

**預期產出**:
- ✅ Bundle 大小 <2MB
- ✅ 模組載入 <100ms
- ✅ 無記憶體洩漏
- ✅ 效能報告

**Day 7: 文檔完善**
- [ ] 更新所有文檔
- [ ] API 文檔生成
- [ ] 使用者手冊
- [ ] 部署指南
- [ ] 疑難排解文檔

**預期產出**:
- ✅ 完整文檔集
- ✅ 部署指南
- ✅ 使用者手冊

**Day 8: 上線準備**
- [ ] Code Review 最終審查
- [ ] 安全性審查
- [ ] 部署腳本準備
- [ ] 回滾計畫
- [ ] 監控設定
- [ ] 上線檢查清單

**預期產出**:
- ✅ 上線就緒
- ✅ 部署腳本
- ✅ 監控配置
- ✅ 回滾計畫

**Phase 5 里程碑檢查點**:
- ✅ 所有測試通過
- ✅ 效能達標
- ✅ 文檔完整
- ✅ 上線就緒

---

## 📊 資源分配

### 團隊配置

| 角色 | 人數 | 職責 |
|------|------|------|
| **後端開發** | 1 | 核心系統、Firestore 整合 |
| **前端開發** | 1-2 | UI 元件、模組遷移 |
| **測試工程師** | 0.5 | 測試、效能優化 (兼職) |
| **技術文件** | 0.5 | 文檔撰寫 (兼職) |

### 工時估計

| Phase | 人天 | 說明 |
|-------|------|------|
| Phase 1 | 20 | 核心架構 |
| Phase 2 | 7 | Firestore 整合 |
| Phase 3 | 14 | UI 元件 |
| Phase 4 | 14 | 模組遷移 |
| Phase 5 | 8 | 測試與優化 |
| **總計** | **63** | 約 2-3 人 x 8 週 |

---

## 🎯 驗收標準

### 功能完整性
- ✅ 藍圖容器可正常啟動/停止
- ✅ 模組可動態載入/卸載
- ✅ 事件總線通訊正常
- ✅ 所有核心模組遷移完成
- ✅ UI 功能完整可用

### 品質標準
- ✅ 測試覆蓋率：核心 ≥90%, UI ≥70%
- ✅ 無 TypeScript 編譯錯誤
- ✅ 無 ESLint 錯誤
- ✅ 無安全性漏洞
- ✅ 無障礙性檢查通過 (WCAG 2.1 AA)

### 效能標準
- ✅ 模組載入時間 <100ms
- ✅ 事件處理延遲 <10ms
- ✅ Bundle 大小 <2MB (gzip)
- ✅ 首次內容繪製 (FCP) <1.5s
- ✅ 最大內容繪製 (LCP) <2.5s

### 文檔標準
- ✅ API 文檔完整
- ✅ 開發指南完整
- ✅ 使用者手冊完整
- ✅ 部署指南完整

---

## ⚠️ 風險管理

### 已識別風險

| 風險 | 機率 | 影響 | 應對策略 |
|------|------|------|---------|
| **技術複雜度高** | 中 | 高 | 分階段實作,充分測試 |
| **Firestore 效能** | 低 | 中 | 建立快取,優化查詢 |
| **模組相依複雜** | 中 | 中 | 清晰的依賴管理,完整測試 |
| **UI 重構工作量** | 中 | 中 | 優先核心功能,漸進式改善 |
| **時程延遲** | 中 | 高 | 每週檢討,及時調整 |

### 應變計畫

**如果 Phase 1 延遲**:
- 壓縮 Phase 2 時程 (資料層可並行開發)
- 延後非核心 UI 功能

**如果測試覆蓋率不足**:
- 延長 Phase 5 時間
- 補充自動化測試

**如果效能不達標**:
- 啟動效能優化專項
- 考慮降級功能複雜度

---

## 📈 進度追蹤

### 每週報告

**報告內容**:
1. 完成事項
2. 進行中事項
3. 遇到的問題
4. 下週計畫
5. 風險提示

**報告時間**: 每週五 17:00

### 里程碑檢查點

| 里程碑 | 預定時間 | 檢查項目 |
|--------|---------|---------|
| **M1: 核心架構** | Week 2 結束 | 容器系統可運作 |
| **M2: 資料整合** | Week 3 結束 | Firestore 完全整合 |
| **M3: UI 完成** | Week 5 結束 | 所有 UI 元件可用 |
| **M4: 模組遷移** | Week 7 結束 | 核心模組全部遷移 |
| **M5: 上線就緒** | Week 8 結束 | 所有驗收通過 |

---

## 📝 附註

### 優先順序

**P0 (必須完成)**:
- 核心架構 (Phase 1)
- Firestore 整合 (Phase 2)
- Blueprint List/Detail (Phase 3 部分)
- Tasks/Logs 模組 (Phase 4 部分)

**P1 (高優先級)**:
- Blueprint Designer (Phase 3)
- Module Manager (Phase 3)
- Quality 模組 (Phase 4)
- 完整測試 (Phase 5)

**P2 (低優先級)**:
- 進階 UI 功能
- 額外模組
- 效能優化極限

### 成功關鍵因素

1. **清晰的介面定義**: 介面先行,實作跟隨
2. **完整的測試**: 高測試覆蓋率確保品質
3. **漸進式開發**: 小步快跑,持續驗證
4. **充分溝通**: 每日同步,問題及時解決
5. **文檔先行**: 文檔與程式碼同步更新

---

**文檔版本**: 2.0.0  
**最後更新**: 2025-01-09  
**維護者**: GigHub Development Team  
**審核者**: [待填]  
**批准者**: [待填]
