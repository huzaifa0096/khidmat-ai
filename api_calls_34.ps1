# Part 3: Confirm Booking
$body3 = @{
    trace_id            = "TRC-2026-05-15-QGB7"
    chosen_provider_id  = "PIDER920"
    user                = @{ id = "U001"; name = "Demo User"; phone = "0300-1234567" }
    time_preference     = "tomorrow_morning"
} | ConvertTo-Json -Depth 5

Write-Host "=== PART 3: confirm-booking ===" -ForegroundColor Cyan
try {
    $resp3 = Invoke-RestMethod -Uri 'https://campus-forum-maker-perfectly.trycloudflare.com/api/orchestrate/confirm-booking' `
        -Method POST -ContentType 'application/json' -Body $body3
    $resp3 | ConvertTo-Json -Depth 20 | Tee-Object -FilePath 'part3_response.json'
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

# Part 4: Crisis Demo
$body4 = @{
    user_text = "Ghar mein pani bhar gaya hai foran plumber bhejo G-10"
    user_id   = "U001"
} | ConvertTo-Json

Write-Host "=== PART 4: Crisis parse-and-rank ===" -ForegroundColor Red
try {
    $resp4 = Invoke-RestMethod -Uri 'https://campus-forum-maker-perfectly.trycloudflare.com/api/orchestrate/parse-and-rank' `
        -Method POST -ContentType 'application/json' -Body $body4
    $resp4 | ConvertTo-Json -Depth 20 | Tee-Object -FilePath 'part4_response.json'
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
