# GigHub Angular 現代化重構路線圖

> **Status**: Phase 1 完成 ✅, Phase 2 進行中 (10%)  
> **Last Updated**: 2025-12-10  
> **Author**: GitHub Copilot Agent

---

## 📋 執行摘要

本文件記錄 GigHub 專案的 Angular 20 現代化重構計畫，包含問題識別、解決方案設計、實施進度追蹤。

**發現**: 8 大類別問題，共 24+ 個具體實例  
**進度**: Phase 1 完成 (100%), Phase 2 開始 (10%)  
**預估剩餘**: 8-10 小時工作量

---

## 🎯 問題清單

### ❌ 問題 1: 手動訂閱模式 (10 個元件)

**影響**: 需要手動管理 subscribe/unsubscribe，容易造成記憶體洩漏

**元件清單**:
1. ✅ `OrganizationMembersComponent` - **已完成**
2. ⏳ `OrganizationTeamsComponent`
3. ⏳ `TeamMembersComponent`
4. ⏳ `BlueprintListComponent`
5. ⏳ `BlueprintDetailComponent`
6. ⏳ `BlueprintMembersComponent`
7. ⏳ `AuditLogsComponent`
8. ⏳ `BlueprintModalComponent`
9. ⏳ `LoginComponent`
10. ⏳ `TriggerComponent`

**解決方案**: 使用 `createAsyncState<T>()` 統一管理

---

### ✅ 問題 2: 缺少認證守衛 (路由層級)

**當前狀態**: 已在父路由配置 `authSimpleCanActivate` 和 `authSimpleCanActivateChild`

**結論**: 子路由繼承父守衛，當前配置已足夠 ✅

**建議**: 
- 可選：添加明確守衛到關鍵子路由
- 建議：添加整合測試驗證認證流程

---

### ❌ 問題 3: 無統一 Loading/Error 模式 (同問題 1)

**影響**: 每個元件都有不同的 loading/error 處理方式，不一致且容易出錯

**解決方案**: AsyncState 自動提供統一的 loading/error 狀態

**模板模式**:
```html
@if (state.loading()) {
  <nz-spin />
} @else if (state.error()) {
  <nz-alert
    nzType="error"
    [nzMessage]="'載入失敗'"
    [nzDescription]="state.error()?.message"
  />
} @else {
  <!-- 顯示資料 -->
}
```

---

### ✅ 問題 4: 舊控制流語法 (已完成)

**發現**: 2 個使用 `*ngFor` 的地方

**已遷移檔案**:
- ✅ `src/app/layout/basic/widgets/context-switcher.component.ts`
- ✅ `src/app/routes/blueprint/blueprint-detail.component.ts`
- ✅ `src/app/routes/blueprint/members/member-modal.component.ts`

**工具**: `ng generate @angular/core:control-flow-migration`

---

### ✅ 問題 5: 裝飾器 I/O (已完成)

**發現**: 2 個使用 `@Input()` 的地方

**已遷移檔案**:
- ✅ `src/app/routes/passport/register-result/register-result.component.ts`
  - `@Input() email = ''` → `email = input<string>('')`
- ✅ `src/app/routes/passport/callback.component.ts`
  - `@Input() type = ''` → `type = input<string>('')`

---

### ❌ 問題 6: 未使用 AsyncState (同問題 1)

**工具位置**: `src/app/shared/utils/async-state.ts`

**已實作**: `createAsyncState<T>()` 和 `createAsyncArrayState<T>()`

**使用範例**: 見下方 "AsyncState 使用指南"

---

### ❌ 問題 7: 無請求取消邏輯 (同問題 1)

**解決方案**: AsyncState 使用 Promise-based API，自動處理元件銷毀

**替代方案**: 使用 `takeUntilDestroyed(inject(DestroyRef))`

---

### ❌ 問題 8: 直接 DOM 操作 (3 個元件，6 個實例)

**受影響元件**:

