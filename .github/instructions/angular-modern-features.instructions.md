```instructions
---
description: 'Angular 20+ 現代化特性與最佳實務指南 (Modern Angular Features Guide)'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular 現代化特性指南 (Angular Modern Features Guide)

本指南涵蓋 Angular 19+ 引入的現代化特性，包括 Signals、新控制流語法、Zoneless 架構等。

> **版本資訊**: 本指南基於 Angular v21 文檔，完全相容 Angular 20.3.x（專案當前版本）

## 目錄

1. [Angular Signals 模式](#angular-signals-模式)
2. [Standalone Components](#standalone-components)
3. [新控制流語法](#新控制流語法)
4. [Zoneless Angular](#zoneless-angular)
5. [Angular SSR + Hydration](#angular-ssr--hydration)
6. [內建 View Transitions](#內建-view-transitions)
7. [現代化路由模式](#現代化路由模式)
8. [遷移工具](#遷移工具)

---

## Angular Signals 模式

### 核心概念

Signals 是 Angular 的新反應式狀態管理原語，提供更好的效能和開發體驗。

#### 建立與讀取 Signal

```typescript
import { signal, computed, effect } from '@angular/core';

// 建立 signal
const firstName = signal('Morgan');

// 讀取 signal（呼叫函式）
console.log(firstName()); // "Morgan"

// 使用 set 更新值
firstName.set('Jaime');

// 使用 update 基於前值更新
firstName.update(name => name.toUpperCase());
```

#### Computed Signals（計算信號）

```typescript
import { signal, computed } from '@angular/core';

const firstName = signal('Morgan');
const lastName = signal('Freeman');

// 建立衍生狀態
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "Morgan Freeman"

