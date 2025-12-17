# 📝 Google Generative AI + Firebase Functions + Angular Fire 整合設計文件

> **文件版本**: 1.0  
> **建立日期**: 2025-12-14  
> **狀態**: 📋 Design Phase  
> **作者**: Copilot Agent

---

## 🎯 任務定義

### 名稱
整合 Google Generative AI (Gemini) 與 Firebase Functions，提供 AI 驅動功能給 Angular 前端

### 背景 / 目的
GigHub 工地施工進度追蹤管理系統需要整合 AI 能力，以提供智能化功能（如：施工日誌摘要、任務建議、品質檢查建議等）。本設計文件說明如何使用 Firebase Functions 作為中介層，呼叫 Google Generative AI API，並透過 @angular/fire 在 Angular 應用中使用這些 AI 功能。

### 需求說明
1. **在 Firebase Functions 中整合 @google/generative-ai SDK**
2. **實作可呼叫的 Cloud Functions 提供 AI 服務**
3. **在 Angular 應用中透過 @angular/fire 呼叫 AI Functions**
4. **確保 API Key 安全管理**
5. **實作成本控制機制**
6. **遵循 GigHub 專案三層架構規範**

### In Scope / Out of Scope

#### ✅ In Scope
- Firebase Functions 整合 @google/generative-ai SDK
- 實作基礎 AI Callable Functions（文字生成、對話）
- Angular Service/Repository 層實作
- API Key 安全管理方案
- 錯誤處理與重試機制
- 成本控制配置
- 基礎使用範例

#### ❌ Out of Scope
- 特定業務邏輯的 AI 提示詞設計
- 進階 AI 功能（圖像生成、多模態）
- AI 回應快取策略（後續優化）
- 使用量統計與分析（後續優化）
- Fine-tuning 模型訓練

## 📊 技術棧版本

### 當前版本
- **Angular**: 20.3.0
- **@angular/fire**: 20.0.1
- **firebase-functions**: 7.0.0 (v2 API)
- **firebase-admin**: 13.6.0
- **Node.js**: 24

### 需要新增
- **@google/generative-ai**: ^0.21.0 (最新穩定版)
- **dotenv**: ^16.0.0 (本地開發用，選用)

## 🏗️ 架構設計

### 三層架構整合

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Angular)                   │
│  routes/ai-demo/                                        │
│  ├── ai-demo.component.ts (展示與互動)                  │
│  └── ai-demo.component.html                             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)             │
│  core/services/ai/                                      │
│  └── ai.service.ts (業務邏輯協調)                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Repository Layer (Data Access Abstract)        │
│  core/data-access/ai/                                   │
│  └── ai.repository.ts (Firebase Functions 呼叫)         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Infrastructure (Firebase)                  │
│  Firebase Functions → Google Generative AI              │
└─────────────────────────────────────────────────────────┘
```

### API 設計

#### generateText (Callable Function)
```typescript
interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

interface GenerateTextResponse {
  text: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}
