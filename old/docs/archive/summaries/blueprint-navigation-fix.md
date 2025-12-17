# Blueprint Navigation Fix - 404 Issue Resolution

## 📋 Executive Summary

Fixed the "檢視" (View) functionality in the Blueprint management system that was returning 404 errors. The issue was caused by using absolute paths instead of relative navigation, which broke the workspace context awareness.

## 🔍 Problem Analysis

### Issue Description
When clicking the "檢視" (View) button in the blueprint list, users encountered a 404 error instead of seeing the blueprint details page.

### Root Cause
The application uses a **workspace-aware routing structure** where blueprints are accessed under different base paths depending on the context:
- User context: `/blueprints/user`
- Organization context: `/blueprints/organization`

However, the navigation code was using **absolute paths** like `/blueprint/{id}`, which:
1. Didn't match any configured route
2. Broke the workspace context hierarchy
3. Resulted in 404 errors

### Technical Analysis

**Route Configuration** (from `src/app/routes/routes.ts`):
```typescript
{
  path: 'blueprints/user',
  loadChildren: () => import('./blueprint/routes').then(m => m.routes),
  data: { title: '我的藍圖' }
},
{
  path: 'blueprints/organization',
  loadChildren: () => import('./blueprint/routes').then(m => m.routes),
  data: { title: '組織藍圖' }
}
```

**Blueprint Routes** (from `src/app/routes/blueprint/routes.ts`):
```typescript
{
  path: '',
  loadComponent: () => import('./blueprint-list.component').then(m => m.BlueprintListComponent),
  data: { title: '藍圖管理' }
},
{
  path: ':id',
  loadComponent: () => import('./blueprint-detail.component').then(m => m.BlueprintDetailComponent),
  data: { title: '藍圖詳情' }
}
```

**Expected URL Patterns**:
- User blueprint list: `/blueprints/user`
- User blueprint detail: `/blueprints/user/{id}`
- Org blueprint list: `/blueprints/organization`
- Org blueprint detail: `/blueprints/organization/{id}`

**Broken Navigation Code**:
```typescript
// ❌ WRONG: Absolute path that doesn't exist in route config
this.router.navigate(['/blueprint', blueprint.id]);
// Results in: /blueprint/abc-123 → 404 Not Found
```

## ✅ Solution Implemented

### Key Principle: Relative Navigation

According to **Angular routing best practices** (verified via Context7):
> Use relative navigation with `{ relativeTo: this.route }` to maintain route hierarchy and context.

### Changes Made

#### 1. **blueprint-list.component.ts**

**Added ActivatedRoute Injection**:
```typescript
import { Router, ActivatedRoute } from '@angular/router';

export class BlueprintListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  // ...
}
```

**Fixed view() Method**:
```typescript
// Before (❌):
view(record: STData): void {
  const blueprint = record as unknown as Blueprint;
  this.router.navigate(['/blueprint', blueprint.id]);
}

// After (✅):
view(record: STData): void {
  const blueprint = record as unknown as Blueprint;
  // Navigate relative to current route (preserves workspace context)
  this.router.navigate([blueprint.id], { relativeTo: this.route });
}
```

**How It Works**:
- If current URL is `/blueprints/user`, navigates to `/blueprints/user/{id}`
- If current URL is `/blueprints/organization`, navigates to `/blueprints/organization/{id}`
- Maintains the workspace context hierarchy automatically

#### 2. **blueprint-detail.component.ts**

**Fixed Breadcrumb Navigation**:
```typescript
// Before (❌):
<a [routerLink]="['/blueprint']">藍圖管理</a>

// After (✅):
<a [routerLink]="['..']" [relativeTo]="route">藍圖管理</a>
```

**Fixed Back to List Button**:
```typescript
// Before (❌):
<button nz-button nzType="primary" [routerLink]="['/blueprint']">
  返回列表
</button>

// After (✅):
<button nz-button nzType="primary" [routerLink]="['..']" [relativeTo]="route">
  返回列表
</button>
```

**Fixed Error Handling Navigation**:
```typescript
// Before (❌):
if (!id) {
  this.message.error('缺少藍圖 ID');
  this.router.navigate(['/blueprint']);
}

// After (✅):
if (!id) {
  this.message.error('缺少藍圖 ID');
  // Navigate back to list using relative path
  this.router.navigate(['..'], { relativeTo: this.route });
}
```

**Fixed Module Navigation**:
```typescript
// Before (❌):
openModule(module: string): void {
  const blueprintId = this.blueprint()?.id;
  if (blueprintId) {
    this.router.navigate(['/blueprint', blueprintId, module]);
  }
}

// After (✅):
openModule(module: string): void {
  const blueprintId = this.blueprint()?.id;
  if (blueprintId) {
    // Navigate relative to current detail page
    this.router.navigate([module], { relativeTo: this.route });
  }
}
```

