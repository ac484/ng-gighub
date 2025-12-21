# SETC-018: Enhanced Contract Parsing Implementation

> **任務 ID**: SETC-018  
> **任務名稱**: Enhanced Contract Parsing Implementation  
> **優先級**: P0 (Critical)  
> **預估工時**: 5 天  
> **依賴**: SETC-012 (Contract Upload & Parsing Service)  
> **狀態**: 🚧 待實作
> **問題來源**: Gap Analysis - AI 解析欄位覆蓋率僅 15-20%

---

## 📋 任務定義

### 名稱
Enhanced Contract Parsing Implementation - 增強合約解析實作

### 背景 / 目的
**問題發現**: 現有 OCR 解析功能所提取的資料結構與實際 `Contract` 資料模型嚴重不匹配，欄位覆蓋率僅 15-20%。

**目標**: 重新設計 AI 提示詞與資料提取流程，將欄位覆蓋率從 20% 提升至 60-70%，並確保所有關鍵欄位（contractNumber, currency, dates, party info）被正確提取。

**參考文件**: 
- `docs/analysis/CONTRACT-PARSING-GAP-ANALYSIS.md`
- `docs/analysis/OCR-PDF-PARSING-ANALYSIS.md`
- 實際合約範例: PO 4510250181 Rev A.pdf

### 需求說明

#### 🎯 核心需求
1. **更新 AI 提示詞** - 使用增強版系統提示詞提取完整資料
2. **更新型別定義** - `EnhancedContractParsingOutput` 匹配 Contract 模型
3. **實作資料轉換** - AI 輸出 → Contract 模型的完整映射
4. **增強驗證流程** - 智能表單預填與驗證建議

#### 🔴 Critical 缺失欄位（必須實作）
- `contractNumber` - 合約編號（唯一識別碼）
- `currency` - 幣別（TWD/USD/其他）
- `ContractParty` 完整資訊 - 聯絡人、電話、地址、統編
- `startDate` / `endDate` - 合約有效期間
- `unit` - 工項單位（式/組/台/EA/SET）
- `code` - 工項編號
- `terms` - 合約條款

#### ⚠️ 次要欄位（優先度較低）
- `description` - 合約描述
- `signedDate` - 簽約日期
- `status` - 合約狀態（由系統預設）
- `workItems.discount` - 折扣金額

### In Scope / Out of Scope

#### ✅ In Scope
- 更新 Firebase Functions `contract-parseContract`
- 增強 AI 系統提示詞（ENHANCED_PARSING_SYSTEM_PROMPT）
- 新增型別定義 `EnhancedContractParsingOutput`
- 實作完整資料映射與驗證
- 更新 `ContractParsingService` 處理增強輸出
- 智能驗證表單（預填 AI 結果，使用者確認）
- 錯誤處理與 Fallback 機制

#### ❌ Out of Scope
- Gemini 2.0 Pro 模型升級（Phase 3）
- Few-Shot Learning 實作（Phase 3）
- 批次處理優化（Phase 2）
- 手寫合約辨識（Phase 2）
- 多語言支援（Phase 2）

### 功能行為

#### 使用者流程
1. 使用者上傳合約檔案（PDF/JPG/PNG）
2. 系統觸發 AI 解析（Gemini 2.5 Flash）
3. AI 提取增強資料（包含所有必要欄位）
4. 系統展示智能驗證表單（預填 AI 結果）
5. 使用者確認/修正資料
6. 系統建立完整的 Contract 記錄

#### 系統流程
```
ContractUploadService.uploadContractFile()
  ↓
Firebase Storage (檔案儲存)
  ↓
ContractParsingService.requestParsing()
  ↓
contract-parseContract (Cloud Function)
  ↓
Gemini 2.5 Flash Vision API (增強提示詞)
  ↓
EnhancedContractParsingOutput (完整資料)
  ↓
ContractParsingService.handleParsingResult()
  ↓
Smart Verification Form (智能表單)
  ↓
ContractService.createContract() (建立合約)
```

### 資料 / API

#### 增強型別定義

