# Database Migration Guide - Task Quantity Expansion

## 📋 Overview

This guide provides step-by-step instructions for applying the Task Quantity Expansion feature migrations to your Firebase/Firestore database.

**Migration Files:**
- `firebase/migrations/20251212_04_task_quantity_expansion.sql` - Schema changes
- `firebase/migrations/20251212_05_task_quantity_rls_policies.sql` - Security policies

**Target Database:** https://zecsbstjqjqoytwgjyct.firebase.co

## 🎯 What Will Be Created

### New Tables (3)
1. **log_tasks** - Junction table linking logs and tasks with quantity tracking
2. **quality_controls** - QC workflow management
3. **task_progress** - Audit trail for quantity changes

### Extended Tables (1)
1. **tasks** - Added 6 new columns for quantity tracking

### Functions (5)
- `calculate_task_completed_quantity()` - Calculate totals
- `update_task_completed_quantity()` - Trigger function
- `user_can_access_blueprint()` - Security helper
- `user_is_qc_inspector()` - Security helper
- `user_is_admin()` - Security helper

### Triggers (1)
- `trigger_update_task_quantity` - Auto-update task quantities

### Indexes (16+)
- Performance optimization for queries and RLS policies

## 🚀 Application Methods

### Method 1: Firebase/Firestore Dashboard (Recommended for Manual Application)

**Steps:**

1. **Login to Firebase/Firestore Dashboard**
   ```
   https://firebase.com/dashboard/project/zecsbstjqjqoytwgjyct
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query" button

3. **Apply Schema Migration**
   - Open file: `firebase/migrations/20251212_04_task_quantity_expansion.sql`
   - Copy entire content
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for success message
   - Review output for any errors

4. **Apply RLS Policies**
   - Open file: `firebase/migrations/20251212_05_task_quantity_rls_policies.sql`
   - Copy entire content
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message
   - Review output for any errors

5. **Verify Installation**
   - Run verification queries (see Verification section below)

**Expected Output:**
```
NOTICE:  Migration 20251212_04_task_quantity_expansion.sql completed successfully
NOTICE:  Created tables: log_tasks, quality_controls, task_progress
NOTICE:  Extended table: tasks (added quantity tracking fields)
NOTICE:  Created indexes for performance optimization
NOTICE:  Created helper functions and triggers for automatic quantity calculation

NOTICE:  Migration 20251212_05_task_quantity_rls_policies.sql completed successfully
NOTICE:  Enabled RLS on: log_tasks, quality_controls, task_progress
NOTICE:  Created RLS policies for organization-level access control
NOTICE:  Created security helper functions
NOTICE:  Created performance optimization indexes
```

### Method 2: Firebase/Firestore MCP (via GitHub Copilot)

**Prerequisites:**
- GitHub Copilot enabled
- Firebase/Firestore MCP configured in `.github/copilot/mcp-servers.yml`
- Repository secrets configured:
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_MCP_TOKEN`

**Steps:**

1. **Open GitHub Copilot Chat**
   - In VS Code, open Copilot Chat (Ctrl+Alt+I or Cmd+Option+I)

2. **Request Migration Execution**
   ```
   @workspace Execute the following SQL migrations using Firebase/Firestore MCP:
   1. firebase/migrations/20251212_04_task_quantity_expansion.sql
   2. firebase/migrations/20251212_05_task_quantity_rls_policies.sql
   
   Target project: zecsbstjqjqoytwgjyct
   ```

3. **Verify Execution**
   - Copilot will use MCP to connect and execute
   - Review the output and any error messages
   - Verify changes in Firebase/Firestore Dashboard

### Method 3: Firebase/Firestore CLI

**Prerequisites:**
```bash
# Install Firebase/Firestore CLI
npx firebase --version  # Should show 2.66.0 or higher
```

**Steps:**

1. **Login to Firebase/Firestore**
   ```bash
   npx firebase login
   ```

2. **Link Project**
   ```bash
   cd /path/to/GigHub
   npx firebase link --project-ref zecsbstjqjqoytwgjyct
   ```

3. **Apply Migrations**
   ```bash
   # Method A: Push all migrations
   npx firebase db push
   
   # Method B: Execute specific files
   npx firebase db execute \
     --file firebase/migrations/20251212_04_task_quantity_expansion.sql
   
   npx firebase db execute \
     --file firebase/migrations/20251212_05_task_quantity_rls_policies.sql
   ```

