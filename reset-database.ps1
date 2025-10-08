# DENCO Voice AI System - Database Reset (Windows 11)
# WARNING: Deletes ALL data!
# Usage: .\reset-database.ps1 -Confirm

param(
    [switch]$Confirm,
    [string]$PostgresPassword = ""
)

Write-Host "==========================================" -ForegroundColor Red
Write-Host "WARNING: Database Reset" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""

if (-not $Confirm) {
    Write-Host "This will DELETE ALL DATA!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Use: .\reset-database.ps1 -Confirm" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host "Type 'YES' to continue:" -ForegroundColor Yellow
$response = Read-Host

if ($response -ne "YES") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

# Find PostgreSQL
$pgPath = $null
$possiblePaths = @("C:\Program Files\PostgreSQL\17\bin", "C:\Program Files\PostgreSQL\16\bin", "C:\Program Files\PostgreSQL\15\bin")
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\psql.exe") {
        $pgPath = $path
        break
    }
}

if (-not $pgPath) {
    Write-Host "[NG] PostgreSQL not found" -ForegroundColor Red
    exit 1
}

$env:PATH = "$pgPath;$env:PATH"

$config = @{
    POSTGRES_HOST = "localhost"
    POSTGRES_USER = "voiceai"
    POSTGRES_DB = "voiceai"
}

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^POSTGRES_DB=(.+)$') {
            $config.POSTGRES_DB = $matches[1].Trim()
        }
    }
}

if (-not $PostgresPassword) {
    Write-Host "Enter postgres password:" -ForegroundColor Cyan
    $securePass = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$env:PGPASSWORD = $PostgresPassword

Write-Host ""
Write-Host "[1/3] Terminating connections..." -ForegroundColor Yellow
$query = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$($config.POSTGRES_DB)' AND pid <> pg_backend_pid()"
& "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c $query 2>&1 | Out-Null

Write-Host "[OK] Terminated" -ForegroundColor Green

Write-Host "[2/3] Dropping database..." -ForegroundColor Yellow
& "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "DROP DATABASE IF EXISTS $($config.POSTGRES_DB)" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database dropped" -ForegroundColor Green
} else {
    Write-Host "[NG] Failed" -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Dropping user..." -ForegroundColor Yellow
& "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "DROP USER IF EXISTS $($config.POSTGRES_USER)" 2>&1 | Out-Null
Write-Host "[OK] User dropped" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Reset Complete" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: .\initialize-database.ps1" -ForegroundColor Cyan
Write-Host ""
