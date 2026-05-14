@echo off
title Khidmat AI Launcher
echo.
echo ====================================================
echo   Khidmat AI - One-Click Launcher
echo ====================================================
echo.
echo [1/3] Cleaning up any old processes on ports 8000, 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 " ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting backend (FastAPI on port 8000)...
start "Khidmat Backend" cmd /k "cd /d %~dp0backend && echo Backend starting... && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 4 /nobreak >nul

echo [3/3] Starting mobile app (Expo Metro on port 8081)...
start "Khidmat Mobile" cmd /k "cd /d %~dp0mobile-app && echo Metro starting... && npx expo start"
timeout /t 10 /nobreak >nul

echo.
echo Both servers launching. Opening web preview...
start http://localhost:8081
echo.
echo ====================================================
echo   Done! Browser will open shortly.
echo   - Backend:    http://localhost:8000
echo   - Mobile app: http://localhost:8081
echo   - Swagger:    http://localhost:8000/docs
echo ====================================================
echo.
echo To stop both servers, close their terminal windows
echo or run: stop.bat
echo.
pause
