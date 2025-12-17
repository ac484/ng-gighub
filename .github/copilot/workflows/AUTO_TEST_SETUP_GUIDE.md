# GitHub Copilot 自動測試配置指南
# Auto Test, Lint, Build Setup Guide for GitHub Copilot

> **目標**: 配置 GitHub Copilot 在每次程式碼變更後自動執行 `yarn test` + `yarn lint` + `yarn build`

---

## 📋 快速開始

### 方式 1: 使用 Husky Pre-commit Hook (推薦)

這是最簡單且最可靠的方式，在 Git commit 前自動執行檢查。

#### 步驟 1: 確認 Husky 已安裝

```bash
# 檢查是否已安裝
ls -la .husky/

# 如果沒有，執行初始化
yarn prepare
```

#### 步驟 2: 更新 Pre-commit Hook

編輯 `.husky/pre-commit` 檔案：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 執行 Pre-commit 檢查..."

# 1. Lint 檢查並自動修復
echo "📝 執行 Lint..."
yarn lint --fix || exit 1

# 2. 執行測試
echo "🧪 執行測試..."
yarn test --watch=false --browsers=ChromeHeadless --code-coverage || exit 1

# 3. 執行建置 (可選，較耗時)
# echo "🏗️ 執行建置..."
# yarn build || exit 1

echo "✅ Pre-commit 檢查完成！"
```

#### 步驟 3: 測試 Hook

```bash
# 嘗試提交
git add .
git commit -m "test: verify pre-commit hook"
```

---

### 方式 2: 使用 GitHub Actions CI/CD (自動化)

此方式在 PR 和 Push 時自動執行。

#### 當前配置

專案已有 `.github/workflows/ci.yml`，包含以下 jobs:

```yaml
jobs:
  lint:      # 執行 yarn lint
  test:      # 執行 yarn test
  build:     # 執行 yarn build
  build-day: # 執行 yarn build (day release)
```

#### 如何檢視 CI 結果

1. 前往 GitHub Repository
2. 點擊 **Actions** 標籤
3. 檢視最新的 workflow runs

---

### 方式 3: 使用 VS Code Tasks (本地開發)

在 VS Code 中配置自動任務。

#### 步驟 1: 建立 `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Full Check",
      "type": "shell",
      "command": "yarn lint && yarn test --watch=false --browsers=ChromeHeadless && yarn build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "Quick Check",
      "type": "shell",
      "command": "yarn lint && yarn test --watch=false --browsers=ChromeHeadless",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

#### 步驟 2: 執行任務

- 按 `Ctrl+Shift+B` (Windows/Linux) 或 `Cmd+Shift+B` (Mac)
- 選擇 "Full Check" 或 "Quick Check"

---

### 方式 4: 使用 Package.json Scripts (手動)

在 `package.json` 中新增便捷腳本。

```json
{
  "scripts": {
    "check": "yarn lint && yarn test --watch=false --browsers=ChromeHeadless",
    "check:full": "yarn lint && yarn test --watch=false --browsers=ChromeHeadless && yarn build",
    "check:quick": "yarn lint:ts --fix && yarn lint:style --fix",
    "pre-push": "yarn check:full"
  }
}
```

使用方式：

```bash
# 快速檢查 (只 lint)
yarn check:quick

# 標準檢查 (lint + test)
yarn check

# 完整檢查 (lint + test + build)
yarn check:full
```

---

## 🎯 推薦配置

### 適用於小型專案 (< 100 files)

```bash
# .husky/pre-commit
yarn lint --fix || exit 1
yarn test --watch=false --browsers=ChromeHeadless || exit 1
yarn build || exit 1
```

**優點**: 最完整的檢查  
**缺點**: 每次 commit 需要 5-10 分鐘

---

### 適用於中型專案 (100-500 files) ⭐ 推薦

```bash
# .husky/pre-commit
yarn lint --fix || exit 1
yarn test --watch=false --browsers=ChromeHeadless || exit 1

# 建置只在 CI 執行
# GitHub Actions 會自動執行 yarn build
```

**優點**: 平衡速度與品質  
**缺點**: 本地不會檢測建置問題

---

### 適用於大型專案 (> 500 files)

