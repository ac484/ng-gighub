# Monitoring 與 Module-Manager 重構方案 (簡化版)

> 快速參考：架構重構建議與實施方案

## 🎯 核心結論

### Module-Manager ❌ 位置錯誤
**現況**: `src/app/routes/module-manager` (根層級)  
**問題**: 實際上是 Blueprint-scoped 功能，但放在全域路由  
**建議**: 移至 `src/app/routes/blueprint/` 內部

### Monitoring ⚠️ 可以優化
**現況**: `src/app/routes/monitoring` (根層級)  
**性質**: 全域系統監控，位置合理  
**建議**: 重命名為 `admin` 以擴展為系統管理中心

---

## 📊 功能性質比較

| 特性 | Monitoring | Module-Manager |
|------|-----------|----------------|
| **功能範圍** | 全域應用程式 | 特定 Blueprint |
| **依賴 Blueprint** | ❌ 否 | ✅ 是 (需要 blueprintId) |
| **目標用戶** | 系統管理員 | Blueprint Owner/Admin |
| **權限層級** | 系統級 | Blueprint 級 |
| **當前位置** | ⚠️ 可優化 | ❌ 錯誤 |

---

## 🔧 推薦方案

### 方案 1: Module-Manager 整合到 Blueprint (高優先級 🔴)

#### 目標路由結構
```
/blueprints/user/:id/modules        ← 模組管理器
/blueprints/user/:id/overview       ← 藍圖概覽
/blueprints/user/:id/members        ← 成員管理
```

#### 新檔案結構
```
src/app/routes/blueprint/
├── blueprint-list.component.ts
├── blueprint-detail.component.ts
├── modules/
│   ├── manager/                      ← 移至此處
│   │   ├── module-manager.component.ts
│   │   ├── components/
│   │   ├── module-manager.service.ts
│   │   └── index.ts
│   ├── issues/
│   ├── cloud/
│   └── ...
└── routes.ts
```

#### 路由配置
```typescript
// src/app/routes/blueprint/routes.ts
export const routes: Routes = [
  {
    path: ':id',
    component: BlueprintDetailComponent,
    children: [
      {
        path: 'modules',
        component: ModuleManagerComponent,
        data: { title: '模組管理' }
      },
      {
        path: 'overview',
        component: BlueprintOverviewComponent
      }
    ]
  }
];

// 向後相容重定向
// src/app/routes/routes.ts
{
  path: 'module-manager/:id',
  redirectTo: 'blueprints/user/:id/modules',
  pathMatch: 'full'
}
```

#### Blueprint Detail 整合

**選項 A: Tab 模式**
```typescript
@Component({
  template: `
    <nz-tabset>
      <nz-tab nzTitle="概覽">
        <app-blueprint-overview />
      </nz-tab>
      <nz-tab nzTitle="模組管理">
        <app-module-manager />
      </nz-tab>
      <nz-tab nzTitle="成員管理">
        <app-members-view />
      </nz-tab>
    </nz-tabset>
  `
})
```

**選項 B: 子路由模式 (推薦)**
```typescript
@Component({
  template: `
    <nz-menu nzMode="horizontal">
      <li nz-menu-item [routerLink]="['overview']">概覽</li>
      <li nz-menu-item [routerLink]="['modules']">模組管理</li>
      <li nz-menu-item [routerLink]="['members']">成員管理</li>
    </nz-menu>
    <router-outlet />
  `
})
```

#### 實施步驟

```bash
# 1. 移動檔案
mv src/app/routes/module-manager src/app/routes/blueprint/modules/manager

# 2. 更新匯入路徑 (TypeScript 會自動提示)

# 3. 更新路由配置
# - src/app/routes/blueprint/routes.ts (新增子路由)
# - src/app/routes/routes.ts (移除舊路由，新增重定向)

# 4. 更新元件 (從 route.params 改為 route.parent?.params)

# 5. 測試
npm run test
npm run e2e
```

#### 優點 ✅
- ✅ 符合 Blueprint-scoped 功能定位
- ✅ 路由結構清楚表達依賴關係
- ✅ 用戶體驗一致：在 Blueprint 內部管理模組
- ✅ 權限控制正確：由 Blueprint 權限控制訪問
- ✅ 符合架構設計原則

#### 預估工作量
- **時間**: 7.5 小時 (~1 天)
- **複雜度**: 中等 (5/10)

---

### 方案 2: Monitoring 重命名為 Admin (中優先級 ⚠️)

#### 目標路由結構
```
/admin/monitoring        ← 系統監控
/admin/users            ← 未來：用戶管理
/admin/settings         ← 未來：系統設定
```