#### OrganizationTeamsComponent (4 個實例)
- Line 156: `document.getElementById('teamName')`
- Line 157: `document.getElementById('teamDescription')`
- Line 208: `document.getElementById('editTeamName')`
- Line 209: `document.getElementById('editTeamDescription')`

#### TeamMembersComponent (2 個實例)
- Line 171: `document.getElementById('userId')`
- Line 172: `document.getElementById('role')`

**解決方案**: 建立專用 Modal 元件 (見下方 "Modal 元件範本")

---

## 📖 AsyncState 使用指南

### 基本用法

```typescript
import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { createAsyncArrayState } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `
    @if (usersState.loading()) {
      <nz-spin />
    } @else if (usersState.error()) {
      <nz-alert
        nzType="error"
        [nzMessage]="'載入失敗'"
        [nzDescription]="usersState.error()?.message"
      />
    } @else {
      @for (user of usersState.data(); track user.id) {
        <div>{{ user.name }}</div>
      }
    }
  `
})
export class ExampleComponent {
  private readonly userService = inject(UserService);
  
  // ✅ 建立 AsyncState
  readonly usersState = createAsyncArrayState<User>([]);
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  // ✅ 載入資料
  private async loadUsers(): Promise<void> {
    try {
      await this.usersState.load(
        firstValueFrom(this.userService.getUsers())
      );
    } catch (error) {
      console.error('Failed to load users:', error);
      // Error 已自動由 AsyncState 管理
    }
  }
  
  // ✅ 重新整理
  async refresh(): Promise<void> {
    await this.loadUsers();
  }
}
```

### 陣列操作

```typescript
// 新增項目
usersState.add(newUser);

// 移除項目
usersState.remove(user => user.id === '123');

// 更新項目
usersState.update(
  user => user.id === '123',
  user => ({ ...user, name: 'New Name' })
);

// 取得長度
const length = usersState.length();

// 檢查是否為空
const isEmpty = usersState.isEmpty();
```

### 直接設定資料 (樂觀更新)

```typescript
// 立即更新 UI，不等待 API
usersState.setData([...usersState.data(), newUser]);

// 之後同步到後端
await this.userService.createUser(newUser);
```

---

## 🏗️ Modal 元件範本

### TeamModalComponent 範例

```typescript
// team-modal.component.ts
import { Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { Team } from '@core';

@Component({
  selector: 'app-team-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <nz-form-item>
        <nz-form-label nzRequired>團隊名稱</nz-form-label>
        <nz-form-control nzErrorTip="請輸入團隊名稱">
          <input nz-input formControlName="name" placeholder="請輸入團隊名稱" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label>描述</nz-form-label>
        <nz-form-control>
          <textarea 
            nz-input 
            formControlName="description" 
            placeholder="請輸入團隊描述（選填）" 
            rows="3"
          ></textarea>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class TeamModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  
  // 如果有傳入 team，則為編輯模式
  team = input<Team | null>(null);
  
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });
  
  ngOnInit(): void {
    // 編輯模式：填充表單
    const team = this.team();
    if (team) {
      this.form.patchValue({
        name: team.name,
        description: team.description
      });
    }
  }
  
  // ModalHelper 會呼叫這個方法取得資料
  getData(): { name: string; description: string | null } {
    return {
      name: this.form.value.name.trim(),
      description: this.form.value.description?.trim() || null
    };
  }
  
  // 驗證表單
  isValid(): boolean {
    return this.form.valid;
  }
}
```

### 使用 Modal 元件

