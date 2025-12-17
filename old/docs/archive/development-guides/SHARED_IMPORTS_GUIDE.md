# 共享導入使用指南 (Shared Imports Usage Guide)

## 📖 概述 (Overview)

本指南說明如何在 GigHub 專案中正確使用共享導入 (Shared Imports)，以實現最佳的開發體驗和性能。

### 專案技術棧
- **Angular**: 20.3.0 (Standalone Components)
- **ng-zorro-antd**: 20.3.1
- **ng-alain (@delon)**: 20.1.0
- **TypeScript**: 5.9.2

---

## 🎯 核心概念 (Core Concepts)

### 1. SHARED_IMPORTS - 標準共享導入

包含 80% 以上元件都會使用的模組：

```typescript
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `...`
})
export class ExampleComponent {}
```

**包含內容**：
- ✅ Angular 核心模組 (FormsModule, ReactiveFormsModule, RouterLink 等)
- ✅ 常用 ng-zorro 模組 (Button, Form, Grid, Card 等)
- ✅ 常用 @delon 模組 (STModule, SEModule, DelonFormModule 等)

### 2. OPTIONAL_ZORRO_MODULES - 可選 ng-zorro 模組

低頻使用的 ng-zorro 模組，按需導入：

```typescript
import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';

@Component({
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_ZORRO_MODULES.divider,    // 分隔線
    OPTIONAL_ZORRO_MODULES.progress    // 進度條
  ]
})
export class SpecialComponent {}
```

**可用選項**：
- `divider` - NzDividerModule (分隔線)
- `popconfirm` - NzPopconfirmModule (氣泡確認框)
- `progress` - NzProgressModule (進度條)
- `space` - NzSpaceModule (間距)
- `timePicker` - NzTimePickerModule (時間選擇器)

### 3. OPTIONAL_DELON_MODULES - 可選 @delon 模組

特殊場景使用的 @delon 模組：

```typescript
import { SHARED_IMPORTS, OPTIONAL_DELON_MODULES } from '@shared';

@Component({
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_DELON_MODULES.sv,         // 查看詳情
    ...OPTIONAL_DELON_MODULES.acl      // 權限控制指令
  ]
})
export class DetailComponent {}
```

**可用選項**：
- `sv` - SVModule (查看詳情模組)
- `acl` - [ACLDirective, ACLIfDirective] (權限控制指令)
- `currencyPrice` - CurrencyPricePipe (貨幣價格管道)

---

## 📝 使用場景與範例 (Usage Scenarios & Examples)

### 場景 1: 標準列表頁面

**需求**: 表格、按鈕、表單、卡片

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SHARED_IMPORTS],  // ✅ 足夠了！
  template: `
    <nz-card>
      <st [data]="users" [columns]="columns"></st>
    </nz-card>
  `
})
export class UserListComponent {
  users = [];
  columns = [];
}
```

### 場景 2: 包含特殊元件的頁面

**需求**: 標準功能 + 進度條 + 分隔線

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_ZORRO_MODULES.progress,   // 上傳進度
    OPTIONAL_ZORRO_MODULES.divider     // 視覺分隔
  ],
  template: `
    <nz-card>
      <h3>文件上傳</h3>
      <nz-divider></nz-divider>
      <nz-progress [nzPercent]="uploadProgress"></nz-progress>
    </nz-card>
  `
})
export class UploadPageComponent {
  uploadProgress = 0;
}
```

### 場景 3: 包含權限控制的頁面

**需求**: 標準功能 + ACL 權限控制

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_DELON_MODULES } from '@shared';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    ...OPTIONAL_DELON_MODULES.acl  // 展開陣列
  ],
  template: `
    <nz-card>
      <button nz-button *aclIf="'admin'">
        管理員專用按鈕
      </button>
    </nz-card>
  `
})
export class AdminPageComponent {}
```

### 場景 4: 詳情查看頁面

**需求**: 標準功能 + SV 查看詳情模組

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_DELON_MODULES } from '@shared';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_DELON_MODULES.sv  // 查看詳情
  ],
  template: `
    <sv-container>
      <sv label="用戶名">{{ user.name }}</sv>
      <sv label="郵箱">{{ user.email }}</sv>
    </sv-container>
  `
})
export class UserDetailComponent {
  user = { name: '', email: '' };
}
```

