# 🚀 Google Generative AI 整合部署指南

> **狀態**: Phase 1-7 完成，準備部署  
> **建立日期**: 2025-12-14  
> **版本**: 1.0

---

## 📋 部署前檢查清單

### 必要條件
- [x] Firebase 專案已建立
- [x] Firebase Blaze 計費方案已啟用
- [x] Google AI API Key 已取得
- [x] Firebase Functions Secret 已設定
- [x] 程式碼已通過建置測試

### 程式碼檢查
- [x] TypeScript 編譯無錯誤
- [x] Angular Build 成功
- [x] 所有依賴已安裝
- [x] apphosting.yaml 已更新

---

## 🔑 部署前設定

### 1. 確認 Firebase Secret 已設定

```bash
# 檢查 Secret 是否存在
firebase functions:secrets:access GOOGLE_AI_API_KEY

# 如果未設定，執行以下命令
firebase functions:secrets:set GOOGLE_AI_API_KEY
# 輸入您的 Google AI API Key
```

### 2. 本地測試（可選）

```bash
# Terminal 1: 啟動 Firebase Emulators
cd functions
npm run serve

# Terminal 2: 啟動 Angular Dev Server
yarn start

# 訪問 http://localhost:4200/ai-demo 測試功能
```

---

## 🚀 部署步驟

### Phase 8.1: 部署 Firebase Functions

```bash
# 1. 進入 functions 目錄
cd functions

# 2. 確認依賴已安裝
npm install

# 3. 建置 Functions
npm run build

# 4. 部署到 Firebase
npm run deploy

# 或使用 firebase CLI 直接部署
firebase deploy --only functions:ai
```

**預期輸出**:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
Function URL (ai-generateText): https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/ai-generateText
Function URL (ai-generateChat): https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/ai-generateChat
```

### Phase 8.2: 驗證 Functions 部署

```bash
# 查看 Functions 日誌
firebase functions:log --only ai

# 測試 Function（需要 Firebase Auth token）
# 在瀏覽器中登入後，從開發者工具取得 token，然後：
curl -X POST https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/ai-generateText \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"prompt":"測試訊息"}}'
```

### Phase 8.3: 部署 Angular 應用

Angular 應用由 Firebase App Hosting 自動處理，無需手動部署。

**確認 apphosting.yaml 配置**:
```yaml
env:
  - variable: GOOGLE_AI_API_KEY
    secret: GOOGLE_AI_API_KEY
    availability:
      - RUNTIME
```

**觸發部署** (如需手動):
```bash
# 推送到 GitHub 後，Firebase App Hosting 會自動建置和部署
git push origin main
```

---

## ✅ 部署後驗證

### 1. 驗證 Firebase Functions

```bash
# 檢查 Functions 狀態
firebase functions:list

# 預期看到：
# ✔ ai-generateText (https)
# ✔ ai-generateChat (https)
```

### 2. 驗證 Angular 應用

1. 訪問應用 URL: `https://YOUR_PROJECT_ID.web.app`
2. 登入系統
3. 導航到 `/ai-demo`
4. 測試文字生成功能
5. 測試對話功能

### 3. 驗證 Secret 載入

```bash
# 在 Firebase Console 查看 Functions 日誌
# 確認沒有 "Secret not found" 錯誤
firebase functions:log --only ai --lines 50
```

---

## 🔍 監控與告警

### 1. 設定監控

**Firebase Console**:
1. 進入 Firebase Console > Functions
2. 查看 `ai-generateText` 和 `ai-generateChat` 的指標
3. 監控：
   - 呼叫次數
   - 錯誤率
   - 執行時間
   - 記憶體使用

### 2. 設定告警

**建議告警**:
- 錯誤率 > 5%
- 平均執行時間 > 30 秒
- 每日呼叫次數 > 10,000 次（成本控制）

**設定方式**:
```bash
# 在 Firebase Console > Functions > Metrics
# 點擊 "Create Alert" 設定告警
```

### 3. 成本監控

**Google Cloud Console**:
1. 進入 Billing > Reports
2. 篩選 Firebase Functions 和 Generative AI API
3. 設定預算告警：
   - 每日預算：$1 USD
   - 每月預算：$30 USD

---

## 🐛 常見問題排查

### 問題 1: Function 回傳 "Secret not found"

**原因**: Secret 未正確設定

**解決方案**:
```bash
# 重新設定 Secret
firebase functions:secrets:set GOOGLE_AI_API_KEY

# 重新部署
cd functions
npm run deploy
```

### 問題 2: "Unauthenticated" 錯誤

**原因**: 使用者未登入或 token 失效

**解決方案**:
- 確認使用者已登入 Firebase Auth
- 檢查 token 是否有效
- 在開發者工具查看 Network 請求

