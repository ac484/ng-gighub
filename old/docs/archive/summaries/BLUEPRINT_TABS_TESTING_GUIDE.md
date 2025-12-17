# Blueprint Details Tabs - Testing Guide

## Overview
This guide provides step-by-step testing procedures for verifying the fixes to Blueprint Details tabs CRUD issues.

**Issues Fixed**:
1. ✅ 流程/品質/驗收/財務/安全 tabs - Empty display issue
2. ✅ 雲端 tab - Load failure
3. ✅ 施工日誌 - "Operation failed" error

**Changes Made**: 33 files modified across 4 phases

---

## Prerequisites

### 1. Development Environment
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Server should be running at http://localhost:4200
```

### 2. Test Data Setup
- At least 1 Blueprint must exist in Firestore
- Blueprint should have a valid `id` and `enabledModules` array
- Test user must be authenticated

### 3. Browser Console
- Open Browser DevTools (F12)
- Keep Console tab visible to monitor for errors

---

## Test Cases

### Test Group 1: Module Tabs Data Loading (Phase 1 & 2)

#### TC1.1: Workflow Tab (流程)
**Purpose**: Verify workflow data loads correctly

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "流程" tab
3. Observe the Statistics Card
4. Check Sub-tabs: 自訂流程, 狀態機, 自動化觸發, 審批流程

**Expected Results**:
- ✅ Statistics show correct counts (can be 0 if no data)
- ✅ Each sub-tab displays either:
  - Data table with columns if data exists
  - "暫無XXX" empty state if no data
- ✅ NO "findAll() is deprecated" warning in Console
- ✅ Loading spinner appears briefly during data fetch

**Console Verification**:
```
[WorkflowRepository] findByBlueprintId success
[CustomWorkflowService] Loaded X workflows
```

---

#### TC1.2: QA Tab (品質)
**Purpose**: Verify QA data loads correctly

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "品質" tab
3. Observe Statistics Card
4. Check Sub-tabs: 檢查表, 缺失管理, 現場巡檢, 品質報告

**Expected Results**:
- ✅ Statistics show correct counts
- ✅ Each sub-tab displays data or empty state
- ✅ NO deprecated warnings in Console

---

#### TC1.3: Acceptance Tab (驗收)
**Purpose**: Verify acceptance data loads correctly

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "驗收" tab
3. Check Sub-tabs: 驗收申請, 審核, 初驗, 複驗, 驗收結論

**Expected Results**:
- ✅ All sub-tabs display correctly
- ✅ Data or empty state shown appropriately

---

#### TC1.4: Finance Tab (財務)
**Purpose**: Verify finance data loads correctly

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "財務" tab
3. Check Sub-tabs: 成本管理, 請款, 付款, 預算, 財務報表

**Expected Results**:
- ✅ All financial data displays correctly
- ✅ No errors in Console

---

#### TC1.5: Safety Tab (安全)
**Purpose**: Verify safety data loads correctly

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "安全" tab
3. Check Sub-tabs: 安全巡檢, 風險評估, 事故通報, 安全訓練

**Expected Results**:
- ✅ Safety statistics display correctly
- ✅ All sub-tabs functional

---

### Test Group 2: Cloud Module (Phase 3)

#### TC2.1: Cloud Tab Data Loading
**Purpose**: Verify cloud tab loads without error

**Steps**:
1. Navigate to `/blueprint/{blueprintId}/detail`
2. Click on "雲端" tab
3. Observe Statistics Card (容量, 檔案數, 已同步, 備份數)
4. Check progress bar for storage usage

**Expected Results**:
- ✅ NO "載入雲端資料失敗" error
- ✅ Statistics display (even if 0)
- ✅ Storage usage progress bar shows
- ✅ Console shows: `[CloudRepository] Loaded X files`

**Console Verification**:
```
[CloudStorageService] Loaded files for blueprint: {blueprintId}
[CloudRepository] Loaded X files
[CloudRepository] Loaded X backups
```

---

#### TC2.2: Cloud Files Tab
**Purpose**: Verify files list displays

**Steps**:
1. In "雲端" tab, click "雲端檔案" sub-tab
2. If no files: Check for empty state with "上傳檔案" button
3. If files exist: Check table displays file list

**Expected Results**:
- ✅ Files listed in descending order by upload date (newest first)
- ✅ Table shows: 檔案名稱, 大小, 類型, 狀態, 上傳時間, 操作
- ✅ Empty state shows if no files

---

#### TC2.3: Cloud File Upload
**Purpose**: Verify file upload works

**Steps**:
1. Click "上傳檔案" button
2. Select a small image file (< 5MB)
3. Wait for upload to complete
4. Check file appears in list

**Expected Results**:
- ✅ Success message: "檔案 {filename} 上傳成功"
- ✅ File appears at top of list (newest first)
- ✅ File status shows "已同步"

---

#### TC2.4: Cloud Backups Tab
**Purpose**: Verify backups list displays

**Steps**:
1. In "雲端" tab, click "備份管理" sub-tab
2. Check backup list or empty state

**Expected Results**:
- ✅ Backups listed in descending order by creation date
- ✅ Table shows: 備份名稱, 大小, 檔案數, 建立時間, 操作
- ✅ "建立備份" button visible

---

### Test Group 3: Construction Log (Phase 4)

#### TC3.1: Construction Log Creation - Success Case
**Purpose**: Verify log creation works

**Steps**:
1. Navigate to "施工日誌" tab
2. Click "新增日誌" button
3. Fill in form:
   - 日期: Select today's date
   - 標題: "測試日誌"
   - 描述: "這是測試"
   - 工時: 8
   - 工人數: 5
   - 天氣: 晴
   - 溫度: 25
4. Click "新增" button

**Expected Results**:
- ✅ Modal closes automatically
- ✅ Success message: "日誌新增成功"
- ✅ New log appears at top of table
- ✅ NO "Operation failed" error

**Console Verification**:
```
[ConstructionLogModal] Creating log...
[ConstructionLogStore] Log created: 測試日誌
[AuditLogsService] Recorded audit log
```

---

#### TC3.2: Construction Log Creation - Error Case (No User)
**Purpose**: Verify error handling works

**Steps**:
1. **Simulate logout** (clear localStorage auth tokens)
2. Try to create a log
3. Observe error message

**Expected Results**:
- ✅ Specific error: "無法取得使用者資訊，請重新登入"
- ✅ NOT generic "Operation failed" message
- ✅ Modal remains open
- ✅ User can close modal and re-authenticate

---

#### TC3.3: Construction Log Creation - Missing Required Fields
**Purpose**: Verify form validation

**Steps**:
1. Click "新增日誌"
2. Leave 日期 and 標題 empty
3. Click "新增"

**Expected Results**:
- ✅ Form validation errors display
- ✅ "請選擇日期" error under date field
- ✅ "請輸入標題" error under title field
- ✅ Submit button disabled or form doesn't submit

---

#### TC3.4: Construction Log Update
**Purpose**: Verify log update works

**Steps**:
1. Click "編輯" on an existing log
2. Change the title
3. Click "更新"

**Expected Results**:
- ✅ Success message: "日誌更新成功"
- ✅ Updated data shows in table
- ✅ No errors

---

#### TC3.5: Construction Log Photo Upload
**Purpose**: Verify photo upload works

**Steps**:
1. Click "新增日誌"
2. Fill required fields
3. Drag & drop or select image files (< 5MB each)
4. Verify preview shows
5. Click "新增"

**Expected Results**:
- ✅ Photos preview in upload area
- ✅ Log created successfully
- ✅ Photos associated with log
- ✅ Photo count displayed in table

---

## Error Scenarios Testing

### E1: Network Error
**Setup**: Disable network or block Firestore
**Expected**: Clear error messages, not generic failures

### E2: Permission Error  
**Setup**: Revoke Firestore permissions
**Expected**: "Permission denied" or similar specific error

### E3: Large File Upload (Cloud)
**Setup**: Try uploading file > 5MB
**Expected**: "圖片大小必須小於 5MB" error

---

## Performance Testing

### P1: Load Time
**Acceptance**: Each tab should load data in < 2 seconds

**Test**:
1. Open DevTools Network tab
2. Click each module tab
3. Measure time from click to data display

**Expected Results**:
- ✅ Workflow tab: < 2 seconds
- ✅ QA tab: < 2 seconds
- ✅ Acceptance tab: < 2 seconds
- ✅ Finance tab: < 2 seconds
- ✅ Safety tab: < 2 seconds
- ✅ Cloud tab: < 2 seconds

---

## Console Verification Checklist

### ✅ No Warnings
- [ ] NO "findAll() is deprecated" warnings
- [ ] NO "Cannot read property of undefined" errors
- [ ] NO unhandled promise rejections

### ✅ Correct Logs
- [ ] Services log "Loaded X items"
- [ ] Repositories log "findByBlueprintId success"
- [ ] Error logs show specific error messages

---

## Regression Testing

### R1: Existing Functionality
Verify these still work:
- [ ] Overview tab displays correctly
- [ ] Tasks tab works
- [ ] Members tab works
- [ ] Settings tab works

### R2: Navigation
- [ ] Can switch between tabs without errors
- [ ] Browser back/forward works
- [ ] Direct URL access works

---

## Test Report Template

```markdown
## Test Execution Report

