# 玄武主題設計 (Black Tortoise Theme Design)

## 概述 (Overview)

玄武（Black Tortoise）是中國傳統四象之一，代表北方、冬季、水德。在五行中屬水，對應玄色（深黑色系）。本設計以玄武為靈感，創建一套現代化的顏色主題系統。

The Black Tortoise (Xuanwu) is one of the Four Symbols in Chinese mythology, representing the North, Winter season, and Water element. This design creates a modern color theme system inspired by the Black Tortoise.

## 設計理念 (Design Philosophy)

### 玄武象徵意義
- **方位**: 北方 (North)
- **季節**: 冬天 (Winter)
- **五行**: 水 (Water)
- **特性**: 守護、穩定、深沉、力量
- **顏色**: 玄色系（深黑色調）

### 色彩靈感來源
1. **深夜與星空**: 寧靜的夜空、神秘的宇宙
2. **玄武龜甲**: 堅固的盾牌、防禦的象徵
3. **深海之水**: 沉穩而深邃的水域
4. **冬日雪原**: 靜謐而安詳的冬季景致

## 主色調系統 (Primary Color System)

### 主色調 - 玄武黑 (Black Tortoise Obsidian)
```
Primary Color: #1E293B (Obsidian Black)
主色調採用深沉的黑曜石色，象徵玄武的堅固守護之力
註：從 Ant Design 默認的 #1890FF 優化為 #1E293B 以體現玄武的莊重氣質
```

### 完整色階 (Color Palette)
| 色階 | 顏色代碼 | 用途 | 說明 |
|------|---------|------|------|
| obsidian-1 | #F8FAFC | 背景淺色 | 最淺的灰白色，用於背景 |
| obsidian-2 | #F1F5F9 | 懸停淺色 | 輕微交互效果 |
| obsidian-3 | #E2E8F0 | 次要元素 | 次要按鈕、標籤 |
| obsidian-4 | #CBD5E1 | 次要強調 | 輕度強調元素 |
| obsidian-5 | #94A3B8 | 輔助色 | 輔助性視覺元素 |
| **obsidian-6** | **#1E293B** | **主色** | **主要品牌色** |
| obsidian-7 | #0F172A | 主色深化 | 懸停、選中狀態 |
| obsidian-8 | #0A0E1A | 深色強調 | 強調、高對比 |
| obsidian-9 | #05070F | 最深強調 | 最深的強調色 |
| obsidian-10 | #020617 | 深色背景 | 暗色模式使用 |

## 輔助色系統 (Secondary Color System)

### 石灰 (Stone Gray) - 龜甲
象徵玄武龜甲的堅固質感，代表穩定與防護。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| stone-1 | #F1F5F9 | 最淺石灰 |
| stone-2 | #E2E8F0 | 淺石灰 |
| stone-3 | #CBD5E1 | 中等石灰 |
| **stone-4** | **#475569** | **主石灰** |
| stone-5 | #334155 | 深石灰 |
| stone-6 | #1E293B | 最深石灰 |

### 深水藍 (Deep Waters) - 水德
象徵玄武的水德屬性，深邃而平靜。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| waters-1 | #EEF2FF | 最淺深水藍 |
| waters-2 | #E0E7FF | 淺深水藍 |
| **waters-3** | **#1E40AF** | **主深水藍** |
| waters-4 | #1E3A8A | 深水藍 |
| waters-5 | #1E3A8A | 最深水藍 |

### 守護靛藍 (Guardian Indigo) - 夜空
象徵夜空中玄武的守護之力，神秘而沉穩。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| indigo-1 | #EEF2FF | 最淺靛藍 |
| indigo-2 | #E0E7FF | 淺靛藍 |
| **indigo-3** | **#6366F1** | **主靛藍** |
| indigo-4 | #4F46E5 | 深靛藍 |
| indigo-5 | #4338CA | 最深靛藍 |

## 漸變色系統 (Gradient System)

### 主要漸變 (Primary Gradients)

#### 1. 龜甲守護 (Tortoise Shield)
```css
background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
```
用途：主要按鈕、英雄區塊、重要卡片背景

#### 2. 深夜水波 (Midnight Waters)
```css
background: linear-gradient(180deg, #1E293B 0%, #1E40AF 50%, #475569 100%);
```
用途：大型橫幅、頁面背景

#### 3. 玄武紋理 (Tortoise Texture)
```css
background: linear-gradient(45deg, #0F172A 0%, #334155 50%, #1E293B 100%);
```
用途：裝飾性元素、邊框漸變

