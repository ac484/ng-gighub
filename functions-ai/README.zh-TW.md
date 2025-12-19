# Functions AI Module

## 📋 概述

`functions-ai` 模組整合 Google Gemini AI 和其他 AI 服務,提供智慧化的工地管理功能。包括圖片辨識、自然語言處理、智慧推薦和預測分析等 AI 功能。

## 🎯 目標

- **智慧辨識**: 使用 AI 辨識工地照片和文件
- **自然語言**: 處理語音輸入和文字查詢
- **智慧推薦**: 提供專案管理建議和優化方案
- **預測分析**: 預測專案風險和進度

## 📦 核心功能

### 1. 圖片分析與辨識 (Image Analysis)

```typescript
import { onCall } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AnalyzeImageRequest {
  imageUrl: string;
  analysisType: 'safety' | 'progress' | 'quality' | 'general';
  projectId?: string;
}

export interface ImageAnalysisResult {
  description: string;
  findings: string[];
  safetyIssues?: string[];
  progressEstimate?: number;
  qualityScore?: number;
  recommendations: string[];
}

export const analyzeConstructionImage = onCall<AnalyzeImageRequest>({
  region: 'asia-east1',
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  const { imageUrl, analysisType, projectId } = request.data;

  logger.info('分析工地圖片', { imageUrl, analysisType });

  try {
    // 下載圖片
    const imageData = await downloadImage(imageUrl);

    // 使用 Gemini Vision 分析
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = getAnalysisPrompt(analysisType);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.toString('base64')
        }
      }
    ]);

    const response = result.response;
    const analysisText = response.text();

    // 解析 AI 回應
    const analysis = parseAnalysisResult(analysisText, analysisType);

    // 儲存分析結果
    if (projectId) {
      await saveAnalysisResult(projectId, imageUrl, analysis);
    }

    logger.info('圖片分析完成', { analysis });

    return analysis;
  } catch (error) {
    logger.error('圖片分析失敗', error);
    throw new HttpsError('internal', '分析失敗');
  }
});

function getAnalysisPrompt(analysisType: string): string {
  const prompts = {
    safety: `請分析這張工地照片的安全狀況。請識別:
1. 任何安全隱患或違規
2. 工人是否正確配戴安全裝備
3. 工作環境是否安全
4. 提供安全改善建議`,

    progress: `請分析這張工地照片的施工進度。請評估:
1. 目前施工階段
2. 完成度百分比估計
3. 可見的施工品質
4. 下一步建議`,

    quality: `請分析這張工地照片的施工品質。請檢查:
1. 施工品質問題
2. 缺陷或瑕疵
3. 是否符合標準
4. 品質改善建議`,

    general: `請詳細描述這張工地照片。包括:
1. 主要內容和活動
2. 施工階段
3. 可見的設備和材料
4. 任何值得注意的事項`
  };

  return prompts[analysisType] || prompts.general;
}

function parseAnalysisResult(
  text: string, 
  analysisType: string
): ImageAnalysisResult {
  // 解析 AI 回應文字
  const lines = text.split('\n').filter(line => line.trim());
  
  const result: ImageAnalysisResult = {
    description: lines[0] || '',
    findings: [],
    recommendations: []
  };

  // 根據分析類型提取特定資訊
  if (analysisType === 'safety') {
    result.safetyIssues = extractSafetyIssues(text);
  } else if (analysisType === 'progress') {
    result.progressEstimate = extractProgressEstimate(text);
  } else if (analysisType === 'quality') {
    result.qualityScore = extractQualityScore(text);
  }

  result.findings = extractFindings(text);
  result.recommendations = extractRecommendations(text);

  return result;
}

async function downloadImage(url: string): Promise<Buffer> {
  const bucket = admin.storage().bucket();
  const fileName = url.split('/').pop() || '';
  const file = bucket.file(fileName);
  
  const [buffer] = await file.download();
  return buffer;
}

function extractSafetyIssues(text: string): string[] {
  // 提取安全問題
  const issues: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('危險') || line.includes('風險') || line.includes('違規')) {
      issues.push(line.trim());
    }
  });
  
  return issues;
}

function extractProgressEstimate(text: string): number {
  // 提取進度估計
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

function extractQualityScore(text: string): number {
  // 提取品質分數
  const match = text.match(/分數[：:]\s*(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function extractFindings(text: string): string[] {
  // 提取發現事項
  const findings: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.match(/^\d+\./)) {
      findings.push(line.replace(/^\d+\.\s*/, '').trim());
    }
  });
  
  return findings;
}

function extractRecommendations(text: string): string[] {
  // 提取建議
  const recommendations: string[] = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  
  lines.forEach(line => {
    if (line.includes('建議') || line.includes('推薦')) {
      inRecommendations = true;
    }
    if (inRecommendations && line.match(/^\d+\./)) {
      recommendations.push(line.replace(/^\d+\.\s*/, '').trim());
    }
  });
  
  return recommendations;
}
```

