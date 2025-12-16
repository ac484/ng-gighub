# Climate Module (氣候模組)

> **Version**: 1.0.0  
> **Status**: Ready for Integration  
> **Architecture**: Blueprint Container Module

## 📋 Overview

氣候模組整合中央氣象署開放資料平台（CWB Open Data Platform），提供完整的天氣預報、觀測資料及地震資訊查詢功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 核心特性

- ✅ **完整 CWB API 整合**: 支援天氣預報、觀測資料、地震報告等
- ✅ **智能快取機制**: 自動快取 API 回應，減少請求次數
- ✅ **Firestore 整合**: 提供介面讓其他模組儲存氣候資料
- ✅ **施工適宜度評估**: 根據天氣條件評估施工可行性
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **不直接儲存資料**: 氣候模組只負責 API 調用，不直接寫入資料庫
2. **提供儲存介面**: 透過 Repository 讓其他模組可以儲存氣候資料到 Firestore
3. **Event Bus 通訊**: 透過事件系統與其他模組溝通
4. **可選依賴**: 最小化依賴（僅需 logger 和 context）

## 🏗️ Architecture

```
climate/
├── climate.module.ts              # 模組主入口 (IBlueprintModule 實作)
├── services/
│   ├── cwb-weather.service.ts    # CWB API 服務
│   └── climate-cache.service.ts  # 快取服務
├── repositories/
│   └── climate.repository.ts     # Firestore 儲存庫（供其他模組使用）
├── models/
│   ├── weather-forecast.model.ts         # 天氣預報模型
│   ├── weather-observation.model.ts      # 觀測資料模型（包含在 forecast 中）
│   └── cwb-api-response.model.ts         # CWB API 回應模型
├── config/
│   ├── climate.config.ts         # 模組配置
│   └── cwb-api.constants.ts      # API 常數定義
├── exports/
│   └── climate-api.exports.ts    # 公開 API（供其他模組使用）
├── index.ts                       # 公開 API 匯出
└── README.md                      # 本文件
```

## 🚀 Quick Start

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { ClimateModule } from '@core/blueprint/modules/implementations/climate';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入氣候模組
const climateModule = new ClimateModule();
await container.loadModule(climateModule);