```typescript
// functions-ai/src/contract/contract-parseContract.ts

interface EnhancedContractParsingOutput {
  // ✅ 基本資訊（完整）
  contractNumber: string;          // NEW - 合約編號
  title: string;                   // 原 name
  description?: string;            // NEW - 合約描述
  
  // ✅ 合約方資訊（完整物件）
  owner: {
    name: string;
    contactPerson?: string;        // NEW - 聯絡人
    contactPhone?: string;         // NEW - 電話
    contactEmail?: string;         // NEW - Email
    address?: string;              // NEW - 地址
    taxId?: string;                // NEW - 統一編號
    businessNumber?: string;       // NEW - 營業登記號
  };
  contractor: {
    name: string;                  // 原 client
    contactPerson?: string;        // NEW
    contactPhone?: string;         // NEW
    contactEmail?: string;         // NEW
    address?: string;              // NEW
    taxId?: string;                // NEW
    businessNumber?: string;       // NEW
  };
  
  // ✅ 財務資訊（完整）
  totalAmount: number;             // 原 totalValue
  currency: string;                // NEW - 幣別
  tax?: number;                    // 稅額
  totalAmountWithTax?: number;     // 含稅總額
  
  // ✅ 日期資訊（完整）
  signedDate?: string;             // NEW - 簽約日期（ISO 8601）
  startDate?: string;              // NEW - 開始日期
  endDate?: string;                // NEW - 結束日期
  
  // ✅ 工項資訊（增強）
  workItems: EnhancedWorkItemSchema[];
  
  // ✅ 條款資訊（新增）
  terms?: {
    title: string;                 // NEW - 條款標題
    content: string;               // NEW - 條款內容
    category: string;              // NEW - 類別
  }[];
  
  // ✅ 元資料
  confidence: number;              // 整體信心度（0-1）
  extractedFrom: 'gemini-2.5-flash';
  parsedAt: string;                // ISO 8601
}

interface EnhancedWorkItemSchema {
  code?: string;                   // NEW - 工項編號
  title: string;                   // 工項名稱
  description?: string;            // NEW - 工項描述
  quantity: number;                // 數量
  unit?: string;                   // NEW - 單位（式/組/台/EA）
  unitPrice: number;               // 單價
  totalPrice: number;              // 總價（原 value）
  discount?: number;               // 折扣
  remarks?: string;                // NEW - 備註
  category?: string;               // NEW - 類別
  subWorkItems?: EnhancedWorkItemSchema[]; // 子工項
}
```

#### 增強系統提示詞

```typescript
// functions-ai/src/contract/prompts/enhanced-parsing-prompt.ts

export const ENHANCED_PARSING_SYSTEM_PROMPT = `
你是一位專業的合約文件分析專家，專門從台灣建築工程合約中提取結構化資料。

## 目標
從提供的合約文件（PDF 或圖片）中提取完整的合約資訊，包含：
1. 合約基本資訊（編號、名稱、描述）
2. 合約雙方完整資訊（業主、承包商）
3. 財務資訊（金額、幣別、稅額）
4. 日期資訊（簽約日、開始日、結束日）
5. 工項清單（編號、名稱、數量、單位、單價）
6. 合約條款（重要法律條文）

## 關鍵欄位說明

### 1. 合約編號 (contractNumber) - Critical
- 通常位於文件頂部或標題附近
- 格式範例：PO 4510250181、Contract-2024-001、合約字號：112-工-001
- 如果找不到明確編號，可使用文件標題中的編號部分
- **必填欄位**

### 2. 幣別 (currency) - Critical
- 辨識文件中使用的貨幣單位
- 常見格式：新台幣 (TWD)、美金 (USD)、NT$、USD、元
- 預設值：TWD（如果文件為繁體中文）
- **必填欄位**

### 3. 合約方資訊 - Critical
需提取以下資訊：
- **name**: 公司/個人名稱（必填）
- **contactPerson**: 聯絡人姓名（選填）
- **contactPhone**: 聯絡電話（選填）
- **contactEmail**: Email 地址（選填）
- **address**: 地址（選填）
- **taxId**: 統一編號/稅籍編號（選填）
- **businessNumber**: 營業登記號（選填）

### 4. 日期資訊 - Critical
- **signedDate**: 簽約日期
- **startDate**: 合約開始日期/工程開工日
- **endDate**: 合約結束日期/工程完工日
- 格式：ISO 8601（YYYY-MM-DD）
- 常見格式轉換：
  - 中華民國 113 年 1 月 1 日 → 2024-01-01
  - 2024/01/01 → 2024-01-01
  - 113.01.01 → 2024-01-01

### 5. 工項單位 (unit) - Critical
- 常見單位：式、組、台、EA、SET、M、M2、M3、支、個、批
- 英文縮寫：EA (Each), SET (Set), PC (Piece), LOT (Lot)
- **每個工項必須提取單位**

### 6. 工項編號 (code) - Important
- 工項編號或項次：1.1、A-001、01-01-01
- 如果沒有明確編號，使用項次順序：001, 002, 003

### 7. 合約條款 (terms) - Important
- 提取重要的合約條款、付款條件、驗收標準
- 每個條款包含：title（標題）、content（內容）、category（類別）
- 類別範例：payment（付款）、warranty（保固）、delivery（交付）

## 台灣合約特殊格式處理

### 日期格式
- 中華民國年 = 西元年 - 1911
- 113 年 = 2024 年
- 112 年 = 2023 年

### 金額格式
- 新台幣壹佰萬元整 → 1,000,000
- NT$ 1,000,000.00 → 1,000,000
- 100 萬元 → 1,000,000

### 數量單位
- 一式 → 1 式
- 壹台 → 1 台
- 10EA → 10 個