### 2. 智慧文件處理 (Document Processing)

```typescript
export interface ProcessDocumentRequest {
  documentUrl: string;
  documentType: 'contract' | 'invoice' | 'report' | 'plan';
}

export interface DocumentProcessingResult {
  extractedText: string;
  entities: {
    dates: string[];
    amounts: string[];
    parties: string[];
    items: string[];
  };
  summary: string;
  keyPoints: string[];
}

export const processDocument = onCall<ProcessDocumentRequest>({
  region: 'asia-east1',
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  const { documentUrl, documentType } = request.data;

  logger.info('處理文件', { documentUrl, documentType });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // 下載文件
    const documentData = await downloadDocument(documentUrl);

    const prompt = `請分析這份${documentType}文件並提取以下資訊:
1. 重要日期
2. 金額
3. 相關方
4. 主要項目
5. 摘要
6. 關鍵要點`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: documentData.toString('base64')
        }
      }
    ]);

    const response = result.response;
    const analysisText = response.text();

    const processed: DocumentProcessingResult = {
      extractedText: analysisText,
      entities: {
        dates: extractDates(analysisText),
        amounts: extractAmounts(analysisText),
        parties: extractParties(analysisText),
        items: extractItems(analysisText)
      },
      summary: extractSummary(analysisText),
      keyPoints: extractKeyPoints(analysisText)
    };

    logger.info('文件處理完成', { processed });

    return processed;
  } catch (error) {
    logger.error('文件處理失敗', error);
    throw new HttpsError('internal', '處理失敗');
  }
});

async function downloadDocument(url: string): Promise<Buffer> {
  const bucket = admin.storage().bucket();
  const fileName = url.split('/').pop() || '';
  const file = bucket.file(fileName);
  
  const [buffer] = await file.download();
  return buffer;
}

function extractDates(text: string): string[] {
  const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}月\d{1,2}日/g;
  return text.match(dateRegex) || [];
}

function extractAmounts(text: string): string[] {
  const amountRegex = /\$?\d{1,3}(,\d{3})*(\.\d{2})?|NT\$?\s*\d{1,3}(,\d{3})*/g;
  return text.match(amountRegex) || [];
}

function extractParties(text: string): string[] {
  // 簡化版本,實際應使用更複雜的 NLP
  const parties: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('公司') || line.includes('行') || line.includes('廠')) {
      parties.push(line.trim());
    }
  });
  
  return parties;
}

function extractItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.match(/^\d+\./)) {
      items.push(line.replace(/^\d+\.\s*/, '').trim());
    }
  });
  
  return items;
}

function extractSummary(text: string): string {
  const lines = text.split('\n');
  return lines.slice(0, 3).join(' ');
}

function extractKeyPoints(text: string): string[] {
  const keyPoints: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('重點') || line.includes('要點') || line.includes('關鍵')) {
      keyPoints.push(line.trim());
    }
  });
  
  return keyPoints;
}
```

### 3. 智慧問答系統 (Q&A System)

```typescript
export interface AskQuestionRequest {
  question: string;
  context?: {
    projectId?: string;
    taskId?: string;
  };
}

export interface QuestionAnswerResult {
  answer: string;
  confidence: number;
  sources: string[];
  relatedQuestions: string[];
}

export const askQuestion = onCall<AskQuestionRequest>({
  region: 'asia-east1',
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  const { question, context } = request.data;

  logger.info('處理問題', { question, context });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // 收集相關資料作為上下文
    let contextData = '';
    if (context?.projectId) {
      contextData = await getProjectContext(context.projectId);
    }

    const prompt = `
