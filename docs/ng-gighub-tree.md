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
│  │
│  ├─core
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │  README.md
│  │  │  start-page.guard.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │
│  │  │  ├─config
│  │  │  │      blueprint-config.interface.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      blueprint-container.interface.ts
│  │  │  │      blueprint-container.ts
│  │  │  │      index.ts
│  │  │  │      lifecycle-manager.interface.ts
│  │  │  │      lifecycle-manager.ts
│  │  │  │      module-registry.interface.ts
│  │  │  │      module-registry.ts
│  │  │  │      resource-provider.interface.ts
│  │  │  │      resource-provider.ts
│  │  │  │
│  │  │  ├─context
│  │  │  │      execution-context.interface.ts
│  │  │  │      index.ts
│  │  │  │      shared-context.ts
│  │  │  │      tenant-info.interface.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │  │  enhanced-event-bus.service.ts
│  │  │  │  │  event-bus.interface.ts
│  │  │  │  │  event-bus.ts
│  │  │  │  │  event-types.ts
│  │  │  │  │  index.ts
│  │  │  │  │
│  │  │  │  ├─models
│  │  │  │  │      blueprint-event.model.ts
│  │  │  │  │      event-log-entry.model.ts
│  │  │  │  │      event-priority.enum.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  └─types
│  │  │  │          index.ts
│  │  │  │          system-event-type.enum.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      module-connection.interface.ts
│  │  │  │
│  │  │  ├─modules
│  │  │  │  │  index.ts
│  │  │  │  │  module-status.enum.ts
│  │  │  │  │  module.interface.ts
│  │  │  │  │
│  │  │  │  └─implementations
│  │  │  │      │  index.ts
│  │  │  │      │
│  │  │  │      ├─audit-logs
│  │  │  │      │  │  audit-logs.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      audit-logs.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      audit-logs.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      audit-logs-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      audit-log.model.ts
│  │  │  │      │  │      audit-log.types.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      audit-log.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          audit-logs.service.ts
│  │  │  │      │
│  │  │  │      ├─finance
│  │  │  │      │  │  finance.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      budget-overview.component.ts
│  │  │  │      │  │      finance-dashboard.component.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      invoice-list.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      budget.model.ts
│  │  │  │      │  │      finance.model.ts
│  │  │  │      │  │      financial-summary.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      invoice-service.interface.ts
│  │  │  │      │  │      invoice-status-machine.ts
│  │  │  │      │  │      invoice.model.ts
│  │  │  │      │  │      ledger.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      budget.repository.ts
│  │  │  │      │  │      finance.repository.ts
│  │  │  │      │  │      ledger.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          budget.service.ts
│  │  │  │      │          cost-management.service.ts
│  │  │  │      │          financial-report.service.ts
│  │  │  │      │          invoice-approval.service.ts
│  │  │  │      │          invoice-generation.service.ts
│  │  │  │      │          invoice.service.ts
│  │  │  │      │          ledger.service.ts
│  │  │  │      │          payment-approval.service.ts
│  │  │  │      │          payment-generation.service.ts
│  │  │  │      │          payment-status-tracking.service.ts
│  │  │  │      │          payment.service.ts
│  │  │  │      │
│  │  │  │      ├─safety
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  safety.module.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      safety-inspection.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      safety.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          incident-report.service.ts
│  │  │  │      │          risk-assessment.service.ts
│  │  │  │      │          safety-inspection.service.ts
│  │  │  │      │          safety-training.service.ts
│  │  │  │      │
│  │  │  │      ├─warranty
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  warranty.module.ts
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      warranty.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      warranty.api.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      warranty-defect.model.ts
│  │  │  │      │  │      warranty-repair.model.ts
│  │  │  │      │  │      warranty-status-machine.ts
│  │  │  │      │  │      warranty.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      warranty-defect.repository.ts
│  │  │  │      │  │      warranty-repair.repository.ts
│  │  │  │      │  │      warranty.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          index.ts
│  │  │  │      │          warranty-defect.service.ts
│  │  │  │      │          warranty-event-handlers.ts
│  │  │  │      │          warranty-period.service.ts
│  │  │  │      │          warranty-repair.service.ts
│  │  │  │      │
│  │  │  │      └─workflow
│  │  │  │          │  index.ts
│  │  │  │          │  module.metadata.ts
│  │  │  │          │  README.md
│  │  │  │          │  workflow.module.ts
│  │  │  │          │
│  │  │  │          ├─models
│  │  │  │          │      index.ts
│  │  │  │          │      workflow.model.ts
│  │  │  │          │
│  │  │  │          ├─repositories
│  │  │  │          │      workflow.repository.ts
│  │  │  │          │
│  │  │  │          └─services
│  │  │  │                  approval.service.ts
│  │  │  │                  automation.service.ts
│  │  │  │                  custom-workflow.service.ts
│  │  │  │                  state-machine.service.ts
│  │  │  │                  template.service.ts
│  │  │  │
│  │  │  ├─repositories
│  │  │  │      blueprint-member.repository.ts
│  │  │  │      blueprint-module.repository.ts
│  │  │  │      blueprint.repository.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─services
│  │  │          blueprint-validation-schemas.ts
│  │  │          blueprint.service.ts
│  │  │          dependency-validator.service.ts
│  │  │          index.ts
│  │  │          validation.service.ts
│  │  │
│  │  ├─data-access
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─ai
│  │  │  │      ai.repository.ts
│  │  │  │      ai.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─repositories
│  │  │      │  AGENTS.md
│  │  │      │  index.ts
│  │  │      │  log-firestore.repository.ts
│  │  │      │  task-firestore.repository.ts
│  │  │      │
│  │  │      ├─base
│  │  │      │      firestore-base.repository.ts
│  │  │      │
│  │  │      └─shared
│  │  │              account.repository.ts
│  │  │              fcm-token.repository.ts
│  │  │              friend.repository.ts
│  │  │              notification-preferences.repository.ts
│  │  │              notification.repository.ts
│  │  │              organization-invitation.repository.ts
│  │  │              organization-member.repository.ts
│  │  │              organization.repository.ts
│  │  │              partner-member.repository.ts
│  │  │              partner.repository.ts
│  │  │              team-member.repository.ts
│  │  │              team.repository.ts
│  │  │
│  │  ├─domain
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─models
│  │  │  │      AGENTS.md
│  │  │  │      blueprint-config.model.ts
│  │  │  │      blueprint-module.model.ts
│  │  │  │      blueprint.model.ts
│  │  │  │      friend.model.ts
│  │  │  │      index.ts
│  │  │  │      notification-preferences.model.ts
│  │  │  │      notification.model.ts
│  │  │  │
│  │  │  ├─types
│  │  │  │  │  account.types.ts
│  │  │  │  │  AGENTS.md
│  │  │  │  │  index.ts
│  │  │  │  │
│  │  │  │  ├─blueprint
│  │  │  │  │      blueprint-status.enum.ts
│  │  │  │  │      blueprint.types.ts
│  │  │  │  │      owner-type.enum.ts
│  │  │  │  │
│  │  │  │  ├─configuration
│  │  │  │  │      configuration.types.ts
│  │  │  │  │
│  │  │  │  ├─events
│  │  │  │  │      event-type.enum.ts
│  │  │  │  │      event.types.ts
│  │  │  │  │
│  │  │  │  ├─log
│  │  │  │  │      index.ts
│  │  │  │  │      log-task.types.ts
│  │  │  │  │      log.types.ts
│  │  │  │  │
│  │  │  │  ├─module
│  │  │  │  │      module-state.enum.ts
│  │  │  │  │      module.types.ts
│  │  │  │  │
│  │  │  │  ├─permission
│  │  │  │  │      permission-level.enum.ts
│  │  │  │  │      permission.types.ts
│  │  │  │  │      role.enum.ts
│  │  │  │  │
│  │  │  │  ├─quality-control
│  │  │  │  │      index.ts
│  │  │  │  │      quality-control.types.ts
│  │  │  │  │
│  │  │  │  ├─storage
│  │  │  │  │      index.ts
│  │  │  │  │      storage.types.ts
│  │  │  │  │
│  │  │  │  ├─task
│  │  │  │  │      index.ts
│  │  │  │  │      task-quantity.types.ts
│  │  │  │  │      task-view.types.ts
│  │  │  │  │      task-wbs.types.ts
│  │  │  │  │      task.types.ts
│  │  │  │  │
│  │  │  │  └─workflow
│  │  │  │          index.ts
│  │  │  │          workflow.types.ts
│  │  │  │
│  │  │  └─utils
│  │  │          blueprint-validation.utils.ts
│  │  │          index.ts
│  │  │
│  │  ├─errors
│  │  │      AGENTS.md
│  │  │      blueprint-error.ts
│  │  │      index.ts
│  │  │      module-not-found-error.ts
│  │  │      permission-denied-error.ts
│  │  │      validation-error.ts
│  │  │
│  │  ├─facades
│  │  │  └─ai
│  │  │          ai.store.ts
│  │  │          index.ts
│  │  │
│  │  ├─i18n
│  │  │      i18n.service.ts
│  │  │
│  │  ├─infrastructure
│  │  │  │  index.ts
│  │  │  │
│  │  │  └─storage
│  │  │          firebase-storage.repository.ts
│  │  │          index.ts
│  │  │          storage.repository.ts
│  │  │
│  │  ├─net
│  │  │      AGENTS.md
│  │  │      default.interceptor.ts
│  │  │      helper.ts
│  │  │      index.ts
│  │  │      refresh-token.ts
│  │  │
│  │  ├─services
│  │  │  │  AGENTS.md
│  │  │  │  error-tracking.service.ts
│  │  │  │  firebase-analytics.service.ts
│  │  │  │  firebase-auth.service.ts
│  │  │  │  firebase.service.ts
│  │  │  │  friend.service.ts
│  │  │  │  notification-analytics.service.ts
│  │  │  │  performance-monitoring.service.ts
│  │  │  │  push-messaging.service.ts
│  │  │  │
│  │  │  ├─ai
│  │  │  │      ai.service.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─layout
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─logger
│  │  │          console-transport.ts
│  │  │          index.ts
│  │  │          log-transport.interface.ts
│  │  │          logger.service.ts
│  │  │
│  │  ├─startup
│  │  │      startup.service.ts
│  │  │
│  │  └─state
│  │      │  index.ts
│  │      │  README.md
│  │      │
│  │      └─stores
│  │              AGENTS.md
│  │              construction-log.store.ts
│  │              friend.store.ts
│  │              index.ts
│  │              log.store.ts
│  │              notification.store.ts
│  │              partner.store.ts
│  │              team.store.ts
│  │
│  ├─layout
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │
│  │  ├─basic
│  │  │  │  basic.component.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  └─widgets
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
│  │  │
│  │  ├─blank
│  │  │      blank.component.ts
│  │  │      README.md
│  │  │
│  │  └─passport
│  │          passport.component.less
│  │          passport.component.ts
│  │
│  ├─routes
│  │  │  AGENTS.md
│  │  │  routes.ts
│  │  │
│  │  ├─admin
│  │  │  └─monitoring
│  │  │          monitoring-dashboard.component.ts
│  │  │          routes.ts
│  │  │
│  │  ├─ai-assistant
│  │  │      ai-assistant.component.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  blueprint-designer.component.ts
│  │  │  │  blueprint-detail.component.ts
│  │  │  │  blueprint-list.component.ts
│  │  │  │  blueprint-modal.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      connection-layer.component.ts
│  │  │  │      index.ts
│  │  │  │      validation-alerts.component.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      container-dashboard.component.ts
│  │  │  │      event-bus-monitor.component.ts
│  │  │  │
│  │  │  └─modules
│  │  │      │  AGENTS.md
│  │  │      │  index.ts
│  │  │      │  README.md
│  │  │      │
│  │  │      ├─acceptance
│  │  │      │  │  acceptance-module-view.component.ts
│  │  │      │  │  acceptance.model.ts
│  │  │      │  │  acceptance.repository.ts
│  │  │      │  │  index.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─conclusion
│  │  │      │  │  │      acceptance-conclusion.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─preliminary
│  │  │      │  │  │      acceptance-preliminary.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─re-inspection
│  │  │      │  │  │      acceptance-re-inspection.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─request
│  │  │      │  │  │  │  acceptance-request.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          index.ts
│  │  │      │  │  │          request-list.component.ts
│  │  │      │  │  │          request-statistics.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─review
│  │  │      │  │          acceptance-review.component.ts
│  │  │      │  │          index.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              acceptance-status-badge.component.ts
│  │  │      │              index.ts
│  │  │      │
│  │  │      ├─agreement
│  │  │      │      agreement-module-view.component.ts
│  │  │      │      agreement.model.ts
│  │  │      │      agreement.repository.ts
│  │  │      │      agreement.service.ts
│  │  │      │      index.ts
│  │  │      │
│  │  │      ├─cloud
│  │  │      │  │  cloud-module-view-refactored.component.ts
│  │  │      │  │  cloud.model.ts
│  │  │      │  │  cloud.repository.ts
│  │  │      │  │  cloud.service.ts
│  │  │      │  │  index.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─file-details
│  │  │      │  │  │      file-details.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─file-list
│  │  │      │  │  │      file-list.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─folder-management
│  │  │      │  │  │  │  folder-tree.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          folder-name-input.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─statistics
│  │  │      │  │  │      cloud-statistics.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  └─upload
│  │  │      │  │          index.ts
│  │  │      │  │          upload-area.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─utils
│  │  │      │              file-utils.ts
│  │  │      │
│  │  │      ├─contract
│  │  │      │  │  contract-module-view.component.ts
│  │  │      │  │  contract-shell.component.ts
│  │  │      │  │  design.md
│  │  │      │  │  IMPLEMENTATION_GUIDE.md
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  routes.ts
│  │  │      │  │
│  │  │      │  ├─components
│  │  │      │  │      contract-detail.component.ts
│  │  │      │  │      contract-list.component.ts
│  │  │      │  │      contract-upload.component.ts
│  │  │      │  │      contract-wizard.component.ts
│  │  │      │  │
│  │  │      │  ├─data-access
│  │  │      │  │  ├─models
│  │  │      │  │  │      contract.model.ts
│  │  │      │  │  │
│  │  │      │  │  └─repositories
│  │  │      │  │          contract.repository.ts
│  │  │      │  │
│  │  │      │  ├─services
│  │  │      │  │      contract.facade.ts
│  │  │      │  │
│  │  │      │  ├─shared
│  │  │      │  │  └─types
│  │  │      │  │          contract.types.ts
│  │  │      │  │
│  │  │      │  ├─state
│  │  │      │  │      contract.store.ts
│  │  │      │  │
│  │  │      │  └─ui
│  │  │      │          contract-card.component.ts
│  │  │      │          contract-status-badge.component.ts
│  │  │      │
│  │  │      ├─diary
│  │  │      │  │  diary-module-view.component.ts
│  │  │      │  │  diary.model.ts
│  │  │      │  │  diary.repository.ts
│  │  │      │  │  diary.service.ts
│  │  │      │  │  index.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─create
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─detail
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─edit
│  │  │      │  │  │  │  diary-edit-modal.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          diary-form.component.ts
│  │  │      │  │  │          diary-photo-upload.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─list
│  │  │      │  │      │  diary-list.component.ts
│  │  │      │  │      │  index.ts
│  │  │      │  │      │
│  │  │      │  │      └─components
│  │  │      │  │              diary-filters.component.ts
│  │  │      │  │              diary-statistics.component.ts
│  │  │      │  │              diary-table.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              diary-status-badge.component.ts
│  │  │      │
│  │  │      ├─finance
│  │  │      │  │  finance-module-view.component.html
│  │  │      │  │  finance-module-view.component.ts
│  │  │      │  │  finance.model.ts
│  │  │      │  │  finance.repository.ts
│  │  │      │  │  finance.service.ts
│  │  │      │  │  index.ts
│  │  │      │  │  routes.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─approval-dialog
│  │  │      │  │  │      approval-dialog.component.html
│  │  │      │  │  │      approval-dialog.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─dashboard
│  │  │      │  │  │      finance-dashboard.component.html
│  │  │      │  │  │      finance-dashboard.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  └─invoice-list
│  │  │      │  │          index.ts
│  │  │      │  │          invoice-list.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │          index.ts
│  │  │      │
│  │  │      ├─issues
│  │  │      │  │  design.md
│  │  │      │  │  IMPLEMENTATION_GUIDE.md
│  │  │      │  │  index.ts
│  │  │      │  │  issue-lifecycle.service.ts
│  │  │      │  │  issue-management.service.ts
│  │  │      │  │  issues-module-view.component.ts
│  │  │      │  │  issues.model.ts
│  │  │      │  │  issues.repository.ts
│  │  │      │  │  README.md
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─issue-details
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-details.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─issue-form
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-form.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─issue-list
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-list.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─issue-statistics
│  │  │      │  │          index.ts
│  │  │      │  │          issue-statistics.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─utils
│  │  │      │              issue-formatters.ts
│  │  │      │
│  │  │      ├─log
│  │  │      │      index.ts
│  │  │      │      log-module-view.component.ts
│  │  │      │      log.model.ts
│  │  │      │      log.repository.ts
│  │  │      │      log.service.ts
│  │  │      │
│  │  │      ├─manager
│  │  │      │  │  index.ts
│  │  │      │  │  module-card.component.ts
│  │  │      │  │  module-config-form.component.ts
│  │  │      │  │  module-dependency-graph.component.ts
│  │  │      │  │  module-manager.component.ts
│  │  │      │  │  module-manager.routes.ts
│  │  │      │  │  module-manager.service.ts
│  │  │      │  │  module-status-badge.component.ts
│  │  │      │  │
│  │  │      │  └─components
│  │  │      │          module-card.component.ts
│  │  │      │          module-config-form.component.ts
│  │  │      │          module-dependency-graph.component.ts
│  │  │      │          module-status-badge.component.ts
│  │  │      │
│  │  │      ├─members
│  │  │      │  │  index.ts
│  │  │      │  │  members-module-view.component.ts
│  │  │      │  │  members.model.ts
│  │  │      │  │  members.repository.ts
│  │  │      │  │  members.service.ts
│  │  │      │  │  README.md
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─member-form
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      member-form-modal.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─member-list
│  │  │      │  │          index.ts
│  │  │      │  │          member-list.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │          index.ts
│  │  │      │
│  │  │      ├─qa
│  │  │      │  │  index.ts
│  │  │      │  │  qa-module-view.component.ts
│  │  │      │  │  qa.model.ts
│  │  │      │  │  qa.repository.ts
│  │  │      │  │  qa.service.ts
│  │  │      │  │
│  │  │      │  └─features
│  │  │      │      ├─qa-inspections
│  │  │      │      │      index.ts
│  │  │      │      │      qa-inspections.component.ts
│  │  │      │      │
│  │  │      │      ├─qa-standards
│  │  │      │      │      index.ts
│  │  │      │      │      qa-standards.component.ts
│  │  │      │      │
│  │  │      │      └─qa-stats
│  │  │      │              index.ts
│  │  │      │              qa-stats.component.ts
│  │  │      │
│  │  │      ├─safety
│  │  │      │      index.ts
│  │  │      │      safety-module-view.component.ts
│  │  │      │
│  │  │      ├─tasks
│  │  │      │  │  design.md
│  │  │      │  │  IMPLEMENTATION_GUIDE.md
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  routes.ts
│  │  │      │  │  tasks-module-view.component.ts
│  │  │      │  │  tasks-shell.component.ts
│  │  │      │  │
│  │  │      │  ├─components
│  │  │      │  │      tasks-list.component.ts
│  │  │      │  │      view-switcher.component.ts
│  │  │      │  │
│  │  │      │  ├─data-access
│  │  │      │  │  ├─models
│  │  │      │  │  │      task.model.ts
│  │  │      │  │  │
│  │  │      │  │  └─repositories
│  │  │      │  │          task.repository.ts
│  │  │      │  │
│  │  │      │  ├─services
│  │  │      │  │      tasks.facade.ts
│  │  │      │  │
│  │  │      │  ├─state
│  │  │      │  │      task-view.store.ts
│  │  │      │  │      task.store.ts
│  │  │      │  │
│  │  │      │  └─views
│  │  │      │      └─tree-list
│  │  │      │              task-tree-list-view.component.ts
│  │  │      │
│  │  │      ├─warranty
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  routes.ts
│  │  │      │  │  warranty-module-view.component.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─defects
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │  warranty-defects.component.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          defect-filters.component.ts
│  │  │      │  │  │          defect-statistics.component.ts
│  │  │      │  │  │          defect-table.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─detail
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │  warranty-detail-drawer.component.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          basic-info-tab.component.ts
│  │  │      │  │  │          defects-tab.component.ts
│  │  │      │  │  │          repairs-tab.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─list
│  │  │      │  │      │  index.ts
│  │  │      │  │      │  warranty-list.component.ts
│  │  │      │  │      │
│  │  │      │  │      └─components
│  │  │      │  │              warranty-filters.component.ts
│  │  │      │  │              warranty-statistics.component.ts
│  │  │      │  │              warranty-table.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              warranty-status-badge.component.ts
│  │  │      │
│  │  │      ├─weather
│  │  │      │  │  IMPLEMENTATION_GUIDE.md
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  weather-module-view.component.ts
│  │  │      │  │  weather.repository.ts
│  │  │      │  │  weather.service.ts
│  │  │      │  │  WEATHER_MODULE_DESIGN.md
│  │  │      │  │
│  │  │      │  ├─core
│  │  │      │  │  ├─config
│  │  │      │  │  │      api.config.ts
│  │  │      │  │  │      constants.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─models
│  │  │      │  │  │      api-response.model.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      weather.model.ts
│  │  │      │  │  │
│  │  │      │  │  └─services
│  │  │      │  │          cache.service.ts
│  │  │      │  │          index.ts
│  │  │      │  │          weather-api.service.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─construction-suitability
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      suitability-card.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─forecast-display
│  │  │      │  │  │      forecast-display.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─location-selector
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      location-selector.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─weather-alerts
│  │  │      │  │          index.ts
│  │  │      │  │          weather-alerts.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      └─utils
│  │  │      │              calculators.ts
│  │  │      │              formatters.ts
│  │  │      │              icons.ts
│  │  │      │              index.ts
│  │  │      │
│  │  │      └─workflow
│  │  │              index.ts
│  │  │              workflow-module-view.component.ts
│  │  │
│  │  ├─exception
│  │  │      AGENTS.md
│  │  │      exception.component.ts
│  │  │      routes.ts
│  │  │      trigger.component.ts
│  │  │
│  │  ├─explore
│  │  │  │  explore-page.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      filter-panel.component.ts
│  │  │  │      index.ts
│  │  │  │      result-grid.component.ts
│  │  │  │      search-bar.component.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      search-result.model.ts
│  │  │  │
│  │  │  └─services
│  │  │          explore-search.facade.ts
│  │  │          index.ts
│  │  │          search-cache.service.ts
│  │  │
│  │  ├─organization
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      organization-members.component.ts
│  │  │  │
│  │  │  ├─partners
│  │  │  │      create-partner-modal.component.ts
│  │  │  │      edit-partner-modal.component.ts
│  │  │  │      organization-partners.component.ts
│  │  │  │
│  │  │  ├─repository
│  │  │  │      organization-repository.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      organization-schedule.component.ts
│  │  │  │
│  │  │  ├─settings
│  │  │  │      organization-settings.component.ts
│  │  │  │
│  │  │  └─teams
│  │  │          organization-teams.component.ts
│  │  │          team-modal.component.ts
│  │  │
│  │  ├─partner
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      partner-member-modal.component.ts
│  │  │  │      partner-members.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      partner-schedule.component.ts
│  │  │  │
│  │  │  └─settings
│  │  │          partner-settings.component.ts
│  │  │
│  │  ├─passport
│  │  │  │  AGENTS.md
│  │  │  │  callback.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─lock
│  │  │  │      lock.component.html
│  │  │  │      lock.component.less
│  │  │  │      lock.component.ts
│  │  │  │
│  │  │  ├─login
│  │  │  │      login.component.html
│  │  │  │      login.component.less
│  │  │  │      login.component.ts
│  │  │  │
│  │  │  ├─register
│  │  │  │      register.component.html
│  │  │  │      register.component.less
│  │  │  │      register.component.ts
│  │  │  │
│  │  │  └─register-result
│  │  │          register-result.component.html
│  │  │          register-result.component.ts
│  │  │
│  │  ├─settings
│  │  │  └─notification-settings
│  │  │          notification-settings.component.ts
│  │  │
│  │  ├─social
│  │  │  │  AGENTS.md
│  │  │  │
│  │  │  ├─components
│  │  │  │      friend-card.component.ts
│  │  │  │
│  │  │  ├─pages
│  │  │  │      friends.page.ts
│  │  │  │
│  │  │  └─routes
│  │  │          friends.routes.ts
│  │  │
│  │  ├─team
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      team-member-modal.component.ts
│  │  │  │      team-members.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      team-schedule.component.ts
│  │  │  │
│  │  │  └─settings
│  │  │          team-settings.component.ts
│  │  │
│  │  └─user
│  │      │  AGENTS.md
│  │      │  routes.ts
│  │      │
│  │      ├─settings
│  │      │      settings.component.ts
│  │      │
│  │      └─todo
│  │              user-todo.component.ts
│  │
│  └─shared
│      │  AGENTS.md
│      │  index.ts
│      │  README.md
│      │  shared-delon.module.ts
│      │  shared-imports.ts
│      │  shared-zorro.module.ts
│      │
│      ├─cell-widget
│      │      index.ts
│      │
│      ├─components
│      │  ├─breadcrumb
│      │  │      breadcrumb.component.ts
│      │  │
│      │  ├─create-organization
│      │  │      create-organization.component.ts
│      │  │
│      │  ├─create-team-modal
│      │  │      create-team-modal.component.ts
│      │  │
│      │  ├─edit-team-modal
│      │  │      edit-team-modal.component.ts
│      │  │
│      │  ├─team-detail-drawer
│      │  │      team-detail-drawer.component.html
│      │  │      team-detail-drawer.component.ts
│      │  │
│      │  └─types
│      │          firebase-functions.types.ts
│      │
│      ├─json-schema
│      │  │  index.ts
│      │  │  README.md
│      │  │
│      │  └─test
│      │          test.widget.ts
│      │
│      ├─services
│      │  │  AGENTS.md
│      │  │  breadcrumb.service.ts
│      │  │  index.ts
│      │  │  menu-management.service.ts
│      │  │  workspace-context.service.ts
│      │  │
│      │  └─permission
│      │          permission.service.ts
│      │
│      ├─st-widget
│      │      index.ts
│      │      README.md
│      │
│      └─utils
│              async-state.ts
│              index.ts
│
├─assets
│  │  color.less
│  │  logo-color.svg
│  │  logo-full.svg
│  │  logo.svg
│  │  style.compact.css
│  │  style.dark.css
│  │  zorro.svg
│  │
│  └─tmp
│      │  app-data.json
│      │  demo.docx
│      │  demo.pdf
│      │  demo.pptx
│      │  demo.xlsx
│      │  demo.zip
│      │  on-boarding.json
│      │
│      ├─i18n
│      │      en-US.json
│      │      zh-CN.json
│      │      zh-TW.json
│      │
│      └─img
│              avatar.jpg
│
├─environments
│      AGENTS.md
│      environment.prod.ts
│      environment.ts
│
└─styles
        AGENTS.md
        index.less
        theme.less