### 場景 5: 單一特殊需求

**需求**: 只需要一個不在任何預設列表中的模組

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton'; // 直接導入

@Component({
  selector: 'app-loading-page',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzSkeletonModule  // 特殊需求直接導入
  ],
  template: `
    <nz-skeleton [nzActive]="true"></nz-skeleton>
  `
})
export class LoadingPageComponent {}
```

---

## 🎨 圖標使用指南 (Icon Usage Guide)

### 圖標註冊

圖標在 `app.config.ts` 中全局註冊：

```typescript
// app.config.ts
import { ICONS } from '../style-icons';           // 自訂圖標
import { ICONS_AUTO } from '../style-icons-auto'; // 自動生成圖標

provideAlain({ 
  icons: [...ICONS_AUTO, ...ICONS] 
})
```

### 使用圖標

在模板中使用已註冊的圖標：

```html
<!-- 使用 nzType -->
<i nz-icon nzType="user"></i>
<i nz-icon nzType="dashboard"></i>

<!-- 在按鈕中使用 -->
<button nz-button nzType="primary">
  <i nz-icon nzType="plus"></i>
  新增
</button>

<!-- 在選單中使用 -->
<li nz-menu-item>
  <i nz-icon nzType="setting"></i>
  設定
</li>
```

### 更新圖標列表

使用 ng-alain 工具自動掃描並更新：

```bash
# 自動掃描專案中使用的圖標並更新 style-icons-auto.ts
yarn icon
```

---

## ⚡ 性能優化建議 (Performance Tips)

### 1. 優先使用 SHARED_IMPORTS

```typescript
// ✅ 推薦 - 大部分情況
imports: [SHARED_IMPORTS]

// ❌ 避免 - 不必要的重複
imports: [
  FormsModule,
  ReactiveFormsModule,
  NzButtonModule,
  NzCardModule,
  // ... 這些都已經在 SHARED_IMPORTS 中了
]
```

### 2. 按需添加可選模組

```typescript
// ✅ 推薦 - 只導入需要的
imports: [
  SHARED_IMPORTS,
  OPTIONAL_ZORRO_MODULES.progress  // 只有這個頁面需要
]

// ❌ 避免 - 導入所有可選模組
imports: [
  SHARED_IMPORTS,
  ...Object.values(OPTIONAL_ZORRO_MODULES)  // 過度導入
]
```

### 3. 單一特殊需求直接導入

```typescript
// ✅ 推薦 - 單一特殊模組
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
imports: [SHARED_IMPORTS, NzSkeletonModule]

// ❌ 避免 - 為了一個模組添加到全局
// 不要為了單一使用就修改 SHARED_IMPORTS
```

---

## 🔍 決策樹 (Decision Tree)

使用以下決策樹決定如何導入模組：

```
開始新元件
    ↓
是否需要表單/路由/基本 UI？
    ├─ 是 → 使用 SHARED_IMPORTS
    └─ 否 → 考慮是否需要任何 UI
         ↓
是否需要 ng-zorro 或 @delon 元件？
    ├─ 是 → 檢查是否在 SHARED_IMPORTS 中
    │    ├─ 是 → 使用 SHARED_IMPORTS
    │    └─ 否 → 檢查 OPTIONAL_*_MODULES
    │         ├─ 存在 → 從 OPTIONAL_*_MODULES 導入
    │         └─ 不存在 → 直接從套件導入
    └─ 否 → 只導入需要的 Angular 核心模組
