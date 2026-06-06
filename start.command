#!/bin/bash
cd "$(dirname "$0")"
echo "🌍 个人旅行网站启动中..."
echo "   打开 http://localhost:8954"
python3 -m http.server 8954
