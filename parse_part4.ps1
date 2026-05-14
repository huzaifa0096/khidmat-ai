$raw = Get-Content 'part4_response.json' -Encoding UTF8 -Raw
$j = $raw | ConvertFrom-Json
Write-Host "TraceID: $($j.trace_id)"
Write-Host ""
Write-Host "=== CRISIS ASSESSMENT ===" -ForegroundColor Red
$j.crisis.crisis_assessment | ConvertTo-Json -Depth 4
Write-Host ""
Write-Host "=== DISPATCH PLAN PRIMARY PROVIDERS ===" -ForegroundColor Yellow
$j.crisis.dispatch_plan.primary_providers | ConvertTo-Json -Depth 4
Write-Host ""
Write-Host "=== AREA ALERT ===" -ForegroundColor Cyan
$j.crisis.area_alert | ConvertTo-Json -Depth 3
Write-Host ""
Write-Host "=== AGENTS FIRED (trace steps) ===" -ForegroundColor Green
$j.trace.steps | ForEach-Object { Write-Host "  Step $($_.step): $($_.agent)" }
