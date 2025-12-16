# SETC Implementation 001: Issue Module - Project Setup & Structure

> **Task ID**: SETC-001  
> **Priority**: P0 (Blocker for all subsequent tasks)  
> **Estimated Time**: 4 hours  
> **Dependencies**: None  
> **Status**: 待執行 (Pending)

---

## 📋 Task Overview

建立 Issue Module 的基礎目錄結構、模組定義、元資料配置，並設定 Firestore schema。

---

## 🎯 Objectives

1. 建立 Issue Module 完整目錄結構
2. 配置模組元資料 (module.metadata.ts)
3. 建立 Firestore Collection schema
4. 設定模組匯出 (index.ts)
5. 註冊模組到 Blueprint Container

---

## 📁 File Structure to Create

```
src/app/core/blueprint/modules/implementations/issue/
├── issue.module.ts                     # 模組主檔案
├── module.metadata.ts                  # 模組元資料
├── index.ts                            # 統一匯出
├── README.md                           # 模組說明文件
│
├── models/                             # 資料模型
│   └── index.ts
│
├── services/                           # 業務服務
│   └── index.ts
│
├── repositories/                       # 資料存取
│   └── index.ts
│
├── config/                             # 配置
│   └── index.ts
│
├── exports/                            # 公開 API
│   └── index.ts
│
└── views/                              # UI 元件（未來）
    └── .gitkeep
```

---

## 🔧 Implementation Steps

### Step 1: 建立目錄結構

```bash
# 在專案根目錄執行
cd src/app/core/blueprint/modules/implementations
mkdir -p issue/{models,services,repositories,config,exports,views}
touch issue/{issue.module.ts,module.metadata.ts,index.ts,README.md}
touch issue/models/index.ts
touch issue/services/index.ts
touch issue/repositories/index.ts
touch issue/config/index.ts
touch issue/exports/index.ts
touch issue/views/.gitkeep
```

### Step 2: 建立模組元資料 (module.metadata.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/module.metadata.ts

import { ModuleMetadata } from '../../base/module-metadata.interface';

export const ISSUE_MODULE_METADATA: ModuleMetadata = {
  id: 'issue',
  moduleType: 'issue',
  name: '問題管理',
  nameEn: 'Issue Management',
  version: '1.0.0',
  description: '獨立的問題單管理模組，支援手動建立與多來源自動生成',
  descriptionEn: 'Independent issue management module with manual creation and multi-source auto-generation',
  dependencies: [], // 無依賴，完全獨立
  defaultOrder: 8,
  icon: 'exclamation-circle',
  color: '#fa8c16',
  category: 'quality',
  tags: ['issue', 'problem', 'tracking', 'resolution', 'quality'],
  author: 'GigHub Development Team',
  license: 'Proprietary',
  enabled: true,
  isCore: true
} as const;
```

### Step 3: 建立模組主檔案 (issue.module.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/issue.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISSUE_MODULE_METADATA } from './module.metadata';

/**
 * Issue Module
 * 
 * 獨立的問題追蹤管理模組
 * 
 * 特性:
 * - 支援手動建立問題單
 * - 支援多來源自動生成 (Acceptance, QC, Warranty, Safety)
 * - 完整生命週期管理 (open → in_progress → resolved → verified → closed)
 * - 統一的問題追蹤與報表
 * 
 * @module IssueModule
 * @version 1.0.0
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    // Services will be added in subsequent tasks
  ]
})
export class IssueModule {
  static readonly metadata = ISSUE_MODULE_METADATA;
  
  constructor() {
    console.log(`[${ISSUE_MODULE_METADATA.name}] Module initialized`);
  }
}
```

### Step 4: 建立統一匯出 (index.ts)

```typescript
// src/app/core/blueprint/modules/implementations/issue/index.ts

export * from './issue.module';
export * from './module.metadata';
export * from './models';
export * from './services';
export * from './repositories';
export * from './config';
export * from './exports';
```

### Step 5: 建立 README.md

