# adapters - Design

責任
- 封裝與 Firebase Functions 的 callable 呼叫。
- 處理輸入驗證、輸出解析、以及錯誤轉換。

接口範例
```ts
interface FunctionsAdapter {
  callAiFunction(name: string, payload: unknown): Promise<AdapterResult>;
}
```

重試與退避
- 在短暫性失敗時實作有限次重試與指數退避。

測試
- 使用 stub 函數回傳已知的結果以驗證上層 orchestrator。
