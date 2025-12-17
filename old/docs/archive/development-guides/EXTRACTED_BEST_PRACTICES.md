# 提取的最佳實踐 - 應用指南
# Extracted Best Practices - Application Guide

> 📅 提取日期 / Extraction Date: 2025-12-10  
> 📝 來源 / Source: PR #18, PR #19 現代化分析  
> ✅ 驗證狀態 / Verification: Context7 Verified with Angular 20.3 Documentation

本文檔提取了 PR #18 和 PR #19 中驗證過的最佳實踐，可直接應用於 GigHub 專案的後續開發。

---

## 🎯 快速導航 / Quick Navigation

1. [AsyncState 模式](#1-asyncstate-模式)
2. [Modal 元件模式](#2-modal-元件模式)
3. [Drawer 元件模式](#3-drawer-元件模式)
4. [服務層 Signal 暴露](#4-服務層-signal-暴露模式)
5. [Computed Signal 衍生狀態](#5-computed-signal-衍生狀態)
6. [Effect 副作用處理](#6-effect-副作用處理)
7. [新控制流語法](#7-新控制流語法-強制)

---

## 1. AsyncState 模式

### 📌 核心價值

統一管理非同步狀態（loading, error, data），減少 90% 的樣板代碼。

### ✅ 標準實現

```typescript
// 1. 創建 AsyncState
export class ListComponent {
  readonly itemsState = createAsyncArrayState<Item>([]);
  
  // 2. 訪問狀態
  readonly loading = this.itemsState.loading;
  readonly error = this.itemsState.error;
  readonly data = this.itemsState.data;
  readonly length = this.itemsState.length;
  
  // 3. 載入數據
  async loadItems(): Promise<void> {
    try {
      await this.itemsState.load(
        firstValueFrom(this.itemService.getAll())
      );
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }
}
```

### 🎨 模板使用

```html
<nz-card [nzLoading]="loading()">
  @if (error()) {
    <nz-alert
      nzType="error"
      [nzMessage]="'載入失敗'"
      [nzDescription]="error()?.message || '無法載入數據'"
    />
  }
  
  @if (data().length > 0) {
    <nz-list [nzDataSource]="data()" />
  } @else {
    <nz-empty />
  }
</nz-card>
```

### 🔧 工具函數實現

```typescript
// @shared/utils/async-state.ts
export interface AsyncState<T> {
  readonly data: Signal<T>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<Error | null>;
  readonly load: (promise: Promise<T>) => Promise<T>;
  readonly setData: (data: T) => void;
  readonly setError: (error: Error | null) => void;
}

export function createAsyncState<T>(initialValue: T): AsyncState<T> {
  const data = signal<T>(initialValue);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  
  const load = async (promise: Promise<T>): Promise<T> => {
    loading.set(true);
    error.set(null);
    try {
      const result = await promise;
      data.set(result);
      return result;
    } catch (err) {
      error.set(err as Error);
      throw err;
    } finally {
      loading.set(false);
    }
  };
  
  return {
    data: data.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    load,
    setData: data.set.bind(data),
    setError: error.set.bind(error)
  };
}

export function createAsyncArrayState<T>(
  initialValue: T[] = []
): AsyncState<T[]> & { length: Signal<number> } {
  const state = createAsyncState<T[]>(initialValue);
  const length = computed(() => state.data().length);
  
  return {
    ...state,
    length
  };
}
```

### 📝 使用場景

- ✅ 列表數據載入（團隊、藍圖、成員、任務等）
- ✅ 詳情頁面數據載入
- ✅ 需要顯示 loading 和 error 狀態的任何非同步操作

### ⚠️ 注意事項

- 不要在 AsyncState 內部執行多個非同步操作
- 複雜的業務邏輯應該在服務層處理
- 錯誤處理應該在呼叫 `load()` 的地方統一處理

---

## 2. Modal 元件模式

### 📌 核心價值

消除直接 DOM 操作，使用宣告式 Modal 元件。

### ✅ 標準實現

#### Modal 元件

```typescript
// team-modal.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '@shared';

interface ModalData {
  team?: Team;
}

@Component({
  selector: 'app-team-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <nz-form-item>
        <nz-form-label nzRequired>名稱</nz-form-label>
        <nz-form-control nzErrorTip="請輸入名稱">
          <input nz-input formControlName="name" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label>描述</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="description" rows="4"></textarea>
        </nz-form-control>
      </nz-form-item>
    </form>
    
    <div *nzModalFooter>
      <button nz-button (click)="cancel()">取消</button>
      <button nz-button nzType="primary" (click)="submit()" [disabled]="!form.valid">
        確定
      </button>
    </div>
  `
})
export class TeamModalComponent {
  private modalRef = inject(NzModalRef);
  private fb = inject(FormBuilder);
  
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: ['']
  });
  
  constructor() {
    // 如果是編輯模式，填充數據
    const data = this.modalRef.getConfig().nzData as ModalData;
    if (data?.team) {
      this.form.patchValue(data.team);
    }
  }
  
  isValid(): boolean {
    return this.form.valid;
  }
  
  getData(): { name: string; description: string | null } {
    return this.form.value;
  }
  
  cancel(): void {
    this.modalRef.close();
  }
  
  submit(): void {
    if (this.form.valid) {
      this.modalRef.close(this.getData());
    }
  }
}
```

#### 開啟 Modal

```typescript
export class ParentComponent {
  private modal = inject(ModalHelper);
  private message = inject(NzMessageService);
  
  // ✅ 新增模式
  async openCreateModal(): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(TeamModalComponent, {}, { size: 'md' })
      .subscribe(async (result) => {
        if (result) {
          await this.createTeam(result);
        }
      });
  }
  
  // ✅ 編輯模式
  async openEditModal(team: Team): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(TeamModalComponent, { team }, { size: 'md' })
      .subscribe(async (result) => {
        if (result) {
          await this.updateTeam(team.id, result);
        }
      });
  }
  
  private async createTeam(data: any): Promise<void> {
    try {
      await this.teamService.create(data);
      this.message.success('團隊已建立');
      this.refresh();
    } catch (error) {
      this.message.error('建立失敗');
    }
  }
}
```

### 📝 使用場景

- ✅ 表單 Modal（新增、編輯）
- ✅ 確認對話框
- ✅ 選擇器 Modal

### ⚠️ 注意事項

- Modal 元件應該是 Standalone Component
- 使用動態導入（`await import()`）實現 lazy loading
- 不要使用 `@ViewChild` 獲取 Modal 引用
- 數據通過 `nzData` 傳遞，不要使用 `@Input`

---

## 3. Drawer 元件模式

### 📌 核心價值

提供豐富的側邊面板體驗，適合顯示詳細資訊。

### ✅ 標準實現

#### Drawer 元件

```typescript
// detail-drawer.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';

interface DrawerData {
  item: Item;
  readonly?: boolean;
}

@Component({
  selector: 'app-detail-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDrawerComponent implements OnInit {
  private readonly drawerRef = inject(NzDrawerRef);
  private readonly drawerData = inject<DrawerData>(NZ_DRAWER_DATA);
  private readonly itemService = inject(ItemService);
  
  // State
  readonly item = signal<Item>(this.drawerData.item);
  readonly readonly = this.drawerData.readonly ?? false;
  readonly loading = signal(false);
  
  // Computed
  readonly canEdit = computed(() => !this.readonly && !this.loading());
  
  ngOnInit(): void {
    this.loadDetails();
  }
  
  private async loadDetails(): Promise<void> {
    try {
      this.loading.set(true);
      const details = await this.itemService.getDetails(this.item().id);
      this.item.set({ ...this.item(), ...details });
    } finally {
      this.loading.set(false);
    }
  }
  
  edit(): void {
    // 開啟編輯 Modal 或切換到編輯模式
  }
  
  delete(): void {
    // 顯示確認對話框並刪除
    this.drawerRef.close({ deleted: true });
  }
  
  close(): void {
    this.drawerRef.close();
  }
}
```

#### Drawer 模板

```html
<!-- detail-drawer.component.html -->
<div class="drawer-header">
  <h3>{{ item().name }}</h3>
  <nz-space>
    @if (canEdit()) {
      <button nz-button (click)="edit()">
        <span nz-icon nzType="edit"></span>
        編輯
      </button>
      <button nz-button nzDanger (click)="delete()">
        <span nz-icon nzType="delete"></span>
        刪除
      </button>
    }
  </nz-space>
</div>

<nz-divider></nz-divider>

<nz-spin [nzSpinning]="loading()">
  <nz-descriptions nzBordered>
    <nz-descriptions-item nzTitle="ID">
      {{ item().id }}
    </nz-descriptions-item>
    <nz-descriptions-item nzTitle="名稱">
      {{ item().name }}
    </nz-descriptions-item>
    <!-- 更多欄位 -->
  </nz-descriptions>
</nz-spin>
```

#### 開啟 Drawer

```typescript
export class ParentComponent {
  private drawer = inject(NzDrawerService);
  
  openDrawer(item: Item): void {
    const drawerRef = this.drawer.create({
      nzTitle: '詳細資訊',
      nzContent: DetailDrawerComponent,
      nzData: { item, readonly: false },
      nzWidth: 600,
      nzPlacement: 'right'
    });
    
    drawerRef.afterClose.subscribe((result) => {
      if (result?.deleted) {
        this.refresh();
      }
    });
  }
}
```

### 📝 使用場景

- ✅ 詳細資訊查看
- ✅ 快速編輯
- ✅ 多步驟操作
- ✅ 不想離開當前頁面的情況

### ⚠️ 注意事項

- 使用 `NZ_DRAWER_DATA` 注入數據
- 通過 `drawerRef.close(data)` 傳遞結果
- Drawer 寬度建議 400-800px
- 複雜表單考慮使用 Modal 而非 Drawer

---

## 4. 服務層 Signal 暴露模式

### 📌 核心價值

保護內部狀態，提供安全的 Signal API。

### ✅ 標準實現

```typescript
// data.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface DataItem {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class DataService {
  // ✅ 私有可寫 signal
  private readonly _items = signal<DataItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<Error | null>(null);
  
  // ✅ 公開只讀 signal
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // ✅ Computed signals
  readonly activeItems = computed(() => 
    this._items().filter(item => item.status === 'active')
  );
  
  readonly itemCount = computed(() => this._items().length);
  
  // ✅ 明確的更新方法
  setItems(items: DataItem[]): void {
    this._items.set(items);
  }
  
  addItem(item: DataItem): void {
    this._items.update(items => [...items, item]);
  }
  
  updateItem(id: string, updates: Partial<DataItem>): void {
    this._items.update(items =>
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  }
  
  removeItem(id: string): void {
    this._items.update(items => items.filter(item => item.id !== id));
  }
  
  // ✅ 非同步操作
  async loadItems(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const items = await this.http.get<DataItem[]>('/api/items').toPromise();
      this._items.set(items || []);
    } catch (error) {
      this._error.set(error as Error);
    } finally {
      this._loading.set(false);
    }
  }
}
```

### 🎨 元件使用

```typescript
export class ListComponent {
  private dataService = inject(DataService);
  
  // ✅ 直接使用服務的 signals
  items = this.dataService.items;
  loading = this.dataService.loading;
  error = this.dataService.error;
  activeItems = this.dataService.activeItems;
  
  ngOnInit(): void {
    this.dataService.loadItems();
  }
  
  addItem(item: DataItem): void {
    this.dataService.addItem(item);
  }
}
```

### 📝 使用場景

- ✅ 共享狀態管理
- ✅ 跨元件通訊
- ✅ 全局配置
- ✅ 認證狀態

### ⚠️ 注意事項

- 永遠不要直接暴露可寫 signal
- 使用 `asReadonly()` 暴露只讀 signal
- 提供明確的更新方法
- Computed signals 應該是純函數

---

## 5. Computed Signal 衍生狀態

### 📌 核心價值

自動更新的衍生狀態，無需手動管理依賴。

### ✅ 標準實現

```typescript
export class DataComponent {
  // 原始 signals
  private items = signal<Item[]>([]);
  private filter = signal<string>('');
  private sortBy = signal<'name' | 'date'>('name');
  
  // ✅ Computed: 過濾
  readonly filteredItems = computed(() => {
    const items = this.items();
    const filter = this.filter().toLowerCase();
    
    if (!filter) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(filter)
    );
  });
  
  // ✅ Computed: 排序
  readonly sortedItems = computed(() => {
    const items = this.filteredItems();
    const sortBy = this.sortBy();
    
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  });
  
  // ✅ Computed: 統計
  readonly totalCount = computed(() => this.items().length);
  readonly filteredCount = computed(() => this.filteredItems().length);
  readonly isEmpty = computed(() => this.totalCount() === 0);
  readonly hasResults = computed(() => this.filteredCount() > 0);
  
  // ✅ Computed: 條件判斷
  readonly canExport = computed(() => 
    this.hasResults() && !this.loading()
  );
  
  // ✅ Computed: 格式化
  readonly displayText = computed(() => {
    const total = this.totalCount();
    const filtered = this.filteredCount();
    
    if (total === filtered) {
      return `共 ${total} 項`;
    }
    return `顯示 ${filtered} / ${total} 項`;
  });
}
```

### 🎨 模板使用

```html
<nz-card [nzTitle]="displayText()">
  @if (isEmpty()) {
    <nz-empty nzNotFoundContent="暫無數據" />
  } @else {
    @if (hasResults()) {
      @for (item of sortedItems(); track item.id) {
        <div>{{ item.name }}</div>
      }
    } @else {
      <nz-empty nzNotFoundContent="沒有符合條件的結果" />
    }
  }
  
  <button 
    nz-button 
    [disabled]="!canExport()"
    (click)="export()"
  >
    匯出
  </button>
