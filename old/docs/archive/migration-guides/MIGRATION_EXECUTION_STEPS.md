# 🚀 Migration Execution Steps for Task Quantity Expansion

## ⚡ Quick Start (Recommended)

#

## 📋 What Gets Created

When you run these migrations, the following will be created:

### Tables
- ✅ `log_tasks` - Junction table for task-log relationships (8 columns)
- ✅ `quality_controls` - QC workflow management (19 columns)
- ✅ `task_progress` - Audit trail for quantity changes (12 columns)
- ✅ `tasks` - Extended with 6 new quantity-related columns

### Database Objects
- ✅ 5 Helper functions (calculate quantities, security checks)
- ✅ 1 Trigger (auto-update task quantities)
- ✅ 12+ RLS policies (security and access control)
- ✅ 16+ Indexes (performance optimization)

### Security
- ✅ Row Level Security (RLS) enabled on all new tables
- ✅ Organization-level data isolation
- ✅ Role-based access control (admin, QC inspector, users)

---

## ✅ Verification Checklist

After applying migrations, verify everything is working:

```sql
-- 1. Check new tables exist (should return 3)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('log_tasks', 'quality_controls', 'task_progress');

-- 2. Check tasks table extended (should return 5+)
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name LIKE '%quantity%';

-- 3. Check RLS enabled (should return 3 with 't')
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('log_tasks', 'quality_controls', 'task_progress');

-- 4. Check functions created (should return 5)
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'calculate_task_completed_quantity',
  'update_task_completed_quantity',
  'user_can_access_blueprint',
  'user_is_qc_inspector',
  'user_is_admin'
);

-- 5. Check trigger exists (should return 3 - one for each: INSERT, UPDATE, DELETE)
SELECT COUNT(*) FROM information_schema.triggers
WHERE event_object_table = 'log_tasks'
AND trigger_name = 'trigger_update_task_quantity';
```

**All queries should return expected counts. If yes: ✅ Migration successful!**

---

## 🔍 Troubleshooting

### Error: "relation already exists"
```sql
-- Clean up and retry
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;
-- Then re-run the migration
```

### Error: "permission denied"
- **Solution:** Use Firebase Dashboard SQL Editor (automatically uses service role)
- Or ensure you're using service role key (not anon key)

### Error: "foreign key constraint violation"
```sql
-- Check if base tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs', 'blueprints', 'accounts');
-- Should return 4 rows. If not, run base migrations first (20251212_01, 02, 03)
```

---

## 🔄 Rollback (If Needed)

If you need to undo these migrations:

```sql
-- Copy and run this in SQL Editor
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

## 📚 Documentation References

- **Detailed Guide:** `docs/database/MIGRATION_GUIDE.md` (13.6 KB - comprehensive guide)
- **Quick Reference:** `docs/database/QUICK_MIGRATION_REFERENCE.md` (4.2 KB - quick tips)
- **Design Document:** `docs/task-quantity-expansion-design.md` (feature overview)

---

## 🎯 Success Indicators

You'll know the migration was successful when:

✅ SQL Editor shows success messages with NOTICE lines
✅ All verification queries return expected counts
✅ New tables visible in Firebase Dashboard → Database → Tables
✅ RLS policies visible in Database → Policies
✅ Functions visible in Database → Functions
✅ No error messages in the output

---

## 💡 Tips

1. **Use Dashboard for first-time execution** - It's the easiest and safest method
2. **Run during off-peak hours** - Minimize impact on users
3. **Take a database backup first** - Safety net in case of issues
4. **Test verification queries** - Ensure everything is working
5. **Monitor database logs** - Check for any unexpected errors

---

## 🆘 Need Help?

1. **Check the logs:** Firebase Dashboard → Database → Logs
2. **Review documentation:** See references above
3. **Test locally first:** Use local Firebase instance
4. **Open an issue:** GitHub repository with error details

---

**Ready to execute?** Choose Option 1 (Dashboard) for the quickest path!

**Total execution time:** ~5 minutes  
**Complexity:** Low  
**Risk level:** Low (reversible with rollback script)

---

**Last Updated:** 2025-12-12  
**Version:** 1.0.0  
**Author:** GigHub Development Team
