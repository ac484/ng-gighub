# Blueprint Designer 架構文檔

> **更新日期**: 2025-12-11  
> **版本**: v2.0

## 架構概覽

### 核心元件

- **BlueprintDesignerComponent**: 主元件,管理藍圖與模組
- **ConnectionLayerComponent**: SVG 連接線渲染
- **ValidationAlertsComponent**: 驗證結果顯示

### 核心服務

- **DependencyValidatorService**: 依賴驗證 (DFS 循環檢測)
- **BlueprintService**: 藍圖 CRUD 操作
- **LoggerService**: 日誌記錄

## 連接系統

### 資料結構

```typescript
interface ModuleConnection {
  id: string;
  source: { moduleId: string; position: Point };
  target: { moduleId: string; position: Point };
  eventType: string;
  status?: 'active' | 'inactive' | 'error';
}
```

### SVG 渲染

使用 Cubic Bezier 曲線繪製平滑連接線:

```typescript
path = `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
```

## 驗證系統

### DFS 循環檢測

```typescript
class DependencyValidatorService {
  // 使用 DFS 演算法檢測循環依賴
  detectCircularDependencies(moduleIds, connections): string[][] {
    // 建立鄰接表
    const adjList = buildAdjacencyList(moduleIds, connections);
    
    // DFS 遍歷檢測循環
    for (const node of moduleIds) {
      dfsDetectCycle(node, adjList, visited, recStack, path, cycles);
    }
    
    return cycles;
  }
}
```

### 驗證流程

1. 檢測循環依賴 (DFS)
2. 檢查缺失模組
3. 檢查無效連接
4. 檢查未使用模組 (警告)

## API 參考

### validate()

```typescript
validate(moduleIds: string[], connections: ModuleConnection[]): DependencyValidationResult
```

返回驗證結果,包含錯誤與警告列表。

---

完整 API 文檔請參考程式碼註解。