#### 4. 寧靜微光 (Tranquil Light)
```css
background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%);
```
用途：淺色背景、卡片背景

#### 5. 深淵神秘 (Abyss Mystery)
```css
background: linear-gradient(135deg, #020617 0%, #1E293B 100%);
```
用途：暗色模式主背景

### 漸變變化 (Gradient Variations)

#### 徑向漸變 (Radial Gradients)
```css
/* 守護光環 */
background: radial-gradient(circle at center, #1E293B 0%, #1E40AF 50%, transparent 100%);

/* 能量波紋 */
background: radial-gradient(ellipse at center, #475569 0%, #1E293B 40%, transparent 70%);
```

## 配色方案 (Color Schemes)

### 淺色主題 (Light Theme)
```less
// 主色
@primary-color: #1E293B;
@link-color: #1E293B;
@success-color: #10B981;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #1E40AF;

// 背景色
@body-background: #F8FAFC;
@component-background: #FFFFFF;
@layout-body-background: #F1F5F9;

// 文字色
@text-color: #1E293B;
@text-color-secondary: #475569;
@heading-color: #0F172A;

// 邊框色
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;
```

### 暗色主題 (Dark Theme)
```less
// 主色
@primary-color: #475569;
@link-color: #6366F1;
@success-color: #10B981;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #1E40AF;

// 背景色
@body-background: #0F172A;
@component-background: #1E293B;
@layout-body-background: #020617;

// 文字色
@text-color: #F1F5F9;
@text-color-secondary: #94A3B8;
@heading-color: #F8FAFC;

// 邊框色
@border-color-base: #334155;
@border-color-split: #475569;
```

## 語義化配色 (Semantic Colors)

### 功能狀態色
| 狀態 | 顏色 | 代碼 | 說明 |
|------|------|------|------|
| 成功 | 翠綠 | #10B981 | 操作成功、正面反饋 |
| 警告 | 琥珀黃 | #F59E0B | 需要注意的信息 |
| 錯誤 | 赤紅 | #EF4444 | 錯誤、危險操作 |
| 信息 | 深水藍 | #1E40AF | 一般信息提示 |

### 互動狀態
```less
// 懸停態
@hover-color: #475569;
@hover-bg: #F8FAFC;

// 激活態
@active-color: #0F172A;
@active-bg: #F1F5F9;

// 禁用態
@disabled-color: #94A3B8;
@disabled-bg: #F1F5F9;
```

## 應用示例 (Application Examples)

### 按鈕 (Buttons)
```css
/* 主要按鈕 */
.btn-primary {
  background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
  border: none;
  color: #FFFFFF;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.4);
}

/* 次要按鈕 */
.btn-secondary {
  background: transparent;
  border: 2px solid #1E293B;
  color: #1E293B;
}

.btn-secondary:hover {
  background: #F8FAFC;
  border-color: #475569;
}
```

### 卡片 (Cards)
```css
/* 標準卡片 */
.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

/* 高亮卡片 */
.card-highlight {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border: 2px solid #1E293B;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.15);
}

/* 特色卡片 */
.card-featured {
  background: linear-gradient(135deg, #1E293B 0%, #475569 100%);
  color: #FFFFFF;
  border: none;
}
```

### 導航 (Navigation)
```css
/* 側邊欄 */
.sidebar {
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border-right: 1px solid #E2E8F0;
}

/* 激活項 */
.sidebar-item-active {
  background: linear-gradient(90deg, #1E293B 0%, transparent 100%);
  color: #1E293B;
  border-left: 3px solid #1E293B;
}

/* 頂部導航 */
.navbar {
  background: linear-gradient(90deg, #1E293B 0%, #475569 100%);
  box-shadow: 0 2px 8px rgba(30, 41, 59, 0.2);
}
```

## 陰影系統 (Shadow System)

### 陰影層級
```css
/* 微陰影 - 卡片、按鈕 */
--shadow-sm: 0 1px 2px rgba(30, 41, 59, 0.05);

/* 標準陰影 - 浮動元素 */
--shadow-md: 0 4px 6px rgba(30, 41, 59, 0.1);

/* 較大陰影 - 彈窗、抽屜 */
--shadow-lg: 0 10px 15px rgba(30, 41, 59, 0.15);

/* 超大陰影 - 模態框 */
--shadow-xl: 0 20px 25px rgba(30, 41, 59, 0.2);

/* 玄武光暈效果 */
--glow-obsidian: 0 0 20px rgba(30, 41, 59, 0.5);
--glow-waters: 0 0 20px rgba(30, 64, 175, 0.5);
```

