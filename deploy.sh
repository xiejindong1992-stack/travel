#!/bin/bash
# 一键部署：提交改动并推送到 GitHub Pages
cd "$(dirname "$0")"
git add -A
git commit -m "update $(date +%Y-%m-%d)"
git push
echo "✅ 已推送，1-2分钟后网站自动更新"
