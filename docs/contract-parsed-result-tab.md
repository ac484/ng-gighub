## 合約解析結果分頁設計概要

- **資料來源優先順序**：當合約物件提供 `parsedData`（JSON 字串）時即時解析並呈現；缺少資料時提供「載入範例」按鈕，以 `/parsed.json` 靜態資產作為範例輸入。
- **狀態管理**：以 Signals 管理 `loading`、`error`、`parsedContent`、`source`，透過 effect 監聽合約變更並重新解析，避免手動訂閱。
- **視圖呈現**：使用 `json` pipe 直接輸出任意巢狀結構，並以錯誤警示、載入中與空狀態提供回饋，維持無固定 schema 的彈性檢視。
- **資產存取**：在 `angular.json` 加入根目錄 `parsed.json` 的 assets 設定，確保前端可直接讀取範例檔。
- **可擴充性**：新分頁以獨立 standalone component (`ParsedResultTabComponent`) 實作，可後續替換為更進階的 JSON viewer 或串接即時解析服務而不影響其他分頁。
