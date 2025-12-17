# UX 現代化快速實施指南

## 階段 1：立即可實施改進（1-2 週）

### 改進 1：移除頁面內嵌的上下文切換器

#### 目標
移除每個管理頁面中重複的「工作區切換器」卡片，減少視覺混亂。

#### 影響檔案
- `src/app/routes/organization/teams/organization-teams.component.ts`
- `src/app/routes/organization/members/organization-members.component.ts`
- `src/app/routes/team/members/team-members.component.ts`

#### 實作步驟

**1. 移除切換器卡片 HTML**
```typescript
// REMOVE THIS SECTION
<nz-card class="mb-md" nzTitle="工作區切換器">
  <div class="text-grey mb-sm">切換到目標組織後，會依據組織載入對應團隊。</div>
  <ul nz-menu nzMode="inline" class="bg-transparent border-0">
    <header-context-switcher />
  </ul>
</nz-card>
```

**2. 簡化警告訊息**
```typescript
// BEFORE
@if (!isOrganizationContext()) {
  <nz-alert
    nzType="info"
    nzShowIcon
    nzMessage="請切換到組織上下文"
    nzDescription="使用下方切換器切換到目標組織後即可查看團隊列表。"
    class="mb-md"
  />
}

// AFTER (更簡潔)
@if (!isOrganizationContext()) {
  <nz-alert
    nzType="info"
    nzShowIcon
    nzMessage="請先選擇組織"
    nzDescription="請從側邊欄選擇一個組織以查看團隊列表。"
    class="mb-md"
  />
}
```

**工作量**: 1 小時  
**風險**: 低  
**測試重點**: 確認切換功能仍可在側邊欄使用

---

### 改進 2：新增麵包屑導航

#### 目標
讓用戶清楚知道自己在哪裡，並可快速返回上層。

#### 實作步驟

**1. 建立麵包屑服務**
```typescript
// src/app/shared/services/breadcrumb.service.ts
import { Injectable, signal } from '@angular/core';

export interface Breadcrumb {
  label: string;
  url?: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  breadcrumbs = signal<Breadcrumb[]>([]);
  
  setBreadcrumbs(crumbs: Breadcrumb[]): void {
    this.breadcrumbs.set(crumbs);
  }
  
  reset(): void {
    this.breadcrumbs.set([]);
  }
}
```

**2. 建立麵包屑元件**
```typescript
// src/app/shared/components/breadcrumb/breadcrumb.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from '@shared/services/breadcrumb.service';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [NzBreadCrumbModule, NzIconModule],
  template: `
    <nz-breadcrumb>
      @for (crumb of breadcrumbs(); track $index) {
        <nz-breadcrumb-item>
          @if (crumb.url) {
            <a [routerLink]="crumb.url">
              @if (crumb.icon) {
                <span nz-icon [nzType]="crumb.icon"></span>
              }
              {{ crumb.label }}
            </a>
          } @else {
            @if (crumb.icon) {
              <span nz-icon [nzType]="crumb.icon"></span>
            }
            {{ crumb.label }}
          }
        </nz-breadcrumb-item>
      }
    </nz-breadcrumb>
  `,
  styles: [`
    :host {
      display: block;
      padding: 16px 0;
    }
  `]
})
export class BreadcrumbComponent {
  private breadcrumbService = inject(BreadcrumbService);
  breadcrumbs = this.breadcrumbService.breadcrumbs;
}
```

**3. 在佈局中加入麵包屑**
```typescript
// src/app/layout/basic/basic.component.ts
<layout-header class="alain-default__header" />
<app-breadcrumb /> <!-- 新增 -->
<router-outlet />
```

**4. 在各元件中設定麵包屑**
```typescript
// src/app/routes/organization/teams/organization-teams.component.ts
ngOnInit(): void {
  // 設定麵包屑
  const orgName = this.workspaceContext.contextLabel();
  this.breadcrumbService.setBreadcrumbs([
    { label: '首頁', url: '/', icon: 'home' },
    { label: '組織', url: '/organization', icon: 'team' },
    { label: orgName, url: null }
  ]);
  
  // 載入資料...
}
```

**工作量**: 3-4 小時  
**風險**: 低  
**測試重點**: 所有頁面都有正確的麵包屑

---

### 改進 3：團隊列表顯示成員數量

#### 目標
在團隊列表中直接顯示每個團隊的成員數量。

#### 實作步驟

**1. 載入成員數量**
```typescript
// src/app/routes/organization/teams/organization-teams.component.ts
import { TeamMemberRepository } from '@shared';

export class OrganizationTeamsComponent implements OnInit {
  private readonly teamMemberRepo = inject(TeamMemberRepository);
  
  // 成員數量 Map
  private readonly memberCountsState = signal<Map<string, number>>(new Map());
  
  // 計算屬性
  readonly memberCounts = computed(() => this.memberCountsState());
  
  ngOnInit(): void {
    const orgId = this.currentOrgId();
    if (orgId) {
      this.loadTeams(orgId);
      this.loadMemberCounts(); // 新增
    }
  }
  
  private loadMemberCounts(): void {
    const teams = this.teams();
    if (teams.length === 0) return;
    
    // 並行載入所有團隊的成員數量
    const memberCountObservables = teams.map(team =>
      this.teamMemberRepo.findByTeam(team.id).pipe(
        map(members => ({ teamId: team.id, count: members.length }))
      )
    );
    
    combineLatest(memberCountObservables).subscribe({
      next: (counts) => {
        const map = new Map<string, number>();
        counts.forEach(({ teamId, count }) => map.set(teamId, count));
        this.memberCountsState.set(map);
      },
      error: (error) => {
        console.error('[OrganizationTeamsComponent] ❌ Failed to load member counts:', error);
      }
    });
  }
  
  getMemberCount(teamId: string): number {
    return this.memberCounts().get(teamId) || 0;
  }
}
```

