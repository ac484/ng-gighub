# 藍圖列表可收縮欄位 - 架構圖

## 元件架構

```
┌─────────────────────────────────────────────────────────────────┐
│                    BlueprintListComponent                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    State (Signals)                      │    │
│  │                                                         │    │
│  │  • blueprintsState: AsyncArrayState<Blueprint>         │    │
│  │  • filterStatus: Signal<BlueprintStatus | null>        │    │
│  │  • searchText: Signal<string>                          │    │
│  │  • showAdvancedColumns: Signal<boolean>  ← 新增       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Computed Signals (反應式)                  │    │
│  │                                                         │    │
│  │  • stats: computed(() => { ... })                      │    │
│  │  • filteredBlueprints: computed(() => { ... })         │    │
│  │  • columns: computed(() => {  ← 新增                   │    │
│  │      return showAdvancedColumns()                      │    │
│  │        ? [primary + secondary + action]                │    │
│  │        : [primary + action]                            │    │
│  │    })                                                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 資料流程圖

```
使用者點擊面板
    ↓
toggleAdvancedColumns(show: boolean)
    ↓
showAdvancedColumns.set(show)  ← Signal 更新
    ↓
columns computed ← 自動重新計算
    ↓
Template 自動更新 (OnPush)
    ↓
<st [columns]="columns()" />  ← 重新渲染
```