</nz-card>
```

### 📝 使用場景

- ✅ 過濾和排序列表
- ✅ 統計和聚合數據
- ✅ 條件判斷
- ✅ 格式化顯示
- ✅ 表單驗證狀態

### ⚠️ 注意事項

- Computed signals 應該是純函數
- 避免在 computed 內執行副作用
- 複雜計算考慮性能影響
- 不要在 computed 內修改其他 signals

---

## 6. Effect 副作用處理

### 📌 核心價值

自動響應 signal 變化並執行副作用。

### ✅ 標準實現

```typescript
export class DataComponent {
  private destroyRef = inject(DestroyRef);
  
  // Signals
  private filter = signal('');
  private sortBy = signal<'name' | 'date'>('name');
  
  // Computed
  private readonly shouldLoad = computed(() => {
    const hasFilter = this.filter().length > 0;
    const isAuthenticated = this.authService.isAuthenticated();
    return hasFilter && isAuthenticated;
  });
  
  constructor() {
    // ✅ Effect: 自動載入數據
    effect(() => {
      if (this.shouldLoad()) {
        this.loadData();
      } else {
        this.clearData();
      }
    });
    
    // ✅ Effect: 同步到 localStorage
    effect(() => {
      const settings = {
        filter: this.filter(),
        sortBy: this.sortBy()
      };
      localStorage.setItem('userSettings', JSON.stringify(settings));
    });
    
    // ✅ Effect: 日誌記錄
    effect(() => {
      console.log('Current filter:', this.filter());
      console.log('Current sort:', this.sortBy());
    });
    
    // ✅ Effect: 分析追蹤
    effect(() => {
      this.analytics.track('FilterChanged', {
        filter: this.filter(),
        count: this.filteredCount()
      });
    });
  }
  
