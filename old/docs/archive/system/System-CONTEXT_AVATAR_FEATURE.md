# 上下文頭像切換功能 (Context Avatar Switching Feature)

## 功能說明

當用戶在個人/組織/團隊之間切換時，頭部導航列的頭像會自動更換為對應上下文的頭像或 Logo。

## 使用場景

### 1. 個人上下文 (Personal Context)
當用戶選擇個人帳戶時：
- **顯示**：用戶個人頭像 (`Account.avatar_url`)
- **來源**：Firebase Authentication 的 `photoURL`
- **備用**：如無頭像，顯示用戶圖標 (`user` icon)

### 2. 組織上下文 (Organization Context)
當用戶切換到組織時：
- **顯示**：組織 Logo (`Organization.logo_url`)
- **來源**：組織資料中的 `logo_url` 欄位
- **備用**：如無 Logo，顯示組織圖標 (`team` icon)

### 3. 團隊上下文 (Team Context)
當用戶切換到團隊時：
- **顯示**：所屬組織的 Logo (`Organization.logo_url`)
- **邏輯**：團隊本身沒有獨立頭像，使用父組織的 Logo
- **備用**：如無 Logo，顯示團隊圖標 (`usergroup-add` icon)

### 4. 機器人上下文 (Bot Context)
當用戶切換到機器人時：
- **顯示**：機器人圖標 (`robot` icon)
- **說明**：目前機器人模型中未定義頭像欄位

## 技術實現

### 架構設計

```
WorkspaceContextService
  ├─ contextType signal (ContextType)
  ├─ contextId signal (string | null)
  ├─ currentUser signal (Account | null)
  ├─ organizations signal (Organization[])
  ├─ teams signal (Team[])
  └─ contextAvatar computed signal (string | null) ← 新增
      ├─ 依據 contextType 和 contextId
      ├─ 從對應的資料源取得頭像/Logo
      └─ 返回圖片 URL 或 null

HeaderUserComponent
  ├─ 注入 WorkspaceContextService
  ├─ 讀取 contextAvatar computed signal
  └─ 條件渲染：
      ├─ 有頭像 → <nz-avatar [nzSrc]="...">
      └─ 無頭像 → <nz-avatar [nzIcon]="...">
```

### 核心代碼

#### WorkspaceContextService

```typescript
/**
 * Get the avatar/logo for the current context
 * 獲取當前上下文的頭像/Logo
 */
readonly contextAvatar = computed(() => {
  const type = this.contextType();
  const id = this.contextId();

  switch (type) {
    case ContextType.USER:
      return this.currentUser()?.avatar_url || null;
      
    case ContextType.ORGANIZATION:
      const org = this.organizations().find(o => o.id === id);
      return org?.logo_url || null;
      
    case ContextType.TEAM:
      // Teams don't have their own avatar, use the organization's logo
      const team = this.teams().find(t => t.id === id);
      if (team) {
        const parentOrg = this.organizations().find(o => o.id === team.organization_id);
        return parentOrg?.logo_url || null;
      }
      return null;
      
    case ContextType.BOT:
      // Bots don't have avatars in the current model
      return null;
      
    default:
      return null;
  }
});
```

#### HeaderUserComponent

```typescript
export class HeaderUserComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);
  
  readonly contextLabel = this.workspaceContext.contextLabel;
  readonly contextIcon = this.workspaceContext.contextIcon;
  
  // Convert null to undefined for ng-zorro compatibility
  readonly currentAvatar = computed(() => {
    const avatar = this.workspaceContext.contextAvatar();
    return avatar || undefined;
  });
}
```

```html
<!-- Template -->
<div class="alain-default__nav-item d-flex align-items-center px-sm">
  @if (currentAvatar()) {
    <nz-avatar [nzSrc]="currentAvatar()!" nzSize="small" class="mr-sm" />
  } @else {
    <nz-avatar [nzIcon]="contextIcon()" nzSize="small" class="mr-sm" />
  }
  {{ contextLabel() }}
</div>
```

## 響應式設計

### Angular Signals 響應式鏈

