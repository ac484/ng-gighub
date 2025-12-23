# orchestrators

說明
- 此資料夾包含協調多階段 AI 任務的邏輯（例如：影像上傳 → OCR → 結果解析 → 回寫）。

用途
- 將多個 adapters、prompts 與 policies 組合，形成可重用的工作流程。

實作提示
- 以小型步驟拆解流程，並為每步驟定義明確的輸入/輸出契約。
