# 測試驗證文件：自動將藍圖建立者加入成員

## 功能說明
實作目標：不管是個人/組織建立藍圖時，建立者都要被自動加入藍圖中的成員，角色為 MAINTAINER（維護者）。

## 修改內容總覽

### 1. 資料模型修改
**檔案**: `src/app/core/types/blueprint/blueprint.types.ts`

```typescript
export interface CreateBlueprintRequest {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  ownerType: OwnerType;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
  createdBy: string;  // ✅ 新增欄位
}
```

### 2. 驗證規則修改
**檔案**: `src/app/core/blueprint/services/blueprint-validation-schemas.ts`

```typescript
export const BlueprintCreateSchema: ValidationSchema = {
  // ... 其他驗證規則
  createdBy: [{ type: 'required', message: '建立者 ID 為必填' }]  // ✅ 新增驗證
};
```

### 3. 服務層邏輯修改
**檔案**: `src/app/core/blueprint/services/blueprint.service.ts`

**核心變更**：
1. ✅ 自動將建立者加入為成員
2. ✅ 角色設定為 `MAINTAINER`
3. ✅ 授予完整權限：
   - `canManageMembers: true` - 可管理成員
   - `canManageSettings: true` - 可管理設定
   - `canExportData: true` - 可匯出資料
   - `canDeleteBlueprint: true` - 可刪除藍圖
4. ✅ 記錄 audit log
5. ✅ Graceful degradation：成員新增失敗不影響藍圖建立

### 4. UI 元件修改
**檔案**: `src/app/routes/blueprint/blueprint-modal.component.ts`

```typescript
const request: CreateBlueprintRequest = {
  name: formValue.name!,
  slug: formValue.slug!,
  description: formValue.description,
  ownerId,
  ownerType,
  isPublic: formValue.isPublic,
  enabledModules,
  createdBy: (user as any).uid  // ✅ 傳遞建立者 UID
};
```

## 測試步驟

### 前置作業
1. 啟動開發伺服器：
   ```bash
   cd /home/runner/work/GigHub/GigHub
   yarn start
   ```
2. 在瀏覽器中開啟 `http://localhost:4200`
3. 登入系統

### 測試案例 1：個人藍圖建立
**目標**：驗證個人建立藍圖時，建立者自動成為成員

**步驟**：
1. 登入系統
2. 切換至個人視角（如果有多個視角）
3. 點擊「建立藍圖」按鈕
4. 填寫藍圖資訊：
   - 名稱：「測試個人藍圖」
   - Slug：「test-personal-blueprint」
   - 描述：「測試自動加入成員功能」
   - 可見性：任意選擇
5. 點擊「建立」按鈕
6. 建立成功後，進入該藍圖
7. 點擊「成員」標籤頁

**預期結果**：
- ✅ 藍圖建立成功
- ✅ 成員列表中自動包含建立者
- ✅ 建立者角色為 `MAINTAINER`（維護者）
- ✅ 建立者擁有所有管理權限
- ✅ Console 中看到日誌：`Creator {userId} added as MAINTAINER to blueprint {blueprintId}`

### 測試案例 2：組織藍圖建立
**目標**：驗證在組織視角建立藍圖時，建立者自動成為成員

**步驟**：
1. 登入系統
2. 切換至組織視角
3. 點擊「建立藍圖」按鈕
4. 填寫藍圖資訊：
   - 名稱：「測試組織藍圖」
   - Slug：「test-org-blueprint」
   - 描述：「測試組織藍圖自動加入成員」
   - 可見性：任意選擇
5. 點擊「建立」按鈕
6. 建立成功後，進入該藍圖
7. 點擊「成員」標籤頁

**預期結果**：
- ✅ 藍圖建立成功（owner 為組織 ID）
- ✅ 成員列表中自動包含建立者（個人帳號）
- ✅ 建立者角色為 `MAINTAINER`
- ✅ 建立者擁有所有管理權限

### 測試案例 3：Audit Log 驗證
**目標**：驗證 audit log 正確記錄

**步驟**：
1. 完成測試案例 1 或 2
2. 在藍圖詳情頁面，查看 audit logs（如果有 UI）
3. 或檢查 Firestore 資料庫中的 audit logs 集合

