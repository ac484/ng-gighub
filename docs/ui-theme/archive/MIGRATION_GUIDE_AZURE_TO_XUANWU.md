# Migration Guide: Azure Dragon → Xuanwu Theme
# 遷移指南：青龍主題 → 玄武主題

## 📋 Overview

This guide documents the theme transformation from Azure Dragon (青龍/East/Wood) to Xuanwu (玄武/North/Water), completed on **2025-12-13**.

## 🎨 Color Changes

### Primary Color

| Theme | Color Name | Hex Code | RGB | Usage |
|-------|-----------|----------|-----|-------|
| **Old** (Azure Dragon) | Azure Blue | `#0EA5E9` | rgb(14, 165, 233) | Primary brand color |
| **New** (Xuanwu) | Xuanwu Navy | `#1E3A8A` | rgb(30, 58, 138) | Primary brand color |

### Success Color

| Theme | Color Name | Hex Code | RGB | Usage |
|-------|-----------|----------|-----|-------|
| **Old** (Azure Dragon) | Jade Green | `#14B8A6` | rgb(20, 184, 166) | Success states |
| **New** (Xuanwu) | Deep Teal | `#0D9488` | rgb(13, 148, 136) | Success states |

### Info Color

| Theme | Color Name | Hex Code | RGB | Usage |
|-------|-----------|----------|-----|-------|
| **Old** (Azure Dragon) | Cyan | `#06B6D4` | rgb(6, 182, 212) | Info states |
| **New** (Xuanwu) | Steel Blue | `#64748B` | rgb(100, 116, 139) | Info states |

## 🌈 Gradient Changes

### Before (Azure Dragon)

```less
// Dragon Soaring (龍躍雲端)
@gradient-dragon-soaring: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);

// Azure Sky & Sea (碧海青天)
@gradient-azure-sky: linear-gradient(180deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%);

// Dragon Scales (青龍鱗片)
@gradient-dragon-scales: linear-gradient(45deg, #0C83BA 0%, #0D9488 50%, #0EA5E9 100%);

// Dawn Light (晨曦微光)
@gradient-dawn-light: linear-gradient(135deg, #E6F7FF 0%, #E0F7FA 50%, #E6FFF9 100%);

// Deep Mystery (深海神秘)
@gradient-deep-mystery: linear-gradient(135deg, #084C5C 0%, #0A7C6C 100%);
```

### After (Xuanwu)

```less
// Northern Waters (北方之水)
@gradient-northern-waters: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);

// Tortoise Shell (龜甲紋理)
@gradient-tortoise-shell: linear-gradient(45deg, #172554 0%, #1E3A8A 50%, #64748B 100%);

// Winter Night (冬夜深沉)
@gradient-winter-night: linear-gradient(180deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%);

// Silver Frost (銀霜微光)
@gradient-silver-frost: linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 50%, #CBD5E1 100%);

// Deep Mystery (深淵神秘)
@gradient-deep-mystery: linear-gradient(135deg, #172554 0%, #115E59 100%);
```

## 📝 Code Changes Required

### 1. Update `app.config.ts`

```typescript
// Before (Azure Dragon)
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#0EA5E9',
    successColor: '#14B8A6',
    infoColor: '#06B6D4'
  }
};

// After (Xuanwu)
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E3A8A',
    successColor: '#0D9488',
    infoColor: '#64748B'
  }
};
```

### 2. Update `theme.less`

Replace all Azure Dragon color variables with Xuanwu equivalents:

```less
// Before
@azure-6: #0EA5E9;
@jade-4: #14B8A6;
@cyan-3: #06B6D4;

// After
@xuanwu-6: #1E3A8A;
@teal-4: #0D9488;
@steel-3: #64748B;
```

### 3. Update Custom Components

Search and replace in your custom styles:

```bash
# Find Azure Dragon references
grep -r "#0EA5E9" src/
grep -r "@azure-" src/
grep -r "azure-dragon" src/

# Find gradient references
grep -r "gradient-dragon" src/
grep -r "gradient-azure" src/
```

Replace with Xuanwu equivalents:
- `@azure-*` → `@xuanwu-*`
- `@jade-*` → `@teal-*`
- `@cyan-*` → `@steel-*`
- `gradient-dragon-*` → `gradient-northern-waters` or `gradient-tortoise-shell`
- `gradient-azure-*` → `gradient-winter-night`

### 4. Update HTML/Templates

```html
<!-- Before -->
<div class="azure-card">...</div>
<div class="dragon-gradient">...</div>

<!-- After -->
<div class="xuanwu-card">...</div>
<div class="northern-waters-gradient">...</div>
```

