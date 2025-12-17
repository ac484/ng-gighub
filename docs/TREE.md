# 優化後的 Blueprint 模組架構

## 核心理念
- **領域驅動設計 (DDD)**:按業務領域劃分模組
- **三層架構**:領域 → 模組 → 子模組
- **高內聚低耦合**:每個領域獨立管理其業務邏輯
- **易於擴展**:新增功能只需在對應領域下添加模組

---

## 完整目錄結構

```
app/
├─ core/                                      # 核心基礎設施層
│  ├─ blueprint/                              # Blueprint 核心系統
│  │  ├─ config/                              # 系統配置
│  │  │  ├─ blueprint-config.interface.ts     # Blueprint 配置介面
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ container/                           # 容器管理 (依賴注入、生命週期)
│  │  │  ├─ blueprint-container.interface.ts  # 容器介面
│  │  │  ├─ blueprint-container.ts            # 容器實作
│  │  │  ├─ lifecycle-manager.interface.ts    # 生命週期管理介面
│  │  │  ├─ lifecycle-manager.ts              # 生命週期管理器
│  │  │  ├─ module-registry.interface.ts      # 模組註冊介面
│  │  │  ├─ module-registry.ts                # 模組註冊器
│  │  │  ├─ resource-provider.interface.ts    # 資源提供者介面
│  │  │  ├─ resource-provider.ts              # 資源提供者實作
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ context/                             # 上下文管理 (共享狀態、租戶資訊)
│  │  │  ├─ execution-context.interface.ts    # 執行上下文介面
│  │  │  ├─ shared-context.ts                 # 共享上下文
│  │  │  ├─ tenant-info.interface.ts          # 租戶資訊介面
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ events/                              # 事件系統 (事件匯流排、發布訂閱)
│  │  │  ├─ models/                           # 事件模型
│  │  │  │  ├─ blueprint-event.model.ts       # Blueprint 事件模型
│  │  │  │  ├─ event-log-entry.model.ts       # 事件日誌模型
│  │  │  │  ├─ event-priority.enum.ts         # 事件優先級枚舉
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ types/                            # 事件類型定義
│  │  │  │  ├─ system-event-type.enum.ts      # 系統事件類型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ event-bus.interface.ts            # 事件匯流排介面
│  │  │  ├─ event-bus.ts                      # 事件匯流排實作
│  │  │  ├─ enhanced-event-bus.service.ts     # 增強型事件匯流排服務
│  │  │  ├─ event-types.ts                    # 事件類型常數
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ modules/                             # 模組基礎設施
│  │  │  ├─ base/                             # 模組基礎類別
│  │  │  ├─ module.interface.ts               # 模組介面定義
│  │  │  ├─ module-status.enum.ts             # 模組狀態枚舉
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ models/                              # Blueprint 核心模型
│  │  │  ├─ module-connection.interface.ts    # 模組連接介面
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ repositories/                        # Blueprint 資料存取層
│  │  │  ├─ blueprint.repository.ts           # Blueprint 倉儲
│  │  │  ├─ blueprint-module.repository.ts    # Blueprint 模組倉儲
│  │  │  ├─ blueprint-member.repository.ts    # Blueprint 成員倉儲
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ services/                            # Blueprint 核心服務
│  │  │  ├─ blueprint.service.ts              # Blueprint 主服務
│  │  │  ├─ validation.service.ts             # 驗證服務
│  │  │  ├─ dependency-validator.service.ts   # 依賴驗證服務
│  │  │  ├─ blueprint-validation-schemas.ts   # 驗證規則
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  ├─ workflow/                            # Blueprint 工作流編排
│  │  │  ├─ handlers/                         # 工作流處理器
│  │  │  │  ├─ task-completed.handler.ts      # 任務完成處理器
│  │  │  │  ├─ log-created.handler.ts         # 日誌建立處理器
│  │  │  │  ├─ qc-passed.handler.ts           # 品檢通過處理器
│  │  │  │  ├─ qc-failed.handler.ts           # 品檢失敗處理器
│  │  │  │  ├─ acceptance-finalized.handler.ts # 驗收完成處理器
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ models/                           # 工作流模型
│  │  │  │  ├─ workflow-config.model.ts       # 工作流配置模型
│  │  │  │  ├─ workflow-context.model.ts      # 工作流上下文模型
│  │  │  │  ├─ workflow-handler.model.ts      # 工作流處理器模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ setc-workflow-orchestrator.interface.ts # 工作流編排器介面
│  │  │  ├─ setc-workflow-orchestrator.service.ts   # 工作流編排器服務
│  │  │  └─ index.ts                          # 統一匯出
│  │  │
│  │  └─ index.ts                             # Blueprint 系統統一匯出
│  │
│  ├─ data-access/                            # 資料存取層 (統一資料庫操作)
│  │  ├─ ai/                                  # AI 資料存取
│  │  │  ├─ ai.repository.ts                  # AI 倉儲
│  │  │  ├─ ai.types.ts                       # AI 類型定義
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ repositories/                        # 基礎倉儲
│  │  │  ├─ base/                             # 倉儲基礎類別
│  │  │  │  └─ firestore-base.repository.ts   # Firestore 基礎倉儲
│  │  │  ├─ shared/                           # 共享倉儲
│  │  │  │  ├─ account.repository.ts          # 帳戶倉儲
│  │  │  │  ├─ organization.repository.ts     # 組織倉儲
│  │  │  │  ├─ organization-member.repository.ts # 組織成員倉儲
│  │  │  │  ├─ organization-invitation.repository.ts # 組織邀請倉儲
│  │  │  │  ├─ team.repository.ts             # 團隊倉儲
│  │  │  │  ├─ team-member.repository.ts      # 團隊成員倉儲
│  │  │  │  ├─ friend.repository.ts           # 好友倉儲
│  │  │  │  ├─ notification.repository.ts     # 通知倉儲
│  │  │  │  ├─ notification-preferences.repository.ts # 通知偏好設定倉儲
│  │  │  │  └─ fcm-token.repository.ts        # FCM Token 倉儲
│  │  │  ├─ task-firestore.repository.ts      # 任務 Firestore 倉儲
│  │  │  ├─ log-firestore.repository.ts       # 日誌 Firestore 倉儲
│  │  │  └─ index.ts                          # 統一匯出
│  │  └─ index.ts                             # 資料存取層統一匯出
│  │
│  ├─ domain/                                 # 領域模型層 (業務實體定義)
│  │  ├─ models/                              # 領域模型
│  │  │  ├─ blueprint.model.ts                # Blueprint 模型
│  │  │  ├─ blueprint-module.model.ts         # Blueprint 模組模型
│  │  │  ├─ blueprint-config.model.ts         # Blueprint 配置模型
│  │  │  ├─ friend.model.ts                   # 好友模型
│  │  │  ├─ notification.model.ts             # 通知模型
│  │  │  ├─ notification-preferences.model.ts # 通知偏好模型
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ types/                               # 領域類型定義
│  │  │  ├─ blueprint/                        # Blueprint 類型
│  │  │  │  ├─ blueprint.types.ts             # Blueprint 類型
│  │  │  │  ├─ blueprint-status.enum.ts       # Blueprint 狀態枚舉
│  │  │  │  └─ owner-type.enum.ts             # 擁有者類型枚舉
│  │  │  ├─ module/                           # 模組類型
│  │  │  │  ├─ module.types.ts                # 模組類型
│  │  │  │  └─ module-state.enum.ts           # 模組狀態枚舉
│  │  │  ├─ permission/                       # 權限類型
│  │  │  │  ├─ permission.types.ts            # 權限類型
│  │  │  │  ├─ permission-level.enum.ts       # 權限等級枚舉
│  │  │  │  └─ role.enum.ts                   # 角色枚舉
│  │  │  ├─ task/                             # 任務類型
│  │  │  │  ├─ task.types.ts                  # 任務類型
│  │  │  │  ├─ task-view.types.ts             # 任務視圖類型
│  │  │  │  └─ task-quantity.types.ts         # 任務數量類型
│  │  │  ├─ log/                              # 日誌類型
│  │  │  │  ├─ log.types.ts                   # 日誌類型
│  │  │  │  └─ log-task.types.ts              # 日誌任務類型
│  │  │  ├─ workflow/                         # 工作流類型
│  │  │  │  └─ workflow.types.ts              # 工作流類型
│  │  │  ├─ events/                           # 事件類型
│  │  │  │  ├─ event.types.ts                 # 事件類型
│  │  │  │  └─ event-type.enum.ts             # 事件類型枚舉
│  │  │  ├─ storage/                          # 儲存類型
│  │  │  │  └─ storage.types.ts               # 儲存類型
│  │  │  ├─ quality-control/                  # 品質控制類型
│  │  │  │  └─ quality-control.types.ts       # 品質控制類型
│  │  │  ├─ configuration/                    # 配置類型
│  │  │  │  └─ configuration.types.ts         # 配置類型
│  │  │  ├─ account.types.ts                  # 帳戶類型
│  │  │  └─ index.ts                          # 統一匯出
│  │  └─ index.ts                             # 領域層統一匯出
│  │
│  ├─ infrastructure/                         # 基礎設施層 (外部服務整合)
│  │  ├─ storage/                             # 檔案儲存服務
│  │  │  ├─ storage.repository.ts             # 儲存倉儲介面
│  │  │  ├─ firebase-storage.repository.ts    # Firebase 儲存實作
│  │  │  └─ index.ts                          # 統一匯出
│  │  └─ index.ts                             # 基礎設施層統一匯出
│  │
│  ├─ services/                               # 核心服務層
│  │  ├─ ai/                                  # AI 服務
│  │  │  ├─ ai.service.ts                     # AI 服務
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ logger/                              # 日誌服務
│  │  │  ├─ logger.service.ts                 # 日誌服務
│  │  │  ├─ log-transport.interface.ts        # 日誌傳輸介面
│  │  │  ├─ console-transport.ts              # 控制台傳輸
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ firebase.service.ts                  # Firebase 服務
│  │  ├─ firebase-auth.service.ts             # Firebase 認證服務
│  │  ├─ firebase-analytics.service.ts        # Firebase 分析服務
│  │  ├─ push-messaging.service.ts            # 推送訊息服務
│  │  ├─ friend.service.ts                    # 好友服務
│  │  ├─ error-tracking.service.ts            # 錯誤追蹤服務
│  │  ├─ performance-monitoring.service.ts    # 效能監控服務
│  │  ├─ notification-analytics.service.ts    # 通知分析服務
│  │  └─ index.ts                             # 統一匯出
│  │
│  ├─ state/                                  # 全域狀態管理
│  │  ├─ stores/                              # 狀態儲存
│  │  │  ├─ task.store.ts                     # 任務狀態
│  │  │  ├─ log.store.ts                      # 日誌狀態
│  │  │  ├─ construction-log.store.ts         # 施工日誌狀態
│  │  │  ├─ friend.store.ts                   # 好友狀態
│  │  │  ├─ team.store.ts                     # 團隊狀態
│  │  │  ├─ notification.store.ts             # 通知狀態
│  │  │  └─ index.ts                          # 統一匯出
│  │  └─ index.ts                             # 狀態管理統一匯出
│  │
│  ├─ facades/                                # 外觀模式服務 (簡化複雜操作)
│  │  ├─ ai/                                  # AI 外觀
│  │  │  ├─ ai.store.ts                       # AI 狀態儲存
│  │  │  └─ index.ts                          # 統一匯出
│  │  └─ index.ts                             # 外觀層統一匯出
│  │
│  ├─ errors/                                 # 自訂錯誤類型
│  │  ├─ blueprint-error.ts                   # Blueprint 錯誤
│  │  ├─ module-not-found-error.ts            # 模組未找到錯誤
│  │  ├─ permission-denied-error.ts           # 權限拒絕錯誤
│  │  ├─ validation-error.ts                  # 驗證錯誤
│  │  └─ index.ts                             # 統一匯出
│  │
│  ├─ net/                                    # 網路層 (HTTP 攔截器)
│  │  ├─ default.interceptor.ts               # 預設攔截器
│  │  ├─ refresh-token.ts                     # Token 刷新
│  │  ├─ helper.ts                            # HTTP 輔助工具
│  │  └─ index.ts                             # 統一匯出
│  │
│  ├─ i18n/                                   # 國際化服務
│  │  └─ i18n.service.ts                      # 國際化服務
│  │
│  ├─ utils/                                  # 工具函數
│  │  └─ task-hierarchy.util.ts               # 任務層級工具
│  │
│  ├─ startup/                                # 應用啟動服務
│  │  └─ startup.service.ts                   # 啟動服務
│  │
│  ├─ start-page.guard.ts                     # 起始頁守衛
│  └─ index.ts                                # 核心層統一匯出
│
├─ domains/                                   # 業務領域層 (按業務劃分)
│  │
│  ├─ shared-domain/                          # 共享領域 (跨領域共用功能)
│  │  ├─ cloud-module/                        # 雲端儲存模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ file-management/               # 檔案管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ file-upload.service.ts   # 檔案上傳服務
│  │  │  │  │  │  ├─ file-download.service.ts # 檔案下載服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  ├─ models/                     # 模型
│  │  │  │  │  │  ├─ file-metadata.model.ts   # 檔案元資料模型
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 檔案管理統一匯出
│  │  │  │  └─ storage-management/            # 儲存空間管理子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ quota-management.service.ts # 配額管理服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 儲存管理統一匯出
│  │  │  ├─ models/                           # 雲端模組模型
│  │  │  │  ├─ cloud.model.ts                 # 雲端模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ cloud.repository.ts            # 雲端倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ cloud-storage.service.ts       # 雲端儲存服務
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ cloud.module.ts                   # 雲端模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ communication-module/                # 溝通協作模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ notifications/                 # 通知子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ push-notification.service.ts # 推送通知服務
│  │  │  │  │  │  ├─ system-notification.service.ts # 系統通知服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 通知統一匯出
│  │  │  │  ├─ messaging/                     # 訊息子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ group-message.service.ts # 群組訊息服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 訊息統一匯出
│  │  │  │  └─ reminders/                     # 提醒子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ task-reminder.service.ts # 任務提醒服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 提醒統一匯出
│  │  │  ├─ models/                           # 溝通模組模型
│  │  │  │  ├─ communication.model.ts         # 溝通模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ communication.repository.ts    # 溝通倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ communication.module.ts           # 溝通模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ audit-logs-module/                   # 稽核日誌模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ system-logs/                   # 系統日誌子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  └─ system-log.service.ts    # 系統日誌服務
│  │  │  │  │  └─ index.ts                    # 系統日誌統一匯出
│  │  │  │  ├─ user-activity-logs/            # 使用者活動日誌子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  └─ user-activity.service.ts # 使用者活動服務
│  │  │  │  │  └─ index.ts                    # 活動日誌統一匯出
│  │  │  │  └─ compliance-logs/               # 合規日誌子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  └─ compliance.service.ts   # 合規服務
│  │  │  │      └─ index.ts                   # 合規日誌統一匯出
│  │  │  ├─ models/                           # 稽核模組模型
│  │  │  │  ├─ audit-log.model.ts             # 稽核日誌模型
│  │  │  │  ├─ audit-log.types.ts             # 稽核日誌類型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ audit-log.repository.ts        # 稽核日誌倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ audit-logs.service.ts          # 稽核日誌服務
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ components/                       # UI 元件
│  │  │  │  └─ audit-logs.component.ts        # 稽核日誌元件
│  │  │  ├─ config/                           # 模組配置
│  │  │  │  └─ audit-logs.config.ts           # 稽核日誌配置
│  │  │  ├─ exports/                          # 模組匯出 API
│  │  │  │  └─ audit-logs-api.exports.ts      # API 匯出定義
│  │  │  ├─ audit-logs.module.ts              # 稽核日誌模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  └─ workflow-module/                     # 工作流模組
│  │      ├─ submodules/                      # 子模組
│  │      │  ├─ approval-workflows/           # 審批工作流子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ approval.service.ts     # 審批服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 審批工作流統一匯出
│  │      │  ├─ automation-workflows/         # 自動化工作流子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ automation.service.ts   # 自動化服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 自動化統一匯出
│  │      │  └─ custom-workflows/             # 自訂工作流子模組
│  │      │      ├─ services/                 # 服務層
│  │      │      │  ├─ custom-workflow.service.ts # 自訂工作流服務
│  │      │      │  ├─ template.service.ts    # 範本服務
│  │      │      │  └─ index.ts               # 統一匯出
│  │      │      └─ index.ts                  # 自訂工作流統一匯出
│  │      ├─ models/                          # 工作流模組模型
│  │      │  ├─ workflow.model.ts             # 工作流模型
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ repositories/                    # 倉儲層
│  │      │  ├─ workflow.repository.ts        # 工作流倉儲
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ services/                        # 核心服務
│  │      │  ├─ state-machine.service.ts      # 狀態機服務
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ workflow.module.ts               # 工作流模組定義
│  │      ├─ module.metadata.ts               # 模組元資料
│  │      ├─ index.ts                         # 統一匯出
│  │      └─ README.md                        # 模組說明文件
│  │
│  ├─ project-management-domain/              # 專案管理領域
│  │  ├─ tasks-module/                        # 任務管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ task-planning/                 # 任務規劃子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ task-creation.service.ts # 任務建立服務
│  │  │  │  │  │  ├─ task-scheduling.service.ts # 任務排程服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 任務規劃統一匯出
│  │  │  │  ├─ task-execution/                # 任務執行子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ task-assignment.service.ts # 任務分配服務
│  │  │  │  │  │  ├─ task-progress.service.ts # 任務進度服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 任務執行統一匯出
│  │  │  │  └─ task-visualization/            # 任務視覺化子模組
│  │  │  │      ├─ views/                     # 視圖層
│  │  │  │      │  ├─ task-list-view.component.ts # 列表視圖
│  │  │  │      │  ├─ task-kanban-view.component.ts # 看板視圖
│  │  │  │      │  ├─ task-gantt-view.component.ts # 甘特圖視圖
│  │  │  │      │  ├─ task-timeline-view.component.ts # 時間軸視圖
│  │  │  │      │  ├─ task-tree-view.component.ts # 樹狀視圖
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 視覺化統一匯出
│  │  │  ├─ components/                       # UI 元件
│  │  │  │  ├─ task-context-menu/             # 任務右鍵選單
│  │  │  │  │  ├─ task-context-menu.component.ts # 選單元件
│  │  │  │  │  ├─ task-context-menu.component.html # 選單模板
│  │  │  │  │  ├─ task-context-menu.component.less # 選單樣式
│  │  │  │  │  └─ index.ts                    # 統一匯出
│  │  │  │  └─ index.ts                       # 元件統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ tasks.service.ts               # 任務服務
│  │  │  │  ├─ task-context-menu.service.ts   # 選單服務
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ tasks.repository.ts            # 任務倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ types/                            # 類型定義
│  │  │  │  ├─ task-context-menu.types.ts     # 選單類型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ tasks.component.ts                # 任務主元件
│  │  │  ├─ task-modal.component.ts           # 任務對話框元件
│  │  │  ├─ tasks.routes.ts                   # 任務路由
│  │  │  ├─ tasks.module.ts                   # 任務模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  └─ log-module/                          # 日誌記錄模組
│  │      ├─ submodules/                      # 子模組
│  │      │  ├─ activity-tracking/            # 活動追蹤子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ activity-log.service.ts # 活動日誌服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 活動追蹤統一匯出
│  │      │  ├─ change-tracking/              # 變更追蹤子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ change-history.service.ts # 變更歷史服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 變更追蹤統一匯出
│  │      │  ├─ collaboration/                # 協作子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ comment.service.ts      # 評論服務
│  │      │  │  │  ├─ attachment.service.ts   # 附件服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 協作統一匯出
│  │      │  └─ system-events/                # 系統事件子模組
│  │      │      ├─ services/                 # 服務層
│  │      │      │  ├─ system-event.service.ts # 系統事件服務
│  │      │      │  └─ index.ts               # 統一匯出
│  │      │      └─ index.ts                  # 系統事件統一匯出
│  │      ├─ models/                          # 日誌模組模型
│  │      │  ├─ activity-log.model.ts         # 活動日誌模型
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ repositories/                    # 倉儲層
│  │      │  ├─ log.repository.ts             # 日誌倉儲
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ log.module.ts                    # 日誌模組定義
│  │      ├─ module.metadata.ts               # 模組元資料
│  │      ├─ index.ts                         # 統一匯出
│  │      └─ README.md                        # 模組說明文件
│  │
│  ├─ construction-domain/                    # 營建工程領域
│  │  ├─ contract-module/                     # 合約管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ contract-lifecycle/            # 合約生命週期子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ contract-creation.service.ts # 合約建立服務
│  │  │  │  │  │  ├─ contract-lifecycle.service.ts # 合約生命週期服務
│  │  │  │  │  │  ├─ contract-status.service.ts # 合約狀態服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 生命週期統一匯出
│  │  │  │  ├─ work-items/                    # 工項管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ contract-work-items.service.ts # 工項服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  ├─ repositories/               # 倉儲層
│  │  │  │  │  │  ├─ work-item.repository.ts  # 工項倉儲
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 工項統一匯出
│  │  │  │  └─ document-management/           # 文件管理子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ contract-upload.service.ts # 合約上傳服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 文件管理統一匯出
│  │  │  ├─ models/                           # 合約模組模型
│  │  │  │  ├─ contract.model.ts              # 合約模型
│  │  │  │  ├─ dtos.ts                        # 資料傳輸物件
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ contract.repository.ts         # 合約倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ contract-management.service.ts # 合約管理服務
│  │  │  │  ├─ contract-event.service.ts      # 合約事件服務
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ config/                           # 模組配置
│  │  │  │  ├─ contract.config.ts             # 合約配置
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ exports/                          # 模組匯出 API
│  │  │  │  ├─ contract-api.interface.ts      # API 介面定義
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ contract.module.ts                # 合約模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ acceptance-module/                   # 驗收管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ inspection-process/            # 檢驗流程子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ preliminary.service.ts   # 初驗服務
│  │  │  │  │  │  ├─ review.service.ts        # 複驗服務
│  │  │  │  │  │  ├─ re-inspection.service.ts # 會驗服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 檢驗流程統一匯出
│  │  │  │  ├─ acceptance-request/            # 驗收申請子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ request.service.ts       # 申請服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 驗收申請統一匯出
│  │  │  │  └─ final-acceptance/              # 結案驗收子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ conclusion.service.ts   # 結案服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 結案驗收統一匯出
│  │  │  ├─ models/                           # 驗收模組模型
│  │  │  │  ├─ acceptance.model.ts            # 驗收模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ acceptance.repository.ts       # 驗收倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ acceptance.module.ts              # 驗收模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ material-module/                     # 材料管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ inventory-management/          # 庫存管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ inventory.service.ts     # 庫存服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 庫存管理統一匯出
│  │  │  │  ├─ material-tracking/             # 材料追蹤子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ consumption.service.ts   # 消耗追蹤服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 材料追蹤統一匯出
│  │  │  │  ├─ equipment-management/          # 設備管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ equipment.service.ts     # 設備服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 設備管理統一匯出
│  │  │  │  └─ material-issues/               # 材料問題子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ material-issue.service.ts # 材料問題服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 材料問題統一匯出
│  │  │  ├─ models/                           # 材料模組模型
│  │  │  │  ├─ material.model.ts              # 材料模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ material.repository.ts         # 材料倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ material-management.service.ts # 材料管理服務
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ material.module.ts                # 材料模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ warranty-module/                     # 保固管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ warranty-period/               # 保固期管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ warranty-period.service.ts # 保固期服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 保固期統一匯出
│  │  │  │  ├─ defect-management/             # 瑕疵管理子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ warranty-defect.service.ts # 瑕疵服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  ├─ repositories/               # 倉儲層
│  │  │  │  │  │  ├─ warranty-defect.repository.ts # 瑕疵倉儲
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  ├─ models/                     # 模型
│  │  │  │  │  │  ├─ warranty-defect.model.ts # 瑕疵模型
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 瑕疵管理統一匯出
│  │  │  │  └─ repair-management/             # 修繕管理子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ warranty-repair.service.ts # 修繕服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      ├─ repositories/              # 倉儲層
│  │  │  │      │  ├─ warranty-repair.repository.ts # 修繕倉儲
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      ├─ models/                    # 模型
│  │  │  │      │  ├─ warranty-repair.model.ts # 修繕模型
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 修繕管理統一匯出
│  │  │  ├─ models/                           # 保固模組模型
│  │  │  │  ├─ warranty.model.ts              # 保固模型
│  │  │  │  ├─ warranty-status-machine.ts     # 保固狀態機
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ warranty.repository.ts         # 保固倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ services/                         # 核心服務
│  │  │  │  ├─ warranty-event-handlers.ts     # 保固事件處理器
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ config/                           # 模組配置
│  │  │  │  └─ warranty.config.ts             # 保固配置
│  │  │  ├─ exports/                          # 模組匯出 API
│  │  │  │  └─ warranty.api.ts                # API 定義
│  │  │  ├─ warranty.module.ts                # 保固模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  ├─ climate-module/                      # 氣象資訊模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ weather-forecast/              # 天氣預報子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ cwb-weather.service.ts   # 中央氣象局天氣服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  ├─ models/                     # 模型
│  │  │  │  │  │  ├─ weather-forecast.model.ts # 天氣預報模型
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 天氣預報統一匯出
│  │  │  │  └─ weather-cache/                 # 天氣快取子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ climate-cache.service.ts # 氣象快取服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 天氣快取統一匯出
│  │  │  ├─ models/                           # 氣象模組模型
│  │  │  │  ├─ cwb-api-response.model.ts      # 氣象局 API 回應模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ climate.repository.ts          # 氣象倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ config/                           # 模組配置
│  │  │  │  ├─ climate.config.ts              # 氣象配置
│  │  │  │  ├─ cwb-api.constants.ts           # 氣象局 API 常數
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ examples/                         # 使用範例
│  │  │  │  └─ usage-example.ts               # 使用範例程式碼
│  │  │  ├─ exports/                          # 模組匯出 API
│  │  │  │  └─ climate-api.exports.ts         # API 匯出定義
│  │  │  ├─ climate.module.ts                 # 氣象模組定義
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  └─ safety-module/                       # 安全衛生管理模組
│  │      ├─ submodules/                      # 子模組
│  │      │  ├─ safety-inspection/            # 安全檢查子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ safety-inspection.service.ts # 安全檢查服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  ├─ models/                    # 模型
│  │      │  │  │  ├─ safety-inspection.model.ts # 安全檢查模型
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 安全檢查統一匯出
│  │      │  ├─ incident-management/          # 事故管理子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ incident-report.service.ts # 事故報告服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 事故管理統一匯出
│  │      │  ├─ risk-assessment/              # 風險評估子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ risk-assessment.service.ts # 風險評估服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 風險評估統一匯出
│  │      │  └─ safety-training/              # 安全訓練子模組
│  │      │      ├─ services/                 # 服務層
│  │      │      │  ├─ safety-training.service.ts # 安全訓練服務
│  │      │      │  └─ index.ts               # 統一匯出
│  │      │      └─ index.ts                  # 安全訓練統一匯出
│  │      ├─ repositories/                    # 倉儲層
│  │      │  ├─ safety.repository.ts          # 安全倉儲
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ safety.module.ts                 # 安全模組定義
│  │      ├─ module.metadata.ts               # 模組元資料
│  │      ├─ index.ts                         # 統一匯出
│  │      └─ README.md                        # 模組說明文件
│  │
│  ├─ quality-assurance-domain/               # 品質保證領域
│  │  ├─ qa-module/                           # 品質管理模組
│  │  │  ├─ submodules/                       # 子模組
│  │  │  │  ├─ inspection/                    # 檢驗子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ inspection.service.ts    # 檢驗服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 檢驗統一匯出
│  │  │  │  ├─ defect-tracking/               # 缺陷追蹤子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ defect.service.ts        # 缺陷服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 缺陷追蹤統一匯出
│  │  │  │  ├─ quality-checklist/             # 品質檢查清單子模組
│  │  │  │  │  ├─ services/                   # 服務層
│  │  │  │  │  │  ├─ checklist.service.ts     # 檢查清單服務
│  │  │  │  │  │  └─ index.ts                 # 統一匯出
│  │  │  │  │  └─ index.ts                    # 檢查清單統一匯出
│  │  │  │  └─ quality-reporting/             # 品質報告子模組
│  │  │  │      ├─ services/                  # 服務層
│  │  │  │      │  ├─ report.service.ts       # 報告服務
│  │  │  │      │  └─ index.ts                # 統一匯出
│  │  │  │      └─ index.ts                   # 品質報告統一匯出
│  │  │  ├─ models/                           # 品質模組模型
│  │  │  │  ├─ qa.model.ts                    # 品質模型
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ repositories/                     # 倉儲層
│  │  │  │  ├─ qa.repository.ts               # 品質倉儲
│  │  │  │  └─ index.ts                       # 統一匯出
│  │  │  ├─ qa.module.ts                      # 品質模組定義
│  │  │  ├─ module.metadata.ts                # 模組元資料
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 模組說明文件
│  │  │
│  │  └─ issue-module/                        # 問題追蹤模組
│  │      ├─ submodules/                      # 子模組
│  │      │  ├─ issue-lifecycle/              # 問題生命週期子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ issue-creation.service.ts # 問題建立服務
│  │      │  │  │  ├─ issue-lifecycle.service.ts # 問題生命週期服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 生命週期統一匯出
│  │      │  ├─ issue-resolution/             # 問題解決子模組
│  │      │  │  ├─ services/                  # 服務層
│  │      │  │  │  ├─ issue-resolution.service.ts # 問題解決服務
│  │      │  │  │  └─ index.ts                # 統一匯出
│  │      │  │  └─ index.ts                   # 問題解決統一匯出
│  │      │  └─ issue-verification/           # 問題驗證子模組
│  │      │      ├─ services/                 # 服務層
│  │      │      │  ├─ issue-verification.service.ts # 問題驗證服務
│  │      │      │  └─ index.ts               # 統一匯出
│  │      │      └─ index.ts                  # 問題驗證統一匯出
│  │      ├─ models/                          # 問題模組模型
│  │      │  ├─ issue.model.ts                # 問題模型
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ repositories/                    # 倉儲層
│  │      │  ├─ issue.repository.ts           # 問題倉儲
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ services/                        # 核心服務
│  │      │  ├─ issue-management.service.ts   # 問題管理服務
│  │      │  ├─ issue-event.service.ts        # 問題事件服務
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ config/                          # 模組配置
│  │      │  ├─ issue.config.ts               # 問題配置
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ exports/                         # 模組匯出 API
│  │      │  ├─ issue-api.exports.ts          # API 匯出定義
│  │      │  └─ index.ts                      # 統一匯出
│  │      ├─ issue.module.ts                  # 問題模組定義
│  │      ├─ module.metadata.ts               # 模組元資料
│  │      ├─ index.ts                         # 統一匯出
│  │      └─ README.md                        # 模組說明文件
│  │
│  └─ financial-domain/                       # 財務管理領域
│      ├─ finance-module/                     # 財務管理模組
│      │  ├─ submodules/                      # 子模組
│      │  │  ├─ invoice-management/           # 發票管理子模組
│      │  │  │  ├─ services/                  # 服務層
│      │  │  │  │  ├─ invoice.service.ts      # 發票服務
│      │  │  │  │  ├─ invoice-generation.service.ts # 發票生成服務
│      │  │  │  │  ├─ invoice-approval.service.ts # 發票審批服務
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  ├─ models/                    # 模型
│      │  │  │  │  ├─ invoice.model.ts        # 發票模型
│      │  │  │  │  ├─ invoice-status-machine.ts # 發票狀態機
│      │  │  │  │  ├─ invoice-service.interface.ts # 發票服務介面
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  └─ index.ts                   # 發票管理統一匯出
│      │  │  ├─ payment-management/           # 付款管理子模組
│      │  │  │  ├─ services/                  # 服務層
│      │  │  │  │  ├─ payment.service.ts      # 付款服務
│      │  │  │  │  ├─ payment-generation.service.ts # 付款生成服務
│      │  │  │  │  ├─ payment-approval.service.ts # 付款審批服務
│      │  │  │  │  ├─ payment-status-tracking.service.ts # 付款狀態追蹤服務
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  └─ index.ts                   # 付款管理統一匯出
│      │  │  ├─ budget-management/            # 預算管理子模組
│      │  │  │  ├─ services/                  # 服務層
│      │  │  │  │  ├─ budget.service.ts       # 預算服務
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  └─ index.ts                   # 預算管理統一匯出
│      │  │  ├─ cost-management/              # 成本管理子模組
│      │  │  │  ├─ services/                  # 服務層
│      │  │  │  │  ├─ cost-management.service.ts # 成本管理服務
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  └─ index.ts                   # 成本管理統一匯出
│      │  │  ├─ financial-reporting/          # 財務報表子模組
│      │  │  │  ├─ services/                  # 服務層
│      │  │  │  │  ├─ financial-report.service.ts # 財務報表服務
│      │  │  │  │  └─ index.ts                # 統一匯出
│      │  │  │  └─ index.ts                   # 財務報表統一匯出
│      │  │  └─ accounting-ledger/            # 會計分類帳子模組
│      │  │      ├─ services/                 # 服務層
│      │  │      │  ├─ ledger.service.ts      # 分類帳服務
│      │  │      │  └─ index.ts               # 統一匯出
│      │  │      └─ index.ts                  # 會計分類帳統一匯出
│      │  ├─ models/                          # 財務模組模型
│      │  │  ├─ finance.model.ts              # 財務模型
│      │  │  ├─ financial-summary.model.ts    # 財務摘要模型
│      │  │  └─ index.ts                      # 統一匯出
│      │  ├─ repositories/                    # 倉儲層
│      │  │  ├─ finance.repository.ts         # 財務倉儲
│      │  │  └─ index.ts                      # 統一匯出
│      │  ├─ finance.module.ts                # 財務模組定義
│      │  ├─ module.metadata.ts               # 模組元資料
│      │  ├─ index.ts                         # 統一匯出
│      │  └─ README.md                        # 模組說明文件
│      │
│      └─ index.ts                            # 財務領域統一匯出
│
├─ layout/                                    # 佈局層 (應用介面框架)
│  ├─ basic/                                  # 基礎佈局
│  │  ├─ widgets/                             # 小工具元件
│  │  │  ├─ clear-storage.component.ts        # 清除儲存小工具
│  │  │  ├─ context-switcher.component.ts     # 上下文切換小工具
│  │  │  ├─ fullscreen.component.ts           # 全螢幕小工具
│  │  │  ├─ i18n.component.ts                 # 國際化小工具
│  │  │  ├─ icon.component.ts                 # 圖示小工具
│  │  │  ├─ notify.component.ts               # 通知小工具
│  │  │  ├─ rtl.component.ts                  # RTL 小工具
│  │  │  ├─ search.component.ts               # 搜尋小工具
│  │  │  ├─ task.component.ts                 # 任務小工具
│  │  │  └─ user.component.ts                 # 使用者小工具
│  │  ├─ basic.component.ts                   # 基礎佈局元件
│  │  └─ README.md                            # 佈局說明文件
│  ├─ blank/                                  # 空白佈局
│  │  ├─ blank.component.ts                   # 空白佈局元件
│  │  └─ README.md                            # 佈局說明文件
│  ├─ passport/                               # 認證佈局
│  │  ├─ passport.component.ts                # 認證佈局元件
│  │  └─ passport.component.less              # 認證佈局樣式
│  └─ index.ts                                # 佈局層統一匯出
│
├─ routes/                                    # 路由層 (頁面路由配置)
│  ├─ ai-assistant/                           # AI 助理頁面
│  │  ├─ ai-assistant.component.ts            # AI 助理元件
│  │  ├─ ai-assistant.component.html          # AI 助理模板
│  │  └─ ai-assistant.component.less          # AI 助理樣式
│  │
│  ├─ blueprint/                              # Blueprint 管理頁面
│  │  ├─ components/                          # 元件
│  │  │  ├─ connection-layer.component.ts     # 連線層元件
│  │  │  ├─ validation-alerts.component.ts    # 驗證警告元件
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ construction-log/                    # 施工日誌頁面
│  │  │  ├─ construction-log.component.ts     # 施工日誌元件
│  │  │  ├─ construction-log-modal.component.ts # 施工日誌對話框
│  │  │  ├─ index.ts                          # 統一匯出
│  │  │  └─ README.md                         # 說明文件
│  │  ├─ container/                           # 容器管理頁面
│  │  │  ├─ container-dashboard.component.ts  # 容器儀表板
│  │  │  └─ event-bus-monitor.component.ts    # 事件匯流排監控
│  │  ├─ finance/                             # 財務管理頁面
│  │  │  ├─ finance-dashboard.component.ts    # 財務儀表板
│  │  │  ├─ finance-dashboard.component.html  # 財務儀表板模板
│  │  │  ├─ invoice-list.component.ts         # 發票列表
│  │  │  ├─ approval-dialog.component.ts      # 審批對話框
│  │  │  ├─ routes.ts                         # 財務路由
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ members/                             # 成員管理頁面
│  │  │  ├─ blueprint-members.component.ts    # Blueprint 成員列表
│  │  │  └─ member-modal.component.ts         # 成員對話框
│  │  ├─ modules/                             # 模組視圖頁面
│  │  │  ├─ acceptance-module-view.component.ts # 驗收模組視圖
│  │  │  ├─ cloud-module-view.component.ts    # 雲端模組視圖
│  │  │  ├─ communication-module-view.component.ts # 溝通模組視圖
│  │  │  ├─ contract-module-view.component.ts # 合約模組視圖
│  │  │  ├─ contract-modal.component.ts       # 合約對話框
│  │  │  ├─ finance-module-view.component.ts  # 財務模組視圖
│  │  │  ├─ issues-module-view.component.ts   # 問題模組視圖
│  │  │  ├─ issue-modal.component.ts          # 問題對話框
│  │  │  ├─ log-module-view.component.ts      # 日誌模組視圖
│  │  │  ├─ material-module-view.component.ts # 材料模組視圖
│  │  │  ├─ qa-module-view.component.ts       # 品質模組視圖
│  │  │  ├─ safety-module-view.component.ts   # 安全模組視圖
│  │  │  ├─ shared-module-view.component.ts   # 共享模組視圖
│  │  │  ├─ warranty-module-view.component.ts # 保固模組視圖
│  │  │  └─ workflow-module-view.component.ts # 工作流模組視圖
│  │  ├─ warranty/                            # 保固管理頁面
│  │  │  ├─ warranty-list.component.ts        # 保固列表
│  │  │  ├─ warranty-defect-list.component.ts # 保固瑕疵列表
│  │  │  └─ routes.ts                         # 保固路由
│  │  ├─ blueprint-designer.component.ts      # Blueprint 設計器
│  │  ├─ blueprint-detail.component.ts        # Blueprint 詳情
│  │  ├─ blueprint-list.component.ts          # Blueprint 列表
│  │  ├─ blueprint-modal.component.ts         # Blueprint 對話框
│  │  └─ routes.ts                            # Blueprint 路由
│  │
│  ├─ dashboard/                              # 儀表板頁面
│  │  └─ (dashboard 相關元件)                 # 儀表板元件
│  │
│  ├─ exception/                              # 異常頁面
│  │  ├─ exception.component.ts               # 異常元件
│  │  ├─ trigger.component.ts                 # 觸發元件
│  │  └─ routes.ts                            # 異常路由
│  │
│  ├─ explore/                                # 探索頁面
│  │  ├─ components/                          # 元件
│  │  │  ├─ search-bar.component.ts           # 搜尋列元件
│  │  │  ├─ filter-panel.component.ts         # 篩選面板元件
│  │  │  ├─ result-grid.component.ts          # 結果網格元件
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ models/                              # 模型
│  │  │  ├─ search-result.model.ts            # 搜尋結果模型
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ services/                            # 服務
│  │  │  ├─ explore-search.facade.ts          # 搜尋外觀服務
│  │  │  ├─ search-cache.service.ts           # 搜尋快取服務
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ explore-page.component.ts            # 探索頁面元件
│  │  └─ routes.ts                            # 探索路由
│  │
│  ├─ module-manager/                         # 模組管理器頁面
│  │  ├─ components/                          # 元件
│  │  │  ├─ module-card.component.ts          # 模組卡片元件
│  │  │  ├─ module-config-form.component.ts   # 模組配置表單元件
│  │  │  ├─ module-dependency-graph.component.ts # 模組依賴圖元件
│  │  │  └─ module-status-badge.component.ts  # 模組狀態徽章元件
│  │  ├─ module-manager.component.ts          # 模組管理器元件
│  │  ├─ module-manager.service.ts            # 模組管理器服務
│  │  ├─ module-manager.routes.ts             # 模組管理器路由
│  │  └─ index.ts                             # 統一匯出
│  │
│  ├─ monitoring/                             # 監控頁面
│  │  ├─ monitoring-dashboard.component.ts    # 監控儀表板
│  │  └─ routes.ts                            # 監控路由
│  │
│  ├─ organization/                           # 組織管理頁面
│  │  ├─ members/                             # 成員管理
│  │  │  └─ organization-members.component.ts # 組織成員元件
│  │  ├─ settings/                            # 組織設定
│  │  │  └─ organization-settings.component.ts # 組織設定元件
│  │  ├─ teams/                               # 團隊管理
│  │  │  ├─ organization-teams.component.ts   # 組織團隊元件
│  │  │  └─ team-modal.component.ts           # 團隊對話框元件
│  │  └─ routes.ts                            # 組織路由
│  │
│  ├─ passport/                               # 認證頁面
│  │  ├─ login/                               # 登入頁面
│  │  │  ├─ login.component.ts                # 登入元件
│  │  │  ├─ login.component.html              # 登入模板
│  │  │  └─ login.component.less              # 登入樣式
│  │  ├─ register/                            # 註冊頁面
│  │  │  ├─ register.component.ts             # 註冊元件
│  │  │  ├─ register.component.html           # 註冊模板
│  │  │  └─ register.component.less           # 註冊樣式
│  │  ├─ register-result/                     # 註冊結果頁面
│  │  │  ├─ register-result.component.ts      # 註冊結果元件
│  │  │  └─ register-result.component.html    # 註冊結果模板
│  │  ├─ lock/                                # 鎖定頁面
│  │  │  ├─ lock.component.ts                 # 鎖定元件
│  │  │  ├─ lock.component.html               # 鎖定模板
│  │  │  └─ lock.component.less               # 鎖定樣式
│  │  ├─ callback.component.ts                # 回調元件
│  │  └─ routes.ts                            # 認證路由
│  │
│  ├─ settings/                               # 設定頁面
│  │  └─ notification-settings/               # 通知設定
│  │      └─ notification-settings.component.ts # 通知設定元件
│  │
│  ├─ social/                                 # 社交頁面
│  │  ├─ components/                          # 元件
│  │  │  └─ friend-card.component.ts          # 好友卡片元件
│  │  ├─ pages/                               # 頁面
│  │  │  └─ friends.page.ts                   # 好友頁面
│  │  └─ routes/                              # 路由
│  │      └─ friends.routes.ts                # 好友路由
│  │
│  ├─ team/                                   # 團隊管理頁面
│  │  ├─ members/                             # 成員管理
│  │  │  ├─ team-members.component.ts         # 團隊成員元件
│  │  │  └─ team-member-modal.component.ts    # 團隊成員對話框
│  │  └─ routes.ts                            # 團隊路由
│  │
│  ├─ user/                                   # 使用者頁面
│  │  ├─ settings/                            # 使用者設定
│  │  │  └─ settings.component.ts             # 設定元件
│  │  └─ routes.ts                            # 使用者路由
│  │
│  └─ routes.ts                               # 全域路由配置
│
├─ shared/                                    # 共享模組層 (可重用元件和服務)
│  ├─ cdk/                                    # CDK 模組
│  │  ├─ shared-cdk.module.ts                 # CDK 共享模組
│  │  ├─ index.ts                             # 統一匯出
│  │  └─ README.md                            # CDK 說明文件
│  ├─ cell-widget/                            # 單元格小工具
│  │  └─ index.ts                             # 統一匯出
│  ├─ components/                             # 共享元件
│  │  ├─ breadcrumb/                          # 麵包屑元件
│  │  │  └─ breadcrumb.component.ts           # 麵包屑元件
│  │  ├─ create-organization/                 # 建立組織元件
│  │  │  └─ create-organization.component.ts  # 建立組織元件
│  │  ├─ create-team-modal/                   # 建立團隊對話框元件
│  │  │  └─ create-team-modal.component.ts    # 建立團隊對話框元件
│  │  ├─ edit-team-modal/                     # 編輯團隊對話框元件
│  │  │  └─ edit-team-modal.component.ts      # 編輯團隊對話框元件
│  │  └─ team-detail-drawer/                  # 團隊詳情抽屜元件
│  │      ├─ team-detail-drawer.component.ts  # 團隊詳情抽屜元件
│  │      └─ team-detail-drawer.component.html # 團隊詳情抽屜模板
│  ├─ json-schema/                            # JSON Schema 表單
│  │  ├─ test/                                # 測試
│  │  │  └─ test.widget.ts                    # 測試小工具
│  │  ├─ index.ts                             # 統一匯出
│  │  └─ README.md                            # JSON Schema 說明文件
│  ├─ services/                               # 共享服務
│  │  ├─ permission/                          # 權限服務
│  │  │  └─ permission.service.ts             # 權限服務
│  │  ├─ breadcrumb.service.ts                # 麵包屑服務
│  │  ├─ menu-management.service.ts           # 選單管理服務
│  │  ├─ workspace-context.service.ts         # 工作區上下文服務
│  │  └─ index.ts                             # 統一匯出
│  ├─ st-widget/                              # 表格小工具
│  │  ├─ index.ts                             # 統一匯出
│  │  └─ README.md                            # 表格小工具說明文件
│  ├─ utils/                                  # 共享工具函數
│  │  ├─ async-state.ts                       # 非同步狀態工具
│  │  └─ index.ts                             # 統一匯出
│  ├─ shared-delon.module.ts                  # Delon 共享模組
│  ├─ shared-zorro.module.ts                  # Zorro 共享模組
│  ├─ shared-imports.ts                       # 共享匯入
│  ├─ index.ts                                # 共享層統一匯出
│  └─ README.md                               # 共享層說明文件
│
├─ app.component.ts                           # 根元件
├─ app.config.ts                              # 應用配置
└─ README.md                                  # 應用說明文件

---

## 架構設計原則

### 1. 領域驅動設計 (Domain-Driven Design)
```typescript
domains/
├─ shared-domain/          # 共享領域:跨業務通用功能
├─ project-management-domain/  # 專案管理領域:任務、日誌
├─ construction-domain/    # 營建工程領域:合約、材料、保固
├─ quality-assurance-domain/   # 品質保證領域:QA、問題追蹤
└─ financial-domain/       # 財務管理領域:發票、付款、預算
```

### 2. 三層模組結構 (領域 → 模組 → 子模組)
```typescript
// 範例:財務領域 → 財務模組 → 發票管理子模組
financial-domain/
└─ finance-module/
   └─ submodules/
      └─ invoice-management/  # 子模組:專注單一職責
         ├─ services/         # 服務層:業務邏輯
         ├─ models/           # 模型層:資料結構
         └─ index.ts          # 統一匯出
