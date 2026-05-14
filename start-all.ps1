# Khidmat AI - Start everything in one shot
# Opens two terminal windows: backend + mobile app

$root = $PSScriptRoot

Write-Host "Khidmat AI - Starting full stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in a new PowerShell window
Write-Host "[1/2] Launching backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 3

# Start Expo in a new PowerShell window
Write-Host "[2/2] Launching mobile app (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\mobile-app'; npx expo start"

Write-Host ""
Write-Host "Both processes launched." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:    http://localhost:8000  (Swagger at /docs)" -ForegroundColor Cyan
Write-Host "Mobile app: scan the QR with Expo Go, or press 'w' for web preview" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sample inputs to try:" -ForegroundColor White
Write-Host "  - Mujhe kal subah G-13 mein AC technician chahiye"
Write-Host "  - Ghar mein pani bhar gaya hai, foran plumber bhejo G-10 mein (Crisis Mode)"
Write-Host "  - I need a math tutor for O-Levels in F-10 Islamabad"
Write-Host ""
Write-Host "Press Ctrl+C in either window to stop." -ForegroundColor DarkGray
