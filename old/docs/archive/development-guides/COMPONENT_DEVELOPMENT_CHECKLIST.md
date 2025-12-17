# 現代化元件開發檢查清單
# Modern Component Development Checklist

> 📋 使用本檢查清單確保新元件符合 GigHub 專案的現代化標準  
> ✅ 基於 PR #18 和 PR #19 的驗證模式

---

## 🚀 新元件快速檢查清單

### 1. 元件基礎結構 (必須)

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-feature-name',
  standalone: true,  // ✅ 必須
  imports: [SHARED_IMPORTS],  // ✅ 必須
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ 必須
  template: `...`
})
export class FeatureNameComponent {
  // 使用 inject() 注入依賴
  private readonly service = inject(SomeService);
}
```

**檢查項目**:
- [ ] 元件是 `standalone: true`
- [ ] 使用 `SHARED_IMPORTS` 導入共用模組
- [ ] 使用 `ChangeDetectionStrategy.OnPush`
- [ ] 使用 `inject()` 而非 constructor 注入
- [ ] 檔名使用 kebab-case: `feature-name.component.ts`

---

### 2. 狀態管理 (必須)

```typescript
export class FeatureNameComponent {
  // ✅ 使用 Signals
  private dataState = createAsyncArrayState<DataType>([]);
  
  // ✅ 使用 Computed
  readonly displayData = computed(() => 
    this.dataState.data().filter(item => item.active)
  );
  
  readonly isEmpty = computed(() => this.dataState.length() === 0);
}
```

**檢查項目**:
- [ ] 使用 `signal()` 管理本地狀態
- [ ] 使用 `computed()` 建立衍生狀態
- [ ] 對於非同步數據使用 `createAsyncArrayState()`
- [ ] 避免使用傳統的 `public` 屬性
- [ ] 所有狀態都是 readonly（除了私有 signals）

---

### 3. 模板語法 (強制)

```html
<!-- ✅ 使用新控制流 -->
@if (loading()) {
  <nz-spin nzSimple />
} @else if (error()) {
  <nz-alert nzType="error" [nzMessage]="error()" />
} @else {
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  } @empty {
    <nz-empty />
  }
}
```

**檢查項目**:
- [ ] 使用 `@if` / `@else` 而非 `*ngIf`
- [ ] 使用 `@for` 而非 `*ngFor`
- [ ] 所有 `@for` 都提供 `track` 表達式
- [ ] 使用 `@switch` 而非 `[ngSwitch]`
- [ ] 列表渲染包含 `@empty` 分支
- [ ] Signals 在模板中使用 `()` 調用

---

### 4. 資料載入模式 (推薦)

```typescript
export class ListComponent implements OnInit {
  readonly itemsState = createAsyncArrayState<Item>([]);
  
  ngOnInit(): void {
    this.loadItems();
  }
  