```markdown
# Issue Module (問題管理模組)

## 概述

Issue Module 是一個獨立的問題追蹤管理模組，支援手動建立與多來源自動生成。

## 核心特性

- ✅ **手動建立**: 使用者可直接建立問題單
- ✅ **多來源自動生成**: 從 Acceptance、QC、Warranty、Safety 等模組自動建立
- ✅ **完整生命週期**: open → in_progress → resolved → verified → closed
- ✅ **統一追蹤**: 單一問題管理系統
- ✅ **獨立性**: 無外部模組依賴

## 資料來源 (Issue Source)

- `manual` - 手動建立
- `acceptance` - 驗收失敗自動建立
- `qc` - QC 檢查失敗自動建立
- `warranty` - 保固缺失自動建立
- `safety` - 安全事故自動建立

## 模組架構

```
issue/
├── models/           # 資料模型 (Issue, IssueResolution, IssueVerification)
├── services/         # 業務服務 (5 個核心服務)
├── repositories/     # 資料存取 (Firestore)
├── config/           # 模組配置
├── exports/          # 公開 API
└── views/            # UI 元件 (未來)
```

## 版本

- **Current**: 1.0.0
- **Angular**: 20.x
- **Firebase**: 10.x

## 維護者

GigHub Development Team
```

### Step 6: 建立 Firestore Security Rules (firestore.rules)

```javascript
// firestore.rules (新增 issues collection 規則)

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Issue Collection Rules
    match /issues/{issueId} {
      // 讀取權限: Blueprint 成員可讀
      allow read: if request.auth != null 
                  && exists(/databases/$(database)/documents/blueprints/$(resource.data.blueprintId)/members/$(request.auth.uid));
      
      // 建立權限: Blueprint 成員可建立
      allow create: if request.auth != null
                    && request.resource.data.blueprintId is string
                    && exists(/databases/$(database)/documents/blueprints/$(request.resource.data.blueprintId)/members/$(request.auth.uid))
                    && request.resource.data.source in ['manual', 'acceptance', 'qc', 'warranty', 'safety']
                    && request.resource.data.status == 'open'
                    && request.resource.data.createdBy == request.auth.uid
                    && request.resource.data.createdAt == request.time;
      
      // 更新權限: Blueprint 成員可更新
      allow update: if request.auth != null
                    && exists(/databases/$(database)/documents/blueprints/$(resource.data.blueprintId)/members/$(request.auth.uid))
                    && request.resource.data.blueprintId == resource.data.blueprintId
                    && request.resource.data.source == resource.data.source
                    && request.resource.data.sourceId == resource.data.sourceId
                    && request.resource.data.updatedAt == request.time;
      
      // 刪除權限: 僅建立者或管理員可刪除
      allow delete: if request.auth != null
                    && (resource.data.createdBy == request.auth.uid
                        || get(/databases/$(database)/documents/blueprints/$(resource.data.blueprintId)/members/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Step 7: 建立 Firestore Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "issues",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "issues",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "issues",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "issues",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## ✅ Acceptance Criteria

- [ ] Issue Module 目錄結構已建立
- [ ] module.metadata.ts 已配置且包含所有必要欄位
- [ ] issue.module.ts 已建立並可編譯
- [ ] README.md 已撰寫且包含模組說明
- [ ] Firestore security rules 已新增 issues collection 規則
- [ ] Firestore indexes 已配置
- [ ] 所有 index.ts 檔案已建立
- [ ] 執行 `ng build` 無錯誤
- [ ] 執行 `npm run lint` 無錯誤

---

## 🧪 Testing

### Unit Tests

```typescript
// issue.module.spec.ts
import { TestBed } from '@angular/core/testing';
import { IssueModule } from './issue.module';
import { ISSUE_MODULE_METADATA } from './module.metadata';

describe('IssueModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IssueModule]
    });
  });

  it('should create', () => {
    expect(IssueModule).toBeDefined();
  });

  it('should have correct metadata', () => {
    expect(IssueModule.metadata).toEqual(ISSUE_MODULE_METADATA);
    expect(IssueModule.metadata.id).toBe('issue');
    expect(IssueModule.metadata.name).toBe('問題管理');
  });

  it('should have no dependencies', () => {
    expect(IssueModule.metadata.dependencies).toEqual([]);
  });
});
```

### Manual Testing

```bash
# 1. 編譯測試
ng build --configuration development

# 2. Lint 測試
npm run lint

# 3. 檢查 Firestore rules
firebase deploy --only firestore:rules --project=your-project-id

# 4. 檢查 Firestore indexes
firebase deploy --only firestore:indexes --project=your-project-id
```

---

## 📝 Notes

- 此任務僅建立模組骨架，不包含實際業務邏輯
- Services、Repositories 在後續任務中實現
- UI 元件在後續任務中實現
- 確保 Firestore rules 與 indexes 正確部署

---

## 🔗 Related Tasks

- **Next**: SETC-002 (Data Models Implementation)
- **Depends On**: None
- **Blocks**: SETC-002, SETC-003, SETC-004, SETC-005

---

**Created**: 2025-12-15  
**Updated**: 2025-12-15  
**Author**: GitHub Copilot  
**Reviewer**: TBD
