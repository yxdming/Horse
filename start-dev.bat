@echo off
REM AIDP Manager Development Startup Script for Windows

echo Starting AIDP Manager Management System...

REM Start Backend in new window
echo Starting Backend Server...
start "AIDP Manager Backend" cmd /k "cd backend && python run.py"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend Server...
start "AIDP Manager Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo AIDP Manager Management System is running!
echo ==========================================
echo Backend API: http://7.250.75.172:8000
echo API Docs:   http://7.250.75.172:8000/api/docs
echo Frontend:   http://7.250.75.172:5173
echo.
echo Also accessible via localhost:
echo Backend API: http://localhost:8000
echo Frontend:   http://localhost:5173
echo.
echo Close this window to keep servers running.
echo Press Ctrl+C in server windows to stop.
echo ==========================================
echo.
pause
