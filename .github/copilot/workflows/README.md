# GitHub Copilot Workflows

此目錄包含 GitHub Copilot 的自動化工作流程配置。

## 📁 檔案說明

### `auto-test-lint-build.yml`
**完整的自動測試、Lint 和建置配置**

- **功能**: 在程式碼變更後自動執行 `yarn test` + `yarn lint` + `yarn build`
- **觸發時機**:
  - 檔案儲存後
  - Git commit 前
  - PR 建立/更新時
  - Copilot 編輯完成後
- **配置項目**:
  - 測試覆蓋率閾值
  - Bundle 大小限制
  - 錯誤處理策略
  - 報告格式

### `AUTO_TEST_SETUP_GUIDE.md`
**設定指南與使用說明**

- 4 種配置方式
- 效能優化建議
- 常見問題解答
- 範例配置

### `new-module.workflow.md`
**新模組建立工作流程**

### `release-check.workflow.md`
**發布前檢查工作流程**

### `rls-check.workflow.md`
**RLS (Row Level Security) 檢查工作流程**

---

## 🚀 快速開始

### 方法 1: 使用 Husky Hooks (推薦)

**Pre-commit** (輕量級檢查):
```bash
# 已自動啟用，每次 git commit 時執行
# - TypeScript 類型檢查
# - Lint 檢查與自動修復
```

**Pre-push** (完整檢查):
```bash
# 需要手動啟用，執行以下命令：
chmod +x .husky/pre-push

# 之後每次 git push 時執行
# - yarn lint
# - yarn test
# - yarn build
```

### 方法 2: 使用 Package Scripts

```bash
# 快速檢查 (只 lint)
yarn check:quick

# 標準檢查 (lint + test)
yarn check

# 完整檢查 (lint + test + build)
yarn check:full
```

### 方法 3: 使用 Copilot 命令

在 GitHub Copilot Workspace 中：

```
@copilot run quick_check    # 快速檢查
@copilot run standard_check # 標準檢查  
@copilot run full_check     # 完整檢查
```

---

## ⚙️ 配置選項

### 啟用完整的 Pre-commit 檢查

編輯 `.husky/pre-commit`，取消註解以下行：

```bash
# 啟用測試
echo "🧪 執行測試..."
yarn test --watch=false --browsers=ChromeHeadless || exit 1

# 啟用建置 (較耗時)
echo "🏗️ 執行建置..."
yarn build || exit 1
```

### 自訂測試覆蓋率閾值

編輯 `auto-test-lint-build.yml`:

```yaml
coverage_report:
  thresholds:
    statements: 80  # 預設 80%
    branches: 75    # 預設 75%
    functions: 80   # 預設 80%
    lines: 80       # 預設 80%
```

### 自訂 Bundle 大小限制

編輯 `angular.json`:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "6mb"
  }
]
```

---

## 📊 工作流程比較

| 方式 | 檢查項目 | 執行時機 | 速度 | 推薦度 |
|------|---------|---------|------|--------|
| **Pre-commit** (預設) | Lint + 類型檢查 | 每次 commit | ⚡ 快 | ⭐⭐⭐⭐⭐ |
| **Pre-commit** (完整) | Lint + Test + Build | 每次 commit | 🐢 慢 | ⭐⭐⭐ |
| **Pre-push** | Lint + Test + Build | 每次 push | 🐢 慢 | ⭐⭐⭐⭐ |
| **Package Scripts** | 自訂 | 手動執行 | ⚡ 依配置 | ⭐⭐⭐⭐ |
| **GitHub Actions** | 完整 CI/CD | PR/Push | 🚀 並行 | ⭐⭐⭐⭐⭐ |
| **Copilot Workspace** | 智慧觸發 | 自動/手動 | ⚡ 快 | ⭐⭐⭐⭐⭐ |

---

## 🎯 推薦配置 (中型專案)

### Local Development (本地開發)
```bash
# Pre-commit: Lint + 類型檢查 (預設已啟用)
# Pre-push: Lint + Test + Build (手動啟用)
chmod +x .husky/pre-push
```

### CI/CD (持續整合)
```yaml
# GitHub Actions 自動執行 (已配置)
# - .github/workflows/ci.yml
```

### Copilot Integration
```yaml
# 自動觸發 (已配置)
# - .github/copilot/workflows/auto-test-lint-build.yml
```

---

## 📈 效能優化

### 1. 使用 lint-staged (已啟用)

只檢查變更的檔案：

```json
{
  "lint-staged": {
    "src/**/*.ts": ["eslint --fix"],
    "src/**/*.less": ["stylelint --fix"]
  }
}
```

### 2. 使用 Chrome Headless 測試 (已配置)

```bash
yarn test --watch=false --browsers=ChromeHeadless
```

### 3. 啟用測試並行

編輯 `karma.conf.js`:

```javascript
module.exports = function(config) {
  config.set({
    // ...
    concurrency: 4 // 並行執行
  });
};
```

---

## 🐛 疑難排解

### Q: Pre-commit hook 沒有執行？

**A**: 檢查 hook 是否有執行權限：

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Q: 測試太慢怎麼辦？

**A**: 選項 1 - 移到 pre-push:
```bash
# 只在 push 時執行完整測試
# commit 時只執行 lint
```

**A**: 選項 2 - 使用 watch 模式:
```bash
# 開發時持續執行測試
yarn test
```

### Q: 如何跳過檢查？

**A**: 使用 `--no-verify` (緊急情況):

```bash
git commit -m "fix: urgent" --no-verify
git push --no-verify
```

⚠️ **注意**: 不推薦經常使用，會繞過品質檢查

### Q: Copilot 沒有自動執行？

**A**: 確認以下設定：

1. 使用 GitHub Copilot Workspace
2. 檔案存在: `.github/copilot/workflows/auto-test-lint-build.yml`
3. Copilot 設定中啟用 workflow automation

---

## 📚 相關文檔

- [完整設定指南](./AUTO_TEST_SETUP_GUIDE.md)
- [GitHub Actions CI](.github/workflows/ci.yml)
- [Husky 文檔](https://typicode.github.io/husky/)
- [Angular Testing 指南](https://angular.dev/guide/testing)

---

## 💡 最佳實踐

1. ✅ **Pre-commit**: 快速檢查 (Lint + 類型)
2. ✅ **Pre-push**: 完整檢查 (Lint + Test + Build)
3. ✅ **CI/CD**: 所有分支都執行完整檢查
4. ✅ **本地開發**: 使用 watch 模式持續測試
5. ✅ **Copilot**: 自動觸發相關檢查

---

**需要幫助？**
- 查看 [AUTO_TEST_SETUP_GUIDE.md](./AUTO_TEST_SETUP_GUIDE.md)
- 參考 [package.json](../../package.json) 可用腳本
- 檢查 [.husky/](.husky/) Git hooks 配置
