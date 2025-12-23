Title + Scope

Scope: Directory for Blueprint module view components located at src/app/routes/blueprint/modules.

This file is an agent guide describing what belongs in this directory and the rules agents must follow. Each module view component in this directory is self-contained: it must receive data and dependencies via explicit inputs and injected services, and must not rely on or import feature implementations from other modules directly.

## Purpose / Responsibility

Define the responsibilities and boundaries for UI view components that render Blueprint modules inside the Blueprint container. Keep presentation in this directory and move business logic, data access, and shared models to the core or shared layers.

## Hard Rules / Constraints

These are strict, early-checked rules. Breakage is not allowed.

- NO UI components outside module view scope: only module view components, their templates, and module-local modals are allowed here.
- NO feature-specific logic: do not implement business rules, domain services, or repositories in this directory.
- **Modules must be self-contained**: Each module should use `@angular/fire` directly for Firebase interactions, not depend on `@core` layers.

All modules must be self-contained: they should operate solely from inputs and injected `@angular/fire` services and must not import or depend on `@core/blueprint` implementations or other module view implementations.

## Allowed / Expected Content

What agents are allowed to create here (high-level):

- Singleton services that are presentation-only helpers (e.g., local UI helpers); prefer placing domain services in `@core`.
- Global/interceptor-style cross-cutting concerns relevant to UI presentation only (e.g., presentation error formatter) when justified.
- Module view components, templates, module-local modal/drawer components, and barrel exports (`index.ts`).
- Submodule directories for complex views (each with README and local index.ts).

Note: When in doubt about adding a service, prefer `@core` placement and consult `@core/blueprint` guidelines.

## Structure / Organization

Follow this directory layout to reduce sprawl and confusion:

- `services/` — presentation helpers only (avoid domain logic)
- `guards/` — route guards specific to the Blueprint route surface
- `interceptors/` — presentation-layer interceptors (e.g., error-to-toast mapper)
- Module view files at the root, named `[module-name]-module-view.component.ts` and companion template/styles
- `index.ts` — barrel export for all view components

Each module view must be a Standalone Component, use signals for local UI state, and apply `ChangeDetectionStrategy.OnPush`.

## Integration / Dependencies

Permitted integration patterns and dependency rules:

- Use Angular DI only (prefer `inject()` for new code).
- **Use `@angular/fire` services directly** (Firestore, Auth, Storage) for Firebase operations within each module's own repositories.
- Each module should be self-contained with its own repositories, services, and models.
- No feature-to-feature imports: module view components must not import other module view components or their internals. Communication between features must happen via `EventBus` or shared domain services if absolutely necessary.

## Best Practices / Guidelines

Quality guidance (advisory):

- Prefer composition over inheritance for component and service composition.
- Keep presentation services stateless where possible; store state in signals within the component or in domain stores located in `@core`.
- Validate inputs early and surface clear error UI for invalid input.
- Keep the component public API minimal: require `blueprintId` and any small configuration objects; avoid exposing internal implementation details.
- Ensure keyboard and screen-reader accessibility for interactive elements.

## Related Docs / References

- [../shared/AGENTS.md](../shared/AGENTS.md)
- [../environments/AGENTS.md](../environments/AGENTS.md)
- [@core/blueprint/AGENTS.md](../../../core/blueprint/AGENTS.md)

## Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents
# Blueprint Modules Directory Agent Guide

## Title + Scope
Scope: UI view components for Blueprint modules under src/app/routes/blueprint/modules.

## Purpose / Responsibility
Define boundaries for module view components displayed inside the Blueprint container while keeping business logic in core implementations.

## Hard Rules / Constraints
- NO UI components outside module view scope; keep logic minimal and presentational.
- NO feature-specific business logic or data access here; move to @core/blueprint modules/implementations.
- NO direct Firebase access; repositories handle Firestore interactions.

## Allowed / Expected Content
- Module view components and their templates/styles.
- Module-specific modals used only within the view.
- Barrel exports and submodule directories with documentation.

## Structure / Organization
- Module view components named `[module]-module-view.component.*`.
- index.ts barrel for exports.
- Subdirectories per complex module with README/AGENTS as needed.

## Integration / Dependencies
- Consume data via services/facades provided by core blueprint modules.
- Use Angular DI and signals in components; avoid cross-feature imports.

## Best Practices / Guidelines
- Keep components presentational, using inputs/outputs and signals.
- Reuse shared UI patterns and maintain accessibility.

## Related Docs / References
- ../AGENTS.md (Blueprint module)
- ../../../core/blueprint/AGENTS.md
- ../../../shared/AGENTS.md

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Blueprint Modules Directory Agent Guide

This directory contains **UI view components** for Blueprint modules. These are presentation-layer components that display module-specific content within the Blueprint container.

## Directory Purpose

**規則**:
- 此目錄僅包含 **模組視圖元件** (Module View Components)
- 這些元件負責在 Blueprint Detail 頁面中顯示模組內容
- 這些元件是 **UI 層**，不包含業務邏輯或資料存取邏輯

## Boundary Definition (邊界定義)