  private async loadItems(): Promise<void> {
    try {
      await this.itemsState.load(
        firstValueFrom(this.itemService.getAll())
      );
    } catch (error) {
      console.error('[ListComponent] Failed to load items:', error);
      this.message.error('載入失敗');
    }
  }
}
```

**檢查項目**:
- [ ] 使用 `createAsyncArrayState()` 管理列表數據
- [ ] 在 `ngOnInit()` 中觸發載入
- [ ] 使用 try-catch 處理錯誤
- [ ] 顯示使用者友好的錯誤訊息
- [ ] 記錄錯誤到 console（包含元件名稱）

---

### 5. Modal 模式 (推薦)

```typescript
// Modal 元件
@Component({
  selector: 'app-item-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <!-- 表單內容 -->
    </form>
    <div *nzModalFooter>
      <button nz-button (click)="cancel()">取消</button>
      <button nz-button nzType="primary" (click)="submit()">確定</button>
    </div>
  `
})
export class ItemModalComponent {
  private modalRef = inject(NzModalRef);
  
  isValid(): boolean { return this.form.valid; }
  getData(): any { return this.form.value; }
  cancel(): void { this.modalRef.close(); }
  submit(): void { this.modalRef.close(this.getData()); }
}

// 父元件
async openModal(): Promise<void> {
  const { ItemModalComponent } = await import('./item-modal.component');
  
  this.modal
    .createStatic(ItemModalComponent, {}, { size: 'md' })
    .subscribe((result) => {
      if (result) {
        this.handleResult(result);
      }
    });
}
```

**檢查項目**:
- [ ] Modal 元件是 Standalone
- [ ] 使用 `ModalHelper.createStatic()` 開啟
- [ ] 使用動態導入 `await import()`
- [ ] 提供 `isValid()` 和 `getData()` 方法
- [ ] 不使用 `@ViewChild` 或 DOM 操作

---

### 6. Drawer 模式 (可選)

```typescript
@Component({
  selector: 'app-detail-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDrawerComponent {
  private readonly drawerRef = inject(NzDrawerRef);
  private readonly drawerData = inject<DrawerData>(NZ_DRAWER_DATA);
  
  readonly item = signal(this.drawerData.item);
  
  close(): void {
    this.drawerRef.close();
  }
}
```

**檢查項目**:
- [ ] 使用 `NZ_DRAWER_DATA` 注入數據
- [ ] 使用 `NzDrawerRef.close()` 關閉
- [ ] 通過 `close(data)` 傳遞結果
- [ ] 適合顯示詳細資訊的場景

---

### 7. 服務設計 (如需要)

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  // 私有可寫 signals
  private readonly _items = signal<Item[]>([]);
  private readonly _loading = signal(false);
  
  // 公開只讀 signals
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  
  // Computed signals
  readonly activeItems = computed(() => 
    this._items().filter(item => item.active)
  );
  
  // 更新方法
  setItems(items: Item[]): void {
    this._items.set(items);
  }
}
```

**檢查項目**:
- [ ] 私有 signals 使用 `_` 前綴
- [ ] 使用 `asReadonly()` 暴露公開 signals
- [ ] 提供明確的更新方法
- [ ] Computed signals 是純函數
- [ ] 使用 `providedIn: 'root'` 或特定範圍

---

### 8. 錯誤處理 (必須)

```typescript
private async loadData(): Promise<void> {
  try {
    await this.dataState.load(
      firstValueFrom(this.service.getData())
    );
    console.log('[Component] Data loaded successfully');
  } catch (error) {
    console.error('[Component] Failed to load data:', error);
    this.message.error('載入數據失敗，請稍後再試');
  }
}
```

**檢查項目**:
- [ ] 所有非同步操作都有 try-catch
- [ ] 錯誤記錄到 console（包含元件名稱）
- [ ] 顯示使用者友好的錯誤訊息
- [ ] 使用 `NzMessageService` 顯示訊息
- [ ] 不要讓錯誤導致應用崩潰

---

### 9. 效能優化 (推薦)

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅
  template: `
    @for (item of items(); track item.id) {  <!-- ✅ 提供 track -->
      <div>{{ item.name }}</div>
    }
  `
})
export class OptimizedComponent {
  // ✅ 使用 Signals 自動觸發變更偵測
  readonly items = signal<Item[]>([]);
  
  // ✅ 使用 computed 避免重複計算
  readonly filteredItems = computed(() => 
    this.items().filter(item => item.active)
  );
}
```

**檢查項目**:
- [ ] 使用 `OnPush` 變更偵測
- [ ] 所有列表渲染都有 `track` 表達式
- [ ] 使用 `computed()` 快取計算結果
- [ ] 使用動態導入（lazy loading）載入 Modal/Drawer
- [ ] 大列表考慮虛擬滾動

---

### 10. 測試準備 (推薦)

```typescript
export class TestableComponent {
  // ✅ 依賴都通過 inject() 注入，易於 mock
  private readonly service = inject(DataService);
  
  // ✅ 公開的 signals 易於測試
  readonly items = this.service.items;
  readonly loading = this.service.loading;
  
  // ✅ 公開方法易於測試
  async loadData(): Promise<void> {
    await this.service.loadData();
  }
}
```

**檢查項目**:
- [ ] 所有依賴都通過 `inject()` 注入
- [ ] 避免在 constructor 中執行邏輯
- [ ] 公開需要測試的方法
- [ ] Signals 易於在測試中讀取和驗證
- [ ] 考慮編寫單元測試

---

## 📝 完整範例

### 標準列表元件

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, createAsyncArrayState } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ModalHelper } from '@delon/theme';

