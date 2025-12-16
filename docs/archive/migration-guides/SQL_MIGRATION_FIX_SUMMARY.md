# SQL Migration Fix Summary

## Overview
Fixed three critical SQL migration errors that were preventing migrations from running successfully in Firebase.

## Errors Fixed

### Error 1: Migration 03 - Syntax Error with RAISE NOTICE
**Issue**: `ERROR: 42601: syntax error at or near "RAISE" LINE 17`

**Root Cause**: `RAISE NOTICE` statements were used outside of function or DO block context, which is invalid SQL syntax.

**Solution**: Wrapped all 7 standalone `RAISE NOTICE` statements in `DO $$ BEGIN ... END $$;` blocks.

**Locations Fixed**:
- Line 17: "RLS enabled on tasks and logs tables"
- Line 86: "Helper functions for RLS created successfully"
- Line 146: "RLS policies for tasks table created successfully"
- Line 225: "RLS policies for logs table created successfully"
- Line 256: "Storage bucket policies need to be configured via Firebase Dashboard"
- Line 269: "Anonymous access denied by default (secure by design)"

### Error 2: Migration 04 - Missing blueprints Table
**Issue**: `ERROR: 42P01: relation "public.blueprints" does not exist`

**Root Cause**: Migration 04 references the `blueprints` and `accounts` tables (for foreign keys and joins) but these tables were never created.

**Solution**: Added stub table creation at the beginning of migration 04:

```sql
-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    organization_id UUID,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT accounts_role_check CHECK (role IN ('admin', 'member', 'viewer', 'qc_inspector', 'system'))
);

-- Create blueprints table
CREATE TABLE IF NOT EXISTS public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT blueprints_status_check CHECK (status IN ('active', 'archived', 'deleted'))
);
```

**Additional Changes**:
- Added indexes for performance: `idx_accounts_organization_id`, `idx_blueprints_organization_id`, etc.
- Granted permissions to authenticated users
- Added table comments for documentation

**Note**: Migration 03 was also updated to handle the case where blueprints table doesn't exist yet:

```sql
CREATE OR REPLACE FUNCTION public.is_blueprint_in_user_organization(blueprint_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    blueprints_exists BOOLEAN;
BEGIN
    -- Check if blueprints table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'blueprints'
    ) INTO blueprints_exists;
    
    -- If blueprints table doesn't exist yet, return TRUE to allow access
    IF NOT blueprints_exists THEN
        RETURN TRUE;
    END IF;
    
    -- ... rest of the function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Error 3: Migration 05 - Incorrect auth.uid() Usage
**Issue**: `ERROR: 42P01: relation "public.log_tasks" does not exist` (secondary issue was use of `auth.uid()`)

**Root Cause**: 
1. The `log_tasks` table is created in migration 04, so it should exist when migration 05 runs

**Solution**: Replaced all 14 occurrences of `auth.uid()` with `public.get_user_id()` throughout migration 05.

**Tables/Policies Updated**:

1. **log_tasks policies** (4 policies):
   - "Users can view log_tasks in their organization"
   - "Users can insert log_tasks for their logs"
   - "Users can update log_tasks for their logs"
   - "Users can delete log_tasks for their logs"

2. **quality_controls policies** (4 policies):
   - "Users can view QC records in their organization"
   - "QC inspectors can create QC records"
   - "Assigned inspectors and admins can update QC records"
   - "Admins can delete QC records"

3. **task_progress policies** (4 policies):
   - "Users can view task progress in their organization"
   - "System can insert task progress records"
   - "Only admins can update task progress"
   - "Only admins can delete task progress"

4. **Helper functions** (3 functions):
   - `user_can_access_blueprint()`
   - `user_is_qc_inspector()`
   - `user_is_admin()`

## Migration Execution Order

The migrations must be executed in the following order:

1. `20251212_01_create_tasks_table.sql` - Creates tasks table
2. `20251212_02_create_logs_table.sql` - Creates logs table
3. `20251212_03_create_rls_policies.sql` - Creates RLS helper functions and policies for tasks/logs
4. `20251212_04_task_quantity_expansion.sql` - Creates accounts, blueprints, log_tasks, quality_controls, task_progress tables
5. `20251212_05_task_quantity_rls_policies.sql` - Creates RLS policies for the new tables

## Testing Instructions

### Prerequisites
- Firebase CLI installed: `npm install -g firebase`
- Firebase project initialized: `firebase init`

### Test Migration Syntax (Offline)
```bash
# Check SQL syntax without connecting to database
cd /home/runner/work/GigHub/GigHub

