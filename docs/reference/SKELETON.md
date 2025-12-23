# 專案目錄結構規範

> 此文件為專案架構的權威參考,所有目錄與結構描述以本檔為準

## 前端程式碼結構 (`/src`)

```
/src
├─ app/
│  ├─ core/                                   # 核心基礎設施層
│  │  ├─ auth/                                # 認證相關(guards, interceptors)
│  │  ├─ guards/                              # 路由守衛
│  │  ├─ interceptors/                        # HTTP 攔截器
│  │  ├─ models/                              # 核心資料模型
│  │  ├─ services/                            # 跨模組協作服務(不直接操作 DB)
│  │  ├─ facades/                             # 跨模組協作門面
│  │  └─ data-access/                         # Repository 與資料庫存取封裝
│  │
│  ├─ layout/                                 # 全局版面配置
│  │  ├─ basic/                               # 基礎版面(含側邊欄)
│  │  │  └─ widgets/                          # 版面小工具(通知、用戶選單等)
│  │  ├─ blank/                               # 空白版面
│  │  └─ passport/                            # 登入/註冊版面
│  │
│  ├─ routes/                                 # 業務頁面層(UI/Presentation)
│  │  ├─ account/                             # 帳戶管理模組(組織、成員、用戶)
│  │  │  ├─ _shared/                          # 帳戶模組共用元件與服務
│  │  │  ├─ admin/                            # 系統管理員頁面
│  │  │  ├─ organization/                     # 組織管理頁面
│  │  │  │  ├─ members/                       # 組織成員管理
│  │  │  │  │  ├─ partner/                    # 合作夥伴管理
│  │  │  │  │  └─ team/                       # 團隊管理
│  │  │  │  └─ ...                            # 其他組織相關頁面
│  │  │  └─ user/                             # 用戶個人資料頁面
│  │  ├─ blueprint/                           # Blueprint 管理介面
│  │  └─ ai-assistant/                        # AI 助理介面
│  │
│  ├─ shared/                                 # 共用功能模組
│  │  ├─ components/                          # 可重用 UI 元件(無業務邏輯)
│  │  ├─ services/                            # 純技術服務(clipboard, download 等)
│  │  ├─ types/                               # 共用型別定義與 Value Objects
│  │  ├─ utils/                               # 純函式工具集
│  │  ├─ constants/                           # 共用常數與 InjectionToken
│  │  ├─ pipes/                               # 自訂 Pipe
│  │  └─ directives/                          # 自訂 Directive
│  │
│  ├─ app.config.ts                           # 應用程式配置
│  └─ main.ts                                 # 應用程式入口
│
├─ environments/                              # 環境配置檔
│  ├─ environment.ts                          # 預設環境
│  ├─ environment.dev.ts                      # 開發環境
│  ├─ environment.staging.ts                  # 測試環境
│  └─ environment.prod.ts                     # 生產環境
│
└─ assets/                                    # 靜態資源(圖片、字型、i18n 等)
```

## Blueprint Layer (`/src/blueprint`)

> 跨模組流程與系統規則層 - 處理業務領域邏輯與模組協作

