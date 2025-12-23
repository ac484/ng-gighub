## Policies 設計概要

**角色**：跨模組一致性規則與前置條件，回答「可不可以」，保持純邏輯可重用。

**責任**
- 狀態轉換與操作前置條件（跨模組）。
- 角色/權限矩陣邏輯層（不依賴 UI）。
- 回傳布林或錯誤原因碼，供 Facade/Service/Workflow 使用。

**邊界**
- ❌ 不存取 DB/Repository，不發事件，不執行流程。
- ❌ 不處理補償或排程。
- ✅ 可被多模組共用，維持純函式、可測試。

**使用建議**
- 模組內專屬規則放各自 `modules/<name>/policies/`。
- 在 Workflow/Facade 先行檢查，拒絕時給明確原因碼。
- 輸入保持精簡（id、狀態、角色），避免傳遞整個 Entity。

## 目錄結構與用途

```
policies/
├─ access-control.policy.ts  # 跨模組角色/權限判斷
├─ approval.policy.ts        # 審批/多簽等系統級前置條件
└─ README.md                 # 說明文件
```

- `access-control.policy.ts`：定義角色矩陣/Workspace/Blueprint 授權檢查。  
- `approval.policy.ts`：高風險操作的審批與多簽條件（僅邏輯，不執行流程）。 
