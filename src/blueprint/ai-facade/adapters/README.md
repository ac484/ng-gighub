# adapters

說明
- 此資料夾放置與後端 callable functions（`functions-ai`）互動的適配器。

用途
- 封裝 callable function 的輸入/輸出、序列化、錯誤轉換與重試策略。

實作提示
- 提供 interface/型別，並在測試時以 mock 替換。
- 不要在此層硬編碼任何金鑰或憑證。
