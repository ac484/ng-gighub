# ADR-0003: 合併 features/ 到 routes/

## 狀態
✅ **已採納** (Accepted)

## 情境 (Context)

原始 README.md 提議的架構包含兩個獨立目錄：
- `features/` - Application Layer (業務邏輯協調)
- `routes/` - Presentation Layer (UI 和路由)

這造成了結構上的冗餘和開發者困惑。

### 問題範例

```
❌ 造成混淆:
├── features/
│   └── construction-log/
│       ├── pages/
│       ├── components/
│       └── services/
└── routes/
    └── construction-log/
        ├── pages/
        └── components/
```

## 決策 (Decision)

**合併 features/ 到 routes/**，統一使用 `routes/` 作為功能模組目錄，符合 ng-alain 框架慣例。

### 推薦結構

```
routes/
└── [feature-name]/
    ├── pages/                # Smart Components (Container)
    ├── components/           # Dumb Components (Presentational)
    ├── services/             # Feature Facades (可選)
    └── routes/
        └── [feature].routes.ts
```

### 範例實作

```typescript
// routes/construction-log/
routes/construction-log/
├── pages/
│   └── construction-log.page.ts          # Smart Component
├── components/
│   ├── log-form.component.ts             # Dumb Component
│   └── log-detail-card.component.ts      # Dumb Component
├── services/
│   └── construction-log-facade.service.ts # Facade (可選)
└── routes/
    └── construction-log.routes.ts

// Smart Component 範例
@Component({
  selector: 'app-construction-log-page',
  standalone: true,
  imports: [SHARED_IMPORTS, LogFormComponent, LogDetailCardComponent],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <app-log-form [log]="selectedLog()" (save)="handleSave($event)" />
      @for (log of logs(); track log.id) {
        <app-log-detail-card [log]="log" />
      }
    }
  `
})
export class ConstructionLogPageComponent {
  private logStore = inject(LogStore);
  
  // 使用 Signal-based state
  logs = this.logStore.logs;
  loading = this.logStore.loading;
  selectedLog = signal<Log | null>(null);
  
  async handleSave(log: Log): Promise<void> {
    await this.logStore.saveLog(log);
  }
}

// Facade Service 範例 (可選，用於複雜協調)
@Injectable({ providedIn: 'root' })
export class ConstructionLogFacade {
  private logStore = inject(LogStore);
  private taskStore = inject(TaskStore);
  private notificationService = inject(NotificationService);
  
  async createLogWithTask(log: Log, taskId: string): Promise<void> {
    // 協調多個 store 和 service
    await this.logStore.createLog(log);
    await this.taskStore.linkLog(taskId, log.id);
    this.notificationService.success('日誌建立成功');
  }
}
```

## 理由 (Rationale)

### 為什麼合併？

1. **符合 ng-alain 慣例** 📘
   - ng-alain 官方範例使用 `routes/` 作為功能模組目錄
   - 減少學習曲線和團隊困惑

2. **消除冗餘** 🗑️
   - 避免在兩個目錄中重複相似的程式碼
   - 減少目錄深度，簡化導航

3. **簡化決策** 🎯
   - 開發者不需要判斷「這個元件應該放在 features/ 還是 routes/？」
   - 統一的放置規則

4. **保持彈性** 🔄
   - 仍然可以透過 `services/` 目錄放置 Facade 服務
   - Smart/Dumb Components 分離維持不變

### Smart vs Dumb Components

**Smart Components (pages/)**:
- 依賴注入服務和 stores
- 處理業務邏輯
- 管理狀態
- 處理路由參數

**Dumb Components (components/)**:
- 純展示邏輯
- 透過 `input()` 接收資料
- 透過 `output()` 發送事件
- 無狀態或僅本地狀態

### Facade Service 使用時機

**需要 Facade 的情況**:
1. 協調多個 stores
2. 複雜的業務流程
3. 需要組合多個服務
4. 簡化元件邏輯

**不需要 Facade 的情況**:
1. 簡單的 CRUD 操作
2. 單一 store 互動
3. 元件直接使用 store 已足夠

## 與四層架構的對應

雖然合併了目錄，但邏輯分層仍然保持：

| 原四層架構 | 合併後對應 | 檔案位置 |
|-----------|----------|---------|
| Presentation | Smart Components | `routes/[feature]/pages/` |
| Presentation | Dumb Components | `routes/[feature]/components/` |
| Application | Facade Services | `routes/[feature]/services/` |
| Domain | Stores & Models | `core/state/stores/`, `core/models/` |
| Infrastructure | Repositories | `core/data-access/`, `blueprint/modules/[module]/repositories/` |

## 遷移步驟

### Step 1: 複審 features/ 目錄

```bash
# 列出所有 features
find src/app/features -type d -maxdepth 1

# 複審每個 feature 的內容
ls -la src/app/features/construction-log/
```

### Step 2: 合併到 routes/

```bash
# 若 routes/construction-log/ 已存在
# 合併 pages/, components/, services/
cp -r src/app/features/construction-log/pages/* \
      src/app/routes/construction-log/pages/

cp -r src/app/features/construction-log/components/* \
      src/app/routes/construction-log/components/

cp -r src/app/features/construction-log/services/* \
      src/app/routes/construction-log/services/
```

### Step 3: 更新 Imports

```typescript
// 更新所有 import statements
// 使用 IDE 的 "Find and Replace" 功能

// 舊路徑
import { ConstructionLogFacade } from '@features/construction-log/services';

// 新路徑
import { ConstructionLogFacade } from '@routes/construction-log/services';
```

### Step 4: 更新 Path Alias

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@routes/*": ["src/app/routes/*"],
      // 移除 @features/* alias
    }
  }
}
```

### Step 5: 刪除空目錄

```bash
# 確認所有檔案已遷移
find src/app/features -type f

# 刪除 features/ 目錄
rm -rf src/app/features
```

### Step 6: 執行測試與 Linting

```bash
# 執行 linting
yarn lint:ts

# 執行測試
yarn test

# 建置專案
yarn build
```

## 後果 (Consequences)

### 正面影響

1. ✅ **簡化結構** - 減少目錄層級
2. ✅ **符合慣例** - 遵循 ng-alain 標準
3. ✅ **提升一致性** - 統一的組織方式
4. ✅ **易於導航** - 所有功能在單一位置

### 負面影響與緩解

1. ⚠️ **遷移工作量** - 需要移動檔案和更新 imports
   - **緩解**: 使用 IDE 重構工具自動化

2. ⚠️ **可能的合併衝突** - 多人協作時的風險
   - **緩解**: 分階段遷移，逐個 feature 進行

3. ⚠️ **文檔更新** - 需要更新所有相關文檔
   - **緩解**: 建立遷移檢查清單

## 驗證檢查清單

遷移完成後，驗證以下項目：

- [ ] 所有檔案已從 features/ 移動到 routes/
- [ ] 所有 import statements 已更新
- [ ] tsconfig.json path alias 已更新
- [ ] 所有測試通過
- [ ] Linting 無錯誤
- [ ] 建置成功
- [ ] 應用程式正常運行
- [ ] 路由導航正常
- [ ] 文檔已更新

## 參考資料

- [ng-alain 官方文檔](https://ng-alain.com)
- [Angular Style Guide](https://angular.dev/style-guide)
- [Smart vs Presentational Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

## 相關 ADRs

- [ADR-0001: Blueprint 模組化系統](./0001-blueprint-modular-system.md)
- [ADR-0002: 混合 Repository 策略](./0002-hybrid-repository-strategy.md)

---

**作者**: Architecture Team  
**建立日期**: 2025-12-14  
**最後更新**: 2025-12-14  
**狀態**: ✅ Accepted
