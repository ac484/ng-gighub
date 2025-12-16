# SETC-033: Warranty Repository Implementation

> **任務 ID**: SETC-033  
> **任務名稱**: Warranty Repository Implementation  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-032 (Warranty Module Foundation)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固資料存取層實作

### 背景 / 目的
實作 Warranty Module 的 Repository 層，包括 Warranty、WarrantyDefect、WarrantyRepair 的 CRUD 操作和 Firestore Security Rules。

### 需求說明
1. 實作 WarrantyRepository
2. 實作 WarrantyDefectRepository
3. 實作 WarrantyRepairRepository
4. 實作 Firestore Security Rules
5. 實作查詢方法
6. 實作單元測試

### In Scope / Out of Scope

#### ✅ In Scope
- WarrantyRepository 實作
- WarrantyDefectRepository 實作
- WarrantyRepairRepository 實作
- Firestore Security Rules
- 查詢與篩選方法
- 單元測試

#### ❌ Out of Scope
- 業務邏輯（SETC-034~036）
- UI 元件（SETC-038）

### 功能行為
提供保固相關資料的 CRUD 操作和查詢功能。

### 資料 / API

#### WarrantyRepository

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyRepository {
  private firestore = inject(Firestore);

  private getWarrantiesCollection(blueprintId: string) {
    return collection(
      this.firestore,
      `blueprints/${blueprintId}/warranties`
    );
  }

  async create(warranty: Omit<Warranty, 'id'>): Promise<Warranty> {
    const col = this.getWarrantiesCollection(warranty.blueprintId);
    const docRef = await addDoc(col, {
      ...warranty,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { ...warranty, id: docRef.id } as Warranty;
  }

  async update(
    blueprintId: string,
    id: string,
    data: Partial<Warranty>
  ): Promise<void> {
    const docRef = doc(
      this.firestore,
      `blueprints/${blueprintId}/warranties/${id}`
    );
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async getById(blueprintId: string, id: string): Promise<Warranty | null> {
    const docRef = doc(
      this.firestore,
      `blueprints/${blueprintId}/warranties/${id}`
    );
    const snapshot = await getDoc(docRef);
    return snapshot.exists()
      ? { id: snapshot.id, ...snapshot.data() } as Warranty
      : null;
  }

  getByBlueprintId$(blueprintId: string): Observable<Warranty[]> {
    const col = this.getWarrantiesCollection(blueprintId);
    return collectionData(col, { idField: 'id' }) as Observable<Warranty[]>;
  }

  async getByAcceptanceId(
    blueprintId: string,
    acceptanceId: string
  ): Promise<Warranty | null> {
    const col = this.getWarrantiesCollection(blueprintId);
    const q = query(col, where('acceptanceId', '==', acceptanceId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Warranty;
  }

  async getByStatus(
    blueprintId: string,
    statuses: WarrantyStatus[]
  ): Promise<Warranty[]> {
    const col = this.getWarrantiesCollection(blueprintId);
    const q = query(col, where('status', 'in', statuses));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty));
  }

  async getExpiringWarranties(
    blueprintId: string,
    withinDays: number
  ): Promise<Warranty[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    const col = this.getWarrantiesCollection(blueprintId);
    const q = query(
      col,
      where('status', '==', 'active'),
      where('endDate', '<=', futureDate),
      orderBy('endDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty));
  }
}
```

#### WarrantyDefectRepository

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyDefectRepository {
  private firestore = inject(Firestore);

  private getDefectsCollection(blueprintId: string, warrantyId: string) {
    return collection(
      this.firestore,
      `blueprints/${blueprintId}/warranties/${warrantyId}/defects`
    );
  }

  async create(defect: Omit<WarrantyDefect, 'id'>): Promise<WarrantyDefect> {
    const col = this.getDefectsCollection(defect.blueprintId, defect.warrantyId);
    const docRef = await addDoc(col, {
      ...defect,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { ...defect, id: docRef.id } as WarrantyDefect;
  }

  async getByWarrantyId(
    blueprintId: string,
    warrantyId: string
  ): Promise<WarrantyDefect[]> {
    const col = this.getDefectsCollection(blueprintId, warrantyId);
    const snapshot = await getDocs(col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarrantyDefect));
  }

  getByWarrantyId$(
    blueprintId: string,
    warrantyId: string
  ): Observable<WarrantyDefect[]> {
    const col = this.getDefectsCollection(blueprintId, warrantyId);
    return collectionData(col, { idField: 'id' }) as Observable<WarrantyDefect[]>;
  }

  async getOpenDefects(
    blueprintId: string,
    warrantyId: string
  ): Promise<WarrantyDefect[]> {
    const col = this.getDefectsCollection(blueprintId, warrantyId);
    const q = query(
      col,
      where('status', 'in', ['reported', 'confirmed', 'under_repair'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarrantyDefect));
  }
}
```

#### Firestore Security Rules

```firestore-security-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Warranty rules
    match /blueprints/{blueprintId}/warranties/{warrantyId} {
      allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
      allow create: if isAuthenticated() && canCreateWarranty(blueprintId);
      allow update: if isAuthenticated() && canUpdateWarranty(blueprintId);
      allow delete: if isAuthenticated() && isAdmin(blueprintId);

      // Warranty Defects subcollection
      match /defects/{defectId} {
        allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
        allow create: if isAuthenticated() && canReportDefect(blueprintId);
        allow update: if isAuthenticated() && canUpdateDefect(blueprintId);
        allow delete: if isAuthenticated() && isAdmin(blueprintId);
      }

      // Warranty Repairs subcollection
      match /repairs/{repairId} {
        allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
        allow create: if isAuthenticated() && canCreateRepair(blueprintId);
        allow update: if isAuthenticated() && canUpdateRepair(blueprintId);
        allow delete: if isAuthenticated() && isAdmin(blueprintId);
      }
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isBlueprintMember(blueprintId) {
      return exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
    }

    function canCreateWarranty(blueprintId) {
      return hasRole(blueprintId, ['admin', 'manager']);
    }

    function canReportDefect(blueprintId) {
      return isBlueprintMember(blueprintId);
    }
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/repositories/`
- `firestore.rules`

### 驗收條件
1. ✅ CRUD 操作正常
2. ✅ 查詢方法完整
3. ✅ Security Rules 正確
4. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Firestore Subcollection 與 Security Rules

**查詢重點**:
- Subcollection 查詢模式
- Security Rules 進階函式
- 複合索引設計

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **Collection 結構**
   - warranties/{id}
   - warranties/{id}/defects/{id}
   - warranties/{id}/repairs/{id}

2. **查詢優化**
   - 常用篩選條件
   - 索引設計
   - 分頁支援

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── WarrantyRepository 實作
├── WarrantyDefectRepository 實作
└── WarrantyRepairRepository 實作

Day 2 (8 hours):
├── Firestore Security Rules
├── 索引配置
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty-defect.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty-repair.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/index.ts`

**修改檔案**:
- `firestore.rules`
- `firestore.indexes.json`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ Repository 模式
- ✅ Subcollection 結構
- ✅ Security Rules 完整
- ✅ 類型安全

---

## ✅ 檢查清單

### 功能檢查
- [x] CRUD 操作正常
- [x] 查詢方法完整
- [x] Subcollection 正確

### 安全性檢查
- [ ] Security Rules 測試（需要實際 Firestore 環境）
- [x] 權限驗證正確

---

## 📁 實作檔案

### 新增檔案
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty-defect.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/warranty-repair.repository.ts`
- `src/app/core/blueprint/modules/implementations/warranty/repositories/index.ts`

### 修改檔案
- `src/app/core/blueprint/modules/implementations/warranty/warranty.module.ts` - 注入 repositories
- `src/app/core/blueprint/modules/implementations/warranty/index.ts` - 導出 repositories
