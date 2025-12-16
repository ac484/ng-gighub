# Firestore 持久化問題修復 - 測試指南

## 問題描述
組織、團隊、藍圖建立後都無法讀取，刷新後就不見，但 Firestore 有數據。

## 修復內容

### 1. 啟用 Firestore 離線持久化
**檔案**: `src/app/app.config.ts`

**修改內容**:
- 將 `getFirestore()` 替換為 `initializeFirestore()` 並配置持久化選項
- 啟用 `persistentLocalCache()` 使用 IndexedDB 本地緩存
- 啟用 `persistentMultipleTabManager()` 支援多分頁數據同步

**效果**:
- 數據會在瀏覽器本地緩存 (IndexedDB)
- 頁面刷新後自動從緩存恢復數據
- 支援多個分頁間數據同步
- 支援離線模式操作

### 2. 改進 Repository 數據驗證
**檔案**:
- `src/app/shared/services/organization/organization.repository.ts`
- `src/app/shared/services/team/team.repository.ts`
- `src/app/shared/services/blueprint/blueprint.repository.ts`

**修改內容**:
- `create()` 方法在建立文件後立即讀取驗證
- 使用 `getDoc()` 確認文件已成功寫入 Firestore
- 添加詳細的錯誤日誌輸出

**效果**:
- 確保建立的數據已成功寫入 Firestore
- 返回的數據是從 Firestore 讀取的最新狀態
- 更容易診斷數據寫入問題

### 3. 優化 WorkspaceContextService
**檔案**: `src/app/shared/services/workspace-context.service.ts`

**修改內容**:
- `addOrganization()` 和 `addTeam()` 添加重複檢查
- 避免重複添加相同的組織或團隊
- 添加詳細日誌記錄

**效果**:
- 防止數據重複添加到列表
- 更好的狀態管理
- 更清晰的除錯日誌

## 測試步驟

### 前置準備
1. 確保 Firestore 安全規則允許讀寫 (當前為 `allow read, write: if true;`)
2. 清空瀏覽器緩存和 IndexedDB (測試前重置狀態)
3. 打開瀏覽器開發者工具的 Console 查看日誌

### 測試 1: 組織建立與讀取
1. **建立組織**:
   - 登入應用程式
   - 點擊「建立組織」按鈕
   - 輸入組織名稱、描述等資訊
   - 提交表單

2. **檢查 Console 日誌**:
   ```
   [OrganizationRepository] ✅ Document created with ID: xxx
   [OrganizationRepository] ✅ Document verified in Firestore: xxx
   [WorkspaceContextService] Organization added: <組織名稱>
   [WorkspaceContextService] ✅ Context switched successfully
   ```

3. **驗證數據**:
   - 組織應立即出現在組織列表中
   - 刷新頁面後組織仍然存在
   - 檢查 Firestore Console 確認文件已建立

4. **測試離線模式**:
   - 在 Chrome DevTools Network 標籤設定為 Offline
   - 刷新頁面
   - 組織列表應該仍然顯示 (從 IndexedDB 緩存載入)

### 測試 2: 團隊建立與讀取
1. **建立團隊**:
   - 選擇一個組織
   - 點擊「建立團隊」按鈕
   - 輸入團隊名稱、描述等資訊
   - 提交表單

2. **檢查 Console 日誌**:
   ```
   [TeamRepository] ✅ Document created with ID: xxx
   [TeamRepository] ✅ Document verified in Firestore: xxx
   [WorkspaceContextService] Team added: <團隊名稱>
   [WorkspaceContextService] ✅ Context switched successfully
   ```

3. **驗證數據**:
   - 團隊應立即出現在團隊列表中
   - 刷新頁面後團隊仍然存在
   - 檢查 Firestore Console 確認文件已建立

### 測試 3: 藍圖建立與讀取
1. **建立藍圖**:
   - 點擊「建立藍圖」按鈕
   - 輸入藍圖名稱、slug、描述等資訊
   - 選擇啟用的模組
   - 提交表單

2. **檢查 Console 日誌**:
   ```
   [BlueprintRepository] ✅ Document created with ID: xxx
   [BlueprintRepository] ✅ Document verified in Firestore: xxx
   ```

