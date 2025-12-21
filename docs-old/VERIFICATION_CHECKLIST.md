# Contract Module Fixes - Verification Checklist

## ✅ Pre-deployment Verification

### 1. Build Verification
- [x] `npm run build` completes successfully
- [x] No TypeScript compilation errors
- [x] No Angular template errors
- [x] Bundle size within acceptable range (warning about 1.64 MB excess is pre-existing)

### 2. Code Quality Checks
- [x] No `effect()` calls in `ngOnInit()` lifecycle hooks
- [x] All `ContractFacade` usage includes proper initialization
- [x] Firebase service injected where needed for user context
- [x] Signal patterns follow Angular 20 best practices

### 3. Affected Components Verification

#### Header Components (Notifications)
- [x] `notify.component.ts` - effect() moved to constructor
- [x] `task.component.ts` - effect() moved to constructor
- **Expected**: No NG0203 errors in console when viewing notifications

#### Contract Module Components
- [x] `contract-module-view-refactored.component.ts` - Facade initialized with blueprintId and userId
- [x] `contract-edit-modal.component.ts` - Facade initialized before operations
- [x] `contract-creation-wizard.component.ts` - Uses pre-initialized facade (via parent component)
- **Expected**: No "Blueprint ID not set" errors

## 🧪 Manual Testing Guide

### Test Suite 1: Notifications (NG0203 Fix)

**Test Case 1.1: View Notifications**
```
Steps:
1. Login to application
2. Navigate to any page
3. Click on notification bell icon (header)
4. Open browser console

Expected:
- ✅ Notification dropdown opens without errors
- ✅ No NG0203 errors in console
- ✅ Notifications load properly

Actual Result: _____________________
```

**Test Case 1.2: View Tasks**
```
Steps:
1. Login to application
2. Click on tasks bell icon (header)
3. Open browser console

Expected:
- ✅ Tasks dropdown opens without errors
- ✅ No NG0203 errors in console
- ✅ Tasks load properly

Actual Result: _____________________
```

### Test Suite 2: Contract Listing (Facade Initialization)

**Test Case 2.1: Load Contract List**
```
Steps:
1. Login to application
2. Navigate to a blueprint detail page
3. Click on "合約" (Contract) tab
4. Open browser console

Expected:
- ✅ Contract list loads successfully
- ✅ No "Blueprint ID not set" errors
- ✅ Statistics display correctly
- ✅ Loading indicator shows then hides

Actual Result: _____________________
```

**Test Case 2.2: Filter Contracts**
```
Steps:
1. On contract list page
2. Click filter button
3. Apply status filter
4. Check console

Expected:
- ✅ Filtered contracts display
- ✅ No facade errors
- ✅ Count updates correctly

Actual Result: _____________________
```

### Test Suite 3: Contract Creation (Modal Initialization)

**Test Case 3.1: Quick Create Contract**
```
Steps:
1. On contract list page
2. Click "快速新增合約" button
3. Fill in required fields:
   - Title: "測試合約"
   - Owner: "測試業主"
   - Contractor: "測試承包商"
   - Amount: 1000000
   - Start Date: Today
   - End Date: Today + 30 days
4. Click "建立" button
5. Check console

Expected:
- ✅ Modal opens without errors
- ✅ Form validation works
- ✅ Submit succeeds
- ✅ Success message shows
- ✅ List refreshes with new contract
- ✅ No facade initialization errors

Actual Result: _____________________
```

**Test Case 3.2: Creation Wizard**
```
Steps:
1. On contract list page
2. Click main "新增合約" button
3. Fill in wizard steps
4. Complete creation
5. Check console

Expected:
- ✅ Wizard opens without errors
- ✅ All steps navigate correctly
- ✅ Contract creates successfully
- ✅ No facade errors

Actual Result: _____________________
```

### Test Suite 4: Contract Editing

**Test Case 4.1: Edit Existing Contract**
```
Steps:
1. On contract list page
2. Click edit icon on a contract
3. Modify title field
4. Click "更新" button
5. Check console

Expected:
- ✅ Edit modal opens with pre-filled data
- ✅ Form validation works
- ✅ Update succeeds
- ✅ Success message shows
- ✅ List refreshes with updated data
- ✅ No facade errors

Actual Result: _____________________
```

**Test Case 4.2: View Contract Details**
```
Steps:
1. On contract list page
2. Click view icon on a contract
3. Check drawer content
4. Check console

Expected:
- ✅ Drawer opens with contract details
- ✅ All information displays correctly
- ✅ No errors in console

Actual Result: _____________________
```

### Test Suite 5: Edge Cases

**Test Case 5.1: Switch Between Blueprints**
```
Steps:
1. View contract list for Blueprint A
2. Navigate to Blueprint B
3. Click contract tab
4. Check console

Expected:
- ✅ Facade re-initializes for new blueprint
- ✅ Contracts for Blueprint B load
- ✅ No stale data from Blueprint A
- ✅ No initialization errors

Actual Result: _____________________
```

**Test Case 5.2: Rapid Navigation**
```
Steps:
1. Quickly switch between tabs
2. Return to contract tab multiple times
3. Check console

Expected:
- ✅ No race conditions
- ✅ Facade handles rapid re-initialization
- ✅ Data loads correctly each time

Actual Result: _____________________
```

## 🔍 Console Error Patterns to Watch For

### Should NOT appear after fixes:
- ❌ `ERROR RuntimeError: NG0203`
- ❌ `Effect() can only be used within an injection context`
- ❌ `[ContractFacade] Blueprint ID not set`
- ❌ `Call initialize() first`

### May still appear (warnings, not errors):
- ⚠️ `Calling Firebase APIs outside of an Injection context` (from blueprint.repository.ts)
  - This is a warning, not an error
  - Does not break functionality
  - Can be addressed in future optimization

### Expected to appear (normal operation):
- ℹ️ `[ContractFacade] Initializing`
- ℹ️ `[ContractFacade] Loading contracts`
- ℹ️ `[ContractFacade] Contracts loaded`
- ℹ️ `[ContractFacade] Contract created successfully`

## 📝 Test Results Summary

**Date Tested**: _____________________
**Tester**: _____________________
**Build Version**: _____________________

### Results Overview
- Total Test Cases: 12
- Passed: _____
- Failed: _____
- Blocked: _____

### Critical Issues Found
_____________________
_____________________
_____________________

### Notes
_____________________
_____________________
_____________________

## ✅ Sign-off

- [ ] All critical test cases passed
- [ ] No NG0203 errors observed
- [ ] No facade initialization errors observed
- [ ] Contract CRUD operations work correctly
- [ ] Ready for deployment

**Approved By**: _____________________
**Date**: _____________________
