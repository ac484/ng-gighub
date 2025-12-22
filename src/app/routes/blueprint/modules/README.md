---

# Blueprint Module Template (Angular v20 Standalone)

> Angular 20 官方指引（standalone components + Route 配置）建議優先使用無 NgModule 的設計。以下範本符合 GigHub 的 UI → Service → Repository 分層與 signals 狀態管理。

## 1️⃣ 推薦目錄結構（Standalone + Feature-Based）

```
src/app/routes/blueprint/modules/feature/
│
├─ README.md
├─ routes.ts                        # export const FEATURE_ROUTES: Routes = [...]
├─ feature-shell.component.ts       # Thin orchestrator (standalone, OnPush)
│
├─ components/                      # Page-level standalone components
│   ├─ feature-list.component.ts
│   ├─ feature-detail.component.ts
│   └─ feature-edit.component.ts
│
├─ ui/                              # Presentational pieces (cards, badges, forms)
│   └─ ...
│
├─ services/                        # Business coordination (no Firestore here)
│   ├─ feature.service.ts
│   └─ feature.facade.ts            # Optional signals-based facade/store API
│
├─ data-access/
│   ├─ repositories/
│   │   └─ feature.repository.ts    # Extends FirestoreBaseRepository<T>
│   └─ models/                      # DTO / domain contracts
│
├─ state/                           # Signals state containers
│   └─ feature.store.ts
│
├─ shared/                          # Reusable UI for this feature
│   └─ components/
│
└─ index.ts                         # Public exports
```

## 2️⃣ Routing（Angular 20 standalone lazy loading）

* 以 `Route[]` 匯出，供 Blueprint route 使用 `loadChildren` 或直接匯入。
* 頁面元件使用 `standalone: true`，並以 `SHARED_IMPORTS` / 特定 imports 取代 NgModule。

範例：
```typescript
import { Routes } from '@angular/router';
import { FeatureShellComponent } from './feature-shell.component';
import { FeatureListComponent } from './components/feature-list.component';
import { FeatureDetailComponent } from './components/feature-detail.component';

export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    component: FeatureShellComponent,
    children: [
      { path: '', component: FeatureListComponent },
      { path: ':id', component: FeatureDetailComponent },
    ],
  },
];
```

## 3️⃣ 核心原則

1. **Standalone First**  
   無 NgModule / `forRoot` / `forFeature`。Routing、DI、imports 皆由元件與 route 配置完成。

2. **UI → Service → Repository**  
   * UI：signals 管理本地狀態，使用 `input()/output()`、`@if/@for` 控制流。  
   * Service/Facade：協調權限、校驗與流程；不得直接存取 Firestore。  
   * Repository：唯一的 Firestore 入口，繼承 `FirestoreBaseRepository`，實作資料轉換與重試。

3. **Feature Isolation**  
   子功能（list/detail/edit...）自包含，透過 facade/store 共享狀態與事件，避免跨 feature 耦合。

4. **Lazy + Permission Aware**  
   Route 層決定載入與守衛；權限判斷集中於 service/facade（UI 只負責呈現禁用/隱藏狀態）。

## 4️⃣ Extensibility & Shared Assets

* 新增子功能時，以 `components/` 或 `features/` 子資料夾自包含實作，並更新 `routes.ts`。  
* 共用的 ST 表格、表單 schema、timeline 等放在 `shared/`，或提升到 `src/app/shared/components`。  
* 資料模型、Repository 查詢條件保持通用型態以利重用與測試。

## 5️⃣ 最佳實踐

* 使用 `inject()` 取代 constructor DI；狀態以 `signal/computed/effect` 組合。  
* Firestore 查詢一律走 Repository，並以 Security Rules 做第二道防線。  
* 控制流使用 `@if / @for / @switch`，事件使用 `output()`。  
* 拆分 orchestrator（Shell）與純 UI 元件，Shell 僅負責調度與管控 loading/error。  
* 每個子目錄保留 README 或 index barrel，描述公開 API 與權限需求。
