#!/bin/bash
set -e

# Helper functions
check_build() { [[ -d "build" ]] || { echo "❌ **Build Failed**: Cannot analyze bundle size" > bundle-comment.md; return 1; }; }
size_status() { 
  if (($1 > 1048576)); then 
    echo "❌ Too Large"
  elif (($1 > 524288)); then 
    echo "⚠️ Large"
  else 
    echo "✅ Good"
  fi
}

echo "📦 Running bundle analysis..."
check_build || exit 0

{
  echo "## 📦 Bundle Size Analysis"
  echo
  
  if [[ -d "build/client" ]]; then
    JS_SIZE=$(find build/client -name "*.js" ! -path "*/node_modules/*" -exec stat -c%s {} + 2>/dev/null | awk '{s+=$1} END {printf "%.2f", s/1024/1024}')
    CSS_SIZE=$(find build/client -name "*.css" ! -path "*/node_modules/*" -exec stat -c%s {} + 2>/dev/null | awk '{s+=$1} END {printf "%.2f", s/1024/1024}')
    TOTAL_FILES=$(find build/client \( -name "*.js" -o -name "*.css" \) ! -path "*/node_modules/*" | wc -l)
    
    echo "### 📊 Bundle Summary"
    echo "- **Total JavaScript**: ${JS_SIZE}MB"
    echo "- **Total CSS**: ${CSS_SIZE}MB" 
    echo "- **Total Files**: ${TOTAL_FILES}"
    echo
    
    echo "### 📱 Top 5 Largest Files"
    echo "| File | Size | Gzipped | Status |"
    echo "|------|------|---------|--------|"
    
    find build/client \( -name "*.js" -o -name "*.css" \) ! -path "*/node_modules/*" -printf "%s %p\n" 2>/dev/null | 
    sort -nr | head -5 | while read -r size_bytes file; do
      basename=$(basename "$file")
      size=$(numfmt --to=iec-i --suffix=B "$size_bytes")
      gzip_size=$(gzip -c "$file" | wc -c | numfmt --to=iec-i --suffix=B)
      status=$(size_status "$size_bytes")
      echo "| $basename | $size | $gzip_size | $status |"
    done
    
    echo
    echo "### 💡 Recommendations"
    large_files=$(find build/client \( -name "*.js" -o -name "*.css" \) ! -path "*/node_modules/*" -size +1M | wc -l)
    
    if ((large_files > 0)); then
      echo "- 🔴 **Large files detected**: Consider code splitting for files > 1MB"
      echo "- 📦 **Bundle optimization**: Use dynamic imports for non-critical code"
    else
      echo "- ✅ **Good bundle sizes**: All files are within recommended limits"
    fi
    echo "- 🗜️ **Compression**: Ensure gzip/brotli is enabled in production"
  else
    echo "❌ Client build directory not found"
  fi
  
  echo
  echo "*Generated on $(date)*"
} > bundle-comment.md 