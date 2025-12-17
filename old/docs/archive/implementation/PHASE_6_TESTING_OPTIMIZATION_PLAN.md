# Phase 6: 測試與優化實施計畫

## 概述

基於 ⭐.md 流程和奧卡姆剃刀原則（Occam's Razor），為任務模組右鍵選單系統實施完整的測試覆蓋和性能優化。

## 實施目標

### 1. 單元測試（Unit Tests）
**目標**: 測試 Repository、Store 和 Service 層的業務邏輯
**覆蓋率目標**: >80%

### 2. 元件測試（Component Tests）
**目標**: 測試 TaskContextMenuComponent 的渲染和互動
**覆蓋率目標**: >70%

### 3. E2E 測試（End-to-End Tests）
**目標**: 測試完整的使用者流程
**覆蓋範圍**: 關鍵功能路徑

### 4. 性能優化（Performance Optimization）
**目標**: 優化選單響應時間和記憶體使用
**指標**: 選單開啟 <100ms，記憶體無洩漏

### 5. 甘特圖拖曳功能（可選）
**目標**: 使用 Angular CDK 實現任務時間範圍拖曳
**原則**: 僅在用戶測試確認需求後實施

## 技術方案

### 1. 單元測試方案

#### Repository 測試 (tasks.repository.spec.ts)

```typescript
import { TestBed } from '@angular/core/testing';
import { TasksRepository } from './tasks.repository';
import { AngularFirestore } from '@angular/fire/compat/firestore';

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let firestoreMock: jasmine.SpyObj<AngularFirestore>;

  beforeEach(() => {
    const firestoreSpy = jasmine.createSpyObj('AngularFirestore', ['collection']);
    
    TestBed.configureTestingModule({
      providers: [
        TasksRepository,
        { provide: AngularFirestore, useValue: firestoreSpy }
      ]
    });
    
    repository = TestBed.inject(TasksRepository);
    firestoreMock = TestBed.inject(AngularFirestore) as jasmine.SpyObj<AngularFirestore>;
  });

  describe('createChildTask', () => {
    it('應該建立子任務並自動設定 parentId', async () => {
      // Test implementation
    });

    it('應該繼承父任務的 blueprintId', async () => {
      // Test implementation
    });
  });

  describe('cloneTask', () => {
    it('應該複製任務的所有屬性', async () => {
      // Test implementation
    });

    it('應該重置日期當 options.resetDates = true', async () => {
      // Test implementation
    });
  });

  describe('getChildren', () => {
    it('應該只返回直接子任務', async () => {
      // Test implementation
    });

    it('應該排除已刪除的任務', async () => {
      // Test implementation
    });
  });
});
```

**測試重點**:
- ✅ 所有新增方法有測試覆蓋
- ✅ 邊界情況處理
- ✅ 錯誤處理
- ✅ Mock Firestore 操作

#### Store 測試 (task.store.spec.ts)

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { TasksRepository } from './tasks.repository';
import { EventBusService } from '@core/services/event-bus.service';

describe('TaskStore', () => {
  let store: TaskStore;
  let repositoryMock: jasmine.SpyObj<TasksRepository>;
  let eventBusMock: jasmine.SpyObj<EventBusService>;

  beforeEach(() => {
    const repoSpy = jasmine.createSpyObj('TasksRepository', [
      'createChildTask',
      'cloneTask',
      'getChildren'
    ]);
    const eventSpy = jasmine.createSpyObj('EventBusService', ['emit']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TasksRepository, useValue: repoSpy },
        { provide: EventBusService, useValue: eventSpy }
      ]
    });
    
    store = TestBed.inject(TaskStore);
    repositoryMock = TestBed.inject(TasksRepository) as jasmine.SpyObj<TasksRepository>;
    eventBusMock = TestBed.inject(EventBusService) as jasmine.SpyObj<EventBusService>;
  });

  describe('createChildTask', () => {
    it('應該調用 repository 並發送 TASK_CHILD_CREATED 事件', async () => {
      // Test implementation
    });

    it('應該記錄 Audit Log', async () => {
      // Test implementation
    });

    it('應該更新 Signal 狀態', async () => {
      // Test implementation
    });
  });

  describe('cloneTask', () => {
    it('應該發送 TASK_CLONED 事件', async () => {
      // Test implementation
    });
  });
});
```

**測試重點**:
- ✅ EventBus 整合驗證
- ✅ Audit Log 記錄驗證
- ✅ Signal 狀態更新驗證
- ✅ Repository 調用正確性

#### Service 測試 (task-context-menu.service.spec.ts)

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskContextMenuService } from './task-context-menu.service';
import { ACLService } from '@delon/acl';

describe('TaskContextMenuService', () => {
  let service: TaskContextMenuService;
  let aclMock: jasmine.SpyObj<ACLService>;

  beforeEach(() => {
    const aclSpy = jasmine.createSpyObj('ACLService', ['can']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskContextMenuService,
        { provide: ACLService, useValue: aclSpy }
      ]
    });
    
    service = TestBed.inject(TaskContextMenuService);
    aclMock = TestBed.inject(ACLService) as jasmine.SpyObj<ACLService>;
  });

  describe('buildMenuItems', () => {
    it('應該根據權限過濾選單項目', () => {
      // Test implementation
    });

    it('應該根據視圖類型提供不同的選單項目', () => {
      // Test implementation
    });
  });

  describe('openMenu', () => {
    it('應該設定選單配置並發送事件', () => {
      // Test implementation
    });
  });
});
```

