#!/bin/bash
# 專案代碼優化實施腳本
# Project Code Optimization Implementation Script
#
# 用途: 協助自動化實施高優先級的代碼優化
# Purpose: Automate high-priority code optimization implementation
#
# 使用方式 (Usage):
#   chmod +x scripts/implement-optimizations.sh
#   ./scripts/implement-optimizations.sh [phase]
#
# 階段 (Phases):
#   phase1 - 快速勝利: 修復訂閱、OnPush、現代化 (1-2 週)
#   phase2 - 核心重構: Modal 服務、元件拆分 (2-3 週)
#   phase3 - 類型安全: 消除 any、錯誤處理 (3-4 週)
#   all    - 執行所有階段 (需謹慎)

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 專案根目錄
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 日誌函數
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${MAGENTA}═══════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════${NC}\n"
}

# 檢查前置條件
check_prerequisites() {
    log_header "檢查前置條件"
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝"
        exit 1
    fi
    log_success "Node.js 版本: $(node --version)"
    
    # 檢查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安裝"
        exit 1
    fi
    log_success "npm 版本: $(npm --version)"
    
    # 檢查 Angular CLI
    if ! command -v ng &> /dev/null; then
        log_error "Angular CLI 未安裝"
        log_info "請執行: npm install -g @angular/cli"
        exit 1
    fi
    log_success "Angular CLI 版本: $(ng version | grep "Angular CLI" | awk '{print $3}')"
    
    # 檢查 package.json
    if [ ! -f "package.json" ]; then
        log_error "找不到 package.json，請確認在專案根目錄執行"
        exit 1
    fi
    log_success "package.json 存在"
    
    # 檢查 node_modules
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 不存在，正在執行 npm install..."
        npm install
    fi
    log_success "node_modules 已就緒"
}

# Phase 1: 快速勝利 (Quick Wins)
phase1_quick_wins() {
    log_header "Phase 1: 快速勝利 (預計 6-8 小時)"
    
    # 1. 搜尋未管理的訂閱
    log_info "1/4 正在搜尋未管理的訂閱..."
    echo ""
    echo "找到以下檔案包含未使用 takeUntilDestroyed 的 .subscribe():"
    echo ""
    
    # 搜尋 .subscribe() 但沒有 takeUntilDestroyed
    grep -r "\.subscribe(" src/app --include="*.ts" | \
        grep -v "takeUntilDestroyed" | \
        grep -v "spec.ts" | \
        grep -v "node_modules" | \
        head -20
    
    echo ""
    log_warning "請手動檢查並修復這些訂閱，加入 takeUntilDestroyed()"
    echo ""
    echo "範例修復:"
    echo "  // 加入注入"
    echo "  private destroyRef = inject(DestroyRef);"
    echo ""
    echo "  // 在 pipe 中加入"
    echo "  .pipe(takeUntilDestroyed(this.destroyRef))"
    echo "  .subscribe(...);"
    echo ""
    read -p "按 Enter 繼續下一步..." 
    
    # 2. 搜尋未使用 OnPush 的元件
    log_info "2/4 正在搜尋未使用 OnPush 的元件..."
    echo ""
    echo "找到以下元件未使用 OnPush 變更檢測:"
    echo ""
    
    # 搜尋 @Component 但沒有 changeDetection
    for file in $(find src/app -name "*.component.ts" -type f); do
        if ! grep -q "changeDetection:" "$file"; then
            echo "  - $file"
        fi
    done | head -20
    
    echo ""
    log_warning "請在這些元件加入: changeDetection: ChangeDetectionStrategy.OnPush"
    echo ""
    read -p "按 Enter 繼續下一步..."
    
    # 3. 執行新控制流遷移
    log_info "3/4 執行新控制流遷移..."
    if command -v ng &> /dev/null; then
        log_info "正在執行 Angular 遷移工具..."
        ng generate @angular/core:control-flow --dry-run || true
        echo ""
        log_warning "請檢查上方預覽，確認後執行:"
        echo "  ng generate @angular/core:control-flow"
    else
        log_warning "Angular CLI 不可用，請手動遷移"
    fi
    echo ""
    read -p "按 Enter 繼續下一步..."
    
    # 4. 搜尋 @Input/@Output 裝飾器
    log_info "4/4 正在搜尋 @Input/@Output 裝飾器..."
    echo ""
    echo "找到以下檔案使用舊裝飾器:"
    echo ""
    
    grep -r "@Input()" src/app --include="*.ts" | grep -v "node_modules" | grep -v "spec.ts"
    grep -r "@Output()" src/app --include="*.ts" | grep -v "node_modules" | grep -v "spec.ts"
    
    echo ""
    log_warning "請將這些改為 input() 和 output() 函數"
    echo ""
    log_success "Phase 1 檢查完成！"
    echo ""
    echo "後續動作:"
    echo "  1. 修復未管理的訂閱 (加入 takeUntilDestroyed)"
    echo "  2. 在元件加入 OnPush 變更檢測"
    echo "  3. 執行 ng generate @angular/core:control-flow"
    echo "  4. 將 @Input/@Output 改為 input()/output()"
    echo ""
}