3. **驗證數據**:
   - 藍圖應立即出現在藍圖列表中
   - 刷新頁面後藍圖仍然存在
   - 檢查 Firestore Console 確認文件已建立

### 測試 4: 多分頁同步
1. 在兩個不同的瀏覽器分頁中打開應用程式
2. 在第一個分頁建立組織
3. 切換到第二個分頁
4. 刷新第二個分頁
5. **預期結果**: 新建立的組織應該出現在第二個分頁中

### 測試 5: 頁面刷新持久性
1. 建立多個組織/團隊/藍圖
2. 關閉瀏覽器分頁
3. 重新打開應用程式並登入
4. **預期結果**: 所有之前建立的數據應該仍然存在

### 測試 6: IndexedDB 驗證
1. 打開 Chrome DevTools
2. 進入 Application 標籤 → Storage → IndexedDB
3. 找到 `firebaseLocalStorageDb` 資料庫
4. **預期結果**: 應該看到 Firestore 數據已緩存在本地

## 錯誤診斷

### 如果組織/團隊/藍圖建立後消失

#### 檢查 Console 錯誤日誌
看是否有以下錯誤:
```
[OrganizationRepository] ❌ Document not found after creation!
[OrganizationRepository] Error details: { code: 'permission-denied', ... }
```

**可能原因**:
1. **Firestore 安全規則問題**:
   - 檢查 `firestore.rules` 檔案
   - 確認當前用戶有讀寫權限
   - 暫時使用 `allow read, write: if true;` 進行測試

2. **網路問題**:
   - 檢查瀏覽器 Network 標籤
   - 確認 Firestore API 請求成功 (狀態碼 200)
   - 檢查是否有 CORS 錯誤

3. **認證問題**:
   - 確認用戶已正確登入
   - 檢查 `request.auth.uid` 是否正確

### 如果頁面刷新後數據消失

#### 檢查 IndexedDB
1. 打開 Chrome DevTools → Application → IndexedDB
2. 查看 `firebaseLocalStorageDb` 是否存在
3. 檢查是否有數據

**可能原因**:
1. **持久化未啟用**:
   - 確認 `app.config.ts` 中使用了 `initializeFirestore()` 而非 `getFirestore()`
   - 確認配置了 `persistentLocalCache()`

2. **瀏覽器不支援**:
   - 確保使用的是最新版 Chrome/Firefox/Safari
   - 檢查瀏覽器 Console 是否有持久化相關錯誤

3. **隱私模式/無痕模式**:
   - IndexedDB 在隱私模式下可能不工作
   - 使用正常模式測試

### 如果仍有問題

請收集以下資訊:
1. **Console 完整日誌** (包含錯誤訊息)
2. **Network 標籤的 Firestore API 請求** (包含請求和響應)
3. **Firestore Console 截圖** (確認數據是否存在)
4. **IndexedDB 截圖** (Application → IndexedDB)
5. **瀏覽器版本和操作系統**

## 技術說明

### Firestore 離線持久化工作原理

1. **本地緩存 (IndexedDB)**:
   - Firestore SDK 會將讀取的數據緩存到 IndexedDB
   - 寫入操作會先寫入本地緩存，然後同步到服務器
   - 頁面刷新時從緩存載入數據

2. **多分頁同步**:
   - `persistentMultipleTabManager()` 使用 BroadcastChannel API
   - 不同分頁間可以實時同步數據變更
   - 避免數據衝突

3. **離線支援**:
   - 離線時可以繼續讀取緩存數據
   - 離線時的寫入操作會排隊
   - 重新連線後自動同步

### 相關文檔
- [Firebase Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [AngularFire Firestore](https://github.com/angular/angularfire/blob/main/docs/firestore.md)
- [Firestore Local Cache](https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-modular-api)

## 總結

此修復主要解決了兩個問題:
1. **啟用 Firestore 離線持久化**: 確保數據在頁面刷新後仍然存在
2. **改進數據驗證**: 確保建立的數據已成功寫入並可讀取

修復後應該不會再出現「建立後無法讀取」和「刷新後消失」的問題。如果仍有問題，請按照上述診斷步驟排查。