4. **Verify Status**
   ```bash
   npx firebase migration list
   ```

### Method 4: Direct PostgreSQL Connection

**Prerequisites:**
- PostgreSQL client (`psql`) installed
- Database password from Firebase/Firestore Dashboard

**Steps:**

1. **Get Connection String**
   - Go to Firebase/Firestore Dashboard → Settings → Database
   - Copy "Connection string" (Transaction mode)
   - Replace `[YOUR-PASSWORD]` with actual password

2. **Execute Migrations**
   ```bash
   # Set the connection string
   export DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.zecsbstjqjqoytwgjyct.firebase.co:5432/postgres"
   
   # Apply schema migration
   psql "$DB_URL" -f firebase/migrations/20251212_04_task_quantity_expansion.sql
   
   # Apply RLS policies
   psql "$DB_URL" -f firebase/migrations/20251212_05_task_quantity_rls_policies.sql
   ```

## ✅ Verification

After applying migrations, verify everything is working:

### 1. Check Tables Exist

```sql
-- Run in Firebase/Firestore SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('log_tasks', 'quality_controls', 'task_progress')
ORDER BY table_name;
```

**Expected Result:**
```
table_name
-----------------
log_tasks
quality_controls
task_progress
(3 rows)
```

### 2. Check Tasks Table Extension

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name LIKE '%quantity%'
ORDER BY ordinal_position;
```

**Expected Result:**
```
column_name                       | data_type | is_nullable | column_default
----------------------------------+-----------+-------------+---------------
total_quantity                    | numeric   | YES         | NULL
completed_quantity                | numeric   | YES         | 0
enable_quantity_tracking          | boolean   | YES         | false
auto_complete_on_quantity_reached | boolean   | YES         | true
auto_send_to_qc                   | boolean   | YES         | true
(5 rows)
```

### 3. Check RLS Policies

```sql
SELECT 
  tablename, 
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('log_tasks', 'quality_controls', 'task_progress')
ORDER BY tablename, policyname;
```

**Expected Result:** Should show multiple policies for each table

### 4. Check Functions

```sql
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'calculate_task_completed_quantity',
  'update_task_completed_quantity',
  'user_can_access_blueprint',
  'user_is_qc_inspector',
  'user_is_admin'
)
ORDER BY routine_name;
```

**Expected Result:**
```
routine_name                      | routine_type | security_type
----------------------------------+--------------+--------------
calculate_task_completed_quantity | FUNCTION     | DEFINER
update_task_completed_quantity    | FUNCTION     | DEFINER
user_can_access_blueprint         | FUNCTION     | DEFINER
user_is_admin                     | FUNCTION     | DEFINER
user_is_qc_inspector              | FUNCTION     | DEFINER
(5 rows)
```

### 5. Check Triggers

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'log_tasks'
AND trigger_name = 'trigger_update_task_quantity';
```

**Expected Result:**
```
trigger_name               | event_manipulation | event_object_table | action_timing
---------------------------+-------------------+--------------------+--------------
trigger_update_task_quantity | INSERT            | log_tasks          | AFTER
trigger_update_task_quantity | UPDATE            | log_tasks          | AFTER
trigger_update_task_quantity | DELETE            | log_tasks          | AFTER
(3 rows)
```

### 6. Test Basic Operations

```sql
-- Test 1: Query extended tasks table
SELECT id, title, total_quantity, unit, completed_quantity, enable_quantity_tracking
FROM public.tasks
WHERE enable_quantity_tracking = true
LIMIT 5;

-- Test 2: Insert test data (if you have permissions)
-- Note: This requires proper RLS permissions
INSERT INTO public.log_tasks (
  log_id,
  task_id,
  task_title,
  quantity_completed,
  unit
) VALUES (
  'YOUR_LOG_ID'::uuid,
  'YOUR_TASK_ID'::uuid,
  'Test Task',
  10.5,
  'kg'
) RETURNING *;

-- Test 3: Verify trigger worked
SELECT completed_quantity 
FROM public.tasks 
WHERE id = 'YOUR_TASK_ID'::uuid;
-- Should show 10.5 if this was the first log_tasks entry
```

## 🔍 Troubleshooting

### Issue: "relation already exists"

**Cause:** Migration was partially applied before

