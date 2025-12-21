---
Title + Scope

Scope: Global styles and theming guidance for the application.

---

Purpose / Responsibility

Defines responsibilities for managing global styles and themes.

---

Hard Rules / Constraints

Hard Rules:
- NO UI components
- NO feature-specific logic
- NO direct Firebase access outside adapters

---

Allowed / Expected Content

Allowed:
- Global style variables
- Theming tokens
- Utility style sheets

---

Structure / Organization

Structure:
- themes/
- variables/
- mixins/

---

Integration / Dependencies

Integration:
- Angular build tooling
- No runtime dependencies

---

Best Practices / Guidelines

Guidelines:
- Keep styles global and generic
- Avoid business-specific selectors

---

Related Docs / References

- ../AGENTS.md

---

Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Styles – AGENTS.md

This document defines **rules and boundaries** for global styles in GigHub.  
It governs **what may and may not live in `src/styles/`**.

---

## 1. Purpose

The `styles/` directory contains **global, cross-feature styles only**.

It provides:
- Theme variables (Azure Dragon)
- Global UI adjustments
- Reusable utility classes
- Global animations

It must **not** contain business or feature-specific styling.

---

## 2. Directory Structure

src/styles/ ├── AGENTS.md        # This file ├── index.less       # Global style entry └── theme.less       # Theme variables

---

## 3. File Responsibilities

### index.less

**Rules**
- MUST be the single global style entry
- MUST import `theme.less`
- MAY include:
  - ng-zorro global overrides
  - shared utility classes
  - global animations
  - accessibility improvements
- MUST NOT include feature- or page-specific styles

---

### theme.less

**Rules**
- MUST define Azure Dragon theme variables
- MUST use Less variables (no hard-coded values)
- MUST integrate with ng-zorro-antd theme tokens
- SHOULD remain stable and backward-compatible

---

## 4. Style Rules

### Utility Classes

**Rules**
- Utilities MUST be generic and reusable
- Utilities MAY include:
  - colors
  - spacing
  - layout helpers
- `!important` is allowed **only when unavoidable**

---

### Component Enhancements

**Rules**
- Only global enhancements to ng-zorro components are allowed
- Must follow Ant Design guidelines
- Must remain responsive and accessible

---

### Animations

**Rules**
- Animations MUST be lightweight
- Animations MUST respect performance constraints
- Utility animation classes are allowed

---

## 5. Theme Integration

**Rules**
- Must rely on Less variable system
- Must remain consistent across components
- Theme switching is optional but supported

---

## 6. Global Constraints

**Forbidden**
- Business or domain styling
- Feature- or page-specific selectors
- Inline styles
- Excessive use of `!important`

**Required**
- Modular structure
- Reusability
- Accessibility compliance
- Performance awareness

---

## 7. Style Placement Rules

- Global styles → `src/styles/`
- Component styles → component-scoped styles
- Shared UI helpers → `src/app/shared/`

---

## 8. Related Documentation

- **Application Root**: `src/app/AGENTS.md`
- **Layout Styles**: `src/app/layout/AGENTS.md`

---

**Version**: 1.1.0  
**Last Updated**: 2025-12-21  
**Scope**: `src/styles/`  
**Audience**: GitHub Copilot Agent / AI Coding Agents


---

