# Black Tortoise 玄武主題 - 完整使用指南

## 📖 概述 (Overview)

Black Tortoise 玄武主題是 GigHub 專案的核心視覺設計系統，結合了現代化的漸變效果、流暢的互動動畫與無障礙設計原則。

### 版本資訊

- **當前版本**: 1.1.0
- **最後更新**: 2025-12-13
- **專案**: GigHub - 工地施工進度追蹤管理系統

### 設計理念

「玄武」象徵北方的守護與穩定，主題以 **Obsidian Black** (黑曜石黑) 為主色，搭配 **Stone Gray** (石灰) 作為輔助色，營造出專業、沉穩且充滿力量的視覺體驗。

---

## 🎨 色彩系統 (Color System)

### 主色調 (Primary Colors)

```less
// Obsidian Black - 主要色調
@obsidian-1: #f8fafc;   // 最淺灰白
@obsidian-2: #f1f5f9;
@obsidian-3: #e2e8f0;
@obsidian-4: #cbd5e1;
@obsidian-5: #94a3b8;
@obsidian-6: #1E293B;   // 主色 ⭐
@obsidian-7: #0f172a;
@obsidian-8: #0a0e1a;
@obsidian-9: #05070f;
@obsidian-10: #020617;  // 最深黑

// Stone Gray - 輔助色調
@stone-1: #f1f5f9;    // 最淺石灰
@stone-2: #e2e8f0;
@stone-3: #cbd5e1;
@stone-4: #475569;    // 輔助色 ⭐
@stone-5: #334155;
@stone-6: #1e293b;    // 最深石灰

// Deep Waters - 中性色調
@waters-1: #eef2ff;
@waters-2: #e0e7ff;
@waters-3: #1E40AF;
@waters-4: #1e3a8a;
@waters-5: #1e3a8a;
```

### 語義化顏色 (Semantic Colors)

```less
@primary-color: @obsidian-6;          // 主要動作
@success-color: #10b981;              // 成功狀態
@warning-color: #f59e0b;              // 警告狀態
@error-color: #ef4444;                // 錯誤狀態
@info-color: @waters-3;               // 資訊提示
```

### 漸變效果 (Gradients)

```less
// 龜甲守護 - 主要漸變
@gradient-tortoise-shield: linear-gradient(135deg, @obsidian-6 0%, @stone-4 100%);

// 寧靜微光 - 淺色漸變
@gradient-tranquil-light: linear-gradient(135deg, @obsidian-1 0%, @stone-1 100%);

// 深夜水波 - 中等漸變
@gradient-midnight-waters: linear-gradient(135deg, @obsidian-5 0%, @waters-3 50%, @stone-4 100%);

// 玄武紋理 - 柔和漸變
@gradient-tortoise-texture: linear-gradient(90deg, @obsidian-1 0%, @stone-1 100%);
```

---

## 🚀 快速開始 (Quick Start)

### 1. 基礎使用

所有增強效果**自動應用**，無需額外配置！

```html
<!-- 現有代碼自動獲得增強的懸停狀態 -->
<button nz-button nzType="primary">點擊我</button>
<div class="tortoise-card">卡片內容</div>
```

### 2. 實用工具類 (Utility Classes)

```html
<!-- 懸停提升效果 -->
<div class="hover-lift">懸停時會提升</div>

<!-- 懸停縮放效果 -->
<div class="hover-scale">懸停時會放大</div>

<!-- Tortoise 邊框懸停 -->
<div class="hover-border-tortoise">懸停時顯示玄武邊框</div>

<!-- 漸變背景 -->
<div class="gradient-bg-tortoise-shield">龜甲守護漸變</div>
<div class="gradient-bg-tranquil-light">寧靜微光漸變</div>
```

### 3. 卡片樣式

```html
<!-- 標準 Azure 卡片 -->
<div class="tortoise-card">
  <h3>標題</h3>
  <p>內容...</p>
</div>

<!-- 漸變卡片 -->
<div class="gradient-card">
  <h3>特色卡片</h3>
  <p>帶漸變背景的卡片</p>
</div>

<!-- 特色卡片 -->
<div class="featured-card">
  <h3>重點內容</h3>
  <p>強調重要資訊</p>
</div>
```

