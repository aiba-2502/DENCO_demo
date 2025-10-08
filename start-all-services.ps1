# DENCO Voice AI System - Start All Services (Windows 11)
# Each service in a separate window for visibility

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting DENCO Services..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Get-Location

# Check PostgreSQL
Write-Host "[1/4] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq 'Running'}
    if ($pgService) {
        Write-Host "[OK] PostgreSQL running" -ForegroundColor Green
    } else {
        Write-Host "[NG] PostgreSQL not running" -ForegroundColor Red
        Write-Host "Start: Start-Service $((Get-Service 'postgresql*')[0].Name)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[!] Skip PostgreSQL check" -ForegroundColor Yellow
}
Write-Host ""

# Start Python Backend in new window
Write-Host "[2/4] Starting Python Backend (new window)..." -ForegroundColor Yellow
$pythonCmd = "cd '$rootDir'; .\venv\Scripts\Activate.ps1; Write-Host '=== Python Backend ===' -ForegroundColor Cyan; uvicorn main:app --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $pythonCmd
Write-Host "[OK] Python Backend window opened" -ForegroundColor Green
Write-Host ""

# Wait for Python to start
Start-Sleep -Seconds 5

# Start Node.js Backend in new window
Write-Host "[3/4] Starting Node.js Backend (new window)..." -ForegroundColor Yellow
$nodeCmd = "cd '$rootDir\asterisk-backend'; Write-Host '=== Node.js Backend ===' -ForegroundColor Cyan; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $nodeCmd
Write-Host "[OK] Node.js Backend window opened" -ForegroundColor Green
Write-Host ""

# Wait for Node.js to start
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "[4/4] Starting Frontend (new window)..." -ForegroundColor Yellow
$frontendCmd = "cd '$rootDir'; Write-Host '=== Next.js Frontend ===' -ForegroundColor Cyan; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
Write-Host "[OK] Frontend window opened" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "All Service Windows Opened!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check each window for startup status" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs (after startup):" -ForegroundColor Cyan
Write-Host "  Frontend:       http://localhost:3000" -ForegroundColor White
Write-Host "  Python Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  Node Backend:   http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Waiting 15 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Health Check:" -ForegroundColor Cyan

# Python Backend
try {
    $py = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  [OK] Python Backend (Port 8000)" -ForegroundColor Green
} catch {
    Write-Host "  [NG] Python Backend - $($_.Exception.Message)" -ForegroundColor Red
}

# Node.js Backend
try {
    $node = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  [OK] Node.js Backend (Port 3001)" -ForegroundColor Green
} catch {
    Write-Host "  [NG] Node.js Backend - $($_.Exception.Message)" -ForegroundColor Red
}

# Frontend
try {
    $front = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  [OK] Frontend (Port 3000)" -ForegroundColor Green
} catch {
    Write-Host "  [NG] Frontend - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Cyan
Write-Host "  .\stop-all-services.ps1" -ForegroundColor White
Write-Host ""
