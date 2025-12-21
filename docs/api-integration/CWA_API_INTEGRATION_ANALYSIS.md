# 中央氣象署開放資料平台 API 整合方案分析

> **專案**: GigHub 工地施工進度追蹤管理系統  
> **API 來源**: [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)  
> **文件版本**: 1.0  
> **最後更新**: 2025-12-21

---

## 📋 目錄

1. [概述](#概述)
2. [方案比較總覽](#方案比較總覽)
3. [方案一：透過 Firebase Functions 整合](#方案一透過-firebase-functions-整合)
4. [方案二：前端直接整合](#方案二前端直接整合)
5. [架構圖](#架構圖)
6. [成本分析](#成本分析)
7. [安全性分析](#安全性分析)
8. [效能分析](#效能分析)
9. [建議方案](#建議方案)
10. [實作指南](#實作指南)

---

## 概述

本文件深入分析在 Firebase 平台上整合中央氣象署（CWA）開放資料平台 API 的兩種方案：

1. **透過 Firebase Functions (functions-integration)** - 後端代理模式
2. **前端直接整合** - 客戶端直接呼叫模式

### 專案背景

- **專案名稱**: GigHub（工地施工進度追蹤管理系統）
- **技術棧**: Angular 20 + Firebase Platform
- **現有實作**: 已有 `functions-integration` 模組實作 CWA API 封裝
- **使用情境**: 天氣預報、即時觀測、天氣警報

---

## 方案比較總覽

| 比較項目 | 方案一：Functions Integration | 方案二：前端直接整合 |
|---------|------------------------------|-------------------|
| **API Key 安全性** | ✅ 高（後端保護） | ⚠️ 中（需前端配置） |
| **開發複雜度** | ⚠️ 中高（需維護 Functions） | ✅ 低（直接呼叫） |
| **維護成本** | ⚠️ 中高（雙層維護） | ✅ 低（單層維護） |
| **Firebase 費用** | ⚠️ 中高（Functions 執行費用） | ✅ 低（僅 Firestore 快取） |
| **請求延遲** | ⚠️ 較高（多一跳） | ✅ 低（直接請求） |
| **快取策略** | ✅ 集中式（Firestore） | ✅ 分散式（瀏覽器 + Firestore） |
| **錯誤處理** | ✅ 統一後端處理 | ⚠️ 前端各自處理 |
| **API 限流控制** | ✅ 後端統一控制 | ⚠️ 難以控制 |
| **認證機制** | ✅ Firebase Auth 整合 | ⚠️ 需自行管理 |
| **跨平台共用** | ✅ 可供多平台使用 | ❌ 僅限 Web |
| **離線支援** | ⚠️ 依賴後端 | ✅ 可配合 Service Worker |
| **即時性** | ⚠️ 較差 | ✅ 較佳 |
| **擴展性** | ✅ 易於擴展功能 | ⚠️ 前端邏輯複雜化 |

### 總結建議

- **推薦使用「方案一：透過 Firebase Functions」** 當：
  - 需要保護 API Key 安全
  - 需要統一管理 API 請求（限流、監控）
  - 需要跨平台共用（Web + Mobile）
  - 有多個用戶共用相同資料

- **推薦使用「方案二：前端直接整合」** 當：
  - API Key 可公開或無需保護
  - 單純的資料查詢需求
  - 對延遲敏感的即時應用
  - 開發資源有限，需快速實作

---

## 方案一：透過 Firebase Functions 整合

### 架構概述

```
Angular App (Frontend)
    ↓ httpsCallable()
Firebase Functions (functions-integration)
    ↓ HTTPS Request
CWA OpenData API
    ↓ Response
Firebase Functions (Cache to Firestore)
    ↓ Return Data
Angular App (Display)
```

### 優點 ✅

#### 1. 安全性強化
- **API Key 保護**: API Key 儲存在 Firebase Secret Manager，前端無法存取
- **統一認證**: 使用 Firebase Authentication 驗證使用者身份
- **權限控制**: 可實作細緻的權限檢查（如：僅特定角色可查詢）

#### 2. 集中式管理
- **統一快取**: 所有使用者共用 Firestore 快取，減少重複請求
- **API 限流**: 後端統一控制請求頻率，避免超過 CWA API 限制
- **錯誤處理**: 統一的錯誤處理與日誌記錄
- **監控追蹤**: 可透過 Firebase Functions 日誌監控 API 使用情況

#### 3. 跨平台共用
- **多客戶端支援**: Web、iOS、Android 可共用相同 Functions
- **一致性**: 所有平台使用相同的資料格式與邏輯

#### 4. 易於擴展
- **業務邏輯封裝**: 可在 Functions 中加入額外處理（如：資料轉換、聚合）
- **第三方整合**: 容易整合其他服務（如：天氣預警推播）

### 缺點 ❌

#### 1. 額外延遲
- **雙重網路請求**: 前端 → Functions → CWA API，增加 100-300ms 延遲
- **Cold Start**: Functions 冷啟動可能增加 1-3 秒延遲（首次呼叫）

#### 2. 開發與維護成本
- **雙層維護**: 需維護 Functions 程式碼與前端程式碼
- **部署複雜**: 需要額外的 Functions 部署流程
- **除錯困難**: 錯誤可能發生在前端或後端，增加除錯難度

#### 3. Firebase 費用
- **Functions 執行費用**: 每次請求都會產生 Functions 執行費用
- **網路流量費用**: Functions 對外請求產生的網路流量費用
- **Firestore 讀寫費用**: 快取讀寫費用

### 現有實作分析

專案中已實作 `functions-integration` 模組，提供以下功能：

#### Functions 端點

```typescript
// functions-integration/src/weather/functions/index.ts

// 1. 36小時天氣預報
export const getForecast36Hour = onCall({ ... }, async (request) => {
  // 驗證使用者認證
  // 呼叫 CWA API
  // 快取至 Firestore
  // 返回資料
});

// 2. 7天天氣預報
export const getForecast7Day = onCall({ ... }, async (request) => { ... });

// 3. 鄉鎮天氣預報
export const getTownshipForecast = onCall({ ... }, async (request) => { ... });

// 4. 氣象站觀測
export const getObservation = onCall({ ... }, async (request) => { ... });

// 5. 10分鐘觀測
export const get10MinObservation = onCall({ ... }, async (request) => { ... });

// 6. 雨量觀測
export const getRainfallObservation = onCall({ ... }, async (request) => { ... });

// 7. UV 指數
export const getUvIndexObservation = onCall({ ... }, async (request) => { ... });

// 8. 天氣警報
export const getWeatherWarnings = onCall({ ... }, async (request) => { ... });
```

#### Angular Service 整合

```typescript
// src/app/routes/blueprint/modules/weather/services/weather.service.ts

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly functions = inject(Functions);
  
  // 建立 Callable Functions
  private readonly getForecastCallable = httpsCallable<
    { countyName: string }, 
    any
  >(this.functions, 'getForecast36Hour');
  
  async getForecast(countyName: string): Promise<WeatherForecast | null> {
    this._loading.set(true);
    
    try {
      const result = await this.getForecastCallable({ countyName });
      // 處理資料
      return transformedData;
    } catch (error) {
      this._error.set(error.message);
      return null;
    } finally {
      this._loading.set(false);
    }
  }
}
```

#### 快取機制

```typescript
// functions-integration/src/weather/services/cwa-weather.service.ts

class CwaWeatherService {
  // Firestore 快取配置
  private readonly cacheTTL = {
    forecast: 3600,      // 預報：1小時
    observation: 600,    // 觀測：10分鐘
    alert: 300          // 警報：5分鐘
  };
  
  // 檢查快取
  private async getFromCache<T>(key: string): Promise<T | null> {
    const doc = await this.firestore
      .collection('weather_cache')
      .doc(key)
      .get();
      
    if (!doc.exists || this.isExpired(doc.data())) {
      return null;
    }
    
    return doc.data() as T;
  }
  
  // 儲存快取
  private async saveToCache<T>(key: string, data: T, ttl: number) {
    await this.firestore
      .collection('weather_cache')
      .doc(key)
      .set({
        data,
        cachedAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + ttl * 1000)
      });
  }
}
```

---

## 方案二：前端直接整合

### 架構概述

```
Angular App (Frontend)
    ↓ HttpClient + API Key
CWA OpenData API
    ↓ Response
Angular Service (Cache Locally)
    ↓ Return Data
Angular Component (Display)
```

### 優點 ✅

#### 1. 簡單直接
- **開發快速**: 直接使用 Angular HttpClient 呼叫 API
- **單層維護**: 僅需維護前端程式碼
- **除錯容易**: 錯誤直接在前端顯示，易於除錯

#### 2. 低延遲
- **直接請求**: 無中間層，減少 100-300ms 延遲
- **無 Cold Start**: 無 Functions 冷啟動問題

#### 3. 低成本
- **無 Functions 費用**: 不使用 Firebase Functions，節省執行費用
- **僅快取費用**: 可選擇性使用 Firestore 快取，或使用瀏覽器快取

#### 4. 離線支援
- **Service Worker**: 可配合 Service Worker 實作離線快取
- **本地儲存**: 使用 IndexedDB 或 LocalStorage 快取資料

### 缺點 ❌

#### 1. 安全性風險
- **API Key 暴露**: API Key 必須包含在前端程式碼中，可能被惡意使用
- **無統一認證**: 無法透過 Firebase Auth 驗證使用者
- **CORS 限制**: 可能遇到跨域請求問題（CWA API 支援 CORS）

#### 2. 難以管理
- **API 限流**: 無法統一控制請求頻率，可能超過 CWA API 限制
- **重複請求**: 多個使用者可能重複請求相同資料
- **錯誤處理**: 需在前端各自處理不同錯誤情境

#### 3. 僅限 Web
- **無跨平台**: 無法供 Mobile App 使用
- **邏輯重複**: 若有 Mobile App，需重複實作相同邏輯

### 實作設置需求

#### 1. CWA API Key 申請

```bash
# 步驟 1：前往 CWA 開放資料平台
https://opendata.cwa.gov.tw/userLogin

# 步驟 2：註冊帳號
- 填寫基本資料
- 驗證 Email
- 登入系統

# 步驟 3：申請 API 授權碼
- 點選「取得授權碼」
- 選擇使用目的（個人、研究、商業）
- 同意使用條款
- 取得 API Key（格式：CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX）

# 步驟 4：記錄 API 使用限制
- 免費版：每日 1,000-5,000 次請求
- 付費版：依需求調整限制
```

#### 2. 環境變數配置

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    // Firebase 配置
  },
  cwaApi: {
    baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    apiKey: 'CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' // ⚠️ 會暴露在前端
  }
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  firebase: {
    // Firebase 配置
  },
  cwaApi: {
    baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
    apiKey: process.env['CWA_API_KEY'] || 'CWB-FALLBACK-KEY' // ⚠️ 仍會暴露
  }
};
```

#### 3. HttpClient 模組配置

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        // 可加入 API Key Interceptor
      ])
    ),
    // 其他 providers
  ]
};
```

#### 4. CORS 處理

CWA API 已啟用 CORS，但仍需注意：

```typescript
// HttpClient 預設處理 CORS
// 無需額外配置，但需確保請求標頭正確

const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  // ⚠️ 不要設定 Authorization header，使用 query parameter
});
```

#### 5. Service 實作

```typescript
// src/app/core/services/cwa-direct.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class CwaDirectService {
  private readonly http = inject(HttpClient);
  private readonly config = environment.cwaApi;
  
  // 狀態管理
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  /**
   * 取得 36 小時天氣預報
   */
  async get36HourForecast(countyName: string): Promise<any> {
    this._loading.set(true);
    this._error.set(null);
    
    // ⚠️ API Key 必須放在 query parameter，不是 header
    const params = new HttpParams()
      .set('Authorization', this.config.apiKey)
      .set('locationName', countyName);
    
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.config.baseUrl}/F-C0032-001`, { params }).pipe(
          timeout(30000),
          retry({ count: 3, delay: 1000 }),
          catchError(this.handleError.bind(this))
        )
      );
      
      return response;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = '發生未知錯誤';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `網路錯誤: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'API Key 無效或已過期';
          break;
        case 403:
          errorMessage = 'API Key 無存取權限';
          break;
        case 429:
          errorMessage = 'API 請求次數超過限制（每日額度已用完）';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'CWA API 伺服器暫時無法服務';
          break;
        default:
          errorMessage = `HTTP ${error.status}: ${error.message}`;
      }
    }
    
    console.error('[CwaDirectService] Error:', errorMessage, error);
    throw new Error(errorMessage);
  }
}
```

#### 6. 本地快取實作

```typescript
// src/app/core/services/cwa-cache.service.ts
@Injectable({ providedIn: 'root' })
export class CwaCacheService {
  private readonly CACHE_PREFIX = 'cwa_cache_';
  private readonly DEFAULT_TTL = 3600; // 1 小時（秒）
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!item) return null;
      
      const cached = JSON.parse(item);
      
      // 檢查是否過期
      if (Date.now() > cached.expiresAt) {
        this.remove(key);
        return null;
      }
      
      return cached.data as T;
    } catch {
      return null;
    }
  }
  
  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    try {
      const cached = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000
      };
      
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.error('[CwaCacheService] Failed to save cache:', error);
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }
  
  clearAll(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX)
    );
    keys.forEach(key => localStorage.removeItem(key));
  }
  
  clearExpired(): number {
    let count = 0;
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX)
    );
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (!item) return;
      
      try {
        const cached = JSON.parse(item);
        if (Date.now() > cached.expiresAt) {
          localStorage.removeItem(key);
          count++;
        }
      } catch {
        // 清除損壞的快取
        localStorage.removeItem(key);
        count++;
      }
    });
    
    return count;
  }
}
```

#### 7. Service Worker 離線支援（進階）

```typescript
// ngsw-config.json（Angular Service Worker 配置）
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "cwa-api",
      "urls": ["https://opendata.cwa.gov.tw/api/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "30s",
        "strategy": "performance"
      }
    }
  ]
}
```

---

## 架構圖

### 方案一：透過 Firebase Functions

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WeatherService (Angular)                           │   │
│  │  - inject(Functions)                                │   │
│  │  - httpsCallable('getForecast36Hour')              │   │
│  │  - Signals for state management                     │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTPS Callable
                          │ (Firebase Auth Required)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Firebase Functions (functions-integration)      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Weather Cloud Functions                            │   │
│  │  - validateAuth()                                   │   │
│  │  - CwaWeatherService                                │   │
│  │  - Cache Management (Firestore)                     │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTPS Request
                          │ (API Key from Secret Manager)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           CWA OpenData API (opendata.cwa.gov.tw)            │
│  - Weather Forecast APIs                                    │
│  - Observation APIs                                         │
│  - Alert APIs                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Cache                           │
│  Collection: weather_cache                                  │
│  - forecast_36h_{county}                                    │
│  - observation_{station}                                    │
│  - TTL: 10min - 1hour                                       │
└─────────────────────────────────────────────────────────────┘
```

### 方案二：前端直接整合

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CwaDirectService (Angular)                         │   │
│  │  - inject(HttpClient)                               │   │
│  │  - API Key in environment.ts                        │   │
│  │  - Signals for state management                     │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTPS Request
                          │ (API Key in Query Parameter)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           CWA OpenData API (opendata.cwa.gov.tw)            │
│  - CORS Enabled                                             │
│  - API Key Authentication                                   │
│  - Rate Limiting per Key                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Browser Cache Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  LocalStorage    │  │  Service Worker  │                │
│  │  - TTL Based     │  │  - Offline First │                │
│  │  - 1-hour cache  │  │  - Background    │                │
│  │                  │  │    Sync          │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 成本分析

### 方案一：Firebase Functions 成本

#### Firebase Functions 定價（Asia-East1）
- **執行時間**: $0.0000167 / GB-秒
- **請求次數**: $0.40 / 百萬次請求
- **網路流量**: $0.12 / GB（出站）

#### 範例試算（月使用量）

假設每月：
- **使用者數**: 1,000 人
- **平均每人請求**: 30 次/月
- **總請求數**: 30,000 次/月
- **平均執行時間**: 500ms @ 256MB
- **平均回應大小**: 50KB

**成本計算**:
```
1. 執行費用:
   30,000 請求 × 0.5 秒 × 0.25 GB × $0.0000167 = $0.063

2. 請求費用:
   30,000 請求 / 1,000,000 × $0.40 = $0.012

3. 網路流量:
   30,000 請求 × 50 KB / 1,024 / 1,024 GB × $0.12 = $0.172

總計: $0.25 / 月
```

#### Firestore 快取成本
- **寫入**: 30,000 次 × $0.18 / 百萬 = $0.0054
- **讀取**: 假設 70% 命中率 = 21,000 次 × $0.06 / 百萬 = $0.0013
- **儲存**: 假設 500 個快取項 × 10KB = 5MB ≈ $0.0001

**Firestore 總計**: $0.007 / 月

**方案一總成本**: **約 $0.26 / 月** （1,000 使用者，30,000 請求）

### 方案二：前端直接整合成本

#### 無 Firebase 費用（僅 CWA API）
- **Functions 費用**: $0
- **網路流量**: $0（由使用者瀏覽器承擔）

#### 可選的 Firestore 快取（若使用）
- **寫入/讀取**: 同方案一（若選擇使用）
- **本地快取（localStorage）**: $0

**方案二總成本**: **$0 / 月** （不使用 Firestore 快取）

### 成本比較（月使用量）

| 使用者數 | 請求數 | 方案一（Functions） | 方案二（直接） | 差異 |
|---------|-------|-------------------|--------------|------|
| 100     | 3,000  | $0.03            | $0           | -$0.03 |
| 1,000   | 30,000 | $0.26            | $0           | -$0.26 |
| 10,000  | 300,000| $2.57            | $0           | -$2.57 |
| 50,000  | 1,500,000| $12.84        | $0           | -$12.84 |

**結論**: 使用者規模越大，方案一的成本差異越明顯。

---

## 安全性分析

### 方案一：Firebase Functions

#### 安全性優勢 ✅
1. **API Key 保護**
   - 儲存在 Firebase Secret Manager
   - 前端無法存取
   - 可定期輪換

2. **使用者認證**
   - 整合 Firebase Authentication
   - 可實作角色權限控制（RBAC）
   - 可追蹤使用者行為

3. **請求驗證**
   ```typescript
   function validateAuth(context: any): void {
     if (!context.auth) {
       throw new HttpsError('unauthenticated', 'Authentication required');
     }
     // 可額外檢查使用者角色
     if (!hasRole(context.auth.token, 'weather_viewer')) {
       throw new HttpsError('permission-denied', 'Insufficient permissions');
     }
   }
   ```

4. **API 限流**
   - 後端統一控制請求頻率
   - 可依使用者等級設定不同限制
   - 防止 API Key 被濫用

#### 安全性風險 ⚠️
1. **Functions 權限配置錯誤**: 若未正確配置 IAM 權限，可能洩漏資料
2. **日誌敏感資訊**: 需注意不記錄敏感資訊在 Functions 日誌中

### 方案二：前端直接整合

#### 安全性風險 ⚠️
1. **API Key 暴露**
   ```typescript
   // ⚠️ API Key 會出現在前端程式碼中
   const API_KEY = 'CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
   
   // ⚠️ 使用者可在瀏覽器開發者工具中看到
   // Network Tab → Request Headers → Query Parameters
   ```

2. **無使用者認證**
   - 任何人都可以使用應用程式
   - 無法追蹤使用者行為
   - 無法實作權限控制

3. **API 濫用風險**
   - 惡意使用者可能：
     - 複製 API Key 用於其他專案
     - 大量請求導致超過 CWA API 限制
     - 使專案的 API Key 被封鎖

#### 緩解措施（有限效果）

1. **使用環境變數**
   ```typescript
   // 仍會暴露，但不直接寫在程式碼中
   export const environment = {
     cwaApiKey: 'CWB-XXXXXXXX'  // ⚠️ 仍會出現在 bundle 中
   };
   ```

2. **程式碼混淆**
   ```bash
   # Angular 生產構建會自動混淆
   ng build --configuration production
   ```
   - **效果有限**: 混淆無法真正保護 API Key
   - 透過 Network Tab 仍可看到請求

3. **Domain 限制（CWA API 不支援）**
   - 部分 API 支援限制呼叫的 Domain
   - CWA API 目前不支援此功能

### 安全性建議

| 情境 | 方案一 | 方案二 |
|-----|-------|-------|
| **多使用者共用** | ✅ 推薦 | ❌ 不推薦 |
| **需要認證授權** | ✅ 推薦 | ❌ 不推薦 |
| **API Key 付費** | ✅ 推薦 | ❌ 不推薦 |
| **內部工具/Demo** | ⚠️ 可考慮 | ✅ 可考慮 |
| **公開 API Key** | ⚠️ 可考慮 | ✅ 可考慮 |

**重要**: CWA 開放資料平台的 API Key 是免費的，但有**每日請求限制**（通常為 1,000-5,000 次/天，依申請等級而異）。若 API Key 被濫用導致超過限制，將影響所有使用者。

---

## 效能分析

### 延遲比較

#### 方案一：Firebase Functions

```
使用者瀏覽器 → Firebase Functions → CWA API → Firebase Functions → 使用者瀏覽器

延遲組成:
1. 前端 → Functions: 50-100ms (Firebase CDN)
2. Functions Cold Start: 1,000-3,000ms (首次) / 0ms (熱啟動)
3. Functions → CWA API: 100-300ms
4. CWA API 處理: 200-500ms
5. Functions → 前端: 50-100ms

總延遲:
- 首次呼叫 (Cold Start): 1,400-4,000ms
- 熱啟動: 400-1,000ms
- 快取命中: 50-150ms (僅 Firestore 讀取)
```

#### 方案二：前端直接整合

```
使用者瀏覽器 → CWA API → 使用者瀏覽器

延遲組成:
1. 前端 → CWA API: 100-300ms (依使用者網路環境)
2. CWA API 處理: 200-500ms
3. CWA API → 前端: 100-300ms

總延遲:
- 直接請求: 400-1,100ms
- 瀏覽器快取命中: 0-10ms
```

### 效能測試（模擬結果）

| 情境 | 方案一 | 方案二 | 差異 |
|-----|-------|-------|-----|
| **首次請求（Cold Start）** | 2,500ms | 650ms | 方案二快 1,850ms |
| **第二次請求（Warm）** | 650ms | 650ms | 相同 |
| **快取命中** | 100ms | 5ms | 方案二快 95ms |
| **並發 100 請求** | 800ms (函數擴展) | 650ms | 方案二稍快 |
| **離線使用** | ❌ 無法使用 | ✅ 可用（Service Worker） | 方案二優勢 |

### 快取效率

#### 方案一：Firestore 集中式快取

**優點**:
- 所有使用者共用快取
- 高命中率（70-90%）
- 減少對 CWA API 的請求

**缺點**:
- 需要網路請求取得快取
- Firestore 讀取有延遲（50-100ms）

#### 方案二：瀏覽器本地快取

**優點**:
- 本地讀取極快（0-10ms）
- 支援離線使用
- 無網路流量

**缺點**:
- 每個使用者獨立快取
- 首次載入需完整請求
- 快取命中率較低（依使用者行為）

### 效能建議

1. **方案一優化**:
   - 使用 **Min Instances** 避免 Cold Start
   ```typescript
   export const getForecast36Hour = onCall({
     minInstances: 1,  // 保持至少 1 個實例熱啟動
     memory: '256MiB',
     region: 'asia-east1'
   }, async (request) => { ... });
   ```
   
2. **方案二優化**:
   - 實作 **Service Worker** 離線快取
   - 使用 **HTTP Cache-Control** 標頭
   - 實作 **Stale-While-Revalidate** 策略

---

## 建議方案

### 根據不同需求的建議

#### 情境 1：企業級應用（推薦方案一）

**適用條件**:
- 多使用者共用系統
- 需要使用者認證與權限控制
- 需要追蹤使用者行為
- 未來可能擴展至 Mobile App

**理由**:
- ✅ API Key 安全受保護
- ✅ 統一管理與監控
- ✅ 跨平台共用邏輯
- ✅ 可擴展性高

**實作建議**:
1. 使用現有的 `functions-integration` 模組
2. 配置 Min Instances 避免 Cold Start
3. 實作細緻的權限控制
4. 設定監控與告警

#### 情境 2：輕量級應用/Demo（推薦方案二）

**適用條件**:
- 內部工具或展示專案
- 使用者數量少
- 對延遲敏感
- 預算有限

**理由**:
- ✅ 開發快速簡單
- ✅ 低延遲
- ✅ 零 Firebase 費用
- ✅ 支援離線使用

**實作建議**:
1. 使用環境變數管理 API Key
2. 實作瀏覽器本地快取
3. 加入錯誤處理與重試機制
4. 考慮 Service Worker 離線支援

#### 情境 3：混合方案（進階）

**適用條件**:
- 需要平衡效能與安全
- 有高頻率即時資料需求
- 希望降低 Functions 費用

**架構**:
```
- 即時觀測資料（10分鐘更新）→ 方案二（前端直接）
- 天氣預報（1小時更新）→ 方案一（Functions）
- 天氣警報（5分鐘更新）→ 方案一（Functions + WebSocket 推播）
```

**理由**:
- ⚖️ 平衡效能、成本與安全
- ✅ 高頻資料直接請求減少延遲
- ✅ 重要資料透過 Functions 保護

### GigHub 專案建議

基於 GigHub 的使用情境（工地施工進度追蹤），建議：

#### **推薦：方案一（透過 Firebase Functions）**

**理由**:
1. **多使用者協作**: 工地團隊需要共用天氣資訊
2. **權限管理**: 不同角色（業主、承包商、工人）需要不同權限
3. **資料一致性**: 集中式快取確保所有人看到相同天氣資料
4. **未來擴展**: 可能需要 Mobile App 供現場人員使用
5. **監控追蹤**: 需要記錄天氣資料查詢與施工決策關聯

**額外功能建議**:
- 天氣警報自動推播（FCM）
- 施工適宜度自動評估
- 天氣資料與施工日誌整合
- 歷史天氣資料分析

---

## 實作指南

### 方案一：使用現有 Functions-Integration

GigHub 專案已實作完整的 `functions-integration` 模組，可直接使用。

#### 步驟 1：設定 CWA API Key

```bash
# 1. 前往 CWA 開放資料平台申請 API Key
# https://opendata.cwa.gov.tw/

# 2. 將 API Key 加入 Firebase Secret Manager
firebase functions:secrets:set CWA_API_KEY

# 3. 輸入 API Key（互動式）
? Enter a value for CWA_API_KEY: CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

#### 步驟 2：部署 Functions

```bash
# 部署整個 functions-integration 模組
cd /home/runner/work/ng-gighub/ng-gighub
firebase deploy --only functions:functions-integration

# 或僅部署特定函數
firebase deploy --only functions:getForecast36Hour,functions:getObservation
```

#### 步驟 3：在 Angular 中使用

```typescript
// 1. 確保已初始化 Firebase Functions
// src/app/app.config.ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions } from '@angular/fire/functions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFunctions(() => getFunctions()),
    // ...
  ]
};

// 2. 使用現有的 WeatherService
// src/app/routes/blueprint/modules/weather/services/weather.service.ts
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly functions = inject(Functions);
  
  async getForecast(countyName: string): Promise<WeatherForecast | null> {
    const getForecastCallable = httpsCallable<
      { countyName: string }, 
      WeatherApiResponse
    >(this.functions, 'getForecast36Hour');
    
    const result = await getForecastCallable({ countyName });
    return this.transformData(result.data);
  }
}

// 3. 在 Component 中使用
@Component({
  selector: 'app-weather-display',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (forecast(); as forecast) {
      <div>
        <h3>{{ forecast.locationName }}</h3>
        <p>溫度: {{ forecast.temperature }}°C</p>
        <p>天氣: {{ forecast.weather }}</p>
        <p>降雨機率: {{ forecast.rainProbability }}%</p>
      </div>
    }
  `
})
export class WeatherDisplayComponent {
  private readonly weatherService = inject(WeatherService);
  
  loading = signal(false);
  forecast = signal<WeatherForecast | null>(null);
  
  async loadWeather(county: string): Promise<void> {
    this.loading.set(true);
    const data = await this.weatherService.getForecast(county);
    this.forecast.set(data);
    this.loading.set(false);
  }
}
```

### 方案二：前端直接整合完整步驟

詳細的實作步驟請參考前述「方案二：前端直接整合」章節中的「實作設置需求」部分。

---

## 附錄

### CWA API 端點參考

| API 名稱 | 端點 ID | 說明 | 更新頻率 |
|---------|--------|------|---------|
| 36小時天氣預報 | F-C0032-001 | 縣市天氣預報（未來36小時） | 每6小時 |
| 一週天氣預報 | F-C0032-005 | 縣市天氣預報（未來7天） | 每天 |
| 鄉鎮天氣預報 | F-D0047-{縣市代碼} | 鄉鎮市區天氣預報 | 每6小時 |
| 自動氣象站 | O-A0001-001 | 自動氣象站觀測資料 | 每10分鐘 |
| 局屬氣象站 | O-A0003-001 | 局屬氣象站觀測資料 | 每小時 |
| 雨量觀測 | O-A0002-001 | 自動雨量站觀測資料 | 每10分鐘 |
| 地震報告 | E-A0015-001 | 地震報告 | 即時 |
| 天氣警報 | W-C0033-001 | 天氣警報 | 即時 |

### 縣市代碼對照表

| 縣市 | 代碼 | 縣市 | 代碼 |
|-----|-----|-----|-----|
| 臺北市 | 63 | 新北市 | 65 |
| 桃園市 | 68 | 臺中市 | 66 |
| 臺南市 | 67 | 高雄市 | 64 |
| 基隆市 | 10017 | 新竹市 | 10018 |
| 嘉義市 | 10020 | 宜蘭縣 | 10002 |
| 新竹縣 | 10004 | 苗栗縣 | 10005 |
| 彰化縣 | 10007 | 南投縣 | 10008 |
| 雲林縣 | 10009 | 嘉義縣 | 10010 |
| 屏東縣 | 10013 | 臺東縣 | 10014 |
| 花蓮縣 | 10015 | 澎湖縣 | 10016 |
| 金門縣 | 09020 | 連江縣 | 09007 |

### 參考資源

- **CWA 開放資料平台**: https://opendata.cwa.gov.tw/
- **API 文件**: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
- **Firebase Functions 文件**: https://firebase.google.com/docs/functions
- **Firebase Secret Manager**: https://firebase.google.com/docs/functions/config-env
- **Angular HttpClient**: https://angular.dev/guide/http
- **Service Worker**: https://angular.dev/ecosystem/service-workers

---

## 結論

本文件提供了兩種整合中央氣象署 API 的完整方案分析。根據 GigHub 專案的特性（企業級、多使用者、需要權限控制），**建議採用方案一：透過 Firebase Functions 整合**。

### 關鍵決策因素

1. **安全性**: API Key 需要保護
2. **可擴展性**: 未來可能需要 Mobile App
3. **資料一致性**: 多使用者共用天氣資料
4. **監控追蹤**: 需要記錄使用者行為

### 下一步

1. ✅ 使用現有的 `functions-integration` 模組
2. ⚠️ 設定 CWA API Key 至 Firebase Secret Manager
3. ⚠️ 部署 Functions 至 Firebase
4. ⚠️ 在 Angular 應用中整合使用
5. ⚠️ 實作天氣相關業務功能（施工適宜度評估等）

---

**文件維護者**: GigHub 開發團隊  
**最後審查**: 2025-12-21  
**狀態**: ✅ 完成