---

## 🎯 元件增強 (Component Enhancements)

### 按鈕 (Buttons)

#### Primary Button - 主要按鈕

```html
<button nz-button nzType="primary">主要動作</button>
```

**懸停效果**:
- ✅ 漸變從「龍躍雲端」過渡到「龍鱗閃爍」
- ✅ 提升 1px 並增強陰影
- ✅ 平滑過渡動畫 (0.3s)

**焦點狀態**:
- ✅ Azure 色系的焦點環
- ✅ 符合無障礙標準 (WCAG 2.1 AA)

#### 其他按鈕類型

```html
<!-- 預設按鈕 -->
<button nz-button>預設按鈕</button>

<!-- 虛線按鈕 -->
<button nz-button nzType="dashed">虛線按鈕</button>

<!-- 文字按鈕 -->
<button nz-button nzType="text">文字按鈕</button>

<!-- 連結按鈕 -->
<button nz-button nzType="link">連結按鈕</button>
```

### 卡片 (Cards)

#### Azure Card - 標準卡片

```html
<div class="tortoise-card">
  <h3>卡片標題</h3>
  <p>卡片內容...</p>
</div>
```

**懸停效果**:
- ✅ 提升 2px
- ✅ 陰影從 sm 增強到 lg
- ✅ 出現 Azure-6 顏色的細邊框
- ✅ 所有效果同步流暢過渡

#### Gradient Card - 漸變卡片

```html
<div class="gradient-card">
  <h3>特色內容</h3>
  <p>使用漸變背景的卡片</p>
</div>
```

### 表單控制項 (Form Controls)

#### 輸入框 (Input Fields)

```html
<input nz-input placeholder="請輸入..." />
```

**互動狀態**:
- 懸停: 邊框顏色變為 Azure-5
- 焦點: 邊框顏色變為 Azure-6，出現 2px 陰影環
- 過渡: 0.15s 快速回饋

#### 複選框與單選按鈕

```html
<label nz-checkbox>選項 1</label>
<label nz-radio>選項 A</label>
```

**懸停效果**:
- 邊框顏色變化
- 包裹層背景淡入
- 鍵盤導航時顯示焦點環

#### 開關 (Switch)

```html
<nz-switch [(ngModel)]="checked"></nz-switch>
```

**狀態變化**:
- 未選中懸停: 背景透明度變化
- 已選中懸停: 背景顏色加深
- 平滑切換動畫

### 導航與選單 (Navigation & Menus)

#### 側邊欄導航

```html
<ul nz-menu nzMode="inline">
  <li nz-menu-item nzSelected>
    <i nz-icon nzType="dashboard"></i>
    <span>儀表板</span>
  </li>
  <li nz-menu-item>
    <i nz-icon nzType="user"></i>
    <span>用戶管理</span>
  </li>
</ul>
```

**互動效果**:
- 懸停時背景淡入 Azure-1
- 選中項目顯示左側 Azure-6 邊框
- 動畫邊框高亮效果

#### 頂部導航

```html
<ul nz-menu nzMode="horizontal">
  <li nz-menu-item>首頁</li>
  <li nz-menu-item>關於</li>
  <li nz-menu-item>聯繫</li>
</ul>
```

### 表格 (Tables)

```html
<nz-table [nzData]="data">
  <thead>
    <tr>
      <th>姓名</th>
      <th>年齡</th>
      <th>地址</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let item of data">
      <td>{{ item.name }}</td>
      <td>{{ item.age }}</td>
      <td>{{ item.address }}</td>
    </tr>
  </tbody>
</nz-table>
```

**互動效果**:
- 行懸停: 背景變為淡 Azure-1
- 選中行: 保持高亮狀態
- 過渡: 0.15s 即時回饋
- 表頭: 使用「晨曦微光」漸變背景

---

## 🎨 進階使用 (Advanced Usage)

### 自訂漸變

