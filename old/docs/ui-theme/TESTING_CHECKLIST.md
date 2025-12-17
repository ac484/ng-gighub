# Black Tortoise Theme - UI Testing Checklist

## Visual Testing Guide

### 🔵 Buttons

#### Test Cases
- [ ] **Primary Button**
  - Hover: Gradient should transition from tortoise-shield to stone-depths
  - Hover: Should lift 1px with shadow enhancement
  - Active: Should reset to original position
  - Focus: Should show focus ring with Obsidian color

- [ ] **Default Button**
  - Hover: Should show Obsidian-6 color with Obsidian-1 background
  - Focus: Same as hover state

- [ ] **Dashed Button**
  - Hover: Should show Obsidian-6 color with faded Obsidian-1 background

- [ ] **Text Button**
  - Hover: Should show Obsidian-5 color with faded background

- [ ] **Link Button**
  - Hover: Text color should change to Obsidian-5

### 🔳 Cards

#### Test Cases
- [ ] **Tortoise Card**
  - Hover: Should lift 2px
  - Hover: Shadow should intensify from sm to lg
  - Hover: Border should appear in Obsidian-6 color (subtle)
  - Transition: All effects should happen smoothly together

- [ ] **Gradient Card**
  - Same hover effects as Tortoise Card

- [ ] **Featured Card**
  - Verify gradient background persists during hover
  - Hover effects should be visible on gradient

### 📊 Tables

#### Test Cases
- [ ] **Table Rows**
  - Hover: Row should highlight with faded Obsidian-1 background
  - All cells should highlight simultaneously
  - Transition should be smooth (0.15s)

- [ ] **Selected Row**
  - Should maintain highlighted state
  - Hover on selected row should intensify background

- [ ] **Table Header**
  - Should have gradient dawn-light background
  - No hover effect on header (by design)

### 📝 Form Controls

#### Input Fields
- [ ] Border color changes to Azure-5 on hover
- [ ] Border color changes to Azure-6 on focus
- [ ] Shadow ring appears on focus (2px Azure-6 at 20% opacity)
- [ ] Disabled state has no hover effect

#### Checkboxes & Radio
- [ ] Border color changes on hover
- [ ] Wrapper has hover effect
- [ ] Smooth transition to checked state
- [ ] Focus ring visible on keyboard navigation

#### Switches
- [ ] Background opacity changes on hover (unchecked)
- [ ] Background color changes on hover (checked)
- [ ] Smooth toggle animation

### 🗂️ Navigation & Menus

#### Sidebar Navigation
- [ ] Left border animates in (scaleY transform)
- [ ] Background fades in smoothly
- [ ] Text color changes to Azure-6
- [ ] Active item maintains highlighted state

#### Menu Items
- [ ] Background tint on hover
- [ ] Text color changes to Azure-6
- [ ] Submenu arrow color coordinates with text

### 🏷️ Tags & Badges

#### Azure Tags
- [ ] Lifts 1px on hover
- [ ] Background intensifies from Azure-1 to Azure-2
- [ ] Border color changes from Azure-3 to Azure-4

#### Jade Tags
- [ ] Same lift effect
- [ ] Jade color intensification

### 📑 Tabs & Pagination

#### Tabs
- [ ] Tab text color changes to Azure-5 on hover
- [ ] Active tab shows Azure-6 color
- [ ] Ink bar has gradient and smooth transition

#### Pagination
- [ ] Page items lift 1px on hover
- [ ] Border color changes to Azure-6
- [ ] Active page has gradient background
- [ ] Prev/Next buttons show hover effects

### 💬 Modals & Drawers

#### Modal
- [ ] Close button shows hover feedback
- [ ] Header maintains gradient
- [ ] Footer buttons have proper hover states

#### Drawer
- [ ] Same as modal
- [ ] Close button hover effect

### ⚠️ Alerts

#### Info Alert
- [ ] Background intensifies on hover
- [ ] Close icon scales on hover
- [ ] Border color changes

