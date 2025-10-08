# システム統合ガイド

このガイドでは、Asterisk PBX、Node.jsバックエンド、Pythonバックエンド、Next.jsフロントエンドの完全な統合手順を説明します。

## 🎯 システム全体像

```
┌─────────────────────────────────────────────────────────────────┐
│                     📞 電話回線 / SIPトランク                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ SIP/RTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Asterisk PBX (FreePBX)                             │
│                                                                  │
│  - SIP通話受付                                                   │
│  - ダイヤルプラン制御                                             │
│  - ARI (Asterisk REST Interface) 提供                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ ARI (HTTP/WebSocket)
                             │ Port: 8088
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          🟢 Node.js Backend (asterisk-backend)                  │
│                                                                  │
│  - ARI Client (通話制御)                                        │
│  - Call Handler (着信・発信・DTMF処理)                          │
│  - WebSocket Manager (Python/Frontend連携)                      │
│                                                                  │
│  Port: 3001                                                      │
└───────────┬─────────────────────────┬───────────────────────────┘
            │ REST API                │ WebSocket
            │ WebSocket               │
            ▼                         ▼
┌──────────────────────┐    ┌──────────────────────┐
│ 🐍 Python Backend    │    │ ⚛️ Next.js Frontend  │
│                      │    │                      │
│ - Azure STT/TTS      │    │ - 通話モニターUI     │
│ - Dify AI統合       │    │ - ダッシュボード     │
│ - VAD検出           │    │ - 通話履歴表示       │
│ - FAX処理           │    │ - 設定管理           │
│ - PostgreSQL        │    │                      │
│                      │    │                      │
│ Port: 8000           │    │ Port: 3000           │
└──────────────────────┘    └──────────────────────┘
```

---

## 📋 前提条件

### ソフトウェア要件

- **Asterisk**: 16.x以上（推奨: 18.x, 20.x）
- **FreePBX**: 15.x以上
- **Node.js**: 18.x以上
- **Python**: 3.10, 3.11, 3.12
- **PostgreSQL**: 15以上
- **OS**: Linux (Ubuntu 20.04/22.04, CentOS 7/8推奨)

### APIキー・認証情報

- Azure Speech Services（音声認識/合成）
- Dify API（対話AI）
- Google Cloud Vision（FAX OCR）
- 各コンポーネント間の認証トークン

---

## 🚀 セットアップ手順

### 1. データベースセットアップ

#### PostgreSQLインストール

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# CentOS/RHEL
sudo dnf install postgresql15-server postgresql15-contrib
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15
```

#### データベース作成

```bash
sudo -u postgres psql

CREATE DATABASE voiceai;
CREATE USER voiceai WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE voiceai TO voiceai;
\q
```

#### スキーマ初期化

```bash
# メインスキーマ作成
psql -U voiceai -d voiceai -f supabase/migrations/20250429091156_ancient_snow.sql

# 追加テーブル作成
psql -U voiceai -d voiceai -f migrations/add_missing_tables.sql
```

---

### 2. Pythonバックエンドセットアップ

```bash
# 仮想環境作成
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\Activate.ps1  # Windows

# 依存パッケージインストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
nano .env
```

**`.env`設定:**
```env
# データベース
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=voiceai

# Azure Speech Services
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=japaneast

# Dify AI
DIFY_API_KEY=your_dify_key
DIFY_ENDPOINT=https://api.dify.ai/v1

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json

# Node.js連携用トークン
BACKEND_AUTH_TOKEN=generate-secure-random-token-here
```

**起動:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**確認:**
```bash
curl http://localhost:8000/health
# {"status":"ok","service":"python-backend",...}
```

---

### 3. Node.jsバックエンドセットアップ

```bash
cd asterisk-backend

# 依存パッケージインストール
npm install

# 環境変数設定
cp env.template .env
nano .env
```

**`.env`設定:**
```env
# Asterisk ARI
ASTERISK_HOST=192.168.1.100
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=arisecret
ASTERISK_APP_NAME=denco_voiceai

# Node.jsサーバー
NODE_SERVER_PORT=3001
NODE_SERVER_HOST=0.0.0.0

# Pythonバックエンド連携
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=same-token-as-python-backend

# フロントエンド連携
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**起動:**
```bash
npm run dev
```

**確認:**
```bash
curl http://localhost:3001/health
# {"status":"ok","asterisk":{"connected":true},...}
```

---

### 4. Asterisk/FreePBXセットアップ

