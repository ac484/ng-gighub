# ADR-0002: 混合 Repository 策略

## 狀態
✅ **已採納** (Accepted)

## 情境 (Context)

企業級 Angular 應用的資料存取層組織方式對可維護性、擴展性和團隊協作有重大影響。需要在集中式管理和模組獨立性之間取得平衡。

## 決策 (Decision)

採用 **混合 Repository 策略**:
- **共享/基礎 Repositories** → `core/data-access/repositories/shared/`
- **模組特定 Repositories** → `blueprint/modules/[module]/repositories/`
- **基礎設施 Repositories** → `core/infrastructure/`

### 決策準則

| Repository 類型 | 放置位置 | 理由 |
|----------------|---------|------|
| Account, Organization, User | `core/data-access/shared/` | 跨模組共用 |
| Task, Log, QA | `blueprint/modules/[module]/` | 模組特定邏輯 |
| Firebase Storage | `core/infrastructure/` | 基礎設施服務 |

### 決策樹

```mermaid
flowchart TD
    Start[需要 Repository?] --> Q1{跨多個模組使用?}
    Q1 -->|是| Shared[core/data-access/shared/]
    Q1 -->|否| Q2{是基礎設施服務?}
    Q2 -->|是| Infra[core/infrastructure/]
    Q2 -->|否| Module[blueprint/modules/[module]/]
```

## 理由 (Rationale)

**優點**:
1. **平衡獨立性與一致性** - 共享資料統一，模組資料獨立
2. **支援 DDD 原則** - Repository 靠近 Aggregates
3. **團隊協作友善** - 減少合併衝突
4. **擴展性** - 新模組不影響共享層
5. **Blueprint 模組化** - 支援動態載入

**實作範例**:
```typescript
// 基礎介面
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}

// 共享 Repository
@Injectable({ providedIn: 'root' })
export class AccountRepository extends FirestoreBaseRepository<Account> {
  protected tableName = 'accounts';
}

// 模組 Repository
@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<Task> {
  protected tableName = 'tasks';
  
  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    return this.findAll({ filters: { blueprint_id: blueprintId } });
  }
}
```

## 後果 (Consequences)

### 正面影響
✅ 清晰的職責劃分
✅ 更好的可測試性
✅ 支援模組化架構
✅ 減少程式碼重複

### 負面影響與緩解
⚠️ 決策複雜度 → 提供決策樹和範例
⚠️ 跨模組查詢 → 透過 Facade 協調
⚠️ 快取策略 → 基礎類別統一快取

---

**作者**: Architecture Team  
**建立日期**: 2025-12-14  
**狀態**: ✅ Accepted
