#!/bin/bash
set -e

# Helper functions
check_build() { [[ -d "build" ]] || { echo "❌ **Build Failed**: Cannot run Lighthouse analysis" > lighthouse-comment.md; return 1; }; }
check_config() { [[ -f ".lighthouserc.cjs" ]] || { echo "❌ **Configuration Missing**: .lighthouserc.cjs not found" > lighthouse-comment.md; return 1; }; }
score_status() { 
  if (($1 >= 90)); then 
    echo "✅ Excellent"
  elif (($1 >= 70)); then 
    echo "⚠️ Good"
  else 
    echo "❌ Needs improvement"
  fi
}

echo "🔍 Running lighthouse analysis..."
check_build && check_config || exit 0

{
  echo "## 🔍 Lighthouse Performance Report"
  echo
  
  pnpx @lhci/cli@0.15.x autorun > lighthouse-output.txt 2>&1
  
    # Check if we have any Lighthouse reports and jq is available
  if command -v jq >/dev/null && ls .lighthouseci/lhr-*.json >/dev/null 2>&1; then

    latest_report=$(ls -t .lighthouseci/lhr-*.json | head -1)
    
    # Extract scores
    perf=$(jq -r '.categories.performance.score * 100 | floor' "$latest_report" 2>/dev/null || echo "N/A")
    a11y=$(jq -r '.categories.accessibility.score * 100 | floor' "$latest_report" 2>/dev/null || echo "N/A")
    bp=$(jq -r '.categories["best-practices"].score * 100 | floor' "$latest_report" 2>/dev/null || echo "N/A")
    seo=$(jq -r '.categories.seo.score * 100 | floor' "$latest_report" 2>/dev/null || echo "N/A")
    
    echo "| Category | Score | Status |"
    echo "|----------|-------|--------|"
    echo "| 🚀 Performance | ${perf}% | $(score_status "$perf") |"
    echo "| ♿ Accessibility | ${a11y}% | $(score_status "$a11y") |"
    echo "| 🛡️ Best Practices | ${bp}% | $(score_status "$bp") |"
    echo "| 🔍 SEO | ${seo}% | $(score_status "$seo") |"
    echo
    
    echo "### 📊 Core Web Vitals"
    for metric in "first-contentful-paint:First Contentful Paint" "largest-contentful-paint:Largest Contentful Paint" "cumulative-layout-shift:Cumulative Layout Shift" "interactive:Time to Interactive"; do
      key=${metric%:*}
      name=${metric#*:}
      value=$(jq -r ".audits[\"$key\"].displayValue" "$latest_report" 2>/dev/null || echo "N/A")
      echo "- **$name**: $value"
    done
    
    echo
    echo "### 🎯 Top Performance Opportunities"
    jq -r '[.audits | to_entries[] | select(.value.details?.overallSavingsMs? > 100) | {title: .value.title, savings: .value.details.overallSavingsMs}] | sort_by(-.savings) | .[0:3][] | "- **\(.title)**: \(.savings)ms potential savings"' "$latest_report" 2>/dev/null || echo "- No major optimization opportunities found"
  else
    echo "⚠️ **Lighthouse analysis was unable to complete**"
    echo
    echo "Alternative options:"
    echo "- **Local testing**: Run \`pnpx @lhci/cli@0.15.x autorun\` after building"
    echo "- **Production testing**: Use [PageSpeed Insights](https://pagespeed.web.dev/)"
    echo "- **Bundle analysis**: Check bundle size analysis for optimization opportunities"
    
    [[ -f lighthouse-output.txt ]] && {
      echo
      echo "<details><summary>📋 Debug Output</summary>"
      echo
      echo "\`\`\`"
      tail -30 lighthouse-output.txt
      echo "\`\`\`"
      echo "</details>"
    }
  fi
  
  echo
  echo "*Generated on $(date)*"
} > lighthouse-comment.md 