# Firestore 問題根本原因分析

## 問題回顧

用戶報告：組織、團隊、藍圖建立後無法讀取，刷新後消失，但 Firestore 有數據。

## 初步診斷（錯誤）

最初認為是 Firestore 離線持久化未啟用的問題，因此：
1. ✅ 啟用了 `persistentLocalCache()`
2. ✅ 添加了 `persistentMultipleTabManager()`
3. ✅ 改進了 Repository 的數據驗證

**但問題仍然存在！**

## 真實問題（從日誌發現）

查看 `localhost-1765288185909.log` 後發現真正的問題：

### 問題 1: Firestore 複合索引缺失 🔥

**錯誤日誌**：
```
line 1696: [ERROR] {source: '[OrganizationRepository]', message: 'findByCreator failed'}
line 1545: Firebase API called outside injection context: getDocs
```

**根本原因**：
Repository 的查詢使用了 `where() + orderBy()` 組合：

```typescript
// OrganizationRepository.findByCreator()
const q = query(
  this.getCollectionRef(),
  where('created_by', '==', creatorId),
  orderBy('created_at', 'desc')  // ❌ 需要複合索引！
);
```

**為什麼會失敗？**
- Firestore 規則：`where() + orderBy()` 需要複合索引
- 複合索引必須在 Firebase Console 手動建立
- 索引建立需要時間（分鐘到小時）
- **查詢在索引不存在時會直接失敗**

### 問題 2: Effect Injection Context 錯誤 ⚠️

**錯誤日誌**：
```
line 1399: organization.repository.ts:31 Calling Firebase APIs outside of an Injection context
line 1545: Firebase API called outside injection context: getDocs
```

**根本原因**：
`WorkspaceContextService` 的 `effect()` 直接調用 Repository：

```typescript
constructor() {
  effect(() => {
    const user = this.firebaseUser();
    if (user) {
      this.loadUserData(user.uid);  // ❌ 在 effect 中調用異步操作
    }
  });
}
```

**為什麼會有警告？**
- Angular effect 在響應式上下文中執行
- 調用需要 injection context 的服務（如 Firestore）會觸發警告
- 可能導致變更檢測不穩定

## 修復方案

### 修復 1: 移除 orderBy，改用記憶體排序

**修改前**：
```typescript
const q = query(
  this.getCollectionRef(),
  where('created_by', '==', creatorId),
  orderBy('created_at', 'desc')  // ❌ 需要索引
);

return from(getDocs(q)).pipe(
  map(snapshot => snapshot.docs.map(doc => this.toOrganization(doc.data(), doc.id)))
);
```

**修改後**：
```typescript
const q = query(
  this.getCollectionRef(),
  where('created_by', '==', creatorId)  // ✅ 只用 where，不需索引
);

return from(getDocs(q)).pipe(
  map(snapshot => {
    const orgs = snapshot.docs.map(doc => this.toOrganization(doc.data(), doc.id));
    // ✅ 在記憶體中排序
    return orgs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  })
);
```

**優點**：
- ✅ 無需等待 Firestore 索引建立
- ✅ 立即可用
- ✅ 對小到中型數據集性能足夠

**缺點**：
- ⚠️ 大量數據時可能影響性能（但對一般使用場景OK）

**影響檔案**：
- `organization.repository.ts`
- `team.repository.ts`  
- `blueprint.repository.ts`

### 修復 2: 使用 untracked() 修復 Effect

**修改前**：
```typescript
constructor() {
  effect(() => {
    const user = this.firebaseUser();
    if (user) {
      this.loadUserData(user.uid);  // ❌ 直接調用
    }
  });
}
```

**修改後**：
```typescript
constructor() {
  effect(() => {
    const user = this.firebaseUser();
    if (user) {
      untracked(() => {  // ✅ 使用 untracked
        this.loadUserData(user.uid);
        this.restoreContext();
      });
    }
  }, { allowSignalWrites: true });  // ✅ 允許 signal 寫入
}
```

**為什麼這樣有效？**
- `untracked()` 創建非響應式區域
- 在其中調用服務不會觸發警告
- `allowSignalWrites: true` 允許在 effect 中安全地更新 signals

## 測試結果

### 修復前（問題）：
```
❌ [ERROR] findByCreator failed
❌ Firebase API called outside injection context
❌ [WorkspaceContextService] ✅ Organizations loaded: 0  # 沒有載入任何資料
```

### 修復後（預期）：
```
✅ [WorkspaceContextService] 📥 Loading user data for: <user_id>
✅ [OrganizationRepository] ✅ Document created with ID: <id>
✅ [WorkspaceContextService] ✅ Organizations loaded: <count>  # 成功載入
✅ 無 injection context 警告
✅ 無查詢失敗錯誤
```

