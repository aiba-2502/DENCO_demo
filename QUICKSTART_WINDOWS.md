# クイックスタートガイド（Windows 11版）

Windows 11環境で5分でDENCO音声AIシステムを起動する手順です。

## ⚡ 前提条件の確認

### インストール済みソフトウェア

```powershell
# PowerShellを管理者として実行
# バージョン確認
node --version   # v18以上
python --version # 3.10〜3.12
psql --version   # 15以上
```

**未インストールの場合:**
- **Node.js**: https://nodejs.org/ （LTS版）
- **Python**: https://www.python.org/ （3.10/3.11/3.12）
- **PostgreSQL**: https://www.postgresql.org/download/windows/ （15以上）

---

## 📋 5分間セットアップ

### ステップ1: PowerShell実行ポリシー設定（初回のみ）

```powershell
# PowerShellを管理者として実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 確認
Get-ExecutionPolicy
# → RemoteSigned と表示されればOK
```

---

### ステップ2: データベースセットアップ（30秒 - 1コマンド）

```powershell
# PostgreSQLサービス確認・起動
Get-Service postgresql*
Start-Service postgresql-x64-15  # 停止している場合

# データベース初期化（全自動・1コマンド）
.\initialize-database.ps1
```

**このスクリプトが自動実行:**
```
✅ データベース存在チェック → なければ作成
✅ ユーザー存在チェック → なければ作成
✅ 全マイグレーション実行 → 既存ならスキップ
✅ テーブル・インデックス確認
✅ 接続テスト
```

**確認:**
```powershell
# 状態確認
.\check-database.ps1
```

---

### ステップ3: 環境変数設定（1分）

```powershell
# Pythonバックエンド用.env
@"
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=voiceai
BACKEND_AUTH_TOKEN=dev-token-123
"@ | Out-File -FilePath .env -Encoding UTF8

# Node.jsバックエンド用.env
@"
ASTERISK_HOST=192.168.1.100
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=arisecret
ASTERISK_APP_NAME=denco_voiceai
NODE_SERVER_PORT=3001
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=dev-token-123
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
"@ | Out-File -FilePath asterisk-backend\.env -Encoding UTF8

# フロントエンド用.env.local
@"
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

---

### ステップ4: 依存パッケージインストール（2分）

```powershell
# Python仮想環境作成・パッケージインストール
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Node.js（別PowerShellウィンドウ）
cd asterisk-backend
npm install
cd ..

# フロントエンド（別PowerShellウィンドウ）
npm install
```

---

### ステップ5: 一括起動（1分）

```powershell
# PowerShell管理者モードで実行
.\start-all-services.ps1
```

**または個別起動:**

```powershell
# PowerShellウィンドウ1: Python
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# PowerShellウィンドウ2: Node.js
cd asterisk-backend
npm run dev

# PowerShellウィンドウ3: Frontend
npm run dev
```

---

## ✅ 起動確認

### すべてのサービスが起動しているか確認

```powershell
# ヘルスチェック
Invoke-WebRequest http://localhost:8000/health
# → StatusCode 200, "status":"ok"

Invoke-WebRequest http://localhost:3001/health
# → StatusCode 200, "asterisk":{"connected":false}
# ※ Asterisk未設定のためfalseは正常

Invoke-WebRequest http://localhost:3000
# → StatusCode 200, HTMLが返る
```

### ブラウザでアクセス

```
http://localhost:3000
```

以下の画面が表示されればOK：
- ✅ ダッシュボード
- ✅ 通話モニター
- ✅ 顧客管理
- ✅ ナレッジデータベース

---

## 🎯 次のステップ

### Asterisk PBXサーバーと連携する

1. **Debian + FreePBXサーバーをセットアップ**
   - FreePBX ISO: https://www.freepbx.org/downloads/
   - 詳細手順: [`ASTERISK_SETUP.md`](ASTERISK_SETUP.md)

2. **Node.jsバックエンドから接続確認**
   ```powershell
   # AsteriskサーバーのIPを設定（asterisk-backend\.env）
   notepad asterisk-backend\.env
   # ASTERISK_HOST=192.168.1.100 に変更
   
   # Node.jsバックエンド再起動
   cd asterisk-backend
   npm run dev
   
   # 接続確認
   Invoke-WebRequest http://localhost:3001/api/asterisk/status
   # → "connected":true になればOK
   ```

3. **テスト通話**
   - FreePBXの内線から `*88` をダイヤル
   - AI応答を確認

---

## 🆘 トラブルシューティング（Windows 11）

### PostgreSQL接続エラー

```powershell
# サービス確認
Get-Service postgresql*

# 再起動
Restart-Service postgresql-x64-15

# パスワード確認
# C:\Program Files\PostgreSQL\15\data\pg_hba.conf
# 以下の行を確認:
# host all all 127.0.0.1/32 md5
```

### Pythonパッケージインストールエラー

```powershell
# 仮想環境の再作成
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# pipアップグレード
python -m pip install --upgrade pip

# 依存関係インストール
pip install -r requirements.txt
```

### ポート競合エラー

```powershell
# ポート使用状況確認
netstat -ano | findstr :8000
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# プロセス終了（PID確認して）
Stop-Process -Id <PID> -Force
```

### ファイアウォールエラー

```powershell
# Windows Defenderファイアウォールで許可
New-NetFirewallRule -DisplayName "Python Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Next.js Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## 🎉 起動完了！

すべてのサービスが起動したら：

- **フロントエンド**: http://localhost:3000
- **Python API Docs**: http://localhost:8000/docs
- **Node.js Health**: http://localhost:3001/health

**停止方法:**
```powershell
.\stop-all-services.ps1
```

詳細な設定は [`README.md`](README.md) を参照してください。

