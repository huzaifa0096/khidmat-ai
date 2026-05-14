$raw = Get-Content 'part3_response.json' -Encoding UTF8 -Raw
$j = $raw | ConvertFrom-Json
Write-Host "Booking ID: $($j.booking_id)"
Write-Host "Receipt ID: $($j.receipt.receipt_id)"
Write-Host ""
Write-Host "=== RECEIPT ===" -ForegroundColor Green
$j.receipt.lines | ForEach-Object { Write-Host "  $($_.label): $($_.value)" }
Write-Host ""
Write-Host "=== FOLLOWUP PLAN ===" -ForegroundColor Magenta
$j.followup_plan | ConvertTo-Json -Depth 8