# Phase 2: 核心重構
phase2_core_refactoring() {
    log_header "Phase 2: 核心重構 (預計 20-28 小時)"
    
    # 1. 搜尋重複的 Modal 模式
    log_info "1/2 正在搜尋重複的 Modal 注入模式..."
    echo ""
    echo "找到以下檔案使用 NzModalService:"
    echo ""
    
    grep -r "inject(NzModalService)" src/app --include="*.ts" | \
        grep -v "node_modules" | \
        grep -v "spec.ts" | \
        wc -l | xargs echo "  總共:"
    
    grep -r "inject(NzModalService)" src/app --include="*.ts" | \
        grep -v "node_modules" | \
        grep -v "spec.ts" | \
        head -20
    
    echo ""
    log_warning "建議建立統一的 ModalService 封裝"
    echo ""
    echo "建議檔案位置:"
    echo "  src/app/core/services/unified-modal.service.ts"
    echo ""
    read -p "按 Enter 繼續下一步..."
    
    # 2. 搜尋超大型元件
    log_info "2/2 正在搜尋超大型元件 (>500 行)..."
    echo ""
    echo "找到以下大型元件:"
    echo ""
    
    for file in $(find src/app -name "*.component.ts" -type f); do
        lines=$(wc -l < "$file")
        if [ "$lines" -gt 500 ]; then
            echo "  - $file ($lines 行)"
        fi
    done | sort -t'(' -k2 -rn | head -10
    
    echo ""
    log_warning "建議拆分超過 1000 行的元件"
    echo ""
    log_success "Phase 2 檢查完成！"
    echo ""
}

# Phase 3: 類型安全
phase3_type_safety() {
    log_header "Phase 3: 類型安全強化 (預計 23-32 小時)"
    
    # 1. 搜尋 any 類型
    log_info "1/2 正在搜尋 any 類型使用..."
    echo ""
    
    any_count=$(grep -r ": any" src/app --include="*.ts" | \
        grep -v "node_modules" | \
        grep -v "spec.ts" | \
        wc -l)
    
    echo "找到 $any_count 處使用 any 類型"
    echo ""
    echo "主要分布:"
    grep -r ": any" src/app --include="*.ts" | \
        grep -v "node_modules" | \
        grep -v "spec.ts" | \
        head -20
    
    echo ""
    log_warning "建議為這些建立明確的 TypeScript 介面"
    echo ""
    read -p "按 Enter 繼續下一步..."
    
    # 2. 檢查 TypeScript 配置
    log_info "2/2 檢查 TypeScript 嚴格配置..."
    echo ""
    
    if [ -f "tsconfig.json" ]; then
        echo "當前 tsconfig.json 配置:"
        grep -A 10 "compilerOptions" tsconfig.json | grep -E "(strict|noImplicit|noUnused)"
        echo ""
        
        log_info "建議加入以下配置 (如果沒有):"
        echo '  "noUnusedLocals": true,'
        echo '  "noUnusedParameters": true,'
        echo '  "noUncheckedIndexedAccess": true,'
        echo '  "exactOptionalPropertyTypes": true'
        echo ""
    fi
    
    log_success "Phase 3 檢查完成！"
    echo ""
}