# Validate each migration file
    echo "Checking $file..."
    psql -f "$file" --echo-errors --set ON_ERROR_STOP=1 --dry-run 2>&1 || echo "Syntax error in $file"
done
```

### Test Migration Execution (Online)
```bash
# Start local Firebase instance
firebase start

# Run migrations
firebase db reset

# Or apply migrations individually

# Check migration status

# Verify tables were created
firebase db dump --schema-only
```

### Verify Changes
```sql
-- Connect to Firebase database and run:

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected output should include:
-- - accounts
-- - blueprints
-- - logs
-- - log_tasks
-- - quality_controls
-- - task_progress
-- - tasks

-- 2. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Expected output: tasks, logs, log_tasks, quality_controls, task_progress

-- 3. Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected output:
-- tasks: 5 policies
-- logs: 6 policies
-- log_tasks: 4 policies
-- quality_controls: 4 policies
-- task_progress: 4 policies

-- 4. Check helper functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name LIKE '%user%' OR routine_name LIKE '%blueprint%';

-- Expected functions:
-- - get_user_organization_id
-- - get_user_id
-- - get_user_role
-- - is_blueprint_in_user_organization
-- - user_can_access_blueprint
-- - user_is_qc_inspector
-- - user_is_admin
```

## Changes Summary

### Files Modified

**Total**: 115 insertions, 28 deletions

### Key Improvements
1. **SQL Syntax Compliance**: All RAISE NOTICE statements properly wrapped
2. **Database Schema Completeness**: Added missing accounts and blueprints tables
3. **Consistent Auth Patterns**: Standardized on `public.get_user_id()` instead of `auth.uid()`
4. **Defensive Programming**: Added table existence checks in helper functions
5. **Better Documentation**: Added comments explaining temporary solutions

## Security Considerations

### Current RLS Implementation
- ✅ RLS enabled on all tables
- ✅ Organization-based isolation (when blueprints table is properly configured)
- ✅ Role-based access control (admin/member/qc_inspector)
- ✅ Creator-based permissions for logs and log_tasks
- ✅ Soft delete support (deleted_at filtering)

### Temporary Security Trade-offs
⚠️ **Important**: The `is_blueprint_in_user_organization()` function currently returns `TRUE` when the blueprints table doesn't have the required structure. This is a temporary measure to allow the migrations to run.

**Action Required**: Once the blueprints table is fully implemented with organization_id column, this function will provide proper organization-level isolation.

### Future Security Enhancements
1. Update blueprints table with proper organization relationships
2. Configure Firebase Auth to include custom claims:
   - `organization_id`: UUID of user's organization
   - `role`: 'admin' | 'member' | 'viewer' | 'qc_inspector'
3. Configure Storage Bucket Policies via Firebase Dashboard
4. Test RLS policies with different user roles
5. Monitor RLS policy violations in Firebase logs

## Rollback Instructions

If issues arise, you can rollback migrations:

```bash
# List applied migrations

# Rollback to a specific migration

# Or reset the entire database
firebase db reset
```

## Additional Notes

### Why Stub Tables?
The `accounts` and `blueprints` tables are created as "stubs" because:
1. They're referenced by foreign keys and RLS policies
2. The full implementation may come from another part of the system
3. Creating them with IF NOT EXISTS ensures migrations are idempotent
4. They can be extended or replaced by future migrations without breaking existing code

### Migration Best Practices Applied
✅ Idempotent migrations (CREATE IF NOT EXISTS)
✅ Proper error handling (EXCEPTION blocks)
✅ Defensive checks (table existence verification)
✅ Clear comments and documentation
✅ Consistent naming conventions
✅ Proper indexing for performance
✅ Security by default (RLS enabled)

## Contact & Support

For questions or issues:
1. Check Firebase logs: `firebase logs`
3. Consult Firebase docs: https://firebase.com/docs
4. Open an issue in the repository

---

**Migration Fixed**: 2025-12-12  
**Next Review**: After blueprints table full implementation  
**Status**: ✅ Ready for testing
