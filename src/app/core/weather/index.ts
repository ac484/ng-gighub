/**
 * Core Weather Module
 * 
 * 業務邏輯劃分：天氣資料管理模組
 * 
 * 模組結構：
 * - providers/: 天氣資料提供者（實作不同的資料來源）
 * - facades/: 業務邏輯協調層（狀態管理與流程控制）
 * 
 * 明確介面：
 * - IWeatherProvider: 天氣資料提供者介面（可擴展）
 * - WeatherFacade: 統一的資料存取介面（穩定）
 * 
 * @packageDocumentation
 */

// 介面與類型定義
export * from './providers/weather-provider.interface';

// Provider 實作
export * from './providers/cwa-weather.provider';

// Facade 協調層
export * from './facades/weather.facade';
