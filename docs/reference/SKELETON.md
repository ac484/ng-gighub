```
/
/app/
/src/blueprint                                # Blueprint Layer - 跨模組流程與系統規則
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
│  ├─ task/                                   # 任務模組 - 施工任務管理
│  │  ├─ models/                              # 任務聚合根與值物件
│  │  │  ├─ task.entity.ts                    # 任務聚合根
│  │  │  ├─ task-assignment.vo.ts             # 任務指派值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 任務狀態機
│  │  │  └─ task.states.ts
│  │  ├─ services/                            # 任務領域服務
│  │  │  ├─ task.service.ts
│  │  │  └─ task-scheduler.service.ts         # 任務排程服務
│  │  ├─ repositories/
│  │  │  ├─ task.repository.ts
│  │  │  └─ task.repository.impl.ts
│  │  ├─ events/                              # 任務事件
│  │  │  └─ task.events.ts
│  │  ├─ policies/                            # 任務策略
│  │  │  └─ task.policies.ts
│  │  ├─ facade/
│  │  │  └─ task.facade.ts
│  │  ├─ config/
│  │  │  └─ task.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ task.module.ts
│  │  └─ README.md
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
│  │  ├─ models/
│  │  │  ├─ acceptance.entity.ts              # 驗收聚合根
│  │  │  ├─ qc-checklist.vo.ts                # QC 檢查清單值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 驗收狀態機
│  │  │  └─ acceptance.states.ts
│  │  ├─ services/
│  │  │  ├─ acceptance.service.ts
│  │  │  └─ qc.service.ts                     # 品質檢驗服務
│  │  ├─ repositories/
│  │  │  ├─ acceptance.repository.ts
│  │  │  └─ acceptance.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ acceptance.events.ts
│  │  ├─ policies/
│  │  │  └─ acceptance.policies.ts
│  │  ├─ facade/
│  │  │  └─ acceptance.facade.ts
│  │  ├─ config/
│  │  │  └─ acceptance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ acceptance.module.ts
│  │  └─ README.md
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
│  └─ warranty/                               # 保固模組 - 保固期管理
│     ├─ models/
│     │  ├─ warranty.entity.ts                # 保固聚合根
│     │  ├─ warranty-period.vo.ts             # 保固期間值物件
│     │  └─ index.ts
│     ├─ states/                              # 保固狀態機
│     │  └─ warranty.states.ts
│     ├─ services/
│     │  ├─ warranty.service.ts
│     │  └─ warranty-monitor.service.ts       # 保固監控服務
│     ├─ repositories/
│     │  ├─ warranty.repository.ts
│     │  └─ warranty.repository.impl.ts
│     ├─ events/
│     │  └─ warranty.events.ts
│     ├─ policies/
│     │  └─ warranty.policies.ts
│     ├─ facade/
│     │  └─ warranty.facade.ts
│     ├─ config/
│     │  └─ warranty.config.ts
│     ├─ module.metadata.ts
│     ├─ warranty.module.ts
│     └─ README.md
│
├─ asset/                                     # 資產檔案模組 - 檔案生命週期管理
│  ├─ models/
│  │  ├─ asset.entity.ts                      # 資產聚合根
│  │  ├─ file-metadata.vo.ts                  # 檔案元資料值物件
│  │  └─ index.ts
│  ├─ states/                                 # 資產狀態機
│  │  └─ asset.states.ts
│  ├─ services/
│  │  ├─ asset.service.ts                     # 資產核心服務
│  │  ├─ asset-upload.service.ts              # 檔案上傳服務
│  │  └─ asset-validation.service.ts          # 檔案驗證服務
│  ├─ repositories/
│  │  ├─ asset.repository.ts
│  │  └─ asset.repository.impl.ts
│  ├─ events/
│  │  └─ asset.events.ts
│  ├─ policies/
│  │  └─ asset.policies.ts                    # 檔案存取權限規則
│  ├─ facade/
│  │  └─ asset.facade.ts
│  ├─ config/
│  │  └─ asset.config.ts
│  ├─ module.metadata.ts
│  ├─ asset.module.ts
│  └─ README.md
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
