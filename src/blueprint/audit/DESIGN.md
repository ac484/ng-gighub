## Audit 設計概要

**角色**：不可變歷史紀錄層，記錄手動操作與關鍵事件，供追蹤與問責。

**責任**
- 記錄操作人、時間、來源模組、行為類型、前後狀態、Correlation ID。
- 提供唯讀查詢，不作為業務真相來源。

**邊界**
- ❌ 不影響流程、不阻斷操作。
- ❌ 不回寫 Domain，不作決策依據。
- ✅ 可被任何模組/Workflow 呼叫以寫入。

**使用建議**
- 高風險操作（刪除、權限變更）必須寫入 Audit。
- 與事件的 Correlation ID 對齊，方便串聯追蹤。
- 查詢介面保持唯讀，避免修改原始紀錄。

## 目錄結構與用途

```
audit/
├─ audit-log.entity.ts   # 稽核記錄資料結構
├─ audit-log.service.ts  # 寫入/查詢稽核紀錄
├─ audit-policies.ts     # 稽核相關政策（如遮蔽敏感欄位）
└─ README.md             # 說明文件
```

- `audit-log.service.ts`：統一寫入入口，確保包含操作者/時間/來源/前後狀態/Correlation ID。  
- `audit-policies.ts`：處理需遮蔽或格式化的欄位規則。 

## 基礎檔案起手式（必備）
- `audit-log.entity.ts`：稽核紀錄資料結構。
- `audit-log.service.ts`：寫入/查詢唯一入口，包裝安全與遮蔽。
- `audit-policies.ts`：敏感欄位遮蔽與格式化規則。
- `README.md`：使用方式與範圍。 
