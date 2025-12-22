│  AGENTS.md
│  index.ts
│  README.md
│  start-page.guard.ts
│
├─blueprint
│  │  AGENTS.md
│  │  index.ts
│  │
│  ├─config
│  │      blueprint-config.interface.ts
│  │      index.ts
│  │
│  ├─container
│  │      blueprint-container.interface.ts
│  │      blueprint-container.ts
│  │      index.ts
│  │      lifecycle-manager.interface.ts
│  │      lifecycle-manager.ts
│  │      module-registry.interface.ts
│  │      module-registry.ts
│  │      resource-provider.interface.ts
│  │      resource-provider.ts
│  │
│  ├─context
│  │      execution-context.interface.ts
│  │      index.ts
│  │      shared-context.ts
│  │      tenant-info.interface.ts
│  │
│  ├─events
│  │  │  enhanced-event-bus.service.ts
│  │  │  event-bus.interface.ts
│  │  │  event-bus.ts
│  │  │  event-types.ts
│  │  │  index.ts
│  │  │
│  │  ├─models
│  │  │      blueprint-event.model.ts
│  │  │      event-log-entry.model.ts
│  │  │      event-priority.enum.ts
│  │  │      index.ts
│  │  │
│  │  └─types
│  │          index.ts
│  │          system-event-type.enum.ts
│  │
│  ├─models
│  │      index.ts
│  │      module-connection.interface.ts
│  │
│  ├─modules
│  │  │  index.ts
│  │  │  module-status.enum.ts
│  │  │  module.interface.ts
│  │  │
│  │  └─implementations
│  │      │  index.ts
│  │      │
│  │      ├─audit-logs
│  │      │  │  audit-logs.module.ts
│  │      │  │  index.ts
│  │      │  │  module.metadata.ts
│  │      │  │  README.md
│  │      │  │
│  │      │  ├─components
│  │      │  │      audit-logs.component.ts
│  │      │  │
│  │      │  ├─config
│  │      │  │      audit-logs.config.ts
│  │      │  │
│  │      │  ├─exports
│  │      │  │      audit-logs-api.exports.ts
│  │      │  │
│  │      │  ├─models
│  │      │  │      audit-log.model.ts
│  │      │  │      audit-log.types.ts
│  │      │  │
│  │      │  ├─repositories
│  │      │  │      audit-log.repository.ts
│  │      │  │
│  │      │  └─services
│  │      │          audit-logs.service.ts
│  │      │
│  │      ├─finance
│  │      │  │  finance.module.ts
│  │      │  │  index.ts
│  │      │  │  module.metadata.ts
│  │      │  │  README.md
│  │      │  │
│  │      │  ├─components
│  │      │  │      budget-overview.component.ts
│  │      │  │      finance-dashboard.component.ts
│  │      │  │      index.ts
│  │      │  │      invoice-list.component.ts
│  │      │  │
│  │      │  ├─models
│  │      │  │      budget.model.ts
│  │      │  │      finance.model.ts
│  │      │  │      financial-summary.model.ts
│  │      │  │      index.ts
│  │      │  │      invoice-service.interface.ts
│  │      │  │      invoice-status-machine.ts
│  │      │  │      invoice.model.ts
│  │      │  │      ledger.model.ts
│  │      │  │
│  │      │  ├─repositories
│  │      │  │      budget.repository.ts
│  │      │  │      finance.repository.ts
│  │      │  │      ledger.repository.ts
│  │      │  │
│  │      │  └─services
│  │      │          budget.service.ts
│  │      │          cost-management.service.ts
│  │      │          financial-report.service.ts
│  │      │          invoice-approval.service.ts
│  │      │          invoice-generation.service.ts
│  │      │          invoice.service.ts
│  │      │          ledger.service.ts
│  │      │          payment-approval.service.ts
│  │      │          payment-generation.service.ts
│  │      │          payment-status-tracking.service.ts
│  │      │          payment.service.ts
│  │      │
│  │      ├─safety
│  │      │  │  index.ts
│  │      │  │  module.metadata.ts
│  │      │  │  README.md
│  │      │  │  safety.module.ts
│  │      │  │
│  │      │  ├─models
│  │      │  │      index.ts
│  │      │  │      safety-inspection.model.ts
│  │      │  │
│  │      │  ├─repositories
│  │      │  │      safety.repository.ts
│  │      │  │
│  │      │  └─services
│  │      │          incident-report.service.ts
│  │      │          risk-assessment.service.ts
│  │      │          safety-inspection.service.ts
│  │      │          safety-training.service.ts
│  │      │
│  │      ├─warranty
│  │      │  │  index.ts
│  │      │  │  module.metadata.ts
│  │      │  │  README.md
│  │      │  │  warranty.module.ts
│  │      │  │
│  │      │  ├─config
│  │      │  │      warranty.config.ts
│  │      │  │
│  │      │  ├─exports
│  │      │  │      warranty.api.ts
│  │      │  │
│  │      │  ├─models
│  │      │  │      index.ts
│  │      │  │      warranty-defect.model.ts
│  │      │  │      warranty-repair.model.ts
│  │      │  │      warranty-status-machine.ts
│  │      │  │      warranty.model.ts
│  │      │  │
│  │      │  ├─repositories
│  │      │  │      index.ts
│  │      │  │      warranty-defect.repository.ts
│  │      │  │      warranty-repair.repository.ts
│  │      │  │      warranty.repository.ts
│  │      │  │
│  │      │  └─services
│  │      │          index.ts
│  │      │          warranty-defect.service.ts
│  │      │          warranty-event-handlers.ts
│  │      │          warranty-period.service.ts
│  │      │          warranty-repair.service.ts
│  │      │
│  │      └─workflow
│  │          │  index.ts
│  │          │  module.metadata.ts
│  │          │  README.md
│  │          │  workflow.module.ts
│  │          │
│  │          ├─models
│  │          │      index.ts
│  │          │      workflow.model.ts
│  │          │
│  │          ├─repositories
│  │          │      workflow.repository.ts
│  │          │
│  │          └─services
│  │                  approval.service.ts
│  │                  automation.service.ts
│  │                  custom-workflow.service.ts
│  │                  state-machine.service.ts
│  │                  template.service.ts
│  │
│  ├─repositories
│  │      blueprint-member.repository.ts
│  │      blueprint-module.repository.ts
│  │      blueprint.repository.ts
│  │      index.ts
│  │
│  └─services
│          blueprint-validation-schemas.ts
│          blueprint.service.ts
│          dependency-validator.service.ts
│          index.ts
│          validation.service.ts
│
├─data-access
│  │  index.ts
│  │  README.md
│  │
│  ├─ai
│  │      ai.repository.ts
│  │      ai.types.ts
│  │      index.ts
│  │
│  └─repositories
│      │  AGENTS.md
│      │  index.ts
│      │  log-firestore.repository.ts
│      │  task-firestore.repository.ts
│      │
│      ├─base
│      │      firestore-base.repository.ts
│      │
│      └─shared
│              account.repository.ts
│              fcm-token.repository.ts
│              friend.repository.ts
│              notification-preferences.repository.ts
│              notification.repository.ts
│              organization-invitation.repository.ts
│              organization-member.repository.ts
│              organization.repository.ts
│              partner-member.repository.ts
│              partner.repository.ts
│              team-member.repository.ts
│              team.repository.ts
│
├─domain
│  │  index.ts
│  │  README.md
│  │
│  ├─models
│  │      AGENTS.md
│  │      blueprint-config.model.ts
│  │      blueprint-module.model.ts
│  │      blueprint.model.ts
│  │      friend.model.ts
│  │      index.ts
│  │      notification-preferences.model.ts
│  │      notification.model.ts
│  │
│  ├─types
│  │  │  account.types.ts
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │
│  │  ├─blueprint
│  │  │      blueprint-status.enum.ts
│  │  │      blueprint.types.ts
│  │  │      owner-type.enum.ts
│  │  │
│  │  ├─configuration
│  │  │      configuration.types.ts
│  │  │
│  │  ├─events
│  │  │      event-type.enum.ts
│  │  │      event.types.ts
│  │  │
│  │  ├─log
│  │  │      index.ts
│  │  │      log-task.types.ts
│  │  │      log.types.ts
│  │  │
│  │  ├─module
│  │  │      module-state.enum.ts
│  │  │      module.types.ts
│  │  │
│  │  ├─permission
│  │  │      permission-level.enum.ts
│  │  │      permission.types.ts
│  │  │      role.enum.ts
│  │  │
│  │  ├─quality-control
│  │  │      index.ts
│  │  │      quality-control.types.ts
│  │  │
│  │  ├─storage
│  │  │      index.ts
│  │  │      storage.types.ts
│  │  │
│  │  ├─task
│  │  │      index.ts
│  │  │      task-quantity.types.ts
│  │  │      task-view.types.ts
│  │  │      task-wbs.types.ts
│  │  │      task.types.ts
│  │  │
│  │  └─workflow
│  │          index.ts
│  │          workflow.types.ts
│  │
│  └─utils
│          blueprint-validation.utils.ts
│          index.ts
│
├─errors
│      AGENTS.md
│      blueprint-error.ts
│      index.ts
│      module-not-found-error.ts
│      permission-denied-error.ts
│      validation-error.ts
│
├─facades
│  └─ai
│          ai.store.ts
│          index.ts
│
├─i18n
│      i18n.service.ts
│
├─infrastructure
│  │  index.ts
│  │
│  └─storage
│          firebase-storage.repository.ts
│          index.ts
│          storage.repository.ts
│
├─net
│      AGENTS.md
│      default.interceptor.ts
│      helper.ts
│      index.ts
│      refresh-token.ts
│
├─services
│  │  AGENTS.md
│  │  error-tracking.service.ts
│  │  firebase-analytics.service.ts
│  │  firebase-auth.service.ts
│  │  firebase.service.ts
│  │  friend.service.ts
│  │  notification-analytics.service.ts
│  │  performance-monitoring.service.ts
│  │  push-messaging.service.ts
│  │
│  ├─ai
│  │      ai.service.ts
│  │      index.ts
│  │
│  ├─layout
│  │      index.ts
│  │
│  └─logger
│          console-transport.ts
│          index.ts
│          log-transport.interface.ts
│          logger.service.ts
│
├─startup
│      startup.service.ts
│
├─state
│  │  index.ts
│  │  README.md
│  │
│  └─stores
│          AGENTS.md
│          construction-log.store.ts
│          friend.store.ts
│          index.ts
│          log.store.ts
│          notification.store.ts
│          partner.store.ts
│          team.store.ts

