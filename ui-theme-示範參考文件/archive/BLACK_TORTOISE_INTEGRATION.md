# Black Tortoise Theme Integration Guide
# 玄武主題整合指南

## 概述 (Overview)

本指南說明如何在 GigHub 專案中使用玄武主題。玄武主題已完全整合到專案的樣式系統中，無需額外配置即可使用。

This guide explains how to use the Black Tortoise theme in the GigHub project. The Black Tortoise theme is fully integrated into the project's styling system and works out of the box.

## 已完成的整合 (Completed Integration)

### 1. 主題變量導入 (Theme Variables Import)

**檔案**: `src/styles/theme.less`

玄武主題變量已自動導入到專案主題檔案中：

```less
@import '../docs/tortoise-dragon-theme-variables.less';
```

所有 LESS 變量（如 `@tortoise-6`、`@jade-4`、`@gradient-dragon-soaring`）現在可在任何 LESS 檔案中使用。

All LESS variables (like `@tortoise-6`, `@jade-4`, `@gradient-dragon-soaring`) are now available in any LESS file.

### 2. 全局樣式應用 (Global Styles Applied)

**檔案**: `src/styles/index.less`

已添加以下樣式增強：

The following style enhancements have been added:

- ✅ 玄武主題工具類 (Utility classes)
- ✅ 按鈕漸變效果 (Button gradient effects)
- ✅ 表格樣式 (Table styles)
- ✅ 表單控件 (Form controls)
- ✅ 導航菜單 (Navigation menus)
- ✅ 模態框與抽屜 (Modals & Drawers)
- ✅ 自定義動畫 (Custom animations)
- ✅ 捲軸樣式 (Scrollbar styling)

### 3. Angular 配置 (Angular Configuration)

**檔案**: `src/app/app.config.ts`

ng-zorro-antd 配置已更新為使用玄武主題顏色：

ng-zorro-antd configuration has been updated with Black Tortoise theme colors:

```typescript
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E293B', // Black Tortoise Blue
    successColor: '#475569', // Jade Green
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
    infoColor: '#06B6D4' // Cyan
  }
};
```

## 使用方法 (Usage Guide)

### 在元件 LESS 檔案中使用 (Using in Component LESS Files)

```less
// 直接使用玄武主題變量
.my-component {
  background: @tortoise-6;
  color: white;
  border: 1px solid @tortoise-7;
  
  &:hover {
    background: @tortoise-5;
    box-shadow: @shadow-tortoise-md;
  }
}

// 使用漸變效果
.hero-section {
  background: @gradient-dragon-soaring;
  padding: 60px 0;
}

// 使用語義化顏色
.success-message {
  color: @jade-4;
  background: @jade-1;
  border-left: 3px solid @jade-4;
}
```

### 在 HTML 模板中使用工具類 (Using Utility Classes in HTML Templates)

```html
<!-- 背景顏色 -->
<div class="tortoise-bg-primary">主要背景</div>
<div class="tortoise-bg-gradient">漸變背景</div>
<div class="tortoise-bg-light">淺色背景</div>

<!-- 文字顏色 -->
<span class="tortoise-text-primary">主要文字</span>
<span class="tortoise-text-jade">翡翠綠文字</span>
<span class="tortoise-text-cyan">青綠文字</span>

<!-- 卡片樣式 -->
<div class="tortoise-card">標準卡片</div>
<div class="tortoise-card-featured">特色卡片</div>
<div class="tortoise-card-highlight">高亮卡片</div>

<!-- 動畫效果 -->
<div class="dragon-effect">龍流動效果</div>
<button class="dragon-pulse">脈衝效果按鈕</button>

<!-- 光暈效果 -->
<div class="tortoise-glow">玄武光暈</div>
<div class="jade-glow">翡翠光暈</div>
```

### 在 TypeScript 中使用 (Using in TypeScript)

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <nz-card [nzTitle]="'統計數據'" class="tortoise-card">
      <div class="tortoise-text-primary">主要內容</div>
    </nz-card>
  `
})
export class DashboardComponent {
  // Black Tortoise 主題顏色常量
  readonly AZURE_PRIMARY = '#1E293B';
  readonly JADE_GREEN = '#475569';
  readonly CYAN_BLUE = '#06B6D4';
  
  // 在代碼中使用
  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return this.JADE_GREEN;
      case 'processing': return this.AZURE_PRIMARY;
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return this.AZURE_PRIMARY;
    }
  }
}
```

## 可用的顏色變量 (Available Color Variables)

### 主色調 (Primary Colors)