  private loadData(): void {
    // 載入數據邏輯
  }
  
  private clearData(): void {
    // 清除數據邏輯
  }
}
```

### 📝 使用場景

- ✅ 自動載入數據
- ✅ localStorage 同步
- ✅ 日誌記錄
- ✅ 分析追蹤
- ✅ WebSocket 訂閱管理

### ⚠️ 注意事項

- Effect 會自動清理，不需要手動取消訂閱
- 避免在 effect 內執行耗時操作
- Effect 內的邏輯應該是冪等的
- 複雜副作用考慮拆分為多個 effect

---

## 7. 新控制流語法 (強制)

### 📌 核心價值

更簡潔、更易讀的模板語法，必須在所有新代碼中使用。

### ✅ @if / @else

```html
<!-- ✅ 正確 -->
@if (loading()) {
  <nz-spin nzSimple />
} @else if (error()) {
  <nz-alert nzType="error" [nzMessage]="error()" />
} @else if (isEmpty()) {
  <nz-empty />
} @else {
  <div>{{ data() }}</div>
}

<!-- ❌ 錯誤 - 不要使用舊語法 -->
<nz-spin *ngIf="loading()" nzSimple />
<nz-alert *ngIf="error()" nzType="error" [nzMessage]="error()" />
```

### ✅ @for with @empty

```html
<!-- ✅ 正確 -->
@for (item of items(); track item.id) {
  <nz-list-item>
    <nz-list-item-meta [nzTitle]="item.name" />
  </nz-list-item>
} @empty {
  <nz-empty nzNotFoundContent="暫無數據" />
}