```less
// 在您的 component.less 中
.custom-gradient {
  background: linear-gradient(
    135deg,
    @obsidian-6 0%,
    @stone-4 50%,
    @obsidian-4 100%
  );
}
```

### 使用 CSS 變量

```css
.custom-element {
  background-color: var(--azure-6);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### 組合多個效果

```html
<div class="tortoise-card hover-lift hover-border-azure">
  <h3>組合效果卡片</h3>
  <p>結合多種懸停效果</p>
</div>
```

---

## ⚡ 轉場系統 (Transition System)

### 三級轉場時間

```less
@transition-fast: 0.15s;    // 快速 - 即時回饋
@transition-base: 0.3s;     // 標準 - 一般過渡
@transition-slow: 0.5s;     // 緩慢 - 複雜動畫
```

### 使用指南

- **Fast (0.15s)**: 懸停回饋、表格行高亮、小型互動
- **Base (0.3s)**: 按鈕狀態、表單控制項、選單展開
- **Slow (0.5s)**: 模態框、抽屜、複雜動畫序列

### 實作範例

```less
.interactive-element {
  transition: all @transition-base ease-in-out;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: @shadow-lg;
  }
}
```

---

## 🎭 預載器 (Preloader)

### index.html 配置

專案預載器使用「龍躍雲端」漸變：

```html
<style>
  #preloader {
    background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  }
  
  .spinner {
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
</style>
```

### 自訂預載器

```typescript
// 在 app.component.ts 中控制預載器
export class AppComponent implements OnInit {
  ngOnInit() {
    // 隱藏預載器
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => preloader.remove(), 300);
    }
  }
}
```

---

## 📱 響應式設計 (Responsive Design)

### 斷點 (Breakpoints)

```less
@screen-xs: 480px;
@screen-sm: 576px;
@screen-md: 768px;
@screen-lg: 992px;
@screen-xl: 1200px;
@screen-xxl: 1600px;
```

### 響應式實作

```less
.responsive-card {
  padding: 24px;
  
  @media (max-width: @screen-md) {
    padding: 16px;
  }
  
  @media (max-width: @screen-sm) {
    padding: 12px;
  }
}
```

---

## ♿ 無障礙設計 (Accessibility)

### WCAG 2.1 AA 合規

- ✅ 色彩對比度 >= 4.5:1
- ✅ 鍵盤導航支援
- ✅ 焦點可視指示器
- ✅ ARIA 標籤與屬性
- ✅ 螢幕閱讀器友好

### 焦點狀態

所有互動元素都有清晰的焦點指示器：

```less
.focusable-element {
  &:focus {
    outline: 2px solid @obsidian-6;
    outline-offset: 2px;
  }
  
  &:focus-visible {
    box-shadow: 0 0 0 2px fade(@obsidian-6, 20%);
  }
}
```

### 鍵盤導航測試

1. 使用 Tab 鍵在元素間導航
2. 使用 Enter/Space 觸發動作
3. 使用 Escape 關閉模態框
4. 使用方向鍵導航選單

---

## 🧪 測試指南 (Testing Guide)

### 視覺測試檢查清單

#### ✅ 按鈕測試
- [ ] Primary 按鈕懸停時漸變過渡流暢
- [ ] 按鈕提升效果與陰影同步
- [ ] 焦點環清晰可見
- [ ] 所有按鈕類型行為一致

#### ✅ 卡片測試
- [ ] 卡片懸停時提升 2px
- [ ] 陰影從 sm 增強到 lg
- [ ] 邊框高亮效果出現
- [ ] 所有效果同步過渡

#### ✅ 表單控制項測試
- [ ] 輸入框懸停邊框顏色變化
- [ ] 焦點時出現陰影環
- [ ] 複選框/單選按鈕懸停回饋
- [ ] 開關動畫流暢

#### ✅ 導航測試
- [ ] 選單項目懸停背景淡入
- [ ] 選中項目邊框高亮
- [ ] 動畫過渡自然
- [ ] 鍵盤導航正常

#### ✅ 表格測試
- [ ] 行懸停高亮效果
- [ ] 選中行保持高亮
- [ ] 表頭漸變背景正確
- [ ] 過渡時間合理

### 瀏覽器兼容性

| 瀏覽器 | 版本 | 支援狀態 |
|--------|------|---------|
| Chrome | 120+ | ✅ 完全支援 |
| Firefox | 120+ | ✅ 完全支援 |
| Safari | 17+ | ✅ 完全支援 |
| Edge | 120+ | ✅ 完全支援 |
| IE 11 | - | ❌ 不支援 |

### 效能測試

#### 動畫效能
- 所有動畫使用硬體加速 (transform, opacity)
- 目標幀率: 60fps
- 避免重繪密集屬性 (width, height, top, left)

#### 測試工具
```bash
# 使用 Chrome DevTools 檢查效能
# 1. 開啟 Performance 面板
# 2. 錄製互動過程
# 3. 檢查 FPS 和 CPU 使用率
```

---

## 🔧 技術實作 (Technical Implementation)

### 檔案結構

```
src/styles/
├── theme.less                      # 主題變量定義
├── index.less                      # 主樣式檔案
└── black-tortoise-theme.css          # 運行時 CSS（參考）

