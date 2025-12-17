# 藍圖詳情頁面重構文檔

## 概述

本次重構針對藍圖詳情頁面 (`blueprint-detail.component.ts`) 的四個主要問題進行修復和優化。

**日期**: 2025-12-12  
**作者**: GitHub Copilot  
**版本**: 1.0

---

## 問題與解決方案

### 1. 藍圖載入閃現"藍圖不存在"錯誤 ✅

**問題描述**:
在藍圖詳情頁載入時，會短暫顯示"藍圖不存在"的錯誤訊息，然後才顯示正確的藍圖內容。

**根本原因**:
- 使用 `createAsyncState` 管理藍圖資料，初始狀態為 `null`
- Template 中的 `@else` 條件在非同步載入完成前就立即渲染
- 導致短暫顯示 404 錯誤頁面

**解決方案**:
使用 AsyncState 的 `load()` 方法自動管理載入狀態，避免手動設置資料時的時序問題。

```typescript
// 修改前
private async loadBlueprint(id: string): Promise<void> {
  try {
    const data = await firstValueFrom(this.blueprintService.getById(id));
    this.blueprintState.setData(data);
  } catch (error) {
    this.blueprintState.setData(null);
  }
}

// 修改後
private async loadBlueprint(id: string): Promise<void> {
  try {
    await this.blueprintState.load(
      firstValueFrom(this.blueprintService.getById(id))
    );
  } catch (error) {
    this.message.error('載入藍圖失敗');
  }
}
```

---

### 2. 審計記錄載入失敗 ✅

**問題描述**:
審計記錄元件無法正確載入資料，總是顯示"載入審計記錄失敗"錯誤。

**根本原因**:
元件使用錯誤的查詢參數名稱（`entityType`, `operation`），與實際的 `AuditLogQueryOptions` 介面不符（應為 `category`, `resourceType`）。

**解決方案**:
修正查詢參數以符合實際資料模型，並使用 AsyncState 的 `load()` 方法。

```typescript
// 修改前
filterEntityType: AuditEntityType | null = null;
filterOperation: AuditOperation | null = null;

// 修改後
filterCategory: AuditCategory | null = null;
filterResourceType: string | null = null;

const options: AuditLogQueryOptions = {
  ...(this.filterCategory && { category: this.filterCategory }),
  ...(this.filterResourceType && { resourceType: this.filterResourceType }),
  limit: 100
};
```

---

### 3. 容器儀表板與設定頁面合併 ✅

**問題描述**:
容器儀表板是獨立頁面，使用者需要額外導航才能查看容器狀態。

**解決方案**:
將容器儀表板內容整合到設定頁籤，讓使用者在一個頁面查看所有配置和狀態資訊。

**實作內容**:
1. 新增容器狀態 Signals 管理
2. 在設定頁籤中顯示容器狀態統計
3. 保留事件總線監控的導航功能
4. 更新路由配置，移除獨立的 `/container` 路由

---

### 4. 快速操作改為審計記錄 ✅

**問題描述**:
概覽頁右側的"快速操作"區塊包含4個按鈕，但使用者更需要直接查看審計記錄。

**解決方案**:
移除快速操作區塊，直接在概覽頁右側嵌入審計記錄元件。

```html
<!-- 修改前 - 快速操作按鈕 -->
<nz-card nzTitle="快速操作">
  <button nz-button (click)="openContainer()">容器儀表板</button>
  <!-- 其他按鈕 -->
</nz-card>

<!-- 修改後 - 直接顯示審計記錄 -->
<nz-card nzTitle="審計記錄">
  <app-audit-logs [blueprintId]="blueprint()!.id" />
</nz-card>
```

---

## 技術實作細節

### Angular 20 現代化特性

- ✅ **Signals**: 使用 `signal()` 管理容器狀態
- ✅ **AsyncState**: 統一的非同步狀態管理模式
- ✅ **新控制流**: `@if`, `@else`, `@for` 語法
- ✅ **inject()**: 函式型依賴注入
- ✅ **Standalone Components**: 無需 NgModules

### 程式碼品質

- ✅ TypeScript strict mode 編譯通過
- ✅ ESLint 檢查通過（無新增錯誤）
- ✅ 遵循專案三層架構
- ✅ 遵循奧卡姆剃刀原則

---

## 修改檔案

1. `src/app/routes/blueprint/blueprint-detail.component.ts` - 主要變更
2. `src/app/routes/blueprint/audit/audit-logs.component.ts` - 修正查詢參數
3. `src/app/routes/blueprint/routes.ts` - 更新路由配置

---

## 預期效果

### 使用者體驗

- ✅ 藍圖詳情頁不再閃現錯誤
- ✅ 審計記錄可以正常載入
- ✅ 設定頁籤整合容器資訊
- ✅ 概覽頁直接顯示審計記錄

### 程式碼品質

- ✅ 使用 Angular 20 最新語法
- ✅ 統一的狀態管理模式
- ✅ 正確的錯誤處理
- ✅ 類型安全

---

## 參考資料

- [Angular 20 文檔](https://angular.dev)
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [GigHub 專案指引](.github/copilot-instructions.md)
- [AsyncState 模式](../../src/app/shared/utils/async-state.ts)
