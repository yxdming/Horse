@echo off
echo =========================================
echo AIDP Manager 系统依赖检查
echo =========================================
echo.

REM 检查 Python
echo 检查 Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo ✅ Python 已安装
) else (
    echo ❌ Python 未安装
    pause
    exit /b 1
)

echo.

REM 检查 Node.js
echo 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo ✅ Node.js 已安装
) else (
    echo ❌ Node.js 未安装
    pause
    exit /b 1
)

echo.

REM 检查 npm
echo 检查 npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version
    echo ✅ npm 已安装
) else (
    echo ❌ npm 未安装
    pause
    exit /b 1
)

echo.

REM 检查后端
echo 检查后端依赖...
cd backend

if exist venv (
    echo ✅ Python 虚拟环境存在
) else (
    echo ⚠️  Python 虚拟环境不存在，建议创建：
    echo    cd backend ^&^& python -m venv venv
)

if exist requirements.txt (
    echo ✅ requirements.txt 存在
) else (
    echo ❌ requirements.txt 不存在
)

cd ..

if exist backend\data (
    echo ✅ 数据目录存在
    if exist backend\data\users.json (echo   ✅ users.json) else (echo   ⚠️  users.json 不存在）
    if exist backend\data\knowledge.json (echo   ✅ knowledge.json) else (echo   ⚠️  knowledge.json 不存在）
    if exist backend\data\config.json (echo   ✅ config.json) else (echo   ⚠️  config.json 不存在）
    if exist backend\data\vectors.json (echo   ✅ vectors.json) else (echo   ⚠️  vectors.json 不存在）
) else (
    echo ⚠️  数据目录不存在（系统会自动创建）
)

echo.

REM 检查前端
echo 检查前端依赖...
cd frontend

if exist node_modules (
    echo ✅ node_modules 存在
) else (
    echo ⚠️  node_modules 不存在，需要运行：
    echo    cd frontend ^&^& npm install
)

if exist package.json (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 不存在
)

if exist dist (
    echo ✅ 前端已构建（dist 目录存在）
) else (
    echo ⚠️  前端未构建，开发模式不需要
)

cd ..

echo.
echo =========================================
echo 系统检查完成！
echo =========================================
echo.
echo 启动命令：
echo.
echo   启动后端:
echo     cd backend ^&^& python run.py
echo.
echo   启动前端:
echo     cd frontend ^&^& npm run dev
echo.
echo   或使用启动脚本:
echo     start-dev.bat
echo.
pause