firstName.set('Jaime');
console.log(fullName()); // "Jaime Freeman" (自動更新)
```

#### 在元件中使用 Signals

```typescript
import { Component, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="profile">
      <!-- 在模板中使用 signal（需要呼叫）-->
      <h2>{{ fullName() }}</h2>
      <p>Trial: {{ isTrial() ? 'Active' : 'Inactive' }}</p>
      
      @if (showTrialDuration()) {
        <p>Trial is active and not expired</p>
      }
      
      <button (click)="activateTrial()">Activate Trial</button>
    </div>
  `
})
export class UserProfileComponent {
  // 元件狀態 signals
  firstName = signal('Morgan');
  lastName = signal('Freeman');
  isTrial = signal(false);
  isTrialExpired = signal(false);
  
  // 計算 signals
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  showTrialDuration = computed(() => this.isTrial() && !this.isTrialExpired());
  
  activateTrial(): void {
    this.isTrial.set(true);
  }
}
```

#### Signal 與 RxJS 互操作

```typescript
import { Component, signal, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search-results',
  standalone: true,
  template: `
    @for (result of results$ | async; track result.id) {
      <div>{{ result.name }}</div>
    }
  `
})
export class SearchResultsComponent {
  private http = inject(HttpClient);
  
  query = signal('initial');
  query$ = toObservable(this.query);
  
  results$ = this.query$.pipe(
    switchMap(query => this.http.get(`/search?q=${query}`))
  );
  
  updateQuery(newQuery: string): void {
    this.query.set(newQuery);
  }
}
```

#### 自訂 Signal 相等性比較

```typescript
import { signal, linkedSignal } from '@angular/core';

interface User {
  id: number;
  name: string;
  isAdmin: boolean;
}

const activeUser = signal<User>({ id: 123, name: 'Morgan', isAdmin: true });

// 只在 id 改變時才重新計算
const activeUserEditCopy = linkedSignal(() => activeUser(), {
  equal: (a, b) => a.id === b.id,
});

// 或分離 source 和 computation
const activeUserEditCopy2 = linkedSignal({
  source: activeUser,
  computation: user => user,
  equal: (a, b) => a.id === b.id,
});
```

### 最佳實踐

✅ **推薦**:
- 在元件中使用 signals 管理本地狀態
- 使用 computed signals 處理衍生狀態
- 在服務中使用 signals 管理共享狀態
- 使用 `asReadonly()` 暴露只讀 signals

❌ **避免**:
- 不要在 signal 中存儲過於複雜的物件
- 避免在 computed signal 中執行副作用
- 不要在 template 中直接呼叫會修改 signal 的方法

---

## Standalone Components

### 基本用法

從 Angular 19+ 開始，獨立元件是預設選項，不再需要 NgModules。

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-form',
  standalone: true,  // 預設為 true
  imports: [SHARED_IMPORTS], // 直接在元件中匯入需要的模組
  template: `
    <form>
      <input [(ngModel)]="username" placeholder="Username">
      <button (click)="submit()">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  username = '';
  
  submit(): void {
    console.log('Username:', this.username);
  }
}
```

### 元件組合

```typescript
// profile-photo.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile-photo',
  standalone: true,
  template: '<img [src]="photoUrl" alt="Profile photo">',
  styles: [`img { border-radius: 50%; }`]
})
export class ProfilePhotoComponent {
  photoUrl = 'profile-photo.jpg';
}

// user-profile.component.ts
import { Component } from '@angular/core';
import { ProfilePhotoComponent } from './profile-photo.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ProfilePhotoComponent], // 匯入其他元件
  template: `
    <h1>User Profile</h1>
    <app-profile-photo />
    <p>This is the user profile page</p>
  `
})
export class UserProfileComponent {}
```

### 分離 HTML 和 CSS

```typescript
// user-profile.component.ts
@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {}
```

```html
<!-- user-profile.component.html -->
<h1>User Profile</h1>
<p>This is the user profile page</p>
```

```css
/* user-profile.component.css */
h1 {
  font-size: 3em;
  color: #333;
}
```

---

## 新控制流語法

### @if 條件渲染

取代舊的 `*ngIf` 指令，提供更清晰的語法。

```html
<!-- 基本用法 -->
@if (isAdmin()) {
  <h2>Admin Settings</h2>
  <app-admin-dashboard />
}

<!-- 使用 @else -->
@if (isAdmin()) {
  <h2>Admin Settings</h2>
  <app-admin-dashboard />
} @else {
  <h2>User Settings</h2>
  <app-user-dashboard />
}

<!-- 多重條件 -->
@if (userPermissions === 'admin') {
  <app-admin-dashboard />
} @else if (userPermissions === 'editor') {
  <app-editor-dashboard />
} @else {
  <app-viewer-dashboard />
}
```

### @for 迴圈渲染

取代舊的 `*ngFor` 指令，必須提供 `track` 表達式。

```html
<!-- 基本用法 -->
<ul class="user-badge-list">
  @for (badge of badges(); track badge.id) {
    <li class="user-badge">{{ badge.name }}</li>
  }
</ul>

<!-- 使用 @empty 處理空陣列 -->
<ul class="items-list">
  @for (item of items; track item.name) {
    <li>{{ item.name }}</li>
  } @empty {
    <li aria-hidden="true">There are no items.</li>
  }
</ul>

<!-- 使用索引和其他變數 -->
@for (item of items; track item.id; let idx = $index; let isFirst = $first) {
  <div [class.first]="isFirst">
    {{ idx + 1 }}. {{ item.name }}
  </div>
}
```

### @switch 選擇渲染

取代舊的 `[ngSwitch]` 指令，無 fallthrough 行為。

```html
@switch (userPermissions) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('reviewer') {
    <app-reviewer-dashboard />
  }
  @case ('editor') {
    <app-editor-dashboard />
  }
  @default {
    <app-viewer-dashboard />
  }
}
```

### 遷移對照表

| 舊語法 | 新語法 | 說明 |
|--------|--------|------|
| `*ngIf="condition"` | `@if (condition) { }` | 條件渲染 |
| `*ngIf="condition; else elseBlock"` | `@if (condition) { } @else { }` | 條件 + 備用 |
| `*ngFor="let item of items; trackBy: trackFn"` | `@for (item of items; track item.id) { }` | 迴圈渲染 |
| `[ngSwitch]="value"` + `*ngSwitchCase` | `@switch (value) { @case () { } }` | 選擇渲染 |

---

## Zoneless Angular

### 什麼是 Zoneless？

Zoneless Angular 移除了對 Zone.js 的依賴，使用 Signals 和手動變更檢測來提升效能和減少 bundle 大小。

### 啟用 Zoneless

#### 方法 1: Standalone Bootstrap

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
  ]
});
```

#### 方法 2: NgModule Bootstrap

```typescript
import { NgModule } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';

