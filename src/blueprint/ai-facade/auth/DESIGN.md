# auth - Design

責任
- 定義呼叫 AI 時與身份/授權有關的邏輯（例如：是否允許匿名呼叫、資料存取範圍限制）。

建議
- 在 context-providers 中提供 `AuthContext`，並在 policies 中驗證權限。