詳細は [`ASTERISK_SETUP.md`](ASTERISK_SETUP.md) を参照してください。

#### 最小限の設定

**① ARI有効化** (`/etc/asterisk/ari.conf`):
```ini
[general]
enabled = yes
allowed_origins = *

[http]
enabled = yes
bindaddr = 0.0.0.0
bindport = 8088

[ariuser]
type = user
read_only = no
password = arisecret
password_format = plain
```

**② Stasisダイヤルプラン** (`/etc/asterisk/extensions_custom.conf`):
```ini
[denco-ai-inbound]
exten => _X.,1,NoOp(DENCO AI着信)
 same => n,Answer()
 same => n,Stasis(denco_voiceai,${EXTEN},${CALLERID(num)})
 same => n,Hangup()

[from-internal-custom]
exten => *88,1,NoOp(内線からAI)
 same => n,Answer()
 same => n,Stasis(denco_voiceai,internal,${CALLERID(num)})
 same => n,Hangup()
```

**③ リロード:**
```bash
asterisk -rx "module reload res_ari.so"
asterisk -rx "dialplan reload"
```

**④ FreePBX UIでインバウンドルート設定:**
- **Connectivity** → **Inbound Routes**
- **DID Number**: 着信番号
- **Destination**: Custom App → `Goto(denco-ai-inbound,${DID},1)`

---

### 5. Next.jsフロントエンドセットアップ

```bash
# 依存パッケージインストール
npm install

# 環境変数設定
cp .env.local.example .env.local
nano .env.local
```

**`.env.local`設定:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**起動:**
```bash
npm run dev
```

**アクセス:**
```
http://localhost:3000
```

---

## 🔄 通信フロー

### 着信処理フロー

```
1. 📞 電話着信
   ↓
2. Asterisk PBX受付
   ↓ Stasis(denco_voiceai)
3. Node.js Backend (ARI)
   ├─ 通話セッション作成リクエスト → Python Backend
   ├─ WebSocket接続 → Python Backend
   └─ 通話状態通知 → Frontend (WebSocket)
   ↓
4. Python Backend
   ├─ データベースに通話セッション記録
   ├─ WebSocket接続受付
   ├─ 音声ストリーム処理開始
   │   └─ VAD → Azure STT → Dify AI → Azure TTS
   └─ AI応答をNode.jsに送信
   ↓
5. Node.js Backend
   └─ 音声データをAsteriskチャンネルに送信
   ↓
6. Asterisk PBX
   └─ 発信者に音声再生
```

### 通話終了フロー

```
1. 📞 通話切断
   ↓
2. Asterisk PBX (ChannelDestroyed)
   ↓
3. Node.js Backend
   ├─ WebSocket切断
   ├─ 通話終了リクエスト → Python Backend
   └─ 通話終了通知 → Frontend
   ↓
4. Python Backend
   └─ データベース更新（end_time, status）
```

---

## 🧪 動作確認

### 1. 各サービスの起動確認

```bash
# PostgreSQL
sudo systemctl status postgresql

# Asterisk
asterisk -rx "core show version"
asterisk -rx "ari show status"

# Pythonバックエンド
curl http://localhost:8000/health

# Node.jsバックエンド
curl http://localhost:3001/health

# Asterisk接続確認
curl http://localhost:3001/api/asterisk/status

# フロントエンド
curl http://localhost:3000
```

### 2. 内線からのテスト通話

```bash
# 内線電話から *88 をダイヤル
```

**期待されるログ:**

**Node.js:**
```
[INFO] Stasis開始 {"channelId":"PJSIP/1001-00000001"}
[INFO] 着信処理開始
[INFO] 通話セッション作成成功
[INFO] PythonバックエンドWebSocket接続成功
```

**Python:**
```
INFO: WebSocket接続確立: /ws/call/uuid-1234
INFO: 音声ストリーム処理開始
```

**Asterisk CLI:**
```bash
asterisk -rvvvvv
```
```
== Stasis denco_voiceai started on PJSIP/1001-00000001
```

### 3. APIテスト

```bash
# アクティブな通話一覧（Python）
curl -H "Authorization: Bearer tenant-id" \
  http://localhost:8000/api/calls/active

# アクティブな通話一覧（Node.js）
curl http://localhost:3001/api/calls/active

# 通話履歴
curl -H "Authorization: Bearer tenant-id" \
  http://localhost:8000/api/calls
```

---

## 🔧 トラブルシューティング

### Node.js ↔ Asterisk接続エラー