## 輸出格式
請以 JSON 格式輸出，嚴格遵循 EnhancedContractParsingOutput 介面定義。

## 重要原則
1. **必填欄位**: contractNumber, title, owner.name, contractor.name, totalAmount, currency 必須提取
2. **日期格式**: 統一使用 ISO 8601 (YYYY-MM-DD)
3. **數字格式**: 使用阿拉伯數字，不要使用中文數字
4. **信心度**: 根據提取資訊的清晰度評估 confidence (0-1)
5. **找不到欄位**: 使用 null 或 undefined，不要虛構資料

## 範例輸出結構
\`\`\`json
{
  "contractNumber": "PO 4510250181",
  "title": "工程採購合約",
  "description": "XXX工程承攬合約",
  "owner": {
    "name": "ABC建設股份有限公司",
    "contactPerson": "王大明",
    "contactPhone": "02-1234-5678",
    "address": "台北市信義區XX路XX號",
    "taxId": "12345678"
  },
  "contractor": {
    "name": "XYZ營造股份有限公司",
    "taxId": "87654321"
  },
  "totalAmount": 5000000,
  "currency": "TWD",
  "tax": 250000,
  "totalAmountWithTax": 5250000,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "workItems": [
    {
      "code": "01-01",
      "title": "基礎工程",
      "quantity": 1,
      "unit": "式",
      "unitPrice": 2000000,
      "totalPrice": 2000000
    }
  ],
  "terms": [
    {
      "title": "付款條件",
      "content": "工程款分三期給付...",
      "category": "payment"
    }
  ],
  "confidence": 0.85,
  "extractedFrom": "gemini-2.5-flash",
  "parsedAt": "2025-01-15T10:30:00Z"
}
\`\`\`

請仔細分析文件中的所有資訊，盡可能提取完整的資料。
`;
```

#### Firebase Function 更新

```typescript
// functions-ai/src/contract/contract-parseContract.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { ENHANCED_PARSING_SYSTEM_PROMPT } from "./prompts/enhanced-parsing-prompt";

interface Request {
  contractId: string;
  fileId: string;
  blueprintId: string;
}

interface Response {
  success: boolean;
  data?: EnhancedContractParsingOutput;
  error?: string;
}