## 🧪 Testing Guide

### Manual Testing Checklist

#### Test 1: User Context Navigation
1. ✅ Login to the application
2. ✅ Navigate to "我的藍圖" (My Blueprints)
3. ✅ Click "檢視" (View) button on any blueprint
4. ✅ Verify URL is `/blueprints/user/{id}`
5. ✅ Verify blueprint details are displayed correctly
6. ✅ Click breadcrumb "藍圖管理" link
7. ✅ Verify navigation back to `/blueprints/user`

#### Test 2: Organization Context Navigation
1. ✅ Switch to an organization context
2. ✅ Navigate to "組織藍圖" (Organization Blueprints)
3. ✅ Click "檢視" (View) button on any blueprint
4. ✅ Verify URL is `/blueprints/organization/{id}`
5. ✅ Verify blueprint details are displayed correctly
6. ✅ Click breadcrumb "藍圖管理" link
7. ✅ Verify navigation back to `/blueprints/organization`

#### Test 3: Module Navigation
1. ✅ Open a blueprint detail page
2. ✅ Click "開啟" (Open) button on an enabled module
3. ✅ Verify navigation to correct module page
4. ✅ Verify URL pattern: `/blueprints/{context}/{id}/{module}`

#### Test 4: Error Handling
1. ✅ Navigate to a non-existent blueprint ID
2. ✅ Verify 404 result page is displayed
3. ✅ Click "返回列表" (Back to List) button
4. ✅ Verify navigation back to correct list page

#### Test 5: Browser Navigation
1. ✅ Use browser back button after viewing blueprint
2. ✅ Use browser forward button
3. ✅ Verify URL and context remain correct
4. ✅ Bookmark a blueprint detail page and revisit

### Expected Results

All navigation flows should:
- ✅ Maintain workspace context (USER vs ORGANIZATION)
- ✅ Generate correct URL patterns
- ✅ Not produce any 404 errors
- ✅ Work consistently across different contexts
- ✅ Support browser navigation (back/forward)

## 📚 Technical References

### Angular Routing Documentation (Context7)

**Relative Navigation Pattern**:
```typescript
// Navigate relative to current route
this.router.navigate(['child'], { relativeTo: this.route });

// Navigate to parent
this.router.navigate(['..'], { relativeTo: this.route });

// Navigate to sibling
this.router.navigate(['../sibling'], { relativeTo: this.route });
```

**Template Relative Navigation**:
```html
<!-- Navigate to child -->
<a [routerLink]="['child']" [relativeTo]="route">Child</a>

<!-- Navigate to parent -->
<a [routerLink]="['..']" [relativeTo]="route">Parent</a>
```

### Benefits of Relative Navigation

1. **Context Preservation**: Automatically maintains route hierarchy
2. **Flexibility**: Works with any parent route structure
3. **Maintainability**: No need to update paths when route structure changes
4. **Type Safety**: Compile-time checking of route segments
5. **Best Practice**: Recommended by Angular team

## 🔄 Related Patterns

### Workspace Context Service

The application uses `WorkspaceContextService` to manage workspace state:

```typescript
readonly contextType = signal<ContextType>(ContextType.USER);
readonly contextId = signal<string | null>(null);

// Context types
enum ContextType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  TEAM = 'TEAM',
  BOT = 'BOT'
}
```

The navigation fix ensures that routing respects this context without needing to explicitly check it in every navigation call.

## 🎯 Key Takeaways

1. **Always use relative navigation** when working with nested routes
2. **Inject ActivatedRoute** in components that need context-aware navigation
3. **Test navigation in all workspace contexts** (USER, ORGANIZATION, etc.)
4. **Use Context7** to verify Angular best practices before implementation
5. **Avoid absolute paths** unless navigating to completely different areas

## 📝 Maintenance Notes

When adding new navigation in blueprint-related components:
- ✅ Always inject `ActivatedRoute`
- ✅ Use `{ relativeTo: this.route }` for programmatic navigation
- ✅ Use `[relativeTo]="route"` for template navigation
- ✅ Test in both USER and ORGANIZATION contexts
- ✅ Verify URL patterns match route configuration

## 🔗 Related Files

- `src/app/routes/routes.ts` - Main route configuration
- `src/app/routes/blueprint/routes.ts` - Blueprint module routes
- `src/app/routes/blueprint/blueprint-list.component.ts` - List component
- `src/app/routes/blueprint/blueprint-detail.component.ts` - Detail component
- `src/app/shared/services/workspace-context.service.ts` - Context management

---

**Fix Date**: 2025-12-10  
**Author**: GitHub Copilot (with Context7 verification)  
**Status**: ✅ Implemented and Ready for Testing
