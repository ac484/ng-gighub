# 氣象模組設計文檔 (Weather Module Design)

## 📋 專案資訊

- **模組名稱**: Weather Module (氣象模組)
- **路徑**: `src/app/routes/blueprint/modules/weather`
- **API 來源**: [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- **環境變數**: `CWA_API_KEY`
- **設計原則**: 高內聚性、低耦合性、可擴展性、單一職責、極簡主義
- **架構模式**: Feature-Based Architecture (功能導向架構)

---

## 🎯 設計目標

### 核心原則

1. **高內聚性 (High Cohesion)**
   - 每個功能模組專注於單一業務領域
   - 功能相關的代碼組織在一起
   - 減少跨功能的依賴

2. **低耦合性 (Low Coupling)**
   - 模組間透過明確接口通訊
   - 避免直接依賴其他模組的實現細節
   - 使用事件機制解耦模組間互動

3. **可擴展性 (Extensibility)**
   - 新增功能不影響現有功能
   - 支援插件式功能擴展
   - 配置驅動的功能開關

4. **單一職責 (Single Responsibility)**
   - 每個組件只負責一個職責
   - 組件職責明確且易於理解
   - 避免上帝組件

5. **極簡主義 (Minimalism)**
   - 只實作必要功能
   - 避免過度設計
   - 代碼簡潔易讀

### 技術約束

- ✅ 使用現有的 Climate Module API (`@core/blueprint/modules/implementations/climate`)
- ✅ 不透過 Firebase Functions (直接從前端呼叫 CWA API)
- ✅ API Key 使用環境變數 `CWA_API_KEY`
- ✅ 遵循 Angular 20 最佳實踐 (Signals, Standalone Components)
- ✅ 遵循 GigHub 三層架構 (UI → Service → Repository)

---

## 📐 模組架構設計

### 整體架構圖

```
weather/
├── weather-module-view.component.ts    # 主協調器 (Orchestrator)
├── index.ts                             # 公開 API
├── WEATHER_MODULE_DESIGN.md            # 設計文檔
│
├── features/                            # 功能模組 (Feature Modules)
│   ├── forecast-display/               # 天氣預報顯示
│   │   ├── forecast-display.component.ts
│   │   ├── forecast-display.component.html
│   │   ├── forecast-display.component.less
│   │   └── index.ts
│   │
│   ├── location-selector/              # 地點選擇器
│   │   ├── location-selector.component.ts
│   │   ├── location-selector.component.html
│   │   ├── location-selector.component.less
│   │   └── index.ts
│   │
│   ├── construction-suitability/       # 施工適宜度評估
│   │   ├── suitability-card.component.ts
│   │   ├── suitability-card.component.html
│   │   ├── suitability-card.component.less
│   │   └── index.ts
│   │
│   └── weather-alerts/                 # 氣象警報
│       ├── weather-alerts.component.ts
│       ├── weather-alerts.component.html
│       ├── weather-alerts.component.less
│       └── index.ts
│
└── shared/                              # 共享工具
    ├── utils/
    │   ├── weather-formatters.ts       # 格式化工具
    │   ├── weather-icons.ts            # 圖示映射
    │   └── index.ts
    └── index.ts
```

---

## 🧩 功能模組設計 (Feature-Based Design)

### 1. 主協調器 (Main Orchestrator)

**檔案**: `weather-module-view.component.ts`

**職責**:
- 統籌所有功能模組
- 管理共享狀態
- 處理頂層業務邏輯
- 協調功能間通訊

**接口**:

```typescript
interface WeatherModuleViewComponent {
  // Input
  blueprintId: InputSignal<string>;           // 藍圖 ID
  
  // State
  selectedLocation: WritableSignal<string>;   // 選中的地點
  weatherData: Signal<WeatherForecast[]>;     // 天氣資料
  loading: Signal<boolean>;                   // 載入狀態
  error: Signal<string | null>;              // 錯誤訊息
  
  // Methods
  loadWeather(): Promise<void>;              // 載入天氣資料
  onLocationChange(location: string): void;  // 地點變更處理
}
```

**依賴**:
- ✅ `CwbWeatherService` (from `@core/blueprint/modules/implementations/climate`)
- ✅ Feature Components (forecast-display, location-selector, etc.)

---

### 2. 天氣預報顯示 (Forecast Display)

**檔案**: `features/forecast-display/forecast-display.component.ts`

**職責**:
- 顯示天氣預報資料
- 支援多時段預報展示
- 視覺化天氣資訊

**接口**:

```typescript
interface ForecastDisplayComponent {
  // Inputs
  forecasts: InputSignal<WeatherForecast[]>;  // 預報資料
  loading: InputSignal<boolean>;              // 載入狀態
  
  // Outputs
  forecastSelect: OutputEmitterRef<WeatherForecast>;  // 選中預報事件
}
```

**UI 元素**:
- 天氣卡片列表 (使用 nz-card)
- 時段標籤 (今天、明天、後天)
- 溫度範圍顯示
- 降雨機率指示器
- 天氣圖示

**資料來源**:
- 輸入資料由父組件提供
- 不直接呼叫 Service

---

### 3. 地點選擇器 (Location Selector)

**檔案**: `features/location-selector/location-selector.component.ts`

**職責**:
- 提供縣市選擇介面
- 支援搜尋與篩選
- 記住使用者偏好

**接口**:

```typescript
interface LocationSelectorComponent {
  // Inputs
  selectedLocation: InputSignal<string>;      // 當前選中地點
  availableLocations: InputSignal<string[]>;  // 可用地點列表
  
  // Outputs
  locationChange: OutputEmitterRef<string>;   // 地點變更事件
}
```

**UI 元素**:
- 下拉選單 (nz-select)
- 搜尋框 (支援模糊搜尋)
- 常用地點快捷選項

**資料來源**:
- 縣市列表來自 `COUNTY_CODES` 常數
- 不需要 API 呼叫

---

### 4. 施工適宜度評估 (Construction Suitability)

**檔案**: `features/construction-suitability/suitability-card.component.ts`

**職責**:
- 根據天氣資料計算施工適宜度
- 顯示評估結果與建議
- 提供警告訊息

**接口**:

```typescript
interface SuitabilityCardComponent {
  // Inputs
  forecast: InputSignal<WeatherForecast>;     // 當前預報
  
  // Computed
  suitability: Signal<ConstructionSuitability>;  // 計算的適宜度
}
```

**計算邏輯**:
- 使用 `CwbWeatherService.calculateConstructionSuitability()`
- 在 component 內使用 `computed()` 計算

**UI 元素**:
- 分數指示器 (0-100)
- 等級徽章 (excellent/good/fair/poor/dangerous)
- 影響因素列表
- 建議與警告訊息

---

### 5. 氣象警報 (Weather Alerts)

**檔案**: `features/weather-alerts/weather-alerts.component.ts`

**職責**:
- 顯示重要氣象警報
- 地震資訊快訊
- 異常天氣通知

**接口**:

```typescript
interface WeatherAlertsComponent {
  // Inputs
  location: InputSignal<string>;              // 關注地點
  
  // State
  alerts: Signal<WeatherAlert[]>;             // 警報列表
  earthquakes: Signal<EarthquakeInfo[]>;      // 地震資訊
  
  // Outputs
  alertClick: OutputEmitterRef<WeatherAlert>; // 警報點擊事件
}
```

**資料來源**:
- 地震資訊: `CwbWeatherService.getEarthquakeReport()`
- 在 component 內管理狀態

**UI 元素**:
- 警報通知欄 (nz-alert)
- 地震資訊卡片
- 詳細資訊抽屜

---

## 🔧 共享工具 (Shared Utilities)

### 格式化工具 (weather-formatters.ts)

```typescript
export const WeatherFormatters = {
  // 格式化溫度
  formatTemperature(temp: number, unit: string = 'C'): string,
  
  // 格式化時間範圍
  formatTimeRange(start: string, end: string): string,
  
  // 格式化降雨機率
  formatRainProbability(prob: number): string,
  
  // 格式化適宜度等級
  formatSuitabilityLevel(level: string): string
};
```

### 圖示映射 (weather-icons.ts)

```typescript
export const WeatherIcons = {
  // 根據天氣代碼取得圖示
  getWeatherIcon(weatherCode: string): string,
  
  // 根據適宜度等級取得圖示
  getSuitabilityIcon(level: string): string,
  
  // 根據警報類型取得圖示
  getAlertIcon(type: string): string
};
```

---

## 🔗 資料流設計 (Data Flow)

### 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│          Weather Module View (Orchestrator)                 │
│                                                              │
│  State:                                                      │
│  - selectedLocation: signal()                               │
│  - weatherData: signal()                                    │
│  - loading: signal()                                        │
│  - error: signal()                                          │
│                                                              │
│  Service Injection:                                         │
│  - cwbWeatherService (from Climate Module)                 │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Location    │    │  Forecast    │    │ Suitability  │
│  Selector    │    │  Display     │    │    Card      │
│              │    │              │    │              │
│  [Event Out] │    │  [Data In]   │    │  [Data In]   │
│   location   │    │  forecasts   │    │   forecast   │
│   Change     │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 資料流程

1. **初始化階段**
   - WeatherModuleView 注入 `CwbWeatherService`
   - 初始化服務配置 (API Key from environment)
   - 設定預設地點

2. **載入資料**
   - 使用者選擇地點 → LocationSelector 發出事件
   - WeatherModuleView 接收事件 → 更新 selectedLocation
   - 呼叫 `cwbWeatherService.getCityWeatherForecast()`
   - 更新 weatherData signal

3. **展示資料**
   - ForecastDisplay 接收 weatherData
   - SuitabilityCard 接收第一筆 forecast
   - WeatherAlerts 獨立載入地震資訊

4. **錯誤處理**
   - Service 層錯誤 → 更新 error signal
   - UI 顯示錯誤訊息 (nz-alert)
   - 提供重試機制

---

## 📦 API 整合設計

### 使用現有 Climate Module

**優點**:
- ✅ 已實作完整的 CWA API 封裝
- ✅ 內建快取機制
- ✅ 錯誤處理與重試邏輯
- ✅ TypeScript 型別定義完整

**整合方式**:

```typescript
import { CwbWeatherService } from '@core/blueprint/modules/implementations/climate';

@Component({...})
export class WeatherModuleViewComponent {
  private readonly weatherService = inject(CwbWeatherService);
  
  ngOnInit(): void {
    // 初始化服務
    this.weatherService.initialize({
      apiKey: environment.CWA_API_KEY,
      // ... 其他配置
    });
  }
  
  async loadWeather(): Promise<void> {
    this.loading.set(true);
    try {
      const forecasts = await firstValueFrom(
        this.weatherService.getCityWeatherForecast(this.selectedLocation())
      );
      this.weatherData.set(forecasts);
    } catch (error) {
      this.error.set('載入天氣資料失敗');
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 環境變數配置

**位置**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  CWA_API_KEY: 'YOUR_API_KEY_HERE',  // 從環境變數注入
  // ... 其他配置
};
```

---

## 🎨 UI/UX 設計規範

### 佈局設計

```
┌────────────────────────────────────────────────────────┐
│  氣象模組                                    [重新載入] │
├────────────────────────────────────────────────────────┤
│  選擇地點: [臺北市 ▼]                    [搜尋圖示]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  【施工適宜度評估】                                     │
│  ┌────────────────────────────────────────────┐      │
│  │  分數: 85  等級: 良好                      │      │
│  │  影響因素:                                  │      │
│  │  - 降雨機率: 30% (中等)                    │      │
│  │  - 溫度: 25°C (舒適)                       │      │
│  │  建議: 天氣條件良好，可正常施工             │      │
│  └────────────────────────────────────────────┘      │
│                                                         │
│  【天氣預報】                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │ 今天 │  │ 明天 │  │ 後天 │                      │
│  │ ☀️  │  │ ⛅   │  │ 🌧️  │                      │
│  │25-30°│  │23-28°│  │20-25°│                      │
│  │降雨30%│  │降雨50%│  │降雨70%│                    │
│  └──────┘  └──────┘  └──────┘                      │
│                                                         │
│  【氣象警報】                                          │
│  ⚠️ 地震速報: 芮氏規模 4.2，震央位於花蓮縣...        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 設計規範

1. **色彩系統**
   - 優秀 (excellent): 綠色 `#52c41a`
   - 良好 (good): 藍色 `#1890ff`
   - 尚可 (fair): 橙色 `#faad14`
   - 不佳 (poor): 紅色 `#f5222d`
   - 危險 (dangerous): 暗紅 `#cf1322`

2. **圖示系統**
   - 使用 Ant Design Icons
   - 天氣圖示使用 Emoji 或自定義 SVG
   - 保持圖示一致性

3. **響應式設計**
   - 支援手機、平板、桌面
   - 卡片佈局在小螢幕上垂直堆疊
   - 保持可讀性與可操作性

---

## 🧪 測試策略

### 單元測試

**測試覆蓋範圍**:
- ✅ 主協調器狀態管理
- ✅ 功能組件輸入輸出
- ✅ 格式化工具函數
- ✅ 計算邏輯 (施工適宜度)

**測試檔案**:
```
weather-module-view.component.spec.ts
forecast-display.component.spec.ts
location-selector.component.spec.ts
suitability-card.component.spec.ts
weather-alerts.component.spec.ts
weather-formatters.spec.ts
```

### 整合測試

**測試場景**:
- ✅ API 呼叫與快取機制
- ✅ 地點切換與資料更新
- ✅ 錯誤處理與重試
- ✅ 事件流與資料傳遞

---

## 📝 實施計畫

### Phase 1: 基礎設施 (1-2 小時)

**任務**:
- [ ] 建立目錄結構
- [ ] 設定環境變數配置
- [ ] 建立 index.ts 匯出檔案
- [ ] 建立共享工具檔案

**交付物**:
- 完整的目錄結構
- 基礎檔案骨架

### Phase 2: 功能組件實作 (3-4 小時)

**任務**:
- [ ] 實作 LocationSelectorComponent
- [ ] 實作 ForecastDisplayComponent
- [ ] 實作 SuitabilityCardComponent
- [ ] 實作 WeatherAlertsComponent

**交付物**:
- 4 個功能組件 (含模板與樣式)
- 組件單元測試

### Phase 3: 主協調器整合 (2-3 小時)

**任務**:
- [ ] 實作 WeatherModuleViewComponent
- [ ] 整合 CwbWeatherService
- [ ] 實作狀態管理與資料流
- [ ] 實作錯誤處理

**交付物**:
- 完整的主協調器
- 整合測試

### Phase 4: UI 優化與測試 (2-3 小時)

**任務**:
- [ ] 樣式優化與響應式設計
- [ ] 載入狀態與動畫
- [ ] 錯誤訊息優化
- [ ] E2E 測試

**交付物**:
- 完整的 UI 實作
- 測試覆蓋率 > 80%

---

## 🔍 架構決策記錄 (ADR)

### ADR-001: 使用現有 Climate Module

**決策**: 使用現有的 `@core/blueprint/modules/implementations/climate` 而非重新實作

**理由**:
- ✅ 避免重複造輪子
- ✅ 已有完整的型別定義
- ✅ 內建快取與錯誤處理
- ✅ 符合 DRY 原則

**取捨**:
- ⚠️ 依賴現有實作的穩定性
- ⚠️ 需要理解現有 API 設計

### ADR-002: Feature-Based 架構

**決策**: 採用功能導向架構，按業務功能劃分模組

**理由**:
- ✅ 高內聚性：相關功能組織在一起
- ✅ 低耦合性：功能間通過接口通訊
- ✅ 可擴展性：新增功能不影響現有功能
- ✅ 易於維護：功能職責清晰

**取捨**:
- ⚠️ 初始設置成本較高
- ✅ 長期維護成本更低

### ADR-003: 不使用 Firebase Functions

**決策**: 直接從前端呼叫 CWA API，不透過 Functions

**理由**:
- ✅ 簡化架構
- ✅ 減少延遲
- ✅ 降低成本
- ✅ CWA API 支援 CORS

**取捨**:
- ⚠️ API Key 暴露在前端 (需使用環境變數保護)
- ⚠️ 無法實作複雜的後端邏輯
- ✅ 對於公開資料 API 是可接受的

### ADR-004: Signals 狀態管理

**決策**: 使用 Angular Signals 進行狀態管理

**理由**:
- ✅ Angular 20 原生支援
- ✅ 細粒度響應式更新
- ✅ 效能優異
- ✅ 簡化狀態管理邏輯

**取捨**:
- ⚠️ 需要學習 Signals API
- ✅ 比 RxJS 更易於理解

---

## 🚀 後續擴展方向

### 可能的擴展功能

1. **歷史資料查詢**
   - 查詢過去天氣資料
   - 趨勢分析與預測

2. **自訂警報規則**
   - 使用者自定義警報條件
   - 推送通知整合

3. **多地點監控**
   - 同時監控多個工地位置
   - 地圖視圖整合

4. **施工日誌整合**
   - 將天氣資料自動記錄到施工日誌
   - 天氣與施工進度相關性分析

5. **AI 預測模型**
   - 基於歷史資料的天氣預測
   - 施工適宜度智能推薦

---

## 📚 參考資料

### 官方文檔

- [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- [Angular Signals 官方文檔](https://angular.dev/guide/signals)
- [ng-zorro-antd 組件庫](https://ng.ant.design/docs/introduce/zh)

### 專案文檔

- [GigHub 架構設計](/.github/instructions/ng-gighub-architecture.instructions.md)
- [Climate Module 實作](src/app/core/blueprint/modules/implementations/climate/)
- [Issues Module 參考](src/app/routes/blueprint/modules/issues/)

---

## ✅ 設計檢查清單

### 架構設計

- [x] 高內聚性：功能按業務劃分
- [x] 低耦合性：模組間透過接口通訊
- [x] 可擴展性：支援功能插件式擴展
- [x] 單一職責：每個組件職責明確
- [x] 極簡主義：只實作必要功能

### 技術實作

- [x] 使用 Angular 20 Signals
- [x] 使用 Standalone Components
- [x] 使用 inject() 依賴注入
- [x] 遵循三層架構
- [x] 整合現有 Climate Module

### 文檔完整性

- [x] 架構設計圖
- [x] 功能模組設計
- [x] API 整合方案
- [x] UI/UX 規範
- [x] 測試策略
- [x] 實施計畫
- [x] ADR 記錄

---

## 📞 聯絡資訊

**設計者**: GigHub Development Team  
**設計日期**: 2025-12-21  
**版本**: v1.0.0  
**狀態**: ✅ 設計完成，等待實施

---

**附註**: 本設計文檔遵循 GigHub 專案的架構規範與最佳實踐，確保與現有系統的一致性與可維護性。
