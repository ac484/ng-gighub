# Contract Module Fixes Summary

## 問題概述

根據 `localhost-1765978884773.log` 分析，合約模組存在以下主要問題：

### 1. NG0203 錯誤: effect() 在注入上下文外使用
**影響檔案**:
- `src/app/layout/basic/widgets/notify.component.ts`
- `src/app/layout/basic/widgets/task.component.ts`

**錯誤訊息**:
```
ERROR RuntimeError: NG0203: effect() can only be used within an injection context 
such as a constructor, a factory function, a field initializer, 
or a function used with `runInInjectionContext`.
```

### 2. ContractFacade 未初始化錯誤
**影響檔案**:
- `src/app/routes/blueprint/modules/contract/contract-module-view-refactored.component.ts`
- `src/app/routes/blueprint/modules/contract/features/edit/contract-edit-modal.component.ts`

**錯誤訊息**:
```
Error: [ContractFacade] Blueprint ID not set. Call initialize() first.
```

### 3. Firebase API 在注入上下文外呼叫警告
**影響檔案**:
- `src/app/core/blueprint/repositories/blueprint.repository.ts`

**警告訊息**:
```
Calling Firebase APIs outside of an Injection context may destabilize your application
```

## 修復方案

### 修復 1: 移動 effect() 到 constructor

**檔案**: `notify.component.ts` 和 `task.component.ts`

**變更前**:
```typescript
ngOnInit(): void {
  effect(() => {
    // effect code
  });
}
```

**變更後**:
```typescript
constructor() {
  // Move effect() to constructor (injection context)
  effect(() => {
    // effect code
  });
}

ngOnInit(): void {
  // Initialization handled by effect in constructor
}
```

**原因**: Angular 的 `effect()` 函數必須在注入上下文中呼叫。Constructor 是注入上下文，而 `ngOnInit()` 不是。

### 修復 2: 初始化 ContractFacade

**檔案**: `contract-module-view-refactored.component.ts`

**新增內容**:
1. 注入 `FirebaseService` 以取得當前使用者
2. 在 effect 中初始化 facade
3. 新增 `facadeInitialized` signal 追蹤狀態

**變更**:
```typescript
import { FirebaseService } from '@core/services/firebase.service';

export class ContractModuleViewComponent implements OnInit {
  private readonly firebase = inject(FirebaseService);
  private facadeInitialized = signal(false);

  constructor() {
    effect(() => {
      const id = this.blueprintId();
      const user = this.firebase.currentUser();
      
      if (id && user) {
        // Initialize facade with blueprintId and userId
        this.facade.initialize(id, user.uid);
        this.facadeInitialized.set(true);
        this.loadContracts();
      }
    });
  }

  async loadContracts(): Promise<void> {
    if (!this.blueprintId() || !this.facadeInitialized()) {
      return;
    }
    // ... rest of the code
  }
}
```

### 修復 3: 初始化 ContractEditModalComponent 的 Facade

**檔案**: `contract-edit-modal.component.ts`

**變更**:
```typescript
import { FirebaseService } from '@core/services/firebase.service';

export class ContractEditModalComponent implements OnInit {
  private readonly firebase = inject(FirebaseService);

  ngOnInit(): void {
    // Initialize facade with blueprint context
    const user = this.firebase.currentUser();
    if (user && this.modalData.blueprintId) {
      this.facade.initialize(this.modalData.blueprintId, user.uid);
    }
    
    // ... rest of initialization
  }
}
```

## 測試建議

### 1. 測試通知功能
```bash
# 登入後檢查：
- 通知鈴鐺圖示應正常顯示
- 點擊應能查看通知列表
- 不應在 console 看到 NG0203 錯誤
```

### 2. 測試合約列表
```bash
# 進入藍圖詳情頁面的合約標籤：
- 合約列表應正常載入
- 不應看到 "Blueprint ID not set" 錯誤
- 統計資料應正確顯示
```

### 3. 測試合約新增
```bash
# 點擊「快速新增合約」按鈕：
- 模態視窗應正常開啟
- 填寫表單後應能成功提交
- 不應看到 facade 未初始化的錯誤
```

### 4. 測試合約編輯
```bash
# 點擊現有合約的編輯按鈕：
- 編輯模態視窗應正常開啟
- 表單應預填現有資料
- 更新應能成功執行
```

## 預期結果

執行這些修復後，應該能：

✅ 消除 NG0203 injection context 錯誤
✅ 修復合約載入失敗問題
✅ 修復合約新增/編輯功能
✅ 應用程式正常編譯建構 (`npm run build` 成功)

## 建構驗證

```bash
npm run build
# 應該成功完成，無編譯錯誤
```

## 後續改進建議

### 1. Blueprint Repository 警告
雖然 Firebase API 警告不影響功能，但可考慮：
- 使用 AngularFire 的 `collectionData()` 和 `docData()` 方法
- 這些方法自動處理注入上下文

### 2. 錯誤處理增強
- 在 facade 初始化失敗時提供更好的使用者回饋
- 新增重試機制處理暫時性失敗

### 3. 單元測試
- 為修復的元件新增單元測試
- 驗證 effect() 在 constructor 中正常運作
- 測試 facade 初始化流程

## 參考資料

- [Angular Signals 文檔](https://angular.dev/guide/signals)
- [Angular Injection Context](https://v20.angular.dev/errors/NG0203)
- [AngularFire 文檔](https://github.com/angular/angularfire)

## 版本資訊

- **修復日期**: 2025-12-19
- **Angular 版本**: 20.3.x
- **AngularFire 版本**: 20.0.1
- **受影響模組**: Contract, Layout (Notifications)