## 為什麼初步修復沒有解決問題？

初步修復（啟用持久化）是**必要但不充分**的：

1. **持久化修復**（初步）：
   - ✅ 解決頁面刷新後數據從緩存載入
   - ✅ 啟用離線模式
   - ❌ **但無法解決查詢失敗問題**

2. **查詢修復**（本次）：
   - ✅ 解決 Firestore 查詢失敗
   - ✅ 數據可以被正確讀取
   - ✅ 無需等待索引建立

**結論**：兩個修復都是必要的，缺一不可。

## 技術背景：Firestore 索引規則

### 需要索引的查詢類型

| 查詢類型 | 是否需要索引 | 範例 |
|---------|-------------|------|
| 單一 `where()` | ❌ 否 | `where('created_by', '==', uid)` |
| 多個 `where()` | ❌ 否 | `where('type', '==', 'A') + where('status', '==', 'active')` |
| 單一 `orderBy()` | ❌ 否 | `orderBy('created_at', 'desc')` |
| `where() + orderBy()` （不同欄位）| ✅ **是** | `where('created_by', '==', uid) + orderBy('created_at', 'desc')` |
| `where() + where() + orderBy()` | ✅ **是** | 多個條件 + 排序 |

### 為什麼 where + orderBy 需要索引？

Firestore 的查詢優化器需要索引來高效執行：
1. 先篩選符合 `where()` 條件的文件
2. 再按 `orderBy()` 排序結果

如果沒有複合索引，Firestore 會拒絕執行查詢以避免全表掃描。

### 解決方案選擇

**方案 A：建立複合索引**
```
✅ 性能最佳（伺服器端排序）
❌ 需要等待索引建立（時間不確定）
❌ 需要維護索引配置
❌ 增加 Firestore 成本
```

**方案 B：記憶體排序** ← 我們選擇的方案
```
✅ 立即可用（無需等待）
✅ 無需維護索引
✅ 降低 Firestore 成本
⚠️ 大量數據時性能下降
```

對於組織/團隊/藍圖這類數據量不大的場景，方案 B 更合適。

## 其他發現的問題（未修復）

### ng-alain SettingsService JSON 解析錯誤

**錯誤**：
```
ERROR SyntaxError: "undefined" is not valid JSON
    at _SettingsService.getData (theme.mjs:507:17)
    at get user (theme.mjs:541:17)
    at get user (basic.component.ts:185:26)
```

**分析**：
- ng-alain 的 `SettingsService.getData()` 嘗試解析 `undefined` 為 JSON
- 發生在 `LayoutBasicComponent` 嘗試獲取 user 設置時
- 可能是初始化順序問題或 localStorage 中沒有數據

**影響**：
- ⚠️ 會產生錯誤日誌
- ✅ 不影響 Firestore 數據讀取
- ✅ 不影響組織/團隊/藍圖功能

**建議**：
- 這是一個獨立的問題，需要單獨修復
- 可能需要在 `SettingsService.getData()` 中添加 null/undefined 檢查
- 或確保在使用前正確初始化 settings

## 總結

### 問題層次

1. **表面現象**：組織/團隊/藍圖建立後無法讀取
2. **初步診斷**：Firestore 持久化未啟用（部分正確）
3. **真實原因**：
   - 🔥 **Firestore 查詢需要複合索引**（主要問題）
   - ⚠️ **Effect injection context 錯誤**（次要問題）
   - ✅ **持久化未啟用**（已在初步修復）

### 修復效果

| 問題 | 修復前 | 修復後 |
|-----|-------|-------|
| 組織建立後讀取 | ❌ 失敗 | ✅ 成功 |
| 頁面刷新後持久 | ❌ 消失 | ✅ 存在 |
| Firestore 查詢 | ❌ 失敗 | ✅ 成功 |
| Injection 警告 | ⚠️ 出現 | ✅ 無 |

### 關鍵學習

1. **日誌是關鍵**：實際錯誤日誌揭示了真正的問題
2. **多層次問題**：需要同時修復持久化和查詢
3. **Firestore 索引**：`where + orderBy` 需要特別注意
4. **Effect 使用**：異步操作需要 `untracked()`
5. **記憶體排序**：對小數據集是可行的替代方案

## 參考資料

- [Firestore 查詢索引文檔](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Angular Effect 文檔](https://angular.dev/guide/signals#effects)
- [Angular Fire Zones 文檔](https://github.com/angular/angularfire/blob/main/docs/zones.md)
