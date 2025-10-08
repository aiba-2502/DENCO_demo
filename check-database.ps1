# DENCO Voice AI System - Database Status Check (Windows 11)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Database Status Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL
function Find-PostgreSQLPath {
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\psql.exe") {
            return $path
        }
    }
    
    $found = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        return $found.DirectoryName
    }
    
    return $null
}

$pgPath = Find-PostgreSQLPath
if (-not $pgPath) {
    Write-Host "[NG] PostgreSQL not found" -ForegroundColor Red
    exit 1
}

$env:PATH = "$pgPath;$env:PATH"

$config = @{
    POSTGRES_HOST = "localhost"
    POSTGRES_USER = "voiceai"
    POSTGRES_PASSWORD = "Firstlaunch4321"
    POSTGRES_DB = "voiceai"
}

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($config.ContainsKey($key)) {
                $config[$key] = $value
            }
        }
    }
}

# Check service
Write-Host "[1/5] PostgreSQL Service" -ForegroundColor Yellow
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq 'Running'}
if ($service) {
    Write-Host "[OK] $($service.Name) - Running" -ForegroundColor Green
} else {
    Write-Host "[NG] Not running" -ForegroundColor Red
}
Write-Host ""

# Check database
Write-Host "[2/5] Database Existence" -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
Write-Host "Enter postgres password (or press Enter to skip):" -ForegroundColor Cyan
$securePass = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$postgresPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:PGPASSWORD = $postgresPass
$dbExists = & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -t -c "SELECT 1 FROM pg_database WHERE datname='$($config.POSTGRES_DB)'" 2>&1

if ($dbExists -match "1") {
    Write-Host "[OK] Database exists" -ForegroundColor Green
} else {
    Write-Host "[NG] Database not found" -ForegroundColor Red
    Write-Host "Run: .\initialize-database.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check tables
Write-Host "[3/5] Table Count" -ForegroundColor Yellow
$env:PGPASSWORD = $config.POSTGRES_PASSWORD
$tableCount = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>&1

if ($LASTEXITCODE -eq 0) {
    $count = $tableCount.Trim()
    Write-Host "[OK] Tables: $count" -ForegroundColor Green
    
    if ([int]$count -lt 10) {
        Write-Host "[!] Low count. May need migration" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check important tables
Write-Host "[4/5] Important Tables" -ForegroundColor Yellow
$tables = @("tenants", "call_sessions", "customers", "tags", "knowledge_articles")

foreach ($table in $tables) {
    $result = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$table'" 2>&1
    
    if ($result -match "1") {
        Write-Host "  [OK] $table" -ForegroundColor Green
    } else {
        Write-Host "  [NG] $table" -ForegroundColor Red
    }
}
Write-Host ""

# Check data
Write-Host "[5/5] Data Counts" -ForegroundColor Yellow
$dataTables = @("tenants", "call_sessions", "customers", "tags")

foreach ($table in $dataTables) {
    $result = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT COUNT(*) FROM $table" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $table`: $($result.Trim()) records" -ForegroundColor White
    } else {
        Write-Host "  $table`: not found" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