```typescript
// organization-teams.component.ts
import { Component, inject } from '@angular/core';
import { ModalHelper } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd/message';

export class OrganizationTeamsComponent {
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);
  
  // ✅ 建立團隊
  async openCreateTeamModal(): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(TeamModalComponent, {}, { size: 'md' })
      .subscribe(async (component) => {
        if (component && component.isValid()) {
          const data = component.getData();
          await this.createTeam(data);
        }
      });
  }
  
  // ✅ 編輯團隊
  async openEditTeamModal(team: Team): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(
        TeamModalComponent, 
        { team }, // 傳入 team 進入編輯模式
        { size: 'md' }
      )
      .subscribe(async (component) => {
        if (component && component.isValid()) {
          const data = component.getData();
          await this.updateTeam(team.id, data);
        }
      });
  }
  
  private async createTeam(data: { name: string; description: string | null }): Promise<void> {
    const orgId = this.currentOrgId();
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }
    
    try {
      await this.teamRepository.create({
        organization_id: orgId,
        ...data
      });
      this.message.success('團隊已建立');
      await this.refresh();
    } catch (error) {
      console.error('Failed to create team:', error);
      this.message.error('建立團隊失敗');
    }
  }
  
  private async updateTeam(
    id: string, 
    data: { name: string; description: string | null }
  ): Promise<void> {
    try {
      await this.teamRepository.update(id, data);
      this.message.success('團隊已更新');
      await this.refresh();
    } catch (error) {
      console.error('Failed to update team:', error);
      this.message.error('更新團隊失敗');
    }
  }
}
```

---

## 🚀 實施步驟

### Phase 2: AsyncState 重構

建議順序 (從簡單到複雜):

#### 1. 簡單列表元件 (3 個)
- [x] OrganizationMembersComponent ✅
- [ ] BlueprintMembersComponent (1 小時)
- [ ] AuditLogsComponent (1 小時)

**特徵**: 只有讀取操作，無 CRUD

#### 2. CRUD 元件 (3 個)
- [ ] OrganizationTeamsComponent (1.5 小時，需建立 Modal)
- [ ] TeamMembersComponent (1.5 小時，需建立 Modal)
- [ ] BlueprintModalComponent (1 小時)

**特徵**: 有建立/更新/刪除操作

#### 3. 複雜邏輯元件 (4 個)
- [ ] BlueprintListComponent (1 小時，已部分現代化)
- [ ] BlueprintDetailComponent (1 小時)
- [ ] LoginComponent (0.5 小時)
- [ ] TriggerComponent (0.5 小時)

**特徵**: 有複雜的業務邏輯或狀態管理

---

### Phase 3: 移除 DOM 操作

#### 步驟 1: 建立 Modal 元件
- [ ] 建立 `team-modal.component.ts` (0.5 小時)
- [ ] 建立 `team-member-modal.component.ts` (0.5 小時)

#### 步驟 2: 重構元件
- [ ] 重構 `OrganizationTeamsComponent` (1 小時)
- [ ] 重構 `TeamMembersComponent` (1 小時)

#### 步驟 3: 驗證
- [ ] 測試建立功能 (0.5 小時)
- [ ] 測試編輯功能 (0.5 小時)
- [ ] 測試刪除功能 (0.5 小時)

---

### Phase 4: 測試與驗證

#### 編譯與建構
- [ ] 執行 `yarn ng build` 確認無錯誤
- [ ] 檢查 bundle 大小是否合理

#### 程式碼品質
- [ ] 修復 ESLint 配置問題
- [ ] 執行 `yarn lint` 確認無錯誤
- [ ] 執行 `yarn test` 確認測試通過

#### 手動測試
- [ ] 測試所有重構的元件
- [ ] 測試 loading 狀態顯示
- [ ] 測試 error 狀態處理
- [ ] 測試 CRUD 操作

#### 效能測試
- [ ] 檢查記憶體洩漏
- [ ] 測試大量資料載入
- [ ] 驗證 OnPush 策略運作

---

## 📊 進度追蹤

### 元件重構狀態

| 元件 | AsyncState | Modal | DOM | 狀態 |
|------|-----------|-------|-----|------|
| OrganizationMembersComponent | ✅ | N/A | N/A | ✅ 完成 |
| OrganizationTeamsComponent | ⏳ | ⏳ | ⏳ | 🔄 進行中 |
| TeamMembersComponent | ⏳ | ⏳ | ⏳ | ⏳ 待開始 |
| BlueprintListComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| BlueprintDetailComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| BlueprintMembersComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| AuditLogsComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| BlueprintModalComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| LoginComponent | ⏳ | N/A | N/A | ⏳ 待開始 |
| TriggerComponent | ⏳ | N/A | N/A | ⏳ 待開始 |

