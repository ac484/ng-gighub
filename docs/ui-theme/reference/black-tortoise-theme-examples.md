# 玄武主題視覺參考 (Black Tortoise Theme Visual Reference)

本文檔提供玄武主題的視覺示例和 CSS 代碼片段。

## 快速開始 (Quick Start)

### 1. 導入主題變量

在 `src/styles/theme.less` 中添加：

```less
@import '../docs/black-tortoise-theme-variables.less';
```

### 2. 基本使用示例

```html
<!-- 主色按鈕 -->
<button class="tortoise-btn-primary">玄武按鈕</button>

<!-- 漸變背景卡片 -->
<div class="tortoise-card-gradient">
  <h3>玄武主題卡片</h3>
  <p>這是一個使用玄武主題的卡片示例</p>
</div>
```

## 顏色示例 (Color Swatches)

### 主色調 - Obsidian Black

<div style="display: flex; gap: 10px; margin: 20px 0;">
  <div style="width: 60px; height: 60px; background: #F8FAFC; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #BAE7FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #91D5FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #69C0FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #40A9FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #1E293B; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #0C83BA; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #0A688B; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #084C5C; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #06303D; border: 1px solid #ccc; border-radius: 4px;"></div>
</div>

```
#F8FAFC  #BAE7FF  #91D5FF  #69C0FF  #40A9FF
#1E293B  #0C83BA  #0A688B  #084C5C  #06303D
```

### 翡翠綠 - Stone Gray

<div style="display: flex; gap: 10px; margin: 20px 0;">
  <div style="width: 80px; height: 60px; background: #E6FFF9; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #B3FFE6; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #7FFFD4; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #475569; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #0D9488; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #0A7C6C; border: 1px solid #ccc; border-radius: 4px;"></div>
</div>

```
#E6FFF9  #B3FFE6  #7FFFD4  #475569  #0D9488  #0A7C6C
```

## CSS 組件示例 (Component Examples)

### 按鈕 (Buttons)

```css
/* 主要按鈕 - 龍躍雲端 */
.tortoise-btn-primary {
  background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}

.tortoise-btn-primary:hover {
  background: linear-gradient(135deg, #0C83BA 0%, #0D9488 100%);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  transform: translateY(-2px);
}

.tortoise-btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}

/* 次要按鈕 - 描邊 */
.tortoise-btn-secondary {
  background: transparent;
  border: 2px solid #1E293B;
  border-radius: 6px;
  color: #1E293B;
  padding: 8px 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tortoise-btn-secondary:hover {
  background: #F8FAFC;
  border-color: #40A9FF;
  color: #40A9FF;
}

/* 文字按鈕 */
.tortoise-btn-text {
  background: transparent;
  border: none;
  color: #1E293B;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tortoise-btn-text:hover {
  color: #40A9FF;
  background: rgba(14, 165, 233, 0.05);
  border-radius: 4px;
}
```

### 卡片 (Cards)

```css
/* 標準卡片 */
.tortoise-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  transition: all 0.3s ease;
}

.tortoise-card:hover {
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  transform: translateY(-4px);
}

/* 漸變背景卡片 */
.tortoise-card-gradient {
  background: linear-gradient(135deg, #F8FAFC 0%, #E6FFF9 100%);
  border: 2px solid #1E293B;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  position: relative;
  overflow: hidden;
}

.tortoise-card-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30px, -30px);
}

/* 特色卡片 - 深色背景 */
.tortoise-card-featured {
  background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
  border: none;
  border-radius: 12px;
  padding: 24px;
  color: #FFFFFF;
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
}

.tortoise-card-featured h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
}

.tortoise-card-featured p {
  color: rgba(255, 255, 255, 0.9);
}
```

### 輸入框 (Input Fields)

```css
/* 標準輸入框 */
.tortoise-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 14px;
  color: #1E293B;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.tortoise-input:focus {
  outline: none;
  border-color: #1E293B;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.tortoise-input::placeholder {
  color: #94A3B8;
}

/* 帶圖標的輸入框 */
.tortoise-input-group {
  position: relative;
  display: inline-block;
  width: 100%;
}

.tortoise-input-group input {
  padding-left: 40px;
}

.tortoise-input-group .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #1E293B;
  font-size: 18px;
}
```

### 標籤 (Tags)

```css
/* 主色標籤 */
.tortoise-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #F8FAFC;
  color: #1E293B;
  border: 1px solid #91D5FF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 翡翠綠標籤 */
.tortoise-tag-jade {
  background: #E6FFF9;
  color: #475569;
  border-color: #7FFFD4;
}

/* 漸變標籤 */
.tortoise-tag-gradient {
  background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
  color: #FFFFFF;
  border: none;
}
```

### 導航欄 (Navigation Bar)

```css
/* 頂部導航 */
.tortoise-navbar {
  background: linear-gradient(90deg, #1E293B 0%, #475569 100%);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.tortoise-navbar-logo {
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 600;
  margin-right: 48px;
}

.tortoise-navbar-menu {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

.tortoise-navbar-item {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.tortoise-navbar-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.tortoise-navbar-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  font-weight: 500;
}
```