```
/src/blueprint
│
├─ modules/                                   # 業務領域模組集合(各業務聚合根)
│  │
│  ├─ contract/                               # 合約模組 - 合約生命週期管理
│  │  ├─ models/                              # 領域實體與值物件(Domain Models)
│  │  │  ├─ contract.entity.ts                # 合約聚合根(Contract Aggregate Root)
│  │  │  ├─ contract-item.vo.ts               # 合約工項值物件(Value Object)
│  │  │  └─ index.ts                          # 統一匯出(Barrel Export)
│  │  ├─ states/                              # 狀態機定義(State Machine)
│  │  │  └─ contract.states.ts                # 合約狀態枚舉與轉換規則
│  │  ├─ services/                            # 領域服務(Domain Services)
│  │  │  ├─ contract.service.ts               # 合約核心業務邏輯
│  │  │  └─ contract-parser.service.ts        # 合約解析服務(PDF/文件解析)
│  │  ├─ repositories/                        # 資料存取層(Repository Pattern)
│  │  │  ├─ contract.repository.ts            # Repository 介面定義(抽象層)
│  │  │  └─ contract.repository.impl.ts       # Repository 實作(Supabase Adapter)
│  │  ├─ events/                              # 領域事件定義(Domain Events)
│  │  │  └─ contract.events.ts                # 合約事件(建立/生效/終止/修改等)
│  │  ├─ policies/                            # 業務規則與策略(Business Rules)
│  │  │  └─ contract.policies.ts              # 合約建立/修改/審批權限規則
│  │  ├─ facade/                              # 對外門面(Facade Pattern - 模組統一入口)
│  │  │  └─ contract.facade.ts                # 合約 Facade(協調 Service + Repository)
│  │  ├─ config/                              # 模組配置(Module Configuration)
│  │  │  └─ contract.config.ts                # 合約模組設定檔(常數/預設值)
│  │  ├─ module.metadata.ts                   # 模組元資料(版本/依賴/註冊資訊)
│  │  ├─ contract.module.ts                   # 模組定義檔(Module Registration)
│  │  └─ README.md                            # 模組說明文件(導覽/API/使用範例)
│  │
│  ├─ task/                                   # 任務模組 - 施工任務管理
│  │  ├─ models/                              # 任務領域模型
│  │  │  ├─ task.entity.ts                    # 任務聚合根(包含任務屬性/狀態/指派資訊)
│  │  │  ├─ task-assignment.vo.ts             # 任務指派值物件(指派人/時間/責任)
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 任務狀態管理
│  │  │  └─ task.states.ts                    # 任務狀態機(待辦/進行中/已完成/已取消)
│  │  ├─ services/                            # 任務業務邏輯
│  │  │  ├─ task.service.ts                   # 任務核心服務(CRUD/狀態轉換)
│  │  │  └─ task-scheduler.service.ts         # 任務排程服務(定時任務/提醒)
│  │  ├─ repositories/                        # 任務資料存取
│  │  │  ├─ task.repository.ts                # Repository 介面(查詢/儲存抽象)
│  │  │  └─ task.repository.impl.ts           # Repository 實作(Supabase 整合)
│  │  ├─ events/                              # 任務領域事件
│  │  │  └─ task.events.ts                    # 任務事件(建立/指派/完成/逾期等)
│  │  ├─ policies/                            # 任務業務規則
│  │  │  └─ task.policies.ts                  # 任務權限規則(誰可建立/編輯/關閉)
│  │  ├─ facade/                              # 任務門面
│  │  │  └─ task.facade.ts                    # 任務 Facade(組合式操作/複雜用例)
│  │  ├─ config/                              # 任務模組配置
│  │  │  └─ task.config.ts                    # 任務配置(Collection 名稱/限制/預設值)
│  │  ├─ module.metadata.ts                   # 模組元資料
│  │  ├─ task.module.ts                       # 模組註冊檔
│  │  └─ README.md                            # 模組說明(API/範例/流程圖)
│  │
│  ├─ issue/                                  # 問題單模組 - 問題追蹤管理
│  │  ├─ models/                              # 問題單領域模型
│  │  │  ├─ issue.entity.ts                   # 問題單聚合根(問題描述/狀態/優先級)
│  │  │  ├─ issue-category.vo.ts              # 問題分類值物件(類別/標籤)
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 問題單狀態管理
│  │  │  └─ issue.states.ts                   # 問題單狀態機(開立/處理中/已解決/關閉)
│  │  ├─ services/                            # 問題單業務邏輯
│  │  │  ├─ issue.service.ts                  # 問題單核心服務(CRUD/狀態管理)
│  │  │  └─ issue-resolver.service.ts         # 問題解決服務(解決方案/追蹤)
│  │  ├─ repositories/                        # 問題單資料存取
│  │  │  ├─ issue.repository.ts               # Repository 介面
│  │  │  └─ issue.repository.impl.ts          # Repository 實作
│  │  ├─ events/                              # 問題單領域事件
│  │  │  └─ issue.events.ts                   # 問題單事件(建立/指派/解決/關閉)
│  │  ├─ policies/                            # 問題單業務規則
│  │  │  └─ issue.policies.ts                 # 問題單權限規則(建立/編輯/關閉權限)
│  │  ├─ facade/                              # 問題單門面
│  │  │  └─ issue.facade.ts                   # 問題單 Facade
│  │  ├─ config/                              # 問題單模組配置
│  │  │  └─ issue.config.ts                   # 問題單配置(優先級/SLA 設定)
│  │  ├─ module.metadata.ts                   # 模組元資料
│  │  ├─ issue.module.ts                      # 模組註冊檔
│  │  └─ README.md                            # 模組說明
│  │
│  ├─ acceptance/                             # 驗收模組 - 品質驗收管理
│  │  ├─ models/                              # 驗收領域模型
│  │  │  ├─ acceptance.entity.ts              # 驗收聚合根(驗收項目/標準/結果)
│  │  │  ├─ qc-checklist.vo.ts                # QC 檢查清單值物件(檢驗項目/標準)
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 驗收狀態管理
│  │  │  └─ acceptance.states.ts              # 驗收狀態機(待驗收/驗收中/通過/不通過)
│  │  ├─ services/                            # 驗收業務邏輯
│  │  │  ├─ acceptance.service.ts             # 驗收流程服務(建立/執行/審核)
│  │  │  └─ qc.service.ts                     # 品質檢驗服務(檢驗邏輯/標準驗證)
│  │  ├─ repositories/                        # 驗收資料存取
│  │  │  ├─ acceptance.repository.ts          # Repository 介面
│  │  │  └─ acceptance.repository.impl.ts     # Repository 實作(包含查詢優化)
│  │  ├─ events/                              # 驗收領域事件
│  │  │  └─ acceptance.events.ts              # 驗收事件(建立/通過/不通過/複驗)
│  │  ├─ policies/                            # 驗收業務規則
│  │  │  └─ acceptance.policies.ts            # 驗收策略(誰可驗收/驗收條件/標準)
│  │  ├─ facade/                              # 驗收門面
│  │  │  └─ acceptance.facade.ts              # 驗收 Facade(組合式驗收操作)
│  │  ├─ config/                              # 驗收模組配置
│  │  │  └─ acceptance.config.ts              # 驗收配置(標準/流程設定)
│  │  ├─ module.metadata.ts                   # 模組元資料
│  │  ├─ acceptance.module.ts                 # 模組註冊檔
│  │  └─ README.md                            # 模組說明(驗收流程/檢驗標準)
│  │
│  ├─ finance/                                # 財務模組 - 請款付款管理
│  │  ├─ models/                              # 財務領域模型
│  │  │  ├─ payment.entity.ts                 # 付款聚合根(付款記錄/狀態/憑證)
│  │  │  ├─ invoice.entity.ts                 # 發票聚合根(發票資訊/項目/金額)
│  │  │  ├─ amount.vo.ts                      # 金額值物件(金額/幣別/匯率)
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 財務狀態管理
│  │  │  ├─ payment.states.ts                 # 付款狀態機(待付/已付/退款/取消)
│  │  │  └─ invoice.states.ts                 # 發票狀態機(草稿/已開/已作廢)
│  │  ├─ services/                            # 財務業務邏輯
│  │  │  ├─ finance.service.ts                # 財務核心服務(帳務處理/對帳)
│  │  │  ├─ payment.service.ts                # 付款服務(付款流程/憑證管理)
│  │  │  └─ invoice.service.ts                # 發票服務(開立/作廢/查詢)
│  │  ├─ repositories/                        # 財務資料存取
│  │  │  ├─ finance.repository.ts             # Repository 介面
│  │  │  └─ finance.repository.impl.ts        # Repository 實作
│  │  ├─ events/                              # 財務領域事件
│  │  │  └─ finance.events.ts                 # 財務事件(請款/付款/開票/退款)
│  │  ├─ policies/                            # 財務業務規則
│  │  │  └─ finance.policies.ts               # 財務策略(付款審批/金額限制)
│  │  ├─ facade/                              # 財務門面
│  │  │  └─ finance.facade.ts                 # 財務 Facade(複合財務操作)
│  │  ├─ config/                              # 財務模組配置
│  │  │  └─ finance.config.ts                 # 財務配置(幣別/稅率/帳期)
│  │  ├─ module.metadata.ts                   # 模組元資料
│  │  ├─ finance.module.ts                    # 模組註冊檔
│  │  └─ README.md                            # 模組說明(財務流程/會計科目)
│  │
│  └─ warranty/                               # 保固模組 - 保固期管理
│     ├─ models/                              # 保固領域模型
│     │  ├─ warranty.entity.ts                # 保固聚合根(保固項目/期限/條件)
│     │  ├─ warranty-period.vo.ts             # 保固期間值物件(開始/結束日期)
│     │  └─ index.ts                          # 統一匯出
│     ├─ states/                              # 保固狀態管理
│     │  └─ warranty.states.ts                # 保固狀態機(生效中/即將到期/已過期)
│     ├─ services/                            # 保固業務邏輯
│     │  ├─ warranty.service.ts               # 保固核心服務(建立/查詢/維修記錄)
│     │  └─ warranty-monitor.service.ts       # 保固監控服務(到期提醒/自動通知)
│     ├─ repositories/                        # 保固資料存取
│     │  ├─ warranty.repository.ts            # Repository 介面
│     │  └─ warranty.repository.impl.ts       # Repository 實作
│     ├─ events/                              # 保固領域事件
│     │  └─ warranty.events.ts                # 保固事件(生效/維修/到期/延長)
│     ├─ policies/                            # 保固業務規則
│     │  └─ warranty.policies.ts              # 保固策略(保固條件/延長規則)
│     ├─ facade/                              # 保固門面
│     │  └─ warranty.facade.ts                # 保固 Facade
│     ├─ config/                              # 保固模組配置
│     │  └─ warranty.config.ts                # 保固配置(預設期限/提醒時間)
│     ├─ module.metadata.ts                   # 模組元資料
│     ├─ warranty.module.ts                   # 模組註冊檔
│     └─ README.md                            # 模組說明(保固流程/條款)
│
├─ asset/                                     # 資產檔案模組 - 檔案生命週期管理
│  ├─ models/                                 # 資產領域模型
│  │  ├─ asset.entity.ts                      # 資產聚合根(檔案資訊/版本/關聯)
│  │  ├─ file-metadata.vo.ts                  # 檔案元資料值物件(大小/類型/雜湊)
│  │  └─ index.ts                              # 統一匯出
│  ├─ states/                                 # 資產狀態管理
│  │  └─ asset.states.ts                       # 資產狀態(上傳中/可用/封存/刪除)
│  ├─ services/                               # 資產業務邏輯
│  │  ├─ asset.service.ts                      # 資產核心服務(CRUD/版本管理)
│  │  ├─ asset-upload.service.ts               # 上傳服務(暫存/斷點續傳/進度)
│  │  └─ asset-validation.service.ts           # 檔案驗證服務(類型/大小/病毒掃描)
│  ├─ repositories/                            # 資產資料存取
│  │  ├─ asset.repository.ts                   # Repository 介面
│  │  └─ asset.repository.impl.ts              # Repository 實作(Supabase Storage)
│  ├─ events/                                 # 資產領域事件
│  │  └─ asset.events.ts                       # 資產事件(上傳/下載/刪除/分享)
│  ├─ policies/                               # 資產業務規則
│  │  └─ asset.policies.ts                     # 資產策略(存取權限/保留期/配額)
│  ├─ facade/                                 # 資產門面
│  │  └─ asset.facade.ts                       # 資產 Facade(上傳/下載/分享等)
│  ├─ config/                                 # 資產模組配置
│  │  └─ asset.config.ts                       # 資產配置(儲存空間/檔案限制)
│  ├─ module.metadata.ts                       # 模組元資料
│  ├─ asset.module.ts                          # 模組註冊檔
│  └─ README.md                                # 模組說明(上傳流程/API)
│
├─ ai/                                        # AI 服務模組 - AI 能力統一入口
│  ├─ providers/                              # AI 供應商適配器集合(多供應商支援)
│  │  ├─ vertex/                              # Google Vertex AI 供應商
│  │  │  ├─ adapter.ts                        # Vertex AI 適配器(統一介面實作)
│  │  │  ├─ client.ts                         # Vertex AI HTTP 客戶端封裝
│  │  │  └─ README.md                         # Vertex AI 整合文件
│  │  ├─ genai/                               # Google GenAI (Gemini) 供應商
│  │  │  ├─ adapter.ts                        # GenAI 適配器實作
│  │  │  ├─ client.ts                         # GenAI SDK 客戶端封裝
│  │  │  └─ README.md                         # GenAI 整合文件
│  │  └─ README.md                            # 供應商整合指南
│  ├─ facade/                                 # AI 統一門面
│  │  └─ ai.facade.ts                         # AI Facade(供應商切換/負載均衡)
│  ├─ prompts/                                # Prompt 工程管理
│  │  ├─ templates.ts                         # Prompt 模板庫(情境/角色)
│  │  └─ renderer.ts                          # Prompt 渲染器(變數替換)
│  ├─ safety/                                 # AI 安全機制
│  │  ├─ sanitizer.ts                         # 輸入淨化器(敏感資訊過濾)
│  │  └─ validator.ts                         # 輸出驗證器(內容審查)
│  ├─ types.ts                                # AI 型別定義(請求/回應介面)
│  └─ README.md                               # AI 模組整合指南
│
├─ analytics/                                 # 分析模組 - 數據分析與報表
│  ├─ metrics/                                # 業務指標計算
│  │  ├─ metrics.service.ts                   # 指標計算服務(KPI/統計/趨勢)
│  │  └─ metric-definitions.ts                # 指標定義檔(公式/維度/單位)
│  ├─ reports/                                # 報表生成系統
│  │  ├─ report.generator.ts                  # 報表產生器(排程/匯出)
│  │  └─ report-templates.ts                  # 報表模板(圖表/表格/儀表板)
│  ├─ analytics.service.ts                    # 分析核心服務(資料聚合/分析)
│  └─ README.md                               # 分析模組說明(指標定義/報表類型)
│
├─ notification/                              # 通知模組 - 多渠道通知發送
│  ├─ channels/                               # 通知渠道實作(策略模式)
│  │  ├─ email.channel.ts                     # 郵件渠道(SMTP/SendGrid)
│  │  ├─ push.channel.ts                      # 推播渠道(FCM/APNs)
│  │  └─ sms.channel.ts                       # 簡訊渠道(Twilio/AWS SNS)
│  ├─ templates/                              # 通知模板系統
│  │  ├─ default.template.ts                  # 預設通知模板(標題/內容/按鈕)
│  │  └─ template.renderer.ts                 # 模板渲染器(變數替換/國際化)
│  ├─ notification.service.ts                 # 通知核心服務(排程/批次發送)
│  └─ README.md                               # 通知模組說明(渠道配置/模板)
│
├─ event-bus/                                 # 事件匯流排 - 事件發布訂閱中樞
│  ├─ adapters/                               # 事件匯流排適配器(可抽換實作)
│  │  ├─ memory.adapter.ts                    # 記憶體適配器(開發/測試用)
│  │  ├─ redis.adapter.ts                     # Redis 適配器(生產環境/分散式)
│  │  └─ index.ts                             # 適配器統一匯出
│  ├─ event-bus.service.ts                    # 事件匯流排核心(發布/訂閱/取消)
│  ├─ event.types.ts                          # 事件型別定義(基礎事件介面)
│  ├─ event.metadata.ts                       # 事件元資料(時間戳/來源/追蹤ID)
│  └─ README.md                               # 事件匯流排說明(使用/擴展)
│
├─ workflow/                                  # 工作流程引擎 - 跨模組流程編排
│  ├─ engine/                                 # 流程引擎核心(狀態機驅動)
│  │  ├─ workflow.engine.ts                   # 流程引擎實作(執行/暫停/恢復)
│  │  └─ execution-context.ts                 # 執行上下文(狀態/變數/歷史)
│  ├─ registry/                               # 流程註冊表(動態載入)
│  │  ├─ workflow.registry.ts                 # 流程註冊服務(註冊/查詢/版本)
│  │  └─ workflow-definition.ts               # 流程定義介面(步驟/條件/補償)
│  ├─ steps/                                  # 流程步驟庫(可組合單元)
│  │  ├─ step.interface.ts                    # 步驟介面(執行/驗證/補償)
│  │  ├─ contract-workflow-steps.ts           # 合約流程步驟(審批/簽核/歸檔)
│  │  ├─ task-workflow-steps.ts               # 任務流程步驟(指派/驗收/結案)
│  │  └─ index.ts                             # 步驟統一匯出
│  ├─ compensation/                           # 補償機制(失敗回滾)
│  │  └─ saga.handler.ts                      # Saga 補償處理器(事務一致性)
│  └─ README.md                               # 工作流程說明(流程設計/範例)
│
├─ audit/                                     # 稽核模組 - 系統操作歷史記錄
│  ├─ models/                                 # 稽核領域模型
│  │  └─ audit-log.entity.ts                  # 稽核日誌實體(操作/時間/用戶/變更)
│  ├─ services/                               # 稽核業務邏輯
│  │  ├─ audit-log.service.ts                 # 稽核日誌服務(記錄/查詢/匯出)
│  │  └─ audit-query.service.ts               # 稽核查詢服務(進階篩選/統計)
│  ├─ repositories/                           # 稽核資料存取
│  │  ├─ audit-log.repository.ts              # Repository 介面
│  │  └─ audit-log.repository.impl.ts         # Repository 實作(時間序列優化)
│  ├─ policies/                               # 稽核策略
│  │  └─ audit.policies.ts                    # 稽核規則(保留期/存取權限)
│  └─ README.md                               # 稽核模組說明(記錄規範/查詢)
│
├─ policies/                                  # 策略模組 - 跨模組業務規則
│  ├─ access-control/                         # 存取控制策略(RBAC/ABAC)
│  │  ├─ access-control.policy.ts             # 存取控制規則(資源/操作/條件)
│  │  └─ role-permissions.ts                  # 角色權限對照表(角色/權限矩陣)
│  ├─ approval/                               # 審核策略(多級審批)
│  │  ├─ approval.policy.ts                   # 審核規則(條件/層級/通過標準)
│  │  └─ approval-chain.ts                    # 審核鏈定義(順序/並行/會簽)
│  ├─ state-transition/                       # 狀態轉換策略(工作流程控制)
│  │  └─ transition.policy.ts                 # 狀態轉換規則(前置條件/後置動作)
│  └─ README.md                               # 策略模組說明(規則引擎/擴展)
│
└─ README.md                                  # Blueprint Layer 總覽文件
```