```

### 3. 清晰的層級職責
```
📦 領域 (Domain)
  └─ 按業務劃分,如:財務、品質、營建
  
📦 模組 (Module)
  └─ 領域內的功能集合,如:財務模組、合約模組
  
📦 子模組 (Submodule)
  └─ 模組內的細分功能,如:發票管理、付款管理
```

### 4. 標準化的模組結構
每個模組都遵循相同的結構:
```
module-name/
├─ submodules/              # 子模組目錄
│  ├─ submodule-a/          # 子模組 A
│  │  ├─ services/          # 服務層
│  │  ├─ models/            # 模型層 (如需要)
│  │  ├─ repositories/      # 倉儲層 (如需要)
│  │  └─ index.ts           # 子模組統一匯出
│  └─ submodule-b/          # 子模組 B
├─ models/                  # 模組核心模型
├─ repositories/            # 模組資料存取層
├─ services/                # 模組核心服務
├─ config/                  # 模組配置 (可選)
├─ exports/                 # 模組對外 API (可選)
├─ [module-name].module.ts  # 模組定義檔案
├─ module.metadata.ts       # 模組元資料
├─ index.ts                 # 模組統一匯出
└─ README.md                # 模組說明文件
```

### 5. 核心層 (Core) 職責
```
core/
├─ blueprint/          # Blueprint 系統核心
├─ data-access/        # 統一資料存取
├─ domain/             # 領域模型定義
├─ infrastructure/     # 外部服務整合
├─ services/           # 全域核心服務
├─ state/              # 全域狀態管理
└─ errors/             # 自訂錯誤類型
```

---

## 模組通訊機制

### 事件驅動架構
```typescript
// 模組間透過事件匯流排通訊
// 範例:合約完成後觸發財務模組
contractModule.emit('contract:completed', contractData);
financeModule.on('contract:completed', (data) => {
  // 自動生成發票
  invoiceService.generateInvoice(data);
});
```

### 依賴注入
```typescript
// 透過 Blueprint Container 管理模組依賴
@Injectable()
export class FinanceModule {
  constructor(
    private contractApi: ContractModuleApi,  // 注入其他模組 API
    private eventBus: EventBus
  ) {}
}
```

---

## 如何擴展新模組

### 1. 確定業務領域
```
問題:這個功能屬於哪個業務領域?
- 如果是通用功能 → shared-domain/
- 如果是專案相關 → project-management-domain/
- 如果是營建相關 → construction-domain/
- 如果是品質相關 → quality-assurance-domain/
- 如果是財務相關 → financial-domain/
```

### 2. 建立模組結構
```bash
# 範例:在財務領域新增「成本管理模組」
domains/financial-domain/cost-management-module/
├─ submodules/
│  ├─ cost-tracking/        # 成本追蹤子模組
│  └─ cost-analysis/        # 成本分析子模組
├─ models/
├─ services/
├─ cost-management.module.ts
├─ module.metadata.ts
├─ index.ts
└─ README.md
```

### 3. 註冊模組到 Blueprint
```typescript
// 在 module.metadata.ts 定義模組資訊
export const CostManagementModuleMetadata = {
  id: 'cost-management',
  name: '成本管理模組',
  version: '1.0.0',
  domain: 'financial-domain',
  dependencies: ['finance-module', 'contract-module'],
  exports: ['CostManagementApi']
};
```

---

## 命名規範

### 檔案命名
```
模組定義: [module-name].module.ts
服務類別: [service-name].service.ts
倉儲類別: [repository-name].repository.ts
模型類別: [model-name].model.ts
介面定義: [interface-name].interface.ts
列舉定義: [enum-name].enum.ts
類型定義: [type-name].types.ts
```

### 目錄命名
```
使用 kebab-case (小寫加連字號)
✅ invoice-management/
✅ cost-tracking/
❌ InvoiceManagement/
❌ cost_tracking/
```

---

## 測試結構
```
每個模組包含對應測試:
module-name/
├─ services/
│  ├─ service-a.service.ts
│  └─ service-a.service.spec.ts  # 單元測試
├─ module-name.integration.spec.ts  # 整合測試
└─ module-name.e2e.spec.ts          # E2E 測試
```

---

## 文件規範

### 每個模組必須包含 README.md
```markdown
# 模組名稱