### ✅ What BELONGS in this directory:

1. **Module View Components** - 顯示模組內容的元件
   - 例如: `log-module-view.component.ts`, `finance-module-view.component.ts`
   - 命名格式: `[module-name]-module-view.component.ts`

2. **Module-Specific Modal Components** - 模組特定的彈窗元件
   - 例如: `issue-modal.component.ts`
   - 僅在此模組視圖中使用的彈窗

3. **Module View HTML Templates** - 視圖元件的模板
   - 例如: `finance-module-view.component.html`

4. **Module Core Layer** - 模組內部的核心層（自包含架構）
   - `core/models/` - 模組專用資料模型
   - `core/repositories/` - 模組專用 Repository（直接使用 `@angular/fire`）
   - `core/services/` - 模組專用業務邏輯服務
   - 例如: `modules/warranty/core/`, `modules/cloud/core/`

5. **Barrel Export File** - 統一匯出檔案
   - `index.ts` - 匯出所有模組視圖元件

6. **Submodule Directories** - 複雜模組的子目錄
   - 例如: `contract/` - 合約模組的相關元件
   - 每個子目錄必須包含 `README.md` 說明用途

### ❌ What DOES NOT belong here:

1. **跨模組共享的業務邏輯** - 如需共享，移至 `@core/blueprint/` 或 `shared/`
   - ❌ 跨模組 Services（僅限模組內部使用的 Services 才放在 module/core/）
   - ❌ 跨模組 Stores
   - ❌ 跨模組 Facades

2. **跨模組共享的資料模型** - 移至 `@core/models/` 或 `shared/`
   - ❌ 跨模組使用的 TypeScript Interfaces
   - ❌ 跨模組使用的 Type Definitions
   - ❌ 跨模組使用的 Enums

3. **共享元件** - 移至 `@shared/components/`
   - ❌ 跨模組使用的元件
   - ❌ 可重用的 UI 元件

4. **路由配置** - 保留在上層目錄
   - ❌ routes.ts 檔案不屬於此目錄
   - ✅ 路由配置應在 `src/app/routes/blueprint/routes.ts`

5. **Configuration** - 移至 `@core/blueprint/config/`
   - ❌ Module Registry
   - ❌ Module Configuration

## Module View Component Structure

**規則**:
- 每個模組視圖元件必須是 **Standalone Component**
- 必須從 `@shared` 匯入 `SHARED_IMPORTS`
- 必須使用 `inject()` 函數注入服務
- 必須使用 Signals 進行狀態管理
- 必須應用 `OnPush` 變更檢測策略

### 標準模組視圖元件範例

```typescript
import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { LogRepository } from './core/repositories/log.repository'; // ✅ 模組內部 repository

@Component({
  selector: 'app-log-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-view">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else {
        <!-- Module content here -->
      }
    </div>
  `
})
export class LogModuleViewComponent {
  // Input from parent Blueprint Detail Component
  blueprintId = input.required<string>();
  
  // Inject repository (module's own repository using @angular/fire)
  private logRepository = inject(LogRepository);
  
  // Local UI state (Signals)
  loading = signal(false);
  logs = signal<Log[]>([]);
  
  ngOnInit(): void {
    this.loadLogs();
  }
  
