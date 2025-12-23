## Audit Layer Purpose

`audit/` 提供不可變的歷史紀錄，覆蓋所有手動操作、重要狀態變更與關鍵事件，供事後追蹤與問責，不作為流程判斷依據。

## What to Record

- 操作者、時間、來源模組與行為類型。
- 前後狀態、關聯識別碼（如 entity id、Correlation ID）。
- 補充資訊或原因碼，方便後續稽核。

## Boundaries

- ❌ 不影響流程、不阻斷操作、不回寫 Domain。
- ❌ 不保存為業務真相來源，只保存「發生過什麼」。
- ✅ 可被任何模組或 Workflow 呼叫以記錄事實。

## Usage Notes

1. 為每個【手動】節點留下稽核紀錄，確保與事件的 Correlation ID 對齊。
2. 將寫入邏輯集中在 `audit-log.service`，避免分散在各模組。
3. 若需要查詢或過濾，維持唯讀介面，不影響原始紀錄。

更多背景請參考 `BLUEPRINT_LAYER.md` 的 Audit 章節。 
