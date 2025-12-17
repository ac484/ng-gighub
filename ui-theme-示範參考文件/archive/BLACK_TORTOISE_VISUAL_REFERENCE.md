# Black Tortoise Theme Visual Reference
# 玄武主題視覺參考

本文件展示玄武主題在 GigHub 專案中的視覺效果。

## 主題色彩 (Theme Colors)

### 主色調 (Primary Colors)
```
Black Tortoise Blue (玄武藍): #1E293B
├── Obsidian 1: #E6F7FF (Background Light)
├── Obsidian 2: #BAE7FF (Hover Light)
├── Obsidian 3: #91D5FF (Secondary)
├── Obsidian 4: #69C0FF (Medium Light)
├── Obsidian 5: #40A9FF (Helper)
├── Obsidian 6: #1E293B ⭐ PRIMARY
├── Obsidian 7: #0C83BA (Hover Dark)
├── Obsidian 8: #0A688B (Emphasis)
├── Obsidian 9: #084C5C (Deep)
└── Obsidian 10: #06303D (Darkest)
```

### 輔助色 (Secondary Colors)
```
Jade Green (翡翠綠): #475569 ⭐ SUCCESS
Cyan (青綠): #06B6D4 ⭐ INFO
Warning (警告): #F59E0B
Error (錯誤): #EF4444
```

## 應用場景 (Application Scenarios)

