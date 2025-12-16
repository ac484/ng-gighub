# 藍圖列表可收縮欄位功能

## 概述

在藍圖列表頁面實現了可收縮的次要欄位功能，使用者可以根據需要展開或收起次要資訊欄位，優化頁面空間利用和閱讀體驗。

## 功能特性

### 主要欄位（始終可見）
- 名稱
- 業主
- Slug
- 描述
- 狀態
- 進度
- 負責人
- 最後更新時間
- 操作按鈕

### 次要欄位（可收縮）
- 開始日期
- 預計完成日
- 建立時間
- 啟用模組數
- 預算
- 已花費

## 技術實現

### 使用的技術棧
- **Angular 20.3.x**: Standalone Components、Signals
- **ng-zorro-antd 20.3.1**: Collapse 元件
- **RxJS 7.8**: 反應式程式設計

### 核心實現

#### 1. Signal 狀態管理

```typescript
// 控制次要欄位顯示/隱藏的 signal
readonly showAdvancedColumns = signal(false);
```

#### 2. 欄位結構設計

```typescript
// 主要欄位（始終顯示）
private readonly primaryColumns: STColumn[] = [
  // 名稱、業主、Slug、描述、狀態、進度、負責人、最後更新時間
];

// 次要欄位（可收起）
private readonly secondaryColumns: STColumn[] = [
  // 開始日期、預計完成日、建立時間、啟用模組、預算、已花費
];

// 操作欄位（始終顯示）
private readonly actionColumn: STColumn = {
  // 檢視、設計、編輯、刪除按鈕
};
```

#### 3. Computed Signal 動態計算欄位

```typescript
// 根據 showAdvancedColumns 狀態動態組合欄位
readonly columns = computed<STColumn[]>(() => {
  const cols = [...this.primaryColumns];
  if (this.showAdvancedColumns()) {
    cols.push(...this.secondaryColumns);
  }
  cols.push(this.actionColumn);
  return cols;
});
```

#### 4. Collapse 元件整合

```html
<nz-collapse [nzBordered]="false" [nzGhost]="true">
  <nz-collapse-panel
    [nzHeader]="advancedHeader"
    [nzActive]="showAdvancedColumns()"
    (nzActiveChange)="toggleAdvancedColumns($event)"
  >
    <!-- 面板內容 -->
  </nz-collapse-panel>
</nz-collapse>
```

#### 5. 切換方法

```typescript
toggleAdvancedColumns(show: boolean): void {
  this.showAdvancedColumns.set(show);
  this.logger.debug('[BlueprintListComponent]', `Advanced columns ${show ? 'shown' : 'hidden'}`);
}
```

## 使用者體驗

### 預設狀態
- 次要欄位預設為收起狀態
- 頁面顯示核心資訊，保持簡潔

### 展開狀態
- 點擊「顯示次要欄位」面板
- 表格自動展開顯示所有次要欄位
- 面板標題變更為「隱藏次要欄位」

### 收起狀態
- 再次點擊面板標題
- 表格自動隱藏次要欄位
- 面板標題變更為「顯示次要欄位」

## UI 設計

### 面板樣式
- 使用扁平化設計 (`nzBordered="false"`, `nzGhost="true"`)
- 與整體 UI 風格保持一致
- 無邊框，透明背景

### 圖標指示
- 收起狀態：眼睛圖標（eye-invisible）
- 展開狀態：眼睛圖標（eye）

### 說明文字
- 面板標題顯示當前狀態和欄位清單
- 面板內容顯示詳細說明

## 優勢

### 1. 遵循奧卡姆剃刀原則
- 最小化變更，僅修改一個元件檔案
- 利用現有的 ng-zorro-antd 元件
- 無需新增複雜的狀態管理

### 2. 現代化 Angular 模式
- 使用 Signals 進行狀態管理
- 使用 Computed Signals 進行反應式計算
- 使用 OnPush 變更檢測優化效能

### 3. 良好的使用者體驗
- 平滑的展開/收起動畫
- 清晰的視覺指示
- 響應式設計

### 4. 易於維護
- 欄位結構清晰分離
- 單一職責原則
- 良好的程式碼註解

## 未來擴展

### 可能的優化方向
1. **狀態持久化**: 使用 localStorage 記住使用者的選擇
2. **自訂欄位**: 允許使用者自訂顯示的欄位
3. **欄位拖拽**: 支援拖拽調整欄位順序
4. **欄位群組**: 支援多個可收縮的欄位群組

## 參考資源

- [ng-zorro-antd Collapse 元件文檔](https://ng.ant.design/components/collapse/zh)
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [專案快速參考指南](.github/instructions/quick-reference.instructions.md)
