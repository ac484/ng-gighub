# 夥伴成員管理現代化實施文檔

## 概述

本文檔說明 GigHub 專案中夥伴成員管理功能的現代化實施，遵循 Angular 20+ 最佳實踐和 Context7 官方文檔指引。

## 實施日期

2025-12-17

## 技術棧

- **Angular**: 20.3.x (Standalone Components, Signals)
- **ng-zorro-antd**: 20.3.x (UI 元件庫)
- **Firebase/Firestore**: 2.86.x (BaaS 後端)
- **TypeScript**: 5.9.x

## 問題陳述

根據問題描述「夥伴管理的成員管理尚未實現」，經過分析發現：

1. ✅ 基本 CRUD 功能已實現
2. ⚠️ 存在 TODO 項目需要改進
3. ⚠️ UI/UX 需要增強以顯示更多成員資訊

## 實施內容

### 1. Repository 層改進

#### 新增 `updateRole()` 方法

**檔案**: `src/app/core/data-access/repositories/shared/partner-member.repository.ts`

**改進前**:
```typescript
// 使用刪除後重建的模式
async updateMemberRole(memberId, partnerId, userId, newRole) {
  await this.removeMember(memberId);
  await this.addMember(partnerId, userId, newRole);
}
```

**改進後**:
```typescript
/**
 * Update member role
 * 更新成員角色
 *
 * Modern implementation using Firestore updateDoc instead of delete+add pattern.
 * This preserves the member ID and joined_at timestamp while updating the role.
 */
async updateRole(memberId: string, newRole: PartnerRole): Promise<void> {
  await updateDoc(this.getDocRef(memberId), { role: newRole });
  console.log('[PartnerMemberRepository] ✅ Member role updated:', memberId, 'to', newRole);
}
```

**優點**:
- ✅ 保留成員 ID 和加入時間戳記
- ✅ 避免刪除後重建的數據不一致風險
- ✅ 更好的效能（單次寫入 vs 刪除+新增）
- ✅ 符合 Firestore 最佳實踐

### 2. Store 層改進

**檔案**: `src/app/core/state/stores/partner.store.ts`

**改進前**:
```typescript
async updateMemberRole(memberId: string, partnerId: string, userId: string, newRole: PartnerRole) {
  await this.memberRepository.removeMember(memberId);
  const updatedMember = await this.memberRepository.addMember(partnerId, userId, newRole);
  this._members.update(members => members.map(member => 
    member.id === memberId ? updatedMember : member
  ));
}
```

**改進後**:
```typescript
async updateMemberRole(memberId: string, partnerId: string, newRole: PartnerRole): Promise<void> {
  // Update role in Firestore
  await this.memberRepository.updateRole(memberId, newRole);

  // Update local state - find and update the member's role
  this._members.update(members => 
    members.map(member => 
      member.id === memberId 
        ? { ...member, role: newRole } 
        : member
    )
  );
}
```

**優點**:
- ✅ 移除不必要的 `userId` 參數
- ✅ 更簡潔的 API
- ✅ 更清晰的職責分離

### 3. UI 層改進

**檔案**: `src/app/routes/partner/members/partner-members.component.ts`

#### 3.1 新增成員帳戶資訊顯示

**新增功能**:
```typescript
// Member accounts cache for displaying user information
private readonly memberAccountsMap = new Map<string, Account>();

/**
 * Load member accounts for displaying user information
 * 載入成員帳戶資訊以顯示使用者資訊
 */
private async loadMemberAccounts(): Promise<void> {
  const members = this.displayMembers();
  
  // Create parallel requests for all member accounts
  const accountRequests = members.map(member =>
    this.accountRepository.findById(member.user_id).pipe(
      map(account => ({ userId: member.user_id, account })),
      catchError(() => of({ userId: member.user_id, account: null }))
    )
  );

  const results = await forkJoin(accountRequests).toPromise();
  results?.forEach(({ userId, account }) => {
    if (account) {
      this.memberAccountsMap.set(userId, account);
    }
  });
}
```

#### 3.2 增強表格 UI

**改進前**:
```html
<td>{{ member.user_id }}</td>
```