```
firebaseUser signal (Firebase Auth)
  ↓
currentUser signal (Account)
  ↓
contextType signal (ContextType)
  ↓
contextId signal (string | null)
  ↓
contextAvatar computed signal (string | null)
  ↓
currentAvatar computed signal (string | undefined)
  ↓
HeaderUserComponent template re-render
  ↓
UI 自動更新頭像
```

### 自動更新機制

1. **上下文切換時**：
   - 用戶點擊 Context Switcher 中的項目
   - `WorkspaceContextService.switchContext()` 更新 `contextType` 和 `contextId` signals
   - `contextAvatar` computed signal 自動重新計算
   - `HeaderUserComponent` 模板自動重新渲染
   - UI 顯示新的頭像

2. **數據載入時**：
   - 用戶登入後，Firebase Auth 觸發 `firebaseUser` signal 更新
   - `WorkspaceContextService` 自動載入組織和團隊資料
   - `organizations` 和 `teams` signals 更新
   - 如果當前上下文是組織或團隊，`contextAvatar` 自動更新
   - UI 顯示對應的 Logo

3. **頭像上傳時**：
   - 用戶上傳新的個人頭像或組織 Logo
   - Repository 更新 Firestore 數據
   - `organizations` 或 `currentUser` signal 更新
   - `contextAvatar` computed signal 自動重新計算
   - UI 即時顯示新頭像

## 數據模型

### Account (個人帳戶)
```typescript
export interface Account {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatar_url?: string | null;  // ← 個人頭像
  created_at?: string;
}
```

### Organization (組織)
```typescript
export interface Organization {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;      // ← 組織 Logo
  created_by: string;
  created_at?: string;
}
```

### Team (團隊)
```typescript
export interface Team {
  id: string;
  organization_id: string;       // ← 用於查找父組織
  name: string;
  description?: string | null;
  created_at?: string;
  // 注意：Team 沒有獨立的 logo_url，使用組織的 Logo
}
```

## 圖標映射

當沒有頭像/Logo 時，顯示對應的圖標：

| 上下文類型 | 圖標類型 | ng-zorro icon |
|-----------|---------|---------------|
| USER (個人) | 用戶圖標 | `user` |
| ORGANIZATION (組織) | 團隊圖標 | `team` |
| TEAM (團隊) | 用戶群組圖標 | `usergroup-add` |
| BOT (機器人) | 機器人圖標 | `robot` |

## 性能考量

### 1. Computed Signal 效能
- **優點**：只在依賴變更時重新計算
- **效率**：O(n) 查找，n 是組織或團隊數量（通常 < 100）
- **緩存**：Angular 自動緩存 computed signal 結果

### 2. 模板更新
- **OnPush 變更檢測**：僅在 signal 變更時更新
- **避免不必要的重新渲染**：使用 `@if` 條件渲染

### 3. 記憶體使用
- **最小化**：不複製數據，只引用現有的 signals
- **共享狀態**：所有元件共用同一個 `WorkspaceContextService` 實例

## 擴展性

### 未來可能的增強

1. **Bot 頭像支援**
   - 在 `Bot` 介面中添加 `avatar_url` 欄位
   - 更新 `contextAvatar` computed signal 處理 Bot 頭像

2. **Team 獨立頭像**
   - 在 `Team` 介面中添加 `logo_url` 欄位
   - 優先使用團隊自己的 Logo，備用父組織 Logo

3. **頭像緩存**
   - 實現圖片本地緩存機制
   - 減少網路請求，提升載入速度

4. **預設頭像生成**
   - 當沒有自訂頭像時，自動生成初始字母頭像
   - 使用組織/團隊名稱的首字母

## 測試建議

### 單元測試