### 整體進度

```
Phase 1: 自動化遷移     ████████████████████████████████ 100%
Phase 2: AsyncState      ███░░░░░░░░░░░░░░░░░░░░░░░░░░░  10%
Phase 3: 移除 DOM 操作   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: 測試驗證       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%

總進度:                ████████░░░░░░░░░░░░░░░░░░░░░░  28%
```

---

## 🎯 品質檢查清單

### 程式碼品質
- [x] 零舊控制流語法 (`*ngIf`, `*ngFor`) ✅
- [x] 零裝飾器 I/O (`@Input`, `@Output`) ✅
- [ ] 零直接 DOM 操作 (0/6)
- [ ] 所有非同步操作使用 AsyncState (1/10)
- [ ] 所有訂閱自動清理 (1/10)

### 架構品質
- [ ] 統一的 loading/error 處理模式 (1/10)
- [ ] 可重用的 Modal Components (0/2)
- [x] 明確的認證守衛配置 ✅

### 測試品質
- [x] TypeScript 編譯通過 ✅
- [ ] ESLint 無錯誤
- [ ] 單元測試通過
- [ ] 手動功能測試通過
- [ ] 無記憶體洩漏

---

## 💡 最佳實踐

### Do's ✅

1. **使用 AsyncState**: 統一的非同步狀態管理
2. **使用 Modal 元件**: 避免直接 DOM 操作
3. **使用新控制流**: `@if`, `@for`, `@switch`
4. **使用 input()/output()**: 取代裝飾器
5. **使用 computed()**: 衍生狀態
6. **使用 effect()**: 副作用處理
7. **使用 OnPush**: 提升效能
8. **使用 takeUntilDestroyed()**: 自動清理

### Don'ts ❌

1. ❌ 手動 subscribe/unsubscribe
2. ❌ 直接 DOM 操作 (document.getElementById)
3. ❌ 使用 `*ngIf`, `*ngFor` (舊語法)
4. ❌ 使用 `@Input()`, `@Output()` (裝飾器)
5. ❌ 手動管理 loading/error 狀態
6. ❌ 在模板中使用字串拼接
7. ❌ 忘記取消訂閱
8. ❌ 使用 `any` 型別

---

## 📚 相關資源

### 專案文件
- [AsyncState 工具](../src/app/shared/utils/async-state.ts)
- [Copilot Instructions](../.github/copilot-instructions.md)
- [Angular 現代化指南](../.github/instructions/angular-modern-features.instructions.md)

### 官方文檔
- [Angular 20 文檔](https://angular.dev)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular 新控制流](https://angular.dev/api/core/if)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)

### 社群資源
- [Angular Blog](https://blog.angular.dev)
- [Angular Updates](https://update.angular.io)

---

## 🔄 變更記錄

### 2025-12-10
- ✅ 完成 Phase 1: 自動化遷移 (5 檔案)
- ✅ 完成 Phase 2.1: OrganizationMembersComponent
- 📝 建立此路線圖文件

### 待更新
- 隨著進度更新各 Phase 完成狀態
- 記錄遇到的問題與解決方案
- 更新預估時間與實際時間

---

## 🤝 貢獻指南

### 如何參與

1. **選擇任務**: 從待辦清單選擇一個元件
2. **遵循模式**: 使用本文件的範本和範例
3. **測試驗證**: 確保變更通過編譯和測試
4. **更新進度**: 在進度追蹤表中標記完成

### 提交規範

```bash
# 標準提交訊息格式
Phase 2.X: Refactor [ComponentName] to use AsyncState

# 或
Phase 3.X: Create [ModalName] and remove DOM manipulation

# 範例
Phase 2.2: Refactor OrganizationTeamsComponent to use AsyncState
Phase 3.1: Create TeamModalComponent and remove DOM manipulation
```

---

**Last Updated**: 2025-12-10  
**Maintainer**: GitHub Copilot Agent  
**Status**: Living Document - 持續更新中
