#!/bin/bash

echo "========================================="
echo "AIDP 系统依赖检查"
echo "========================================="
echo ""

# 检查 Python
echo "检查 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
else
    echo "❌ Python 未安装"
    exit 1
fi

# 检查 Node.js
echo ""
echo "检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js 未安装"
    exit 1
fi

# 检查 npm
echo ""
echo "检查 npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm 未安装"
    exit 1
fi

# 检查后端依赖
echo ""
echo "检查后端依赖..."
cd backend

if [ -d "venv" ]; then
    echo "✅ Python 虚拟环境存在"
else
    echo "⚠️  Python 虚拟环境不存在，建议创建："
    echo "   cd backend && python3 -m venv venv"
fi

# 检查 requirements.txt
if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt 存在"
else
    echo "❌ requirements.txt 不存在"
fi

# 检查数据目录
cd ..
if [ -d "backend/data" ]; then
    echo "✅ 数据目录存在"

    # 检查数据文件
    DATA_FILES=("users.json" "knowledge.json" "config.json" "vectors.json")
    for file in "${DATA_FILES[@]}"; do
        if [ -f "backend/data/$file" ]; then
            echo "  ✅ $file"
        else
            echo "  ⚠️  $file 不存在（系统会自动创建）"
        fi
    done
else
    echo "⚠️  数据目录不存在（系统会自动创建）"
fi

# 检查前端依赖
echo ""
echo "检查前端依赖..."
cd frontend

if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
else
    echo "⚠️  node_modules 不存在，需要运行："
    echo "   cd frontend && npm install"
fi

# 检查 package.json
if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
else
    echo "❌ package.json 不存在"
fi

# 检查构建产物
if [ -d "dist" ]; then
    echo "✅ 前端已构建（dist 目录存在）"
else
    echo "⚠️  前端未构建，开发模式不需要"
fi

cd ..

echo ""
echo "========================================="
echo "系统检查完成！"
echo "========================================="
echo ""
echo "启动命令："
echo ""
echo "  启动后端:"
echo "    cd backend && python3 run.py"
echo ""
echo "  启动前端:"
echo "    cd frontend && npm run dev"
echo ""
echo "  或使用启动脚本:"
echo "    ./start-dev.sh"
echo ""
