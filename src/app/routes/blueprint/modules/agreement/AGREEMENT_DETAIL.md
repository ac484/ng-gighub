## Agreement parsed.json 詳情頁設計

- **目標**：在列表中的「檢視」動作直接開啟抽屜，展示解析後的 parsed.json 關鍵資訊，維持單頁最小改動。
- **資料來源**：`agreement.parsedJsonUrl`（由解析流程寫回）；以 `HttpClient` 直接讀取 JSON，不新增後端或 Repository。
- **UI 行為**：
  - 點擊「檢視」：無 parsedJsonUrl 則提示先解析；有則開啟 `nz-drawer`。
  - 抽屜內容：`NzDescriptions` 顯示核心欄位（文件號碼、日期、付款/交貨條件、總價/稅金/幣別、頁數、處理時間），並提供全文預覽（縮短至 600 字避免過長）。
  - 狀態：`detailLoading/detailError/parsedDocument` 以 Signals 管理；載入錯誤時顯示 `nz-alert`。
- **狀態與相依**：
  - Signals：`detailVisible`, `detailLoading`, `detailError`, `parsedDocument`, `selectedAgreement`, `textPreview`.
  - 依賴：`HttpClient` + `firstValueFrom` 讀取 JSON；僅新增 `NzDrawerModule` / `NzDescriptionsModule` / `NzAlertModule`。
- **風格一致性**：沿用模組既有 `SHARED_IMPORTS + Nz*` 模式、Signals 與 `inject()`，保持模板簡潔且無多餘邏輯。

