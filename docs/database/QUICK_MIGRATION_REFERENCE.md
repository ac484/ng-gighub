# Quick Migration Reference Card

## 🚀 One-Minute Guide

### Fastest Method: Firebase/Firestore Dashboard

1. **Login:** https://firebase.com/dashboard/project/zecsbstjqjqoytwgjyct
2. **Navigate:** SQL Editor → New query
3. **Copy & Run:**
   - File: `firebase/migrations/20251212_04_task_quantity_expansion.sql`
   - Then: `firebase/migrations/20251212_05_task_quantity_rls_policies.sql`
4. **Verify:** See "Quick Verification" below

---

## 📋 Quick Verification (Copy-Paste)

```sql
-- Check all new tables exist (should return 3 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('log_tasks', 'quality_controls', 'task_progress');

-- Check tasks table extended (should return 5+ columns)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name LIKE '%quantity%';

-- Check RLS enabled (should return 3 rows with 't')
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('log_tasks', 'quality_controls', 'task_progress');

-- All good if these queries return expected results! ✓
```

---

## 🛠️ Alternative: Firebase/Firestore CLI

```bash
# Quick setup
npx firebase login
npx firebase link --project-ref zecsbstjqjqoytwgjyct

# Apply migrations
npx firebase db push

# Or specific files
npx firebase db execute --file firebase/migrations/20251212_04_task_quantity_expansion.sql
npx firebase db execute --file firebase/migrations/20251212_05_task_quantity_rls_policies.sql
```

---

## ⚠️ Troubleshooting Quick Fixes

### Error: "relation already exists"
```sql
-- Clean up and retry
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;
-- Then re-run migration
```

### Error: "permission denied"
- Use service role key (not anon key)
- Or use Firebase/Firestore Dashboard SQL Editor (auto uses service role)

### Error: "foreign key constraint violation"
```sql
-- Check base tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs', 'blueprints', 'accounts');
-- Should return 4 rows
```

---

## 🔄 Quick Rollback

```sql
DROP TRIGGER IF EXISTS trigger_update_task_quantity ON public.log_tasks;
DROP FUNCTION IF EXISTS public.calculate_task_completed_quantity(UUID);
DROP FUNCTION IF EXISTS public.update_task_completed_quantity();
DROP FUNCTION IF EXISTS public.user_can_access_blueprint(UUID);
DROP FUNCTION IF EXISTS public.user_is_qc_inspector();
DROP FUNCTION IF EXISTS public.user_is_admin();
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;
ALTER TABLE public.tasks 
  DROP COLUMN IF EXISTS total_quantity,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS completed_quantity,
  DROP COLUMN IF EXISTS enable_quantity_tracking,
  DROP COLUMN IF EXISTS auto_complete_on_quantity_reached,
  DROP COLUMN IF EXISTS auto_send_to_qc;
```

---

## 📊 What Gets Created

| Type | Count | Names |
|------|-------|-------|
| **New Tables** | 3 | log_tasks, quality_controls, task_progress |
| **Extended Tables** | 1 | tasks (+6 columns) |
| **Functions** | 5 | calculate/update quantity, security helpers |
| **Triggers** | 1 | auto-update task quantities |
| **Indexes** | 16+ | Performance optimization |
| **RLS Policies** | 12+ | Security policies |

---

## 🎯 Success Indicators

✅ **All checks pass:**
- [ ] 3 new tables visible in Firebase/Firestore Dashboard
- [ ] Tasks table has quantity-related columns
- [ ] RLS policies show in Database → Policies
- [ ] Functions visible in Database → Functions
- [ ] No errors in SQL Editor output

✅ **Migration complete message:**
```
NOTICE: Migration 20251212_04_task_quantity_expansion.sql completed successfully
NOTICE: Migration 20251212_05_task_quantity_rls_policies.sql completed successfully
```

---

## 📚 Full Documentation

- **Detailed Guide:** `docs/database/MIGRATION_GUIDE.md`
- **Migration README:** `firebase/migrations/README.md`
- **Design Document:** `docs/task-quantity-expansion-design.md`

---

**Need help?** Check the full Migration Guide or open an issue.
