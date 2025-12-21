# 氣象模組 (Weather Module)

> GigHub 工地施工進度追蹤管理系統 - 氣象模組

## 📖 簡介

氣象模組整合[中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)，為施工管理提供即時天氣資訊與施工適宜度評估，協助專案經理做出明智的施工決策。

## 🎯 核心功能

### 1. 天氣預報顯示
- 36小時天氣預報
- 多時段預報（今天、明天、後天）
- 溫度範圍與降雨機率
- 視覺化天氣資訊

### 2. 地點選擇
- 全台縣市選擇
- 搜尋與篩選功能
- 記住使用者偏好

### 3. 施工適宜度評估
- 智能評估施工條件
- 考慮降雨、溫度、風速等因素
- 提供施工建議與警告
- 0-100 分數與等級評估

### 4. 氣象警報
- 地震資訊快訊
- 重要天氣警報
- 異常天氣通知

## 🏗️ 架構設計

### 設計原則

本模組遵循以下設計原則：

1. **高內聚性 (High Cohesion)** - 功能按業務領域劃分
2. **低耦合性 (Low Coupling)** - 模組間透過明確接口通訊
3. **可擴展性 (Extensibility)** - 支援功能插件式擴展
4. **單一職責 (Single Responsibility)** - 每個組件只負責一個職責
5. **極簡主義 (Minimalism)** - 只實作必要功能

### 目錄結構

```
weather/
├── WEATHER_MODULE_DESIGN.md           # 詳細設計文檔
├── README.md                          # 本文件
├── weather-module-view.component.ts   # 主協調器
├── index.ts                           # 公開 API
│
├── features/                          # 功能模組
│   ├── forecast-display/             # 天氣預報顯示
│   ├── location-selector/            # 地點選擇器
│   ├── construction-suitability/     # 施工適宜度評估
│   └── weather-alerts/               # 氣象警報
│
└── shared/                            # 共享工具
    └── utils/                         # 工具函數
```

### 資料流

```
使用者選擇地點
    ↓
WeatherModuleView (主協調器)
    ↓
CwbWeatherService (Climate Module)
    ↓
中央氣象署 API
    ↓
更新 Signals 狀態
    ↓
功能組件接收資料並顯示
```

## 🔧 技術規格

### 技術棧

- **框架**: Angular 20.3.x
- **UI 庫**: ng-zorro-antd 20.3.x
- **狀態管理**: Angular Signals
- **HTTP 客戶端**: Angular HttpClient
- **API**: 中央氣象署開放資料平臺 API

### 依賴服務

- **Climate Module**: `@core/blueprint/modules/implementations/climate`
  - `CwbWeatherService` - CWA API 封裝
  - `ClimateCacheService` - 快取服務
  - 型別定義與常數

### 環境配置

需要在環境變數中設定 CWA API Key：

```typescript
// src/environments/environment.ts
export const environment = {
  // ... 其他配置
  CWA_API_KEY: 'YOUR_API_KEY_HERE'
};
```

## 📋 實施計畫

### Phase 1: 基礎設施 (1-2 小時)

- [ ] 建立目錄結構
- [ ] 設定環境變數配置
- [ ] 建立 index.ts 匯出檔案
- [ ] 建立共享工具檔案

### Phase 2: 功能組件實作 (3-4 小時)

- [ ] 實作 LocationSelectorComponent
- [ ] 實作 ForecastDisplayComponent
- [ ] 實作 SuitabilityCardComponent
- [ ] 實作 WeatherAlertsComponent

### Phase 3: 主協調器整合 (2-3 小時)

- [ ] 實作 WeatherModuleViewComponent
- [ ] 整合 CwbWeatherService
- [ ] 實作狀態管理與資料流
- [ ] 實作錯誤處理

### Phase 4: UI 優化與測試 (2-3 小時)

- [ ] 樣式優化與響應式設計
- [ ] 載入狀態與動畫
- [ ] 錯誤訊息優化
- [ ] E2E 測試

## 🧪 測試

### 單元測試

```bash
# 執行單元測試
npm run test -- --include='**/weather/**/*.spec.ts'
```

### E2E 測試

```bash
# 執行 E2E 測試
npm run e2e
```

### 測試覆蓋率

目標測試覆蓋率: **> 80%**

## 📚 API 使用範例

### 取得天氣預報

```typescript
import { CwbWeatherService } from '@core/blueprint/modules/implementations/climate';

export class WeatherModuleViewComponent {
  private readonly weatherService = inject(CwbWeatherService);
  
  async loadWeather(location: string): Promise<void> {
    const forecasts = await firstValueFrom(
      this.weatherService.getCityWeatherForecast(location)
    );
    this.weatherData.set(forecasts);
  }
}
```

### 計算施工適宜度

```typescript
import { CwbWeatherService } from '@core/blueprint/modules/implementations/climate';

export class SuitabilityCardComponent {
  private readonly weatherService = inject(CwbWeatherService);
  
  suitability = computed(() => {
    const forecast = this.forecast();
    return this.weatherService.calculateConstructionSuitability(forecast);
  });
}
```

### 取得地震資訊

```typescript
import { CwbWeatherService } from '@core/blueprint/modules/implementations/climate';

export class WeatherAlertsComponent {
  private readonly weatherService = inject(CwbWeatherService);
  
  async loadEarthquakes(): Promise<void> {
    const earthquakes = await firstValueFrom(
      this.weatherService.getEarthquakeReport(10)
    );
    this.earthquakes.set(earthquakes);
  }
}
```

## 🎨 UI 設計規範

### 色彩系統

- **優秀 (excellent)**: 綠色 `#52c41a`
- **良好 (good)**: 藍色 `#1890ff`
- **尚可 (fair)**: 橙色 `#faad14`
- **不佳 (poor)**: 紅色 `#f5222d`
- **危險 (dangerous)**: 暗紅 `#cf1322`

### 響應式設計

- 支援手機、平板、桌面
- 卡片佈局在小螢幕上垂直堆疊
- 保持可讀性與可操作性

## 🔍 常見問題 (FAQ)

### Q: 為什麼不使用 Firebase Functions？

A: 為了簡化架構、減少延遲與成本，且 CWA API 支援 CORS，可以直接從前端呼叫。

### Q: API Key 如何保護？

A: 使用環境變數管理，不要將 API Key 提交到版本控制。在生產環境中，使用 Firebase 環境配置或 CI/CD 變數注入。

### Q: 快取策略是什麼？

A: Climate Module 已實作快取機制：
- 天氣預報：3 小時 TTL
- 觀測資料：10 分鐘 TTL
- 地震資料：5 分鐘 TTL

### Q: 如何擴展新功能？

A: 在 `features/` 目錄下建立新的功能模組，遵循現有的組件介面設計，並在主協調器中整合。

## 🚀 後續擴展

### 計畫中的功能

1. **歷史資料查詢** - 查詢過去天氣資料與趨勢分析
2. **自訂警報規則** - 使用者自定義警報條件
3. **多地點監控** - 同時監控多個工地位置
4. **施工日誌整合** - 將天氣資料自動記錄到施工日誌
5. **AI 預測模型** - 基於歷史資料的天氣預測

## 📞 支援

如有問題或建議，請聯絡：

- **開發團隊**: GigHub Development Team
- **專案倉庫**: [GitHub Repository](https://github.com/ac484/ng-gighub)
- **文檔**: `/docs/` 目錄

## 📄 授權

本專案遵循 MIT 授權條款。

---

**版本**: v1.0.0  
**最後更新**: 2025-12-21  
**狀態**: ✅ 設計完成，等待實施
