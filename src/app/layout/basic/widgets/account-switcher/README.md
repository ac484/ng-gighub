# Account Switcher

Account Switcher 是顯示在 **Application Shell（Basic Layout）** 上的 UI 元件，  
用於在不同 **Account Context（使用者 / 組織）** 之間進行切換。

此元件僅負責「顯示與觸發切換」，  
**不負責帳戶資料載入、權限判斷或業務邏輯**。

---

## 📌 Responsibility（責任範圍）

✅ 負責：
- 顯示目前使用中的 Account（User / Organization）
- 顯示可切換的 Account 清單
- 觸發 Account 切換行為（navigation）

❌ 不負責：
- 驗證帳戶存不存在
- 檢查角色或權限
- 載入 Account 詳細資料
- 任何 Firestore / API 呼叫
- 業務邏輯或狀態判斷

---

## 🧱 Architecture Position（架構位置）

```

layout/basic (App Shell)
└─ widgets
└─ account-switcher   ← 本元件

```

- 屬於 **Layout 層**
- 是 **UI Widget**
- 永遠存在於 Header / Sidebar
- 不依附任何 feature module

---

## 🔗 Dependency（依賴來源）

Account Switcher 透過 **Account Context Layer** 取得資料：

```

routes/account/_shared
└─ account-context.service.ts

```

依賴的資料通常包含：
- `currentAccount`
- `availableAccounts`
- `switchAccount(accountRef)`

> ⚠️ 本元件 **只依賴抽象狀態介面**，  
> 不應直接 import repository / firestore / service implementation。

---

## 🔁 Switch Flow（切換流程）

1. 使用者在 UI 上選擇另一個 Account
2. 呼叫 `AccountContextService.switchAccount(...)`
3. 觸發 router navigation：
```

/account/:accountType/:accountId

```
4. Account Context Resolver 重新建立上下文
5. 所有子模組自動刷新狀態

---

## 🧠 Design Principles（設計原則）

- **Stateless UI**  
元件本身不保存 Account 狀態

- **Context-driven**  
所有狀態來自 Account Context Layer

- **Shell-level Widget**  
此元件是「殼的一部分」，不是功能頁面

- **No Business Logic**  
不允許出現業務判斷或權限規則

---

## 🚫 Common Anti-patterns（反例）

以下行為 **不允許** 出現在本元件中：

- ❌ 直接呼叫 Firestore / API
- ❌ 判斷使用者是否為 admin
- ❌ 根據 role 決定是否顯示 account
- ❌ 依賴 feature module 的 service
- ❌ 被放入 `routes/account/*`

---

## ✅ Summary（一句話總結）

> **Account Switcher 是 Layout Widget，  
> Context 決策在 Account Layer，  
> UI 與邏輯必須嚴格分離。**

```