```bash
# .husky/pre-commit
yarn lint:ts --fix || exit 1
yarn lint:style --fix || exit 1

# 測試和建置只在 CI 執行
```

**優點**: 最快速  
**缺點**: 可能發現問題較晚

---

## 🔧 進階配置

### 1. 只測試變更的檔案

安裝 `lint-staged`:

```bash
yarn add -D lint-staged
```

更新 `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "yarn test --watch=false --findRelatedTests"
    ],
    "src/**/*.less": [
      "stylelint --fix"
    ]
  }
}
```

更新 `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

### 2. 使用 Git Hooks 的 Pre-push

建立 `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 執行 Pre-push 檢查..."

# 完整檢查
yarn lint || exit 1
yarn test --watch=false --browsers=ChromeHeadless --code-coverage || exit 1
yarn build || exit 1

echo "✅ Pre-push 檢查完成！"
```

---

### 3. 整合 Copilot Workspace

當使用 GitHub Copilot Workspace 時，它會自動讀取 `.github/copilot/workflows/auto-test-lint-build.yml` 配置。

**自動觸發時機**:
- 檔案儲存後
- Copilot 編輯完成後
- PR 建立或更新時

**Copilot 命令**:
```
@copilot run quick_check    # 快速檢查
@copilot run standard_check # 標準檢查
@copilot run full_check     # 完整檢查
```

---

## 📊 效能優化建議

### 1. 使用 Chrome Headless 測試

```json
{
  "test": "ng test --watch=false --browsers=ChromeHeadless"
}
```

**節省時間**: ~30%

---

### 2. 啟用快取

在 `.github/workflows/ci.yml` 中：

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
```

**節省時間**: ~50% (CI 環境)

---

### 3. 平行執行測試

```bash
yarn test --watch=false --browsers=ChromeHeadless --parallel
```

**節省時間**: ~40%

---

## ⚠️ 常見問題

### Q1: Pre-commit hook 太慢怎麼辦？

**A**: 使用 lint-staged 只檢查變更的檔案，或將完整測試移到 pre-push。

---

### Q2: 測試在 CI 通過但本地失敗？

**A**: 檢查 Node 版本是否一致：

```bash
# 檢查 CI 使用的版本
cat .nvmrc

# 本地切換版本
nvm use
```

---

### Q3: 如何跳過 hook 執行？

**A**: 使用 `--no-verify` 標誌 (不推薦):

```bash
git commit -m "fix: urgent fix" --no-verify
```

---

### Q4: Copilot 沒有自動執行測試？

**A**: 
1. 確認 `.github/copilot/workflows/auto-test-lint-build.yml` 存在
2. 確認使用的是 GitHub Copilot Workspace
3. 檢查 Copilot 設定中的 workflow 是否啟用

---

## 🎉 驗證配置

執行以下命令確認配置正確：

```bash
# 1. 檢查 Husky
ls -la .husky/pre-commit

# 2. 測試 Lint
yarn lint

# 3. 測試 Test
yarn test --watch=false --browsers=ChromeHeadless

# 4. 測試 Build
yarn build

# 5. 測試完整流程
yarn check:full
```

---

## 📚 相關資源

- [Husky 文檔](https://typicode.github.io/husky/)
- [lint-staged 文檔](https://github.com/okonet/lint-staged)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Angular Testing 指南](https://angular.dev/guide/testing)
- [專案 CI 配置](.github/workflows/ci.yml)
- [Copilot Workflow 配置](.github/copilot/workflows/auto-test-lint-build.yml)

---

## 📝 總結

**推薦配置** (中型專案):

1. **Pre-commit**: `yarn lint --fix` + `yarn test`
2. **Pre-push**: `yarn build` (可選)
3. **CI/CD**: 完整的 lint + test + build
4. **Copilot**: 使用 `auto-test-lint-build.yml` 配置

這樣可以在提交前確保程式碼品質，同時不會過度拖慢開發速度。

---

**需要幫助？**
- 查看 [.github/copilot/workflows/auto-test-lint-build.yml](.github/copilot/workflows/auto-test-lint-build.yml)
- 參考 [.github/workflows/ci.yml](.github/workflows/ci.yml)
- 查詢 [package.json](../../package.json) 中的可用腳本
