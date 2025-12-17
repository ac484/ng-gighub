# Blueprint V2.0 系統結構樹

> **Version**: 2.0.0  
> **Last Updated**: 2025-01-09  
> **Purpose**: 完整的藍圖系統目錄結構與檔案說明

---

## 📁 完整目錄結構

\`\`\`
src/app/
│
├── core/                                    # 核心模組
│   ├── blueprint/                          # 🎯 藍圖系統核心 (NEW)
│   │   ├── container/                      # 容器層實作
│   │   │   ├── blueprint-container.ts      # 藍圖容器主類別
│   │   │   ├── blueprint-container.spec.ts # 單元測試
│   │   │   ├── module-registry.ts          # 模組註冊表
│   │   │   ├── module-registry.spec.ts
│   │   │   ├── lifecycle-manager.ts        # 生命週期管理器
│   │   │   ├── lifecycle-manager.spec.ts
│   │   │   ├── resource-provider.ts        # 資源提供者
│   │   │   ├── resource-provider.spec.ts
│   │   │   └── index.ts                    # 匯出
│   │   │
│   │   ├── context/                        # 上下文管理
│   │   │   ├── shared-context.ts           # 共享上下文實作
│   │   │   ├── shared-context.spec.ts
│   │   │   ├── execution-context.interface.ts  # 執行上下文介面
│   │   │   ├── workspace-context.ts        # 工作區上下文
│   │   │   ├── tenant-info.interface.ts    # 租戶資訊介面
│   │   │   └── index.ts
│   │   │
│   │   ├── events/                         # 事件總線系統
│   │   │   ├── event-bus.ts                # 事件總線實作
│   │   │   ├── event-bus.spec.ts
│   │   │   ├── event-bus.interface.ts      # 事件總線介面
│   │   │   ├── blueprint-event.interface.ts # 事件格式介面
│   │   │   ├── event-types.ts              # 標準事件類型
│   │   │   ├── event-handler.type.ts       # 事件處理器型別
│   │   │   └── index.ts
│   │   │
│   │   ├── modules/                        # 模組系統
│   │   │   ├── module.interface.ts         # 模組介面定義
│   │   │   ├── module-metadata.interface.ts # 模組元資料
│   │   │   ├── module-status.enum.ts       # 模組狀態列舉
│   │   │   ├── module-category.enum.ts     # 模組類別列舉
│   │   │   ├── module-loader.ts            # 模組載入器
│   │   │   ├── module-loader.spec.ts
│   │   │   ├── module-route.interface.ts   # 模組路由配置
│   │   │   └── index.ts
│   │   │
│   │   ├── config/                         # 配置管理
│   │   │   ├── blueprint-config.interface.ts # 藍圖配置介面
│   │   │   ├── module-config.interface.ts  # 模組配置介面
│   │   │   ├── feature-flags.interface.ts  # 功能開關介面
│   │   │   ├── theme-config.interface.ts   # 主題配置介面
│   │   │   ├── permission-config.interface.ts # 權限配置介面
│   │   │   ├── config-validator.ts         # 配置驗證器
│   │   │   ├── config-validator.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── security/                       # 安全性模組 (NEW)
│   │   │   ├── permission.service.ts       # 權限檢查服務
│   │   │   ├── permission.service.spec.ts
│   │   │   ├── sandbox.guard.ts            # 模組沙箱守衛
│   │   │   ├── sandbox.guard.spec.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cache/                          # 快取系統 (NEW)
│   │   │   ├── blueprint-cache.service.ts  # 藍圖快取服務
│   │   │   ├── blueprint-cache.service.spec.ts
│   │   │   ├── module-cache.service.ts     # 模組快取服務
│   │   │   └── index.ts
│   │   │
│   │   ├── devtools/                       # 開發工具 (NEW)
│   │   │   ├── blueprint-devtools.ts       # DevTools 實作
│   │   │   ├── devtools.interface.ts       # DevTools 介面
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                        # 藍圖系統總匯出
│   │
│   ├── services/                           # 核心服務
│   │   ├── firebase-auth.service.ts        # Firebase 認證服務 (現有)
│   │   └── logger/                         # 日誌服務 (現有)
│   │
│   └── types/                              # 型別定義 (現有)
│
├── routes/                                  # 路由模組
│   ├── blueprint/                          # 藍圖功能路由
│   │   ├── blueprint-list.component.ts     # 藍圖列表 (重構)
│   │   ├── blueprint-list.component.html
│   │   ├── blueprint-list.component.less
│   │   ├── blueprint-list.component.spec.ts
│   │   │
│   │   ├── blueprint-detail.component.ts   # 藍圖詳情 (重構)
│   │   ├── blueprint-detail.component.html
│   │   ├── blueprint-detail.component.less
│   │   ├── blueprint-detail.component.spec.ts
│   │   │
│   │   ├── blueprint-designer/             # 🎨 視覺化設計器 (NEW)
│   │   │   ├── blueprint-designer.component.ts
│   │   │   ├── blueprint-designer.component.html
│   │   │   ├── blueprint-designer.component.less
│   │   │   ├── blueprint-designer.component.spec.ts
│   │   │   ├── components/
│   │   │   │   ├── module-palette.component.ts  # 模組面板
│   │   │   │   ├── canvas.component.ts          # 設計畫布
│   │   │   │   ├── properties-panel.component.ts # 屬性面板
│   │   │   │   └── connection-editor.component.ts # 連接編輯器
│   │   │   └── services/
│   │   │       ├── designer.service.ts
│   │   │       └── canvas-renderer.service.ts
│   │   │
│   │   ├── module-manager/                 # 📦 模組管理器 (NEW)
│   │   │   ├── module-manager.component.ts
│   │   │   ├── module-manager.component.html
│   │   │   ├── module-manager.component.less
│   │   │   ├── module-manager.component.spec.ts
│   │   │   ├── components/
│   │   │   │   ├── module-card.component.ts     # 模組卡片
│   │   │   │   ├── module-config-form.component.ts # 模組配置表單
│   │   │   │   ├── module-status-badge.component.ts # 狀態徽章
│   │   │   │   └── module-dependency-graph.component.ts # 依賴圖
│   │   │   └── services/
│   │   │       └── module-manager.service.ts
│   │   │
│   │   ├── modules/                        # 🔌 可擴展模組目錄
│   │   │   ├── tasks/                      # 任務模組 (遷移)
│   │   │   │   ├── tasks.module.ts         # 模組實作
│   │   │   │   ├── tasks.module.spec.ts
│   │   │   │   ├── tasks.component.ts      # UI 元件
│   │   │   │   ├── tasks.component.html
│   │   │   │   ├── tasks.component.less
│   │   │   │   ├── tasks.service.ts        # 業務邏輯
│   │   │   │   ├── tasks.repository.ts     # 資料存取
│   │   │   │   ├── tasks-config.interface.ts # 模組配置
│   │   │   │   ├── module.metadata.ts      # 元資料
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── logs/                       # 日誌模組 (遷移)
│   │   │   │   ├── logs.module.ts
│   │   │   │   ├── logs.component.ts
│   │   │   │   ├── logs.service.ts
│   │   │   │   ├── logs.repository.ts
│   │   │   │   ├── module.metadata.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── quality/                    # 品質模組 (遷移)
│   │   │   │   ├── quality.module.ts
│   │   │   │   ├── quality.component.ts
│   │   │   │   ├── quality.service.ts
│   │   │   │   ├── quality.repository.ts
│   │   │   │   ├── module.metadata.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── notifications/              # 通知模組 (NEW)
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.component.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── module.metadata.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── _template/                  # 模組範本 (NEW)
│   │   │       ├── template.module.ts
│   │   │       ├── template.component.ts
│   │   │       ├── template.service.ts
│   │   │       ├── module.metadata.ts
│   │   │       └── README.md               # 開發指南
│   │   │
│   │   ├── members/                        # 成員管理 (現有)
│   │   ├── audit/                          # 審計日誌 (現有)
│   │   ├── routes.ts                       # 路由配置
│   │   └── AGENTS.md                       # AI 代理文檔
│   │
│   └── [其他路由...]
│
├── shared/                                  # 共享模組
│   ├── services/
│   │   └── blueprint/                      # 藍圖服務層
│   │       ├── blueprint.repository.ts     # 藍圖 Repository (重構)
│   │       ├── blueprint.repository.spec.ts
│   │       ├── blueprint.service.ts        # 藍圖 Service (重構)
│   │       ├── blueprint.service.spec.ts
│   │       ├── blueprint-module.repository.ts # 模組 Repository (NEW)
│   │       ├── blueprint-module.repository.spec.ts
│   │       ├── blueprint-member.repository.ts # 成員 Repository (現有)
│   │       ├── audit-log.repository.ts     # 審計日誌 Repository (NEW)
│   │       ├── audit-log.repository.spec.ts
│   │       └── index.ts
│   │
│   ├── models/                             # 資料模型
│   │   ├── blueprint.model.ts              # 藍圖模型 (重構)
│   │   ├── blueprint-module.model.ts       # 模組模型 (NEW)
│   │   ├── blueprint-config.model.ts       # 配置模型 (NEW)
│   │   ├── audit-log.model.ts              # 審計日誌模型 (NEW)
│   │   └── index.ts
│   │
│   └── components/                         # 共享元件
│       └── blueprint/                      # 藍圖相關元件 (NEW)
│           ├── module-status-indicator.component.ts
│           ├── module-list.component.ts
│           ├── event-timeline.component.ts
│           └── index.ts
│
├── docs/                                    # 文檔目錄
│   └── architecture/                       # 架構文檔
│       ├── blueprint-v2-specification.md   # ✅ 完整規範 (本文檔)
│       ├── blueprint-v2-structure-tree.md  # ✅ 結構樹 (當前文檔)
│       ├── blueprint-v2-implementation-plan.md # 實作計畫
│       ├── blueprint-v2-migration-guide.md # 遷移指南
│       └── blueprint-v2-api-reference.md   # API 參考
│
└── tests/                                   # 測試目錄 (NEW)
    └── blueprint/
        ├── integration/                    # 整合測試
        │   ├── container-lifecycle.spec.ts
        │   ├── module-communication.spec.ts
        │   └── event-bus-integration.spec.ts
        │
        ├── e2e/                            # E2E 測試
        │   ├── blueprint-creation.e2e.ts
        │   ├── module-management.e2e.ts
        │   └── designer-workflow.e2e.ts
        │
        └── performance/                    # 效能測試
            ├── module-loading.perf.ts
            ├── event-bus.perf.ts
            └── cache.perf.ts
\`\`\`

---

## 📊 統計資訊

### 新增檔案統計

| 類別 | 檔案數量 | 說明 |
|------|---------|------|
| **核心系統** | ~40 | Container, Events, Context, Modules |
| **UI 元件** | ~25 | Designer, Module Manager, Shared |
| **服務層** | ~15 | Repository, Service, Cache |
| **模組實作** | ~20 | Tasks, Logs, Quality, Template |
| **測試檔案** | ~30 | Unit, Integration, E2E |
| **文檔** | ~10 | Specification, Guide, API |
| **總計** | **~140** | 新增/重構檔案總數 |

### 程式碼行數估計

| 元件 | 預估行數 | 複雜度 |
|------|---------|--------|
| Blueprint Container | 500 | 高 |
| Event Bus | 300 | 中 |
| Lifecycle Manager | 400 | 高 |
| Module Registry | 250 | 中 |
| Resource Provider | 200 | 低 |
| Shared Context | 300 | 中 |
| Blueprint Designer UI | 800 | 高 |
| Module Manager UI | 600 | 中 |
| 各模組實作 | 400 x 4 = 1600 | 中 |
| 測試程式碼 | 2000 | 中 |
| **總計** | **~6950** | - |

---

## 🔗 檔案依賴關係

### 核心層依賴

\`\`\`mermaid
graph TD
    A[blueprint-container.ts] --> B[module-registry.ts]
    A --> C[lifecycle-manager.ts]
    A --> D[event-bus.ts]
    A --> E[shared-context.ts]
    A --> F[resource-provider.ts]
    
    C --> B
    C --> D
    E --> D
    E --> F
    
    B --> G[module.interface.ts]
    D --> H[event-bus.interface.ts]
    E --> I[execution-context.interface.ts]
\`\`\`

### 服務層依賴

\`\`\`mermaid
graph TD
    A[blueprint.service.ts] --> B[blueprint.repository.ts]
    A --> C[blueprint-module.repository.ts]
    A --> D[audit-log.repository.ts]
    
    B --> E[@angular/fire/firestore]
    C --> E
    D --> E
    
    A --> F[blueprint-container.ts]
    A --> G[event-bus.ts]
\`\`\`

### UI 層依賴

\`\`\`mermaid
graph TD
    A[blueprint-list.component.ts] --> B[blueprint.service.ts]
    A --> C[SHARED_IMPORTS]
    
    D[blueprint-designer.component.ts] --> B
    D --> E[designer.service.ts]
    D --> C
    
    F[module-manager.component.ts] --> B
    F --> G[module-manager.service.ts]
    F --> C
\`\`\`

---

## 🎯 關鍵路徑

### 最小可用系統 (MVP)

**Phase 1 核心（必須先完成）**：
1. `module.interface.ts` - 模組介面定義
2. `event-bus.ts` + `event-bus.interface.ts` - 事件系統
3. `execution-context.interface.ts` + `shared-context.ts` - 上下文
4. `resource-provider.ts` - 資源提供
5. `module-registry.ts` - 模組註冊
6. `lifecycle-manager.ts` - 生命週期管理
7. `blueprint-container.ts` - 容器主類別

**Phase 2 資料層（次要）**：
1. `blueprint.model.ts` - 資料模型
2. `blueprint.repository.ts` - Firestore 整合
3. `blueprint-module.repository.ts` - 模組資料
4. `audit-log.repository.ts` - 審計日誌
5. `blueprint.service.ts` - 業務邏輯

**Phase 3 UI 層（可並行）**：
1. `blueprint-list.component.ts` - 列表重構
2. `blueprint-detail.component.ts` - 詳情重構
3. `blueprint-designer.component.ts` - 視覺化設計器
4. `module-manager.component.ts` - 模組管理器

### 開發順序建議

\`\`\`
Week 1-2: Phase 1 核心系統
  ├── Day 1-2: 介面定義 (module, event, context)
  ├── Day 3-4: 事件總線 + 資源提供者
  ├── Day 5-7: 模組註冊 + 生命週期管理
  └── Day 8-10: 藍圖容器 + 整合測試

Week 3: Phase 2 資料層
  ├── Day 1-2: 資料模型設計
  ├── Day 3-4: Repository 實作
  ├── Day 5-6: Service 實作
  └── Day 7: 整合測試

Week 4-5: Phase 3 UI 層
  ├── Day 1-3: 重構列表/詳情元件
  ├── Day 4-7: Blueprint Designer
  └── Day 8-10: Module Manager

Week 6-7: Phase 4 模組遷移
  ├── Tasks 模組遷移
  ├── Logs 模組遷移
  ├── Quality 模組遷移
  └── 模組範本建立

Week 8: Phase 5 測試與優化
  ├── 單元測試補齊
  ├── 整合測試
  ├── E2E 測試
  ├── 效能優化
  └── 文檔完善
\`\`\`

---

## 📝 檔案命名規範

### TypeScript 檔案

| 類型 | 命名格式 | 範例 |
|------|---------|------|
| 類別 | `kebab-case.type.ts` | `blueprint-container.ts` |
| 介面 | `kebab-case.interface.ts` | `module.interface.ts` |
| 列舉 | `kebab-case.enum.ts` | `module-status.enum.ts` |
| 型別 | `kebab-case.type.ts` | `event-handler.type.ts` |
| 服務 | `kebab-case.service.ts` | `blueprint.service.ts` |
| Repository | `kebab-case.repository.ts` | `blueprint.repository.ts` |
| 測試 | `*.spec.ts` | `event-bus.spec.ts` |
| E2E 測試 | `*.e2e.ts` | `blueprint-creation.e2e.ts` |

### 元件檔案

| 類型 | 命名格式 | 範例 |
|------|---------|------|
| 元件類別 | `kebab-case.component.ts` | `blueprint-list.component.ts` |
| 模板 | `kebab-case.component.html` | `blueprint-list.component.html` |
| 樣式 | `kebab-case.component.less` | `blueprint-list.component.less` |
| 測試 | `kebab-case.component.spec.ts` | `blueprint-list.component.spec.ts` |

---

## 🔍 快速查找索引

### 按功能查找

**容器系統**:
- 容器主類別: `core/blueprint/container/blueprint-container.ts`
- 模組註冊: `core/blueprint/container/module-registry.ts`
- 生命週期: `core/blueprint/container/lifecycle-manager.ts`

**事件系統**:
- 事件總線: `core/blueprint/events/event-bus.ts`
- 事件介面: `core/blueprint/events/event-bus.interface.ts`
- 事件類型: `core/blueprint/events/event-types.ts`

**模組系統**:
- 模組介面: `core/blueprint/modules/module.interface.ts`
- 模組元資料: `core/blueprint/modules/module-metadata.interface.ts`
- 模組載入器: `core/blueprint/modules/module-loader.ts`

**資料層**:
- 藍圖 Repository: `shared/services/blueprint/blueprint.repository.ts`
- 藍圖 Service: `shared/services/blueprint/blueprint.service.ts`
- 模組 Repository: `shared/services/blueprint/blueprint-module.repository.ts`

**UI 元件**:
- 藍圖列表: `routes/blueprint/blueprint-list.component.ts`
- 藍圖詳情: `routes/blueprint/blueprint-detail.component.ts`
- 視覺化設計器: `routes/blueprint/blueprint-designer/`
- 模組管理器: `routes/blueprint/module-manager/`

---

**文檔版本**: 2.0.0  
**最後更新**: 2025-01-09  
**維護者**: GigHub Development Team
