# DENCO Voice AI System - Database Initialization Script (Windows 11)
# Usage: .\initialize-database.ps1
# Options: -Force (recreate existing database)
#          -PostgresPassword (specify postgres user password)

param(
    [switch]$Force,
    [string]$PostgresPassword = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DENCO Database Initialization" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL installation
function Find-PostgreSQLPath {
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin"
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
    Write-Host "[NG] PostgreSQL not found!" -ForegroundColor Red
    Write-Host "Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] PostgreSQL found: $pgPath" -ForegroundColor Green
$env:PATH = "$pgPath;$env:PATH"

# Get postgres password
if (-not $PostgresPassword) {
    Write-Host "Enter postgres user password (press Enter for empty password):" -ForegroundColor Cyan
    $securePassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Load configuration
function Get-EnvConfig {
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
        Write-Host "[OK] Loaded from .env" -ForegroundColor Green
    } else {
        Write-Host "[!] .env not found. Using defaults" -ForegroundColor Yellow
    }
    
    return $config
}

# Test connection
function Test-PostgreSQLConnection {
    param($config, $postgresPass)
    
    Write-Host "[1/6] Testing PostgreSQL connection..." -ForegroundColor Yellow
    
    try {
        $service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq 'Running'}
        if ($service) {
            Write-Host "[OK] Service running: $($service.Name)" -ForegroundColor Green
        } else {
            Write-Host "[NG] Service not running" -ForegroundColor Red
            return $false
        }
    } catch {}
    
    $env:PGPASSWORD = $postgresPass
    $testResult = & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "SELECT 1" -t 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Connected to PostgreSQL" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[NG] Cannot connect. Check password" -ForegroundColor Red
        return $false
    }
}

function Test-DatabaseExists {
    param($config, $postgresPass)
    $env:PGPASSWORD = $postgresPass
    $result = & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -t -c "SELECT 1 FROM pg_database WHERE datname='$($config.POSTGRES_DB)'" 2>&1
    return ($result -match "1")
}

function Test-UserExists {
    param($config, $postgresPass)
    $env:PGPASSWORD = $postgresPass
    $result = & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -t -c "SELECT 1 FROM pg_roles WHERE rolname='$($config.POSTGRES_USER)'" 2>&1
    return ($result -match "1")
}

function Test-TableExists {
    param($config, $tableName)
    $env:PGPASSWORD = $config.POSTGRES_PASSWORD
    $result = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$tableName'" 2>&1
    return ($result -match "1")
}

function Initialize-DatabaseAndUser {
    param($config, $force, $postgresPass)
    
    Write-Host "[2/6] Checking database and user..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $postgresPass
    
    $dbExists = Test-DatabaseExists -config $config -postgresPass $postgresPass
    
    if ($dbExists) {
        if ($force) {
            Write-Host "[!] Dropping existing database..." -ForegroundColor Red
            $query = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$($config.POSTGRES_DB)'"
            & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c $query 2>&1 | Out-Null
            & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "DROP DATABASE IF EXISTS $($config.POSTGRES_DB)" 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Dropped database" -ForegroundColor Green
                $dbExists = $false
            } else {
                Write-Host "[NG] Failed to drop" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "[OK] Database exists (skip)" -ForegroundColor Green
        }
    }
    
    if (-not $dbExists) {
        Write-Host "Creating database..." -ForegroundColor White
        & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "CREATE DATABASE $($config.POSTGRES_DB)" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Database created" -ForegroundColor Green
        } else {
            Write-Host "[NG] Failed to create database" -ForegroundColor Red
            return $false
        }
    }
    
    $userExists = Test-UserExists -config $config -postgresPass $postgresPass
    
    if (-not $userExists) {
        Write-Host "Creating user..." -ForegroundColor White
        & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "CREATE USER $($config.POSTGRES_USER) WITH PASSWORD '$($config.POSTGRES_PASSWORD)'" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] User created" -ForegroundColor Green
        } else {
            Write-Host "[NG] Failed to create user" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "[OK] User exists (skip)" -ForegroundColor Green
    }
    
    Write-Host "Granting privileges..." -ForegroundColor White
    & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -c "GRANT ALL PRIVILEGES ON DATABASE $($config.POSTGRES_DB) TO $($config.POSTGRES_USER)" 2>&1 | Out-Null
    & "$pgPath\psql.exe" -U postgres -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -c "GRANT ALL ON SCHEMA public TO $($config.POSTGRES_USER)" 2>&1 | Out-Null
    
    Write-Host "[OK] Privileges granted" -ForegroundColor Green
    return $true
}