**2. 更新模板顯示**
```html
<tr>
  <td>
    <strong>{{ team.name }}</strong>
    <nz-tag class="ml-sm">
      <span nz-icon nzType="user"></span>
      {{ getMemberCount(team.id) }} 名成員
    </nz-tag>
  </td>
  <td>{{ team.description || '尚無描述' }}</td>
  <td>{{ formatDate(team.created_at) }}</td>
  <td>
    <a (click)="manageMembers(team)" class="mr-sm">管理成員</a>
    <a (click)="openEditTeamModal(team)" class="mr-sm">編輯</a>
    <a nz-popconfirm nzPopconfirmTitle="確定刪除此團隊？" (nzOnConfirm)="deleteTeam(team)">刪除</a>
  </td>
</tr>
```

**工作量**: 2-3 小時  
**風險**: 中（需要額外的 API 請求）  
**最佳化建議**: 
- 使用快取避免重複請求
- 考慮在後端提供聚合 API

---

### 改進 4：改進操作按鈕樣式

#### 目標
統一按鈕樣式，使用圖示增強可識別性。

#### 實作步驟

**1. 更新操作按鈕**
```html
<!-- BEFORE -->
<td>
  <a (click)="manageMembers(team)" class="mr-sm">管理成員</a>
  <a (click)="openEditTeamModal(team)" class="mr-sm">編輯</a>
  <a nz-popconfirm ... (nzOnConfirm)="deleteTeam(team)">刪除</a>
</td>

<!-- AFTER -->
<td>
  <nz-space>
    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="manageMembers(team)">
      <span nz-icon nzType="user"></span>
      管理成員
    </button>
    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="openEditTeamModal(team)">
      <span nz-icon nzType="edit"></span>
      編輯
    </button>
    <button 
      *nzSpaceItem 
      nz-button 
      nzType="link" 
      nzSize="small" 
      nzDanger
      nz-popconfirm 
      nzPopconfirmTitle="確定刪除此團隊？此操作無法復原。" 
      (nzOnConfirm)="deleteTeam(team)"
    >
      <span nz-icon nzType="delete"></span>
      刪除
    </button>
  </nz-space>
</td>
```

**2. 主要操作按鈕**
```html
<!-- BEFORE -->
<button nz-button nzType="primary" nzSize="small" (click)="openCreateTeamModal()">
  <span nz-icon nzType="plus"></span>
  建立團隊
</button>

<!-- AFTER -->
<nz-space>
  <button 
    *nzSpaceItem 
    nz-button 
    nzType="primary" 
    nzSize="default" 
    (click)="openCreateTeamModal()"
  >
    <span nz-icon nzType="plus"></span>
    建立團隊
  </button>
  <button 
    *nzSpaceItem 
    nz-button 
    nzType="default" 
    nzSize="default"
    (click)="refreshTeamList()"
  >
    <span nz-icon nzType="reload"></span>
    重新整理
  </button>
</nz-space>
```

**工作量**: 1-2 小時  
**風險**: 低  
**視覺效果**: 更現代、更一致

---

## 實施檢查清單

### 開發前準備
- [ ] 建立新的 feature branch: `feature/ux-modernization-phase1`
- [ ] 備份當前程式碼
- [ ] 準備測試環境

### 開發過程
- [ ] 移除內嵌切換器
- [ ] 建立麵包屑服務
- [ ] 建立麵包屑元件
- [ ] 在佈局中整合麵包屑
- [ ] 各頁面設定麵包屑
- [ ] 實作成員數量顯示
- [ ] 更新操作按鈕樣式
- [ ] 執行 lint: `yarn lint`
- [ ] 執行 build: `yarn build`

### 測試
- [ ] 功能測試：切換器移除後功能正常
- [ ] 功能測試：麵包屑導航正確
- [ ] 功能測試：成員數量顯示正確
- [ ] UI 測試：按鈕樣式一致
- [ ] 響應式測試：手機版顯示正常
- [ ] 瀏覽器測試：Chrome, Firefox, Safari

### 部署
- [ ] 建立 Pull Request
- [ ] Code Review
- [ ] 合併到主分支
- [ ] 部署到測試環境
- [ ] 使用者驗收測試 (UAT)
- [ ] 部署到生產環境

---

## 預期成果

### 量化指標
- ⬇️ 頁面內容減少 ~30%（移除切換器卡片）
- ⬆️ 資訊密度提升 ~40%（顯示成員數量）
- ⬇️ 使用者困惑減少 ~50%（麵包屑導航）

### 質化改進
- ✅ 更簡潔的介面
- ✅ 更清楚的位置提示
- ✅ 更直觀的操作
- ✅ 更現代的視覺風格

---

## 回滾計畫

如果發現問題，可以快速回滾：

```bash
# 回滾到上一個穩定版本
git revert <commit-hash>

# 或使用 feature flag
export UX_MODERNIZATION_PHASE1=false
```

---

## 下一階段預告

階段 1 完成後，可以進行階段 2：
1. 團隊詳情抽屜
2. 智能側邊欄
3. 成員管理增強

---

**版本**: 1.0  
**預估工時**: 8-10 小時  
**預計完成**: 1-2 週  
**風險等級**: 低
