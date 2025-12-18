firebase deploy --only functions:functions-ai
firebase deploy --only functions:functions-firestore
firebase deploy --only functions:functions-storage


<p align="center">
  <a href="https://ng-alain.com">
    <img width="100" src="https://ng-alain.com/assets/img/logo-color.svg">
  </a>
</p>

<h1 align="center">NG-ALAIN</h1>

<div align="center">
  Out-of-box UI solution for enterprise applications, Let developers focus on business.

  [![CI](https://github.com/ng-alain/ng-alain/actions/workflows/ci.yml/badge.svg)](https://github.com/ng-alain/ng-alain/actions/workflows/ci.yml)
  [![Dependency Status](https://david-dm.org/ng-alain/ng-alain/status.svg?style=flat-square)](https://david-dm.org/ng-alain/ng-alain)
  [![GitHub Release Date](https://img.shields.io/github/release-date/ng-alain/ng-alain.svg?style=flat-square)](https://github.com/ng-alain/ng-alain/releases)
  [![NPM version](https://img.shields.io/npm/v/ng-alain.svg?style=flat-square)](https://www.npmjs.com/package/ng-alain)
  [![prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)
  [![GitHub license](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)](https://github.com/ng-alain/ng-alain/blob/master/LICENSE)
  [![Gitter](https://img.shields.io/gitter/room/ng-alain/ng-alain.svg?style=flat-square)](https://gitter.im/ng-alain/ng-alain)
  [![ng-zorro-vscode](https://img.shields.io/badge/ng--zorro-VSCODE-brightgreen.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=cipchk.ng-zorro-vscode)
  [![ng-alain-vscode](https://img.shields.io/badge/ng--alain-VSCODE-brightgreen.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=cipchk.ng-alain-vscode)

</div>

English | [简体中文](README-zh_CN.md)

## Quickstart

- [Getting Started](https://ng-alain.com/docs/getting-started)

## Links

+ [Document](https://ng-alain.com) ([Surge Mirror](https://ng-alain-doc.surge.sh))
+ [@delon Source](https://github.com/ng-alain/delon)
+ [DEMO](https://ng-alain.surge.sh) ([国内镜像](https://ng-alain.gitee.io/))

## Features

+ `ng-zorro-antd` based
+ Responsive Layout
+ I18n
+ [@delon](https://github.com/ng-alain/delon)
+ Lazy load Assets
+ UI Router States
+ Customize Theme
+ Less preprocessor
+ RTL
+ Well organized & commented code
+ Simple upgrade
+ Support Docker deploy

## Architecture

![Architecture](https://raw.githubusercontent.com/ng-alain/delon/master/_screenshot/architecture.png)

> [delon](https://github.com/ng-alain/delon) is a production-ready solution for admin business components packages, Built on the design principles developed by Ant Design.

## App Shots

![desktop](https://raw.githubusercontent.com/ng-alain/delon/master/_screenshot/desktop.png)
![ipad](https://raw.githubusercontent.com/ng-alain/delon/master/_screenshot/ipad.png)
![iphone](https://raw.githubusercontent.com/ng-alain/delon/master/_screenshot/iphone.png)

## Contributing

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/ng-alain/ng-alain/pulls)

We welcome all contributions. Please read our [CONTRIBUTING.md](https://github.com/ng-alain/ng-alain/blob/master/CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/ng-alain/ng-alain/pulls) or as [GitHub issues](https://github.com/ng-alain/ng-alain/issues).

> If you're new to posting issues, we ask that you read [*How To Ask Questions The Smart Way*](http://www.catb.org/~esr/faqs/smart-questions.html) (**This guide does not provide actual support services for this project!**), [How to Ask a Question in Open Source Community](https://github.com/seajs/seajs/issues/545) and [How to Report Bugs Effectively](http://www.chiark.greenend.org.uk/~sgtatham/bugs.html) prior to posting. Well written bug reports help us help you!

## Donation

ng-alain is an MIT-licensed open source project. In order to achieve better and sustainable development of the project, we expect to gain more backers. You can support us in any of the following ways:

- [patreon](https://www.patreon.com/cipchk)
- [opencollective](https://opencollective.com/ng-alain)
- [paypal](https://www.paypal.me/cipchk)
- [支付宝或微信](https://ng-alain.com/assets/donate.png)

Or purchasing our [business theme](https://e.ng-alain.com/).

## Backers

Thank you to all our backers! 🙏

<a href="https://opencollective.com/ng-alain#backers" target="_blank"><img src="https://opencollective.com/ng-alain/backers.svg?width=890"></a>

### License

The MIT License (see the [LICENSE](https://github.com/ng-alain/ng-alain/blob/master/LICENSE) file for the full text)

### 指令
cd functions
npm run build
firebase deploy --only functions


# 設置 Secret
firebase functions:secrets:set GEMINI_API_KEY
# 會提示輸入值，或使用：
echo "your-api-key" | firebase functions:secrets:set GEMINI_API_KEY

# 查看所有 Secrets
firebase functions:secrets:access

# 刪除 Secret
firebase functions:secrets:delete GEMINI_API_KEY

# 授予 Secret 訪問權限給特定函式
firebase functions:secrets:grant GEMINI_API_KEY --function ai:analyzeImage

# 部署所有 functions（所有 codebases）
firebase deploy --only functions

# 部署特定 codebase
firebase deploy --only functions:ai
firebase deploy --only functions:calculation
firebase deploy --only functions:event
firebase deploy --only functions:integration
firebase deploy --only functions:scheduler

# 部署多個 codebases
firebase deploy --only functions:ai,functions:calculation

# 部署特定函式（需要完整函式名稱）
firebase deploy --only functions:ai:analyzeImage
firebase deploy --only functions:calculation:calculateProjectProgress

# 強制部署（忽略錯誤）
firebase deploy --only functions --force

# 部署到特定專案
firebase deploy --only functions --project [your-project-id]

# 查看所有 functions 日誌
firebase functions:log

# 查看特定 codebase 日誌
firebase functions:log --only ai
firebase functions:log --only calculation

# 查看特定函式日誌
firebase functions:log --only ai:analyzeImage

# 即時查看日誌（tail）
firebase functions:log --only ai --follow

# 查看最近 50 條日誌
firebase functions:log --only ai --limit 50

# 查看特定時間範圍的日誌
firebase functions:log --only ai --since 2024-01-01

# 列出所有已部署的 functions
firebase functions:list

# 刪除特定函式
firebase functions:delete ai:analyzeImage

# 刪除整個 codebase 的所有函式
firebase functions:delete --codebase ai

# 查看函式詳細資訊
firebase functions:describe ai:analyzeImage

# 使用 Firebase Functions Shell（互動式測試）
firebase functions:shell

# 在 shell 中測試函式
# analyzeImage({imageUrl: "https://example.com/image.jpg"})

# 使用 curl 測試（本地 emulator）
curl http://localhost:5001/[project-id]/asia-east1/analyzeImage \
  -H "Content-Type: application/json" \
  -d '{"data":{"imageUrl":"https://example.com/image.jpg"}}'

# 使用 curl 測試（已部署）
curl https://asia-east1-[project-id].cloudfunctions.net/analyzeImage \
  -H "Content-Type: application/json" \
  -d '{"data":{"imageUrl":"https://example.com/image.jpg"}}'

  # 查看函式執行統計
firebase functions:log --only ai --stats

# 查看錯誤日誌
firebase functions:log --only ai --level error

# 查看警告日誌
firebase functions:log --only ai --level warn

# 在瀏覽器中查看 Firebase Console
firebase open

# 打開 Functions 控制台
firebase open functions

{
  "scripts": {
    "functions:install": "cd functions-ai && npm install && cd ../functions-calculation && npm install && cd ../functions-event && npm install && cd ../functions-integration && npm install && cd ../functions-scheduler && npm install && cd ../functions-shared && npm install",
    "functions:build": "cd functions-ai && npm run build && cd ../functions-calculation && npm run build && cd ../functions-event && npm run build && cd ../functions-integration && npm run build && cd ../functions-scheduler && npm run build && cd ../functions-shared && npm run build",
    "functions:emulate": "firebase emulators:start --only functions",
    "functions:deploy:all": "firebase deploy --only functions",
    "functions:deploy:ai": "firebase deploy --only functions:ai",
    "functions:deploy:calc": "firebase deploy --only functions:calculation",
    "functions:deploy:event": "firebase deploy --only functions:event",
    "functions:deploy:integration": "firebase deploy --only functions:integration",
    "functions:deploy:scheduler": "firebase deploy --only functions:scheduler",
    "functions:logs": "firebase functions:log",
    "functions:logs:ai": "firebase functions:log --only ai"
  }
}

## 🤖 GitHub Copilot Setup

This repository is configured with comprehensive GitHub Copilot instructions and custom agents to enhance AI-assisted development.

### Quick Start

GitHub Copilot will automatically read project guidelines and coding standards from:

- **Main Instructions**: `.github/copilot-instructions.md` - Project overview and mandatory tool usage
- **Modular Instructions**: `.github/instructions/*.instructions.md` - Framework-specific guidelines
- **Custom Agent**: `.github/agents/ng-gighub.agent.md` - GigHub project specialist

### Key Features

✅ **Intelligent Code Generation**:
- Angular 20 with Standalone Components and Signals
- Modern control flow syntax (@if, @for, @switch)
- Enterprise architecture patterns
- TypeScript 5.9 with strict mode

✅ **Framework Integration**:
- ng-alain business components
- ng-zorro-antd UI components
- Firebase/Firestore data access patterns
- RxJS reactive programming

✅ **MCP Tools** (Model Context Protocol):
- **context7**: Up-to-date library documentation
- **sequential-thinking**: Multi-step problem solving
- **software-planning-tool**: Feature planning and tracking

### Testing Copilot Setup

Try these prompts in GitHub Copilot Chat:

```
@workspace How should I create a new Angular component in this project?
```

```
@workspace Generate a task list component that displays data from Firestore
```

```
@workspace Use context7 to show me how to use Angular Signals
```

### Documentation

- **Setup Guide**: [.github/COPILOT_SETUP.md](.github/COPILOT_SETUP.md)
- **Validation**: [.github/COPILOT_INSTRUCTIONS_VALIDATION.md](.github/COPILOT_INSTRUCTIONS_VALIDATION.md)
- **Secrets Setup**: [.github/COPILOT_SECRETS_SETUP.md](.github/COPILOT_SECRETS_SETUP.md)

### For Contributors

When contributing code, Copilot will help you follow project standards:
- ✅ Use `inject()` for dependency injection
- ✅ Use `input()`/`output()` instead of decorators
- ✅ Use Signals for state management
- ✅ Follow three-layer architecture (Foundation/Container/Business)
- ✅ Use Repository pattern for Firestore access

For detailed guidelines, see [.github/copilot-instructions.md](.github/copilot-instructions.md).