## 功能說明
簡述模組功能

## 子模組
列出所有子模組及其職責

## 對外 API
列出提供給其他模組的 API

## 依賴模組
列出依賴的其他模組

## 使用範例
提供程式碼範例
```

---

## 遷移指南

### 從舊結構遷移到新結構

#### 步驟 1: 分析現有模組
```
現有: core/blueprint/modules/implementations/finance/
新位置: domains/financial-domain/finance-module/
```

#### 步驟 2: 建立領域目錄
```bash
mkdir -p src/app/domains/financial-domain
```

#### 步驟 3: 移動模組檔案
```bash
# 保持模組內部結構不變
mv core/blueprint/modules/implementations/finance \
   domains/financial-domain/finance-module
```

#### 步驟 4: 更新匯入路徑
```typescript
// 舊路徑
import { FinanceService } from '@core/blueprint/modules/implementations/finance';

// 新路徑
import { FinanceService } from '@domains/financial-domain/finance-module';
```

#### 步驟 5: 建立子模組
```
將大型服務拆分為子模組:
services/
├─ invoice.service.ts          → submodules/invoice-management/
├─ payment.service.ts          → submodules/payment-management/
└─ budget.service.ts           → submodules/budget-management/
```

---

## 優勢總結

### ✅ 清晰的業務劃分
- 按領域組織,業務邏輯一目了然
- 新人可快速找到對應功能模組

### ✅ 高度可擴展
- 新增功能只需在對應領域添加模組
- 模組內部可無限添加子模組

### ✅ 低耦合高內聚
- 模組間透過事件和 API 通訊
- 每個模組專注自身業務邏輯

### ✅ 易於維護
- 統一的目錄結構和命名規範
- 完整的文件和測試覆蓋

### ✅ 團隊協作友善
- 不同團隊可獨立開發不同領域
- 清晰的模組邊界減少衝突

---

## 工具支援

### 使用 CLI 快速生成模組
```bash
# 生成新領域
yarn generate:domain [domain-name]