**Solution:**
1. Check which tables exist
2. Manually drop conflicting tables if needed:
   ```sql
   DROP TABLE IF EXISTS public.task_progress CASCADE;
   DROP TABLE IF EXISTS public.quality_controls CASCADE;
   DROP TABLE IF EXISTS public.log_tasks CASCADE;
   ```
3. Re-run migration

### Issue: "foreign key constraint violation"

**Cause:** Referenced tables don't exist or don't have required data

**Solution:**
1. Ensure base tables exist: `tasks`, `logs`, `blueprints`, `accounts`
2. Verify these tables have proper primary keys
3. Run base migrations first (20251212_01, 02, 03)

### Issue: "permission denied for table"

**Cause:** Insufficient database privileges

**Solution:**
1. Use service role key (not anon key) for migrations
2. Ensure you're logged in as postgres user or equivalent
3. In Firebase/Firestore Dashboard, use SQL Editor (automatically uses service role)

### Issue: RLS policies blocking queries

**Cause:** RLS is enabled but user doesn't meet policy conditions

**Solution:**
1. Ensure auth.uid() returns valid user ID
2. Verify user exists in `accounts` table
3. Check user's organization_id matches blueprint's organization_id
4. Review policy conditions in the SQL file

### Issue: Trigger not firing

**Cause:** Trigger or function has an error

**Solution:**
1. Check function definition:
   ```sql
   \df+ update_task_completed_quantity
   ```
2. Test function manually:
   ```sql
   SELECT calculate_task_completed_quantity('TASK_ID'::uuid);
   ```
3. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_task_quantity';
   ```

## 🔄 Rollback Procedure

If you need to rollback these migrations:

```sql
-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_update_task_quantity ON public.log_tasks;

-- 2. Drop functions
DROP FUNCTION IF EXISTS public.calculate_task_completed_quantity(UUID);
DROP FUNCTION IF EXISTS public.update_task_completed_quantity();
DROP FUNCTION IF EXISTS public.user_can_access_blueprint(UUID);
DROP FUNCTION IF EXISTS public.user_is_qc_inspector();
DROP FUNCTION IF EXISTS public.user_is_admin();

-- 3. Drop new tables (cascade removes RLS policies and indexes)
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;

-- 4. Remove columns from tasks table
ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS total_quantity,
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS completed_quantity,
DROP COLUMN IF EXISTS enable_quantity_tracking,
DROP COLUMN IF EXISTS auto_complete_on_quantity_reached,
DROP COLUMN IF EXISTS auto_send_to_qc;

-- 5. Restore original status constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check CHECK (
  status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED')
);
```

## 📊 Performance Considerations

After migration, monitor these metrics:

1. **Query Performance**
   - Monitor slow query logs for RLS policy overhead
   - Check index usage with `pg_stat_user_indexes`

2. **Storage**
   - New tables will grow with usage
   - Plan for backup strategy

3. **Trigger Overhead**
   - The trigger on `log_tasks` runs on every INSERT/UPDATE/DELETE
   - Consider disabling trigger during bulk operations

## 🔐 Security Notes

1. **RLS Enabled by Default**
   - All new tables have RLS enabled
   - Policies enforce organization-level isolation

2. **Service Role Required**
   - Migrations must use service role key
   - Never use anon key for DDL operations

3. **Audit Trail Immutability**
   - `task_progress` table is designed to be immutable
   - Only admins can modify (exceptional cases)

4. **Function Security**
   - Helper functions use `SECURITY DEFINER`
   - They run with elevated privileges
   - Review logic carefully before deployment

## 📚 Related Documentation

- [Task Quantity Expansion Design](../task-quantity-expansion-design.md)
- [Firebase/Firestore Migrations README](../../firebase/migrations/README.md)
- [Blueprint Event Bus Integration](../blueprint-event-bus-integration.md)

## 🆘 Support

If you encounter issues:

1. **Check Logs**
   - Firebase/Firestore Dashboard → Database → Logs
   - Look for error messages

2. **Review Documentation**
   - Read the design document
   - Check Firebase/Firestore docs for RLS troubleshooting

3. **Test Locally**
   - Use local Firebase/Firestore instance
   - Test migrations before applying to production

4. **Contact Team**
   - Open an issue in the repository
   - Provide error messages and steps to reproduce

---

**Last Updated:** 2025-12-12  
**Version:** 1.0.0  
**Author:** GigHub Development Team  
**Status:** Ready for Production