export const parseContract = onCall<Request, Response>({
  region: 'asia-east1',
  memory: '1GiB',
  timeoutSeconds: 300,
  enforceAppCheck: false
}, async (request) => {
  // ✅ 認證檢查
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "使用者必須登入才能使用解析功能"
    );
  }

  const { contractId, fileId, blueprintId } = request.data;
  
  // ✅ 參數驗證
  if (!contractId || !fileId || !blueprintId) {
    throw new HttpsError(
      "invalid-argument",
      "contractId, fileId, blueprintId 為必填參數"
    );
  }

  try {
    // 1. 從 Firebase Storage 下載檔案
    const bucket = getStorage().bucket();
    const filePath = `contracts/${blueprintId}/${contractId}/original/${fileId}`;
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError("not-found", "檔案不存在");
    }

    // 2. 下載檔案內容
    const [fileBuffer] = await file.download();
    const base64File = fileBuffer.toString('base64');
    
    // 3. 取得檔案 MIME 類型
    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType || 'application/pdf';

    // 4. 初始化 Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,  // 低溫度確保穩定輸出
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    // 5. 建立 Multimodal Input
    const imagePart: Part = {
      inlineData: {
        data: base64File,
        mimeType: mimeType
      }
    };

    const textPart: Part = {
      text: "請分析這份合約文件，並提取所有必要的資訊。"
    };

    // 6. 呼叫 Gemini API
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [imagePart, textPart]
        }
      ],
      systemInstruction: ENHANCED_PARSING_SYSTEM_PROMPT
    });

    // 7. 解析回應
    const response = result.response;
    const text = response.text();
    
    // 移除 markdown code block 標記
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedData: EnhancedContractParsingOutput = JSON.parse(jsonText);

    // 8. 資料驗證
    validateParsedData(parsedData);

    // 9. 更新 Firestore
    const db = getFirestore();
    await db.collection('contracts').doc(contractId).update({
      parsedData: parsedData,
      parsingStatus: 'completed',
      parsingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 10. 返回結果
    return {
      success: true,
      data: parsedData
    };

  } catch (error) {
    console.error('Contract parsing error:', error);
    
    // 更新錯誤狀態
    const db = getFirestore();
    await db.collection('contracts').doc(contractId).update({
      parsingStatus: 'failed',
      parsingError: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date().toISOString()
    });

    throw new HttpsError(
      "internal",
      `解析失敗: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * 驗證解析資料的完整性
 */
function validateParsedData(data: EnhancedContractParsingOutput): void {
  const errors: string[] = [];

  // 必填欄位檢查
  if (!data.contractNumber) errors.push('缺少 contractNumber');
  if (!data.title) errors.push('缺少 title');
  if (!data.owner?.name) errors.push('缺少 owner.name');
  if (!data.contractor?.name) errors.push('缺少 contractor.name');
  if (!data.totalAmount) errors.push('缺少 totalAmount');
  if (!data.currency) errors.push('缺少 currency');

  // 工項檢查
  if (!data.workItems || data.workItems.length === 0) {
    errors.push('缺少 workItems');
  }

  if (errors.length > 0) {
    throw new HttpsError(
      "failed-precondition",
      `資料驗證失敗: ${errors.join(', ')}`
    );
  }
}
```

#### Frontend Service 更新

```typescript
// src/app/core/services/contract/contract-parsing.service.ts

import { inject, Injectable, signal, computed } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { EnhancedContractParsingOutput } from '../../../../functions-ai/src/contract/types';

export interface ParseContractRequest {
  contractId: string;
  fileId: string;
  blueprintId: string;
}

export interface ParseContractResponse {
  success: boolean;
  data?: EnhancedContractParsingOutput;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractParsingService {
  private functions = inject(Functions);
  
  // State
  private _parsing = signal(false);
  private _parsedData = signal<EnhancedContractParsingOutput | null>(null);
  private _error = signal<string | null>(null);
  
  // Public readonly state
  readonly parsing = this._parsing.asReadonly();
  readonly parsedData = this._parsedData.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Computed
  readonly hasData = computed(() => this._parsedData() !== null);
  readonly hasCriticalFields = computed(() => {
    const data = this._parsedData();
    if (!data) return false;
    
    // 檢查關鍵欄位
    return !!(
      data.contractNumber &&
      data.title &&
      data.owner?.name &&
      data.contractor?.name &&
      data.totalAmount &&
      data.currency
    );
  });
  
  /**
   * 請求合約解析
   */
  async requestParsing(request: ParseContractRequest): Promise<void> {
    this._parsing.set(true);
    this._error.set(null);
    
    try {
      const parseContract = httpsCallable<ParseContractRequest, ParseContractResponse>(
        this.functions,
        'contract-parseContract'
      );
      
      const result = await parseContract(request);
      
      if (result.data.success && result.data.data) {
        this._parsedData.set(result.data.data);
      } else {
        throw new Error(result.data.error || 'Unknown parsing error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._parsing.set(false);
    }
  }
  
  /**
   * 清除解析資料
   */
  clearParsedData(): void {
    this._parsedData.set(null);
    this._error.set(null);
  }
  
  /**
   * 轉換為 Contract 建立請求
   */
  toContractCreateRequest(
    parsedData: EnhancedContractParsingOutput,
    blueprintId: string,
    userId: string
  ): CreateContractRequest {
    return {
      blueprintId,
      contractNumber: parsedData.contractNumber,
      title: parsedData.title,
      description: parsedData.description,
      
      // 業主資訊
      owner: {
        id: `owner-${Date.now()}`,
        name: parsedData.owner.name,
        type: 'owner',
        contactPerson: parsedData.owner.contactPerson,
        contactPhone: parsedData.owner.contactPhone,
        contactEmail: parsedData.owner.contactEmail,
        address: parsedData.owner.address,
        taxId: parsedData.owner.taxId,
        businessNumber: parsedData.owner.businessNumber
      },
      
      // 承包商資訊
      contractor: {
        id: `contractor-${Date.now()}`,
        name: parsedData.contractor.name,
        type: 'contractor',
        contactPerson: parsedData.contractor.contactPerson,
        contactPhone: parsedData.contractor.contactPhone,
        contactEmail: parsedData.contractor.contactEmail,
        address: parsedData.contractor.address,
        taxId: parsedData.contractor.taxId,
        businessNumber: parsedData.contractor.businessNumber
      },
      
      // 財務資訊
      totalAmount: parsedData.totalAmount,
      currency: parsedData.currency,
      
      // 日期資訊
      signedDate: parsedData.signedDate ? new Date(parsedData.signedDate) : undefined,
      startDate: new Date(parsedData.startDate || Date.now()),
      endDate: new Date(parsedData.endDate || Date.now()),
      
      // 工項資訊
      workItems: parsedData.workItems.map((item, index) => ({
        id: `work-item-${Date.now()}-${index}`,
        code: item.code || `${index + 1}`.padStart(3, '0'),
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || '式',
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount,
        remarks: item.remarks,
        category: item.category,
        status: 'pending',
        completedQuantity: 0,
        completedPercentage: 0,
        subWorkItems: item.subWorkItems?.map((sub, subIndex) => ({
          id: `sub-work-item-${Date.now()}-${index}-${subIndex}`,
          code: sub.code || `${index + 1}.${subIndex + 1}`,
          title: sub.title,
          description: sub.description,
          quantity: sub.quantity,
          unit: sub.unit || '式',
          unitPrice: sub.unitPrice,
          totalPrice: sub.totalPrice,
          status: 'pending',
          completedQuantity: 0,
          completedPercentage: 0
        })) || []
      })),
      
      // 條款資訊
      terms: parsedData.terms?.map((term, index) => ({
        id: `term-${Date.now()}-${index}`,
        title: term.title,
        content: term.content,
        category: term.category as ContractTermCategory,
        order: index + 1,
        isRequired: true
      })),
      
      // 狀態與元資料
      status: 'draft',
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // 保存原始解析資料
      parsedData: {
        extractedFrom: parsedData.extractedFrom,
        parsedAt: parsedData.parsedAt,
        confidence: parsedData.confidence,
        rawData: parsedData
      }
    };
  }
}
```

### 影響範圍

#### 新增檔案
- `functions-ai/src/contract/types/enhanced-parsing.types.ts` - 增強型別定義
- `functions-ai/src/contract/prompts/enhanced-parsing-prompt.ts` - 增強提示詞
- `functions-ai/src/contract/validators/parsing-validator.ts` - 資料驗證器

#### 修改檔案
- `functions-ai/src/contract/contract-parseContract.ts` - 更新解析邏輯
- `src/app/core/services/contract/contract-parsing.service.ts` - 處理增強輸出
- `src/app/routes/contract/components/contract-verification-form/` - 智能驗證表單
- `src/app/core/models/contract.model.ts` - 確保型別一致性

#### 測試檔案
- `functions-ai/src/contract/__tests__/contract-parseContract.test.ts`
- `src/app/core/services/contract/contract-parsing.service.spec.ts`

### 驗收條件

#### Functional Requirements
- [ ] AI 解析可正確提取所有 Critical 欄位（contractNumber, currency, dates, party info）
- [ ] 欄位覆蓋率從 20% 提升至 60-70%
- [ ] 日期格式正確轉換（中華民國年 → 西元年）
- [ ] 金額格式正確轉換（中文數字 → 阿拉伯數字）
- [ ] 工項單位正確提取
- [ ] 合約條款正確分類

#### Technical Requirements
- [ ] Firebase Function 部署成功
- [ ] 型別定義完整且正確
- [ ] 資料驗證機制完整
- [ ] 錯誤處理機制完整
- [ ] 單元測試覆蓋率 > 80%

#### Performance Requirements
- [ ] 解析時間 < 30 秒（10 頁文件）
- [ ] 記憶體使用 < 1GiB
- [ ] 成功率 > 85%
- [ ] 信心度 > 0.7

#### User Experience Requirements
- [ ] 智能驗證表單可正確預填 AI 資料
- [ ] 使用者可輕鬆修正不正確的欄位
- [ ] 提供清楚的信心度指標
- [ ] 錯誤訊息清晰易懂

---

## 🔍 分析階段

> **Agent 指引**: 在此區塊進行技術分析，必須使用 Context7、Sequential Thinking、Software Planning Tool

### 步驟 1: 查詢官方文件 (Context7)

#### 1.1 Google Gemini AI
**查詢庫**: `/googleapis/js-genai`  
**主題**: multimodal, vision, structured-output, prompt-engineering

**Context7 查詢**:
```typescript
mcp_context7_resolve-library-id({ libraryName: "@google/genai" })
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/googleapis/js-genai",
  topic: "multimodal-vision-structured-output",
  tokens: 5000
})
```

**關鍵發現**:
- ✅ Gemini 2.5 Flash 支援 Structured Output (JSON mode)
- ✅ 使用 `responseMimeType: "application/json"` 確保 JSON 輸出
- ✅ 使用 `systemInstruction` 提供詳細提示詞
- ✅ 使用低 `temperature` (0.1) 確保穩定輸出
- ✅ Part Interface 支援 base64 編碼圖片

#### 1.2 Firebase Functions v2
**查詢庫**: `/firebase/firebase-functions`  
**主題**: callable-functions, error-handling, auth

**Context7 查詢**:
```typescript
mcp_context7_resolve-library-id({ libraryName: "firebase-functions" })
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/firebase/firebase-functions",
  topic: "callable-functions-v2",
  tokens: 3000
})
```

**關鍵發現**:
- ✅ `onCall` 方法提供自動序列化
- ✅ `HttpsError` 用於錯誤處理
- ✅ `request.auth` 提供認證資訊
- ✅ 支援泛型型別 `onCall<Request, Response>`

#### 1.3 Firebase Admin SDK
**查詢庫**: `/firebase/firebase-admin-node`  
**主題**: storage, firestore

**Context7 查詢**:
```typescript
mcp_context7_resolve-library-id({ libraryName: "firebase-admin" })
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/firebase/firebase-admin-node",
  topic: "storage-firestore-operations",
  tokens: 3000
})
```

**關鍵發現**:
- ✅ `getStorage().bucket()` 取得 Storage bucket
- ✅ `file.download()` 下載檔案為 Buffer
- ✅ `getFirestore()` 取得 Firestore 實例
- ✅ 支援 `.update()` 部分更新文件

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 問題拆解

**Q1: 為什麼當前解析只提取 15-20% 欄位？**

**分析流程**:
1. **觀察**: 檢查現有 `PARSING_SYSTEM_PROMPT`
2. **發現**: 提示詞只要求提取 "name, client, totalValue, tax, tasks"
3. **推論**: AI 只會提取提示詞中明確要求的欄位
4. **結論**: 需要更新提示詞明確要求所有必要欄位

**Q2: 如何確保 AI 正確提取台灣合約特有格式？**

**分析流程**:
1. **觀察**: 台灣合約使用中華民國年、中文數字、特殊單位
2. **問題**: Gemini 可能不熟悉這些格式
3. **解決方案**: 在提示詞中提供明確的轉換規則和範例
4. **驗證**: 使用實際合約（PO 4510250181 Rev A.pdf）測試

**Q3: 如何處理 AI 提取錯誤或遺漏？**

**分析流程**:
1. **問題**: AI 可能無法 100% 正確提取所有欄位
2. **方案評估**:
   - 方案 A: 完全依賴 AI → 不可靠
   - 方案 B: 完全人工輸入 → 失去自動化價值
   - 方案 C: AI 輔助 + 人工驗證 → 平衡效率與準確度
3. **決策**: 選擇方案 C（混合式架構）
4. **實作**: 智能驗證表單（預填 AI 結果，使用者確認）

**Q4: 如何最小化實作範圍（遵循 YAGNI）？**

**分析流程**:
1. **識別**: 區分 Critical vs Nice-to-have 功能
2. **優先級**:
   - P0: 提取所有必填欄位（contractNumber, currency, dates, party info）
   - P1: 智能驗證表單
   - P2: 信心度指標
   - P3: 批次處理、手寫辨識（延後）
3. **決策**: 只實作 P0 和 P1，P2 可快速加入，P3 延後
4. **理由**: 遵循 MVP 原則，先解決核心問題

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 規劃目標
將增強合約解析需求轉化為可執行的開發任務，確保符合專案架構規範。

#### 任務分解

**Task 1: 更新型別定義** (1 天)
- 建立 `EnhancedContractParsingOutput` 介面
- 建立 `EnhancedWorkItemSchema` 介面
- 更新前後端共用型別檔案
- 驗證型別與 Contract 模型一致性

**Task 2: 增強 AI 提示詞** (1 天)
- 撰寫 `ENHANCED_PARSING_SYSTEM_PROMPT`
- 加入台灣合約特殊格式處理規則
- 加入必填欄位明確要求
- 加入輸出範例

**Task 3: 更新 Firebase Function** (2 天)
- 更新 `contract-parseContract.ts`
- 整合增強提示詞
- 實作資料驗證邏輯
- 實作錯誤處理與 Fallback
- 部署並測試

**Task 4: 更新前端服務** (1 天)
- 更新 `ContractParsingService`
- 實作 `toContractCreateRequest` 轉換邏輯
- 處理增強輸出格式
- 單元測試

**Task 5: 測試與驗證** (1 天)
- 使用實際合約測試（PO 4510250181 Rev A.pdf）
- 驗證欄位覆蓋率提升
- 驗證台灣格式轉換正確性
- 驗證錯誤處理機制
- 效能測試

#### 風險識別

**風險 1: AI 提取準確度不足**
- **機率**: 中
- **影響**: 高
- **緩解**: 智能驗證表單，使用者可輕鬆修正

**風險 2: 台灣特殊格式轉換錯誤**
- **機率**: 中
- **影響**: 中
- **緩解**: 詳細的轉換規則，充分測試

**風險 3: 效能問題（大型 PDF）**
- **機率**: 低
- **影響**: 中
- **緩解**: 記憶體限制 1GiB，timeout 300s

**風險 4: 成本超支（Gemini API）**
- **機率**: 低
- **影響**: 低
- **緩解**: 每份合約約 $0.0012 USD，成本可控

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 型別定義與提示詞 (Day 1-2)

**目標**: 完成所有型別定義和增強提示詞

**步驟**:
1. 建立 `functions-ai/src/contract/types/enhanced-parsing.types.ts`
2. 定義 `EnhancedContractParsingOutput` 介面（完整規格）
3. 定義 `EnhancedWorkItemSchema` 介面
4. 建立 `functions-ai/src/contract/prompts/enhanced-parsing-prompt.ts`
5. 撰寫詳細的系統提示詞（包含台灣格式處理）
6. Code Review 確認型別完整性

**驗收標準**:
- [ ] 所有型別定義完整且與 Contract 模型一致
- [ ] 系統提示詞涵蓋所有必要欄位
- [ ] 提供台灣格式轉換規則
- [ ] 提供清晰的輸出範例

#### Phase 2: Firebase Function 實作 (Day 3-4)

**目標**: 更新 Cloud Function 整合增強邏輯

**步驟**:
1. 更新 `functions-ai/src/contract/contract-parseContract.ts`
2. 整合 `ENHANCED_PARSING_SYSTEM_PROMPT`
3. 實作 `validateParsedData()` 驗證函式
4. 實作錯誤處理與 Firestore 狀態更新
5. 本地測試（使用 Firebase Emulator）
6. 部署至 asia-east1 region

**驗收標準**:
- [ ] Function 可正確呼叫 Gemini API
- [ ] 回應格式符合 `EnhancedContractParsingOutput`
- [ ] 必填欄位驗證完整
- [ ] 錯誤處理機制完整
- [ ] 部署成功且運作正常

#### Phase 3: 前端服務更新 (Day 4-5)

**目標**: 前端服務處理增強輸出

**步驟**:
1. 更新 `src/app/core/services/contract/contract-parsing.service.ts`
2. 實作 `toContractCreateRequest()` 完整轉換邏輯
3. 處理日期格式轉換
4. 處理合約方資訊映射
5. 處理工項與條款映射
6. 單元測試覆蓋所有轉換邏輯

**驗收標準**:
- [ ] 服務可正確處理增強輸出
- [ ] 資料轉換邏輯正確無誤
- [ ] 單元測試覆蓋率 > 80%
- [ ] 型別安全且無 TypeScript 錯誤

#### Phase 4: 整合測試 (Day 5)

**目標**: 端到端測試與驗證

**步驟**:
1. 上傳實際合約（PO 4510250181 Rev A.pdf）
2. 觸發 AI 解析
3. 驗證所有 Critical 欄位被正確提取
4. 驗證台灣格式轉換正確性
5. 驗證資料可成功建立 Contract
6. 效能測試（解析時間、記憶體使用）
7. 錯誤情境測試（無效檔案、API 失敗）

**驗收標準**:
- [ ] 欄位覆蓋率 ≥ 60%
- [ ] 所有 Critical 欄位被提取
- [ ] 台灣格式轉換正確
- [ ] 解析時間 < 30 秒
- [ ] 錯誤處理機制正常運作

#### Phase 5: 文檔與交付 (Day 5)

**目標**: 完成文檔並交付功能

**步驟**:
1. 更新 `SETC-012` 實作狀態
2. 撰寫使用者指南
3. 撰寫開發者文檔（API 說明）
4. 建立 CHANGELOG
5. 準備 Demo 與測試報告

**驗收標準**:
- [ ] 所有文檔完整更新
- [ ] 使用者可依照指南操作
- [ ] 開發者可理解實作細節
- [ ] Demo 可展示核心功能

### 檔案清單

#### 新增檔案

**Backend (functions-ai/)**:
- `src/contract/types/enhanced-parsing.types.ts` - 增強型別定義
- `src/contract/prompts/enhanced-parsing-prompt.ts` - 增強系統提示詞
- `src/contract/validators/parsing-validator.ts` - 資料驗證器
- `src/contract/__tests__/contract-parseContract.test.ts` - 單元測試

**Frontend (src/app/)**:
- `core/models/enhanced-parsing.model.ts` - 前端型別定義（與後端共用）

#### 修改檔案

**Backend (functions-ai/)**:
- `src/contract/contract-parseContract.ts` - 整合增強邏輯
- `src/index.ts` - 確保 Function 正確 export

**Frontend (src/app/)**:
- `core/services/contract/contract-parsing.service.ts` - 處理增強輸出
- `core/services/contract/contract-parsing.service.spec.ts` - 更新測試
- `core/models/contract.model.ts` - 確認型別一致性（如需）

---

## 📜 開發規範

### 核心原則

#### 1️⃣ KISS (Keep It Simple, Stupid)
- ✅ 只更新必要的檔案和邏輯
- ✅ 使用 Gemini 2.5 Flash（不升級至 Pro）
- ✅ 保持現有架構不變
- ❌ 不引入新的複雜抽象層

#### 2️⃣ YAGNI（You Aren't Gonna Need It）
- ✅ 只實作 Critical 和 Important 欄位
- ✅ 延後批次處理、手寫辨識等功能
- ❌ 不預先建立「未來可能需要」的功能

#### 3️⃣ 最小可行方案（MVP / MVS）
- ✅ Phase 1 即可產生價值（欄位覆蓋率提升至 60-70%）
- ✅ 快速迭代，快速驗證
- ✅ 每個 Phase 都可獨立交付

#### 4️⃣ 單一職責原則（SRP）
- ✅ `contract-parseContract.ts` - 只負責 AI 解析
- ✅ `ContractParsingService` - 只負責解析流程管理
- ✅ `parsing-validator.ts` - 只負責資料驗證

#### 5️⃣ 低耦合、高內聚
- ✅ 型別定義與實作分離
- ✅ 提示詞與邏輯分離
- ✅ 驗證邏輯獨立可測試

### 架構規範

#### 三層架構嚴格分離
- ✅ **Infrastructure Layer**: Firebase Function (`contract-parseContract`)
- ✅ **Service Layer**: `ContractParsingService`
- ✅ **UI Layer**: Verification Form Component（SETC-016 範圍）

#### Repository 模式
- ✅ 所有 Firestore 操作透過 Firebase Admin SDK
- ✅ 前端透過 `httpsCallable` 呼叫 Cloud Function
- ❌ 不直接操作 Firestore

#### 事件驅動
- ✅ 解析完成後發送事件（`contract.parsed`）
- ✅ 其他模組可訂閱此事件（如通知模組）

### 安全性原則

#### 認證與授權
- ✅ Function 檢查 `request.auth`
- ✅ 驗證使用者對 Blueprint 的存取權限
- ✅ 檔案路徑包含 `blueprintId` 防止跨專案存取

#### 資料驗證
- ✅ 前端驗證檔案類型和大小
- ✅ 後端驗證 API 參數
- ✅ 驗證 AI 輸出的必填欄位
- ❌ 不信任任何使用者輸入

#### 敏感資料處理
- ✅ Gemini API Key 存放在環境變數
- ✅ 不記錄敏感的合約內容
- ✅ 錯誤訊息不洩漏系統細節

### 效能優化

#### Gemini API 使用
- ✅ 使用 Gemini 2.5 Flash（快速且便宜）
- ✅ 設定合理的 timeout (300s)
- ✅ 使用 JSON mode 減少後處理

#### 資源管理
- ✅ Function 記憶體限制 1GiB
- ✅ 下載檔案後立即處理，不暫存
- ✅ 使用 base64 編碼直接傳送給 Gemini

#### 錯誤處理
- ✅ 快速失敗（Fail Fast）
- ✅ 詳細的錯誤日誌
- ✅ 更新 Firestore 狀態讓前端可追蹤

---

## 📊 成功指標

### 量化指標

| 指標 | 目標 | 測量方法 |
|------|------|---------|
| 欄位覆蓋率 | ≥ 60% | 檢查提取欄位 / 必要欄位 |
| Critical 欄位提取率 | 100% | contractNumber, currency, dates, party info |
| 解析成功率 | ≥ 85% | 成功解析數 / 總請求數 |
| 解析時間（10頁） | < 30s | Cloud Function 執行時間 |
| AI 信心度 | ≥ 0.7 | Gemini 回傳的 confidence |
| 使用者修正率 | < 30% | 需修正欄位數 / 總欄位數 |

### 質化指標

- ✅ 使用者認為 AI 預填有幫助
- ✅ 驗證流程比完全手動輸入快速
- ✅ 台灣合約格式轉換正確
- ✅ 錯誤訊息清晰易懂
- ✅ 開發者可輕鬆維護和擴展

---

## 🔗 相關文件

### SETC 任務
- **SETC-009**: Contract Module Foundation
- **SETC-010**: Contract Repository Layer
- **SETC-011**: Contract Management Service
- **SETC-012**: Contract Upload & Parsing Service（本任務擴展）
- **SETC-016**: Contract UI Components（驗證表單）

### 分析文件
- **Gap Analysis**: `docs/analysis/CONTRACT-PARSING-GAP-ANALYSIS.md`
- **Technical Analysis**: `docs/analysis/OCR-PDF-PARSING-ANALYSIS.md`

### 參考合約
- **PO 4510250181 Rev A.pdf** - 實際測試合約

---

## 📝 備註

### 為什麼選擇這個方案？

**方案評估**:
1. **方案 A**: 完全重寫解析邏輯 → ❌ 過度設計，違反 KISS
2. **方案 B**: 只更新提示詞 → ⚠️ 不足，需要型別和服務支援
3. **方案 C**: 增強提示詞 + 更新型別 + 智能驗證 → ✅ 平衡效率與準確度

**決策理由**:
- 遵循 MVP 原則，先解決核心問題（欄位覆蓋率）
- 遵循 YAGNI 原則，不預先建立未來功能
- 遵循 KISS 原則，保持實作簡單
- 實作時間短（5 天），風險低
- 可快速驗證效果，快速迭代

### 後續改進方向

**Phase 2 (中期，1-2 個月)**:
- 實作智能推薦系統（基於歷史資料）
- 實作批次處理優化
- 手寫合約辨識

**Phase 3 (長期，3-6 個月)**:
- 升級至 Gemini 2.0 Pro
- Few-Shot Learning
- 多引擎整合（OCR + AI）
- API 平台化

---

**文件版本**: 1.0  
**建立日期**: 2025-12-17  
**最後更新**: 2025-12-17  
**作者**: GitHub Copilot (Context7 驗證)