# 生成新模組
yarn generate:module [domain-name]/[module-name]

# 生成新子模組
yarn generate:submodule [domain-name]/[module-name]/[submodule-name]
```

### TypeScript Path Mapping
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@domains/*": ["src/app/domains/*"],
      "@shared/*": ["src/app/shared/*"],
      "@routes/*": ["src/app/routes/*"]
    }
  }
}
```

---

## 範例:新增「採購管理模組」

### 1. 確定領域
採購管理屬於營建工程領域

### 2. 建立模組結構
```
domains/construction-domain/procurement-module/
├─ submodules/
│  ├─ vendor-management/       # 供應商管理
│  │  ├─ services/
│  │  │  └─ vendor.service.ts
│  │  └─ index.ts
│  ├─ purchase-orders/         # 採購單管理
│  │  ├─ services/
│  │  │  └─ purchase-order.service.ts
│  │  └─ index.ts
│  └─ price-comparison/        # 比價管理
│     ├─ services/
│     │  └─ price-comparison.service.ts
│     └─ index.ts
├─ models/
│  ├─ procurement.model.ts
│  └─ index.ts
├─ repositories/
│  ├─ procurement.repository.ts
│  └─ index.ts
├─ services/
│  ├─ procurement.service.ts
│  └─ index.ts
├─ procurement.module.ts
├─ module.metadata.ts
├─ index.ts
└─ README.md
```

### 3. 實作模組
```typescript
// procurement.module.ts
import { Injectable } from '@angular/core';
import { BaseModule } from '@core/blueprint/modules/base';

@Injectable()
export class ProcurementModule extends BaseModule {
  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    // 初始化邏輯
  }
}
```

### 4. 註冊到 Blueprint
```typescript
// module.metadata.ts
export const ProcurementModuleMetadata = {
  id: 'procurement',
  name: '採購管理模組',
  version: '1.0.0',
  domain: 'construction-domain',
  dependencies: ['contract-module', 'finance-module'],
  exports: ['ProcurementApi']
};
```

---

## 總結

這個優化架構提供了:
1. **清晰的業務領域劃分** (5 大領域)
2. **標準化的三層結構** (領域 → 模組 → 子模組)
3. **完整的擴展指南** (如何新增模組)
4. **統一的命名規範** (檔案、目錄、類別)
5. **詳細的遷移步驟** (從舊結構升級)

此架構適合中大型 Angular 企業應用,支援團隊協作和長期維護。