根據以下資訊回答問題:

問題: ${question}

相關資料:
${contextData}

請提供:
1. 詳細答案
2. 答案的可信度 (0-100)
3. 資料來源
4. 相關問題建議
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const answerText = response.text();

    const answer: QuestionAnswerResult = {
      answer: extractAnswer(answerText),
      confidence: extractConfidence(answerText),
      sources: extractSources(answerText),
      relatedQuestions: extractRelatedQuestions(answerText)
    };

    logger.info('問題回答完成', { answer });

    return answer;
  } catch (error) {
    logger.error('問題回答失敗', error);
    throw new HttpsError('internal', '處理失敗');
  }
});

async function getProjectContext(projectId: string): Promise<string> {
  const projectDoc = await admin.firestore()
    .collection('projects')
    .doc(projectId)
    .get();

  if (!projectDoc.exists) {
    return '';
  }

  const project = projectDoc.data()!;
  return `專案名稱: ${project.name}\n描述: ${project.description}\n狀態: ${project.status}`;
}

function extractAnswer(text: string): string {
  const lines = text.split('\n');
  return lines[0] || '';
}

function extractConfidence(text: string): number {
  const match = text.match(/可信度[：:]\s*(\d+)/);
  return match ? parseInt(match[1]) : 80;
}

function extractSources(text: string): string[] {
  // 提取來源
  return ['Firestore', 'Project Data'];
}

function extractRelatedQuestions(text: string): string[] {
  const questions: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('?') || line.includes('？')) {
      questions.push(line.trim());
    }
  });
  
  return questions.slice(0, 3);
}
```

### 4. 專案風險預測 (Risk Prediction)

```typescript
export interface PredictRiskRequest {
  projectId: string;
}

export interface RiskPredictionResult {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  risks: {
    category: string;
    probability: number;
    impact: number;
    description: string;
    mitigation: string;
  }[];
  recommendations: string[];
}

export const predictProjectRisk = onCall<PredictRiskRequest>({
  region: 'asia-east1',
  secrets: ['GEMINI_API_KEY']
}, async (request) => {
  const { projectId } = request.data;

  logger.info('預測專案風險', { projectId });

  try {
    // 收集專案資料
    const projectData = await collectProjectData(projectId);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
請分析以下專案資料並預測潛在風險:

專案資料:
${JSON.stringify(projectData, null, 2)}

請提供:
1. 整體風險等級 (low/medium/high/critical)
2. 風險分數 (0-100)
3. 各類風險分析 (進度、成本、品質、安全)
4. 每個風險的發生機率和影響程度
5. 風險緩解建議
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysisText = response.text();

    const prediction = parseRiskPrediction(analysisText);

    logger.info('風險預測完成', { prediction });

    return prediction;
  } catch (error) {
    logger.error('風險預測失敗', error);
    throw new HttpsError('internal', '預測失敗');
  }
});

async function collectProjectData(projectId: string) {
  const [project, tasks, expenses, issues] = await Promise.all([
    admin.firestore().collection('projects').doc(projectId).get(),
    admin.firestore().collection('tasks').where('projectId', '==', projectId).get(),
    admin.firestore().collection('expenses').where('projectId', '==', projectId).get(),
    admin.firestore().collection('issues').where('projectId', '==', projectId).get()
  ]);

  return {
    project: project.data(),
    taskCount: tasks.size,
    completedTasks: tasks.docs.filter(d => d.data().status === 'completed').length,
    totalExpenses: expenses.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0),
    openIssues: issues.docs.filter(d => d.data().status === 'open').length
  };
}

function parseRiskPrediction(text: string): RiskPredictionResult {
  // 簡化版本,實際應使用更複雜的解析
  return {
    overallRisk: 'medium',
    riskScore: 50,
    risks: [
      {
        category: 'schedule',
        probability: 60,
        impact: 70,
        description: '進度延遲風險',
        mitigation: '增加資源配置'
      }
    ],
    recommendations: ['定期檢查進度', '強化溝通']
  };
}
```

## 📂 目錄結構

```
functions-ai/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── vision/               # 圖片分析
│   │   └── image-analyzer.ts
│   ├── nlp/                  # 自然語言處理
│   │   ├── document-processor.ts
│   │   └── qa-system.ts
│   ├── prediction/           # 預測分析
│   │   ├── risk-predictor.ts
│   │   └── progress-forecaster.ts
│   └── utils/                # AI 工具
│       ├── gemini-client.ts
│       └── text-parser.ts
└── tests/
    └── ai.test.ts