#### 最小化變更 (推薦)
```typescript
// src/app/routes/routes.ts
{
  path: 'admin',
  canActivate: [systemAdminGuard],
  children: [
    {
      path: '',
      redirectTo: 'monitoring',
      pathMatch: 'full'
    },
    {
      path: 'monitoring',
      loadChildren: () => import('./monitoring/routes').then(m => m.routes),
      data: { title: '系統監控' }
    }
  ]
}

// 向後相容
{
  path: 'monitoring',
  redirectTo: 'admin/monitoring',
  pathMatch: 'full'
}
```

#### 實施步驟
```bash
# 1. 更新路由配置
# - src/app/routes/routes.ts (重命名路由為 admin)

# 2. 新增 system-admin.guard.ts (權限檢查)

# 3. 更新導航菜單

# 4. 測試
npm run test
```

#### 優點 ✅
- ✅ 清楚定義系統管理功能區域
- ✅ 易於擴展未來的系統管理功能
- ✅ 權限控制明確
- ✅ 符合企業應用的管理中心模式

#### 預估工作量
- **時間**: 3.5 小時 (~0.5 天)
- **複雜度**: 低-中等 (4/10)

---

## 📋 實施檢查清單

### Phase 1: Module-Manager 重構 (必須執行)

- [ ] **步驟 1**: 備份現有程式碼
- [ ] **步驟 2**: 移動檔案到新位置
  - [ ] `src/app/routes/module-manager` → `src/app/routes/blueprint/modules/manager`
- [ ] **步驟 3**: 更新路由配置
  - [ ] 更新 `src/app/routes/blueprint/routes.ts` (新增子路由)
  - [ ] 更新 `src/app/routes/routes.ts` (移除舊路由)
  - [ ] 新增重定向規則
- [ ] **步驟 4**: 更新元件
  - [ ] ModuleManagerComponent: `route.params` → `route.parent?.params`
  - [ ] 更新所有匯入路徑
- [ ] **步驟 5**: 更新 Blueprint Detail Component
  - [ ] 新增模組管理 Tab 或子路由選單
  - [ ] 整合 ModuleManagerComponent
- [ ] **步驟 6**: 測試
  - [ ] 單元測試通過
  - [ ] 路由導航正常
  - [ ] 模組 CRUD 功能正常
  - [ ] 重定向正常運作
- [ ] **步驟 7**: 更新文檔
  - [ ] `README.md`
  - [ ] `AGENTS.md`
  - [ ] 架構文檔

### Phase 2: Monitoring 優化 (可選執行)

- [ ] **步驟 1**: 更新路由配置
  - [ ] 重命名為 `admin`
  - [ ] 新增重定向
- [ ] **步驟 2**: 新增權限檢查
  - [ ] 實作 `systemAdminGuard`
  - [ ] 應用到 admin 路由
- [ ] **步驟 3**: 更新導航
  - [ ] 更新菜單項目
  - [ ] 更新圖標和標題
- [ ] **步驟 4**: 測試
  - [ ] 路由導航正常
  - [ ] 權限檢查正常
  - [ ] 重定向正常運作
- [ ] **步驟 5**: 更新文檔

---

## 🎯 驗收標準

### Module-Manager
- [x] 可從 `/blueprints/user/:id/modules` 訪問
- [x] 舊路由 `/module-manager/:id` 自動重定向
- [x] 在 Blueprint Detail 內顯示（Tab 或子路由）
- [x] 正確載入特定 Blueprint 的模組
- [x] 所有 CRUD 操作正常
- [x] 權限控制正確（Blueprint 級別）

### Monitoring (如執行)
- [x] 可從 `/admin/monitoring` 訪問
- [x] 舊路由 `/monitoring` 自動重定向
- [x] 只有系統管理員可訪問
- [x] 導航菜單正確顯示

---

## ⏱️ 時間估算

| 任務 | 預估時間 | 優先級 |
|------|----------|--------|
| Module-Manager 重構 | 7.5 小時 | 🔴 高 |
| Monitoring 優化 | 3.5 小時 | ⚠️ 中 |
| **總計** | **11 小時 (~1.5 天)** | |

---

## 📚 相關文檔

- [完整分析文檔](./MONITORING_MODULE_MANAGER_ANALYSIS.md)
- [架構設計原則](./../.github/instructions/ng-gighub-architecture.instructions.md)
- [Blueprint 權限模型](./../design/blueprint-ownership-membership.md)
- [模組視圖規範](./../routes/blueprint/modules/AGENTS.md)

---

## 🔗 快速連結

### 當前位置
- Monitoring: `/monitoring`
- Module-Manager: `/module-manager/:id`

### 重構後位置
- Monitoring: `/admin/monitoring`
- Module-Manager: `/blueprints/user/:id/modules`

### 重定向
- `/monitoring` → `/admin/monitoring`
- `/module-manager/:id` → `/blueprints/user/:id/modules`

---

**文檔版本**: 1.0  
**撰寫日期**: 2025-12-21  
**狀態**: 待審核與實施  
**作者**: GigHub 開發團隊
