# orchestrators - Design

目的
- 協調多個子系統（adapters, prompts, policies, repositories）以完成 end-to-end 任務。

重試與補償
- 每個步驟應定義為一個可重試操作，並在失敗時提供補償（compensating action），例如刪除暫存檔或解除鎖定。

可觀測性
- 每個 orchestrator 產生 structured trace（requestId、step、duration、status）供 metrics 與後端追蹤。

接口建議
```ts
type StepResult<T> = { ok: true; value: T } | { ok: false; error: Error }

interface OrchestratorDeps {
  adapter: AiAdapter;
  policies: Policies;
  repository: Repository;
  logger: Logger;
}
```

測試
- 在 CI 中建立合約測試套件，使用 mockAdapter 驗證 orchestrator 在不同外部錯誤情境（網路失敗、quota、vendor error）下的行為。
# orchestrators - Design

目的
- 將多個子系統組合，處理複雜的業務流程與錯誤補償。

範例工作流程
1. receiveUpload()
2. adapters.imageUpload → receive URL
3. adapters.ocr → raw text
4. prompts.parse → structured data
5. policies.validate → approval or rejection

錯誤處理
- 使用 compensating actions（補償動作）與可重試節點，並在必要時回滾部分結果。