#### Success Alert
- [ ] Jade color intensification
- [ ] Same close icon effect

### 📋 Additional Components

#### Dropdown & Select
- [ ] Menu items highlight on hover
- [ ] Selected item distinction maintained
- [ ] Arrow icon color changes

#### Breadcrumb
- [ ] Links show background padding on hover
- [ ] Color transition to Azure-6

#### Collapse
- [ ] Panel border color changes
- [ ] Header background appears on hover

#### Avatar
- [ ] Border appears on hover
- [ ] Slight scale effect (1.05)
- [ ] Shadow appears

#### Slider
- [ ] Track gradient appears on hover
- [ ] Handle shows focus ring

## Cross-Browser Testing

### Chrome/Edge
- [ ] All transitions smooth at 60fps
- [ ] Gradient effects render correctly
- [ ] Transform effects work properly

### Firefox
- [ ] Same as Chrome
- [ ] Check for any gradient rendering differences

### Safari (macOS)
- [ ] Webkit-specific properties work
- [ ] Scrollbar styling displays correctly
- [ ] Transform effects are smooth

### Safari (iOS)
- [ ] Touch interactions work (tap = hover)
- [ ] Performance is acceptable
- [ ] No layout shifts

### Mobile Chrome (Android)
- [ ] Touch interactions work
- [ ] Performance is acceptable
- [ ] Scrollbar might be hidden (browser default)

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Shift+Tab works in reverse

### Screen Reader
- [ ] Interactive elements announced correctly
- [ ] State changes announced
- [ ] No redundant announcements

### Color Contrast
- [ ] Azure-6 on white: Should pass WCAG AA
- [ ] Hover states maintain contrast
- [ ] Focus indicators visible

## Performance Testing

### Chrome DevTools
- [ ] Measure paint times (should be < 16ms)
- [ ] Check for layout thrashing
- [ ] Verify GPU acceleration (transform/opacity)

### Low-End Device
- [ ] Test on slower hardware
- [ ] Verify 60fps animations
- [ ] Check for jank or stuttering

## Responsive Testing

### Desktop (>1200px)
- [ ] All effects visible and smooth
- [ ] No layout issues

### Tablet (768-1199px)
- [ ] Effects still visible
- [ ] Touch interactions work

### Mobile (<768px)
- [ ] Simplified effects (if applicable)
- [ ] Touch interactions work
- [ ] No performance issues

## Known Good States

### Reference Values
- Transition Fast: 0.15s
- Transition Base: 0.3s
- Transition Slow: 0.5s
- Lift Small: translateY(-1px)
- Lift Medium: translateY(-2px)
- Lift Large: translateY(-4px)
- Primary Color: #0EA5E9 (Azure-6)
- Hover Color: #40A9FF (Azure-5)
- Active Color: #0C83BA (Azure-7)

## Issues to Watch For

### Common Problems
- [ ] Hover effects firing on touch devices unintentionally
- [ ] Transitions too slow or too fast
- [ ] Color contrast issues in hover states
- [ ] Layout shifts during animations
- [ ] Performance issues with many elements
- [ ] Focus indicators not visible
- [ ] Gradients not rendering in older browsers

## Test Environment Setup

### Recommended Browsers
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### Testing Tools
- Chrome DevTools (Performance, Lighthouse)
- Firefox Developer Tools
- Safari Web Inspector
- Axe DevTools (Accessibility)
- WAVE (Accessibility)

## Sign-Off Checklist

- [ ] All visual tests passed
- [ ] Cross-browser testing completed
- [ ] Accessibility validated
- [ ] Performance acceptable
- [ ] No regressions found
- [ ] Documentation reviewed
- [ ] Ready for production

---
**Testing Date**: ___________  
**Tester**: ___________  
**Build Version**: ___________  
**Status**: [ ] PASS [ ] FAIL [ ] CONDITIONAL
