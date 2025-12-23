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
