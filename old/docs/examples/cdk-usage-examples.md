# Angular CDK 模組使用範例

本文檔提供 Angular CDK 模組在 GigHub 專案中的實際使用範例。

## 目錄
1. [基本設定](#基本設定)
2. [虛擬滾動 (Scrolling)](#虛擬滾動-scrolling)
3. [可存取性 (A11y)](#可存取性-a11y)
4. [斷點服務 (Breakpoint Service)](#斷點服務-breakpoint-service)
5. [DOM 監聽 (Observers)](#dom-監聽-observers)

---

## 基本設定

### 導入方式

```typescript
// 方式 1: 導入可選 CDK 模組
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling,  // 按需導入
    OPTIONAL_CDK_MODULES.a11y
  ]
})
export class ExampleComponent {}
```

完整範例請參閱專案源碼。

---

**文檔版本**: 1.0  
**最後更新**: 2025-12-13  
**維護者**: GigHub 開發團隊
