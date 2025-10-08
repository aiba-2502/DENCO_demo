# Windows 11 本番環境デプロイガイド

Windows 11サーバーでDENCO音声AIシステムを24/7稼働させるための完全ガイドです。

## 📋 事前準備

### 必須スクリプト

本デプロイガイドでは以下のスクリプトを使用します：

```powershell
.\initialize-database.ps1   # データベース初期化（1コマンド）
.\check-database.ps1        # データベース状態確認
.\reset-database.ps1        # データベースリセット
.\start-all-services.ps1    # 全サービス起動
.\stop-all-services.ps1     # 全サービス停止
```

## 🖥️ システム構成

```
┌─────────────────────────────────────────────────┐
│         Windows 11 Server                       │
│         (アプリケーションサーバー)               │
│                                                  │
│  ┌──────────────────────────────────┐           │
│  │ DENCO音声AIシステム              │           │
│  │                                  │           │
│  │  - Python Backend (Port 8000)   │           │
│  │  - Node.js Backend (Port 3001)  │           │
│  │  - Next.js Frontend (Port 3000) │           │
│  │  - PostgreSQL 15 (Port 5432)    │           │
│  │                                  │           │
│  │  Windowsサービスとして稼働       │           │
│  └──────────────────────────────────┘           │
└─────────────┬───────────────────────────────────┘
              │
              │ LAN/VPN接続
              │ ARI通信（Port 8088）
              │
┌─────────────▼───────────────────────────────────┐
│         Debian Server                           │
│         (Asterisk PBXサーバー - 別サーバー)      │
│                                                  │
│  ┌──────────────────────────────────┐           │
│  │ FreePBX 16/17                    │           │
│  │  - Asterisk 18/20                │           │
│  │  - ARI (Port 8088)               │           │
│  │  - SIP (Port 5060)               │           │
│  │  - RTP (Port 10000-20000)        │           │
│  └──────────────────────────────────┘           │
└──────────────────────────────────────────────────┘
```

---

## 🚀 デプロイ手順

### 0. データベース初期化（最初に実行）

```powershell
# PostgreSQLサービス起動
Start-Service postgresql-x64-15

# データベース初期化（1コマンド）
.\initialize-database.ps1

# 確認
.\check-database.ps1
```

---

### 1. Windows 11サーバーの準備

#### システム設定

```powershell
# PowerShell管理者モードで実行

# 電源プラン：高パフォーマンス設定
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# スリープ無効化
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0

# Windowsアップデート自動再起動の無効化
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoRebootWithLoggedOnUsers" -Value 1

# ページングファイルサイズ設定（16GB推奨）
wmic computersystem where name="%computername%" set AutomaticManagedPagefile=False
wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=16384,MaximumSize=16384
```

#### ファイアウォール設定

```powershell
# Windows Defenderファイアウォールで受信許可
New-NetFirewallRule -DisplayName "DENCO Python Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "DENCO Node.js Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "DENCO Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow

# 確認
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*DENCO*"}
```

---

### 2. NSSMでWindowsサービス化

#### NSSMインストール

```powershell
# NSSMダウンロード
# https://nssm.cc/download
# nssm-2.24.zip をダウンロード

# 展開してC:\Toolsに配置
Expand-Archive -Path nssm-2.24.zip -DestinationPath C:\Tools
$env:Path += ";C:\Tools\nssm-2.24\win64"

# 確認
nssm --version
```

#### Pythonバックエンドのサービス化

```powershell
# プロジェクトディレクトリに移動
cd C:\Users\user\Downloads\DENCO20250914-main

# サービス作成
nssm install DencoPythonBackend "$PWD\venv\Scripts\uvicorn.exe"
nssm set DencoPythonBackend AppParameters "main:app --host 0.0.0.0 --port 8000"
nssm set DencoPythonBackend AppDirectory "$PWD"
nssm set DencoPythonBackend DisplayName "DENCO Python Backend"
nssm set DencoPythonBackend Description "DENCO音声AIシステム - AI処理・データベース"
nssm set DencoPythonBackend Start SERVICE_AUTO_START

# エラー時の自動再起動設定
nssm set DencoPythonBackend AppExit Default Restart
nssm set DencoPythonBackend AppRestartDelay 5000

# ログ設定
nssm set DencoPythonBackend AppStdout "$PWD\logs\python-backend-stdout.log"
nssm set DencoPythonBackend AppStderr "$PWD\logs\python-backend-stderr.log"

# サービス開始
Start-Service DencoPythonBackend

# 状態確認
Get-Service DencoPythonBackend
```

#### Node.jsバックエンドのサービス化

