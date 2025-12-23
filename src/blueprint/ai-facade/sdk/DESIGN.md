# sdk - Design

責任
- 定義與第三方 SDK 或後端 SDK 的包裝介面，並管理版本與初始化邏輯（後端為主）。

建議
- 將 SDK 初始化放在後端；前端透過 adapters 呼叫 callable functions。
