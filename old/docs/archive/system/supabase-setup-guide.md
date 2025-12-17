# Supabase 設定指南

## 📋 概述

本指南說明如何在 GigHub 專案中設定 Supabase，包括環境配置、資料庫遷移、RLS 政策部署等步驟。

## 🎯 前置條件

1. **Supabase 帳號**：在 [supabase.com](https://supabase.com) 註冊帳號
2. **Supabase CLI**：安裝 Supabase CLI 工具
   ```bash
   npm install -g supabase
   # 或
   yarn global add supabase
   ```
3. **Node.js 環境**：Node.js 18+ 與 Yarn 4.9.2+
4. **Firebase 專案**：已設定 Firebase Authentication

## 🚀 快速開始

### 步驟 1: 建立 Supabase 專案

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊 **New Project**
3. 填寫專案資訊：
   - **Name**: GigHub
   - **Database Password**: 記錄此密碼（將用於連線）
   - **Region**: 選擇最近的區域（如 `ap-northeast-1` 東京）
4. 等待專案建立完成（約 2-3 分鐘）

### 步驟 2: 取得 API 憑證

1. 進入專案 Dashboard
2. 點擊左側選單的 **Settings** → **API**
3. 複製以下資訊：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: 公開金鑰（前端使用）
   - **service_role key**: ⚠️ 私密金鑰（僅後端使用，不要提交至 Git）

### 步驟 3: 配置環境變數

1. 複製環境變數範本：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 檔案，填入 Supabase 憑證：
   ```env
   # Supabase Configuration (Frontend)
   NG_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NG_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   
   # Supabase Configuration (Backend Only)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_JWT_SECRET=your_jwt_secret_here
   ```

3. 確保 `.env` 已加入 `.gitignore`（預設已設定）

### 步驟 4: 初始化 Supabase CLI

```bash
# 登入 Supabase CLI
supabase login

# 連結到遠端專案
cd /path/to/GigHub
supabase link --project-ref your-project-id

# 驗證連線
supabase status
```

### 步驟 5: 執行資料庫遷移

```bash
# 執行所有 migration 檔案
supabase db push

# 或逐一執行
supabase db push --file supabase/migrations/20251212_01_create_tasks_table.sql
supabase db push --file supabase/migrations/20251212_02_create_logs_table.sql
supabase db push --file supabase/migrations/20251212_03_create_rls_policies.sql
```

**預期輸出**：
```
Applying migration 20251212_01_create_tasks_table...
✔ Migration applied successfully
Applying migration 20251212_02_create_logs_table...
✔ Migration applied successfully
Applying migration 20251212_03_create_rls_policies...
✔ Migration applied successfully
```

### 步驟 6: 建立 Storage Buckets

1. 進入 Supabase Dashboard → **Storage**
2. 建立以下 Buckets：

#### Bucket 1: `task-attachments`
- **Name**: `task-attachments`
- **Public**: ❌ (Private)
- **Allowed MIME types**: `image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*`
- **File size limit**: 10 MB

**Policies**:
```sql
-- SELECT: 使用者可查看自己組織任務的附件
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM tasks 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);

-- INSERT: 使用者可上傳附件至自己組織的任務
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM tasks 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);
```

#### Bucket 2: `log-photos`
- **Name**: `log-photos`
- **Public**: ❌ (Private)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`
- **File size limit**: 5 MB

**Policies**:
```sql
-- SELECT: 使用者可查看自己組織日誌的照片
CREATE POLICY "Users can view log photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM logs 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);

-- INSERT: 使用者可上傳照片至自己組織的日誌
CREATE POLICY "Users can upload log photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM logs 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);
```

### 步驟 7: 配置 Firebase Custom Claims

為了讓 Supabase RLS 政策正確運作，需要在 Firebase Token 中加入 Custom Claims。

#### 方法 1: 使用 Firebase Admin SDK (推薦)

建立 Firebase Cloud Function 在使用者登入時設定 Custom Claims：

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// 在使用者建立時設定 Custom Claims
export const setCustomClaims = functions.auth.user().onCreate(async (user) => {
  try {
    // 從 Firestore 取得使用者的組織資訊
    const userDoc = await admin.firestore()
      .collection('accounts')
      .doc(user.uid)
      .get();
    
    const userData = userDoc.data();
    const organizationId = userData?.organization_id || null;
    const role = userData?.role || 'member';
    
    // 設定 Custom Claims
    await admin.auth().setCustomUserClaims(user.uid, {
      organization_id: organizationId,
      role: role
    });
    
    console.log(`Custom claims set for user ${user.uid}`);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
});

// 手動更新 Custom Claims 的 HTTP 函式（用於測試）
export const updateCustomClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { organizationId, role } = data;
  
  await admin.auth().setCustomUserClaims(context.auth.uid, {
    organization_id: organizationId,
    role: role || 'member'
  });
  
  return { success: true };
});
```

部署 Firebase Functions：
```bash
cd functions
npm install
npm run deploy
```

#### 方法 2: 使用 Firebase Admin SDK Script (開發/測試)

建立腳本手動設定 Custom Claims：

```typescript
// scripts/set-custom-claims.ts
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('./service-account-key.json')
});

async function setCustomClaims(uid: string, organizationId: string, role: string) {
  await admin.auth().setCustomUserClaims(uid, {
    organization_id: organizationId,
    role: role
  });
  
  console.log(`Custom claims set for user ${uid}`);
}

// 範例：為測試使用者設定 Claims
setCustomClaims('test-user-uid', 'org-uuid', 'admin')
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

### 步驟 8: 測試設定

#### 8.1 測試資料庫連線

```bash
# 在 Supabase SQL Editor 執行
SELECT * FROM public.test_rls_policies();
```

#### 8.2 測試 RLS 政策

```sql
-- 設定測試用 JWT Claims
SELECT set_config('request.jwt.claims', 
  '{"sub": "test-user-1", "organization_id": "org-1", "role": "member"}', 
  true);

-- 測試查詢（應該只返回 org-1 的資料）
SELECT * FROM tasks;
SELECT * FROM logs;

-- 測試未授權存取（應該失敗）
SELECT set_config('request.jwt.claims', 
  '{"sub": "test-user-2", "organization_id": "org-2", "role": "member"}', 
  true);

SELECT * FROM tasks WHERE blueprint_id = 'org-1-blueprint-id'; -- 應該返回空
```

#### 8.3 測試前端整合

1. 啟動開發伺服器：
   ```bash
   yarn start
   ```

2. 開啟瀏覽器 DevTools Console

3. 檢查服務初始化：
   ```javascript
   // SupabaseService 應該顯示 "Client initialized successfully"
   // SupabaseAuthSyncService 應該顯示 auth state changes
   ```

4. 登入並檢查 Token 同步：
   ```javascript
   // 應該看到 "Supabase session set successfully"
   ```

5. 測試健康檢查：
   ```javascript
   // 每 30 秒應該看到 "Health check passed"
   ```

## 🔧 進階配置

### CORS 設定

在 Supabase Dashboard → **Settings** → **API** → **CORS**：

**開發環境**：
```
http://localhost:4200
```

**生產環境**：
```
https://gighub.com
https://www.gighub.com
```

### Rate Limiting

建議在 Supabase Dashboard → **Settings** → **API** 配置：
- **Max Requests**: 1000 requests/minute
- **Connection Pooling**: Enabled
- **Statement Timeout**: 30 seconds

### 監控與告警

1. 啟用 **Supabase Logs**：Dashboard → **Logs**
2. 設定 **Email Alerts**：
   - Database CPU > 80%
   - Storage > 90%
   - API Error Rate > 5%

## 🧪 驗證清單

安裝完成後，請確認以下項目：

- [ ] Supabase 專案已建立
- [ ] API 憑證已正確配置在 `.env`
- [ ] 資料庫遷移已執行成功
- [ ] RLS 政策已啟用（tasks & logs 表格）
- [ ] Storage Buckets 已建立並配置政策
- [ ] Firebase Custom Claims 已設定
- [ ] 前端可正常連線至 Supabase
- [ ] Token 同步機制正常運作
- [ ] 健康檢查服務正常運行
- [ ] RLS 政策驗證通過（無未授權存取）

## ❓ 常見問題

### Q1: RLS 政策驗證失敗

**症狀**: 查詢時出現 "PGRST301" 錯誤

**解決方案**:
1. 檢查 Firebase Token 是否包含 Custom Claims
2. 驗證 `organization_id` 格式正確（UUID）
3. 確認 blueprints 表格存在且有 `organization_id` 欄位

### Q2: Token 同步失敗

**症狀**: Console 顯示 "Sync failed"

**解決方案**:
1. 檢查網路連線
2. 驗證 Supabase API Key 正確
3. 查看詳細錯誤訊息（DevTools Console）
4. 手動觸發同步：`SupabaseAuthSyncService.manualSync()`

### Q3: Storage 上傳失敗

**症狀**: 照片或附件上傳失敗

**解決方案**:
1. 確認 Storage Bucket 已建立
2. 檢查 Storage Policies 是否正確配置
3. 驗證檔案大小未超過限制
4. 檢查檔案 MIME type 是否允許

### Q4: 健康檢查失敗

**症狀**: 持續顯示連線異常通知

**解決方案**:
1. 檢查網路連線
2. 驗證 Supabase 專案狀態（Dashboard）
3. 檢查是否達到 API Rate Limit
4. 查看 Supabase Logs 尋找錯誤訊息

## 📚 相關文件

- [Supabase 整合架構](./supabase-integration.md)
- [RLS 政策詳細說明](./supabase-integration.md#row-level-security-rls-政策)
- [Token 同步機制](./supabase-integration.md#認證流程)
- [監控與維運](./supabase-monitoring.md)

## 🆘 支援

如遇到問題，請：
1. 查看 [Supabase 官方文檔](https://supabase.com/docs)
2. 檢查專案的 Supabase Logs
3. 聯絡開發團隊

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team
