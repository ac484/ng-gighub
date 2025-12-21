# Core Repositories Agent Guide

## Title + Scope
Scope: Unified data access layer under src/app/core/data-access/repositories for GigHub entities.

## Purpose / Responsibility
Define repository responsibilities, enforce the repository pattern, and ensure consistent Firestore access, validation, and logging.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific logic; repositories handle data access only.
- NO direct Firebase access outside these adapters; other layers must consume repositories.
- Use inject() for DI and avoid creating FirebaseService wrappers.

## Allowed / Expected Content
- Repository implementations for core entities, shared query utilities, and related documentation/tests.
- Data validation, mapping, and error handling tied to persistence concerns.

## Structure / Organization
- Individual repository files (account, audit-log, organization, team, log, task, storage, etc.).
- index.ts for public exports.
- Supporting helpers located alongside repositories as needed.

## Integration / Dependencies
- Use @angular/fire Firestore APIs via repository methods only.
- Log operations via LoggerService; propagate domain errors through core error types.
- No business logic; services/facades orchestrate repositories.

## Best Practices / Guidelines
- Provide standard CRUD/query APIs, handle errors with Result pattern, and avoid logging sensitive data.
- Keep methods pure where possible and validate inputs before writes.

## Related Docs / References
- ../AGENTS.md (Core overview)
- ../../blueprint/AGENTS.md (Blueprint repositories/services)
- ../../services/AGENTS.md

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Core Repositories Agent Guide

The Core Repositories directory contains unified data access layer for all entities in the GigHub application.

## Module Purpose

**規則**:
- 提供統一的資料存取介面
- 封裝 Firestore 操作細節
- 實作 Repository 模式
- 處理資料驗證和轉換
- 提供錯誤處理和日誌記錄
- 支援查詢、過濾和分頁

## Module Structure

**規則**:
- `src/app/core/repositories/AGENTS.md` - 本文件
- `account.repository.ts` - 帳號資料存取
- `audit-log.repository.ts` - 稽核日誌資料存取
- `organization.repository.ts` - 組織資料存取
- `organization-member.repository.ts` - 組織成員資料存取
- `team.repository.ts` - 團隊資料存取
- `team-member.repository.ts` - 團隊成員資料存取
- `log.repository.ts` - 日誌資料存取
- `task.repository.ts` - 任務資料存取
- `storage.repository.ts` - 儲存資料存取
- `index.ts` - 公開 API 匯出

## Repository Pattern

**規則**:
- 每個 Repository 必須使用 `@Injectable({ providedIn: 'root' })` 註冊為單例
- 必須使用 `inject()` 函數注入依賴（Firestore, LoggerService）
- 必須提供標準 CRUD 操作：
  - `findAll()` - 取得所有記錄
  - `findById(id: string)` - 根據 ID 取得單一記錄
  - `create(data: CreateData)` - 建立新記錄
  - `update(id: string, data: UpdateData)` - 更新記錄
  - `delete(id: string)` - 刪除記錄
- 必須使用 `@core/models` 定義的資料模型
- 必須實作適當的錯誤處理
- 必須使用 LoggerService 記錄操作

## Implementation Standards

### Firestore Integration

**規則**:
- 必須使用 `@angular/fire/firestore` 的 API
- 必須使用 `collection()` 和 `doc()` 函數
- 必須使用 `getDoc()`、`getDocs()`、`addDoc()`、`updateDoc()`、`deleteDoc()` 等方法
- 必須使用 `query()`、`where()`、`orderBy()`、`limit()` 進行查詢
- 必須處理 Firestore 錯誤（捕獲並轉換為應用程式錯誤）

### Error Handling

**規則**:
- 必須捕獲所有 Firestore 錯誤
- 必須使用 LoggerService 記錄錯誤
- 必須返回有意義的錯誤訊息
- 必須使用自訂錯誤類別（如 `@core/errors`）
- 必須在適當情況下重新拋出錯誤

### Logging

**規則**:
- 必須在每個操作開始時記錄 Debug 日誌
- 必須在操作成功時記錄 Info 日誌
- 必須在操作失敗時記錄 Error 日誌
- 必須包含相關上下文資訊（entity type, id, operation）
- 必須避免記錄敏感資料