@NgModule({
  providers: [provideZonelessChangeDetection()]
})
export class AppModule {}

platformBrowser().bootstrapModule(AppModule);
```

### 移除 Zone.js

```bash
# 移除 Zone.js 套件
npm uninstall zone.js

# 或使用 yarn
yarn remove zone.js
```

從 `polyfills.ts` 中移除 Zone.js 匯入：

```typescript
// polyfills.ts
// 移除這行
// import 'zone.js';
```

### Zoneless 測試配置

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(MyComponent);
    await fixture.whenStable(); // 等待穩定
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### 除錯配置

```typescript
import { provideCheckNoChangesConfig } from '@angular/core';

// 啟用週期性檢查（開發模式）
provideCheckNoChangesConfig({
  exhaustive: true,
  interval: 1000 // 每秒檢查一次
})
```

### 最佳實踐

✅ **推薦**:
- 使用 Signals 管理狀態（自動觸發變更檢測）
- 使用 `ChangeDetectorRef.markForCheck()` 手動標記變更
- 測試時使用 `fixture.whenStable()`

❌ **避免**:
- 不要依賴 Zone.js 的自動變更檢測
- 避免在非 Angular context 中修改狀態而不標記

---

## Angular SSR + Hydration

### 什麼是 Hydration？

Hydration 允許 Angular 重用伺服器渲染的 DOM，而不是完全重新渲染，大幅提升效能。

### 啟用 Hydration

#### Standalone Bootstrap

```typescript
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration()]
});
```

#### NgModule Bootstrap

```typescript
import { provideClientHydration } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [AppComponent],
  exports: [AppComponent],
  bootstrap: [AppComponent],
  providers: [provideClientHydration()],
})
export class AppModule {}
```

### 啟用增量 Hydration

```typescript
import {
  bootstrapApplication,
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withIncrementalHydration())
  ]
});
```

### Hydration 觸發器

#### 在互動時 Hydration

```html
@defer (hydrate on interaction) {
  <large-component />
} @placeholder {
  <div>Loading...</div>
}
```

#### 在懸停時 Hydration

```html
@defer (hydrate on hover) {
  <chart-component />
} @placeholder {
  <div>Chart placeholder</div>
}
```

#### 立即 Hydration

```html
@defer (hydrate on immediate) {
  <critical-component />
} @placeholder {
  <div>Critical content placeholder</div>
}
```

#### 定時器觸發

```html
@defer (hydrate on timer(500ms)) {
  <heavy-component />
} @placeholder {
  <div>Heavy component placeholder</div>
}
```

### 巢狀 Defer 區塊

```html
@defer (hydrate on interaction) {
  <parent-block-cmp />
  @defer (hydrate on hover) {
    <child-block-cmp />
  } @placeholder {
    <div>Child placeholder</div>
  }
} @placeholder {
  <div>Parent Placeholder</div>
}
```

### 跳過 Hydration

#### 使用 HTML 屬性

```html
<app-example ngSkipHydration />
```

#### 使用 Host Binding

```typescript
@Component({
  selector: 'app-example',
  host: { ngSkipHydration: 'true' },
  template: `...`
})
export class ExampleComponent {}
```

### 啟用 Event Replay

```typescript
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [
    provideClientHydration(withEventReplay())
  ]
});
```

### 啟用 i18n 支援

```typescript
import {
  bootstrapApplication,
  provideClientHydration,
  withI18nSupport,
} from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withI18nSupport())
  ]
});
```

---

## 內建 View Transitions

### 什麼是 View Transitions？

View Transitions API 提供流暢的頁面轉場動畫，原生支援瀏覽器動畫。

### 啟用路由 View Transitions

```typescript
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableViewTransitions: true  // 啟用 view transitions
    })
  ]
})
export class AppRoutingModule {}
```

### 基本 View Transition 範例

```typescript
// 在元件中觸發 view transition
updateView(data: any): void {
  // 檢查瀏覽器支援
  if (!document.startViewTransition) {
    this.updateDOM(data);
    return;
  }

  // 使用 view transition
  document.startViewTransition(() => {
    this.updateDOM(data);
  });
}

