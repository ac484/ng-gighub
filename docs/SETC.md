# 零、合約建立與來源
合約上傳（PDF / 圖檔）【手動】
↓
合約建檔（基本資料、業主、承商）【手動】
↓
合約解析（OCR / AI 解析條款、金額、工項）【自動】
↓
合約確認(確認解析結果或人工補齊)【手動】
↓
合約狀態：待生效
↓
合約生效（⚠️ 僅「已生效合約」可建立任務）【手動】
↓
# 一、任務與施工階段
任務建立（關聯合約/工項/金額）【手動】
↓
指派用戶 / 團隊【手動】
↓
施工執行
↓
提報完成【手動】
↓
管理確認完成【手動】（關鍵控制點） ※ 此節點僅確認施工責任完成，不等同於驗收完成
↓
# 二、品質與驗收階段
自動建立施工日誌【自動】(由任務資料自動產生一筆施工日誌)
↓
自動建立 QC 待驗【自動】
↓
QC 通過？
  ├─ 否 → 建立缺失單【自動】 → 整改【手動】 → 複驗【手動】 ↺ QC
  └─ 是
↓
驗收【手動】
↓
驗收通過？
  ├─ 否 → 建立問題單【可手動 / 可自動】⭐ → 處理【手動】 ↺ 驗收
  └─ 是
↓
驗收資料封存【自動】
↓
進入保固期【自動】

保固期管理
├─ 保固缺失？
│ ├─ 是 → 建立問題單【可手動 / 可自動】⭐ → 保固維修【手動】 → 結案【手動】
│ └─ 否
└─ 保固期滿【自動】 → 驗收最終結案【手動】
↓
# 三、財務與成本階段
金額 / 比例確認（可請款% / 可付款%）【手動】
↓
建立可請款清單 + 可付款清單【自動】(各建立一筆（業主 / 承商分離）)
↓
請款 / 付款流程【手動】
（草稿 → 送出 → 審核 → 開票 → 收/付款）

審核
├─ 通過
└─ 退回補件 → 修正 ↺ 審核
↓
更新任務款項狀態【自動】
  ├─ 請款進度 %
  └─ 付款進度 %
↓
計入成本管理【自動】(實際成本 / 應收 / 應付統計)
實際成本

應收

應付

毛利 / 成本分析
↓
# 📌 補充說明
- ⚙️ 自動節點皆應由事件（Event）或 Queue 觸發，狀態改變即觸發後續流程
- 🧾 稽核與操作紀錄（Audit Log）：所有【手動】節點必記錄：操作人/操作時間/前後狀態/備註
- 🔁 添加都要透過藍圖事件總線（請使用 `EnhancedEventBusService` 發送/訂閱事件）
- 🔐 權限與角色控制（不同角色可操作不同節點）
- ⭐ **問題單 (Issue) 獨立管理** ✅ **已完成實作**:
  - ✅ 可從多個來源自動建立（驗收失敗、QC 失敗、保固缺失、安全事故等）
  - ✅ 也可由使用者手動建立
  - ✅ 獨立的問題追蹤生命週期：open → in_progress → resolved → verified → closed
  - ✅ 不限於驗收模組使用
  - ✅ 透過事件總線與其他模組整合

---

### 📋 實作狀態

**所有 69 個 SETC 任務文檔已完成建立**。詳細規劃與實作細節請參考各任務文檔。

### 實作檔案結構

```
src/app/core/blueprint/modules/implementations/issue/
├── models/                           # 領域模型
│   └── issue.model.ts               # Issue, Resolution, Verification 介面
├── repositories/                     # 資料存取層
│   └── issue.repository.ts          # Firestore CRUD 操作
├── services/                         # 業務邏輯層
│   ├── issue-management.service.ts   # 手動建立與 CRUD
│   ├── issue-creation.service.ts     # 自動建立 (4 來源)
│   ├── issue-resolution.service.ts   # 解決工作流程
│   ├── issue-verification.service.ts # 驗證工作流程
│   ├── issue-lifecycle.service.ts    # 狀態管理
│   ├── issue-event.service.ts        # 事件總線整合
│   ├── *.spec.ts                     # 單元測試
├── config/                           # 模組配置
├── exports/                          # 公開 API
├── issue.module.ts                   # Angular 模組
├── module.metadata.ts                # 模組元資料
└── README.md                         # 模組文件
```

### 支援的自動建立來源

1. **驗收失敗 (Acceptance)** - `IssueCreationService.autoCreateFromAcceptance()`
2. **QC 檢驗失敗 (QC)** - `IssueCreationService.autoCreateFromQC()`
3. **保固缺失 (Warranty)** - `IssueCreationService.autoCreateFromWarranty()`
4. **安全事故 (Safety)** - `IssueCreationService.autoCreateFromSafety()`

### 事件類型

所有事件以 `issue.` 為前綴:
- `issue.created` - 問題已建立
- `issue.created_from_acceptance` - 從驗收失敗建立
- `issue.created_from_qc` - 從 QC 失敗建立
- `issue.created_from_warranty` - 從保固缺失建立
- `issue.created_from_safety` - 從安全事故建立
- `issue.updated` - 問題已更新
- `issue.assigned` - 問題已指派
- `issue.resolved` - 問題已解決
- `issue.verified` - 問題已驗證
- `issue.verification_failed` - 驗證失敗
- `issue.closed` - 問題已關閉