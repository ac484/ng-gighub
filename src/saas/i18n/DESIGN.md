# i18n — DESIGN

Purpose
- Provide localization utilities and message bundles for SaaS UI components.

Public API
- `I18nFacade.translate(key: string, params?: Record<string, unknown>): string`

Data Models
- Message bundle shape and fallback rules.

Accessibility
- Ensure translated strings include accessible labels where needed.

TODO
- Add message bundles and a simple facade that reads locale from signals.
