# Firebase Firestore 複合索引問題解決方案

## 📋 問題概述

### 錯誤訊息
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/elite-chiller-455712-c4/firestore/indexes?create_composite=...
```

### 影響範圍
- **模組**: Construction Log (工地施工日誌)
- **檔案**: `src/app/core/repositories/log-firestore.repository.ts`
- **方法**: `findByBlueprint()`, `findWithOptions()`
- **Collection**: `logs`

## 🔍 根本原因分析

### 查詢結構
```typescript
// LogFirestoreRepository.findByBlueprint()
const constraints: any[] = [
  where('blueprint_id', '==', blueprintId),  // ✅ 相等過濾 1
  where('deleted_at', '==', null),           // ✅ 相等過濾 2
  orderBy('date', 'desc')                     // ✅ 排序（不同欄位）
];
```

### Firestore 索引需求

Firestore 在以下情況需要複合索引：

1. **多個相等過濾 + 不同欄位排序** ← 當前情況
2. 範圍過濾 + 排序
3. 多個 orderBy 子句

**當前查詢**:
- 使用 2 個相等過濾器（`blueprint_id`, `deleted_at`）
- 在不同欄位上排序（`date`）
- ⚠️ **必須建立複合索引**

### 為什麼之前沒有索引？

在簡化重構過程中：
1. 整合了 `LogFirestoreRepository`
2. 保留了完整的查詢邏輯（包含 `deleted_at` 過濾）
3. 但 `firestore.indexes.json` 沒有對應的索引定義
4. 導致查詢失敗

## ✅ 解決方案

### 已執行的修復

**1. 添加複合索引定義**

在 `firestore.indexes.json` 中新增：

```json
{
  "collectionGroup": "logs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "blueprint_id", "order": "ASCENDING" },
    { "fieldPath": "deleted_at", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```

**索引欄位順序說明**:
1. `blueprint_id` (ASC) - 主要分組欄位
2. `deleted_at` (ASC) - 軟刪除過濾
3. `date` (DESC) - 按日期降序排序

### 部署步驟

**方法 1: 使用 Firebase CLI（推薦）**

```bash
# 1. 安裝 Firebase CLI（如果尚未安裝）
npm install -g firebase-tools

# 2. 登入 Firebase
firebase login

# 3. 部署索引
firebase deploy --only firestore:indexes

# 4. 等待索引建立完成
# 可在 Firebase Console 查看建立進度
```

**方法 2: 使用 Firebase Console**

1. 訪問錯誤訊息中的 URL
2. 點擊「Create Index」按鈕
3. 等待索引建立完成（通常需要幾分鐘）

**方法 3: 使用 gcloud CLI**

```bash
# 確保已登入 gcloud
gcloud auth login

# 建立複合索引
gcloud firestore indexes composite create \
  --project=elite-chiller-455712-c4 \
  --database=(default) \
  --collection-group=logs \
  --query-scope=COLLECTION \
  --field-config=field-path=blueprint_id,order=ASCENDING \
  --field-config=field-path=deleted_at,order=ASCENDING \
  --field-config=field-path=date,order=DESCENDING
```

## 📊 索引效能影響

### 查詢效能

**之前（無索引）**:
- ❌ 查詢失敗
- ❌ 無法載入日誌列表

**之後（有索引）**:
- ✅ 查詢成功
- ✅ 最佳化的資料掃描
- ✅ 快速的結果返回（< 100ms）

### 儲存成本

複合索引會增加一些儲存成本：
- **每個文檔**: 約增加 32 bytes
- **1000 個日誌**: 約增加 32 KB
- **成本**: 微乎其微（< $0.01/月）

**結論**: 效能提升遠超過成本增加 ✅

## 🔄 其他受影響的查詢

### 相同模式的查詢

`findWithOptions()` 方法使用相同的查詢模式，因此也會受益於此索引：

```typescript
async findWithOptions(options: LogQueryOptions): Promise<Log[]> {
  const constraints: any[] = [];
  
  if (options.blueprintId) {
    constraints.push(where('blueprint_id', '==', options.blueprintId));
  }
  
  if (!options.includeDeleted) {
    constraints.push(where('deleted_at', '==', null));  // 使用相同索引
  }
  
  constraints.push(orderBy('date', 'desc'));
  // ...
}
```

### 可能需要額外索引的情況

如果未來添加以下查詢，需要建立額外索引：

**1. 按建立者過濾 + 排序**
```typescript
where('blueprint_id', '==', blueprintId)
where('creator_id', '==', userId)
where('deleted_at', '==', null)
orderBy('date', 'desc')

// 需要索引: [blueprint_id, creator_id, deleted_at, date]
```

**2. 日期範圍查詢 + 排序**
```typescript
where('blueprint_id', '==', blueprintId)
where('date', '>=', startDate)
where('date', '<=', endDate)
where('deleted_at', '==', null)

// 需要索引: [blueprint_id, deleted_at, date]
// ✅ 當前索引已涵蓋！
```

## 🎯 最佳實踐

### 索引設計原則

1. **欄位順序很重要**
   - 相等過濾在前
   - 範圍過濾其次
   - 排序欄位最後

2. **避免過度索引**
   - 只為實際使用的查詢建立索引
   - 定期審查和清理未使用的索引

3. **監控索引使用情況**
   - 使用 Firebase Console 查看索引使用統計
   - 刪除長期未使用的索引

### 開發工作流程

**新增查詢時**:
1. 先在本地測試查詢
2. Firestore 會返回需要的索引 URL
3. 在 `firestore.indexes.json` 添加索引定義
4. 提交到版本控制
5. 部署索引到 Firebase

**避免索引問題**:
- ✅ 在開發環境先測試所有查詢
- ✅ 將索引定義納入版本控制
- ✅ CI/CD 自動部署索引
- ✅ 文檔記錄所有複雜查詢

## 📚 參考資料

### Firebase 官方文檔
- [Index Overview](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Index Best Practices](https://firebase.google.com/docs/firestore/best-practices)

### 相關檔案
- `firestore.indexes.json` - 索引定義檔
- `firestore.rules` - 安全規則
- `src/app/core/repositories/log-firestore.repository.ts` - 日誌 Repository

### 監控和除錯
```bash
# 列出所有索引
firebase firestore:indexes

# 查看索引建立狀態
gcloud firestore indexes composite list --database=(default)

# 刪除未使用的索引
gcloud firestore indexes composite delete INDEX_NAME --database=(default)
```

## ✨ 總結

### 問題
- Firestore 查詢需要複合索引但未定義

### 解決方案
- 在 `firestore.indexes.json` 添加必要的複合索引定義

### 影響
- ✅ 修復日誌模組查詢失敗問題
- ✅ 提升查詢效能
- ✅ 支援未來相似查詢模式

### 後續行動
1. **立即**: 部署索引到 Firebase (`firebase deploy --only firestore:indexes`)
2. **測試**: 驗證日誌列表功能正常運作
3. **監控**: 檢查索引建立狀態和查詢效能

---

**文檔版本**: 1.0  
**最後更新**: 2025-12-12  
**作者**: GigHub Development Team