docs/ui-theme/
├── black-tortoise-theme-zh-TW.md    # 本文檔
├── black-tortoise-theme-variables.less  # 變量參考
├── black-tortoise-theme.css          # 編譯後的 CSS
├── black-tortoise-theme-examples.md  # 範例程式碼
└── demo.html                       # 實時預覽
```

### 主題變量使用

```less
// 1. 引入主題變量
@import '~src/styles/theme.less';

// 2. 使用預定義顏色
.custom-component {
  color: @obsidian-6;
  background: @stone-1;
  border: 1px solid @obsidian-4;
}

// 3. 使用漸變
.gradient-header {
  background: @gradient-dragon-soaring;
}

// 4. 使用轉場
.animated-element {
  transition: all @transition-base ease-in-out;
}
```

### 整合到 Angular 元件

```typescript
@Component({
  selector: 'app-custom',
  template: `
    <div class="tortoise-card hover-lift">
      <h3>自訂元件</h3>
      <button nz-button nzType="primary">動作</button>
    </div>
  `,
  styleUrls: ['./custom.component.less']
})
export class CustomComponent { }
```

```less
// custom.component.less
@import '~src/styles/theme.less';

:host {
  .custom-header {
    background: @gradient-dawn-light;
    padding: 16px;
    border-radius: 8px;
  }
  
  .custom-content {
    color: @text-primary;
    transition: all @transition-base;
    
    &:hover {
      color: @obsidian-6;
    }
  }
}
```

---

## 📐 設計規範 (Design Specifications)

### 間距系統

```less
@spacing-xs: 8px;
@spacing-sm: 12px;
@spacing-md: 16px;
@spacing-lg: 24px;
@spacing-xl: 32px;
@spacing-xxl: 48px;
```

### 圓角 (Border Radius)

```less
@border-radius-sm: 2px;
@border-radius-base: 4px;
@border-radius-lg: 8px;
@border-radius-xl: 12px;
```

### 陰影 (Shadows)

```less
@shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
@shadow-base: 0 2px 8px rgba(0, 0, 0, 0.08);
@shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
@shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);
```

### 字體系統

```less
@font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
              'Helvetica Neue', Arial, 'Noto Sans', sans-serif;

@font-size-sm: 12px;
@font-size-base: 14px;
@font-size-lg: 16px;
@font-size-xl: 20px;
@font-size-xxl: 24px;

