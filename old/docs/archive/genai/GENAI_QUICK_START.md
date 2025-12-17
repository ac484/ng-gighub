# 🚀 Google Generative AI 整合快速入門指南

> **快速參考**: 5 分鐘了解如何開始整合 Google AI  
> **完整設計**: 請參閱 `GOOGLE_GENAI_INTEGRATION_DESIGN.md`

---

## 📋 前置需求

### 必要條件
- [x] Firebase 專案已建立
- [x] Firebase Blaze 計費方案（使用 Secret Manager）
- [ ] Google AI API Key（需申請）
- [x] Node.js 24
- [x] Angular 20.3.0
- [x] @angular/fire 20.0.1

### 取得 API Key
1. 前往 <a href="https://makersuite.google.com/app/apikey">Google AI Studio</a>
2. 登入 Google 帳號
3. 點擊「Create API Key」
4. 複製產生的 API Key

---

## ⚡ 快速開始（30 分鐘）

### Step 1: 安裝套件（5 分鐘）
```bash
# 在 functions 目錄
cd functions
npm install @google/generative-ai
```

### Step 2: 設定 API Key（2 分鐘）
```bash
# 設定 Firebase Secret
firebase functions:secrets:set GOOGLE_AI_API_KEY
# 提示時貼上您的 API Key
```

### Step 3: 建立 Functions 檔案（10 分鐘）

#### 建立目錄結構
```bash
mkdir -p functions/src/ai
touch functions/src/ai/index.ts
touch functions/src/ai/types.ts
touch functions/src/ai/config.ts
touch functions/src/ai/generateText.ts
```

#### 複製範例程式碼
從設計文件附錄 A 複製以下檔案：
- `types.ts` - 類型定義
- `config.ts` - 配置
- `generateText.ts` - 主要 Function
- `index.ts` - 匯出

### Step 4: 更新主要 index.ts（3 分鐘）
```typescript
// functions/src/index.ts
import { setGlobalOptions } from 'firebase-functions';
import * as aiFunctions from './ai';

setGlobalOptions({ maxInstances: 10 });

export const ai = {
  generateText: aiFunctions.generateText,
};
```

### Step 5: 本地測試（10 分鐘）
```bash
# Terminal 1: 啟動 Emulator
cd functions
npm run serve

# Terminal 2: 測試呼叫
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/ai-generateText \
  -H "Content-Type: application/json" \
  -d '{"data":{"prompt":"Hello, AI!"}}'
```

---

## 🎯 Angular 整合（20 分鐘）

### Step 1: 建立 Repository（5 分鐘）
```bash
mkdir -p src/app/core/data-access/ai
touch src/app/core/data-access/ai/ai.repository.ts
touch src/app/core/data-access/ai/ai.types.ts
```

從設計文件附錄 B 複製程式碼。

### Step 2: 建立 Service（5 分鐘）
```bash
mkdir -p src/app/core/services/ai
touch src/app/core/services/ai/ai.service.ts
```

從設計文件附錄 C 複製程式碼。

### Step 3: 建立 Store（5 分鐘）
```bash
mkdir -p src/app/core/facades/ai
touch src/app/core/facades/ai/ai.store.ts
```

從設計文件附錄 D 複製程式碼。

### Step 4: 使用範例（5 分鐘）
```typescript
import { Component, signal, inject } from '@angular/core';
import { AIStore } from '@core/facades/ai/ai.store';

@Component({
  selector: 'app-my-component',
  template: `
    <input [(ngModel)]="prompt" placeholder="輸入提示詞...">
    <button (click)="generate()" [disabled]="loading()">
      生成
    </button>
    @if (lastResponse()) {
      <p>{{ lastResponse() }}</p>
    }
  `
})
export class MyComponent {
  private aiStore = inject(AIStore);
  
  prompt = signal('');
  loading = this.aiStore.loading;
  lastResponse = this.aiStore.lastResponse;
  
  async generate() {
    await this.aiStore.generateText(this.prompt());
  }
}
```

---

## 🔐 安全檢查清單

- [ ] API Key 已儲存於 Firebase Secret Manager
- [ ] Functions 需要身份驗證
- [ ] 已設定 maxInstances 限制
- [ ] 已設定 timeout 限制
- [ ] 前端有輸入驗證
- [ ] 錯誤訊息不洩漏敏感資訊

---

## 🐛 常見問題

### Q: Function 回傳 "unauthenticated" 錯誤
**A**: 確認前端已登入 Firebase Auth：
```typescript
import { Auth } from '@angular/fire/auth';
const auth = inject(Auth);
console.log('Current user:', auth.currentUser);
```

### Q: API Key 不生效
**A**: 確認 Secret 已正確設定：
```bash
firebase functions:secrets:access GOOGLE_AI_API_KEY
```

### Q: 本地 Emulator 無法使用 Secret
**A**: 本地開發使用 `.env` 檔案：
```bash
# functions/.env
GOOGLE_AI_API_KEY=your_api_key_here
```

### Q: Timeout 錯誤
**A**: 增加 timeout 設定：
```typescript
export const generateText = onCall({
  timeoutSeconds: 120,  // 增加到 120 秒
  // ...
}, async (request) => { /* ... */ });
```

---

## 📊 成本預估

### 免費額度（Google AI）
- Gemini 2.0 Flash: 15 RPM (每分鐘請求數)
- 可以處理約 21,600 次請求/日

### Firebase Functions
- 每月免費額度: 200 萬次呼叫
- 記憶體: 400,000 GB-秒
- 網路: 5 GB

### 預估成本（每天 1000 次請求）
- **Function 成本**: < $0.01 / 日
- **AI API 成本**: 免費額度內

---

## 🚀 部署到正式環境

### 部署 Functions
```bash
cd functions
npm run build
npm run deploy
```

### 驗證部署
```bash
# 查看日誌
firebase functions:log --only ai

# 測試呼叫
# 從 Angular 應用測試即可
```

---

## 📚 延伸閱讀

- **完整設計文件**: `GOOGLE_GENAI_INTEGRATION_DESIGN.md`
- **Google AI 文檔**: https://ai.google.dev/gemini-api/docs
- **Firebase Functions 文檔**: https://firebase.google.com/docs/functions
- **@angular/fire 文檔**: https://github.com/angular/angularfire

---

## ✅ 下一步

1. [ ] 完成本快速入門步驟
2. [ ] 測試基本功能
3. [ ] 閱讀完整設計文件
4. [ ] 實作業務特定的 AI 功能
5. [ ] 整合到現有模組

---

**祝您整合順利！如有問題請參閱完整設計文件。** 🎉
