```
/src                                       # 前端程式碼結構
├─ app/
│  ├─ core/                         # 基礎設施 + Domain 層
│  │  ├─ blueprint/                 # Blueprint Layer（事件/流程/模組實作）
│  │  │  ├─ modules/implementations/<module>/   # 模組骨架（與 MODULE_LAYER 一致）
│  │  │  ├─ workflow/ | event-bus/ | policies/ | audit/ | context/ | container/
│  │  │  └─ integration/ | repositories/ | services/
│  │  ├─ data-access/               # Repository + Firebase 存取封裝
│  │  ├─ services/ | facades/       # 跨模組協作服務（不直接觸碰 Firestore）
│  │  └─ auth / guards / interceptors / models
│  │
│  ├─ layout/                       # 全局 layout、navbar、workspace 切換器
│  ├─ routes/                       # UI/Presentation（每個業務模組的頁面）
│  │  ├─ blueprint/                 # Blueprint UI（與 core/blueprint 對應）
│  │  ├─ organization/ | team/ | partner/ | user/
│  │  └─ ai-assistant/              # AI UX（前端入口）
│  ├─ shared/                       # 公用功能模組 - 可重用 UI/工具/型別
│  │  ├─ components/                # 自含型 UI 元件（支援無障礙、樣式隔離）
│  │  ├─ services/                  # 無業務語意的共用服務（e.g. clipboard, download）
│  │  ├─ types/                     # 共用型別 / Value Objects (VO)
│  │  ├─ utils/                     # 純函式工具 (pure utility functions)
│  │  ├─ constants/                 # 共用常數、InjectionToken
│  │  └─ pipes/ | directives/       # 如需：自訂 Pipe 或 Directives
│  └─ main.ts / app.config.ts
│
├─ environments/                    # environment.{dev,prod,staging}.ts
├─ assets/

/src/blueprint                                # Blueprint Layer - 跨模組流程與系統規則（流程/事件/整合邏輯原始碼）
│
├─ modules/                                   # 業務領域模組集合 - 具體業務聚合根
│  │
│  ├─ contract/                               # 合約模組 - 合約生命週期管理
│  │  ├─ models/                              # 聚合根與值物件 - Domain 實體定義
│  │  │  ├─ contract.entity.ts                # 合約聚合根
│  │  │  ├─ contract-item.vo.ts               # 合約工項值物件
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 狀態定義 - 合約狀態機
│  │  │  └─ contract.states.ts                # 合約狀態枚舉與轉換規則
│  │  ├─ services/                            # 領域服務 - 業務邏輯實作
│  │  │  ├─ contract.service.ts               # 合約核心服務
│  │  │  └─ contract-parser.service.ts        # 合約解析服務
│  │  ├─ repositories/                        # 資料存取層 - Repository 模式
│  │  │  ├─ contract.repository.ts            # Repository 介面定義
│  │  │  └─ contract.repository.impl.ts       # Repository 實作
│  │  ├─ events/                              # 領域事件 - 合約相關事件定義
│  │  │  └─ contract.events.ts                # 合約建立/生效/終止等事件
│  │  ├─ policies/                            # 模組策略 - 合約業務規則
│  │  │  └─ contract.policies.ts              # 合約建立/修改權限規則
│  │  ├─ facade/                              # 對外門面 - 模組統一入口
│  │  │  └─ contract.facade.ts                # 合約 Facade
│  │  ├─ config/                              # 模組配置 - 設定檔
│  │  │  └─ contract.config.ts                # 合約模組配置
│  │  ├─ module.metadata.ts                   # 模組元資料 - 版本/依賴資訊
│  │  ├─ contract.module.ts                   # 模組定義檔
│  │  └─ README.md                            # 模組說明文件
│  │
│  ├─ task/                                   # 任務模組 - 施工任務管理（核心映射多視圖：樹狀列表 / 樹狀圖 / 甘特圖 / 時間線 / 日曆）
│  │  ├─ models/                              # 任務聚合根與值物件
│  │  │  ├─ task.entity.ts                    # 任務聚合根
│  │  │  ├─ task-assignment.vo.ts             # 任務指派值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 任務狀態機
│  │  │  └─ task.states.ts
│  │  ├─ services/                            # 任務領域服務
│  │  │  ├─ task.service.ts
│  │  │  └─ task-scheduler.service.ts         # 任務排程服務
│  │  ├─ repositories/                        # 任務資料存取（Repository 定義與實作）
│  │  │  ├─ task.repository.ts                # repository 介面定義（抽象）
│  │  │  └─ task.repository.impl.ts           # repository 實作（DB / Firestore adapter）
│  │  ├─ events/                              # 任務事件（Domain events 用於 EventBus / audit / workflow）
│  │  │  └─ task.events.ts                     # 定義: TaskCreated, TaskAssigned, TaskCompleted 等事件
│  │  ├─ policies/                            # 任務策略（權限與業務規則，供 guards/service 驗證）
│  │  │  └─ task.policies.ts                   # 定義誰可建立/編輯/關閉任務，驗證邊界條件
│  │  ├─ facade/                              # 對外門面（高階操作、複合用例的協調層）
│  │  │  └─ task.facade.ts                     # 提供簡潔 API 給上層（routes / blueprint），組合 service + repository
│  │  ├─ config/                              # 模組設定（常數、feature flags、預設值）
│  │  │  └─ task.config.ts                     # 存放 collection 名稱、限制（e.g. 最長期限）等
│  │  ├─ module.metadata.ts                   # 模組元資料（版本、相依性、註冊資訊）
│  │  ├─ task.module.ts                       # 模組註冊檔（模組層級註冊/掃描用，不為 Angular NgModule）
│  │  └─ README.md                            # 模組說明（導覽、主要型別、使用範例）
│  │
│  ├─ issue/                                  # 問題單模組 - 問題追蹤管理
│  │  ├─ models/
│  │  │  ├─ issue.entity.ts                   # 問題單聚合根
│  │  │  ├─ issue-category.vo.ts              # 問題分類值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 問題單狀態機
│  │  │  └─ issue.states.ts
│  │  ├─ services/
│  │  │  ├─ issue.service.ts
│  │  │  └─ issue-resolver.service.ts         # 問題解決服務
│  │  ├─ repositories/
│  │  │  ├─ issue.repository.ts
│  │  │  └─ issue.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ issue.events.ts
│  │  ├─ policies/
│  │  │  └─ issue.policies.ts
│  │  ├─ facade/
│  │  │  └─ issue.facade.ts
│  │  ├─ config/
│  │  │  └─ issue.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ issue.module.ts
│  │  └─ README.md
│  │
│  ├─ acceptance/                             # 驗收模組 - 品質驗收管理
│  │  ├─ models/                              # 驗收實體與檢驗清單
│  │  │  ├─ acceptance.entity.ts              # 驗收聚合根
│  │  │  ├─ qc-checklist.vo.ts                # QC 檢查清單值物件
│  │  │  └─ index.ts                          # barrel 匯出
│  │  ├─ states/                              # 驗收狀態機
│  │  │  └─ acceptance.states.ts              # 驗收狀態列舉與轉換
│  │  ├─ services/                            # 驗收相關服務
│  │  │  ├─ acceptance.service.ts             # 驗收流程邏輯
│  │  │  └─ qc.service.ts                     # 品質檢驗邏輯
│  │  ├─ repositories/                        # 驗收資料存取
│  │  │  ├─ acceptance.repository.ts          # repository 介面
│  │  │  └─ acceptance.repository.impl.ts     # repository 實作（查詢/索引優化）
│  │  ├─ events/                              # 驗收事件（驗收完成 / 失敗）
│  │  │  └─ acceptance.events.ts
│  │  ├─ policies/                            # 驗收策略（誰可驗收、驗收條件）
│  │  │  └─ acceptance.policies.ts
│  │  ├─ facade/                              # 驗收門面（組合式操作）
│  │  │  └─ acceptance.facade.ts
│  │  ├─ config/                              # 模組設定
│  │  │  └─ acceptance.config.ts
│  │  ├─ module.metadata.ts                   # 模組元資料
│  │  ├─ acceptance.module.ts                 # 模組註冊檔
│  │  └─ README.md                            # 模組說明
│  │
│  ├─ finance/                                # 財務模組 - 請款付款管理
│  │  ├─ models/
│  │  │  ├─ payment.entity.ts                 # 付款聚合根
│  │  │  ├─ invoice.entity.ts                 # 發票聚合根
│  │  │  ├─ amount.vo.ts                      # 金額值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 財務狀態機
│  │  │  ├─ payment.states.ts
│  │  │  └─ invoice.states.ts
│  │  ├─ services/
│  │  │  ├─ finance.service.ts
│  │  │  ├─ payment.service.ts                # 付款服務
│  │  │  └─ invoice.service.ts                # 發票服務
│  │  ├─ repositories/
│  │  │  ├─ finance.repository.ts
│  │  │  └─ finance.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ finance.events.ts
│  │  ├─ policies/
│  │  │  └─ finance.policies.ts
│  │  ├─ facade/
│  │  │  └─ finance.facade.ts
│  │  ├─ config/
│  │  │  └─ finance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ finance.module.ts
│  │  └─ README.md
│  │
│  ├─ warranty/                               # 保固模組 - 保固期管理
│  │  ├─ models/
│  │  │  ├─ warranty.entity.ts                # 保固聚合根
│  │  │  ├─ warranty-period.vo.ts             # 保固期間值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 保固狀態機
│  │  │  └─ warranty.states.ts
│  │  ├─ services/
│  │  │  ├─ warranty.service.ts
│  │  │  └─ warranty-monitor.service.ts       # 保固監控服務
│  │  ├─ repositories/
│  │  │  ├─ warranty.repository.ts
│  │  │  └─ warranty.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ warranty.events.ts
│  │  ├─ policies/
│  │  │  └─ warranty.policies.ts
│  │  ├─ facade/
│  │  │  └─ warranty.facade.ts
│  │  ├─ config/
│  │  │  └─ warranty.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ warranty.module.ts
│  │  └─ README.md
│  │
│  ├─ document/                               # 文件模組 - 工程文件與圖面版本生命週期管理
│  │  ├─ models/
│  │  │  ├─ document.entity.ts                # 文件聚合根
│  │  │  ├─ document-version.vo.ts            # 文件版本值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 文件狀態機
│  │  │  └─ document.states.ts
│  │  ├─ services/
│  │  │  ├─ document.service.ts               # 文件核心服務（簽核/發佈/作廢）
│  │  │  └─ document-render.service.ts        # 圖面/文件渲染與預覽
│  │  ├─ repositories/
│  │  │  ├─ document.repository.ts
│  │  │  └─ document.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ document.events.ts                # 文件建立/修訂/發佈事件
│  │  ├─ policies/
│  │  │  └─ document.policies.ts              # 文件權限與保留規則
│  │  ├─ facade/
│  │  │  └─ document.facade.ts                # 文件高階用例門面
│  │  ├─ config/
│  │  │  └─ document.config.ts                # 存儲/預覽/審核設定
│  │  ├─ module.metadata.ts
│  │  ├─ document.module.ts
│  │  └─ README.md
│  │
│  ├─ quality/                                # 品質模組 - 品質計畫與巡檢管控
│  │  ├─ models/
│  │  │  ├─ quality-plan.entity.ts            # 品質計畫聚合根
│  │  │  ├─ quality-issue.vo.ts               # 品質缺失/缺陷值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 品質狀態機
│  │  │  └─ quality.states.ts                 # 缺失/整改/驗收狀態
│  │  ├─ services/
│  │  │  ├─ quality.service.ts                # 品質計畫與巡檢流程
│  │  │  └─ quality-rectification.service.ts  # 整改追蹤與閉環
│  │  ├─ repositories/
│  │  │  ├─ quality.repository.ts
│  │  │  └─ quality.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ quality.events.ts                 # 巡檢、整改、驗證事件
│  │  ├─ policies/
│  │  │  └─ quality.policies.ts               # 品質控制與權限策略
│  │  ├─ facade/
│  │  │  └─ quality.facade.ts                 # 對外門面（巡檢/整改用例）
│  │  ├─ config/
│  │  │  └─ quality.config.ts                 # 品質標準/閾值設定
│  │  ├─ module.metadata.ts
│  │  ├─ quality.module.ts
│  │  └─ README.md
│  │
│  └─ weather/                                # 氣象模組 - 氣象資料採集與預警
│     ├─ models/
│     │  ├─ weather-data.entity.ts            # 即時氣象資料實體
│     │  ├─ weather-forecast.vo.ts            # 天氣預報值物件
│     │  └─ index.ts
│     ├─ states/                              # 氣象狀態定義
│     │  └─ weather.states.ts                 # 觀測/預警/解除狀態
│     ├─ services/
│     │  ├─ weather.service.ts                # 氣象查詢與預警推送
│     │  └─ weather-ingest.service.ts         # 氣象資料整合與清洗
│     ├─ repositories/
│     │  ├─ weather.repository.ts
│     │  └─ weather.repository.impl.ts
│     ├─ events/
│     │  └─ weather.events.ts                 # 氣象更新/預警事件
│     ├─ policies/
│     │  └─ weather.policies.ts               # 天氣預警與風險策略
│     ├─ facade/
│     │  └─ weather.facade.ts                 # 氣象服務對外門面
│     ├─ config/
│     │  └─ weather.config.ts                 # 供應商/位置/閾值設定
│     ├─ module.metadata.ts
│     ├─ weather.module.ts
│     └─ README.md
│
├─ blueprint-members/                         # 藍圖成員模型 - 成員/角色/權限維護
│  ├─ models/
│  │  ├─ blueprint-member.entity.ts           # 藍圖成員聚合根（user/team/partner）
│  │  ├─ blueprint-role.vo.ts                 # 角色與權限集合
│  │  └─ index.ts
│  ├─ services/
│  │  ├─ blueprint-member.service.ts          # 成員加入/退出/權限同步
│  │  └─ membership-sync.service.ts           # 與組織/團隊/合作夥伴同步
│  ├─ repositories/
│  │  ├─ blueprint-member.repository.ts
│  │  └─ blueprint-member.repository.impl.ts
│  ├─ events/
│  │  └─ blueprint-member.events.ts           # 成員調整/權限變更事件
│  ├─ policies/
│  │  └─ blueprint-member.policies.ts         # 成員資格與狀態規則
│  ├─ config/
│  │  └─ blueprint-member.config.ts           # 權限模板與預設設定
│  └─ README.md
│
├─ blueprint-settings/                        # 藍圖設定 - 全域參數/模板/功能開關
│  ├─ models/
│  │  ├─ blueprint-setting.entity.ts          # 藍圖設定聚合根
│  │  └─ index.ts
│  ├─ services/
│  │  ├─ blueprint-settings.service.ts        # 設定載入/覆寫/驗證
│  │  └─ feature-toggle.service.ts            # 藍圖層級功能開關
│  ├─ repositories/
│  │  ├─ blueprint-settings.repository.ts
│  │  └─ blueprint-settings.repository.impl.ts
│  ├─ policies/
│  │  └─ blueprint-settings.policies.ts       # 設定修改權限與審核規則
│  ├─ config/
│  │  └─ blueprint-settings.config.ts         # 預設設定/驗證規範
│  ├─ module.metadata.ts
│  └─ README.md
│
├─ blueprint-capabilities/                    # 藍圖能力映射 - 模組功能與授權配置
│  ├─ models/
│  │  ├─ blueprint-capability.entity.ts       # 能力/feature 聚合根
│  │  ├─ capability-scope.vo.ts               # 能力範圍與授權值物件
│  │  └─ index.ts
│  ├─ services/
│  │  ├─ blueprint-capabilities.service.ts    # 能力開關/授權載入
│  │  └─ capability-mapper.service.ts         # 模組-能力對應表
│  ├─ config/
│  │  └─ blueprint-capabilities.config.ts     # 能力與角色預設映射
│  └─ README.md
│
├─ blueprint-runtime/                         # 藍圖執行態 - 執行上下文與資源管理
│  ├─ context/
│  │  ├─ runtime-context.ts                   # 執行上下文定義
│  │  └─ context-factory.ts                   # Context 建立/回收
│  ├─ services/
│  │  ├─ runtime.service.ts                   # 執行態生命週期管理
│  │  └─ resource-allocator.service.ts        # 資源配置與隔離
│  ├─ config/
│  │  └─ runtime.config.ts                    # 執行態限制/隔離設定
│  └─ README.md
│
├─ blueprint-errors/                          # 藍圖錯誤 - 錯誤分類與補償策略
│  ├─ models/
│  │  ├─ blueprint-error.entity.ts            # 錯誤/異常聚合根
│  │  └─ index.ts
│  ├─ services/
│  │  ├─ blueprint-error.service.ts           # 錯誤登錄/對應處置
│  │  └─ error-mapping.service.ts             # 來源模組錯誤映射
│  ├─ config/
│  │  └─ blueprint-errors.config.ts           # 錯誤分類/告警/補償設定
│  └─ README.md
│
├─ blueprint-observability/                   # 藍圖可觀測性 - 日誌/指標/追蹤
│  ├─ telemetry/
│  │  ├─ telemetry.service.ts                 # 指標與追蹤上報
│  │  └─ telemetry-config.ts                  # 指標/追蹤設定
│  ├─ logging/
│  │  ├─ blueprint-logger.ts                  # 藍圖範疇日誌器
│  │  └─ log-pipeline.ts                      # 日誌管線/匯流排對接
│  ├─ tracing/
│  │  ├─ tracing-adapter.ts                   # 追蹤適配器
│  │  └─ tracing-context.ts                   # 追蹤上下文封裝
│  ├─ README.md
│
├─ blueprint-saga/                            # 藍圖 Saga - 跨模組補償流程
│  ├─ definitions/
│  │  ├─ saga-definition.ts                   # Saga 定義介面
│  │  └─ saga-mappings.ts                     # 模組事件對應 Saga
│  ├─ orchestrator/
│  │  ├─ saga-orchestrator.service.ts         # Saga 執行/補償協調
│  │  └─ saga-state.store.ts                  # Saga 狀態儲存
│  ├─ config/
│  │  └─ saga.config.ts                       # 超時/重試/補償策略設定
│  ├─ README.md
│
├─ asset/                                     # 資產檔案模組 - 檔案生命週期管理
│  ├─ models/                                 # 資產實體與元資料
│  │  ├─ asset.entity.ts                      # 資產聚合根
│  │  ├─ file-metadata.vo.ts                  # 檔案元資料值物件
│  │  └─ index.ts                              # barrel 匯出
│  ├─ states/                                 # 資產狀態機
│  │  └─ asset.states.ts                       # asset 狀態定義
│  ├─ services/                               # 資產相關服務
│  │  ├─ asset.service.ts                      # 資產核心服務
│  │  ├─ asset-upload.service.ts               # 上傳流程（暫存 / 抽象 cloud facade）
│  │  └─ asset-validation.service.ts           # 上傳驗證（類型/大小/安全）
│  ├─ repositories/                            # 資產資料存取
│  │  ├─ asset.repository.ts                   # repository 介面
│  │  └─ asset.repository.impl.ts              # repository 實作（CloudFacade 調用）
│  ├─ events/                                 # 資產相關事件
│  │  └─ asset.events.ts                       # asset.uploaded / asset.deleted 等
│  ├─ policies/                               # 檔案存取與保留政策
│  │  └─ asset.policies.ts                     # 存取權限 / 保留期規則
│  ├─ facade/                                 # 對外門面（高階檔案操作）
│  │  └─ asset.facade.ts                       # 上傳/下載/刪除等高階操作
│  ├─ config/                                 # 模組設定
│  │  └─ asset.config.ts                       # 存儲設定與限制
│  ├─ module.metadata.ts                       # 模組元資料
│  ├─ asset.module.ts                          # 模組註冊檔
│  └─ README.md                                # 模組說明
│
├─ ai/                                        # AI 服務模組 - AI 能力統一入口
│  ├─ providers/                              # AI 供應商適配器集合
│  │  ├─ vertex/                              # Google Vertex AI 供應商
│  │  │  ├─ adapter.ts                        # Vertex AI 適配器實作
│  │  │  ├─ client.ts                         # Vertex AI 客戶端封裝
│  │  │  └─ README.md                         # Vertex AI 使用說明
│  │  ├─ genai/                               # Google GenAI 供應商
│  │  │  ├─ adapter.ts                        # GenAI 適配器實作
│  │  │  ├─ client.ts                         # GenAI 客戶端封裝
│  │  │  └─ README.md                         # GenAI 使用說明
│  │  └─ README.md                            # 供應商整合說明
│  ├─ facade/
│  │  └─ ai.facade.ts                         # AI Facade - 統一協調入口
│  ├─ prompts/                                # Prompt 管理
│  │  ├─ templates.ts                         # Prompt 模板定義
│  │  └─ renderer.ts                          # 模板渲染器
│  ├─ safety/                                 # AI 安全機制
│  │  ├─ sanitizer.ts                         # 輸入淨化器
│  │  └─ validator.ts                         # 輸出驗證器
│  ├─ types.ts                                # AI 型別定義
│  └─ README.md
│
├─ analytics/                                 # 分析模組 - 數據分析與報表
│  ├─ metrics/                                # 指標計算
│  │  ├─ metrics.service.ts                   # 指標服務
│  │  └─ metric-definitions.ts                # 指標定義
│  ├─ reports/                                # 報表生成
│  │  ├─ report.generator.ts                  # 報表產生器
│  │  └─ report-templates.ts                  # 報表模板
│  ├─ analytics.service.ts                    # 分析核心服務
│  └─ README.md
│
├─ notification/                              # 通知模組 - 多渠道通知發送
│  ├─ channels/                               # 通知渠道
│  │  ├─ email.channel.ts                     # 郵件渠道
│  │  ├─ push.channel.ts                      # 推播渠道
│  │  └─ sms.channel.ts                       # 簡訊渠道
│  ├─ templates/                              # 通知模板
│  │  ├─ default.template.ts                  # 預設模板
│  │  └─ template.renderer.ts                 # 模板渲染器
│  ├─ notification.service.ts                 # 通知核心服務
│  └─ README.md
│
├─ event-bus/                                 # 事件匯流排 - 事件發布訂閱中樞
│  ├─ adapters/                               # 事件匯流排適配器
│  │  ├─ memory.adapter.ts                    # 記憶體適配器
│  │  ├─ redis.adapter.ts                     # Redis 適配器
│  │  └─ index.ts
│  ├─ event-bus.service.ts                    # 事件匯流排核心服務
│  ├─ event.types.ts                          # 事件型別定義
│  ├─ event.metadata.ts                       # 事件元資料
│  └─ README.md
│
├─ workflow/                                  # 工作流程引擎 - 跨模組流程編排
│  ├─ engine/                                 # 流程引擎核心
│  │  ├─ workflow.engine.ts                   # 流程引擎實作
│  │  └─ execution-context.ts                 # 執行上下文
│  ├─ registry/                               # 流程註冊表
│  │  ├─ workflow.registry.ts                 # 流程註冊服務
│  │  └─ workflow-definition.ts               # 流程定義介面
│  ├─ steps/                                  # 流程步驟定義
│  │  ├─ step.interface.ts                    # 步驟介面
│  │  ├─ contract-workflow-steps.ts           # 合約流程步驟
│  │  ├─ task-workflow-steps.ts               # 任務流程步驟
│  │  └─ index.ts
│  ├─ compensation/                           # 補償機制
│  │  └─ saga.handler.ts                      # Saga 補償處理器
│  └─ README.md
│
├─ audit/                                     # 稽核模組 - 系統操作歷史記錄
│  ├─ models/
│  │  └─ audit-log.entity.ts                  # 稽核日誌實體
│  ├─ services/
│  │  ├─ audit-log.service.ts                 # 稽核日誌服務
│  │  └─ audit-query.service.ts               # 稽核查詢服務
│  ├─ repositories/
│  │  ├─ audit-log.repository.ts
│  │  └─ audit-log.repository.impl.ts
│  ├─ policies/
│  │  └─ audit.policies.ts                    # 稽核策略規則
│  └─ README.md
│
├─ policies/                                  # 策略模組 - 跨模組業務規則
│  ├─ access-control/                         # 存取控制策略
│  │  ├─ access-control.policy.ts             # 存取控制規則
│  │  └─ role-permissions.ts                  # 角色權限定義
│  ├─ approval/                               # 審核策略
│  │  ├─ approval.policy.ts                   # 審核規則
│  │  └─ approval-chain.ts                    # 審核鏈定義
│  ├─ state-transition/                       # 狀態轉換策略
│  │  └─ transition.policy.ts                 # 狀態轉換規則
│  └─ README.md
│
└─ README.md                                  # Blueprint Layer 總覽文件
```
