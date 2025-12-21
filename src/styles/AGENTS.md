# Styles Agent Guide

## Title + Scope
Scope: Global styles, theming, and style utilities under src/styles.

## Purpose / Responsibility
Describe how agents should manage global SCSS, theming tokens, and shared style utilities without introducing business logic.

## Hard Rules / Constraints
- NO UI components or feature-specific styling here.
- NO direct Firebase access (styles only).
- Maintain design system consistency and avoid inline secrets or data.

## Allowed / Expected Content
- Global variables, mixins, themes, and shared style utilities.
- Reset/normalize styles and typography tokens.
- Documentation for theming strategy.

## Structure / Organization
- SCSS partials grouped by purpose (variables, mixins, themes, utilities).
- Entry points for global styles consumed by Angular builds.

## Integration / Dependencies
- Compatible with ng-zorro/ng-alain theming; imported via angular.json configuration.
- Do not import application code; keep styles decoupled.

## Best Practices / Guidelines
- Ensure WCAG-compliant contrast, support responsive design, and avoid duplication.
- Prefer CSS custom properties/SCSS variables for theme tokens.

## Related Docs / References
- ../app/AGENTS.md
- ../shared/AGENTS.md
- docs/architecture/ and design system notes

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

---
Title + Scope

Scope: Global styles and theming guidance for the application.

---

Purpose / Responsibility

Defines responsibilities for managing global styles and themes. 這裡位於 UI 層之外，屬於全域樣式與主題管理層（styles 層）。

---

Hard Rules / Constraints

Hard Rules:
- NO UI components
- NO feature-specific logic
- NO direct Firebase access outside adapters

---

Allowed / Expected Content

Allowed:
- Singleton services
- Global interceptors
- Cross-cutting concerns

（註：此處只列出允許放於 src/styles/ 相關的跨切關注項範圍，實際檔案仍應遵守「NO UI components」等硬性限制。）

---

Structure / Organization

Structure:
- services/
- guards/
- interceptors/

（說明：以業務能力劃分結構，避免在 styles 目錄中散置非全域資源。）

---

Integration / Dependencies

Integration:
- Angular DI only
- Uses @angular/fire adapters
- No feature-to-feature imports

---

Best Practices / Guidelines

Guidelines:
- Prefer composition over inheritance
- Keep services stateless where possible

---

Related Docs / References

Related:
- ../shared/AGENTS.md
- ../environments/AGENTS.md

---

Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Styles – AGENTS.md

This document defines rules and boundaries for global styles in GigHub and governs what may and may not live in `src/styles/`.

---

Notes and additional guidance

- index.less MUST be the single global style entry and MUST import `theme.less`.
- theme.less MUST define theme variables using Less variables and integrate with ng-zorro-antd tokens.
- Utilities MUST be generic and reusable; avoid business- or feature-specific selectors.
- Animations MUST be lightweight and performance-friendly.
- Follow accessibility best practices for any global style changes.

---

Changelog

- 1.1.0 — Reordered document to strict 9-section format and clarified allowed content and integrations (2025-12-21).

---

**Last Updated**: 2025-12-21

**Scope**: `src/styles/`

**Audience**: GitHub Copilot Agent / AI Coding Agents