interface Item {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'項目列表'" [action]="actionTemplate">
      <ng-template #actionTemplate>
        <button nz-button nzType="primary" (click)="openCreateModal()">
          <span nz-icon nzType="plus"></span>
          新增項目
        </button>
      </ng-template>
    </page-header>
    
    <nz-card [nzLoading]="loading()">
      @if (error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="error()?.message || '無法載入項目列表'"
          class="mb-md"
        />
      }
      
      @if (activeItems().length > 0) {
        <nz-list [nzDataSource]="activeItems()" [nzRenderItem]="itemTpl" />
        <ng-template #itemTpl let-item>
          <nz-list-item [nzActions]="[editAction, deleteAction]">
            <nz-list-item-meta [nzTitle]="item.name" />
            <nz-tag [nzColor]="item.status === 'active' ? 'success' : 'default'">
              {{ item.status }}
            </nz-tag>
            
            <ng-template #editAction>
              <a (click)="openEditModal(item)">編輯</a>
            </ng-template>
            <ng-template #deleteAction>
              <a nz-popconfirm nzPopconfirmTitle="確定刪除？" (nzOnConfirm)="deleteItem(item)">
                刪除
              </a>
            </ng-template>
          </nz-list-item>
        </ng-template>
      } @else {
        <nz-empty nzNotFoundContent="暫無項目" />
      }
    </nz-card>
  `
})
export class ItemListComponent implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);
  
  // AsyncState 管理數據
  readonly itemsState = createAsyncArrayState<Item>([]);
  
  // 暴露狀態
  readonly loading = this.itemsState.loading;
  readonly error = this.itemsState.error;
  
  // Computed: 只顯示活躍項目
  readonly activeItems = computed(() => 
    this.itemsState.data().filter(item => item.status === 'active')
  );
  
  ngOnInit(): void {
    this.loadItems();
  }
  
  private async loadItems(): Promise<void> {
    try {
      await this.itemsState.load(
        firstValueFrom(this.itemService.getAll())
      );
      console.log('[ItemListComponent] ✅ Loaded items:', this.itemsState.length());
    } catch (error) {
      console.error('[ItemListComponent] ❌ Failed to load items:', error);
    }
  }
  
  async openCreateModal(): Promise<void> {
    const { ItemModalComponent } = await import('./item-modal.component');
    
    this.modal
      .createStatic(ItemModalComponent, {}, { size: 'md' })
      .subscribe(async (result) => {
        if (result) {
          await this.createItem(result);
        }
      });
  }
  
  async openEditModal(item: Item): Promise<void> {
    const { ItemModalComponent } = await import('./item-modal.component');
    
    this.modal
      .createStatic(ItemModalComponent, { item }, { size: 'md' })
      .subscribe(async (result) => {
        if (result) {
          await this.updateItem(item.id, result);
        }
      });
  }
  
  private async createItem(data: Partial<Item>): Promise<void> {
    try {
      await this.itemService.create(data);
      this.message.success('項目已建立');
      await this.loadItems();
    } catch (error) {
      console.error('[ItemListComponent] ❌ Failed to create item:', error);
      this.message.error('建立項目失敗');
    }
  }
  
  private async updateItem(id: string, data: Partial<Item>): Promise<void> {
    try {
      await this.itemService.update(id, data);
      this.message.success('項目已更新');
      await this.loadItems();
    } catch (error) {
      console.error('[ItemListComponent] ❌ Failed to update item:', error);
      this.message.error('更新項目失敗');
    }
  }
  
  async deleteItem(item: Item): Promise<void> {
    try {
      await this.itemService.delete(item.id);
      this.message.success('項目已刪除');
      await this.loadItems();
    } catch (error) {
      console.error('[ItemListComponent] ❌ Failed to delete item:', error);
      this.message.error('刪除項目失敗');
    }
  }
}
```

---

## ✅ 最終檢查清單

### 必須項目 (100% 要求)
- [ ] ✅ Standalone Component
- [ ] ✅ SHARED_IMPORTS
- [ ] ✅ OnPush 變更偵測
- [ ] ✅ 使用 inject() 注入依賴
- [ ] ✅ 使用新控制流語法 (@if, @for, @switch)
- [ ] ✅ 所有 @for 都有 track 表達式
- [ ] ✅ 使用 Signals 管理狀態
- [ ] ✅ 適當的錯誤處理

### 強烈推薦 (90% 場景適用)
- [ ] 🎯 使用 AsyncState 處理非同步數據
- [ ] 🎯 使用 Computed Signals 建立衍生狀態
- [ ] 🎯 Modal 使用元件模式
- [ ] 🎯 使用 ModalHelper.createStatic()
- [ ] 🎯 動態導入 Modal/Drawer
- [ ] 🎯 統一的錯誤訊息模式

### 可選項目 (視需求而定)
- [ ] 📌 使用 Drawer 顯示詳細資訊
- [ ] 📌 使用 Effect 處理副作用
- [ ] 📌 編寫單元測試
- [ ] 📌 編寫 JSDoc 註解

---

## 🚨 常見錯誤

### ❌ 不要這樣做

```typescript
// ❌ 使用傳統的 NgModule
@NgModule({
  declarations: [MyComponent],
  imports: [CommonModule]
})
export class MyModule {}

// ❌ Constructor 注入
constructor(private service: Service) {}

// ❌ 使用舊控制流
<div *ngIf="show">...</div>
<div *ngFor="let item of items">...</div>

// ❌ 沒有 track 表達式
@for (item of items()) {
  <div>{{ item }}</div>
}

// ❌ 忘記調用 signal
{{ mySignal }}  // 錯誤！

// ❌ 在 computed 內修改狀態
readonly bad = computed(() => {
  this.loading.set(true);  // 不要這樣做！
  return this.data();
});

// ❌ 直接 DOM 操作
@ViewChild('modal') modal!: ElementRef;
this.modal.nativeElement.show();
```

### ✅ 應該這樣做

```typescript
// ✅ Standalone Component
@Component({
  standalone: true,
  imports: [SHARED_IMPORTS]
})

// ✅ inject() 注入
private readonly service = inject(Service);

// ✅ 使用新控制流
@if (show()) {
  <div>...</div>
}
@for (item of items(); track item.id) {
  <div>{{ item }}</div>
}

// ✅ 調用 signal
{{ mySignal() }}

// ✅ Computed 是純函數
readonly good = computed(() => 
  this.data().filter(item => item.active)
);

// ✅ 使用元件模式
this.modal.createStatic(ModalComponent, {});
```

---

## 📚 相關資源

- [提取的最佳實踐](./EXTRACTED_BEST_PRACTICES.md)
- [PR 現代化分析報告](./PR_MODERNIZATION_ANALYSIS.md)
- [快速參考指南](../.github/instructions/quick-reference.instructions.md)
- [Angular 現代特性](../.github/instructions/angular-modern-features.instructions.md)

---

**版本**: 1.0.0  
**最後更新**: 2025-12-10  
**適用專案**: GigHub v20.3.x