```

#### generateChat (Callable Function)
```typescript
interface GenerateChatRequest {
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

interface GenerateChatResponse {
  response: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}
```

## 🔐 安全性設計

### API Key 管理
**推薦方案**: Firebase Secret Manager

```bash
# 設定 Secret
firebase functions:secrets:set GOOGLE_AI_API_KEY

# Functions 中使用
import { defineSecret } from 'firebase-functions/params';
const apiKey = defineSecret('GOOGLE_AI_API_KEY');
```

**優點**:
- Google Cloud 原生支援
- 自動加密
- 版本控制
- 無需額外工具

### 身份驗證
所有 Callable Functions 自動驗證 Firebase Auth token：

```typescript
export const generateText = onCall(async (request) => {
  // 自動檢查身份驗證
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  // ...
});
```

### 成本控制
1. **Function 層級**:
   - `maxInstances: 10` (限制並發)
   - `timeout: 60s` (防止長時間執行)
   - `memory: 512MB` (適當的記憶體配置)

2. **應用層級**:
   - 前端 debounce: 500ms
   - maxTokens 限制: 1000 tokens/請求

3. **監控告警**:
   - 設定每日花費閾值
   - 監控異常請求模式

## 📐 實施計畫

### Phase 1: 準備階段（30 分鐘）

1. **安裝依賴**
```bash
cd functions
npm install @google/generative-ai
```

2. **設定 API Key**
```bash
# 取得 API Key: https://makersuite.google.com/app/apikey
firebase functions:secrets:set GOOGLE_AI_API_KEY
```

### Phase 2: Firebase Functions 實作（2 小時）

詳見附錄 A：Firebase Functions 完整程式碼

核心檔案：
- `functions/src/ai/types.ts` - 類型定義
- `functions/src/ai/config.ts` - 配置管理
- `functions/src/ai/generateText.ts` - 文字生成
- `functions/src/ai/generateChat.ts` - 對話生成
- `functions/src/ai/index.ts` - 匯出
- `functions/src/index.ts` - 主要入口

### Phase 3: Angular Repository 層（1 小時）

詳見附錄 B：Angular Repository 完整程式碼

核心檔案：
- `src/app/core/data-access/ai/ai.types.ts` - 類型定義
- `src/app/core/data-access/ai/ai.repository.ts` - Repository

### Phase 4: Angular Service 層（1 小時）

詳見附錄 C：Angular Service 完整程式碼

核心檔案：
- `src/app/core/services/ai/ai.service.ts` - Service

### Phase 5: Angular Store 層（1 小時）

詳見附錄 D：Angular Store 完整程式碼

核心檔案：
- `src/app/core/facades/ai/ai.store.ts` - Store (Signals)

### Phase 6: 範例元件（1.5 小時）

詳見附錄 E：範例元件完整程式碼

核心檔案：
- `src/app/routes/ai-demo/ai-demo.component.ts`
- `src/app/routes/ai-demo/ai-demo.component.html`
- `src/app/routes/ai-demo/ai-demo.component.less`

### Phase 7: 測試與驗證（2 小時）

**本地測試**:
```bash
# Terminal 1: Firebase Emulators
cd functions && npm run serve

# Terminal 2: Angular Dev Server
yarn start
```

**測試清單**:
- [ ] Firebase Functions 編譯成功
- [ ] Emulator 正常啟動
- [ ] Angular 應用可連接 Functions
- [ ] generateText 功能正常
- [ ] generateChat 功能正常
- [ ] 錯誤處理正常
- [ ] 事件總線發送正確

**部署測試**:
```bash
cd functions && npm run deploy
firebase functions:log
```

## 📁 檔案清單

### 新增檔案

**Firebase Functions**:
```
functions/
├── src/
│   ├── ai/
│   │   ├── index.ts
│   │   ├── generateText.ts
│   │   ├── generateChat.ts
│   │   ├── config.ts
│   │   └── types.ts
```

**Angular App**:
```
src/app/
├── core/
│   ├── data-access/ai/
│   │   ├── ai.repository.ts
│   │   └── ai.types.ts
│   ├── services/ai/
│   │   └── ai.service.ts
│   └── facades/ai/
│       └── ai.store.ts
└── routes/ai-demo/
    ├── ai-demo.component.ts
    ├── ai-demo.component.html
    └── ai-demo.component.less
```

### 修改檔案

```
functions/package.json  # 新增 @google/generative-ai
functions/src/index.ts  # 匯出 AI Functions
src/app/routes/routes.ts  # 新增路由
```

## ✅ 驗收條件

### 功能驗收
- [ ] Firebase Functions 成功整合 @google/generative-ai
- [ ] generateText Function 正常運作
- [ ] generateChat Function 支援多輪對話
- [ ] Angular Repository 可呼叫 Functions
- [ ] 錯誤處理機制完整
- [ ] API Key 安全儲存

### 安全驗收
- [ ] API Key 不暴露於客戶端
- [ ] 需要 Firebase 身份驗證
- [ ] 速率限制生效
- [ ] 錯誤訊息不洩漏敏感資訊

### 效能驗收
- [ ] Function 冷啟動 < 5 秒
- [ ] AI 回應時間 < 30 秒
- [ ] maxInstances 限制生效
- [ ] 並發處理正常

## 📊 效能與成本預估

### 效能
- **冷啟動時間**: 3-5 秒
- **簡單文字生成**: 2-5 秒
- **複雜對話**: 5-15 秒
- **Timeout 限制**: 30 秒

### 成本（Google Cloud）
- **Function 執行**: $0.40 / 百萬次請求
- **Function 記憶體**: $0.0000025 / GB-秒
- **Google AI API**: 依使用量（見官方定價）

**範例**（每天 1000 次請求）：
- Function 成本: ~$0.01 / 日
- AI API 成本: 依實際 tokens

## 🚀 後續優化

### Phase 2 功能（未來）
1. **快取策略** - 減少重複 API 呼叫
2. **使用量統計** - Dashboard 顯示
3. **進階功能** - 圖像生成、多模態
4. **效能優化** - Response streaming
5. **業務整合** - 施工日誌 AI 摘要

## 📚 參考資源

### 官方文檔
- [Google Generative AI SDK for Node.js](https://ai.google.dev/gemini-api/docs/get-started/tutorial?lang=node)
- [Firebase Functions v2](https://firebase.google.com/docs/functions/get-started)
- [@angular/fire Documentation](https://github.com/angular/angularfire)
- [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env)

### GigHub 專案文檔
- [FINAL_PROJECT_STRUCTURE.md](./FINAL_PROJECT_STRUCTURE.md)
- [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md)

---

## 附錄 A: Firebase Functions 程式碼範例

### A.1 types.ts
```typescript
export interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

export interface GenerateTextResponse {
  text: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}

export interface GenerateChatRequest {
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

export interface GenerateChatResponse {
  response: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}
```

### A.2 config.ts
```typescript
import { defineSecret } from 'firebase-functions/params';

export const GOOGLE_AI_API_KEY = defineSecret('GOOGLE_AI_API_KEY');

export const AI_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  defaultMaxTokens: 1000,
  defaultTemperature: 0.7,
  maxRetries: 3,
  timeout: 30000,
};
```

### A.3 generateText.ts
```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_AI_API_KEY, AI_CONFIG } from './config';
import type { GenerateTextRequest, GenerateTextResponse } from './types';

