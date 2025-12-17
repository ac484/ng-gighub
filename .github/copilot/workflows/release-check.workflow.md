# 發版檢查工作流程

> 發版前的檢查清單與自動化驗證流程

---

## 🎯 概述

發版前必須完成的檢查項目，確保版本品質。

---

## 📋 發版檢查清單

### 1. 程式碼品質

```
□ ESLint 無錯誤
□ TypeScript 編譯無錯誤
□ 無 any 類型警告
□ 無循環依賴
□ 檔案大小在限制內
```

### 2. 測試覆蓋

```
□ 單元測試全部通過
□ 測試覆蓋率 > 80%
□ E2E 測試全部通過
□ 關鍵路徑測試完整
```

### 3. 安全檢查

```
□ 無已知安全漏洞
□ 依賴套件無高風險漏洞
□ RLS 政策已審核
□ 敏感資料無洩漏
```

### 4. 效能檢查

```
□ Lighthouse 評分 > 90
□ FCP < 1.5s
□ LCP < 2.5s
□ Bundle size 變化 < 5%
```

### 5. 文檔更新

```
□ CHANGELOG 已更新
□ README 版本號已更新
□ API 文檔已同步
□ 部署文檔已更新
```

---

## 🔄 自動化腳本

### 執行完整檢查

```bash
#!/bin/bash
# scripts/release-check.sh

echo "🔍 開始發版檢查..."

# 1. 程式碼品質
echo "📝 檢查程式碼品質..."
yarn lint || { echo "❌ Lint 檢查失敗"; exit 1; }
echo "✅ Lint 檢查通過"

# 2. TypeScript 編譯
echo "🔨 檢查 TypeScript 編譯..."
yarn build || { echo "❌ 編譯失敗"; exit 1; }
echo "✅ 編譯成功"

# 3. 單元測試
echo "🧪 執行單元測試..."
yarn test --browsers=ChromeHeadless --no-watch --code-coverage || { echo "❌ 測試失敗"; exit 1; }
echo "✅ 單元測試通過"

# 4. 檢查測試覆蓋率
echo "📊 檢查測試覆蓋率..."
# 從 coverage 報告中提取覆蓋率
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ 測試覆蓋率不足: $COVERAGE%"
  exit 1
fi
echo "✅ 測試覆蓋率: $COVERAGE%"

# 5. 安全檢查
echo "🔒 執行安全檢查..."
yarn audit --level=high || { echo "⚠️ 發現高風險漏洞"; }

# 6. Bundle 分析
echo "📦 分析 Bundle 大小..."
yarn build --stats-json
# 可以使用 webpack-bundle-analyzer 進行更詳細分析

echo ""
echo "🎉 發版檢查完成！"
echo "================================================"
echo "請確認以下手動檢查項目："
echo "□ CHANGELOG 已更新"
echo "□ README 版本號已更新"
echo "□ 已測試主要功能流程"
echo "□ 已測試兼容性（瀏覽器、裝置）"
echo "================================================"
```

### 版本號更新

```bash
#!/bin/bash
# scripts/bump-version.sh

VERSION_TYPE=$1  # major, minor, patch

if [ -z "$VERSION_TYPE" ]; then
  echo "用法: ./bump-version.sh [major|minor|patch]"
  exit 1
fi

# 更新 package.json 版本
npm version $VERSION_TYPE --no-git-tag-version

# 取得新版本號
NEW_VERSION=$(node -p "require('./package.json').version")

echo "✅ 版本已更新為: $NEW_VERSION"
echo "請記得更新 CHANGELOG.md"
```

---

## 📊 CI/CD 整合

### GitHub Actions 範例

```yaml
# .github/workflows/release-check.yml
name: Release Check

on:
  push:
    branches:
      - release/*
  pull_request:
    branches:
      - main
      - release/*

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Lint
        run: yarn lint

      - name: Build
        run: yarn build

      - name: Test
        run: yarn test --browsers=ChromeHeadless --no-watch --code-coverage

      - name: Check coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage is below 80%: $COVERAGE%"
            exit 1
          fi

  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Audit
        run: yarn audit --level=high

  e2e-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build
        run: yarn build

      - name: E2E Tests
        run: yarn e2e
```

---

## 📝 CHANGELOG 範本

```markdown
# Changelog

## [Unreleased]

### Added
- 新功能描述

### Changed
- 變更描述

### Fixed
- 修復描述

### Security
- 安全更新描述

## [1.0.0] - 2025-11-27

### Added
- 初始版本發布
- 藍圖系統
- 任務管理
- 施工日誌
```

---

## ✅ 最終確認

發版前的最終確認事項：

```
□ 所有自動化檢查通過
□ Code Review 已完成
□ 測試環境驗證通過
□ 相關人員已通知
□ 回滾計畫已準備
□ 監控告警已設置
```

---

**最後更新**: 2025-11-27