```powershell
# サービス作成
nssm install DencoNodeBackend "C:\Program Files\nodejs\node.exe"
nssm set DencoNodeBackend AppParameters "server.js"
nssm set DencoNodeBackend AppDirectory "$PWD\asterisk-backend"
nssm set DencoNodeBackend DisplayName "DENCO Node.js Backend"
nssm set DencoNodeBackend Description "DENCO音声AIシステム - Asterisk統合"
nssm set DencoNodeBackend Start SERVICE_AUTO_START

# 依存関係：Pythonバックエンドが起動後に起動
nssm set DencoNodeBackend DependOnService DencoPythonBackend

# エラー時の自動再起動
nssm set DencoNodeBackend AppExit Default Restart
nssm set DencoNodeBackend AppRestartDelay 5000

# ログ設定
nssm set DencoNodeBackend AppStdout "$PWD\logs\node-backend-stdout.log"
nssm set DencoNodeBackend AppStderr "$PWD\logs\node-backend-stderr.log"

# サービス開始
Start-Service DencoNodeBackend

# 状態確認
Get-Service DencoNodeBackend
```

#### Next.jsフロントエンドのサービス化

```powershell
# 本番ビルド
npm run build

# サービス作成
nssm install DencoFrontend "C:\Program Files\nodejs\node.exe"
nssm set DencoFrontend AppParameters "node_modules\.bin\next start"
nssm set DencoFrontend AppDirectory "$PWD"
nssm set DencoFrontend DisplayName "DENCO Frontend"
nssm set DencoFrontend Description "DENCO音声AIシステム - Web UI"
nssm set DencoFrontend Start SERVICE_AUTO_START

# 依存関係
nssm set DencoFrontend DependOnService DencoPythonBackend

# エラー時の自動再起動
nssm set DencoFrontend AppExit Default Restart
nssm set DencoFrontend AppRestartDelay 5000

# ログ設定
nssm set DencoFrontend AppStdout "$PWD\logs\frontend-stdout.log"
nssm set DencoFrontend AppStderr "$PWD\logs\frontend-stderr.log"

# サービス開始
Start-Service DencoFrontend

# 状態確認
Get-Service DencoFrontend
```

---

### 3. PostgreSQLの本番設定

#### サービス設定

```powershell
# PostgreSQLサービスを自動起動に設定
Set-Service -Name postgresql-x64-15 -StartupType Automatic

# 確認
Get-Service postgresql-x64-15
```

#### パフォーマンスチューニング

```powershell
# postgresql.confの編集
notepad "C:\Program Files\PostgreSQL\15\data\postgresql.conf"
```

```ini
# 接続設定
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 4GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# ロギング
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_duration = off
log_lock_waits = on
```

```powershell
# PostgreSQL再起動
Restart-Service postgresql-x64-15
```

---

### 4. タスクスケジューラでヘルスチェック

#### ヘルスチェックスクリプト作成

```powershell
# ディレクトリ作成
New-Item -ItemType Directory -Path C:\Scripts -Force

# ヘルスチェックスクリプト
@"
# DENCO音声AIシステム ヘルスチェック

`$logFile = "C:\Scripts\healthcheck.log"
`$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log {
    param([string]`$message)
    "`$timestamp - `$message" | Out-File -FilePath `$logFile -Append
}

# Pythonバックエンド確認
try {
    `$python = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
    if (`$python.StatusCode -ne 200) {
        Write-Log "Python Backend unhealthy, restarting..."
        Restart-Service DencoPythonBackend
    } else {
        Write-Log "Python Backend OK"
    }
} catch {
    Write-Log "Python Backend ERROR: `$_"
    Restart-Service DencoPythonBackend
}

# Node.jsバックエンド確認
try {
    `$node = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing
    if (`$node.StatusCode -ne 200) {
        Write-Log "Node.js Backend unhealthy, restarting..."
        Restart-Service DencoNodeBackend
    } else {
        Write-Log "Node.js Backend OK"
    }
} catch {
    Write-Log "Node.js Backend ERROR: `$_"
    Restart-Service DencoNodeBackend
}

# PostgreSQL確認
try {
    `$pgService = Get-Service postgresql-x64-15
    if (`$pgService.Status -ne 'Running') {
        Write-Log "PostgreSQL stopped, starting..."
        Start-Service postgresql-x64-15
    } else {
        Write-Log "PostgreSQL OK"
    }
} catch {
    Write-Log "PostgreSQL ERROR: `$_"
}
"@ | Out-File -FilePath C:\Scripts\denco-healthcheck.ps1 -Encoding UTF8
```

#### タスクスケジューラに登録

```powershell
# タスク作成（1分ごとに実行）
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\Scripts\denco-healthcheck.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "DencoHealthCheck" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

# 確認
Get-ScheduledTask -TaskName "DencoHealthCheck"

# タスク実行
Start-ScheduledTask -TaskName "DencoHealthCheck"