## Repository Examples

### Basic CRUD Operations

```typescript
// account.repository.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger.service';

@Injectable({ providedIn: 'root' })
export class AccountRepository {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);
  private collectionName = 'accounts';

  async findAll(): Promise<Account[]> {
    this.logger.debug('AccountRepository', 'Finding all accounts');
    try {
      const ref = collection(this.firestore, this.collectionName);
      const snapshot = await getDocs(ref);
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      this.logger.info('AccountRepository', `Found ${accounts.length} accounts`);
      return accounts;
    } catch (error) {
      this.logger.error('AccountRepository', 'Failed to find accounts', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Account | null> {
    this.logger.debug('AccountRepository', `Finding account by id: ${id}`);
    try {
      const ref = doc(this.firestore, this.collectionName, id);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        this.logger.warn('AccountRepository', `Account not found: ${id}`);
        return null;
      }
      const account = { id: snapshot.id, ...snapshot.data() } as Account;
      this.logger.info('AccountRepository', `Found account: ${id}`);
      return account;
    } catch (error) {
      this.logger.error('AccountRepository', `Failed to find account: ${id}`, error);
      throw error;
    }
  }

  async create(data: CreateAccountData): Promise<Account> {
    this.logger.debug('AccountRepository', 'Creating account', data);
    try {
      const ref = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(ref, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      const account = { id: docRef.id, ...data } as Account;
      this.logger.info('AccountRepository', `Created account: ${docRef.id}`);
      return account;
    } catch (error) {
      this.logger.error('AccountRepository', 'Failed to create account', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateAccountData): Promise<void> {
    this.logger.debug('AccountRepository', `Updating account: ${id}`, data);
    try {
      const ref = doc(this.firestore, this.collectionName, id);
      await updateDoc(ref, {
        ...data,
        updated_at: new Date().toISOString()
      });
      this.logger.info('AccountRepository', `Updated account: ${id}`);
    } catch (error) {
      this.logger.error('AccountRepository', `Failed to update account: ${id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    this.logger.debug('AccountRepository', `Deleting account: ${id}`);
    try {
      const ref = doc(this.firestore, this.collectionName, id);
      await deleteDoc(ref);
      this.logger.info('AccountRepository', `Deleted account: ${id}`);
    } catch (error) {
      this.logger.error('AccountRepository', `Failed to delete account: ${id}`, error);
      throw error;
    }
  }
}
```

## Query Operations

**規則**:
- 必須提供查詢方法（如 `findByStatus()`, `findByOwner()` 等）
- 必須支援分頁（使用 `limit()` 和 `startAfter()`）
- 必須支援排序（使用 `orderBy()`）
- 必須支援過濾（使用 `where()`）
- 必須返回查詢結果和分頁資訊

## Import Conventions

**規則**:
- 從 `@core/repositories` 匯入：`import { AccountRepository } from '@core/repositories'`
- 使用 `inject()` 注入：`private accountRepo = inject(AccountRepository)`
- 不使用相對路徑：❌ `import { AccountRepository } from '../repositories/account.repository'`

## Best Practices

**規則**:
1. Repository 應該只負責資料存取，不包含業務邏輯
2. 業務邏輯應該在 Services 中實作
3. Repository 方法應該是純函數（相同輸入產生相同輸出）
4. 必須使用 TypeScript 嚴格類型
5. 必須提供 JSDoc 註解
6. 必須實作適當的錯誤處理
7. 必須使用 LoggerService 記錄操作
8. 必須使用 `@core/models` 定義的資料模型

## Testing

**規則**:
- 必須為每個 Repository 提供單元測試
- 必須 mock Firestore 服務
- 必須測試所有 CRUD 操作
- 必須測試錯誤處理
- 必須測試查詢和過濾功能

## Related Documentation

- **[Core Models](../models/AGENTS.md)** - Repository 使用的資料模型
- **[Core Services](../AGENTS.md)** - 使用 Repository 的服務
- **[Blueprint Repositories](../blueprint/repositories/AGENTS.md)** - Blueprint 專屬 repositories

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-11  
**Status**: Active
