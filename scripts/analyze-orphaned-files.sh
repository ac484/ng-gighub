#!/bin/bash

# ============================================================================
# GigHub 孤立檔案分析腳本
# Orphaned Files Analysis Script for ng-gighub
# ============================================================================
# 
# 用途: 自動分析 Angular 專案中未被使用的檔案
# Usage: Automatically analyze unused files in Angular project
#
# 執行方式 (How to run):
#   ./scripts/analyze-orphaned-files.sh
#
# 輸出 (Output):
#   - 終端顯示分析結果
#   - /tmp/orphaned-files-*.txt 詳細清單
#
# ============================================================================

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 專案根目錄
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 時間戳記
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="/tmp/orphaned-analysis-${TIMESTAMP}"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}=========================================="
echo "🔍 GigHub 孤立檔案分析工具"
echo "   Orphaned Files Analyzer"
echo "==========================================${NC}"
echo ""
echo "專案路徑: $PROJECT_DIR"
echo "分析時間: $(date)"
echo "輸出目錄: $OUTPUT_DIR"
echo ""

# ============================================================================
# Step 1: 收集所有原始檔案
# ============================================================================
echo -e "${BLUE}📂 步驟 1: 收集所有原始檔案...${NC}"
find src -type f \( -name "*.ts" -o -name "*.html" -o -name "*.less" -o -name "*.scss" -o -name "*.css" \) \
    > "$OUTPUT_DIR/all-source-files.txt"
TOTAL_FILES=$(wc -l < "$OUTPUT_DIR/all-source-files.txt")
echo "   總檔案數: $TOTAL_FILES"
echo ""

# ============================================================================
# Step 2: 排除測試檔案和系統檔案
# ============================================================================
echo -e "${BLUE}📋 步驟 2: 排除測試檔案...${NC}"
grep -v "\.spec\.ts$" "$OUTPUT_DIR/all-source-files.txt" | \
grep -v "test\.ts$" | \
grep -v "testing/" | \
grep -v "e2e/" > "$OUTPUT_DIR/files-to-check.txt"

FILES_TO_CHECK=$(wc -l < "$OUTPUT_DIR/files-to-check.txt")
echo "   需檢查檔案數: $FILES_TO_CHECK"
echo ""

# ============================================================================
# Step 3: 分析 import 關係
# ============================================================================
echo -e "${BLUE}🔍 步驟 3: 分析 TypeScript import 關係...${NC}"
> "$OUTPUT_DIR/all-imports.txt"

while IFS= read -r file; do
    if [[ "$file" == *.ts ]]; then
        # 提取標準 import 語句
        grep -E "^import .* from ['\"]" "$file" 2>/dev/null | \
        sed -E "s/.*from ['\"]([^'\"]+)['\"].*/\1/" >> "$OUTPUT_DIR/all-imports.txt"
        
        # 提取動態 import
        grep -oE "import\(['\"][^'\"]+['\"]\)" "$file" 2>/dev/null | \
        sed -E "s/import\(['\"]([^'\"]+)['\"]\)/\1/" >> "$OUTPUT_DIR/all-imports.txt"
    fi
done < "$OUTPUT_DIR/files-to-check.txt"

sort -u "$OUTPUT_DIR/all-imports.txt" > "$OUTPUT_DIR/unique-imports.txt"
UNIQUE_IMPORTS=$(wc -l < "$OUTPUT_DIR/unique-imports.txt")
echo "   發現 import 語句: $UNIQUE_IMPORTS"
echo ""

# ============================================================================
# Step 4: 分析路由配置
# ============================================================================
echo -e "${BLUE}🚦 步驟 4: 分析路由配置...${NC}"
> "$OUTPUT_DIR/route-components.txt"

find src -name "*.routes.ts" -o -name "routes.ts" | while IFS= read -r route_file; do
    # 提取 component 引用
    grep -oE "component: [A-Za-z0-9_]+" "$route_file" 2>/dev/null | \
    sed 's/component: //' >> "$OUTPUT_DIR/route-components.txt"
    
    # 提取 loadComponent 引用
    grep -oE "loadComponent.*import\(['\"][^'\"]+['\"]\)" "$route_file" 2>/dev/null | \
    sed -E "s/.*import\(['\"]([^'\"]+)['\"]\).*/\1/" >> "$OUTPUT_DIR/route-components.txt"
    
    # 提取 loadChildren 引用
    grep -oE "loadChildren.*import\(['\"][^'\"]+['\"]\)" "$route_file" 2>/dev/null | \
    sed -E "s/.*import\(['\"]([^'\"]+)['\"]\).*/\1/" >> "$OUTPUT_DIR/route-components.txt"
done

sort -u "$OUTPUT_DIR/route-components.txt" > "$OUTPUT_DIR/unique-route-refs.txt"
ROUTE_REFS=$(wc -l < "$OUTPUT_DIR/unique-route-refs.txt")
echo "   路由引用數: $ROUTE_REFS"
echo ""

# ============================================================================
# Step 5: 檢查檔案是否被引用
# ============================================================================
echo -e "${BLUE}✅ 步驟 5: 建立引用對照表...${NC}"
> "$OUTPUT_DIR/referenced-files.txt"