# ログ確認
Get-Content C:\Scripts\healthcheck.log -Tail 20
```

---

### 5. ログローテーション設定

```powershell
# ログローテーションスクリプト作成
@"
# ログローテーション（30日以上のログを削除）

`$logPath = "C:\Users\user\Downloads\DENCO20250914-main\logs"
`$daysToKeep = 30

Get-ChildItem -Path `$logPath -Filter *.log | Where-Object {
    `$_.LastWriteTime -lt (Get-Date).AddDays(-`$daysToKeep)
} | Remove-Item -Force

Write-Host "Old logs cleaned up"
"@ | Out-File -FilePath C:\Scripts\denco-log-rotate.ps1 -Encoding UTF8

# タスクスケジューラに登録（毎日午前3時）
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\Scripts\denco-log-rotate.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "DencoLogRotate" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
```

---

### 6. バックアップ設定

#### データベースバックアップ

```powershell
# バックアップスクリプト作成
@"
# PostgreSQLバックアップ

`$backupDir = "C:\Backups\DENCO"
`$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
`$backupFile = "`$backupDir\voiceai-`$timestamp.sql"

# バックアップディレクトリ作成
if (-not (Test-Path `$backupDir)) {
    New-Item -ItemType Directory -Path `$backupDir -Force
}

# バックアップ実行
`$env:PGPASSWORD = "your_password"
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U voiceai -d voiceai -f `$backupFile

# 古いバックアップ削除（7日以上前）
Get-ChildItem -Path `$backupDir -Filter *.sql | Where-Object {
    `$_.LastWriteTime -lt (Get-Date).AddDays(-7)
} | Remove-Item -Force

Write-Host "Backup completed: `$backupFile"
"@ | Out-File -FilePath C:\Scripts\denco-backup.ps1 -Encoding UTF8

# タスクスケジューラに登録（毎日午前2時）
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\Scripts\denco-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "DencoBackup" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
```

---

### 7. 監視ダッシュボード設定

#### パフォーマンスモニター

```powershell
# パフォーマンスカウンター設定
$counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes",
    "\Network Interface(*)\Bytes Total/sec",
    "\PhysicalDisk(_Total)\Disk Bytes/sec"
)

# リアルタイム監視
Get-Counter -Counter $counters -SampleInterval 1 -MaxSamples 10
```

#### イベントログ監視

```powershell
# アプリケーションエラー監視
Get-EventLog -LogName Application -EntryType Error -Newest 10 | Format-Table -AutoSize

# システムエラー監視
Get-EventLog -LogName System -EntryType Error -Newest 10 | Format-Table -AutoSize
```

---

### 8. サービス管理コマンド

```powershell
# 全サービス確認
Get-Service Denco*

# サービス開始
Start-Service DencoPythonBackend
Start-Service DencoNodeBackend
Start-Service DencoFrontend

# サービス停止
Stop-Service DencoPythonBackend
Stop-Service DencoNodeBackend
Stop-Service DencoFrontend

# サービス再起動
Restart-Service DencoPythonBackend
Restart-Service DencoNodeBackend

# サービス状態監視
while ($true) {
    Clear-Host
    Get-Service Denco* | Format-Table -AutoSize
    Start-Sleep -Seconds 5
}
```

---

### 9. Asterisk PBXサーバー（Debian）との接続確認

```powershell
# Windows 11からAsteriskサーバーへの接続テスト
Test-NetConnection -ComputerName 192.168.1.100 -Port 8088

# SSH接続（OpenSSH使用）
ssh root@192.168.1.100

# ARI接続テスト（Windows 11から）
Invoke-WebRequest -Uri "http://192.168.1.100:8088/ari/asterisk/info" `
    -Headers @{Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("ariuser:arisecret"))}
```

---

## 📊 監視・運用

### サービス状態監視スクリプト

