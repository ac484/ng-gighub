# GigHub 專案優化結構

> **最後更新**: 2025-12-14  
> **版本**: 2.0 (重構版)

## 📋 目錄

- [優化概述](#優化概述)
- [完整目錄結構](#完整目錄結構)
- [架構分層說明](#架構分層說明)
- [遷移指南](#遷移指南)

---

## 🎯 優化概述

### 核心改進

1. **清晰的分層架構**: Presentation → Application → Domain → Infrastructure
2. **統一的資料存取層**: 所有 repositories 集中管理
3. **標準化的 Feature 結構**: 每個功能模組遵循相同的組織模式
4. **Blueprint 模組優化**: 更清晰的模組註冊和管理機制
5. **狀態管理重組**: 統一的 state 管理策略

---

## 📁 完整目錄結構

```
│  AGENTS.md
│  index.html
│  main.ts
│  style-icons-auto.ts
│  style-icons.ts
│  styles.less
│  typings.d.ts
│
├─app
│  │  AGENTS.md
│  │  app.component.ts
│  │  app.config.ts
│  │  README.md                                    # 📘 應用程式總覽文檔
│  │
│  ├─core                                          # 🏗️ 核心層 (Domain + Infrastructure)
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │  README.md
│  │
│  │  ├─auth                                       # ✨ 認證與授權模組
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─guards
│  │  │  │      auth.guard.ts
│  │  │  │      permission.guard.ts
│  │  │  │      role.guard.ts
│  │  │  │      start-page.guard.ts                # 從 core 根目錄移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─interceptors
│  │  │  │      auth-token.interceptor.ts
│  │  │  │      refresh-token.interceptor.ts       # 從 net 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─services
│  │  │  │      firebase-auth.service.ts           # 從 services 移入
│  │  │  │      auth-state.service.ts
│  │  │  │      permission.service.ts              # 從 shared 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─models
│  │  │          auth-user.model.ts
│  │  │          login-credentials.model.ts
│  │  │          index.ts
│  │  │
│  │  ├─blueprint                                   # 📐 Blueprint 架構系統
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─config
│  │  │  │      blueprint-config.interface.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      blueprint-container.interface.ts
│  │  │  │      blueprint-container.ts
│  │  │  │      lifecycle-manager.interface.ts
│  │  │  │      lifecycle-manager.ts
│  │  │  │      resource-provider.interface.ts
│  │  │  │      resource-provider.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─context
│  │  │  │      execution-context.interface.ts
│  │  │  │      shared-context.ts
│  │  │  │      tenant-info.interface.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-bus.interface.ts
│  │  │  │      event-bus.ts
│  │  │  │      event-types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      module-connection.interface.ts
│  │  │  │      blueprint.model.ts                 # 從 core/models 移入
│  │  │  │      blueprint-config.model.ts          # 從 core/models 移入
│  │  │  │      blueprint-module.model.ts          # 從 core/models 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─modules
│  │  │  │  │  index.ts
│  │  │  │  │  module-status.enum.ts
│  │  │  │  │  module.interface.ts
│  │  │  │  │  README.md
│  │  │  │  │
│  │  │  │  ├─base                                  # 模組基礎抽象層
│  │  │  │  │      base-module.abstract.ts
│  │  │  │  │      base-module.interface.ts
│  │  │  │  │      module-lifecycle.interface.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─registry                              # ✨ 模組註冊機制
│  │  │  │  │      module-registry.interface.ts
│  │  │  │  │      module-registry.ts
│  │  │  │  │      module-loader.service.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  └─implementations                       # 各功能模組實作
│  │  │  │      │  index.ts
│  │  │  │      │  README.md
│  │  │  │      │
│  │  │  │      ├─acceptance                        # 驗收模組
│  │  │  │      │  │  acceptance.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      acceptance.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      acceptance.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          conclusion.service.ts
│  │  │  │      │          preliminary.service.ts
│  │  │  │      │          re-inspection.service.ts
│  │  │  │      │          request.service.ts
│  │  │  │      │          review.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─audit-logs                        # 審計日誌模組
│  │  │  │      │  │  audit-logs.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      audit-logs.config.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      audit-log.model.ts
│  │  │  │      │  │      audit-log.types.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      audit-log.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─services
│  │  │  │      │  │      audit-logs.service.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─exports
│  │  │  │      │          audit-logs-api.exports.ts
│  │  │  │      │
│  │  │  │      ├─climate                           # 氣候模組
│  │  │  │      │  │  climate.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      climate.config.ts
│  │  │  │      │  │      cwb-api.constants.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cwb-api-response.model.ts
│  │  │  │      │  │      weather-forecast.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      climate.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─services
│  │  │  │      │  │      climate-cache.service.ts
│  │  │  │      │  │      cwb-weather.service.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─exports
│  │  │  │      │          climate-api.exports.ts
│  │  │  │      │
│  │  │  │      ├─cloud                             # 雲端儲存模組
│  │  │  │      │  │  cloud.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cloud.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      cloud.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          cloud-storage.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─communication                     # 通訊模組
│  │  │  │      │  │  communication.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      communication.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      communication.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          group-message.service.ts
│  │  │  │      │          push-notification.service.ts
│  │  │  │      │          system-notification.service.ts
│  │  │  │      │          task-reminder.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─finance                           # 財務模組
│  │  │  │      │  │  finance.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      finance.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      finance.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          budget.service.ts
│  │  │  │      │          cost-management.service.ts
│  │  │  │      │          financial-report.service.ts
│  │  │  │      │          invoice.service.ts
│  │  │  │      │          ledger.service.ts
│  │  │  │      │          payment.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─log                               # 日誌模組
│  │  │  │      │  │  log.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      activity-log.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      log.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          activity-log.service.ts
│  │  │  │      │          attachment.service.ts
│  │  │  │      │          change-history.service.ts
│  │  │  │      │          comment.service.ts
│  │  │  │      │          system-event.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─material                          # 物料模組
│  │  │  │      │  │  material.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      material.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      material.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          consumption.service.ts
│  │  │  │      │          equipment.service.ts
│  │  │  │      │          inventory.service.ts
│  │  │  │      │          material-issue.service.ts
│  │  │  │      │          material-management.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─qa                                # 品質保證模組
│  │  │  │      │  │  qa.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      qa.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      qa.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          checklist.service.ts
│  │  │  │      │          defect.service.ts
│  │  │  │      │          inspection.service.ts
│  │  │  │      │          report.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─safety                            # 安全模組
│  │  │  │      │  │  safety.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      safety-inspection.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      safety.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          incident-report.service.ts
│  │  │  │      │          risk-assessment.service.ts
│  │  │  │      │          safety-inspection.service.ts
│  │  │  │      │          safety-training.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─tasks                             # 任務模組
│  │  │  │      │  │  tasks.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      task.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      tasks.repository.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          tasks.service.ts
│  │  │  │      │          task-hierarchy.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      └─workflow                          # 工作流程模組
│  │  │  │          │  workflow.module.ts
│  │  │  │          │  module.metadata.ts
│  │  │  │          │  index.ts
│  │  │  │          │  README.md
│  │  │  │          │
│  │  │  │          ├─models
│  │  │  │          │      workflow.model.ts
│  │  │  │          │      index.ts
│  │  │  │          │
│  │  │  │          ├─repositories
│  │  │  │          │      workflow.repository.ts
│  │  │  │          │      index.ts
│  │  │  │          │
│  │  │  │          └─services
│  │  │  │                  approval.service.ts
│  │  │  │                  automation.service.ts
│  │  │  │                  custom-workflow.service.ts
│  │  │  │                  state-machine.service.ts
│  │  │  │                  template.service.ts
│  │  │  │                  index.ts
│  │  │  │
│  │  │  ├─services                                 # Blueprint 核心服務
│  │  │  │      blueprint.service.ts
│  │  │  │      blueprint-validation-schemas.ts
│  │  │  │      dependency-validator.service.ts
│  │  │  │      validation.service.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─testing                                  # ✨ Blueprint 測試工具
│  │  │          blueprint-container.spec.ts        # 從 container 移入
│  │  │          lifecycle-manager.spec.ts          # 從 container 移入
│  │  │          module-registry.spec.ts            # 從 container 移入
│  │  │          resource-provider.spec.ts          # 從 container 移入
│  │  │          shared-context.spec.ts             # 從 context 移入
│  │  │          event-bus.spec.ts                  # 從 events 移入
│  │  │          container-lifecycle.integration.spec.ts
│  │  │          event-bus.integration.spec.ts
│  │  │          module-communication.integration.spec.ts
│  │  │          index.ts
│  │  │
│  │  ├─data-access                                 # ✨ 統一資料存取層
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─repositories                             # 所有 Repository
│  │  │  │  │  index.ts
│  │  │  │  │  README.md
│  │  │  │  │
│  │  │  │  ├─base                                  # Repository 基礎類別
│  │  │  │  │      firestore-base.repository.ts
│  │  │  │  │      repository.interface.ts          # ✨ 新增統一介面
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─account
│  │  │  │  │      account.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─blueprint
│  │  │  │  │      blueprint.repository.ts
│  │  │  │  │      blueprint-member.repository.ts
│  │  │  │  │      blueprint-module.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─log
│  │  │  │  │      log-firestore.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─notification
│  │  │  │  │      notification.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─organization
│  │  │  │  │      organization.repository.ts
│  │  │  │  │      organization-member.repository.ts
│  │  │  │  │      organization-invitation.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─storage
│  │  │  │  │      firebase-storage.repository.ts
│  │  │  │  │      storage.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  ├─task
│  │  │  │  │      task-firestore.repository.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  └─team
│  │  │  │          team.repository.ts
│  │  │  │          team-member.repository.ts
│  │  │  │          index.ts
│  │  │  │
│  │  │  ├─api                                      # ✨ API 服務層
│  │  │  │      api-client.service.ts               # HTTP 客戶端
│  │  │  │      api-config.ts                       # API 配置
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─cache                                    # ✨ 快取策略
│  │  │          cache.service.ts
│  │  │          cache-strategy.interface.ts
│  │  │          memory-cache.strategy.ts
│  │  │          index.ts
│  │  │
│  │  ├─errors                                      # 錯誤處理
│  │  │      AGENTS.md
│  │  │      index.ts
│  │  │      base.error.ts                          # ✨ 基礎錯誤類別
│  │  │      blueprint-error.ts
│  │  │      module-not-found-error.ts
│  │  │      permission-denied-error.ts
│  │  │      validation-error.ts
│  │  │      http-error.ts                          # ✨ HTTP 錯誤
│  │  │      error-handler.service.ts               # ✨ 全域錯誤處理
│  │  │
│  │  ├─i18n                                        # 國際化
│  │  │      i18n.service.ts
│  │  │      i18n-loader.service.ts                 # ✨ 語言檔載入器
│  │  │      index.ts
│  │  │
│  │  ├─infrastructure                              # ✨ 基礎設施層
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─firebase                                 # Firebase 整合
│  │  │  │      firebase.service.ts
│  │  │  │      firebase-analytics.service.ts
│  │  │  │      firebase-config.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─http                                     # HTTP 相關
│  │  │  │      default.interceptor.ts              # 從 net 移入
│  │  │  │      http-helper.ts                      # 從 net 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─monitoring                               # 監控服務
│  │  │  │      error-tracking.service.ts
│  │  │  │      performance-monitoring.service.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─messaging                                # 訊息服務
│  │  │          push-messaging.service.ts
│  │  │          index.ts
│  │  │
│  │  ├─models                                      # 領域模型
│  │  │      AGENTS.md
│  │  │      index.ts
│  │  │      notification.model.ts
│  │  │      user.model.ts                          # ✨ 使用者模型
│  │  │      README.md
│  │  │
│  │  ├─state                                       # ✨ 狀態管理 (重命名)
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─stores                                   # 狀態儲存
│  │  │  │      construction-log.store.ts
│  │  │  │      log.store.ts
│  │  │  │      notification.store.ts
│  │  │  │      task.store.ts
│  │  │  │      team.store.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─actions                                  # ✨ 狀態動作
│  │  │  │      task.actions.ts
│  │  │  │      log.actions.ts
│  │  │  │      notification.actions.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─selectors                                # ✨ 狀態選擇器
│  │  │          task.selectors.ts
│  │  │          log.selectors.ts
│  │  │          notification.selectors.ts
│  │  │          index.ts
│  │  │
│  │  ├─types                                       # 類型定義
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─account
│  │  │  │      account.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─blueprint
│  │  │  │      blueprint-status.enum.ts
│  │  │  │      blueprint.types.ts
│  │  │  │      owner-type.enum.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─configuration
│  │  │  │      configuration.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-type.enum.ts
│  │  │  │      event.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─log
│  │  │  │      log-task.types.ts
│  │  │  │      log.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─module
│  │  │  │      module-state.enum.ts
│  │  │  │      module.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─permission
│  │  │  │      permission-level.enum.ts
│  │  │  │      permission.types.ts
│  │  │  │      role.enum.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─quality-control
│  │  │  │      quality-control.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─storage
│  │  │  │      storage.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─task
│  │  │  │      task-quantity.types.ts
│  │  │  │      task-view.types.ts
│  │  │  │      task.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─workflow
│  │  │          workflow.types.ts
│  │  │          index.ts
│  │  │
│  │  ├─utils                                       # 工具函數
│  │  │      index.ts
│  │  │      task-hierarchy.util.ts
│  │  │      date.util.ts                           # ✨ 日期工具
│  │  │      string.util.ts                         # ✨ 字串工具
│  │  │      validation.util.ts                     # ✨ 驗證工具
│  │  │
│  │  └─startup                                     # 應用程式啟動
│  │          startup.service.ts
│  │          index.ts
│  │
│  ├─features                                       # 🎨 功能模組層 (Application Layer)
│  │  │  AGENTS.md
│  │  │  README.md
│  │  │
│  │  ├─construction-log                            # ✨ 施工日誌功能
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      construction-log.page.ts            # 主頁面
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      construction-log-modal.component.ts
│  │  │  │      log-detail-card.component.ts        # ✨ 日誌詳情卡片
│  │  │  │      log-form.component.ts               # ✨ 日誌表單
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─services
│  │  │  │      construction-log-facade.service.ts  # ✨ Facade 服務
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          construction-log.routes.ts
│  │  │
│  │  ├─module-manager                              # 模組管理器功能
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      module-manager.page.ts              # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      module-card.component.ts
│  │  │  │      module-config-form.component.ts
│  │  │  │      module-dependency-graph.component.ts
│  │  │  │      module-status-badge.component.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─services
│  │  │  │      module-manager.service.ts
│  │  │  │      module-manager-facade.service.ts    # ✨ Facade 服務
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          module-manager.routes.ts
│  │  │
│  │  └─tasks                                       # ✨ 任務管理功能
│  │      │  index.ts
│  │      │  README.md
│  │      │
│  │      ├─pages
│  │      │      tasks.page.ts                      # 主頁面 (從 routes 移入)
│  │      │      index.ts
│  │      │
│  │      ├─components
│  │      │      task-modal.component.ts            # 從 routes 移入
│  │      │      task-card.component.ts             # ✨ 任務卡片
│  │      │      task-form.component.ts             # ✨ 任務表單
│  │      │      index.ts
│  │      │
│  │      ├─views                                   # 不同視圖模式
│  │      │      task-gantt-view.component.ts       # 從 routes 移入
│  │      │      task-kanban-view.component.ts      # 從 routes 移入
│  │      │      task-list-view.component.ts        # 從 routes 移入
│  │      │      task-timeline-view.component.ts    # 從 routes 移入
│  │      │      task-tree-view.component.ts        # 從 routes 移入
│  │      │      index.ts
│  │      │
│  │      ├─services
│  │      │      tasks-facade.service.ts            # ✨ Facade 服務
│  │      │      index.ts
│  │      │
│  │      └─routes
│  │              tasks.routes.ts
│  │
│  ├─layout                                         # 🎭 佈局層
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │  README.md
│  │  │
│  │  ├─basic                                       # 基本佈局
│  │  │  │  basic.component.ts
│  │  │  │  basic.component.html                    # ✨ 模板檔案
│  │  │  │  basic.component.less                    # ✨ 樣式檔案
│  │  │  │  README.md
│  │  │  │
│  │  │  └─widgets                                  # 佈局小工具
│  │  │          clear-storage.component.ts
│  │  │          context-switcher.component.ts
│  │  │          fullscreen.component.ts
│  │  │          i18n.component.ts
│  │  │          icon.component.ts
│  │  │          notify.component.ts
│  │  │          rtl.component.ts
│  │  │          search.component.ts
│  │  │          task.component.ts
│  │  │          user.component.ts
│  │  │          index.ts
│  │  │
│  │  ├─blank                                       # 空白佈局
│  │  │      blank.component.ts
│  │  │      blank.component.html                   # ✨ 模板檔案
│  │  │      README.md
│  │  │
│  │  └─passport                                    # 認證佈局
│  │          passport.component.ts
│  │          passport.component.html               # ✨ 模板檔案
│  │          passport.component.less
│  │
│  ├─routes                                         # 🗺️ 路由與頁面層 (Presentation Layer)
│  │  │  AGENTS.md
│  │  │  routes.ts
│  │  │  README.md
│  │  │
│  │  ├─blueprint                                   # Blueprint 管理
│  │  │  │  AGENTS.md
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages                                    # ✨ 頁面元件
│  │  │  │      blueprint-list.page.ts              # 重命名
│  │  │  │      blueprint-detail.page.ts            # 重命名
│  │  │  │      blueprint-designer.page.ts          # 重命名
│  │  │  │      container-dashboard.page.ts         # 從 container 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components                               # UI 元件
│  │  │  │      blueprint-modal.component.ts
│  │  │  │      connection-layer.component.ts
│  │  │  │      validation-alerts.component.ts
│  │  │  │      event-bus-monitor.component.ts      # 從 container 移入
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─members                                  # 成員管理
│  │  │  │      blueprint-members.component.ts
│  │  │  │      member-modal.component.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─modules                                  # 模組視圖
│  │  │  │      acceptance-module-view.component.ts
│  │  │  │      cloud-module-view.component.ts
│  │  │  │      communication-module-view.component.ts
│  │  │  │      finance-module-view.component.ts
│  │  │  │      log-module-view.component.ts
│  │  │  │      material-module-view.component.ts
│  │  │  │      qa-module-view.component.ts
│  │  │  │      safety-module-view.component.ts
│  │  │  │      workflow-module-view.component.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          blueprint.routes.ts
│  │  │
│  │  ├─dashboard                                   # 儀表板
│  │  │  │  AGENTS.md
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      dashboard.page.ts                   # ✨ 主儀表板頁面
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      stats-card.component.ts             # ✨ 統計卡片
│  │  │  │      chart-widget.component.ts           # ✨ 圖表小工具
│  │  │  │      recent-activity.component.ts        # ✨ 最近活動
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          dashboard.routes.ts
│  │  │
│  │  ├─exception                                   # 異常頁面
│  │  │  │  AGENTS.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      exception.page.ts                   # 重命名
│  │  │  │      trigger.page.ts                     # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          exception.routes.ts
│  │  │
│  │  ├─explore                                     # 探索功能
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      explore.page.ts                     # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      filter-panel.component.ts
│  │  │  │      result-grid.component.ts
│  │  │  │      search-bar.component.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      search-result.model.ts
│  │  │  │      search-filter.model.ts              # ✨ 篩選模型
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─services
│  │  │  │      explore-search.facade.ts
│  │  │  │      search-cache.service.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          explore.routes.ts
│  │  │
│  │  ├─monitoring                                  # 監控頁面
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      monitoring-dashboard.page.ts        # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      performance-chart.component.ts      # ✨ 效能圖表
│  │  │  │      error-log-table.component.ts        # ✨ 錯誤日誌表格
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          monitoring.routes.ts
│  │  │
│  │  ├─organization                                # 組織管理
│  │  │  │  AGENTS.md
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      organization-overview.page.ts       # ✨ 組織總覽
│  │  │  │      organization-members.page.ts        # 重命名
│  │  │  │      organization-teams.page.ts          # 重命名
│  │  │  │      organization-settings.page.ts       # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      team-modal.component.ts
│  │  │  │      member-invite-modal.component.ts    # ✨ 成員邀請
│  │  │  │      organization-card.component.ts      # ✨ 組織卡片
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          organization.routes.ts
│  │  │
│  │  ├─passport                                    # 認證頁面
│  │  │  │  AGENTS.md
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      login.page.ts                       # 重命名
│  │  │  │      register.page.ts                    # 重命名
│  │  │  │      register-result.page.ts             # 重命名
│  │  │  │      lock.page.ts                        # 重命名
│  │  │  │      callback.page.ts                    # 重命名
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      login-form.component.ts             # ✨ 登入表單
│  │  │  │      register-form.component.ts          # ✨ 註冊表單
│  │  │  │      social-login.component.ts           # ✨ 社交登入
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          passport.routes.ts
│  │  │
│  │  ├─team                                        # 團隊管理
│  │  │  │  AGENTS.md
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─pages
│  │  │  │      team-overview.page.ts               # ✨ 團隊總覽
│  │  │  │      team-members.page.ts                # 重命名
│  │  │  │      team-settings.page.ts               # ✨ 團隊設定
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      team-member-modal.component.ts
│  │  │  │      team-card.component.ts              # ✨ 團隊卡片
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─routes
│  │  │          team.routes.ts
│  │  │
│  │  └─user                                        # 使用者設定
│  │      │  AGENTS.md
│  │      │  README.md
│  │      │
│  │      ├─pages
│  │      │      user-profile.page.ts               # ✨ 使用者個人檔案
│  │      │      user-settings.page.ts              # 重命名
│  │      │      index.ts
│  │      │
│  │      ├─components
│  │      │      profile-card.component.ts          # ✨ 個人檔案卡片
│  │      │      settings-form.component.ts         # ✨ 設定表單
│  │      │      index.ts
│  │      │
│  │      └─routes
│  │              user.routes.ts
│  │
│  └─shared                                         # 🔧 共享模組層
│      │  AGENTS.md
│      │  index.ts
│      │  README.md
│      │  shared-delon.module.ts
│      │  shared-imports.ts
│      │  shared-zorro.module.ts
│      │
│      ├─cdk                                        # Angular CDK
│      │      index.ts
│      │      README.md
│      │      shared-cdk.module.ts
│      │
│      ├─components                                 # 共享 UI 元件
│      │  │  index.ts
│      │  │  README.md
│      │  │
│      │  ├─data-display                            # ✨ 資料展示元件
│      │  │      breadcrumb.component.ts
│      │  │      index.ts
│      │  │
│      │  ├─feedback                                # ✨ 回饋元件
│      │  │      loading-spinner.component.ts       # ✨ 載入動畫
│      │  │      empty-state.component.ts           # ✨ 空狀態
│      │  │      index.ts
│      │  │
│      │  ├─forms                                   # ✨ 表單元件
│      │  │      index.ts
│      │  │
│      │  ├─layout                                  # ✨ 佈局元件
│      │  │      index.ts
│      │  │
│      │  └─modals                                  # ✨ 模態框元件
│      │          create-organization-modal.component.ts  # 重命名
│      │          create-team-modal.component.ts           # 重命名
│      │          edit-team-modal.component.ts
│      │          team-detail-drawer.component.ts
│      │          index.ts
│      │
│      ├─directives                                 # ✨ 共享指令
│      │      index.ts
│      │      README.md
│      │      permission.directive.ts               # ✨ 權限指令
│      │      loading.directive.ts                  # ✨ 載入指令
│      │      debounce-click.directive.ts           # ✨ 防抖指令
│      │
│      ├─pipes                                      # ✨ 共享管道
│      │      index.ts
│      │      README.md
│      │      safe-html.pipe.ts                     # ✨ 安全 HTML
│      │      time-ago.pipe.ts                      # ✨ 相對時間
│      │      file-size.pipe.ts                     # ✨ 檔案大小
│      │
│      ├─validators                                 # ✨ 共享驗證器
│      │      index.ts
│      │      README.md
│      │      custom-validators.ts                  # ✨ 自訂驗證器
│      │
│      ├─models                                     # ✨ 共享模型
│      │      index.ts
│      │      pagination.model.ts                   # ✨ 分頁模型
│      │      api-response.model.ts                 # ✨ API 回應模型
│      │
│      ├─services                                   # 共享服務
│      │      AGENTS.md
│      │      index.ts
│      │      breadcrumb.service.ts
│      │      menu-management.service.ts
│      │      workspace-context.service.ts
│      │      notification.service.ts               # ✨ 通知服務
│      │
│      ├─utils                                      # 共享工具
│      │      index.ts
│      │      async-state.ts
│      │      array.util.ts                         # ✨ 陣列工具
│      │      object.util.ts                        # ✨ 物件工具
│      │
│      ├─cell-widget                                # Cell Widgets
│      │      index.ts
│      │
│      ├─json-schema                                # JSON Schema
│      │  │  index.ts
│      │  │  README.md
│      │  │
│      │  └─widgets
│      │          test.widget.ts
│      │
│      └─st-widget                                  # ST Widgets
│              index.ts
│              README.md
│
├─assets                                            # 📦 靜態資源
│  │  color.less
│  │  logo-color.svg
│  │  logo-full.svg
│  │  logo.svg
│  │  style.compact.css
│  │  style.dark.css
│  │  zorro.svg
│  │
│  └─tmp                                            # 臨時資源
│      │  app-data.json
│      │  demo.docx
│      │  demo.pdf
│      │  demo.pptx
│      │  demo.xlsx
│      │  demo.zip
│      │  on-boarding.json
│      │
│      ├─i18n                                       # 語言檔
│      │      en-US.json
│      │      zh-CN.json
│      │      zh-TW.json
│      │
│      └─img                                        # 圖片資源
│              1.png
│              2.png
│              3.png
│              4.png
│              5.png
│              6.png
│              avatar.jpg
│
├─environments                                      # ⚙️ 環境配置
│      AGENTS.md
│      environment.ts
│      environment.prod.ts
│      environment.staging.ts                       # ✨ 測試環境
│
└─styles                                            # 🎨 全域樣式
        AGENTS.md
        index.less
        theme.less
        variables.less                              # ✨ 樣式變數
```

---

## 🏗️ 架構分層說明

### 1. **Presentation Layer (routes/)**
- **職責**: 處理使用者介面和路由
- **包含**: 頁面元件、UI 元件、路由配置
- **依賴**: Application Layer (features/)

**結構模式**:
```
routes/[feature-name]/
├── pages/              # 頁面元件 (Smart Components)
├── components/         # UI 元件 (Dumb Components)
└── routes/            # 路由配置
    └── [feature].routes.ts
```

### 2. **Application Layer (features/)**
- **職責**: 業務邏輯協調和功能封裝
- **包含**: Facade 服務、功能專屬元件
- **依賴**: Domain Layer (core/)

**結構模式**:
```
features/[feature-name]/
├── pages/              # 功能頁面
├── components/         # 功能元件
├── services/           # Facade 服務
│   └── [feature]-facade.service.ts
└── routes/
    └── [feature].routes.ts
```

### 3. **Domain Layer (core/)**
- **職責**: 領域模型、業務規則、類型定義
- **包含**: Models, Types, Blueprint System
- **依賴**: Infrastructure Layer

**核心子模組**:
- `auth/`: 認證授權
- `blueprint/`: Blueprint 架構系統
- `state/`: 狀態管理
- `models/`: 領域模型
- `types/`: 類型定義
- `errors/`: 錯誤處理

### 4. **Infrastructure Layer (core/)**
- **職責**: 技術實作、外部服務整合
- **包含**: 資料存取、HTTP、Firebase、監控

**核心子模組**:
- `data-access/`: 統一資料存取
  - `repositories/`: 資料儲存庫
  - `api/`: API 服務
  - `cache/`: 快取策略
- `infrastructure/`: 基礎設施
  - `firebase/`: Firebase 整合
  - `http/`: HTTP 相關
  - `monitoring/`: 監控服務
  - `messaging/`: 訊息服務

### 5. **Shared Layer (shared/)**
- **職責**: 跨功能共享資源
- **包含**: UI 元件、指令、管道、工具

---

## 🔄 遷移指南

### Phase 1: 建立新結構 (Week 1)

```bash
# 1. 建立核心目錄
mkdir -p src/app/core/{auth,data-access,infrastructure,state}
mkdir -p src/app/core/auth/{guards,interceptors,services,models}
mkdir -p src/app/core/data-access/{repositories,api,cache}
mkdir -p src/app/core/infrastructure/{firebase,http,monitoring,messaging}
mkdir -p src/app/core/state/{stores,actions,selectors}

# 2. 建立 Features 目錄
mkdir -p src/app/features/{construction-log,tasks}
mkdir -p src/app/features/construction-log/{pages,components,services,routes}
mkdir -p src/app/features/tasks/{pages,components,views,services,routes}

# 3. 優化 Routes 目錄
mkdir -p src/app/routes/blueprint/pages
mkdir -p src/app/routes/dashboard/{pages,components}
mkdir -p src/app/routes/organization/pages
mkdir -p src/app/routes/team/pages
mkdir -p src/app/routes/user/pages

# 4. 擴展 Shared 目錄
mkdir -p src/app/shared/{directives,pipes,validators,models}
mkdir -p src/app/shared/components/{data-display,feedback,forms,layout,modals}
```

### Phase 2: 移動檔案 (Week 2-3)

#### 2.1 移動 Auth 相關檔案

```typescript
// src/app/core/auth/index.ts
export * from './guards';
export * from './interceptors';
export * from './services';
export * from './models';
```

```bash
# 移動檔案
mv src/app/core/start-page.guard.ts src/app/core/auth/guards/
mv src/app/core/net/refresh-token.ts src/