private updateDOM(data: any): void {
  // 更新 DOM 的邏輯
  this.content = data;
}
```

### CSS 動畫配置

```css
/* 自訂 view transition 動畫時長 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}

/* 為特定元素設定 transition name */
.main-header {
  view-transition-name: main-header;
}

.content {
  view-transition-name: content;
}
```

### Cross-Document View Transitions

```css
/* 在兩個頁面都加入此 CSS */
@view-transition {
  navigation: auto;
}
```

---

## 現代化路由模式

### 現代化 Input/Output

#### 使用 input() 函式

取代 `@Input()` 裝飾器（Angular 19+）。

```typescript
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-custom-slider',
  standalone: true,
  template: `
    <div class="slider">
      <span>{{ label() }}</span>
      <input type="range" [value]="value()">
    </div>
  `
})
export class CustomSliderComponent {
  // 必填 input
  value = input.required<number>();
  
  // 選填 input（有預設值）
  min = input(0);
  max = input(100);
  
  // 計算屬性
  label = computed(() => `Value: ${this.value()}`);
}
```

#### 使用 output() 函式

取代 `@Output()` 裝飾器（Angular 19+）。

```typescript
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-expandable-panel',
  standalone: true,
  template: `
    <div class="panel">
      <button (click)="close()">Close</button>
      <ng-content></ng-content>
    </div>
  `
})
export class ExpandablePanelComponent {
  // 定義 output 事件
  panelClosed = output<void>();
  
  close(): void {
    this.panelClosed.emit();
  }
}
```

#### Model Inputs（雙向綁定）

```typescript
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-custom-slider',
  standalone: true,
  template: `
    <input 
      type="range" 
      [value]="value()" 
      (input)="updateValue($event)">
  `
})
export class CustomSliderComponent {
  // 定義 model input
  value = model(0);
  
  updateValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.update(() => parseInt(input.value, 10));
  }
}

// 父元件使用
@Component({
  template: `
    <app-custom-slider [(value)]="volume" />
    <p>Current volume: {{ volume() }}</p>
  `
})
export class ParentComponent {
  volume = signal(50);
}
```

### Functional Router Guards

取代類別型 Guards，使用函式型 Guards。

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

// Functional Guard
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// 在路由中使用
export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  }
];
```

#### 進階 Functional Guard 範例

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionsService } from '@core/services/permissions.service';
import { UserToken } from '@core/models/user-token';

export const canActivateTeam: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const permissionsService = inject(PermissionsService);
  const userToken = inject(UserToken);
  
  return permissionsService.canActivate(userToken, route.params['id']);
};
```

### 路由 Input Binding

允許直接將路由參數綁定到元件 input。

```typescript
// 啟用路由 input binding
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding())
  ]
};

// 元件中使用
@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    <h2>User: {{ hero()?.name }}</h2>
  `
})
export class UserDetailComponent {
  // 自動從路由參數注入
  id = input.required<string>();
  
  private heroService = inject(HeroService);
  
  hero = computed(() => this.heroService.getHero(this.id()));
}
```