  async loadLogs(): Promise<void> {
    this.loading.set(true);
    try {
      const logs = await this.logRepository.findByBlueprintId(this.blueprintId());
      this.logs.set(logs);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 模組內部 Repository 範例

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class LogRepository {
  private firestore = inject(Firestore); // ✅ 直接注入 @angular/fire
  
  async findByBlueprintId(blueprintId: string): Promise<Log[]> {
    const q = query(
      collection(this.firestore, 'logs'),
      where('blueprint_id', '==', blueprintId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
  }
}
```

## Component Responsibilities

**規則**:

### ✅ Module View Components SHOULD:
1. 接收 `blueprintId` 作為 input
2. 使用模組內部的 Repository (直接使用 `@angular/fire`)
3. 使用 Signals 管理本地 UI 狀態（loading、error、data）
4. 處理使用者互動並委派給模組內部的服務層
5. 顯示錯誤訊息和 loading 狀態
6. 使用 ng-zorro-antd 元件進行 UI 顯示
7. **完全自包含**: 所有業務邏輯和資料存取都在模組內部實作

### ❌ Module View Components SHOULD NOT:
1. 依賴 `@core/blueprint` 或其他 core 層（除了共享的 EventBus 或 Logger 等基礎設施）
2. 包含複雜的業務邏輯（委派給模組內部的 Service）
3. 直接在元件中操作 Firestore（必須透過模組內部的 Repository）
4. 跨模組通訊（使用 EventBus）

## Integration with Blueprint Detail

**規則**:
- 模組視圖元件被 `blueprint-detail.component.ts` 動態載入
- Blueprint Detail Component 根據 `enabled_modules` 決定顯示哪些模組
- 模組視圖元件接收 `blueprintId` 作為 input
- 模組視圖元件負責顯示模組內容，不負責決定是否顯示

## Available Modules (Current)

**規則**:
當前可用的模組視圖元件：

1. **log-module-view** - 施工日誌模組
2. **qa-module-view** - 品質檢查模組
3. **finance-module-view** - 財務管理模組
4. **issues-module-view** - 問題追蹤模組
5. **safety-module-view** - 安全管理模組
6. **workflow-module-view** - 工作流程模組
7. **warranty-module-view** - 保固管理模組
8. **material-module-view** - 材料管理模組
9. **acceptance-module-view** - 驗收管理模組
10. **communication-module-view** - 溝通管理模組
11. **shared-module-view** - 共享模組
12. **cloud-module-view** - 雲端整合模組
13. **contract/** - 合約管理模組（子目錄）

## Adding a New Module View Component

**規則**:
新增新的模組視圖元件時必須遵循以下步驟：

### Step 1: Create Component File
```bash
# 在此目錄建立新元件
src/app/routes/blueprint/modules/[module-name]-module-view.component.ts
```

### Step 2: Implement Component
```typescript
import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-[module-name]-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class [ModuleName]ModuleViewComponent {
  blueprintId = input.required<string>();
  // ... component implementation
}
```

### Step 3: Export in index.ts
```typescript
// src/app/routes/blueprint/modules/index.ts
export * from './[module-name]-module-view.component';
```

### Step 4: Register in Module Registry
```typescript
// @core/blueprint/config/module-registry.ts
// (NOT in this directory!)
```

### Step 5: Update Blueprint Detail Component
```typescript
// src/app/routes/blueprint/blueprint-detail.component.ts
// Import and use the new module view component
```

## Submodule Directories

**規則**:
- 如果模組視圖元件過於複雜，可建立子目錄
- 子目錄必須包含 `README.md` 說明用途和邊界
- 子目錄必須包含 `index.ts` 統一匯出
- 例如: `contract/` 目錄包含合約模組的多個相關元件

### Submodule Directory Structure
```
modules/
  contract/
    README.md           # 說明此子目錄的用途
    index.ts            # 統一匯出
    contract-module-view.component.ts        # 主視圖元件
    contract-modal.component.ts              # 彈窗元件
    contract-detail-drawer.component.ts      # 抽屜元件
    contract-creation-wizard.component.ts    # 建立精靈元件
```

## File Naming Conventions

**規則**:
- Module View Component: `[module-name]-module-view.component.ts`
- Module Modal Component: `[module-name]-modal.component.ts`
- Module Drawer Component: `[module-name]-drawer.component.ts`
- Module HTML Template: `[module-name]-module-view.component.html`
- Submodule Directory: `[module-name]/`
- Barrel Export: `index.ts`

## Testing

**規則**:
- 每個模組視圖元件必須有對應的測試檔案
- 測試檔案命名: `[module-name]-module-view.component.spec.ts`
- 測試必須覆蓋：
  - 元件初始化
  - 資料載入
  - 使用者互動
  - 錯誤處理

## Related Documentation

**規則**:
- 參考 `src/app/routes/blueprint/AGENTS.md` 了解 Blueprint 模組整體架構
- 參考 `@core/blueprint/modules/implementations/` 了解模組業務邏輯實作
- 參考 `@core/blueprint/config/module-registry.ts` 了解模組註冊
- 參考 Root `AGENTS.md` 了解專案整體架構

## Checklist for Code Review

**規則**:
在提交程式碼前，請確認：

- [ ] 元件是 Standalone Component
- [ ] 使用 `inject()` 進行依賴注入
- [ ] 使用 Signals 管理狀態
- [ ] 應用 `OnPush` 變更檢測策略
- [ ] 從 `@shared` 匯入 `SHARED_IMPORTS`
- [ ] 接收 `blueprintId` 作為 input
- [ ] 不包含業務邏輯（委派給 Service）
- [ ] 不直接操作 Firestore（透過 Repository）
- [ ] 不包含資料模型定義（使用 `@core/models`）
- [ ] 檔案命名遵循規範
- [ ] 已在 `index.ts` 中匯出
- [ ] 已撰寫對應的測試

## Migration Notes

**規則**:
如果發現以下內容在此目錄中，請按照自包含原則處理：

1. **Module-Specific Services** → 保留在 `modules/[module-name]/core/services/`
2. **Module-Specific Repositories** → 保留在 `modules/[module-name]/core/repositories/`（使用 `@angular/fire`）
3. **Module-Specific Models** → 保留在 `modules/[module-name]/core/models/`
4. **Shared Components** → `@shared/components/`
5. **Routes** → `src/app/routes/blueprint/routes.ts`

**自包含架構範例**:
```
modules/warranty/
├── warranty-module-view.component.ts
├── core/
│   ├── models/
│   │   └── warranty.model.ts
│   ├── repositories/
│   │   └── warranty.repository.ts (使用 @angular/fire)
│   └── services/
│       └── warranty.service.ts
└── features/
    └── list/
        └── warranty-list.component.ts
```

---

**Directory Version**: 1.0.0  
**Last Updated**: 2025-12-19  
**Purpose**: Define clear boundaries for Blueprint module view components  
**Status**: Active