### 問題 3: "Resource exhausted" 錯誤

**原因**: 請求過於頻繁，超過速率限制

**解決方案**:
- 增加前端 debounce 時間
- 檢查是否有惡意請求
- 考慮增加 maxInstances（會增加成本）

### 問題 4: Function 超時

**原因**: AI API 回應緩慢

**解決方案**:
```typescript
// 增加 timeout 設定（functions/src/ai/generateText.ts）
export const generateText = onCall({
  timeoutSeconds: 120,  // 增加到 120 秒
  // ...
});
```

### 問題 5: 前端無法呼叫 Function

**原因**: CORS 問題或 Firebase 配置錯誤

**解決方案**:
- Callable Functions 自動處理 CORS，無需額外配置
- 檢查 Firebase 初始化是否正確
- 確認使用 `httpsCallable` 而非 `httpsOnCall`

---

## 📊 效能優化建議

### 1. 冷啟動優化

```typescript
// functions/src/index.ts
import { setGlobalOptions } from 'firebase-functions';

// 增加最小實例數（會增加成本）
setGlobalOptions({
  minInstances: 1,  // 保持至少 1 個實例運行
  maxInstances: 10
});
```

### 2. 記憶體優化

根據實際使用情況調整：
```typescript
export const generateText = onCall({
  memory: "1GiB",  // 如果需要處理大量文字
  // ...
});
```

### 3. 前端快取

```typescript
// 在 AIStore 中添加快取邏輯
private cache = new Map<string, AIGenerateTextResponse>();

async generateText(prompt: string): Promise<void> {
  // 檢查快取
  if (this.cache.has(prompt)) {
    const cached = this.cache.get(prompt)!;
    this._state.update(state => ({
      ...state,
      lastResponse: cached.text,
    }));
    return;
  }
  
  // ... 正常流程
}
```

---

## 🔐 安全性最佳實踐

### 1. API Key 管理

- ✅ 使用 Firebase Secret Manager
- ✅ 定期輪替 API Key
- ✅ 監控 API Key 使用情況
- ✅ 限制 API Key 的使用範圍

### 2. 速率限制

```typescript
// 在 Firebase Console 設定 Cloud Functions 配額
// 或使用 Firebase App Check
import { httpsCallableFromURL } from '@angular/fire/functions';
import { getToken } from 'firebase/app-check';

// 添加 App Check token
const token = await getToken(appCheck);
```

### 3. 輸入驗證

已在 Functions 中實作：
- 提示詞長度限制（10000 字元）
- 空值檢查
- 格式驗證

### 4. 錯誤訊息

確保錯誤訊息不洩漏敏感資訊：
```typescript
// ✅ 正確
throw new HttpsError('internal', 'Failed to generate text');

// ❌ 錯誤
throw new HttpsError('internal', `API Key: ${apiKey} is invalid`);
```

---

## 📈 成本估算

### 預期成本（每日 1000 次請求）

**Google AI API**:
- Gemini 2.0 Flash: 免費額度內
- 15 RPM × 60 × 24 = 21,600 次請求/日

**Firebase Functions**:
- 呼叫次數: 1000 次 × $0.40 / 1,000,000 = $0.0004
- 記憶體: 1000 × 512MB × 3s × $0.0000025 / GB-秒 ≈ $0.004
- **總計**: < $0.01 / 日

**總成本**: < $0.01 / 日 或 < $0.30 / 月

---

## ✅ 部署完成檢查清單

- [ ] Firebase Functions 部署成功
- [ ] Functions 日誌無錯誤
- [ ] Secret 正確載入
- [ ] Angular 應用可訪問
- [ ] `/ai-demo` 路由可用
- [ ] 文字生成功能正常
- [ ] 對話功能正常
- [ ] 錯誤處理正常
- [ ] Token 統計顯示正確
- [ ] 監控告警已設定
- [ ] 成本預算已設定

---

## 📞 支援與回饋

**遇到問題？**
1. 查看 Firebase Functions 日誌
2. 檢查瀏覽器開發者工具 Console
3. 參考常見問題排查章節
4. 查閱完整設計文件：`GOOGLE_GENAI_INTEGRATION_DESIGN.md`

**文檔套件**:
- `GOOGLE_GENAI_INTEGRATION_DESIGN.md` - 完整設計文件
- `GENAI_QUICK_START.md` - 快速入門指南
- `GENAI_IMPLEMENTATION_CHECKLIST.md` - 實作檢查清單
- `GENAI_INTEGRATION_INDEX.md` - 文檔索引
- `GENAI_DEPLOYMENT_GUIDE.md` - 本文件

---

**部署指南完成！祝您部署順利！** 🚀