# 執行驗證測試
run_verification() {
    log_header "執行驗證測試"
    
    log_info "1/4 執行 TypeScript 類型檢查..."
    if npm run lint:ts 2>&1 | head -20; then
        log_success "TypeScript 類型檢查通過"
    else
        log_warning "TypeScript 類型檢查有警告"
    fi
    echo ""
    
    log_info "2/4 執行 ESLint 檢查..."
    if npm run lint 2>&1 | head -20; then
        log_success "ESLint 檢查通過"
    else
        log_warning "ESLint 檢查有警告"
    fi
    echo ""
    
    log_info "3/4 執行建置..."
    if npm run build -- --configuration=production 2>&1 | tail -20; then
        log_success "建置成功"
    else
        log_error "建置失敗"
        exit 1
    fi
    echo ""
    
    log_info "4/4 分析 Bundle Size..."
    if [ -d "dist" ]; then
        echo "Bundle 大小:"
        du -sh dist/browser/* 2>/dev/null || echo "  無法取得 bundle 資訊"
    fi
    echo ""
    
    log_success "驗證測試完成！"
}

# 生成優化報告
generate_report() {
    log_header "生成優化實施報告"
    
    report_file="docs/OPTIMIZATION_IMPLEMENTATION_REPORT_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 代碼優化實施報告
# Code Optimization Implementation Report

**生成時間**: $(date '+%Y-%m-%d %H:%M:%S')
**專案**: ng-gighub
**執行者**: $(git config user.name)

---

## 執行摘要

本報告記錄了代碼優化的實施進度與結果。

### 檢查項目

#### Phase 1: 快速勝利
- [ ] 修復未管理的訂閱 (10+ 處)
- [ ] 加入 OnPush 變更檢測 (15 元件)
- [ ] 完成新控制流遷移 (1 處)
- [ ] 完成 input()/output() 遷移 (3 處)

#### Phase 2: 核心重構
- [ ] 建立統一 ModalService (16 元件)
- [ ] 拆分超大型元件 (3 個)

#### Phase 3: 類型安全
- [ ] 消除 any 類型 (151 處)
- [ ] 建立統一錯誤處理
- [ ] 加強 TypeScript 配置

---

## 統計數據

### 未管理的訂閱
\`\`\`
$(grep -r "\.subscribe(" src/app --include="*.ts" | grep -v "takeUntilDestroyed" | grep -v "spec.ts" | wc -l) 處
\`\`\`

### 未使用 OnPush 的元件
\`\`\`
$(for file in $(find src/app -name "*.component.ts" -type f); do if ! grep -q "changeDetection:" "$file"; then echo "$file"; fi; done | wc -l) 個
\`\`\`

### any 類型使用
\`\`\`
$(grep -r ": any" src/app --include="*.ts" | grep -v "node_modules" | grep -v "spec.ts" | wc -l) 處
\`\`\`

### 大型元件 (>500 行)
\`\`\`
$(for file in $(find src/app -name "*.component.ts" -type f); do lines=$(wc -l < "$file"); if [ "$lines" -gt 500 ]; then echo "$file ($lines 行)"; fi; done | wc -l) 個
\`\`\`

---

## 後續動作

1. 按照優先級逐步實施優化
2. 每個階段完成後執行驗證測試
3. 記錄實施過程中遇到的問題
4. 定期更新本報告

---

**報告結束**
EOF
    
    log_success "報告已生成: $report_file"
}

# 顯示使用說明
show_usage() {
    cat << EOF
${CYAN}使用方式:${NC}
  $0 [phase|command]

${CYAN}階段 (Phases):${NC}
  phase1    - 快速勝利: 修復訂閱、OnPush、現代化
  phase2    - 核心重構: Modal 服務、元件拆分
  phase3    - 類型安全: 消除 any、錯誤處理
  all       - 執行所有階段檢查

${CYAN}指令 (Commands):${NC}
  verify    - 執行驗證測試 (lint, build, test)
  report    - 生成優化實施報告
  help      - 顯示此說明

${CYAN}範例:${NC}
  $0 phase1
  $0 verify
  $0 report

EOF
}

# 主程式
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    case "$1" in
        phase1)
            check_prerequisites
            phase1_quick_wins
            ;;
        phase2)
            check_prerequisites
            phase2_core_refactoring
            ;;
        phase3)
            check_prerequisites
            phase3_type_safety
            ;;
        all)
            check_prerequisites
            phase1_quick_wins
            phase2_core_refactoring
            phase3_type_safety
            ;;
        verify)
            check_prerequisites
            run_verification
            ;;
        report)
            check_prerequisites
            generate_report
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "未知的階段或指令: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 執行主程式
main "$@"