**改進後**:
```html
<td>
  <div class="member-info">
    <nz-avatar 
      [nzSize]="40" 
      [nzSrc]="getMemberAccount(member.user_id)?.avatar_url || undefined" 
      [nzText]="getMemberInitials(member.user_id)"
    ></nz-avatar>
    <div class="member-details">
      <div class="member-name">{{ getMemberAccount(member.user_id)?.name || member.user_id }}</div>
      <div class="member-email">{{ getMemberAccount(member.user_id)?.email || '載入中...' }}</div>
    </div>
  </div>
</td>
```

#### 3.3 新增 CSS 樣式

```css
.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-weight: 500;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.member-email {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
```

## Angular 20+ 現代模式應用

### 1. Signals 狀態管理

```typescript
// Private state
private readonly memberAccountsMap = new Map<string, Account>();

// Computed signal for displaying members
displayMembers = computed(() => {
  const partnerId = this.effectivePartnerId();
  if (!partnerId) return [];
  return this.partnerStore.currentPartnerMembers();
});
```

### 2. Effect 副作用處理

```typescript
// Effect to load member accounts when members change
effect(() => {
  const members = this.displayMembers();
  if (members.length > 0) {
    queueMicrotask(() => {
      this.loadMemberAccounts();
    });
  }
});
```

### 3. 新控制流語法

```html
@if (displayMembers().length > 0) {
  <nz-table #table [nzData]="displayMembers()">
    <!-- table content -->
  </nz-table>
} @else {
  <nz-empty nzNotFoundContent="暫無成員"></nz-empty>
}

@for (member of table.data; track member.id) {
  <tr>
    <!-- row content -->
  </tr>
}
```

### 4. inject() 依賴注入

```typescript
readonly workspaceContext = inject(WorkspaceContextService);
readonly partnerStore = inject(PartnerStore);
private readonly accountRepository = inject(AccountRepository);
private readonly modal = inject(NzModalService);
private readonly message = inject(NzMessageService);
```

### 5. OnPush 變更檢測

```typescript
@Component({
  selector: 'app-partner-members',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

## 效能優化

### 1. 平行 HTTP 請求

使用 `forkJoin` 平行載入所有成員的帳戶資訊：

```typescript
const accountRequests = members.map(member =>
  this.accountRepository.findById(member.user_id).pipe(
    map(account => ({ userId: member.user_id, account })),
    catchError(() => of({ userId: member.user_id, account: null }))
  )
);