**測試重點**:
- ✅ 權限檢查邏輯
- ✅ 視圖特定選單項目
- ✅ Signal 狀態管理
- ✅ 事件發送驗證

### 2. 元件測試方案

#### TaskContextMenuComponent 測試

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskContextMenuComponent } from './task-context-menu.component';
import { TaskContextMenuService } from '../../services/task-context-menu.service';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';

describe('TaskContextMenuComponent', () => {
  let component: TaskContextMenuComponent;
  let fixture: ComponentFixture<TaskContextMenuComponent>;
  let service: TaskContextMenuService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskContextMenuComponent, NzDropdownModule],
      providers: [TaskContextMenuService]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TaskContextMenuComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TaskContextMenuService);
    fixture.detectChanges();
  });

  it('應該正確渲染選單項目', () => {
    // Test implementation
  });

  it('應該在點擊選單項目時發送正確的事件', () => {
    // Test implementation
  });

  it('應該根據權限隱藏/顯示選單項目', () => {
    // Test implementation
  });

  it('應該正確渲染子選單', () => {
    // Test implementation
  });
});
```

**測試重點**:
- ✅ 選單渲染正確性
- ✅ 點擊事件處理
- ✅ 權限控制顯示
- ✅ 子選單功能

### 3. E2E 測試方案

使用 Playwright 進行端對端測試：

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blueprint/tasks');
  });

  test('樹狀視圖: 右鍵顯示選單並建立子任務', async ({ page }) => {
    // 1. 右鍵點擊任務節點
    await page.locator('.task-tree-node').first().click({ button: 'right' });
    
    // 2. 驗證選單顯示
    await expect(page.locator('.task-context-menu')).toBeVisible();
    
    // 3. 點擊「建立子任務」
    await page.locator('text=建立子任務').click();
    
    // 4. 驗證對話框出現
    await expect(page.locator('.task-create-dialog')).toBeVisible();
  });

  test('看板視圖: 右鍵複製任務', async ({ page }) => {
    // Test implementation
  });

  test('列表視圖: 更多按鈕顯示選單', async ({ page }) => {
    // Test implementation
  });
});
```

**測試重點**:
- ✅ 完整使用者流程
- ✅ 跨視圖功能一致性
- ✅ 錯誤處理
- ✅ 用戶回饋訊息

### 4. 性能優化方案

#### 選單響應時間優化

```typescript
// 使用 memo 和 computed 優化選單項目計算
private menuItems = computed(() => {
  const config = this.menuConfig();
  if (!config) return [];
  
  // 使用 memo 避免重複計算
  return this.buildMenuItemsMemo(config);
});

private buildMenuItemsMemo = memoize((config: TaskContextMenuConfig) => {
  // Menu building logic
});
```

**優化策略**:
- ✅ 使用 `computed()` 避免不必要的重新計算
- ✅ Memoize 複雜計算
- ✅ 延遲載入圖標資源
- ✅ 使用 OnPush 變更檢測

#### 記憶體優化

```typescript
// 確保組件銷毀時清理
ngOnDestroy(): void {
  this.menuConfig.set(null);
  this.selectedTask.set(null);
}
```

**優化策略**:
- ✅ 適當清理 Signal 引用
- ✅ 取消訂閱 Observable
- ✅ 移除事件監聽器
- ✅ 清理 DOM 引用

### 5. 甘特圖拖曳功能（可選）

#### 使用 Angular CDK Drag Drop

```typescript
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-gantt-view',
  template: `
    <div class="gantt-timeline">
      @for (task of tasks(); track task.id) {
        <div class="task-bar"
             cdkDrag
             [cdkDragBoundary]="'.gantt-timeline'"
             [cdkDragFreeDragPosition]="getTaskPosition(task)"
             (cdkDragEnded)="onTaskDragEnd($event, task)">
          {{ task.title }}
        </div>
      }
    </div>
  `
})
export class TaskGanttViewComponent {
  onTaskDragEnd(event: CdkDragEnd, task: Task): void {
    // 1. 計算新的日期範圍
    const newDates = this.calculateNewDates(event.distance, task);
    
    // 2. 更新任務
    this.taskStore.updateTask(task.blueprintId, task.id, {
      startDate: newDates.start,
      endDate: newDates.end
    }, this.currentUserId);
    
    // 3. 顯示成功訊息
    this.message.success('任務時間已更新');
  }

  private calculateNewDates(distance: Point, task: Task): { start: Date; end: Date } {
    // 根據拖曳距離計算新日期
    const daysOffset = Math.round(distance.x / this.dayWidth);
    const start = addDays(task.startDate, daysOffset);
    const end = addDays(task.endDate, daysOffset);
    return { start, end };
  }
}
```