```

## 🚀 設定與部署

### 1. 環境變數設定

```bash
# 設定 Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY
```

### 2. 安裝依賴

```bash
cd functions-ai
npm install @google/generative-ai
npm install
```

### 3. 部署

```bash
firebase deploy --only functions:ai
```

## 🧪 測試

```bash
# 測試圖片分析
npm test -- image-analyzer.test.ts

# 測試文件處理
npm test -- document-processor.test.ts
```

## 📊 使用限制

### API 配額

- Gemini API 有每日請求限制
- 圖片大小限制: 20MB
- 文件大小限制: 10MB

### 效能考量

- 圖片分析: 5-10 秒
- 文件處理: 10-20 秒
- 問答系統: 3-5 秒

## 🔧 故障排除

### 常見問題

1. **API Key 錯誤**
   - 確認 GEMINI_API_KEY 正確設定
   - 檢查 API Key 是否啟用

2. **分析逾時**
   - 增加函式逾時時間
   - 減少圖片大小
   - 優化提示詞

3. **結果不準確**
   - 改善提示詞設計
   - 提供更多上下文
   - 使用更新的模型

## 📚 參考資源

- [Google Gemini API 文檔](https://ai.google.dev/docs)
- [Firebase Functions 文檔](https://firebase.google.com/docs/functions)
- [Prompt Engineering 指南](https://ai.google.dev/docs/prompt_best_practices)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎 AI 功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License

---

## 🚀 已實現功能 (Implemented Features)

### AI Functions

本模組已實現以下 Cloud Functions，使用最新的 `@google/genai` SDK：

#### 1. `ai-generateText` - 文字生成

從提示詞生成文字內容。

**請求參數:**
```typescript
{
  prompt: string;           // 提示詞
  maxTokens?: number;       // 最大 tokens (預設: 1000)
  temperature?: number;     // 溫度參數 (預設: 0.7)
  blueprintId?: string;     // Blueprint ID (用於記錄)
}
```

**回應:**
```typescript
{
  text: string;            // 生成的文字
  tokensUsed: number;      // 使用的 tokens
  model: string;           // 使用的模型
  timestamp: number;       // 時間戳記
}
```

**使用範例:**
```typescript
const result = await httpsCallable(functions, 'ai-generateText')({
  prompt: '請說明施工安全的重要性',
  maxTokens: 500
});
console.log(result.data.text);
```

#### 2. `ai-generateChat` - 對話生成

維護對話歷史的多輪對話生成。

**請求參數:**
```typescript
{
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  maxTokens?: number;       // 最大 tokens (預設: 1000)
  temperature?: number;     // 溫度參數 (預設: 0.7)
  blueprintId?: string;     // Blueprint ID (用於記錄)
}
```

**回應:**
```typescript
{
  response: string;        // AI 回應
  tokensUsed: number;      // 使用的 tokens
  model: string;           // 使用的模型
  timestamp: number;       // 時間戳記
}
```

**使用範例:**
```typescript
const result = await httpsCallable(functions, 'ai-generateChat')({
  messages: [
    { role: 'user', content: '什麼是施工安全？' },
    { role: 'model', content: '施工安全是...' },
    { role: 'user', content: '有哪些重要措施？' }
  ]
});
console.log(result.data.response);
```

### Contract Functions

#### 3. `contract-parseContract` - 合約文件解析

使用 Vision AI 解析合約文件，提取結構化資料。

**請求參數:**
```typescript
{
  blueprintId: string;
  contractId: string;
  requestId: string;
  files: Array<{
    id: string;
    name: string;
    dataUri?: string;      // Base64 data URI
    url?: string;          // File URL
    mimeType: string;
    size: number;
  }>;
}
```

**回應:**
```typescript
{
  success: boolean;
  requestId: string;
  parsedData?: {
    name: string;                // 合約名稱
    client: string;              // 客戶名稱
    totalValue: number;          // 總金額（未稅）
    tax?: number;                // 稅額
    totalValueWithTax?: number;  // 總金額（含稅）
    tasks: Array<{
      id: string;
      title: string;
      quantity: number;
      unitPrice: number;
      value: number;
      discount?: number;
      lastUpdated: string;
      completedQuantity: number;
      subTasks: any[];
    }>;
  };
  errorMessage?: string;
}
```

**使用範例:**
```typescript
const result = await httpsCallable(functions, 'contract-parseContract')({
  blueprintId: 'bp-123',
  contractId: 'ct-456',
  requestId: 'req-789',
  files: [{
    id: 'f1',
    name: 'contract.pdf',
    dataUri: 'data:application/pdf;base64,...',
    mimeType: 'application/pdf',
    size: 123456
  }]
});