// 啟動容器
await container.start();
```

### 2. 在其他模組中使用氣候模組 API

```typescript
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';
import { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { IClimateModuleApi } from '@core/blueprint/modules/implementations/climate';

export class TasksModule implements IBlueprintModule {
  private context?: IExecutionContext;
  private climateApi?: IClimateModuleApi;

  async init(context: IExecutionContext): Promise<void> {
    this.context = context;

    // 取得氣候模組 API
    const climateModule = context.resources.getModule('climate');
    this.climateApi = climateModule?.exports as IClimateModuleApi;
  }

  async fetchWeatherForTask(taskId: string, location: string): Promise<void> {
    if (!this.climateApi) return;

    // 取得天氣預報
    this.climateApi.weather.getCityForecast(location).subscribe(forecasts => {
      if (forecasts.length > 0) {
        const forecast = forecasts[0];
        console.log('Weather:', forecast);

        // 計算施工適宜度
        const suitability = this.climateApi!.weather.calculateConstructionSuitability(forecast);
        console.log('Construction suitability:', suitability.score);

        // 儲存到 Firestore（由任務模組負責）
        this.climateApi!.storage.saveForecast(
          forecast,
          'tasks-module',
          { taskId, suitabilityScore: suitability.score }
        );
      }
    });
  }
}
```

## 📖 API Reference

### Weather Service API

```typescript
interface IClimateModuleApi {
  weather: {
    // 取得縣市天氣預報
    getCityForecast(locationName?: string, useCache?: boolean): Observable<WeatherForecast[]>;

    // 取得鄉鎮天氣預報
    getTownshipForecast(
      countyCode: string,
      townshipName?: string,
      useCache?: boolean
    ): Observable<CwbApiResponse>;

    // 取得氣象站觀測資料
    getStationData(stationName?: string, useCache?: boolean): Observable<CwbApiResponse>;

    // 取得地震報告
    getEarthquakeReport(limit?: number, useCache?: boolean): Observable<CwbApiResponse>;

    // 計算施工適宜度
    calculateConstructionSuitability(forecast: WeatherForecast): ConstructionSuitability;

    // 快取管理
    clearCache(): void;
    getCacheStats(): CacheStats;
  };
}
```

### Storage API (供其他模組使用)

```typescript
interface IClimateModuleApi {
  storage: {
    // 儲存天氣預報
    saveForecast(
      forecast: WeatherForecast,
      sourceModule: string,
      metadata?: Record<string, any>
    ): Promise<string>;

    // 儲存觀測資料
    saveObservation(
      observation: WeatherObservation,
      sourceModule: string,
      metadata?: Record<string, any>
    ): Promise<string>;

    // 關聯專案與氣候資料
    linkToProject(
      projectId: string,
      locationName: string,
      forecasts: WeatherForecast[],
      observations: WeatherObservation[],
      metadata?: any
    ): Promise<void>;

    // 取得專案氣候資料
    getProjectClimate(projectId: string): Observable<ProjectClimateData | null>;
  };
}
```

## 🔧 Configuration

### Environment Variables

在使用前，請設定 CWB API 金鑰：

```bash
# .env 或環境變數
CWB_API_KEY=your_api_key_here
```

### Module Configuration

```typescript
import { IClimateConfig, DEFAULT_CLIMATE_CONFIG } from '@core/blueprint/modules/implementations/climate';

const customConfig: IClimateConfig = {
  ...DEFAULT_CLIMATE_CONFIG,
  apiKey: 'your_api_key',
  cache: {
    forecastTTL: 3 * 60 * 60 * 1000,    // 3 小時
    observationTTL: 10 * 60 * 1000,     // 10 分鐘
    earthquakeTTL: 5 * 60 * 1000,       // 5 分鐘
    maxItems: 100
  }
};
```

## 📊 Data Models

### WeatherForecast

```typescript
interface WeatherForecast {
  locationName: string;
  startTime: string;
  endTime: string;
  weatherDescription: string;
  weatherCode?: string;
  temperature: {
    min: number;
    max: number;
    unit: string;
  };
  rainProbability: number;
  humidity?: number;
  windDirection?: string;
  windSpeed?: number;
}
```

### ConstructionSuitability

```typescript
interface ConstructionSuitability {
  score: number;  // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
  factors: {
    rainfall: { value: number; impact: number; description: string };
    temperature: { value: number; impact: number; description: string };
    wind: { value: number; impact: number; description: string };
    weather: { value: string; impact: number; description: string };
  };
  recommendations: string[];
  warnings: string[];
}
```

## 🔥 Firestore Integration

### Schema Design

```
climate_data/                    # 氣候資料集合
├── {docId}/
│   ├── id: string
│   ├── type: 'forecast' | 'observation' | 'earthquake'
│   ├── data: WeatherForecast | WeatherObservation | EarthquakeInfo
│   ├── sourceModule: string
│   ├── createdAt: Timestamp
│   └── metadata?: object

project_climate/                 # 專案氣候關聯
├── {projectId}/
│   ├── projectId: string
│   ├── locationName: string
│   ├── forecasts: WeatherForecast[]
│   ├── observations: WeatherObservation[]
│   ├── lastUpdated: Timestamp
│   └── metadata?: object
```

### Usage Example

```typescript
// 儲存天氣預報到 Firestore
const docId = await climateApi.storage.saveForecast(
  forecast,
  'tasks-module',
  { taskId: 'task-123', projectId: 'project-456' }
);

// 關聯專案與氣候資料
await climateApi.storage.linkToProject(
  'project-123',
  '臺北市',
  forecasts,
  observations,
  { autoUpdate: true, updateInterval: 3600000 }
);

// 取得專案氣候資料
climateApi.storage.getProjectClimate('project-123').subscribe(data => {
  if (data) {
    console.log('Project weather:', data.forecasts);
  }
});
```

## 🎯 Event Bus Integration

### Emitted Events

```typescript
const CLIMATE_EVENTS = {
  WEATHER_FETCHED: 'CLIMATE_WEATHER_FETCHED',
  WEATHER_ERROR: 'CLIMATE_WEATHER_ERROR',
  CACHE_HIT: 'CLIMATE_CACHE_HIT',
  CACHE_MISS: 'CLIMATE_CACHE_MISS',
  CACHE_CLEARED: 'CLIMATE_CACHE_CLEARED',
  EARTHQUAKE_ALERT: 'CLIMATE_EARTHQUAKE_ALERT',
  HEAVY_RAIN_ALERT: 'CLIMATE_HEAVY_RAIN_ALERT'
};
```

### Listening to Events

```typescript
// 在其他模組中監聽氣候事件
context.eventBus.on('CLIMATE_EARTHQUAKE_ALERT', (data: any) => {
  console.log('Earthquake detected:', data);
  // 執行相應處理
});
```

## 🧪 Testing

### Unit Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { CwbWeatherService } from './services/cwb-weather.service';
import { ClimateCacheService } from './services/climate-cache.service';

describe('CwbWeatherService', () => {
  let service: CwbWeatherService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CwbWeatherService, ClimateCacheService]
    });
    service = TestBed.inject(CwbWeatherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // 更多測試...
});
```

### Integration Tests

```typescript
describe('ClimateModule Integration', () => {
  it('should load into Blueprint Container', async () => {
    const container = new BlueprintContainer(config);
    await container.initialize();

    const climateModule = new ClimateModule();
    await container.loadModule(climateModule);

    expect(container.hasModule('climate')).toBe(true);
  });
});
```

## 📝 Best Practices

### 1. 使用快取減少 API 請求

```typescript
// ✅ 好的做法：使用快取
climateApi.weather.getCityForecast('臺北市', true);

// ❌ 避免：頻繁請求 API
climateApi.weather.getCityForecast('臺北市', false);
```

### 2. 適當處理錯誤

```typescript
climateApi.weather.getCityForecast('臺北市').subscribe({
  next: (forecasts) => {
    console.log('Success:', forecasts);
  },
  error: (error) => {
    console.error('Error:', error);
    // 顯示使用者友善的錯誤訊息
  }
});
```

### 3. 定期清理過期快取

```typescript
// 在模組生命週期中定期清理
setInterval(() => {
  const cleared = climateApi.weather.clearExpiredCache();
  console.log(`Cleared ${cleared} expired entries`);
}, 3600000); // 每小時
```

### 4. 正確使用施工適宜度評估

```typescript
const forecast = forecasts[0];
const suitability = climateApi.weather.calculateConstructionSuitability(forecast);

if (suitability.level === 'dangerous') {
  // 發出警告，建議停工
  alert('Weather conditions are dangerous. Construction not recommended.');
} else if (suitability.level === 'poor') {
  // 建議延期
  console.warn('Weather conditions are poor:', suitability.warnings);
}
```

## 🔒 Security Considerations

### API Key Management

```typescript
// ❌ 不要這樣做：硬編碼 API 金鑰
const apiKey = 'YOUR_API_KEY_HERE';

// ✅ 正確做法：使用環境變數
const apiKey = process.env['CWB_API_KEY'] || window.CWB_API_KEY;
```

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 氣候資料集合
    match /climate_data/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.resource.data.sourceModule is string;
    }
    
    // 專案氣候關聯
    match /project_climate/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.token.projectId == projectId;
    }
  }
}
```

## 📚 References

- [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
- [CWB API 文檔](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- [System-CWB.md](../../../../docs/archive/system/System-CWB.md) - 完整 API 文檔
- [Blueprint Container 架構](../blueprint/README.md)

## 🤝 Contributing

在修改氣候模組前，請確保：

1. 理解 Blueprint Container 架構
2. 遵循 IBlueprintModule 介面規範
3. 維持零耦合設計原則
4. 添加適當的測試
5. 更新相關文檔

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-12  
**Contact**: 請透過專案 GitHub Issues 回報問題