| 變量名 | 顏色代碼 | 用途 |
|--------|---------|------|
| `@tortoise-1` | `#E6F7FF` | 背景淺色 |
| `@tortoise-2` | `#BAE7FF` | 懸停淺色 |
| `@tortoise-3` | `#91D5FF` | 次要元素 |
| `@tortoise-4` | `#69C0FF` | 次要強調 |
| `@tortoise-5` | `#40A9FF` | 輔助色 |
| `@tortoise-6` | `#1E293B` | **主色** |
| `@tortoise-7` | `#0C83BA` | 主色深化 |
| `@tortoise-8` | `#0A688B` | 深色強調 |
| `@tortoise-9` | `#084C5C` | 最深強調 |
| `@tortoise-10` | `#06303D` | 深色背景 |

### 輔助色 (Secondary Colors)

| 變量名 | 顏色代碼 | 用途 |
|--------|---------|------|
| `@jade-4` | `#475569` | 翡翠綠（成功狀態） |
| `@cyan-3` | `#06B6D4` | 青綠（信息提示） |
| `@sapphire-3` | `#3B82F6` | 寶藍（裝飾元素） |

### 漸變效果 (Gradients)

| 變量名 | 效果 | 用途 |
|--------|------|------|
| `@gradient-dragon-soaring` | 玄武藍 → 翡翠綠 | 主要按鈕、英雄區塊 |
| `@gradient-tortoise-sky` | 玄武藍 → 青綠 → 翡翠綠 | 大型橫幅、頁面背景 |
| `@gradient-dragon-scales` | 多色龍鱗漸變 | 裝飾性元素 |
| `@gradient-dawn-light` | 淺色漸變 | 卡片背景、區塊背景 |
| `@gradient-deep-mystery` | 深色漸變 | 暗色模式 |

### 陰影效果 (Shadows)

| 變量名 | 效果 | 用途 |
|--------|------|------|
| `@shadow-tortoise-sm` | 微陰影 | 卡片、按鈕 |
| `@shadow-tortoise-md` | 標準陰影 | 浮動元素 |
| `@shadow-tortoise-lg` | 較大陰影 | 彈窗、抽屜 |
| `@shadow-tortoise-xl` | 超大陰影 | 模態框 |
| `@glow-tortoise` | 玄武光暈 | 特殊效果 |
| `@glow-jade` | 翡翠光暈 | 特殊效果 |

## 元件示例 (Component Examples)

### 登錄頁面 (Login Page)

```typescript
@Component({
  selector: 'app-login',
  template: `
    <div class="login-container tortoise-bg-gradient-sky">
      <nz-card class="login-card tortoise-card">
        <h2 class="tortoise-text-primary">歡迎回來</h2>
        <form nz-form [formGroup]="loginForm">
          <nz-form-item>
            <nz-form-control>
              <input nz-input formControlName="username" placeholder="用戶名" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-control>
              <input nz-input type="password" formControlName="password" placeholder="密碼" />
            </nz-form-control>
          </nz-form-item>
          <button nz-button nzType="primary" nzBlock [nzLoading]="loading">
            登錄
          </button>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    .login-card {
      width: 400px;
      box-shadow: @shadow-tortoise-lg;
    }
  `]
})
export class LoginComponent {}
```

### 儀表板卡片 (Dashboard Card)