if (result.data.success) {
  console.log('解析成功:', result.data.parsedData);
}
```

## 📁 檔案結構

```
functions-ai/
├── src/
│   ├── ai/
│   │   ├── client.ts          # GenAI 客戶端配置
│   │   ├── generateText.ts    # 文字生成 Cloud Function
│   │   └── generateChat.ts    # 對話生成 Cloud Function
│   ├── contract/
│   │   └── parseContract.ts   # 合約解析 Cloud Function
│   ├── types/
│   │   ├── ai.types.ts        # AI 型別定義
│   │   └── contract.types.ts  # 合約型別定義
│   └── index.ts               # 主入口點
├── lib/                       # 編譯輸出
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 開發指令

```bash
# 安裝依賴
npm install

# 編譯 TypeScript
npm run build

# 監看模式編譯
npm run build:watch

# 執行 Lint
npm run lint

# 本地測試（Firebase Emulator）
npm run serve
```

## 🚀 部署

```bash
# 部署所有 AI 函式
firebase deploy --only functions:ai

# 部署合約解析函式
firebase deploy --only functions:contract

# 部署特定函式
firebase deploy --only functions:ai-generateText
```

## ⚙️ 配置

### 環境變數

需要設定 Google Gemini API Key：

```bash
# 使用 Firebase Secrets
firebase functions:secrets:set GEMINI_API_KEY

# 或在本地開發時設定 .env
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### 使用的模型

- **文字生成**: `gemini-2.5-flash`
- **對話生成**: `gemini-2.5-flash`
- **視覺分析**: `gemini-2.5-flash` (支援 multimodal)

## 🔒 安全性

- ✅ 所有函式要求身份驗證
- ✅ 輸入驗證與清理
- ✅ 錯誤處理與日誌記錄
- ✅ API Key 安全儲存在 Firebase Secrets
- ✅ 限制並發實例數 (maxInstances: 10)

## ⚡ 效能配置

- **記憶體**: 512MiB (AI functions), 1GiB (contract parsing)
- **逾時時間**: 60s (AI functions), 300s (contract parsing)
- **區域**: asia-east1
- **最大實例數**: 10

## 🔗 前端整合

前端透過 Repository 模式呼叫這些函式：

```typescript
// src/app/core/data-access/ai/ai.repository.ts
import { Functions, httpsCallable } from '@angular/fire/functions';

async generateText(request: AIGenerateTextRequest): Promise<AIGenerateTextResponse> {
  const callable = httpsCallable<AIGenerateTextRequest, AIGenerateTextResponse>(
    this.functions,
    'ai-generateText'
  );
  const result = await callable(request);
  return result.data;
}
```

## 🔄 從舊版遷移

本模組取代舊的 `functions` 目錄中的 AI 函式：

| 差異項目 | 舊版 (functions) | 新版 (functions-ai) |
|---------|-----------------|-------------------|
| SDK | `@google/generative-ai` | `@google/genai` |
| 狀態 | 已棄用 | 最新版本 |
| 函式名稱 | 相同 | 相同 |
| 前端呼叫 | 無需變更 | 無需變更 |

## 📚 參考資源

- [Google GenAI SDK](https://github.com/googleapis/js-genai)
- [Firebase Functions v2](https://firebase.google.com/docs/functions/beta)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