### 1. 頁首/導航欄 (Header/Navigation)
- 背景色: Black Tortoise Blue (#1E293B)
- 文字色: White (#FFFFFF)
- 懸停效果: 稍微變暗
- 陰影: 0 2px 8px rgba(14, 165, 233, 0.2)

### 2. 側邊欄 (Sidebar)
- 背景色: White (#FFFFFF)
- 選中項背景: Obsidian 1 (#E6F7FF)
- 選中項文字: Obsidian 6 (#1E293B)
- 選中項左邊框: 3px solid Obsidian 6
- 懸停效果: Obsidian 6 文字色

### 3. 按鈕 (Buttons)
#### 主要按鈕 (Primary Button)
- 背景: 漸變 (Obsidian 6 → Jade 4)
- 文字: White
- 懸停: 漸變加深 + 陰影

#### 次要按鈕 (Secondary Button)
- 背景: Transparent
- 邊框: 2px solid Obsidian 6
- 文字: Obsidian 6
- 懸停: Obsidian 1 背景

### 4. 卡片 (Cards)
#### 標準卡片
- 背景: White
- 邊框: 1px solid #E2E8F0
- 圓角: 8px
- 陰影: 0 1px 3px rgba(15, 23, 42, 0.1)
- 懸停: 陰影加深 + Obsidian 6 邊框

#### 特色卡片
- 背景: 龜甲守護漸變
- 文字: White
- 陰影: 0 10px 15px rgba(14, 165, 233, 0.15)

### 5. 表單控件 (Form Controls)
- 正常邊框: #CBD5E1
- 焦點邊框: Obsidian 6
- 焦點光暈: 0 0 0 2px rgba(14, 165, 233, 0.2)
- 錯誤狀態: Error color
- 成功狀態: Jade Green

### 6. 表格 (Tables)
- 表頭背景: Dawn Light 漸變
- 表頭文字: Obsidian 7
- 行懸停: Obsidian 1 背景
- 選中行: Obsidian 1 背景 + Obsidian 3 邊框

### 7. 標籤 (Tags)
- Obsidian 標籤: Obsidian 6 文字 + Obsidian 1 背景
- Jade 標籤: Jade 4 文字 + Jade 1 背景
- Cyan 標籤: Cyan 3 文字 + Cyan 1 背景

### 8. 進度條 (Progress Bar)
- 背景: #F0F0F0
- 進度色: 龜甲守護漸變

### 9. 提示訊息 (Messages/Alerts)
#### Info
- 背景: Obsidian 1
- 邊框: Obsidian 3
- 圖示: Obsidian 6

#### Success
- 背景: Jade 1
- 邊框: Jade 2
- 圖示: Jade 4

#### Warning
- 背景: #FFF7E6
- 圖示: #F59E0B

#### Error
- 背景: #FFF1F0
- 圖示: #EF4444

## 漸變效果 (Gradient Effects)

### 1. 龜甲守護 (Tortoise Shield)
```css
background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
```
用途: 主要按鈕、英雄區塊、特色卡片

### 2. 碧海青天 (Obsidian Sky & Sea)
```css
background: linear-gradient(180deg, #1E293B 0%, #06B6D4 50%, #475569 100%);
```
用途: 大型橫幅、頁面背景

### 3. 玄武鱗片 (Tortoise Texture)
```css
background: linear-gradient(45deg, #0C83BA 0%, #0D9488 50%, #1E293B 100%);
```
用途: 裝飾性元素、懸停效果

### 4. 晨曦微光 (Dawn Light)
```css
background: linear-gradient(135deg, #E6F7FF 0%, #E0F7FA 50%, #E6FFF9 100%);
```
用途: 表格表頭、卡片背景、模態框

### 5. 深海神秘 (Deep Mystery)
```css
background: linear-gradient(135deg, #084C5C 0%, #0A7C6C 100%);
```
用途: 暗色模式主背景（未來實現）

## 特殊效果 (Special Effects)

### 龍流動效果 (Dragon Flow Animation)
```css
.dragon-effect {
  background: linear-gradient(270deg, #1E293B, #475569, #06B6D4, #1E293B);
  background-size: 400% 400%;
  animation: dragon-flow 8s ease infinite;
}
```
應用: 載入動畫、特殊強調區域

### 脈衝效果 (Dragon Pulse Animation)
```css
.dragon-pulse {
  animation: dragon-pulse 2s ease-in-out infinite;
}
```
應用: 通知圖示、重要按鈕、即時更新指示器

### 光暈效果 (Glow Effects)
```css
.tortoise-glow {
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
}

.jade-glow {
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.5);
}
```
應用: 懸停狀態、焦點元素、狀態指示器

## 響應式設計 (Responsive Design)

### 桌面端 (Desktop: ≥992px)
- 完整漸變效果
- 完整動畫
- 標準間距 (24px)

### 平板端 (Tablet: 768px-991px)
- 簡化漸變
- 中等間距 (16px)

### 手機端 (Mobile: <768px)
- 使用純色替代漸變（性能優化）
- 簡化動畫
- 緊湊間距 (12px)

## 無障礙設計 (Accessibility)

### 對比度測試結果
- Obsidian 6 (#1E293B) on White: ✅ WCAG AA
- Jade 4 (#475569) on White: ✅ WCAG AA
- Obsidian 6 文字 on Obsidian 1 背景: ✅ WCAG AA
- White 文字 on Obsidian 6 背景: ✅ WCAG AAA

### 焦點指示
```css
.tortoise-focus-visible:focus-visible {
  outline: 2px solid #1E293B;
  outline-offset: 2px;
}
```

### 鍵盤導航
- 所有互動元素可鍵盤存取
- 清晰的焦點指示器
- 邏輯的 Tab 順序

## 列印樣式 (Print Styles)

列印時自動將漸變轉換為純色，確保列印效果：

```less
@media print {
  .tortoise-bg-gradient,
  .tortoise-bg-gradient-sky,
  .dragon-effect {
    background: @tortoise-6 !important;
  }
}
```

## 深色模式 (Dark Mode - 未來實現)

預留深色模式變量：

```css
[data-theme='dark'] {
  --primary-color: var(--cyan-3);
  --body-background: #0f172a;
  --component-background: #1e293b;
  --text-color: #f1f5f9;
  --border-color-base: #334155;
}
```

## 使用建議 (Usage Guidelines)

### ✅ 推薦做法
1. 主要操作使用 Black Tortoise Blue
2. 成功狀態使用 Jade Green
3. 資訊提示使用 Cyan
4. 重要區域使用漸變效果
5. 保持一致的間距與圓角

### ❌ 避免做法
1. 過度使用漸變（會影響性能）
2. 在小元素上使用複雜漸變
3. 混用過多顏色（保持簡潔）
4. 忽略對比度要求
5. 過度使用動畫效果

## 實作清單 (Implementation Checklist)

- [x] 定義主題顏色變量
- [x] 配置 ng-zorro-antd 主題
- [x] 配置 ng-alain 佈局
- [x] 實作全局樣式
- [x] 添加工具類別
- [x] 創建漸變定義
- [x] 實作動畫效果
- [x] 優化響應式設計
- [x] 確保無障礙合規
- [x] 添加列印樣式
- [x] 創建文檔
- [x] 構建成功
- [ ] 視覺測試
- [ ] 跨瀏覽器測試
- [ ] 行動裝置測試
- [ ] 效能優化
- [ ] 使用者回饋收集

---

**最後更新**: 2025-12-08
**版本**: 1.0.0
**狀態**: 已完成核心整合 ✅
