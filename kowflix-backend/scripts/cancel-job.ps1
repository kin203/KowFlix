# Cancel Stuck Encoding Job Script
# Usage: .\cancel-job.ps1 -JobId "JOB_ID_HERE"

param(
    [Parameter(Mandatory = $false)]
    [string]$JobId,
    
    [Parameter(Mandatory = $false)]
    [string]$MovieTitle
)

$baseUrl = "http://localhost:5000/api"

# Get admin token (you need to replace this with actual token from localStorage)
Write-Host "You need an admin token to cancel jobs" -ForegroundColor Yellow
$token = Read-Host "Enter your admin token (from browser localStorage)"

if ([string]::IsNullOrEmpty($token)) {
    Write-Host "Token required!" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# If no JobId provided, list encoding jobs
if ([string]::IsNullOrEmpty($JobId)) {
    Write-Host "`nFetching encoding jobs..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/jobs?status=encoding" -Headers $headers -Method GET
        $jobs = ($response.Content | ConvertFrom-Json).data
        
        if ($jobs.Count -eq 0) {
            Write-Host "No encoding jobs found!" -ForegroundColor Green
            exit 0
        }
        
        Write-Host "`nEncoding Jobs:" -ForegroundColor Yellow
        $jobs | ForEach-Object {
            Write-Host "  ID: $($_._id)" -ForegroundColor White
            Write-Host "  Title: $($_.movieTitle)" -ForegroundColor Cyan
            Write-Host "  Progress: $($_.progress)%" -ForegroundColor Green
            Write-Host "  Started: $($_.startTime)" -ForegroundColor Gray
            Write-Host "  ---"
        }
        
        $JobId = Read-Host "`nEnter Job ID to cancel (or press Enter to exit)"
        if ([string]::IsNullOrEmpty($JobId)) {
            exit 0
        }
    }
    catch {
        Write-Host "Failed to fetch jobs: $_" -ForegroundColor Red
        exit 1
    }
}

# Cancel the job
Write-Host "`nCancelling job: $JobId" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/jobs/$JobId/cancel" -Headers $headers -Method POST
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "Job cancelled successfully!" -ForegroundColor Green
        Write-Host "Next job in queue will start automatically." -ForegroundColor Cyan
    }
    else {
        Write-Host "Failed to cancel job: $($result.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