**預期結果**：
- ✅ 存在 `BLUEPRINT_CREATED` 事件記錄
- ✅ 存在 `MEMBER_ADDED` 事件記錄
- ✅ `MEMBER_ADDED` 記錄包含：
  - actorId: 建立者 UID
  - resourceId: 建立者 UID
  - message: "建立者自動加入為維護者"
  - status: SUCCESS

### 測試案例 4：權限驗證
**目標**：驗證建立者確實擁有 MAINTAINER 權限

**步驟**：
1. 完成測試案例 1 或 2
2. 以建立者身份嘗試以下操作：
   - 新增其他成員
   - 編輯藍圖設定
   - 刪除藍圖（可測試按鈕是否顯示，不需實際刪除）

**預期結果**：
- ✅ 可以新增成員
- ✅ 可以編輯設定
- ✅ 可以看到刪除按鈕（或有刪除權限）

### 測試案例 5：錯誤處理
**目標**：驗證 graceful degradation 機制

**步驟**：
1. （此測試需要模擬成員新增失敗，可能需要暫時修改程式碼或調整 Firestore 權限）
2. 建立藍圖
3. 觀察 Console 日誌

**預期結果**：
- ✅ 藍圖建立成功
- ✅ Console 顯示警告：`Blueprint {id} created but creator not added as member`
- ✅ 不影響藍圖建立流程

## 檢查清單

### 程式碼品質
- [x] TypeScript 編譯無錯誤
- [x] ESLint 檢查通過
- [x] 遵循 Angular 20 現代化模式
- [x] 使用 Signals 和 inject()
- [x] 符合專案架構規範

### 功能完整性
- [ ] 個人藍圖建立測試通過
- [ ] 組織藍圖建立測試通過
- [ ] 成員角色正確（MAINTAINER）
- [ ] 權限設定正確
- [ ] Audit log 記錄完整
- [ ] 錯誤處理正常

### 文件完整性
- [x] 程式碼註解清楚
- [x] Commit message 清楚
- [x] 測試文件完整

## 已知限制與注意事項

1. **Firestore 權限**：確保 Firebase/Firestore 規則允許寫入成員集合
2. **網路延遲**：成員新增為非同步操作，UI 可能需要短暫延遲才能看到
3. **錯誤處理**：成員新增失敗不會回滾藍圖建立（設計決策）

## 除錯資訊

如果功能未正常運作，檢查以下項目：

### 1. 瀏覽器 Console
```javascript
// 應該看到以下日誌
[BlueprintService] Blueprint created {blueprintId}
[BlueprintService] Creator {userId} added as MAINTAINER to blueprint {blueprintId}
```

### 2. Firestore 資料庫
檢查以下集合：
- `blueprints/{blueprintId}` - 藍圖文件
- `blueprints/{blueprintId}/members/{memberId}` - 成員子集合
- `blueprints/{blueprintId}/audit_logs` - 審計日誌（如果有）

### 3. 網路請求
開啟 Chrome DevTools > Network 標籤，檢查 Firestore API 請求：
- 應該有藍圖建立請求
- 應該有成員新增請求

## 回滾方案

如果需要回滾此功能：

```bash
git revert b26f9f2
```

或手動移除以下變更：
1. `CreateBlueprintRequest.createdBy` 欄位
2. `BlueprintService.create()` 中的成員新增邏輯
3. 驗證規則中的 `createdBy` 驗證
4. `BlueprintModalComponent` 中的 `createdBy` 傳遞

## 相關檔案

- `src/app/core/types/blueprint/blueprint.types.ts`
- `src/app/core/blueprint/services/blueprint.service.ts`
- `src/app/core/blueprint/services/blueprint-validation-schemas.ts`
- `src/app/routes/blueprint/blueprint-modal.component.ts`
- `src/app/core/blueprint/repositories/blueprint-member.repository.ts`

## 參考資料

- [Blueprint 架構文件](./docs/blueprint-architecture.md)（如果存在）
- [成員管理規範](./docs/member-management.md)（如果存在）
- [Firestore 資料模型](./docs/firestore-schema.md)（如果存在）
