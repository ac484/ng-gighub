# SETC-000-20: Layout & Sidebar Module (佈局與側邊欄模組)

> **模組 ID**: `layout`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作完成  
> **優先級**: P0 (核心)  
> **架構**: Foundation Layer - UI Framework  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

Layout 模組提供不同的佈局範本供各種應用情境使用，包括主應用程式佈局 (含側邊欄與標題列)、空白佈局與身份驗證佈局。

### 業務範圍

應用程式佈局管理，包括：
- 基本佈局 (已認證使用者介面含側邊欄與標題列)
- 空白佈局 (專注任務的最小佈局)
- Passport 佈局 (身份驗證與入門流程)
- 響應式設計 (行動優先響應式佈局)
- 佈局切換 (基於路由的情境佈局選擇)

### 核心特性

- ✅ **基本佈局**: 完整的應用程式框架 (Header + Sidebar + Content)
- ✅ **側邊欄導航**: 可折疊的導航選單
- ✅ **標題列**: 麵包屑、搜尋、通知、使用者選單
- ✅ **響應式設計**: 行動/平板/桌面適應
- ✅ **主題支援**: 深色/淺色模式
- ✅ **權限控制**: 基於角色的選單顯示

---

## 🏗️ 架構設計

### 目錄結構

```
src/app/layout/
├── AGENTS.md                       # 模組指引
├── index.ts                        # 公開匯出
├── basic/                          # 主應用程式佈局
│   ├── basic.component.ts          # 佈局容器
│   ├── basic.component.html        # 佈局模板
│   ├── basic.component.scss        # 佈局樣式
│   └── widgets/                    # 佈局小工具
│       ├── header/                 # 頂部標題列
│       ├── sidebar/                # 左側邊欄選單
│       ├── user/                   # 使用者下拉選單
│       └── notification/           # 通知中心
├── blank/                          # 最小佈局
│   ├── blank.component.ts
│   └── blank.component.html
└── passport/                       # 身份驗證佈局
    ├── passport.component.ts
    ├── passport.component.html
    └── passport.component.scss
```

---

## 📦 佈局類型

### 1️⃣ Basic Layout (基本佈局)

**用途**: 已認證使用者的主要應用程式佈局

**元件**:
- 頂部標題列 (標誌、麵包屑、使用者選單、通知)
- 左側邊欄 (可折疊的導航選單，帶圖示)
- 主要內容區域 (功能模組的路由出口)
- 頁尾 (版權和連結)

**響應式行為**:
- 桌面 (≥992px): 持久側邊欄，可折疊
- 平板 (768px-991px): 可折疊側邊欄，覆蓋模式
- 行動 (<768px): 預設隱藏，抽屜覆蓋

**實作範例**:
```typescript
@Component({
  selector: 'layout-basic',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-layout class="app-layout">
      <nz-sider 
        [nzCollapsed]="collapsed()"
        [nzWidth]="256"
        [nzBreakpoint]="'lg'"
        (nzCollapsedChange)="onCollapsedChange($event)"
      >
        <app-sidebar [collapsed]="collapsed()" />
      </nz-sider>
      
      <nz-layout>
        <nz-header>
          <app-header 
            (toggleSidebar)="toggleSidebar()"
            (logout)="onLogout()"
          />
        </nz-header>
        
        <nz-content>
          <router-outlet />
        </nz-content>
        
        <nz-footer>
          © 2025 GigHub. All rights reserved.
        </nz-footer>
      </nz-layout>
    </nz-layout>
  `
})
export class LayoutBasicComponent {
  collapsed = signal(false);
  
  toggleSidebar(): void {
    this.collapsed.update(v => !v);
  }
}
```

### 2️⃣ Header Component (標題列)

**元件**:
- 標誌/品牌 (可點擊導航到首頁)
- 動態麵包屑 (導航路徑)
- 全域搜尋功能
- 通知 (帶徽章的鈴鐺圖示)
- 使用者選單 (頭像下拉選單: 個人資料、設定、登出)
- 主題切換 (深色/淺色模式)

### 3️⃣ Sidebar Component (側邊欄)

**元件**:
- 選單項目 (圖示 + 標籤導航)
- 子選單 (可展開的巢狀選單)
- 活動指示器 (突出顯示當前路由)
- 折疊支援 (折疊時僅顯示圖示)
- 權限控制 (隱藏使用者無法存取的項目)

**選單結構**:
```typescript
interface MenuItem {
  title: string;
  icon: string;
  link?: string;
  children?: MenuItem[];
  requiredPermissions?: string[];
  badge?: {
    count: number;
    color: string;
  };
}

const menuItems: MenuItem[] = [
  {
    title: '儀表板',
    icon: 'dashboard',
    link: '/dashboard'
  },
  {
    title: 'Blueprint',
    icon: 'project',
    children: [
      { title: '我的 Blueprint', icon: 'folder', link: '/blueprint/my' },
      { title: '共享的', icon: 'share-alt', link: '/blueprint/shared' }
    ]
  },
  {
    title: '組織',
    icon: 'team',
    link: '/organization',
    requiredPermissions: ['org:view']
  }
];
```

### 4️⃣ Notification Component (通知中心)

**功能**:
- 徽章計數 (顯示未讀數量)
- 通知列表 (最近的通知)
- 標記為已讀 (個別或批量操作)
- 篩選 (依類型或日期)
- 即時更新 (Firestore 訂閱)

---

## 🎨 主題支援

### 主題切換

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>('light');
  
  toggleTheme(): void {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
  
  initTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    this.theme.set(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }
}
```

### CSS 變數

```scss
:root {
  // Light theme
  --primary-color: #1890ff;
  --bg-color: #ffffff;
  --text-color: #000000;
}

[data-theme='dark'] {
  // Dark theme
  --primary-color: #177ddc;
  --bg-color: #141414;
  --text-color: #ffffff;
}
```

---

## 📱 響應式設計

### 斷點

| 斷點 | 尺寸 | 裝置 |
|------|------|------|
| XS | 0px | 手機 |
| SM | 576px | 大型手機 |
| MD | 768px | 平板 |
| LG | 992px | 桌面 |
| XL | 1200px | 大型桌面 |
| XXL | 1600px | 超大桌面 |

### 行動裝置最佳化

- 側邊欄: 預設隱藏，抽屜覆蓋
- 標題列: 漢堡選單，僅顯示使用者頭像
- 內容: 流體寬度，增加觸控目標大小

---

## 🔗 相關模組

- **Passport Module**: Passport Layout 整合
- **User Module**: 標題列使用者選單
- **Communication Module**: 通知中心
- **Settings Module**: 主題與語言設定

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