---

## 遷移工具

### Control Flow Migration Tool

Angular 17+ 提供自動遷移工具，將舊控制流語法轉換為新語法。

#### 執行遷移

```bash
# 使用 Angular CLI 執行遷移
ng generate @angular/core:control-flow

# 或指定特定路徑
ng generate @angular/core:control-flow --path src/app/features
```

#### 遷移內容

工具會自動轉換：

1. **`*ngIf` → `@if`**
```html
<!-- 轉換前 -->
<div *ngIf="isAdmin">Admin content</div>
<div *ngIf="isAdmin; else userBlock">Admin</div>
<ng-template #userBlock>User</ng-template>

<!-- 轉換後 -->
@if (isAdmin) {
  <div>Admin content</div>
}
@if (isAdmin) {
  <div>Admin</div>
} @else {
  <div>User</div>
}
```

2. **`*ngFor` → `@for`**
```html
<!-- 轉換前 -->
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>

<!-- 轉換後 -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

3. **`[ngSwitch]` → `@switch`**
```html
<!-- 轉換前 -->
<div [ngSwitch]="role">
  <div *ngSwitchCase="'admin'">Admin</div>
  <div *ngSwitchCase="'user'">User</div>
  <div *ngSwitchDefault>Guest</div>
</div>

<!-- 轉換後 -->
@switch (role) {
  @case ('admin') {
    <div>Admin</div>
  }
  @case ('user') {
    <div>User</div>
  }
  @default {
    <div>Guest</div>
  }
}
```

#### 遷移選項

```bash
# 僅顯示預覽（不實際修改）
ng generate @angular/core:control-flow --dry-run

# 遷移特定格式
ng generate @angular/core:control-flow --format=all
```

### Signals Migration Tool

Angular 提供 Signals 遷移工具協助轉換。

```bash
# 執行 signals 遷移
ng generate @angular/core:signals

# 選項：遷移特定檔案
ng generate @angular/core:signals --path src/app/core
```

---

## GigHub 專案整合指南

### 專案配置建議

基於專案當前使用 Angular 20.3.0，以下是推薦的現代化配置：

#### 1. 啟用 Zoneless（可選）

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    provideZonelessChangeDetection(), // 啟用 zoneless
  ]
}).catch(err => console.error(err));
```

#### 2. 啟用 Hydration

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withEventReplay()), // 啟用 hydration
  ]
};
```

#### 3. 使用新控制流

在所有新元件中使用 `@if`、`@for`、`@switch`：

```typescript
// src/app/routes/dashboard/dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <div class="dashboard">
        @for (widget of widgets(); track widget.id) {
          <app-widget [data]="widget" />
        }
      </div>
    }
  `
})
export class DashboardComponent {
  loading = signal(true);
  widgets = signal<Widget[]>([]);
}
```

#### 4. 遷移現有程式碼

```bash
# 執行控制流遷移
ng generate @angular/core:control-flow

# 檢查遷移結果
git diff

# 測試遷移後的程式碼
yarn test
yarn lint
```

### 最佳實踐總結

✅ **立即採用**:
- 新元件使用 Standalone Components
- 使用 Signals 管理狀態
- 使用新控制流語法（@if, @for, @switch）
- 使用 input()/output() 取代裝飾器
- 使用 Functional Guards

✅ **逐步遷移**:
- 現有元件轉換為 Standalone
- 執行控制流遷移工具
- 將 RxJS 狀態轉換為 Signals

⚠️ **謹慎評估**:
- Zoneless（需要充分測試）
- SSR + Hydration（如需 SEO 再啟用）

---

## 參考資源

- [Angular 官方文檔](https://angular.dev)
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [Angular SSR 指南](https://angular.dev/guide/ssr)
- [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions)
- [專案 package.json](/package.json)

---

**注意**: 本指南基於 Angular v21 最新文檔，完全相容專案使用的 Angular 20.3.0 版本。
```
