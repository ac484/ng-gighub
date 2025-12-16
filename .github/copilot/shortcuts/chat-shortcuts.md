# GitHub Copilot Chat 快捷指令

> 預定義的快捷指令，確保生成的程式碼符合 GigHub 專案規範

## 使用方式

在 GitHub Copilot Chat 中使用 `/` 前綴來觸發快捷指令。

---

## 🎯 元件生成快捷指令

### `/gighub-component` - 生成符合規範的 Angular 元件

**功能**: 根據 GigHub 專案規範生成 Standalone Component

**提示詞**: 生成符合以下規範的 Angular 元件:
- Standalone Component with SHARED_IMPORTS
- OnPush 變更偵測
- 使用 input()/output() 函數
- 使用 inject() 注入
- 使用新控制流 (@if, @for)
- Signals 管理狀態

---

### `/gighub-service` - 生成符合規範的 Service

**功能**: 根據 GigHub 專案規範生成 Service

**提示詞**: 生成符合以下規範的 Service:
- providedIn: 'root'
- 使用 inject() 注入
- Signals 管理狀態
- 完整 JSDoc
- 錯誤處理

---

## 🗄️ 資料層快捷指令

### `/gighub-repository` - 生成 Firebase/Firestore Repository

**功能**: 根據 Repository Pattern 生成資料存取層

**提示詞**: 生成 Firebase/Firestore Repository，包含:
- findAll(), findById(), create(), update(), delete()
- 完整錯誤處理
- RLS 政策說明

---

### `/gighub-store` - 生成 Signal-based Store

**功能**: 根據 Facade Pattern 生成狀態管理

**提示詞**: 生成 Signal-based Store，包含:
- private signal 狀態
- asReadonly() 公開狀態
- computed() 衍生狀態
- load/create/update/delete 方法

---

## 🔍 審查快捷指令

### `/gighub-review` - GigHub 規範審查

**功能**: 審查程式碼是否符合 GigHub 規範

**提示詞**: 審查以下項目:
- 是否使用現代 Angular 語法
- 是否遵循架構模式
- 是否有型別安全問題
- 是否有效能問題
- 是否有安全問題

---

## 🔧 重構快捷指令

### `/gighub-refactor` - 重構為現代語法

**功能**: 重構為 Angular 19+ 語法

**提示詞**: 重構以下項目:
- @Input → input()
- @Output → output()
- *ngIf → @if
- *ngFor → @for
- constructor 注入 → inject()
- 變數 → signal()

---

**版本**: 2025-12-10