### 側邊欄 (Sidebar)

```css
/* 側邊欄容器 */
.tortoise-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border-right: 1px solid #E2E8F0;
  height: 100vh;
  padding: 24px 0;
}

/* 側邊欄項目 */
.tortoise-sidebar-item {
  padding: 12px 24px;
  color: #1E293B;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.tortoise-sidebar-item:hover {
  background: rgba(14, 165, 233, 0.05);
  color: #1E293B;
}

.tortoise-sidebar-item.active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  color: #1E293B;
  border-left-color: #1E293B;
  font-weight: 500;
}

.tortoise-sidebar-icon {
  font-size: 18px;
}
```

## 動畫效果 (Animation Effects)

### 脈衝效果

```css
@keyframes tortoise-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
  }
}

.tortoise-pulse {
  animation: tortoise-pulse 2s ease-in-out infinite;
}
```

### 流動漸變

```css
@keyframes dragon-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.black-tortoise-flow {
  background: linear-gradient(270deg, #1E293B, #475569, #06B6D4, #1E293B);
  background-size: 400% 400%;
  animation: dragon-flow 8s ease infinite;
}
```

### 懸浮上升

```css
.tortoise-hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tortoise-hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.2);
}
```

## 響應式設計 (Responsive Design)

```css
/* 移動設備 */
@media (max-width: 768px) {
  .tortoise-navbar {
    padding: 0 16px;
  }
  
  .tortoise-sidebar {
    width: 60px;
  }
  
  .tortoise-sidebar-item {
    justify-content: center;
  }
  
  .tortoise-sidebar-item span:not(.tortoise-sidebar-icon) {
    display: none;
  }
}

/* 平板設備 */
@media (min-width: 769px) and (max-width: 1024px) {
  .tortoise-sidebar {
    width: 200px;
  }
}

/* 桌面設備 */
@media (min-width: 1025px) {
  .tortoise-sidebar {
    width: 240px;
  }
}
```

## 無障礙設計 (Accessibility)

### 焦點樣式

```css
/* 鍵盤焦點樣式 */
.tortoise-btn-primary:focus-visible,
.tortoise-btn-secondary:focus-visible,
.tortoise-input:focus-visible {
  outline: 2px solid #1E293B;
  outline-offset: 2px;
}

/* 跳過內容鏈接 */
.tortoise-skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #1E293B;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
}

.tortoise-skip-link:focus {
  top: 0;
}
```

## 使用範例 HTML (Example HTML)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>玄武主題示例</title>
  <link rel="stylesheet" href="black-tortoise-theme.css">
</head>
<body>
  <!-- 導航欄 -->
  <nav class="tortoise-navbar">
    <div class="tortoise-navbar-logo">🐉 玄武系統</div>
    <div class="tortoise-navbar-menu">
      <a href="#" class="tortoise-navbar-item active">首頁</a>
      <a href="#" class="tortoise-navbar-item">產品</a>
      <a href="#" class="tortoise-navbar-item">關於</a>
    </div>
  </nav>
  
  <!-- 內容區 -->
  <div style="display: flex;">
    <!-- 側邊欄 -->
    <aside class="tortoise-sidebar">
      <a href="#" class="tortoise-sidebar-item active">
        <span class="tortoise-sidebar-icon">🏠</span>
        <span>儀表板</span>
      </a>
      <a href="#" class="tortoise-sidebar-item">
        <span class="tortoise-sidebar-icon">📊</span>
        <span>數據分析</span>
      </a>
      <a href="#" class="tortoise-sidebar-item">
        <span class="tortoise-sidebar-icon">⚙️</span>
        <span>設置</span>
      </a>
    </aside>
    
    <!-- 主內容 -->
    <main style="flex: 1; padding: 24px;">
      <div class="tortoise-card-gradient">
        <h2>歡迎使用玄武主題</h2>
        <p>這是一個基於中國傳統四象之玄武設計的現代化主題系統。</p>
        <button class="tortoise-btn-primary">開始使用</button>
      </div>
      
      <div style="margin-top: 24px;" class="tortoise-card">
        <h3>功能特色</h3>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <span class="tortoise-tag">現代設計</span>
          <span class="tortoise-tag-jade">響應式</span>
          <span class="tortoise-tag-gradient">高性能</span>
        </div>
      </div>
    </main>
  </div>
</body>
</html>
```

## 整合到 Angular 項目 (Integration with Angular)

### 在組件中使用

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="tortoise-navbar">
      <div class="tortoise-navbar-logo">🐉 玄武系統</div>
    </div>
    
    <div class="tortoise-card-gradient">
      <h2>{{ title }}</h2>
      <button class="tortoise-btn-primary" (click)="onClick()">
        點擊我
      </button>
    </div>
  `,
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = '玄武主題演示';
  
  onClick() {
    console.log('Button clicked!');
  }
}
```

```less
// app.component.less
@import '../../docs/black-tortoise-theme-variables.less';

:host {
  display: block;
  min-height: 100vh;
  background: @body-background;
}
```

---

**最後更新**: 2025-12-08
**版本**: 1.0.0