## 目錄設計原則

### 1. 分層架構
- **`/src/app/core`**: 核心基礎設施(認證、守衛、攔截器)
- **`/src/app/routes`**: UI 呈現層(頁面元件)
- **`/src/app/shared`**: 共用功能(無業務邏輯的元件與工具)
- **`/src/blueprint`**: 業務邏輯層(領域模型、服務、事件)

### 2. 模組結構標準
每個業務模組遵循相同結構:
```
<module>/
├─ models/         # 實體與值物件
├─ states/         # 狀態機定義
├─ services/       # 領域服務
├─ repositories/   # 資料存取層
├─ events/         # 領域事件
├─ policies/       # 業務規則
├─ facade/         # 對外門面
├─ config/         # 模組配置
└─ README.md       # 模組文件
```

### 3. 命名規範
- **實體(Entity)**: `*.entity.ts` - 聚合根與領域實體
- **值物件(Value Object)**: `*.vo.ts` - 不可變的值物件
- **服務**: `*.service.ts` - 業務邏輯服務
- **Repository**: `*.repository.ts` (介面) + `*.repository.impl.ts` (實作)
- **狀態**: `*.states.ts` - 狀態機定義
- **事件**: `*.events.ts` - 領域事件
- **策略**: `*.policies.ts` - 業務規則
- **門面**: `*.facade.ts` - 模組對外介面

### 4. 關注點分離
- **Models**: 純資料結構,無業務邏輯
- **Services**: 業務邏輯實作
- **Repositories**: 資料存取抽象
- **Facades**: 協調多個服務的高階操作
- **Policies**: 可重用的業務規則

### 5. 依賴方向
```
UI Layer (routes) 
  ↓
Facade Layer 
  ↓
Service Layer 
  ↓
Repository Layer 
  ↓
Data Access Layer
```

## 注意事項

1. **禁止循環依賴**: 模組間透過事件或 Facade 通訊
2. **單一職責**: 每個檔案專注單一功能
3. **介面隔離**: Repository 使用介面與實作分離
4. **依賴注入**: 所有服務透過 DI 注入
5. **Angular 20+ 語法**: 使用 `@if`、`@for`、`@switch` 等新控制流語法