```

---

## 📊 模組包含對照表 (Module Reference)

### SHARED_IMPORTS 包含的 ng-zorro 模組

| 模組 | 用途 | 使用頻率 |
|------|------|---------|
| NzButtonModule | 按鈕 | 極高 ⭐⭐⭐⭐⭐ |
| NzCardModule | 卡片 | 極高 ⭐⭐⭐⭐⭐ |
| NzFormModule | 表單 | 極高 ⭐⭐⭐⭐⭐ |
| NzGridModule | 網格佈局 | 極高 ⭐⭐⭐⭐⭐ |
| NzIconModule | 圖標 | 極高 ⭐⭐⭐⭐⭐ |
| NzInputModule | 輸入框 | 極高 ⭐⭐⭐⭐⭐ |
| NzListModule | 列表 | 高 ⭐⭐⭐⭐ |
| NzToolTipModule | 提示 | 高 ⭐⭐⭐⭐ |
| NzDropDownModule | 下拉選單 | 高 ⭐⭐⭐⭐ |
| NzTabsModule | 標籤頁 | 高 ⭐⭐⭐⭐ |
| NzBreadCrumbModule | 麵包屑 | 高 ⭐⭐⭐⭐ |
| NzAlertModule | 警告提示 | 中 ⭐⭐⭐ |
| NzAvatarModule | 頭像 | 中 ⭐⭐⭐ |
| NzBadgeModule | 徽標數 | 中 ⭐⭐⭐ |
| NzCheckboxModule | 複選框 | 中 ⭐⭐⭐ |
| NzDatePickerModule | 日期選擇器 | 中 ⭐⭐⭐ |
| NzDrawerModule | 抽屜 | 中 ⭐⭐⭐ |
| NzInputNumberModule | 數字輸入框 | 中 ⭐⭐⭐ |
| NzModalModule | 對話框 | 中 ⭐⭐⭐ |
| NzPopoverModule | 氣泡卡片 | 中 ⭐⭐⭐ |
| NzRadioModule | 單選框 | 中 ⭐⭐⭐ |
| NzSelectModule | 選擇器 | 中 ⭐⭐⭐ |
| NzSpinModule | 加載中 | 中 ⭐⭐⭐ |
| NzSwitchModule | 開關 | 中 ⭐⭐⭐ |
| NzTableModule | 表格 | 中 ⭐⭐⭐ |
| NzTagModule | 標籤 | 中 ⭐⭐⭐ |

### OPTIONAL_ZORRO_MODULES 包含的模組

| 模組 | 用途 | 使用頻率 |
|------|------|---------|
| divider | 分隔線 | 低 ⭐⭐ |
| popconfirm | 氣泡確認框 | 低 ⭐⭐ |
| progress | 進度條 | 低 ⭐⭐ |
| space | 間距 | 低 ⭐⭐ |
| timePicker | 時間選擇器 | 低 ⭐⭐ |

### SHARED_IMPORTS 包含的 @delon 模組

| 模組 | 用途 | 使用頻率 |
|------|------|---------|
| DelonFormModule | 動態表單 | 高 ⭐⭐⭐⭐ |
| STModule | 簡易表格 | 高 ⭐⭐⭐⭐ |
| SEModule | 編輯表單 | 高 ⭐⭐⭐⭐ |
| PageHeaderModule | 頁面標題 | 高 ⭐⭐⭐⭐ |

### OPTIONAL_DELON_MODULES 包含的模組

| 模組 | 用途 | 使用頻率 |
|------|------|---------|
| sv | 查看詳情 | 中 ⭐⭐⭐ |
| acl | 權限控制 | 中 ⭐⭐⭐ |
| currencyPrice | 貨幣格式化 | 低 ⭐⭐ |

---

## 🛠️ 維護指南 (Maintenance Guide)

### 定期審查 (每季度)

1. **檢查模組使用頻率**
   ```bash
   # 掃描元件中的模組使用情況
   find src -name "*.html" | xargs grep -oh "nz-[a-z-]*" | sort | uniq -c | sort -rn
   ```

2. **評估是否需要調整**
   - 如果某個 OPTIONAL 模組使用頻率 > 30%，考慮移至 SHARED_IMPORTS
   - 如果某個 SHARED 模組使用頻率 < 20%，考慮移至 OPTIONAL

3. **更新圖標列表**
   ```bash
   # 自動更新圖標
   yarn icon
   ```

### 添加新模組

**情境 1**: 新模組預計會被廣泛使用 (>30% 元件)

```typescript
// 1. 修改 shared-zorro.module.ts 或 shared-delon.module.ts
import { NzNewModule } from 'ng-zorro-antd/new';

