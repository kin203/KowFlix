# Quick Cancel All Encoding Jobs
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWRlNDRiNDUxMTBmOWMxMmU3ZGU4MCIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5Aa293ZmxpeC5jb20iLCJpYXQiOjE3NjU3OTIzMDEsImV4cCI6MTc2NjM5NzEwMX0.l3Oq6ThbycoFjTqKnexxZ4tS6EJ8TbLoziB5ubY7tYg"

Write-Host "Fetching encoding jobs..." -ForegroundColor Cyan

try {
    $headers = @{"Authorization" = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/jobs?status=encoding" -Headers $headers -Method GET
    
    if ($response.data.Count -eq 0) {
        Write-Host "No encoding jobs found!" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "`nFound $($response.data.Count) encoding job(s):" -ForegroundColor Yellow
    foreach ($job in $response.data) {
        Write-Host "  - $($job.movieTitle) (ID: $($job._id))" -ForegroundColor White
        
        # Cancel this job
        Write-Host "    Cancelling..." -ForegroundColor Yellow
        $cancelResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/jobs/$($job._id)/cancel" -Headers $headers -Method POST
        
        if ($cancelResponse.success) {
            Write-Host "    SUCCESS! Job cancelled." -ForegroundColor Green
        }
        else {
            Write-Host "    FAILED: $($cancelResponse.message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nDone! Next job in queue will start automatically." -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