function Invoke-Migration {
    param($config, $migrationFile, $description)
    
    $fileName = Split-Path $migrationFile -Leaf
    Write-Host "  Executing: $fileName" -ForegroundColor White
    
    $env:PGPASSWORD = $config.POSTGRES_PASSWORD
    $result = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -f $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] $description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [NG] Failed" -ForegroundColor Red
        return $false
    }
}

function Invoke-AllMigrations {
    param($config)
    
    Write-Host "[3/6] Running migrations..." -ForegroundColor Yellow
    
    $migrations = @(
        @{File = "supabase\migrations\20250429091156_ancient_snow.sql"; CheckTable = "tenants"; Description = "Base schema"},
        @{File = "migrations\add_missing_tables.sql"; CheckTable = "dtmf_events"; Description = "Call tables"},
        @{File = "migrations\add_frontend_features.sql"; CheckTable = "customers"; Description = "Frontend"}
    )
    
    $successCount = 0
    $skipCount = 0
    $failCount = 0
    
    foreach ($migration in $migrations) {
        if (Test-Path $migration.File) {
            Write-Host "`n$($migration.Description):" -ForegroundColor Cyan
            
            $tableExists = $false
            if ($migration.CheckTable) {
                $tableExists = Test-TableExists -config $config -tableName $migration.CheckTable
            }
            
            if ($tableExists) {
                Write-Host "  [OK] Skip (exists)" -ForegroundColor Gray
                $skipCount++
            } else {
                $result = Invoke-Migration -config $config -migrationFile $migration.File -description $migration.Description
                if ($result) {
                    $successCount++
                } else {
                    $failCount++
                }
            }
        } else {
            Write-Host "  [!] Not found: $($migration.File)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Results: Success=$successCount, Skip=$skipCount, Fail=$failCount" -ForegroundColor Cyan
    
    return ($failCount -eq 0)
}

function Show-DatabaseTables {
    param($config)
    
    Write-Host "[4/6] Checking tables..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $config.POSTGRES_PASSWORD
    $tables = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $tableArray = $tables -split "`n" | Where-Object { $_.Trim() -ne "" }
        Write-Host "[OK] Total tables: $($tableArray.Count)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[NG] Failed" -ForegroundColor Red
        return $false
    }
}

function Show-DatabaseIndexes {
    param($config)
    
    Write-Host "[5/6] Checking indexes..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $config.POSTGRES_PASSWORD
    $indexCount = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Index count: $($indexCount.Trim())" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[!] Skip" -ForegroundColor Yellow
        return $true
    }
}

function Test-DatabaseAccess {
    param($config)
    
    Write-Host "[6/6] Testing access..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $config.POSTGRES_PASSWORD
    $result = & "$pgPath\psql.exe" -U $config.POSTGRES_USER -h $config.POSTGRES_HOST -d $config.POSTGRES_DB -c "SELECT COUNT(*) FROM tenants" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Access successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[NG] Access failed" -ForegroundColor Red
        return $false
    }
}

function Show-Summary {
    param($config)
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "Initialization Complete!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database: $($config.POSTGRES_DB)" -ForegroundColor Cyan
    Write-Host "User: $($config.POSTGRES_USER)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next:" -ForegroundColor Cyan
    Write-Host "  .\start-all-services.ps1" -ForegroundColor White
    Write-Host ""
}

function Show-ErrorSummary {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "Initialization Failed" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  Get-Service postgresql*" -ForegroundColor Gray
    Write-Host ""
}

# Main
try {
    $config = Get-EnvConfig
    
    if (-not (Test-PostgreSQLConnection -config $config -postgresPass $PostgresPassword)) {
        Show-ErrorSummary
        exit 1
    }
    
    Write-Host ""
    
    if (-not (Initialize-DatabaseAndUser -config $config -force $Force -postgresPass $PostgresPassword)) {
        Show-ErrorSummary
        exit 1
    }
    
    Write-Host ""
    
    Invoke-AllMigrations -config $config | Out-Null
    
    Write-Host ""
    
    Show-DatabaseTables -config $config
    Show-DatabaseIndexes -config $config
    
    Write-Host ""
    
    if (Test-DatabaseAccess -config $config) {
        Show-Summary -config $config
        exit 0
    } else {
        Show-ErrorSummary
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Show-ErrorSummary
    exit 1
}
