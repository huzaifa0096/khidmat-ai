# Part 2: AC Technician Request
$body1 = @{
    user_text = "Mujhe kal subah G-13 mein AC technician chahiye"
    user_id   = "U001"
} | ConvertTo-Json

Write-Host "=== PART 2: parse-and-rank (AC Technician) ===" -ForegroundColor Cyan
try {
    $resp2 = Invoke-RestMethod -Uri 'https://campus-forum-maker-perfectly.trycloudflare.com/api/orchestrate/parse-and-rank' `
        -Method POST -ContentType 'application/json' -Body $body1
    $resp2 | ConvertTo-Json -Depth 20 | Tee-Object -FilePath 'part2_response.json'
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $_.Exception.Response.GetResponseStream() | ForEach-Object {
        $reader = New-Object System.IO.StreamReader($_)
        Write-Host $reader.ReadToEnd()
    }
}
