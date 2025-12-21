# SETC-040: Defect Service Expansion Planning

> **任務 ID**: SETC-040  
> **任務名稱**: Defect Service Expansion Planning  
> **優先級**: P1 (Important)  
> **預估工時**: 1 天  
> **依賴**: SETC-035 (Warranty Defect Management)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失管理服務擴展規劃

### 背景 / 目的
規劃 Defect Management 服務擴展，定義與 QA Module 和 Issue Module 的整合方案。根據 SETC.md：QC 不通過 → 自動建立缺失單 → 缺失整改 → 缺失複驗。

### 需求說明
1. 分析現有 QA Module 缺失功能
2. 設計缺失擴展架構
3. 定義與 Issue Module 整合方案
4. 規劃嚴重缺失處理流程

### In Scope / Out of Scope

#### ✅ In Scope
- 架構設計文檔
- 整合方案設計
- API 契約定義
- 資料模型評估

#### ❌ Out of Scope
- 實際程式碼實作
- UI 元件

### 功能行為
提供缺失管理擴展規劃，作為後續開發的藍圖。

### 資料 / API

#### 缺失擴展架構

```
現有 QA Module 缺失功能:
├── QCDefect (品檢缺失)
│   ├── 從 QC 檢查發現
│   ├── 需要整改
│   └── 需要複驗

擴展後缺失體系:
├── QCDefect (品檢缺失)
│   ├── 來源: QC 檢查
│   ├── 生命週期: 發現 → 整改 → 複驗 → 結案
│   └── 嚴重缺失 → 自動建立 Issue
│
├── WarrantyDefect (保固缺失) - 已在 Warranty Module
│   ├── 來源: 保固期通報
│   ├── 生命週期: 通報 → 確認 → 維修 → 驗收 → 結案
│   └── 嚴重缺失 → 自動建立 Issue
│
└── AcceptanceDefect (驗收缺失)
    ├── 來源: 驗收檢查
    ├── 生命週期: 發現 → 整改 → 複驗 → 結案
    └── 可能導致驗收不通過
```

#### 整合介面

```typescript
/**
 * 缺失管理統一介面
 */
export interface IDefectManagement {
  // 建立缺失
  createDefect(data: CreateDefectDto): Promise<Defect>;
  
  // 更新缺失
  updateDefect(id: string, data: UpdateDefectDto): Promise<Defect>;
  
  // 狀態變更
  changeStatus(id: string, newStatus: DefectStatus): Promise<Defect>;
  
  // 指派責任人
  assignResponsible(id: string, userId: string): Promise<Defect>;
  
  // 嚴重缺失自動建立 Issue
  autoCreateIssue(defectId: string): Promise<Issue>;
  
  // 結案
  closeDefect(id: string, resolution: DefectResolution): Promise<Defect>;
}

/**
 * 與 Issue Module 整合
 */
export interface DefectToIssueMapping {
  // 嚴重缺失自動建立 Issue
  autoCreate: boolean;
  
  // Issue 類型映射
  issueType: 'quality_issue' | 'warranty_issue';
  
  // 雙向關聯
  bidirectionalLink: boolean;
  
  // 狀態同步
  statusSync: boolean;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/`
- Issue Module 整合

### 驗收條件
1. ✅ 架構設計完成
2. ✅ 整合方案明確
3. ✅ API 契約定義

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢品質管理與缺失處理最佳實踐

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **現有缺失功能評估**
   - QA Module 缺失
   - Warranty Module 缺失
   - 共同點與差異

2. **整合策略**
   - 統一介面 vs 獨立實作
   - 共用服務 vs 模組內服務

3. **Issue 整合**
   - 自動建立條件
   - 雙向狀態同步

### 步驟 3: Software Planning Tool

**開發計畫**:
```
SETC-040: 規劃 (1 day)
SETC-041: 生命週期服務 (2 days)
SETC-042: 解決服務 (2 days)
SETC-043: 複驗服務 (2 days)
SETC-044: Issue 整合 (2 days)
SETC-045: 測試整合 (1 day)
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `docs/discussions/SETC-040-defect-service-expansion.md` (本文件)

---

## ✅ 檢查清單

### 文檔檢查
- [ ] 架構設計完整
- [ ] 整合方案清楚
- [ ] 後續任務規劃