**Date**: {date}
**Tester**: {name}
**Environment**: Development / Staging / Production
**Browser**: Chrome / Firefox / Safari {version}

### Test Results Summary
- Total Test Cases: 20
- Passed: ___
- Failed: ___
- Blocked: ___

### Failed Test Cases
| TC ID | Test Case | Status | Notes |
|-------|-----------|--------|-------|
| TC1.1 | Workflow Tab | ❌ Failed | Error message: ... |

### Issues Found
1. **Issue**: {description}
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: {steps}
   - **Expected**: {expected}
   - **Actual**: {actual}

### Recommendations
- ...

### Sign-off
- [ ] All critical test cases passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for deployment
```

---

## Automated Testing (Future)

### Unit Tests
```bash
yarn test
```

### E2E Tests
```bash
yarn e2e
```

### Lint
```bash
yarn lint
```

---

## Rollback Plan

If issues are found:

1. **Immediate Rollback**:
   ```bash
   git revert HEAD~3..HEAD
   git push origin main
   ```

2. **Verify Original Issue**:
   - Confirm old issues reappear
   - Document any new findings

3. **Create Bug Report**:
   - Include test results
   - Attach console logs
   - Provide screenshots

---

## Support Contact

**For testing questions**:
- GitHub Issues: Create issue with "testing" label
- Team Channel: Post in #testing channel

**For bug reports**:
- GitHub Issues: Create issue with "bug" label
- Include: Browser, OS, Steps, Screenshots, Console logs

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-14  
**Status**: Ready for Testing
