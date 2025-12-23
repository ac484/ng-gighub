# policies - Design

責任
- 定義可重用的策略以保護呼叫安全、成本與合規性。

常見策略
- `CostControlPolicy`：限制 tokens 使用或切換低成本模型
- `PrivacyFilterPolicy`：在發送前遮蔽 PII
- `ResponseValidationPolicy`：驗證回傳結構與 schema

組合方式
- 將 policies 實作為純函式或 middleware，並順序執行以便於測試。
