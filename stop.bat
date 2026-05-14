@echo off
title Khidmat AI - Stop
echo Stopping Khidmat AI servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 " ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Khidmat Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Khidmat Mobile*" >nul 2>&1
echo All Khidmat AI processes stopped.
timeout /t 2 /nobreak >nul
