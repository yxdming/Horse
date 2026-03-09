#!/bin/bash

echo "======================================"
echo "AIDP Vue 3 前端快速启动脚本"
echo "======================================"
echo ""

# 检查后端服务
echo "1. 检查后端服务..."
if netstat -ano | findstr :8000 > /dev/null 2>&1; then
    echo "✅ 后端服务运行中 (localhost:8000)"
else
    echo "❌ 后端服务未启动"
    echo "   请先启动后端: cd backend && python -m uvicorn app.main:app --reload"
    exit 1
fi

# 检查前端服务
echo ""
echo "2. 检查前端服务..."
if netstat -ano | findstr :5174 > /dev/null 2>&1; then
    echo "✅ 前端服务运行中 (http://7.250.75.172:5174/)"
else
    echo "⚠️  前端服务未运行，正在启动..."
    cd frontend-vue
    npm run dev
fi

echo ""
echo "======================================"
echo "服务状态"
echo "======================================"
echo "前端: http://7.250.75.172:5174/"
echo "后端: http://localhost:8000"
echo "测试账号: admin / admin123"
echo "======================================"
