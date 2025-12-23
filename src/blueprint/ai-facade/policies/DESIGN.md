# policies - Design

目標
- 保護系統不被高成本或不合規的 prompt 濫用，同時確保輸出符合 domain 規則。

pipeline
- Pre-policies: input validation, privacy tagging, cost estimation
- Core-policies: model selection、quota enforcement
- Post-policies: response validation、post-redaction

錯誤分類
- Policy 應回傳明確錯誤代碼（例如 `POLICY_REJECTED_COST`, `POLICY_VIOLATION_PRIVACY`），上層 Orchestrator 依此採取不同處理（reject / queue / escalate）。

策略測試
- 為每個政策建立 property-based tests 以驗證在大量隨機 prompt 與 context 下的穩定性。
# policies - Design

責任
- 定義可重用的策略以保護呼叫安全、成本與合規性。

常見策略
- `CostControlPolicy`：限制 tokens 使用或切換低成本模型
- `PrivacyFilterPolicy`：在發送前遮蔽 PII
- `ResponseValidationPolicy`：驗證回傳結構與 schema

組合方式
- 將 policies 實作為純函式或 middleware，並順序執行以便於測試。
