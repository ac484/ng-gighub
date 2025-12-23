## Modules 設計概要

**角色**：具備明確業務語意與完整生命週期的 Domain 邊界，遵循 `MODULE_LAYER.md` 骨架。

**責任**
- 事件：發布事實、訂閱需反應的事件。
- 狀態：集中管理狀態轉移與 Policy 驗證。
- 對外：僅透過 Facade 暴露指令，Service 發事件，Repository 隔離資料存取。

**邊界**
- ❌ 不直接存取其他模組 Repository/Service。
- ❌ 不寫跨模組流程（交給 Workflow/Policy）。
- ✅ 互動僅限 Event / Facade / Query。

**骨架速覽**
- `models/` Entity/Value Object
- `states/` 狀態與轉移表
- `services/` 業務行為、事件發布
- `repositories/` 介面 + 實作（隔離來源）
- `events/` `<module>.<fact>` 事件定義
- `policies/` 模組內規則
- `facade/` 唯一入口，驗證後呼叫 Service
- `config/` 模組設定、`module.metadata.ts`

**新增模組流程**
1) 建立骨架 + README + metadata。  
2) 集中狀態轉移與事件發布於 Service。  
3) 只開放 Facade；跨模組規則放 Policy/Workflow。  
4) 事件命名 `<module>.<fact>`，Payload 僅識別資訊。