check_file_referenced() {
    local file="$1"
    local file_base=$(echo "$file" | sed 's|^src/||' | sed 's|\.[^.]*$||')
    local file_name=$(basename "$file" | sed 's|\.[^.]*$||')
    local dir_name=$(dirname "$file")
    
    # 檢查是否在 import 中被引用
    if grep -qF "$file_base" "$OUTPUT_DIR/unique-imports.txt" 2>/dev/null || \
       grep -qF "$file_name" "$OUTPUT_DIR/unique-imports.txt" 2>/dev/null; then
        return 0  # 被引用
    fi
    
    # 檢查是否在路由中被引用
    if grep -qF "$file_name" "$OUTPUT_DIR/unique-route-refs.txt" 2>/dev/null; then
        return 0  # 被引用
    fi
    
    # 檢查是否是元件的配套檔案
    if [[ "$file" =~ \.(html|less|scss|css)$ ]]; then
        local component_file="${file_base}.component.ts"
        if [ -f "src/${component_file}" ] || [ -f "${file_base}.ts" ]; then
            return 0  # 是配套檔案
        fi
    fi
    
    # 檢查是否是入口檔案或系統檔案
    if [[ "$file" =~ (main\.ts|app\.config\.ts|app\.component|routes\.ts|environment|index\.ts|typings\.d\.ts|styles\.less|style-icons) ]]; then
        return 0  # 系統檔案
    fi
    
    # 檢查是否在 angular.json 中配置
    if grep -qF "$(basename "$file")" angular.json 2>/dev/null; then
        return 0  # 在配置中
    fi
    
    return 1  # 未被引用
}

while IFS= read -r file; do
    if check_file_referenced "$file"; then
        echo "$file" >> "$OUTPUT_DIR/referenced-files.txt"
    fi
done < "$OUTPUT_DIR/files-to-check.txt"

sort -u "$OUTPUT_DIR/referenced-files.txt" > "$OUTPUT_DIR/unique-referenced.txt"
REFERENCED=$(wc -l < "$OUTPUT_DIR/unique-referenced.txt")
echo "   被引用檔案數: $REFERENCED"
echo ""

# ============================================================================
# Step 6: 找出孤立檔案
# ============================================================================
echo -e "${BLUE}🔎 步驟 6: 識別孤立檔案...${NC}"
comm -23 <(sort "$OUTPUT_DIR/files-to-check.txt") <(sort "$OUTPUT_DIR/unique-referenced.txt") \
    > "$OUTPUT_DIR/orphaned-files.txt"
ORPHANED=$(wc -l < "$OUTPUT_DIR/orphaned-files.txt")
echo "   孤立檔案數: $ORPHANED"
echo ""

# ============================================================================
# Step 7: 生成報告
# ============================================================================
echo -e "${GREEN}=========================================="
echo "📊 分析結果統計"
echo "==========================================${NC}"
echo ""
printf "總檔案數:           ${BLUE}%6d${NC}\n" "$TOTAL_FILES"
printf "需檢查檔案數:       ${BLUE}%6d${NC}\n" "$FILES_TO_CHECK"
printf "被引用檔案數:       ${GREEN}%6d${NC}\n" "$REFERENCED"
printf "孤立檔案數:         ${RED}%6d${NC}\n" "$ORPHANED"
printf "檔案使用率:         ${GREEN}%5.1f%%${NC}\n" "$(awk "BEGIN {printf \"%.1f\", ($REFERENCED/$FILES_TO_CHECK)*100}")"
echo ""

if [ "$ORPHANED" -gt 0 ]; then
    echo -e "${YELLOW}=========================================="
    echo "🚨 孤立檔案清單 (按類型分類)"
    echo "==========================================${NC}"
    echo ""
    
    echo -e "${YELLOW}## TypeScript 檔案 (.ts)${NC}"
    echo "---"
    grep "\.ts$" "$OUTPUT_DIR/orphaned-files.txt" | head -20
    TS_COUNT=$(grep -c "\.ts$" "$OUTPUT_DIR/orphaned-files.txt" 2>/dev/null || echo 0)
    echo ""
    echo "TypeScript 孤立檔案: $TS_COUNT"
    echo ""
    
    echo -e "${YELLOW}## HTML 模板檔案 (.html)${NC}"
    echo "---"
    grep "\.html$" "$OUTPUT_DIR/orphaned-files.txt" | head -10
    HTML_COUNT=$(grep -c "\.html$" "$OUTPUT_DIR/orphaned-files.txt" 2>/dev/null || echo 0)
    echo ""
    echo "HTML 孤立檔案: $HTML_COUNT"
    echo ""
    
    echo -e "${YELLOW}## 樣式檔案 (.less, .scss, .css)${NC}"
    echo "---"
    grep -E "\.(less|scss|css)$" "$OUTPUT_DIR/orphaned-files.txt" | head -10
    STYLE_COUNT=$(grep -cE "\.(less|scss|css)$" "$OUTPUT_DIR/orphaned-files.txt" 2>/dev/null || echo 0)
    echo ""
    echo "樣式孤立檔案: $STYLE_COUNT"
    echo ""
fi

echo -e "${GREEN}=========================================="
echo "✅ 分析完成"
echo "==========================================${NC}"
echo ""
echo "詳細檔案清單已保存至:"
echo "  - 所有檔案:       $OUTPUT_DIR/all-source-files.txt"
echo "  - 需檢查檔案:     $OUTPUT_DIR/files-to-check.txt"
echo "  - 被引用檔案:     $OUTPUT_DIR/unique-referenced.txt"
echo "  - 孤立檔案:       $OUTPUT_DIR/orphaned-files.txt"
echo ""
echo -e "${BLUE}💡 提示: 完整分析報告請查看 docs/ORPHANED_FILES_ANALYSIS.md${NC}"
echo ""

# 返回孤立檔案數作為退出碼 (限制在 0-255)
exit $(( ORPHANED > 255 ? 255 : ORPHANED ))
