```instructions
---
description: 'SQL 陳述式與儲存程序產生指引 (繁體中文翻譯)'
applyTo: '**/*.sql'
---

# SQL 開發

## 資料庫結構生成
- 所有資料表名稱應使用單數形式
- 所有欄位名稱應使用單數形式
- 所有資料表應具有名為 `id` 的主鍵欄位
- 所有資料表應具有 `created_at` 欄位以記錄建立時間
- 所有資料表應具有 `updated_at` 欄位以記錄最後更新時間

## 資料庫設計要點
- 所有資料表應有主鍵約束
- 所有外鍵應有名稱
- 所有外鍵應內聯定義（inline）
- 所有外鍵應設定 `ON DELETE CASCADE`
- 所有外鍵應設定 `ON UPDATE CASCADE`
- 所有外鍵應參照父表的主鍵

## SQL 程式碼風格
- SQL 關鍵字請使用大寫（SELECT, FROM, WHERE）
- 對巢狀查詢與判斷保持一致縮排
- 對於複雜邏輯加入註解說明
- 將過長的查詢拆成多行以提升可讀性
- 一致性地組織子句順序（SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY）

## 查詢結構
- 在 SELECT 陳述式中明確列出欄位名稱，避免使用 `SELECT *`
- 在多表查詢時，以表名或別名限定欄位
- 儘量使用 JOIN 取代子查詢以提升可讀性與效能
- 在需要時加入 LIMIT/TOP 以限制結果集
- 對常用查詢欄位建立適當索引
- 避免在 WHERE 子句對已建索引的欄位使用函式

## 儲存程序命名慣例
- 儲存程序名稱以 `usp_` 為前綴
- 儲存程序名稱採用 PascalCase
- 使用具描述性的名稱以表明用途（例如 `usp_GetCustomerOrders`）
- 返回多筆記錄時使用複數名詞（例如 `usp_GetProducts`）
- 返回單筆記錄時使用單數名詞（例如 `usp_GetProduct`）

## 參數處理
- 參數以 `@` 為前綴
- 參數命名採用 camelCase
- 為可選參數提供預設值
- 在使用前驗證參數值
- 使用註解說明參數用途
- 參數排序應保持一致（必需參數先，選用參數後）

## 儲存程序結構
- 在檔案頂端加入標頭註解區塊，說明描述、參數與回傳值
- 回傳標準化的錯誤代碼/訊息
- 回傳結果集時維持一致的欄位順序
- 使用 OUTPUT 參數回傳狀態資訊
- 臨時表名稱以 `tmp_` 為前綴

## SQL 安全性最佳實務
- 對所有查詢進行參數化以防止 SQL injection
- 在執行動態 SQL 時使用預處理語句（prepared statements）
- 避免在 SQL 腳本中嵌入憑證
- 實作適當錯誤處理，避免洩漏系統細節
- 儘量避免在儲存程序內使用動態 SQL

## 交易管理
- 明確開始與提交交易（BEGIN / COMMIT）
- 根據需求選擇適當隔離等級
- 避免長時間交易以減少鎖定範圍
- 對大量資料處理採用分批處理
- 在修改資料的儲存程序中加入 `SET NOCOUNT ON`

```
---
description: 'Guidelines for generating SQL statements and stored procedures'
applyTo: '**/*.sql'
---

# SQL Development

## Database schema generation
- all table names should be in singular form
- all column names should be in singular form
- all tables should have a primary key column named `id`
- all tables should have a column named `created_at` to store the creation timestamp
- all tables should have a column named `updated_at` to store the last update timestamp

## Database schema design
- all tables should have a primary key constraint
- all foreign key constraints should have a name
- all foreign key constraints should be defined inline
- all foreign key constraints should have `ON DELETE CASCADE` option
- all foreign key constraints should have `ON UPDATE CASCADE` option
- all foreign key constraints should reference the primary key of the parent table

## SQL Coding Style
- use uppercase for SQL keywords (SELECT, FROM, WHERE)
- use consistent indentation for nested queries and conditions
- include comments to explain complex logic
- break long queries into multiple lines for readability
- organize clauses consistently (SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY)

## SQL Query Structure
- use explicit column names in SELECT statements instead of SELECT *
- qualify column names with table name or alias when using multiple tables
- limit the use of subqueries when joins can be used instead
- include LIMIT/TOP clauses to restrict result sets
- use appropriate indexing for frequently queried columns
- avoid using functions on indexed columns in WHERE clauses

## Stored Procedure Naming Conventions
- prefix stored procedure names with 'usp_'
- use PascalCase for stored procedure names
- use descriptive names that indicate purpose (e.g., usp_GetCustomerOrders)
- include plural noun when returning multiple records (e.g., usp_GetProducts)
- include singular noun when returning single record (e.g., usp_GetProduct)

## Parameter Handling
- prefix parameters with '@'
- use camelCase for parameter names
- provide default values for optional parameters
- validate parameter values before use
- document parameters with comments
- arrange parameters consistently (required first, optional later)


## Stored Procedure Structure
- include header comment block with description, parameters, and return values
- return standardized error codes/messages
- return result sets with consistent column order
- use OUTPUT parameters for returning status information
- prefix temporary tables with 'tmp_'


## SQL Security Best Practices
- parameterize all queries to prevent SQL injection
- use prepared statements when executing dynamic SQL
- avoid embedding credentials in SQL scripts
- implement proper error handling without exposing system details
- avoid using dynamic SQL within stored procedures

## Transaction Management
- explicitly begin and commit transactions
- use appropriate isolation levels based on requirements
- avoid long-running transactions that lock tables
- use batch processing for large data operations
- include SET NOCOUNT ON for stored procedures that modify data
