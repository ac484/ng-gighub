# Xuanwu Theme (Black Tortoise)

Minimal, gradient-first styling for GigHub built on the @delon/theme **dark** baseline.

## Start Here
- **[THEME_GUIDE.md](./THEME_GUIDE.md)** — single source of truth
- **Reference**:  
  - [xuanwu-theme.md](./reference/xuanwu-theme.md) / [xuanwu-theme-zh-TW.md](./reference/xuanwu-theme-zh-TW.md)  
  - [COLOR_SYSTEM_REFERENCE.md](./reference/COLOR_SYSTEM_REFERENCE.md)  
  - [VERSION_COMPATIBILITY.md](./reference/VERSION_COMPATIBILITY.md)
- **Testing**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

## What’s Legacy
Historical and migration notes live in `archive/` (e.g., Black Tortoise integration, visual references, preloader, optimization, and Azure→Xuanwu migration guides). Keep them for context; they’re not required for daily work.

## Implementation Touchpoints
- `src/styles/theme.less` — minimal tokens + gradients aligned to dark theme
- `src/styles/index.less` — lightweight surface, header, and control polish
- `src/styles.less` — imports only

Use the palette + gradients from the reference files; prefer removals over new overrides.
