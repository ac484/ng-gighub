# API Integration Documentation

中央氣象署（CWA）開放資料平台 API 整合方案文件

---

## 📚 文件總覽

本目錄包含 GigHub 專案整合中央氣象署開放資料平台 API 的完整分析與實作指南。

### 文件清單

| 文件 | 說明 | 適用對象 |
|------|------|---------|
| [**CWA_API_INTEGRATION_ANALYSIS.md**](./CWA_API_INTEGRATION_ANALYSIS.md) | 完整的整合方案分析文件 | 架構師、技術決策者 |
| [**QUICK_COMPARISON.md**](./QUICK_COMPARISON.md) | 快速比較表與決策樹 | 開發者、專案經理 |

---

## 🎯 快速導覽

### 如果你想要...

#### 了解兩種方案的差異
→ 閱讀 [快速比較表](./QUICK_COMPARISON.md)

#### 深入分析技術細節
→ 閱讀 [完整分析文件](./CWA_API_INTEGRATION_ANALYSIS.md)

#### 立即開始實作
→ 參考 [實作指南](./CWA_API_INTEGRATION_ANALYSIS.md#實作指南)

#### 評估成本與效能
→ 參考 [成本分析](./CWA_API_INTEGRATION_ANALYSIS.md#成本分析) 和 [效能分析](./CWA_API_INTEGRATION_ANALYSIS.md#效能分析)

#### 了解安全性考量
→ 參考 [安全性分析](./CWA_API_INTEGRATION_ANALYSIS.md#安全性分析)

---

## 📋 兩種方案總覽

### 方案一：透過 Firebase Functions 整合

**特色**: 後端代理模式，API Key 安全保護

```
Angular App → Firebase Functions → CWA API
```

**適用場景**:
- ✅ 企業級多使用者應用
- ✅ 需要 API Key 保護
- ✅ 需要統一管理與監控
- ✅ 跨平台共用（Web + Mobile）

**已有實作**: `functions-integration/src/weather/`

### 方案二：前端直接整合

**特色**: 客戶端直接呼叫，低延遲

```
Angular App → CWA API
```

**適用場景**:
- ✅ 快速開發 Demo/POC
- ✅ 內部工具或小型應用
- ✅ 對延遲敏感的即時應用
- ✅ 開發資源有限

**需要實作**: 參考實作指南

---

## 🚀 快速開始

### 方案一：使用現有 Functions（推薦）

```bash
# 1. 設定 CWA API Key
firebase functions:secrets:set CWA_API_KEY

# 2. 部署 Functions
firebase deploy --only functions:functions-integration

# 3. 在 Angular 中使用
# 參考 src/app/routes/blueprint/modules/weather/services/weather.service.ts
```

### 方案二：前端直接整合

```typescript
// 1. 設定環境變數
// src/environments/environment.ts
export const environment = {
  cwaApi: {
    baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    apiKey: 'YOUR_CWA_API_KEY'
  }
};

// 2. 建立 Service
// src/app/core/services/cwa-direct.service.ts
// 參考完整分析文件中的實作範例
```

---

## 📊 核心比較

| 項目 | 方案一 | 方案二 |
|------|-------|-------|
| **API Key 安全** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **開發速度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **維護成本** | ⭐⭐ | ⭐⭐⭐⭐ |
| **運行成本** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **請求速度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **可擴展性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

詳細比較請參考 [快速比較表](./QUICK_COMPARISON.md)

---

## 💡 GigHub 專案建議

基於 GigHub 的使用情境（工地施工進度追蹤管理系統），我們建議：

### ✅ 推薦：方案一（透過 Firebase Functions）

**理由**:
1. 多使用者協作需求
2. 需要角色權限控制
3. 資料集中式管理
4. 未來可能擴展至 Mobile App
5. 需要監控與日誌追蹤

**現狀**: 專案已實作 `functions-integration` 模組，可直接使用。

### 實作步驟

1. **設定 API Key** (5分鐘)
   ```bash
   firebase functions:secrets:set CWA_API_KEY
   ```

2. **部署 Functions** (10分鐘)
   ```bash
   firebase deploy --only functions:functions-integration
   ```

3. **整合至 Angular** (30分鐘)
   - 使用現有的 `WeatherService`
   - 實作 UI 元件
   - 測試驗證

4. **監控設定** (15分鐘)
   - 設定 Firebase Monitoring
   - 設定告警規則

**總時間**: 約 1 小時即可完成整合

---

## 🔗 相關資源

### 內部文件
- [Functions Integration 架構](../../functions-integration/src/weather/ARCHITECTURE.md)
- [Functions Integration 快速開始](../../functions-integration/src/weather/QUICKSTART.md)
- [Angular Weather Service](../../src/app/routes/blueprint/modules/weather/services/weather.service.ts)
- [Climate Module CWB Service](../../src/app/core/blueprint/modules/implementations/climate/services/cwb-weather.service.ts)

### 外部資源
- [CWA 開放資料平台](https://opendata.cwa.gov.tw/)
- [CWA API 文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- [Firebase Functions 文件](https://firebase.google.com/docs/functions)
- [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env)
- [Angular HttpClient](https://angular.dev/guide/http)

---

## 📞 支援與協助

### 常見問題

#### Q: CWA API Key 如何申請？
A: 前往 [CWA 開放資料平台](https://opendata.cwa.gov.tw/userLogin) 註冊帳號後申請。

#### Q: API 有請求限制嗎？
A: 免費版每日 1,000-5,000 次請求，依申請等級而異。

#### Q: 方案一的 Cold Start 如何避免？
A: 設定 `minInstances: 1` 保持至少一個實例熱啟動。

#### Q: 方案二的 API Key 暴露有何風險？
A: 可能被惡意使用，導致超過每日請求限制，影響所有使用者。

#### Q: 可以混合使用兩種方案嗎？
A: 可以，例如：即時觀測使用方案二（低延遲），預報與警報使用方案一（安全）。

### 技術支援

遇到問題？請參考：
1. [完整分析文件](./CWA_API_INTEGRATION_ANALYSIS.md) 的常見問題章節
2. 專案內 `AGENTS.md` 中的技術支援聯絡方式
3. Firebase Functions 日誌進行除錯

---

## 📝 文件版本

| 版本 | 日期 | 更新內容 |
|------|------|---------|
| 1.0 | 2025-12-21 | 初版發布 |

---

## 👥 貢獻者

- **文件作者**: GigHub 開發團隊
- **技術審查**: 架構師團隊
- **最後更新**: 2025-12-21

---

**文件狀態**: ✅ 完成  
**維護狀態**: 🟢 持續維護