```powershell
# monitor-services.ps1
while ($true) {
    Clear-Host
    Write-Host "=== DENCO システム監視 ===" -ForegroundColor Cyan
    Write-Host "時刻: $(Get-Date)" -ForegroundColor White
    Write-Host ""
    
    # サービス状態
    Write-Host "サービス状態:" -ForegroundColor Yellow
    Get-Service Denco* | Format-Table Name, Status, StartType -AutoSize
    
    # CPU/メモリ
    $cpu = (Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1).CounterSamples[0].CookedValue
    $mem = (Get-Counter '\Memory\Available MBytes').CounterSamples[0].CookedValue
    
    Write-Host "`nリソース使用状況:" -ForegroundColor Yellow
    Write-Host "CPU: $([math]::Round($cpu, 2))%"
    Write-Host "利用可能メモリ: $([math]::Round($mem, 0)) MB"
    
    # プロセス
    $pythonProc = Get-Process python -ErrorAction SilentlyContinue
    $nodeProc = Get-Process node -ErrorAction SilentlyContinue
    
    Write-Host "`nプロセス:" -ForegroundColor Yellow
    Write-Host "Python: $($pythonProc.Count) プロセス"
    Write-Host "Node.js: $($nodeProc.Count) プロセス"
    
    # ヘルスチェック
    Write-Host "`nヘルスチェック:" -ForegroundColor Yellow
    try {
        $pythonHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
        Write-Host "Python Backend: OK ($($pythonHealth.status))" -ForegroundColor Green
    } catch {
        Write-Host "Python Backend: ERROR" -ForegroundColor Red
    }
    
    try {
        $nodeHealth = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 2
        Write-Host "Node.js Backend: OK (Asterisk: $($nodeHealth.asterisk.connected))" -ForegroundColor Green
    } catch {
        Write-Host "Node.js Backend: ERROR" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 5
}
```

保存: `C:\Scripts\monitor-services.ps1`

実行:
```powershell
PowerShell -ExecutionPolicy Bypass -File C:\Scripts\monitor-services.ps1
```

---

## 🛡️ セキュリティ設定

### Windows Defenderの除外設定

```powershell
# プロジェクトディレクトリを除外（パフォーマンス向上）
Add-MpPreference -ExclusionPath "C:\Users\user\Downloads\DENCO20250914-main"
Add-MpPreference -ExclusionPath "C:\Program Files\PostgreSQL\15\data"

# プロセスを除外
Add-MpPreference -ExclusionProcess "python.exe"
Add-MpPreference -ExclusionProcess "node.exe"
Add-MpPreference -ExclusionProcess "postgres.exe"
```

### ネットワークセキュリティ

```powershell
# 信頼できるIPのみ許可（オプション）
# AsteriskサーバーからのARI通信のみ許可
New-NetFirewallRule -DisplayName "DENCO - Asterisk Server Only" `
    -Direction Inbound -LocalPort 3001 -Protocol TCP `
    -RemoteAddress 192.168.1.100 -Action Allow

# 他のIPからのアクセスをブロック
New-NetFirewallRule -DisplayName "DENCO - Block Others" `
    -Direction Inbound -LocalPort 3001 -Protocol TCP `
    -Action Block -Priority 1000
```

---

## 📈 パフォーマンス最適化

### Windows 11カーネルパラメータ

```powershell
# TCP/IP最適化
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global dca=enabled
netsh int tcp set global netdma=enabled

# 確認
netsh int tcp show global
```

### リソース制限解除

```powershell
# プロセスあたりのファイルハンドル数を増やす（レジストリ）
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\SubSystems" -Name "Windows" -Value "%SystemRoot%\system32\csrss.exe ObjectDirectory=\Windows SharedSection=1024,20480,768 Windows=On SubSystemType=Windows ServerDll=basesrv,1 ServerDll=winsrv:UserServerDllInitialization,3 ServerDll=sxssrv,4 ProfileControl=Off MaxRequestThreads=16"

# 再起動が必要
Restart-Computer -Confirm
```

---

## ✅ デプロイチェックリスト

### Windows 11サーバー

- [ ] PowerShell実行ポリシー設定済み
- [ ] PostgreSQL 15インストール・起動済み
- [ ] Python仮想環境作成済み
- [ ] Node.js 18以上インストール済み
- [ ] 依存パッケージすべてインストール済み
- [ ] 環境変数（.env）設定済み
- [ ] NSSMでサービス化完了
- [ ] ファイアウォール設定完了
- [ ] ヘルスチェックタスク登録済み
- [ ] バックアップタスク登録済み

### Asteriskサーバー（Debian + FreePBX）

- [ ] FreePBX 16/17インストール済み
- [ ] ARI有効化・ユーザー作成済み
- [ ] Stasisダイヤルプラン作成済み
- [ ] インバウンドルート設定済み
- [ ] ファイアウォール設定（8088, 5060, 10000-20000）
- [ ] Windows 11からARI接続確認済み

### ネットワーク

- [ ] Windows 11 ↔ Asterisk: ポート8088疎通確認
- [ ] 外部 ↔ Asterisk: ポート5060疎通確認
- [ ] RTPポート（10000-20000）開放確認

---

## 🎯 起動・停止コマンド

```powershell
# 全サービス起動
Start-Service DencoPythonBackend, DencoNodeBackend, DencoFrontend

# 全サービス停止
Stop-Service DencoPythonBackend, DencoNodeBackend, DencoFrontend

# 全サービス再起動
Restart-Service DencoPythonBackend, DencoNodeBackend, DencoFrontend

# 状態確認
Get-Service Denco* | Format-Table -AutoSize
```

---

**Windows 11で24/7稼働可能な本番環境が完成しました！** 🎉

