# セットアップサマリー（Windows 11版）

DENCOシステムを最短で起動するためのコマンド一覧です。

## ⚡ 最短起動（3コマンド）

```powershell
# PowerShell管理者モードで実行

# 1. データベース初期化（1コマンド）
.\initialize-database.ps1

# 2. 全サービス起動（1コマンド）
.\start-all-services.ps1

# 3. ブラウザでアクセス
Start-Process "http://localhost:3000"
```

**完了！** 🎉

---

## 📋 便利なスクリプト一覧

### データベース管理

```powershell
# 初期化（既存チェック付き）
.\initialize-database.ps1

# 強制再作成
.\initialize-database.ps1 -Force

# 状態確認
.\check-database.ps1

# 完全リセット
.\reset-database.ps1 -Confirm
```

### サービス管理

```powershell
# 起動
.\start-all-services.ps1

# 停止
.\stop-all-services.ps1

# 状態確認
Get-Service Denco*

# ヘルスチェック
Invoke-WebRequest http://localhost:8000/health
Invoke-WebRequest http://localhost:3001/health
```

---

## 🔧 初回セットアップチェックリスト

### 事前準備

- [ ] PostgreSQL 15インストール済み
- [ ] Node.js 18以上インストール済み
- [ ] Python 3.10/3.11/3.12インストール済み
- [ ] PowerShell実行ポリシー設定済み

```powershell
# 確認コマンド
psql --version
node --version
python --version
Get-ExecutionPolicy  # RemoteSigned であること
```

### 初回セットアップ

```powershell
# 1. データベース初期化
.\initialize-database.ps1

# 2. Python仮想環境作成
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Node.js依存関係インストール
cd asterisk-backend
npm install
cd ..
npm install

# 4. 環境変数設定
# .env, asterisk-backend\.env, .env.local を作成
# （テンプレートからコピー可能）

# 5. 起動
.\start-all-services.ps1
```

---

## 🎯 日常運用

### 起動・停止

```powershell
# 起動
.\start-all-services.ps1

# 停止
.\stop-all-services.ps1

# 再起動
.\stop-all-services.ps1
.\start-all-services.ps1
```

### ヘルスチェック

```powershell
# 全サービス確認
Invoke-WebRequest http://localhost:8000/health
Invoke-WebRequest http://localhost:3001/health
Invoke-WebRequest http://localhost:3000

# データベース確認
.\check-database.ps1

# Asterisk接続確認
Invoke-WebRequest http://localhost:3001/api/asterisk/status
```

### ログ確認

```powershell
# リアルタイムログ
Get-Content logs\python-backend.log -Tail 50 -Wait
Get-Content logs\node-backend.log -Tail 50 -Wait

# ジョブログ
Receive-Job -Id (Get-Content logs\python-backend.pid)
```

---

## 🆘 トラブルシューティング

### データベースエラー

```powershell
# 状態確認
.\check-database.ps1

# 再初期化
.\initialize-database.ps1 -Force
```

### サービスが起動しない

```powershell
# プロセス確認
Get-Process python, node

# ポート確認
netstat -ano | findstr ":8000 :3001 :3000"

# 強制停止して再起動
.\stop-all-services.ps1
.\start-all-services.ps1
```

### Asterisk接続エラー

```powershell
# ネットワーク接続確認
Test-NetConnection -ComputerName 192.168.1.100 -Port 8088

# .env確認
Get-Content asterisk-backend\.env | Select-String "ASTERISK_HOST"

# SSHでAsterisk確認
ssh root@192.168.1.100
asterisk -rx "ari show status"
```

---

## 📊 本番環境デプロイ

詳細は [`WINDOWS_DEPLOYMENT.md`](WINDOWS_DEPLOYMENT.md) を参照

```powershell
# NSSMでWindowsサービス化
# → 自動起動・自動復旧・24/7稼働
```

---

**すべてのコマンドがWindows 11（PowerShell）で動作します！** ✅

