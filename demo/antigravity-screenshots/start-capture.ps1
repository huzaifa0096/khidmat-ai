# Antigravity Screenshots — Capture Helper
# Run this script to:
#   1. Open the screenshot folder in File Explorer
#   2. Launch Snipping Tool
#   3. Show the capture checklist

$folder = "D:\Hackathon Challenge\demo\antigravity-screenshots"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ANTIGRAVITY SCREENSHOT CAPTURE HELPER " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Save location:" -ForegroundColor Yellow
Write-Host "  $folder" -ForegroundColor White
Write-Host ""

Write-Host "Checklist (6 screenshots to take):" -ForegroundColor Yellow
Write-Host "  [ ] 01-prompt.png         - Original prompt at top of conversation"
Write-Host "  [ ] 02-agents-listed.png  - Part 1: 6 agent files listed"
Write-Host "  [ ] 03-api-call.png       - Part 2: HTTP POST + intent JSON + top-3"
Write-Host "  [ ] 04-booking.png        - Part 3: booking_id + receipt"
Write-Host "  [ ] 05-crisis.png         - Part 4: 2 providers + area alert"
Write-Host "  [ ] 06-files-modified.png - Files Modified: 4 .ps1 scripts"
Write-Host ""

Write-Host "Shortcut: Press Win+Shift+S to start a screenshot" -ForegroundColor Green
Write-Host ""

# Open the save folder in Explorer
Write-Host "Opening folder in File Explorer..." -ForegroundColor Cyan
Start-Process explorer.exe -ArgumentList $folder

# Launch Snipping Tool
Write-Host "Launching Snipping Tool..." -ForegroundColor Cyan
Start-Process "ms-screenclip:" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Now:" -ForegroundColor Yellow
Write-Host "  1. Switch to Antigravity IDE"
Write-Host "  2. Open the 'Demonstrating Khidmat AI Agentic Workflow' conversation"
Write-Host "  3. Press Win+Shift+S, drag, capture, save with the exact filename"
Write-Host "  4. Repeat for each of the 6 screenshots"
Write-Host ""
Write-Host "Read CAPTURE_GUIDE.md in the open folder for what each screenshot should contain." -ForegroundColor Cyan
Write-Host ""