<!-- ❌ 錯誤 - 不要使用舊語法 -->
<nz-list-item *ngFor="let item of items(); trackBy: trackById">
  <nz-list-item-meta [nzTitle]="item.name" />
</nz-list-item>
```

### ✅ @switch

```html
<!-- ✅ 正確 -->
@switch (status()) {
  @case ('pending') {
    <nz-badge nzStatus="processing" nzText="處理中" />
  }
  @case ('completed') {
    <nz-badge nzStatus="success" nzText="已完成" />
  }
  @case ('failed') {
    <nz-badge nzStatus="error" nzText="失敗" />
  }
  @default {
    <nz-badge nzStatus="default" nzText="未知" />
  }
}

<!-- ❌ 錯誤 - 不要使用舊語法 -->
<div [ngSwitch]="status()">
  <nz-badge *ngSwitchCase="'pending'" nzStatus="processing" />
  <nz-badge *ngSwitchCase="'completed'" nzStatus="success" />
  <nz-badge *ngSwitchDefault nzStatus="default" />
</div>
```

### 📝 遷移檢查清單

- [ ] 所有 `*ngIf` 已轉換為 `@if`
- [ ] 所有 `*ngFor` 已轉換為 `@for` 並提供 `track`
- [ ] 所有 `[ngSwitch]` 已轉換為 `@switch`
- [ ] 列表渲染都有 `@empty` 處理
- [ ] 條件渲染都有適當的 `@else` 分支

---

## 🎓 學習資源

### 官方文檔

- [Angular Signals](https://angular.dev/guide/signals)
- [New Control Flow](https://angular.dev/guide/templates/control-flow)
- [ng-zorro-antd](https://ng.ant.design)
- [ng-alain](https://ng-alain.com)

### 專案文檔

- [快速參考指南](../.github/instructions/quick-reference.instructions.md)
- [Angular 現代特性](../.github/instructions/angular-modern-features.instructions.md)
- [企業架構模式](../.github/instructions/enterprise-angular-architecture.instructions.md)

---

## ✅ 採用檢查清單

### 立即採用 (所有新代碼必須使用)

- [ ] 使用新控制流語法 (@if, @for, @switch)
- [ ] 使用 Standalone Components
- [ ] 使用 inject() 進行依賴注入
- [ ] 使用 OnPush 變更偵測
- [ ] 使用 Signals 管理狀態

### 推薦採用 (優先使用)

- [ ] 使用 AsyncState 模式處理非同步數據
- [ ] 使用 Modal 元件模式取代 DOM 操作
- [ ] 使用 Drawer 元件顯示詳細資訊
- [ ] 使用服務層 Signal 暴露模式
- [ ] 使用 Computed Signals 建立衍生狀態
- [ ] 使用 Effect 處理副作用

### 逐步遷移

- [ ] 將現有元件遷移到 AsyncState 模式
- [ ] 將現有 Modal 重構為元件模式
- [ ] 將現有服務遷移到 Signal 模式

---

**文檔版本**: 1.0.0  
**最後更新**: 2025-12-10  
**維護者**: GigHub Development Team