## 動畫與過渡 (Animations & Transitions)

### 標準過渡
```css
/* 標準過渡時間 */
--transition-fast: 0.15s ease;
--transition-base: 0.3s ease;
--transition-slow: 0.5s ease;

/* 玄武特效 */
@keyframes tortoise-flow {
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

.tortoise-effect {
  background: linear-gradient(270deg, #1E293B, #475569, #1E40AF, #1E293B);
  background-size: 400% 400%;
  animation: tortoise-flow 8s ease infinite;
}
```

### 脈衝效果
```css
@keyframes tortoise-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(30, 41, 59, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(30, 41, 59, 0);
  }
}

.pulse-effect {
  animation: tortoise-pulse 2s ease-in-out infinite;
}
```

## 使用指南 (Usage Guidelines)

### 最佳實踐

1. **主色使用**
   - 主要行為按鈕、鏈接使用主色 #1E293B
   - 避免大面積使用主色，保持視覺平衡
   - 重要信息使用主色高亮

2. **漸變使用**
   - 大型背景使用淺色漸變
   - 按鈕、標籤使用主要漸變
   - 避免過多漸變造成視覺混亂

3. **對比度**
   - 確保文字與背景對比度至少 4.5:1
   - 重要信息使用高對比度配色
   - 暗色主題注意調整對比度

4. **可訪問性**
   - 不僅依賴顏色傳達信息
   - 提供圖標、文字等多重提示
   - 支持鍵盤導航

### 不推薦的做法

❌ 避免使用純黑色 (#000000)，使用深藍灰 (#0F172A)
❌ 避免使用過於鮮豔的顏色組合
❌ 避免在小面積元素上使用漸變
❌ 避免過度使用動畫效果

## 品牌識別 (Brand Identity)

### Logo 配色建議
```
主色方案：#1E293B (玄武黑) + #475569 (石灰)
輔助方案：#1E40AF (深水藍) + #6366F1 (守護靛藍)
```

### 視覺元素
- 使用穩重的線條表現玄武的守護力量
- 結合中國傳統龜甲、水波紋圖案
- 漸變方向建議：由深至淺，象徵穩定與守護

## 技術實現 (Technical Implementation)

### LESS 變量定義
```less
// Black Tortoise Theme Variables
@black-tortoise-primary: #1E293B;
@black-tortoise-secondary: #475569;
@black-tortoise-tertiary: #1E40AF;

// Gradient Definitions
@gradient-tortoise-shield: linear-gradient(135deg, @black-tortoise-primary 0%, @black-tortoise-secondary 100%);
@gradient-midnight-waters: linear-gradient(180deg, @black-tortoise-primary 0%, @black-tortoise-tertiary 50%, @black-tortoise-secondary 100%);

// Shadow Definitions
@shadow-obsidian-sm: 0 1px 2px rgba(30, 41, 59, 0.05);
@shadow-obsidian-md: 0 4px 6px rgba(30, 41, 59, 0.1);
@shadow-obsidian-lg: 0 10px 15px rgba(30, 41, 59, 0.15);
```

### CSS 自定義屬性
```css
:root {
  /* Primary Colors */
  --obsidian-1: #F8FAFC;
  --obsidian-2: #F1F5F9;
  --obsidian-3: #E2E8F0;
  --obsidian-4: #CBD5E1;
  --obsidian-5: #94A3B8;
  --obsidian-6: #1E293B;
  --obsidian-7: #0F172A;
  --obsidian-8: #0A0E1A;
  --obsidian-9: #05070F;
  --obsidian-10: #020617;
  
  /* Secondary Colors */
  --stone-primary: #475569;
  --waters-primary: #1E40AF;
  --indigo-primary: #6366F1;
  
  /* Gradients */
  --gradient-tortoise-shield: linear-gradient(135deg, var(--obsidian-6) 0%, var(--stone-primary) 100%);
  --gradient-midnight-waters: linear-gradient(180deg, var(--obsidian-6) 0%, var(--waters-primary) 50%, var(--stone-primary) 100%);
}
```

## 版本歷史 (Version History)

- **v1.0.0** (2025-12-08) - 初始版本，建立玄武主題基礎色彩系統

## 參考資料 (References)

- 中國傳統四象文化
- 現代扁平化設計原則
- Material Design 色彩系統
- Ant Design 設計語言
- Tailwind CSS 色彩哲學

---

**設計師**: GitHub Copilot Agent
**最後更新**: 2025-12-13
**版本**: 1.0.0