**實施重點**:
- ✅ 僅支援水平拖曳（時間軸方向）
- ✅ 使用 Angular CDK（標準方案，無新依賴）
- ✅ 精確的像素到日期轉換
- ✅ 邊界檢查（任務不超出時間軸）
- ✅ 與 Store 整合更新
- ✅ Audit Log 記錄

## 實施順序（基於 ⭐.md）

### Step 1: 單元測試（1.5 天）
1. 設定測試環境配置
2. 編寫 Repository 測試
3. 編寫 Store 測試
4. 編寫 Service 測試
5. 確保 >80% 覆蓋率

### Step 2: 元件測試（0.5 天）
1. 設定元件測試環境
2. 編寫 TaskContextMenuComponent 測試
3. 測試渲染和互動
4. 確保 >70% 覆蓋率

### Step 3: E2E 測試（1 天）
1. 設定 Playwright 環境
2. 編寫關鍵流程測試
3. 測試跨視圖一致性
4. 測試錯誤處理

### Step 4: 性能優化（0.5 天）
1. 分析性能瓶頸
2. 實施 computed/memo 優化
3. 確保記憶體無洩漏
4. 驗證選單響應時間 <100ms

### Step 5: 甘特圖拖曳（1-1.5 天，可選）
1. 導入 Angular CDK Drag Drop
2. 實施拖曳邏輯
3. 日期計算與邊界檢查
4. 與 Store 整合
5. 測試功能

### Step 6: 整合驗證（0.5 天）
1. 運行所有測試
2. 運行 yarn build
3. 運行 yarn lint
4. 手動測試所有功能
5. 性能基準測試

**總計**: 3-4 天（甘特圖拖曳為可選）

## 測試工具選擇（奧卡姆剃刀原則）

### 單元測試: Jasmine + Karma
**原因**: Angular 預設測試框架，無需額外配置

### 元件測試: Angular TestBed
**原因**: Angular 官方測試工具，最佳整合

### E2E 測試: Playwright
**原因**: 現代化、快速、跨瀏覽器支援

### 覆蓋率: Istanbul/nyc
**原因**: Angular CLI 內建支援

### 性能分析: Chrome DevTools
**原因**: 標準工具，無需安裝

## 架構符合性

✅ 三層架構（Repository → Store → Component）
✅ Signal 狀態管理
✅ EventBus 整合
✅ Audit 日誌記錄
✅ 最小化依賴（奧卡姆剃刀）
✅ 使用標準工具（Angular 生態）
✅ 保持一致性（與現有測試對齊）

## 成功標準

- ✅ 單元測試覆蓋率 >80%
- ✅ 元件測試覆蓋率 >70%
- ✅ E2E 測試通過所有關鍵流程
- ✅ 選單響應時間 <100ms
- ✅ 無記憶體洩漏
- ✅ 通過 yarn build（無編譯錯誤）
- ✅ 通過 yarn lint（無 lint 錯誤）
- ✅ 通過 yarn test（所有測試通過）
- ✅ 符合奧卡姆剃刀原則（最簡方案）

## 風險與限制

**測試**:
- 測試環境設定可能需要調整
- Mock 服務可能需要額外配置
- E2E 測試可能需要測試資料準備

**性能**:
- 複雜選單可能需要額外優化
- 大量任務可能影響渲染性能

**甘特圖拖曳**:
- 日期計算需要精確處理時區
- 依賴關係可能需要重新計算
- 拖曳衝突需要處理（任務重疊）

## 延後功能（Phase 7+）

以下功能複雜度高，建議延後至用戶測試後決定：

1. **Timeline 視圖整合** - 視圖存在但使用率可能較低
2. **批次操作** - 複雜度高，需求不明確
3. **搜尋功能** - 可用全域搜尋替代
4. **依賴管理視覺化** - 需要圖形計算庫

## 建議

**立即實施**: Step 1-4（測試與性能優化）
- 確保程式碼品質
- 驗證功能正確性
- 為生產環境做準備

**用戶測試後決定**: Step 5（甘特圖拖曳）
- 收集用戶回饋
- 確認實際需求
- 評估投資報酬率

**Phase 7+ 功能**: 根據用戶測試結果優先排序
- 以數據驅動決策
- 避免過度設計
- 保持系統簡潔（奧卡姆剃刀）