## 🔍 Variable Mapping Reference

### LESS Variables

| Old (Azure Dragon) | New (Xuanwu) | Notes |
|-------------------|--------------|-------|
| `@azure-1` to `@azure-10` | `@xuanwu-1` to `@xuanwu-10` | 10-level primary palette |
| `@jade-1` to `@jade-6` | `@teal-1` to `@teal-6` | 6-level success palette |
| `@cyan-1` to `@cyan-5` | `@steel-1` to `@steel-5` | 5-level info palette |
| `@gradient-dragon-soaring` | `@gradient-northern-waters` | Primary gradient |
| `@gradient-azure-sky` | `@gradient-winter-night` | Vertical gradient |
| `@gradient-dragon-scales` | `@gradient-tortoise-shell` | Decorative gradient |
| `@gradient-dawn-light` | `@gradient-silver-frost` | Subtle gradient |
| `@shadow-azure-*` | `@shadow-xuanwu-*` | Shadow system |
| `@glow-azure` | `@glow-xuanwu` | Glow effects |
| `@glow-jade` | `@glow-teal` | Success glow |

### CSS Classes

| Old Class | New Class |
|-----------|-----------|
| `.azure-card` | `.xuanwu-card` |
| `.azure-bg-gradient` | `.xuanwu-bg-gradient` |
| `.dragon-effect` | `.tortoise-effect` |
| `.hover-border-azure` | `.hover-border-xuanwu` |

## 🧪 Testing Checklist

After migration, test:

- [ ] All buttons render with new primary color
- [ ] Success alerts use Deep Teal (#0D9488)
- [ ] Info badges use Steel Blue (#64748B)
- [ ] Gradients display correctly
- [ ] Hover states work as expected
- [ ] Dark mode (if applicable) uses new colors
- [ ] No console errors related to missing variables
- [ ] Build completes successfully
- [ ] Linting passes

## 🚀 Deployment Steps

1. **Backup**: Archive old theme files (already done in `docs/ui-theme/archive/`)
2. **Update**: Apply code changes listed above
3. **Build**: Run `yarn build` and verify no errors
4. **Test**: Run full test suite
5. **Review**: Visual QA across all pages
6. **Deploy**: Standard deployment process

## 📚 Resources

### New Documentation
- [Xuanwu Theme Reference](./reference/xuanwu-theme.md)
- [Xuanwu Theme (繁體中文)](./reference/xuanwu-theme-zh-TW.md)
- [Color System Reference](./reference/COLOR_SYSTEM_REFERENCE.md)
- [Theme Guide](./THEME_GUIDE.md)

### Archived Documentation
- [Azure Dragon Theme](./archive/azure-dragon-theme.md)
- [Azure Dragon (繁體中文)](./archive/azure-dragon-theme-zh-TW.md)
- [Azure Dragon Examples](./archive/azure-dragon-theme-examples.md)

## 🎯 Symbolism Change

### Azure Dragon (青龍) - Old Theme
- **Element**: Wood (木)
- **Direction**: East (東)
- **Season**: Spring (春)
- **Colors**: Sky blue, jade green, cyan
- **Symbolism**: Growth, energy, dynamism, sky and water

### Xuanwu (玄武) - New Theme
- **Element**: Water (水)
- **Direction**: North (北)
- **Season**: Winter (冬)
- **Colors**: Deep navy, teal, steel blue, silver
- **Symbolism**: Stability, wisdom, endurance, depth, protection

## ❓ FAQ

### Why change from Azure Dragon to Xuanwu?

The transformation aligns with project evolution toward stability, professionalism, and depth. Xuanwu's symbolism better represents enterprise-level construction management.

### Will this break existing code?

Minimal breaking changes if you follow the migration guide. Most changes are cosmetic (colors).

### Do I need to update all custom components?

Only if they hardcode Azure Dragon colors. Components using theme variables automatically inherit new colors.

### What about third-party libraries?

No changes needed. ng-zorro-antd and ng-alain automatically adapt to new theme configuration.

## 📞 Support

For migration issues:
1. Check this guide first
2. Review [THEME_GUIDE.md](./THEME_GUIDE.md)
3. Search archived Azure Dragon documentation
4. Contact development team

---

**Migration Date**: 2025-12-13  
**Previous Theme**: Azure Dragon (青龍) v1.1.0  
**Current Theme**: Xuanwu (玄武) v2.0.0  
**Status**: ✅ Complete