export const SHARED_ZORRO_MODULES = [
  // ... 現有模組
  NzNewModule  // 添加新模組
];
```

**情境 2**: 新模組預計使用頻率較低 (<30% 元件)

```typescript
// 1. 修改 shared-zorro.module.ts
import { NzNewModule } from 'ng-zorro-antd/new';

export const OPTIONAL_ZORRO_MODULES = {
  // ... 現有模組
  newFeature: NzNewModule  // 添加到可選模組
} as const;
```

**情境 3**: 一次性特殊需求

```typescript
// 直接在元件中導入，不修改共享配置
import { NzSpecialModule } from 'ng-zorro-antd/special';

@Component({
  imports: [SHARED_IMPORTS, NzSpecialModule]
})
```

---

## 🚨 常見問題 (FAQ)

### Q1: 為什麼我的元件找不到某個指令？

**A**: 檢查該模組是否在 SHARED_IMPORTS 中。如果不在，從 OPTIONAL_*_MODULES 或直接導入。

```typescript
// 如果遇到 "Can't bind to 'nzProgress'"
// 解決方案：
import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';

@Component({
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_ZORRO_MODULES.progress  // 添加 progress 模組
  ]
})
```

### Q2: 我應該把所有可能用到的模組都加入 SHARED_IMPORTS 嗎？

**A**: 不應該。這會導致：
- ❌ Bundle 大小增加
- ❌ 編譯時間變長
- ❌ 未使用程式碼無法被 tree-shaking

只添加使用頻率 >30% 的模組到 SHARED_IMPORTS。

### Q3: 如何知道某個模組在 SHARED_IMPORTS 中？

**A**: 參考本文檔的「模組包含對照表」，或查看 `shared-*-module.ts` 原始碼。

### Q4: OPTIONAL_DELON_MODULES.acl 為什麼需要展開 (...)?

**A**: 因為 acl 是一個陣列，包含兩個指令：

```typescript
// ✅ 正確 - 展開陣列
imports: [SHARED_IMPORTS, ...OPTIONAL_DELON_MODULES.acl]

// ❌ 錯誤 - 導入陣列本身
imports: [SHARED_IMPORTS, OPTIONAL_DELON_MODULES.acl]
```

### Q5: 可以混合使用 OPTIONAL 和直接導入嗎？

**A**: 可以，完全沒問題：

```typescript
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';

@Component({
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_ZORRO_MODULES.progress,  // 從 OPTIONAL
    NzSkeletonModule                   // 直接導入
  ]
})
```

---

## 📚 相關資源 (Related Resources)

### 官方文檔
- [Angular Standalone Components](https://angular.dev/guide/components/importing)
- [ng-zorro-antd 文檔](https://ng.ant.design/docs/introduce/zh)
- [ng-alain 文檔](https://ng-alain.com/docs/getting-started/zh)

### 專案文檔
- [共享模組優化方案](./SHARED_MODULES_OPTIMIZATION.md)
- [Azure Dragon 主題設計](./azure-dragon-theme.md)

### 工具與命令
```bash
# 更新圖標
yarn icon

# Lint 檢查
yarn lint

# 建置專案
yarn build

# 分析 bundle 大小
yarn analyze
yarn analyze:view
```

---

## 📝 變更記錄 (Changelog)

### v1.0.0 (2025-01-08)
- ✨ 首次發布
- 📝 完整的使用指南和範例
- 📊 模組包含對照表
- 🎨 圖標使用指南
- 🛠️ 維護指南

---

*文件版本: 1.0.0*  
*最後更新: 2025-01-08*  
*作者: GitHub Copilot AI Agent*  
*專案: GigHub - 工地施工進度追蹤管理系統*
