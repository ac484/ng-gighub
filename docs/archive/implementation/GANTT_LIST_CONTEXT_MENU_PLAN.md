# 甘特圖拖曳與列表視圖右鍵功能實現計畫

## 概述

基於 ⭐.md 流程和奧卡姆剃刀原則（Occam's Razor），實現最簡單有效的解決方案。

## 實施目標

### 1. 列表視圖右鍵功能
- **現狀**: ST 表格使用內建操作按鈕
- **目標**: 添加右鍵選單支援
- **原則**: 複用現有 TaskContextMenuComponent，最小化代碼重複

### 2. 甘特圖視圖拖曳功能
- **現狀**: 靜態顯示，無拖曳功能
- **目標**: 支援任務時間範圍拖曳調整
- **原則**: 使用 Angular CDK Drag-Drop（已在看板視圖使用，保持一致性）

### 3. 樹狀視圖樣式檢查
- **現狀**: 功能正常，需檢查視覺一致性
- **目標**: 確保樣式符合設計規範
- **原則**: 最小化樣式修改，保持 ng-zorro-antd 預設風格

## 技術方案

### 列表視圖右鍵選單

**方案**：在 ST 表格行上添加 contextmenu 事件

```typescript
// 使用 ST customRequest 或 row 事件
columns: STColumn[] = [
  // ...existing columns
  {
    title: '操作',
    buttons: [
      // 保留現有按鈕
      {
        text: '更多',
        children: [
          {
            text: '編輯',
            click: (record: any) => this.onEdit(record)
          },
          // ... 其他操作
        ]
      }
    ]
  }
];

// 添加行右鍵事件
onRowContextMenu(event: MouseEvent, record: Task): void {
  event.preventDefault();
  this.contextMenuService.open(event, record, {
    viewType: 'list',
    allowMove: false,
    allowExpandCollapse: false
  });
}
```

**優點**：
- 複用現有 TaskContextMenuComponent
- 最小代碼變更
- 與樹狀/看板視圖一致

### 甘特圖拖曳功能

**方案**：使用 Angular CDK DragDrop

```typescript
// 1. 僅支援水平拖曳（時間軸方向）
// 2. 拖曳後更新任務 startDate/endDate
// 3. 使用 cdkDrag 指令 + cdkDragBoundary

<div class="task-bar"
     cdkDrag
     cdkDragBoundary=".gantt-chart"
     [cdkDragFreeDragPosition]="{x: taskPosition, y: 0}"
     (cdkDragEnded)="onTaskDragEnd($event, task)">
  <!-- task bar content -->
</div>
```

**實施步驟**：
1. 導入 `DragDropModule` from `@angular/cdk/drag-drop`
2. 在 task-bar 添加 cdkDrag 指令
3. 限制拖曳為水平方向（lockAxis: 'x'）
4. 計算新的日期範圍並更新
5. 調用 Store 的 updateTask 方法

**優點**：
- 使用 Angular CDK（標準方案）
- 與看板視圖拖曳技術一致
- 無需第三方庫
- 簡單直接

### 樹狀視圖樣式優化

**檢查項目**：
1. 節點間距和縮排
2. 圖標對齊
3. 展開/收合動畫
4. 右鍵選單位置
5. 懸停效果

**原則**：
- 遵循 ng-zorro-antd 設計規範
- 最小化自定義 CSS
- 確保與其他視圖一致

## 實施順序（基於 ⭐.md）

### Phase 1: 列表視圖右鍵選單（0.5 天）
1. 修改 task-list-view.component.ts
2. 添加 contextmenu 事件處理
3. 整合 TaskContextMenuComponent
4. 測試功能

### Phase 2: 甘特圖拖曳功能（1-1.5 天）
1. 導入 DragDropModule
2. 修改 task-gantt-view.component.ts
3. 實現拖曳邏輯
4. 計算日期更新
5. 調用 Store 更新
6. 測試功能

### Phase 3: 樹狀視圖樣式檢查（0.5 天）
1. 檢查現有樣式
2. 修復發現的問題
3. 確保跨瀏覽器一致性

### Phase 4: 整合測試與優化（0.5 天）
1. 運行 yarn build
2. 運行 yarn lint
3. 手動測試所有功能
4. 性能優化

**總計**: 2.5-3 天

## 架構符合性

✅ 三層架構（Repository → Store → Component）
✅ Signal 狀態管理
✅ EventBus 整合
✅ Audit 日誌記錄
✅ 最小化代碼重複（奧卡姆剃刀）
✅ 使用標準庫（Angular CDK）
✅ 保持一致性（與現有實現對齊）

## 風險與限制

**列表視圖**：
- ST 表格可能不完全支援 contextmenu 事件
- 備選方案：使用 customRequest 或 row click

**甘特圖**：
- 拖曳需要精確的像素到日期轉換
- 需要處理邊界情況（任務超出時間軸）
- 依賴關係視覺化可能需要重新計算

**樹狀視圖**：
- 樣式問題可能涉及 ng-zorro-antd 內部 CSS
- 需要測試不同瀏覽器

## 成功標準

- ✅ 列表視圖支援右鍵選單
- ✅ 甘特圖支援任務時間拖曳
- ✅ 樹狀視圖樣式美觀一致
- ✅ 通過 yarn build（無編譯錯誤）
- ✅ 通過 yarn lint（無 lint 錯誤）
- ✅ 所有功能手動測試通過
- ✅ 符合奧卡姆剃刀原則（最簡方案）