@line-height-base: 1.5;
@line-height-lg: 1.75;
```

---

## 🎨 設計原則 (Design Principles)

### 1. 一致性 (Consistency)

所有元件使用統一的色彩系統、間距和轉場時間。

### 2. 回饋性 (Feedback)

每個互動都提供即時的視覺回饋，讓用戶清楚操作結果。

### 3. 層次感 (Hierarchy)

使用陰影和提升效果建立清晰的視覺層次。

### 4. 流暢性 (Fluidity)

所有動畫和過渡都經過精心調整，確保流暢自然。

### 5. 無障礙性 (Accessibility)

遵循 WCAG 2.1 AA 標準，確保所有用戶都能使用。

---

## 🚧 已知問題 (Known Issues)

### 建置狀態

⚠️ **注意**: 當前建置可能有不相關的 TypeScript 錯誤
✅ **CSS/LESS 變更**: 所有樣式變更編譯成功

### 瀏覽器支援

- ✅ 現代瀏覽器 (Chrome 120+, Firefox 120+, Safari 17+, Edge 120+)
- ⚠️ 不支援 IE 11（請使用降級樣式）

---

## 📚 相關資源 (Related Resources)

### 官方文檔
- [ng-zorro-antd](https://ng.ant.design/docs/introduce/zh)
- [ng-alain](https://ng-alain.com/docs/getting-started/zh)
- [Angular](https://angular.dev)

### 專案文檔
- [共享模組指南](../development/shared-modules-guide.md)
- [Firebase Authentication](../authentication/firebase-authentication.md)
- [Firebase/Firestore Integration](../authentication/firebase-integration.md)

### 設計資源
- [Black Tortoise 範例](./black-tortoise-theme-examples.md)
- [變量參考](./black-tortoise-theme-variables.less)
- [實時預覽](./demo.html)

---

## 🔄 版本歷史 (Version History)

### v1.1.0 (2025-01-09)
- ✅ 全面的懸停狀態改進
- ✅ 所有元件的增強轉場
- ✅ 新的懸停工具類
- ✅ 擴展的 CSS 變量
- ✅ 完整的測試文檔
- ✅ 文檔中文化與整合

### v1.0.1 (2025-12-09)
- ✅ 預載器顏色修復
- ✅ 圖標註冊
- ✅ 移除未使用的檔案
- ✅ 樣式一致性驗證

### v1.0.0 (2025-12-09)
- ✅ 初始 Black Tortoise 主題實作
- ✅ 色彩系統與漸變
- ✅ 基礎元件樣式
- ✅ 與 ng-alain 和 ng-zorro-antd 整合

---

## 🎯 未來規劃 (Roadmap)

### 計畫增強功能
- [ ] 深色模式懸停狀態
- [ ] 高對比度模式支援
- [ ] 動畫偏好設定（減少動作）
- [ ] 額外的懸停效果變體
- [ ] 互動式文檔與實時範例

---

## 💡 最佳實踐 (Best Practices)

### DO's ✅

```html
<!-- 使用預定義的 utility classes -->
<div class="tortoise-card hover-lift">內容</div>

<!-- 組合多個效果類 -->
<button class="primary-btn hover-scale">動作</button>

<!-- 使用主題變量 -->
<style>
  .custom { color: var(--azure-6); }
</style>
```

### DON'Ts ❌

```html
<!-- 不要使用硬編碼的顏色 -->
<div style="color: #0EA5E9">不好</div>

<!-- 不要繞過主題系統 -->
<style>
  .custom { background: blue !important; }
</style>

<!-- 不要創建重複的樣式 -->
<div class="my-custom-hover-effect">已有 hover-lift</div>
```

---

## 📞 支援與貢獻 (Support & Contributing)

### 遇到問題？

1. 檢查現有文檔
2. 查看範例程式碼
3. 檢視實作在 `src/styles/index.less`
4. 提交問題報告（包含瀏覽器/設備資訊）

### 貢獻指南

進行 UI 變更時：

1. 遵循三級轉場系統
2. 使用 Black Tortoise 色彩變量
3. 測試無障礙性（鍵盤 + 螢幕閱讀器）
4. 更新文檔
5. 必要時添加到測試檢查清單

---

## 📄 授權 (License)

MIT License - 請參閱主專案 LICENSE 檔案

---

**維護者**: GitHub Copilot  
**專案**: GigHub - 工地施工進度追蹤管理系統  
**文件版本**: 1.1.0  
**最後更新**: 2025-01-09