export const generateText = onCall(
  {
    secrets: [GOOGLE_AI_API_KEY],
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request): Promise<GenerateTextResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as GenerateTextRequest;
    if (!data.prompt || data.prompt.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Prompt is required');
    }

    if (data.prompt.length > 10000) {
      throw new HttpsError('invalid-argument', 'Prompt is too long');
    }

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

      const generationConfig = {
        maxOutputTokens: data.maxTokens || AI_CONFIG.defaultMaxTokens,
        temperature: data.temperature ?? AI_CONFIG.defaultTemperature,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: data.prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const tokensUsed = Math.ceil((data.prompt.length + text.length) / 4);

      return {
        text,
        tokensUsed,
        model: AI_CONFIG.model,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('AI generation failed:', error);
      throw new HttpsError('internal', 'Failed to generate text', {
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
```

### A.4 index.ts (functions/src/ai/)
```typescript
export { generateText } from './generateText';
export { generateChat } from './generateChat';
export type * from './types';
```

### A.5 index.ts (functions/src/)
```typescript
import { setGlobalOptions } from 'firebase-functions';
import * as aiFunctions from './ai';

setGlobalOptions({ maxInstances: 10 });

export const ai = {
  generateText: aiFunctions.generateText,
  generateChat: aiFunctions.generateChat,
};
```

---

## 附錄 B: Angular Repository 程式碼範例

### B.1 ai.types.ts
```typescript
export interface AIGenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

export interface AIGenerateTextResponse {
  text: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AIGenerateChatRequest {
  messages: AIChatMessage[];
  maxTokens?: number;
  temperature?: number;
  blueprintId?: string;
}

export interface AIGenerateChatResponse {
  response: string;
  tokensUsed: number;
  model: string;
  timestamp: number;
}
```

### B.2 ai.repository.ts
```typescript
import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AIGenerateTextRequest,
  AIGenerateTextResponse,
  AIGenerateChatRequest,
  AIGenerateChatResponse,
} from './ai.types';

@Injectable({ providedIn: 'root' })
export class AIRepository {
  private functions = inject(Functions);

  async generateText(
    request: AIGenerateTextRequest
  ): Promise<AIGenerateTextResponse> {
    const callable = httpsCallable<
      AIGenerateTextRequest,
      AIGenerateTextResponse
    >(this.functions, 'ai-generateText');

    try {
      const result = await callable(request);
      return result.data;
    } catch (error) {
      console.error('Failed to generate text:', error);
      throw this.handleError(error);
    }
  }

  async generateChat(
    request: AIGenerateChatRequest
  ): Promise<AIGenerateChatResponse> {
    const callable = httpsCallable<
      AIGenerateChatRequest,
      AIGenerateChatResponse
    >(this.functions, 'ai-generateChat');

    try {
      const result = await callable(request);
      return result.data;
    } catch (error) {
      console.error('Failed to generate chat:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      const message = (error as { message: string }).message;

      switch (code) {
        case 'unauthenticated':
          return new Error('請先登入後再使用 AI 功能');
        case 'permission-denied':
          return new Error('您沒有權限使用此功能');
        case 'invalid-argument':
          return new Error(message || '輸入參數錯誤');
        case 'resource-exhausted':
          return new Error('AI 服務請求過於頻繁，請稍後再試');
        default:
          return new Error('AI 服務暫時無法使用，請稍後再試');
      }
    }

    return error instanceof Error ? error : new Error('未知錯誤');
  }
}
```

---

## 變更日誌

### v1.0 - 2025-12-14
- ✅ 初始設計文件
- ✅ 完整架構分析
- ✅ 詳細實作步驟
- ✅ 程式碼範例
- ✅ 安全性與成本分析

---

**下一步行動**:
1. 審查本設計文件
2. 取得 Google AI API Key
3. 按照 Phase 1-7 步驟實作
4. 測試與驗證
5. 部署到正式環境