```typescript
describe('WorkspaceContextService - contextAvatar', () => {
  it('should return user avatar when in USER context', () => {
    // Given: User with avatar
    service.currentUserState.set({
      id: '1',
      uid: '1',
      name: 'John',
      email: 'john@example.com',
      avatar_url: 'https://example.com/avatar.jpg'
    });
    service.contextTypeState.set(ContextType.USER);
    
    // When: Get context avatar
    const avatar = service.contextAvatar();
    
    // Then: Should return user avatar
    expect(avatar).toBe('https://example.com/avatar.jpg');
  });
  
  it('should return organization logo when in ORGANIZATION context', () => {
    // Given: Organization with logo
    service.organizationsState.set([{
      id: 'org1',
      name: 'Acme Corp',
      logo_url: 'https://example.com/logo.jpg',
      created_by: '1'
    }]);
    service.contextTypeState.set(ContextType.ORGANIZATION);
    service.contextIdState.set('org1');
    
    // When: Get context avatar
    const avatar = service.contextAvatar();
    
    // Then: Should return organization logo
    expect(avatar).toBe('https://example.com/logo.jpg');
  });
  
  it('should return parent organization logo when in TEAM context', () => {
    // Given: Team with parent organization
    service.organizationsState.set([{
      id: 'org1',
      name: 'Acme Corp',
      logo_url: 'https://example.com/logo.jpg',
      created_by: '1'
    }]);
    service.teamsState.set([{
      id: 'team1',
      organization_id: 'org1',
      name: 'Dev Team'
    }]);
    service.contextTypeState.set(ContextType.TEAM);
    service.contextIdState.set('team1');
    
    // When: Get context avatar
    const avatar = service.contextAvatar();
    
    // Then: Should return parent organization logo
    expect(avatar).toBe('https://example.com/logo.jpg');
  });
});
```

### 整合測試

```typescript
describe('HeaderUserComponent - Avatar Switching', () => {
  it('should display user avatar when in personal context', () => {
    // Test avatar rendering with user context
  });
  
  it('should display organization logo when switching to organization', () => {
    // Test avatar updates when context switches
  });
  
  it('should display icon when no avatar is available', () => {
    // Test fallback icon rendering
  });
});
```

### E2E 測試

```typescript
describe('Context Avatar Switching E2E', () => {
  it('should update header avatar when switching contexts', () => {
    // 1. Login as user
    // 2. Verify personal avatar is displayed
    // 3. Switch to organization
    // 4. Verify organization logo is displayed
    // 5. Switch to team
    // 6. Verify parent organization logo is displayed
  });
});
```

## 常見問題

### Q1: 為什麼團隊沒有獨立的頭像？
**A**: 目前的數據模型中，Team 介面沒有 `logo_url` 欄位。團隊使用父組織的 Logo 以保持視覺一致性。未來可以根據需求添加團隊獨立頭像功能。

### Q2: 頭像更新需要刷新頁面嗎？
**A**: 不需要。使用 Angular Signals 的響應式機制，頭像更新會自動反映到 UI。上傳新頭像後，只要更新對應的 signal，UI 就會立即更新。

### Q3: 圖片載入失敗會怎樣？
**A**: ng-zorro 的 `nz-avatar` 元件會自動處理圖片載入失敗，顯示備用圖標。我們的模板也有條件渲染邏輯，當 `contextAvatar()` 返回 null 時，會顯示對應的圖標。

### Q4: 支援哪些圖片格式？
**A**: 支援所有瀏覽器支援的圖片格式（JPEG, PNG, GIF, WebP, SVG）。建議使用 WebP 格式以獲得最佳性能和檔案大小。

### Q5: 如何設定組織 Logo？
**A**: 在組織管理頁面上傳 Logo，更新 `Organization.logo_url` 欄位。系統會自動同步到 UI。

## 相關文件

- `src/app/shared/services/workspace-context.service.ts` - 核心服務實現
- `src/app/layout/basic/widgets/user.component.ts` - 頭像顯示元件
- `src/app/layout/basic/widgets/context-switcher.component.ts` - 上下文切換器
- `src/app/core/types/account.types.ts` - 資料模型定義

## 版本歷史

- **v1.0.0** (2025-12-09): 初始實現
  - 支援個人/組織/團隊上下文頭像切換
  - 使用 Angular Signals 實現響應式更新
  - 支援頭像/Logo 與圖標的條件渲染

## 未來規劃

1. **頭像上傳功能**
   - 實現直接從 HeaderUserComponent 上傳頭像
   - 支援圖片裁剪和壓縮

2. **頭像緩存優化**
   - 實現 Service Worker 緩存策略
   - 減少重複的網路請求

3. **動畫效果**
   - 添加頭像切換的過渡動畫
   - 提升用戶體驗

4. **無障礙改進**
   - 添加 ARIA 標籤
   - 支援鍵盤導航