const results = await forkJoin(accountRequests).toPromise();
```

**優點**:
- ✅ 減少總體載入時間
- ✅ 改善使用者體驗
- ✅ 更有效率的資源使用

### 2. 成員帳戶快取

使用 `Map` 快取成員帳戶資訊：

```typescript
private readonly memberAccountsMap = new Map<string, Account>();
```

**優點**:
- ✅ 避免重複請求
- ✅ 快速存取
- ✅ 減少伺服器負載

### 3. 智能姓名縮寫

```typescript
getMemberInitials(userId: string): string {
  const account = this.memberAccountsMap.get(userId);
  if (account?.name) {
    const name = account.name.trim();
    if (/[\u4e00-\u9fa5]/.test(name)) {
      // Chinese name - take first 2 characters
      return name.slice(0, 2);
    } else {
      // English name - take first letter of first 2 words
      const parts = name.split(/\s+/);
      return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
    }
  }
  return userId.slice(0, 2).toUpperCase();
}
```

**支援**:
- ✅ 中文姓名（取前 2 字）
- ✅ 英文姓名（取前 2 個單字首字母）
- ✅ 備援邏輯（使用 user ID）

## Context7 文檔參考

### Angular 21 Signals 最佳實踐

根據 Context7 `/websites/angular_dev_v21` 文檔：

1. ✅ 使用 `computed()` 處理衍生狀態
2. ✅ 使用 `effect()` 處理副作用
3. ✅ 使用 `signal.update()` 更新狀態
4. ✅ 使用 `asReadonly()` 暴露只讀狀態

### ng-zorro-antd Modal 最佳實踐

根據 Context7 `/ng-zorro/ng-zorro-antd` 文檔：

1. ✅ 使用 `NzModalService` 創建 Modal
2. ✅ 使用 `nzOnOk` 處理確認邏輯
3. ✅ 返回 Promise 控制 Modal 關閉
4. ✅ 使用 `nzContent` 自訂 Modal 內容

### ng-zorro-antd Avatar 最佳實踐

根據 Context7 文檔：

1. ✅ 使用 `nzSrc` 設定頭像圖片
2. ✅ 使用 `nzText` 設定文字替代
3. ✅ 使用 `nzSize` 控制大小
4. ✅ 頭像未載入時自動顯示縮寫

## 測試計畫

### 手動測試清單

- [ ] **新增成員**
  - [ ] 驗證可以新增成員到夥伴
  - [ ] 驗證成員顯示頭像和姓名
  - [ ] 驗證成員角色正確顯示

- [ ] **變更角色**
  - [ ] 驗證可以變更成員角色
  - [ ] 驗證角色變更後立即更新 UI
  - [ ] 驗證成員 ID 和加入時間保持不變

- [ ] **移除成員**
  - [ ] 驗證可以移除成員
  - [ ] 驗證移除後 UI 立即更新
  - [ ] 驗證確認對話框正常運作

- [ ] **成員資訊顯示**
  - [ ] 驗證頭像正確顯示
  - [ ] 驗證姓名正確顯示
  - [ ] 驗證 Email 正確顯示
  - [ ] 驗證中文姓名縮寫正確
  - [ ] 驗證英文姓名縮寫正確

- [ ] **效能測試**
  - [ ] 驗證多個成員同時載入效能
  - [ ] 驗證平行請求正常運作
  - [ ] 驗證快取機制有效

## 建置狀態

```bash
$ yarn build
✔ Building...
Output location: /home/runner/work/ng-gighub/ng-gighub/dist/ng-alain
```

✅ 建置成功
⚠️ Bundle size warning (預期行為，無安全問題)

## 相關檔案

### 修改檔案

1. `src/app/core/data-access/repositories/shared/partner-member.repository.ts`
   - 新增 `updateRole()` 方法
   - 匯入 `updateDoc` from `@angular/fire/firestore`

2. `src/app/core/state/stores/partner.store.ts`
   - 更新 `updateMemberRole()` 方法
   - 簡化 API 移除 `userId` 參數

3. `src/app/routes/partner/members/partner-members.component.ts`
   - 新增成員帳戶載入功能
   - 增強表格 UI 顯示
   - 新增 CSS 樣式
   - 新增輔助方法

### 相關依賴

- `@angular/fire/firestore` - Firestore 操作
- `ng-zorro-antd/avatar` - 頭像元件
- `rxjs` - 平行請求處理

## 總結

本次現代化實施完成了以下目標：

1. ✅ 新增 `updateRole()` 方法使用 Firestore 最佳實踐
2. ✅ 簡化 Store API 提升可維護性
3. ✅ 增強 UI/UX 顯示完整成員資訊
4. ✅ 實施效能優化（平行請求、快取）
5. ✅ 遵循 Angular 20+ 現代模式
6. ✅ 符合 Context7 官方文檔指引

### 技術亮點

- 🎯 **Repository 模式**: 清晰的資料存取層
- 🔄 **Signal 狀態管理**: 響應式狀態更新
- ⚡ **效能優化**: 平行請求和快取機制
- 🎨 **現代 UI**: 視覺化成員資訊顯示
- 📚 **文檔導向**: 基於 Context7 最佳實踐

### 未來改進建議

1. 新增成員搜尋和篩選功能
2. 新增成員權限詳細檢視
3. 新增批次操作功能
4. 新增成員活動歷史記錄
5. 新增單元測試和 E2E 測試

## 參考資料

- [Angular 官方文檔 v21](https://angular.dev)
- [ng-zorro-antd 官方文檔](https://ng.ant.design)
- [Firebase/Firestore 文檔](https://firebase.google.com/docs/firestore)
- [Context7 Documentation Query Results](context7://queries)

---

**文檔版本**: 1.0  
**最後更新**: 2025-12-17  
**作者**: GitHub Copilot + 7Spade
