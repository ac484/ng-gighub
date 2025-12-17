# 雲端模組疑難排解指南
# Cloud Module Troubleshooting Guide

## 🚨 常見問題

### 問題 1: 上傳成功但顯示「上傳失敗」

**症狀**：
- 控制台訊息：「檔案 xxx.jpg 上傳失敗」
- Storage 中可以看到檔案
- 檔案列表無法顯示任何檔案

**原因**：
Firestore 安全規則未部署或配置錯誤，導致：
1. 檔案成功上傳到 Firebase Storage ✅
2. 但 Firestore 寫入失敗 ❌（保存檔案元資料）
3. 檔案列表查詢失敗 ❌（讀取檔案元資料）

**解決步驟**：

#### 步驟 1: 檢查 Firestore 規則是否已部署

```bash
# 部署 Firestore 安全規則
firebase deploy --only firestore:rules

# 檢查部署狀態
firebase firestore:indexes
```

**預期輸出**：
```
✔  firestore: released rules firestore.rules to cloud.firestore
```

#### 步驟 2: 檢查 Firestore 索引是否已建立

```bash
# 部署 Firestore 索引
firebase deploy --only firestore:indexes

# 等待索引建立完成（通常 5-15 分鐘）
firebase firestore:indexes
```

**預期輸出**：
```
Indexes (4):
[✔] cloud_files (blueprint_id ASC, uploaded_at DESC) - ENABLED
[✔] cloud_files (blueprint_id ASC, status ASC, uploaded_at DESC) - ENABLED
[✔] cloud_backups (blueprint_id ASC, created_at DESC) - ENABLED
[✔] cloud_backups (blueprint_id ASC, status ASC, created_at DESC) - ENABLED
```

如果索引顯示 "BUILDING"，請等待 5-15 分鐘。

#### 步驟 3: 檢查 Firebase Storage 規則是否已部署

```bash
# 部署 Storage 安全規則
firebase deploy --only storage
```

**預期輸出**：
```
✔  storage: released rules storage.rules to firebase.storage
```

#### 步驟 4: 驗證 Firebase 認證

開啟瀏覽器控制台（F12），檢查：

```javascript
// 檢查認證狀態
console.log('Firebase Auth:', firebase.auth().currentUser);
```

**如果輸出 `null`**：
- 使用者未登入 Firebase Auth
- Firestore 規則拒絕匿名存取
- 需要先登入或更新安全規則允許匿名存取（不建議）

#### 步驟 5: 檢查瀏覽器控制台錯誤

開啟瀏覽器控制台（F12），查看詳細錯誤：

```
[CloudRepository] Detailed upload error: {
  error: FirebaseError,
  errorMessage: "Missing or insufficient permissions",
  errorCode: "permission-denied"
}
```

**常見錯誤代碼**：
- `permission-denied` → Firestore 規則拒絕存取
- `unauthenticated` → 使用者未認證
- `failed-precondition` → 索引未建立

---

### 問題 2: 檔案列表無法載入

**症狀**：
- 頁面顯示「載入中...」
- 或顯示「暫無檔案」
- 但 Storage 中有檔案

**原因**：
Firestore 查詢失敗（權限或索引問題）

**解決方案**：

同問題 1 的步驟 1-4

---

### 問題 3: 檔案上傳後需要重新整理才能看到

**症狀**：
- 上傳成功
- 但檔案不立即顯示
- 重新整理頁面後才出現

**原因**：
這已在最新版本中修復（commit c6f3b0c），上傳後會自動重新載入檔案列表。

**確認版本**：
```bash
git log --oneline -1
# 應顯示：c6f3b0c Redesign cloud module with GitHub-like layout
```

---

## 🔧 完整部署檢查清單

在使用雲端模組前，請確認以下配置已完成：

### 1. Firebase 專案設定

- [ ] Firebase 專案已建立
- [ ] Firebase Authentication 已啟用
- [ ] Cloud Firestore 已啟用
- [ ] Firebase Storage 已啟用

### 2. 本地配置檔案

檢查以下檔案是否存在：

- [ ] `firebase.json` - Firebase 專案配置
- [ ] `firestore.rules` - Firestore 安全規則
- [ ] `firestore.indexes.json` - Firestore 索引配置
- [ ] `storage.rules` - Storage 安全規則

### 3. 部署狀態

```bash
# 完整部署
firebase deploy --only firestore:rules,firestore:indexes,storage

# 或分步部署
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

檢查部署結果：

- [ ] Firestore rules 部署成功
- [ ] Firestore indexes 建立完成（狀態：ENABLED）
- [ ] Storage rules 部署成功

### 4. 認證狀態

- [ ] 使用者已登入 Firebase Auth
- [ ] 可在控制台查看 `firebase.auth().currentUser`

### 5. 測試流程

按順序測試：

1. [ ] 開啟藍圖詳情頁面
2. [ ] 點擊「雲端」分頁
3. [ ] 檢查是否顯示「上傳檔案」按鈕
4. [ ] 嘗試上傳一個小檔案（< 1MB）
5. [ ] 檢查控制台是否有錯誤訊息
6. [ ] 確認檔案立即顯示在列表中
7. [ ] 點擊檔案查看詳情
8. [ ] 測試下載功能
9. [ ] 測試刪除功能

---

## 📊 除錯技巧

### 啟用詳細日誌

在瀏覽器控制台執行：

```javascript
// 啟用 Firebase 詳細日誌
firebase.firestore.setLogLevel('debug');

// 監聽所有 Firestore 錯誤
firebase.firestore().enablePersistence()
  .catch((err) => console.error('Firestore persistence error:', err));
```

### 檢查 Firestore 規則

前往 Firebase Console：
1. 選擇專案
2. 點擊「Firestore Database」
3. 點擊「Rules」分頁
4. 確認規則包含 `cloud_files` 和 `cloud_backups` 集合

**範例規則**：
```javascript
match /cloud_files/{fileId} {
  allow read: if request.auth != null 
    && canReadBlueprint(resource.data.blueprint_id);
  
  allow create: if request.auth != null 
    && canEditBlueprint(request.resource.data.blueprint_id);
  
  allow update, delete: if request.auth != null 
    && canEditBlueprint(resource.data.blueprint_id);
}
```

### 檢查 Storage 規則

前往 Firebase Console：
1. 選擇專案
2. 點擊「Storage」
3. 點擊「Rules」分頁
4. 確認規則包含 `blueprint-{blueprintId}` 路徑

**範例規則**：
```javascript
match /blueprint-{blueprintId}/{allPaths=**} {
  allow read, write: if request.auth != null 
    && canAccessBlueprint(blueprintId)
    && isValidFileSize()
    && isAllowedFileType();
}
```

---

## 🆘 仍然無法解決？

### 收集除錯資訊

1. **截圖瀏覽器控制台錯誤**
2. **複製詳細錯誤訊息**
3. **檢查 Firebase Console 的用量統計**
4. **確認 Firebase 專案配額未超過**

### 檢查專案配額

前往 Firebase Console → Usage and billing

常見限制：
- Firestore 讀取：每日 50,000 次（免費方案）
- Storage 儲存：5GB（免費方案）
- Storage 下載：1GB/日（免費方案）

---

## 📞 聯絡資訊

如果問題仍未解決，請提供以下資訊：

1. 錯誤訊息（含瀏覽器控制台截圖）
2. Firebase 部署狀態輸出
3. Firestore 索引狀態
4. 認證狀態（是否已登入）
5. Firebase 專案 ID

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-14  
**適用版本**: commit c6f3b0c 之後
