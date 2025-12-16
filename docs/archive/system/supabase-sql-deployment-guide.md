# Supabase SQL 部署指南

## 📋 概述

本指南說明如何將 SQL Migration 檔案部署至 Supabase 遠端資料庫。

## 🚀 方法一：使用 Supabase Dashboard (推薦)

### 步驟 1: 登入 Supabase Dashboard

1. 前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入您的帳號
3. 選擇您的專案 (GigHub)

### 步驟 2: 開啟 SQL Editor

1. 在左側選單點擊 **SQL Editor**
2. 點擊 **New Query** 建立新查詢

### 步驟 3: 執行 Migration 檔案

依序執行以下 SQL 檔案：

#### 3.1 建立 Tasks 表格

1. 開啟檔案：`supabase/migrations/20251212_01_create_tasks_table.sql`
2. 複製整個檔案內容
3. 貼至 SQL Editor
4. 點擊 **Run** 或按 `Ctrl+Enter` 執行
5. 確認看到成功訊息：
   ```
   Migration 20251212_01_create_tasks_table completed successfully
   ```

#### 3.2 建立 Logs 表格

1. 開啟檔案：`supabase/migrations/20251212_02_create_logs_table.sql`
2. 複製整個檔案內容
3. 貼至 SQL Editor
4. 點擊 **Run** 執行
5. 確認看到成功訊息：
   ```
   Migration 20251212_02_create_logs_table completed successfully
   ```

#### 3.3 建立 RLS 政策

1. 開啟檔案：`supabase/migrations/20251212_03_create_rls_policies.sql`
2. 複製整個檔案內容
3. 貼至 SQL Editor
4. 點擊 **Run** 執行
5. 確認看到成功訊息：
   ```
   Migration 20251212_03_create_rls_policies completed successfully
   Tasks policies: X, Logs policies: Y
   ```

### 步驟 4: 驗證部署

執行以下 SQL 驗證表格和政策已正確建立：

```sql
-- 檢查表格是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'logs');

-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'logs');

-- 檢查政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'logs')
GROUP BY tablename;

-- 執行測試函式
SELECT * FROM public.test_rls_policies();
```

**預期結果**:
- `tasks` 和 `logs` 表格存在
- RLS 已啟用 (`rowsecurity = true`)
- Tasks 有 5+ 個政策，Logs 有 6+ 個政策
- 測試函式全部通過

---

## 🔧 方法二：使用 Supabase CLI (進階)

### 前置要求

1. 安裝 Supabase CLI：
   ```bash
   npm install -g supabase
   # 或
   yarn global add supabase
   ```

2. 登入 Supabase：
   ```bash
   supabase login
   ```

3. 連結專案：
   ```bash
   cd /path/to/GigHub
   supabase link --project-ref YOUR_PROJECT_ID
   ```

### 執行 Migration

#### 方法 2A: 推送所有 Migration

```bash
# 推送所有 migration 檔案
supabase db push

# 或指定遠端 URL
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### 方法 2B: 逐一執行 Migration

```bash
# 執行個別 migration
supabase db push --file supabase/migrations/20251212_01_create_tasks_table.sql
supabase db push --file supabase/migrations/20251212_02_create_logs_table.sql
supabase db push --file supabase/migrations/20251212_03_create_rls_policies.sql
```

### 驗證部署

```bash
# 檢查遠端資料庫狀態
supabase db status

# 查看 migration 歷史
supabase migration list

# 測試連線
supabase db ping
```

---

## 🔒 方法三：使用 psql (PostgreSQL CLI)

### 前置要求

1. 安裝 PostgreSQL Client
2. 取得資料庫連線字串：
   - 進入 Supabase Dashboard → Settings → Database
   - 複製 **Connection String** (Direct Connection)

### 執行 Migration

```bash
# 連線至資料庫
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 或使用檔案執行
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20251212_01_create_tasks_table.sql

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20251212_02_create_logs_table.sql

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20251212_03_create_rls_policies.sql
```

---

## ✅ 部署後檢查清單

### 資料庫結構

- [ ] `tasks` 表格已建立
- [ ] `logs` 表格已建立
- [ ] 所有索引已建立 (tasks: 9+, logs: 6+)
- [ ] 觸發器已設定 (updated_at 自動更新)

### RLS 政策

- [ ] Tasks 表格 RLS 已啟用
- [ ] Logs 表格 RLS 已啟用
- [ ] Tasks 政策數量 ≥ 5
- [ ] Logs 政策數量 ≥ 6
- [ ] Helper 函式已建立 (get_user_organization_id, get_user_role, etc.)

### 功能驗證

- [ ] 可以插入測試資料
- [ ] RLS 政策正確運作 (組織隔離)
- [ ] 軟刪除功能正常
- [ ] 索引查詢效能良好

### 測試 RLS 政策

在 SQL Editor 執行以下測試：

```sql
-- 設定測試用 JWT Claims
SELECT set_config('request.jwt.claims', 
  '{"sub": "test-user-1", "organization_id": "org-uuid-1", "role": "member"}', 
  true);

-- 測試插入
INSERT INTO tasks (blueprint_id, title, creator_id, status)
VALUES ('blueprint-uuid-1', 'Test Task', 'test-user-1', 'TODO');

-- 測試查詢（應該只返回 org-uuid-1 的資料）
SELECT * FROM tasks;

-- 測試未授權存取（應該失敗或返回空）
SELECT set_config('request.jwt.claims', 
  '{"sub": "test-user-2", "organization_id": "org-uuid-2", "role": "member"}', 
  true);

SELECT * FROM tasks; -- 應該返回空
```

---

## 🚨 常見問題排解

### 問題 1: RLS 政策驗證失敗

**症狀**: 查詢時出現 "PGRST301" 錯誤

**解決方案**:
1. 確認 RLS Helper Functions 已建立
2. 檢查 blueprints 表格是否存在且有 `organization_id` 欄位
3. 驗證 JWT Claims 格式正確

### 問題 2: Migration 執行失敗

**症狀**: SQL 執行時出現錯誤

**解決方案**:
1. 檢查是否有語法錯誤
2. 確認相依的表格已存在 (如 blueprints)
3. 檢查是否有重複的物件名稱
4. 查看 Supabase Logs 尋找詳細錯誤訊息

### 問題 3: 索引建立失敗

**症狀**: 索引建立時出錯

**解決方案**:
1. 確認欄位名稱正確
2. 檢查表格中是否已有相同名稱的索引
3. 驗證資料類型支援索引

### 問題 4: 觸發器無法執行

**症狀**: `updated_at` 沒有自動更新

**解決方案**:
1. 確認函式 `update_updated_at_column()` 已建立
2. 檢查觸發器是否正確綁定到表格
3. 驗證函式權限設定

---

## 📚 相關文件

- [Supabase 整合架構](../architecture/supabase-integration.md)
- [Supabase 設定指南](./supabase-setup-guide.md)
- [RLS 政策詳細說明](../architecture/supabase-integration.md#row-level-security-rls-政策)

---

## 📞 支援

如遇到問題：
1. 查看 Supabase Dashboard → Logs
2. 檢查 SQL Editor 的錯誤訊息
3. 參考 [Supabase 官方文檔](https://supabase.com/docs)
4. 聯絡開發團隊

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team