**症状:** `ARI クライアントエラー: connect ECONNREFUSED`

**解決策:**
```bash
# ARIが有効か確認
asterisk -rx "ari show status"

# ポートが開いているか確認
netstat -tuln | grep 8088

# ファイアウォール確認
sudo firewall-cmd --list-ports  # CentOS
sudo ufw status                  # Ubuntu
```

---

### Node.js ↔ Python接続エラー

**症状:** `PythonバックエンドWebSocket接続エラー`

**解決策:**
```bash
# Pythonバックエンドが起動しているか確認
curl http://localhost:8000/health

# 認証トークンが一致しているか確認
# Node.js .env: BACKEND_AUTH_TOKEN
# Python .env: BACKEND_AUTH_TOKEN
```

---

### 音声が聞こえない

**症状:** 通話は接続されるが音声が流れない

**解決策:**
```bash
# RTPポートが開いているか確認
sudo firewall-cmd --add-port=10000-20000/udp --permanent
sudo firewall-cmd --reload

# NAT設定確認
nano /etc/asterisk/pjsip.conf
```

```ini
[transport-udp]
external_media_address=your-public-ip
external_signaling_address=your-public-ip
```

---

## 📊 監視とログ

### リアルタイム監視

```bash
# Node.jsログ
cd asterisk-backend
npm run dev

# Pythonログ
tail -f logs/voiceai.log

# Asterisk CLI
asterisk -rvvvvv
```

### ヘルスチェック

```bash
# 全サービス一括確認スクリプト
#!/bin/bash
echo "=== Asterisk ==="
asterisk -rx "core show version"

echo "=== Node.js Backend ==="
curl -s http://localhost:3001/health | jq

echo "=== Python Backend ==="
curl -s http://localhost:8000/health | jq

echo "=== Frontend ==="
curl -s http://localhost:3000 | head -n 1
```

---

## 📚 関連ドキュメント

- [`ASTERISK_SETUP.md`](ASTERISK_SETUP.md) - Asterisk/FreePBX詳細設定
- [`asterisk-backend/README.md`](asterisk-backend/README.md) - Node.jsバックエンド詳細
- [`PYTHON_BACKEND_API.md`](PYTHON_BACKEND_API.md) - Python API仕様
- [`README.md`](README.md) - プロジェクト概要

---

## ✅ セットアップチェックリスト

### データベース
- [ ] PostgreSQL 15以上インストール済み
- [ ] データベース`voiceai`作成済み
- [ ] ユーザー`voiceai`作成・権限付与済み
- [ ] スキーマ初期化完了

### Pythonバックエンド
- [ ] 仮想環境作成済み
- [ ] 依存パッケージインストール済み
- [ ] `.env`ファイル設定済み
- [ ] APIキー設定済み（Azure, Dify, Google Cloud）
- [ ] サーバー起動確認（`/health`レスポンス正常）

### Node.jsバックエンド
- [ ] Node.js 18以上インストール済み
- [ ] 依存パッケージインストール済み
- [ ] `.env`ファイル設定済み
- [ ] Asterisk接続情報設定済み
- [ ] サーバー起動確認（`/health`レスポンス正常）
- [ ] Asterisk ARI接続確認（`connected: true`）

### Asterisk/FreePBX
- [ ] Asterisk 16以上インストール済み
- [ ] ARI有効化済み（`ari.conf`）
- [ ] ARIユーザー作成済み
- [ ] Stasisダイヤルプラン作成済み
- [ ] インバウンドルート設定済み
- [ ] ファイアウォールポート開放済み（8088, 5060, 10000-20000）

### Next.jsフロントエンド
- [ ] 依存パッケージインストール済み
- [ ] `.env.local`設定済み
- [ ] サーバー起動確認（`http://localhost:3000`アクセス可能）

### 通信確認
- [ ] Asterisk ↔ Node.js接続確認
- [ ] Node.js ↔ Python REST API確認
- [ ] Node.js ↔ Python WebSocket確認
- [ ] Frontend ↔ Python API確認
- [ ] Frontend ↔ Node.js WebSocket確認

### 機能テスト
- [ ] 内線から*88ダイヤルでAI応答確認
- [ ] 外部着信でAI応答確認
- [ ] 通話履歴がデータベースに記録確認
- [ ] フロントエンドで通話モニター表示確認

---

**セットアップ完了！** 🎉

すべてのコンポーネントが正しく連携し、Asterisk PBXを使用したAI音声通話システムが稼働します。