```typescript
@Component({
  selector: 'app-stat-card',
  template: `
    <div class="stat-card tortoise-card dragon-pulse">
      <div class="stat-icon tortoise-bg-gradient">
        <i nz-icon [nzType]="icon"></i>
      </div>
      <div class="stat-content">
        <h3 class="tortoise-text-primary">{{ value }}</h3>
        <p class="stat-label">{{ label }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: center;
      padding: 24px;
      
      &:hover {
        box-shadow: @shadow-tortoise-lg;
        transform: translateY(-2px);
        transition: @transition-base;
      }
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      margin-right: 16px;
      
      i {
        font-size: 28px;
        color: white;
      }
    }
    
    .stat-content h3 {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    
    .stat-label {
      color: @text-color-secondary;
      margin: 4px 0 0;
    }
  `]
})
export class StatCardComponent {
  @Input() icon: string = 'bar-chart';
  @Input() value: string = '0';
  @Input() label: string = '';
}
```

### 導航菜單 (Navigation Menu)

```html
<ul nz-menu nzMode="inline">
  <li nz-menu-item nzSelected>
    <i nz-icon nzType="dashboard" class="tortoise-text-primary"></i>
    <span>儀表板</span>
  </li>
  <li nz-menu-item>
    <i nz-icon nzType="project" class="tortoise-text-cyan"></i>
    <span>專案管理</span>
  </li>
  <li nz-menu-item>
    <i nz-icon nzType="team" class="tortoise-text-jade"></i>
    <span>團隊協作</span>
  </li>
</ul>
```

## 響應式設計 (Responsive Design)

玄武主題包含響應式斷點，可用於媒體查詢：

```less
// 手機端
@media (max-width: @screen-sm) {
  .my-component {
    padding: 12px;
    background: @tortoise-6; // 使用純色以提升性能
  }
}

// 平板端
@media (min-width: @screen-md) and (max-width: @screen-lg) {
  .my-component {
    padding: 16px;
  }
}

// 桌面端
@media (min-width: @screen-lg) {
  .my-component {
    padding: 24px;
    background: @gradient-dragon-soaring;
  }
}
```

## 無障礙設計 (Accessibility)

玄武主題已考慮無障礙設計：

- ✅ 所有顏色組合通過 WCAG 2.1 AA 級別對比度測試
- ✅ 提供焦點可見狀態樣式
- ✅ 支持鍵盤導航
- ✅ 提供語義化配色

```html
<!-- 使用焦點可見樣式 -->
<button class="tortoise-focus-visible">可訪問按鈕</button>

<!-- 語義化配色 -->
<nz-alert nzType="success" nzMessage="操作成功"></nz-alert>
<nz-alert nzType="info" nzMessage="提示信息"></nz-alert>
<nz-alert nzType="warning" nzMessage="警告信息"></nz-alert>
<nz-alert nzType="error" nzMessage="錯誤信息"></nz-alert>
```

## 效能優化 (Performance Optimization)

### 1. 移動端優化

在移動設備上使用純色而非漸變以提升性能：

```less
@media (max-width: @screen-sm) {
  .tortoise-bg-gradient,
  .tortoise-bg-gradient-sky {
    background: @tortoise-6 !important;
  }
}
```

### 2. 列印樣式

列印時自動轉換為純色：

```less
@media print {
  .tortoise-bg-gradient {
    background: @tortoise-6 !important;
  }
}
```

## 深色模式支持 (Dark Mode Support)

玄武主題已預留深色模式變量（未來實現）：

```less
// 在需要時啟用
@media (prefers-color-scheme: dark) {
  body {
    background-color: @tortoise-10;
    color: @text-color;
  }
}
```

## 疑難排解 (Troubleshooting)

### 問題：樣式沒有生效

**解決方案**:
1. 確認 `src/styles/theme.less` 中已導入玄武主題變量
2. 檢查 `angular.json` 中的 styles 配置
3. 重新啟動開發伺服器

### 問題：顏色不正確

**解決方案**:
1. 確認使用正確的變量名稱（如 `@tortoise-6` 而非 `@tortoise6`）
2. 檢查是否有其他樣式覆蓋了玄武主題樣式
3. 使用瀏覽器開發者工具檢查計算後的樣式

### 問題：漸變效果不顯示

**解決方案**:
1. 確認瀏覽器支持 CSS 漸變
2. 檢查是否在移動端（移動端自動使用純色）
3. 確認沒有其他背景樣式覆蓋漸變

## 最佳實踐 (Best Practices)

1. **一致性**：在整個應用中一致使用玄武主題顏色
2. **語義化**：使用語義化變量名稱（如 `@success-color` 而非直接顏色代碼）
3. **響應式**：考慮不同設備的顯示效果
4. **無障礙**：確保顏色對比度符合無障礙標準
5. **效能**：在移動端避免過度使用漸變和動畫

## 相關資源 (Related Resources)

- [玄武主題設計文檔](../../docs/tortoise-dragon-theme.md)
- [LESS 變量定義](../../docs/tortoise-dragon-theme-variables.less)
- [視覺參考與代碼示例](../../docs/tortoise-dragon-theme-examples.md)
- [ng-zorro-antd 文檔](https://ng.ant.design/)
- [ng-alain 文檔](https://ng-alain.com/)

## 更新日誌 (Changelog)

### v1.0.0 (2025-12-08)
- ✅ 初始版本
- ✅ 完整整合玄武主題到 GigHub 專案
- ✅ 添加全局樣式與工具類
- ✅ 配置 ng-zorro-antd 主題顏色
- ✅ 提供完整的使用文檔

---

**維護者**: GitHub Copilot Agent  
**最後更新**: 2025-12-08  
**版本**: 1.0.0
