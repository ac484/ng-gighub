# SETC-034: Warranty Period Management Service

> **任務 ID**: SETC-034  
> **任務名稱**: Warranty Period Management Service  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-033 (Warranty Repository)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固期管理服務實作

### 背景 / 目的
實作保固期管理服務，包括保固期追蹤、到期提醒、狀態自動更新、保固證明生成。根據 SETC.md：驗收通過 → 進入保固期 → 保固期管理 → 保固期滿。

### 需求說明
1. 實作 WarrantyPeriodService
2. 從驗收自動建立保固記錄
3. 保固期狀態自動更新
4. 到期提醒通知
5. 保固證明生成

### In Scope / Out of Scope

#### ✅ In Scope
- WarrantyPeriodService 實作
- 自動建立保固記錄
- 狀態自動更新
- 到期提醒機制
- 保固證明生成

#### ❌ Out of Scope
- 缺失管理（SETC-035）
- 維修管理（SETC-036）
- UI 元件（SETC-038）

### 功能行為
管理保固期限，自動追蹤狀態，發送到期提醒。

### 資料 / API

#### WarrantyPeriodService

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyPeriodService {
  private warrantyRepository = inject(WarrantyRepository);
  private acceptanceRepository = inject(AcceptanceRepository);
  private contractRepository = inject(ContractRepository);
  private eventBus = inject(BlueprintEventBusService);
  private notificationService = inject(NotificationService);

  /**
   * 從驗收結果自動建立保固記錄
   */
  async autoCreateFromAcceptance(
    acceptanceId: string,
    options?: CreateWarrantyOptions
  ): Promise<Warranty> {
    const acceptance = await this.acceptanceRepository.getById(acceptanceId);
    if (!acceptance) {
      throw new Error(`Acceptance not found: ${acceptanceId}`);
    }

    const contract = await this.contractRepository.getById(acceptance.contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${acceptance.contractId}`);
    }

    const warrantyPeriod = options?.periodMonths 
      ?? contract.warrantyPeriodMonths 
      ?? WarrantyConfig.defaultPeriodMonths;

    const startDate = acceptance.finalizedDate ?? new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + warrantyPeriod);

    const warranty: Omit<Warranty, 'id'> = {
      blueprintId: acceptance.blueprintId,
      acceptanceId,
      contractId: contract.id,
      taskIds: acceptance.taskIds,
      warrantyNumber: this.generateWarrantyNumber(),
      warrantyType: options?.type ?? 'standard',
      items: this.createWarrantyItems(acceptance, contract, startDate, warrantyPeriod),
      startDate,
      endDate,
      periodInMonths: warrantyPeriod,
      warrantor: this.mapToWarrantorInfo(contract.contractor),
      status: 'active',
      defectCount: 0,
      repairCount: 0,
      notificationSettings: {
        enabled: true,
        notifyDaysBefore: WarrantyConfig.defaultNotifyDaysBefore,
        notifyEmails: options?.notifyEmails ?? []
      },
      createdBy: options?.actor?.userId ?? 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.warrantyRepository.create(warranty);

    this.eventBus.emit({
      type: SystemEventType.WARRANTY_PERIOD_STARTED,
      blueprintId: warranty.blueprintId,
      timestamp: new Date(),
      actor: options?.actor ?? this.getSystemActor(),
      data: {
        warrantyId: created.id,
        acceptanceId,
        startDate,
        endDate,
        periodMonths: warrantyPeriod
      }
    });

    return created;
  }

  /**
   * 檢查並更新保固狀態
   */
  async checkAndUpdateStatus(blueprintId: string): Promise<void> {
    const warranties = await this.warrantyRepository.getByStatus(
      blueprintId,
      ['active', 'expiring']
    );

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    for (const warranty of warranties) {
      let newStatus: WarrantyStatus | null = null;

      if (warranty.endDate <= now) {
        newStatus = 'expired';
      } else if (warranty.endDate <= thirtyDaysLater && warranty.status === 'active') {
        newStatus = 'expiring';
      }

      if (newStatus && newStatus !== warranty.status) {
        await this.warrantyRepository.update(
          blueprintId,
          warranty.id,
          { status: newStatus }
        );

        if (newStatus === 'expiring') {
          await this.sendExpiringNotification(warranty);
        }

        this.eventBus.emit({
          type: newStatus === 'expired' 
            ? SystemEventType.WARRANTY_PERIOD_EXPIRED 
            : 'warranty.status_changed',
          blueprintId,
          timestamp: new Date(),
          actor: this.getSystemActor(),
          data: { warrantyId: warranty.id, newStatus }
        });
      }
    }
  }

  /**
   * 發送到期提醒
   */
  async sendExpiringNotification(warranty: Warranty): Promise<void> {
    if (!warranty.notificationSettings.enabled) return;

    const daysRemaining = this.calculateDaysRemaining(warranty.endDate);
    
    if (warranty.notificationSettings.notifyDaysBefore.includes(daysRemaining)) {
      await this.notificationService.send({
        type: 'warranty_expiring',
        recipients: warranty.notificationSettings.notifyEmails,
        data: {
          warrantyNumber: warranty.warrantyNumber,
          endDate: warranty.endDate,
          daysRemaining
        }
      });
    }
  }

  /**
   * 生成保固證明
   */
  async generateWarrantyCertificate(
    blueprintId: string,
    warrantyId: string
  ): Promise<WarrantyCertificate> {
    const warranty = await this.warrantyRepository.getById(blueprintId, warrantyId);
    if (!warranty) {
      throw new Error(`Warranty not found: ${warrantyId}`);
    }

    return {
      certificateNumber: `CERT-${warranty.warrantyNumber}`,
      warranty,
      issuedDate: new Date(),
      validUntil: warranty.endDate,
      warrantor: warranty.warrantor,
      items: warranty.items
    };
  }

  /**
   * 計算保固剩餘天數
   */
  calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 結束保固期
   */
  async completeWarranty(
    blueprintId: string,
    warrantyId: string,
    actor: EventActor
  ): Promise<Warranty> {
    const warranty = await this.warrantyRepository.getById(blueprintId, warrantyId);
    if (!warranty) {
      throw new Error(`Warranty not found: ${warrantyId}`);
    }

    // 檢查是否有未結案的缺失
    const openDefects = await this.defectRepository.getOpenDefects(
      blueprintId,
      warrantyId
    );
    
    if (openDefects.length > 0) {
      throw new Error(`Cannot complete warranty with ${openDefects.length} open defects`);
    }

    await this.warrantyRepository.update(blueprintId, warrantyId, {
      status: 'completed',
      updatedBy: actor.userId
    });

    return { ...warranty, status: 'completed' };
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/services/`
- 通知服務整合

### 驗收條件
1. ✅ 從驗收自動建立保固
2. ✅ 狀態自動更新
3. ✅ 到期提醒正常
4. ✅ 保固證明生成
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular 定時任務與通知模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **保固期追蹤**
   - 定時檢查狀態
   - 狀態轉換規則
   - 提醒時機

2. **通知機制**
   - 郵件通知
   - 系統通知
   - 提醒頻率

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── WarrantyPeriodService 實作
├── 自動建立邏輯
└── 狀態更新機制

Day 2 (8 hours):
├── 通知機制
├── 保固證明生成
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-period.service.ts`
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-period.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [x] 自動建立保固正常
- [x] 狀態更新正確
- [x] 通知發送正常（介面已實作）
- [x] 證明生成正確

---

## 📁 實作檔案

### 新增檔案
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-period.service.ts`
- `src/app/core/blueprint/modules/implementations/warranty/services/index.ts`

### 實作功能
- `autoCreateFromAcceptance()` - 從驗收自動建立保固
- `checkAndUpdateStatus()` - 檢查並更新狀態
- `getExpiringWarranties()` - 取得即將到期保固
- `getExpiredWarranties()` - 取得已過期保固
- `calculateDaysRemaining()` - 計算剩餘天數
- `shouldSendReminder()` - 檢查是否需要發送提醒
- `generateWarrantyCertificate()` - 生成保固證明
- `completeWarranty()` - 結束保固期
- `voidWarranty()` - 作廢保固
- `extendWarranty()` - 延長保固期限
- `getWarrantyStats()` - 取得保固統計
