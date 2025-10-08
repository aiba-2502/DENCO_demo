# DENCO Voice AI System - Stop All Services (Windows 11)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stopping DENCO Services..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Get-Location

function Stop-ServiceFromPid {
    param (
        [string]$ServiceName,
        [string]$PidFile
    )
    
    if (Test-Path $PidFile) {
        $jobId = Get-Content $PidFile -ErrorAction SilentlyContinue
        
        if ($jobId) {
            Write-Host "Stopping $ServiceName (Job: $jobId)..." -ForegroundColor Yellow
            
            $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
            if ($job) {
                Stop-Job -Id $jobId -ErrorAction SilentlyContinue
                Remove-Job -Id $jobId -Force -ErrorAction SilentlyContinue
                Write-Host "[OK] $ServiceName stopped" -ForegroundColor Green
            } else {
                Write-Host "[!] $ServiceName already stopped" -ForegroundColor Yellow
            }
            
            Remove-Item $PidFile -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "[!] $ServiceName PID file not found" -ForegroundColor Yellow
    }
}

Stop-ServiceFromPid "Frontend" "logs\frontend.pid"
Write-Host ""

Stop-ServiceFromPid "Node.js Backend" "logs\node-backend.pid"
Write-Host ""

Stop-ServiceFromPid "Python Backend" "logs\python-backend.pid"
Write-Host ""

Write-Host "Checking for remaining processes..." -ForegroundColor Yellow

$pythonProcs = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "[!] Found Python processes" -ForegroundColor Red
    $pythonProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Cleaned up" -ForegroundColor Green
}

$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "[!] Found Node.js processes" -ForegroundColor Red
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Cleaned up" -ForegroundColor Green
}

Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "All Services Stopped" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
