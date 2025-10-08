# DENCO音声AIシステム - システム概要

このドキュメントでは、実装された完全なシステムアーキテクチャと各コンポーネントの役割を説明します。

## 🎯 システムアーキテクチャ

### 全体構成図

```
┌────────────────────────────────────────────────────────────────┐
│                    📞 電話回線 / SIP                            │
└───────────────────────────┬────────────────────────────────────┘
                            │
                    SIP/RTP (5060, 10000-20000)
                            │
┌───────────────────────────▼────────────────────────────────────┐
│               Asterisk PBX (FreePBX)                           │
│                                                                 │
│  役割:                                                          │
│  - SIP通話の受付・制御                                          │
│  - ダイヤルプラン実行（Stasis起動）                             │
│  - ARI (Asterisk REST Interface) 提供                          │
│  - 音声コーデック変換                                           │
│                                                                 │
│  技術:                                                          │
│  - Asterisk 18.x                                               │
│  - FreePBX 16.x                                                │
│  - PJSIP (SIPスタック)                                         │
│  - ARI (HTTP/WebSocket: Port 8088)                            │
└───────────────────────────┬────────────────────────────────────┘
                            │
                    ARI REST + WebSocket
                            │
┌───────────────────────────▼────────────────────────────────────┐
│          🟢 Node.js Backend (asterisk-backend)                 │
│                          Port: 3001                            │
│                                                                 │
│  役割:                                                          │
│  - Asterisk PBXとの通信仲介                                    │
│  - 通話イベント処理（着信・切断・DTMF）                         │
│  - Pythonバックエンドとの連携                                   │
│  - フロントエンドへのリアルタイム通知                           │
│                                                                 │
│  主要モジュール:                                                │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ ARI Client       │  │ Call Handler     │                  │
│  │ (通話制御)        │  │ (着信処理)        │                  │
│  └──────────────────┘  └──────────────────┘                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ WebSocket Manager│  │ Express Server   │                  │
│  │ (リアルタイム通信) │  │ (REST API)       │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                                 │
│  技術スタック:                                                  │
│  - Node.js 18+                                                 │
│  - ari-client (ARI通信)                                        │
│  - Express (REST API)                                          │
│  - WebSocket (双方向通信)                                       │
│  - axios (HTTP通信)                                            │
└────────────┬──────────────────────┬────────────────────────────┘
             │                      │
      REST API + WebSocket   WebSocket (リアルタイム通知)
             │                      │
             ▼                      ▼
┌────────────────────────┐  ┌────────────────────────┐
│ 🐍 Python Backend      │  │ ⚛️ Next.js Frontend    │
│    Port: 8000          │  │    Port: 3000          │
│                        │  │                        │
│ 役割:                  │  │ 役割:                  │
│ - AI音声処理           │  │ - 管理UI               │
│ - 音声認識/合成        │  │ - 通話モニタリング     │
│ - 対話AI統合          │  │ - ダッシュボード       │
│ - データ永続化         │  │ - 通話履歴表示         │
│ - FAX処理             │  │ - 設定管理             │
│                        │  │                        │
│ 主要機能:              │  │ 主要画面:              │
│ ┌──────────────────┐  │  │ ┌──────────────────┐  │
│ │ WebSocket Server │  │  │ │ ダッシュボード    │  │
│ │ (音声ストリーム)  │  │  │ │ 通話モニター      │  │
│ └──────────────────┘  │  │ └──────────────────┘  │
│ ┌──────────────────┐  │  │ ┌──────────────────┐  │
│ │ Azure Speech     │  │  │ │ 通話履歴         │  │
│ │ (STT/TTS)        │  │  │ │ FAX管理          │  │
│ └──────────────────┘  │  │ └──────────────────┘  │
│ ┌──────────────────┐  │  │ ┌──────────────────┐  │
│ │ Dify AI          │  │  │ │ 顧客管理         │  │
│ │ (対話AI)         │  │  │ │ システム設定     │  │
│ └──────────────────┘  │  │ └──────────────────┘  │
│ ┌──────────────────┐  │  │                        │
│ │ VAD              │  │  │ 技術スタック:          │
│ │ (発話検出)        │  │  │ - Next.js 13         │
│ └──────────────────┘  │  │ - React 18           │
│ ┌──────────────────┐  │  │ - TypeScript         │
│ │ PostgreSQL       │  │  │ - Tailwind CSS       │
│ │ (データ永続化)    │  │  │ - shadcn/ui          │
│ └──────────────────┘  │  │                        │
│                        │  │                        │
│ 技術スタック:          │  │                        │
│ - FastAPI              │  │                        │
│ - WebSocket            │  │                        │
│ - asyncpg              │  │                        │
│ - Azure Speech SDK     │  │                        │
│ - Silero VAD           │  │                        │
│ - Google Cloud Vision  │  │                        │
└────────┬───────────────┘  └────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  PostgreSQL Database   │
│  Port: 5432            │
│                        │
│ テーブル:              │
│ - call_sessions        │
│ - messages             │
│ - dtmf_events          │
│ - tenants              │
│ - tenant_settings      │
│ - fax_documents        │
│ - users                │
└────────────────────────┘
```

---

## 🔄 通信フロー詳細

### 1. 着信処理フロー

```
┌────────┐
│ 発信者 │ 09012345678 から 0312345678 へ発信
└───┬────┘
    │ ① SIP INVITE
    ▼
┌─────────────────┐
│ Asterisk PBX    │ 着信受付
└───┬─────────────┘
    │ ② Stasis(denco_voiceai, 0312345678, 09012345678)
    │    → Stasisアプリケーション起動
    ▼
┌──────────────────────┐
│ Node.js Backend      │
│ (ARI Client)         │
└───┬──────────────────┘
    │ ③ POST /api/calls
    │    {
    │      call_id: "uuid-abc123",
    │      from_number: "09012345678",
    │      to_number: "0312345678",
    │      tenant_id: "tenant-xyz"
    │    }
    ▼
┌──────────────────────┐
│ Python Backend       │
└───┬──────────────────┘
    │ ④ DB INSERT call_sessions
    │    status = "ringing"
    │ ⑤ レスポンス返却
    ▼
┌──────────────────────┐
│ Node.js Backend      │
└───┬──────────────────┘
    │ ⑥ channel.answer()  ← Asteriskに応答指示
    │ ⑦ WebSocket接続: ws://localhost:8000/ws/call/uuid-abc123
    ▼
┌──────────────────────┐
│ Python Backend       │
│ (WebSocket Server)   │
└───┬──────────────────┘
    │ ⑧ セッション初期化
    │    - Azure Speech設定
    │    - Dify Client設定
    │    - VADバッファ準備
    │
    │ ⑨ 音声ストリーム処理開始
    │    ┌─────────────────────┐
    │    │ while True:         │
    │    │   音声データ受信     │
    │    │   ↓                 │
    │    │   VAD検出           │
    │    │   ↓                 │
    │    │   発話終了？        │
    │    │   ↓                 │
    │    │   音声認識(Azure)   │
    │    │   ↓                 │
    │    │   AI応答(Dify)      │
    │    │   ↓                 │
    │    │   音声合成(Azure)   │
    │    │   ↓                 │
    │    │   応答送信          │
    │    └─────────────────────┘
    ▼
通話進行中...
```

---

### 2. 通話終了フロー

```
┌────────┐
│ 発信者 │ 切断
└───┬────┘
    │ ① SIP BYE
    ▼
┌─────────────────┐
│ Asterisk PBX    │
└───┬─────────────┘
    │ ② ChannelDestroyed イベント
    ▼
┌──────────────────────┐
│ Node.js Backend      │
│ (Call Handler)       │
└───┬──────────────────┘
    │ ③ WebSocket切断
    │    → Python WebSocket.close()
    │
    │ ④ POST /api/calls/uuid-abc123/end
    │    {
    │      end_time: "2025-10-05T12:05:30Z",
    │      duration: 330,
    │      status: "completed"
    │    }
    ▼
┌──────────────────────┐
│ Python Backend       │
└───┬──────────────────┘
    │ ⑤ DB UPDATE call_sessions
    │    SET end_time = now(),
    │        status = "completed"
    │
    │ ⑥ アクティブセッション削除
    │    del active_sessions[call_id]
    ▼
完了
```

---

## 📡 API一覧

### Node.js Backend API (Port 3001)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/health` | ヘルスチェック |
| GET | `/api/calls/active` | アクティブな通話一覧 |
| POST | `/api/calls/originate` | 発信（アウトバウンド） |
| POST | `/api/calls/:callId/disconnect` | 通話切断 |
| GET | `/api/asterisk/status` | Asterisk接続状態 |

**WebSocket:**
- `/ws/frontend` - フロントエンドリアルタイム通知
- `/ws/monitor` - モニタリング専用

---

### Python Backend API (Port 8000)

#### Node.js連携用

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/calls` | 通話セッション作成 |
| POST | `/api/calls/:callId/end` | 通話終了記録 |
| POST | `/api/calls/:callId/dtmf` | DTMF入力記録 |
| GET | `/api/tenants/:tenantId/greeting` | 挨拶メッセージ取得 |

#### フロントエンド用

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/health` | ヘルスチェック |
| GET | `/api/calls` | 通話履歴一覧 |
| GET | `/api/calls/active` | アクティブな通話 |
| GET | `/api/calls/:callId` | 通話詳細 |
| GET | `/api/calls/:callId/messages` | メッセージ履歴 |
| GET | `/api/statistics` | 通話統計 |

**WebSocket:**
- `/ws/call/:callId` - 音声ストリーム処理

---

## 💾 データベーススキーマ

### 主要テーブル

#### call_sessions
```sql
id              UUID PRIMARY KEY
tenant_id       UUID REFERENCES tenants(id)
from_number     VARCHAR(50)
to_number       VARCHAR(50)
start_time      TIMESTAMP
end_time        TIMESTAMP
status          VARCHAR(50)  -- ringing, answered, completed, failed
```

#### messages
```sql
id              UUID PRIMARY KEY
call_id         UUID REFERENCES call_sessions(id)
content         TEXT
type            VARCHAR(20)  -- user, ai
created_at      TIMESTAMP
```

#### dtmf_events
```sql
id              UUID PRIMARY KEY
call_id         UUID REFERENCES call_sessions(id)
digit           VARCHAR(1)
created_at      TIMESTAMP
```

#### tenant_settings
```sql
id                          UUID PRIMARY KEY
tenant_id                   UUID REFERENCES tenants(id)
greeting_message            TEXT
greeting_audio_url          TEXT
use_audio_greeting          BOOLEAN
voice_name                  VARCHAR(100)
speech_rate                 FLOAT
volume                      INTEGER
```

---

## 🔧 環境変数

### Python Backend (.env)

```env
# データベース
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=password
POSTGRES_DB=voiceai

# Azure Speech
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=japaneast

# Dify AI
DIFY_API_KEY=your-key
DIFY_ENDPOINT=https://api.dify.ai/v1

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Node.js連携
BACKEND_AUTH_TOKEN=secure-token
```

### Node.js Backend (asterisk-backend/.env)

```env
# Asterisk
ASTERISK_HOST=192.168.1.100
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=arisecret
ASTERISK_APP_NAME=denco_voiceai

# Python連携
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=secure-token

# Node.js設定
NODE_SERVER_PORT=3001
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## 🚀 起動方法

### 一括起動

```bash
./start-all-services.sh
```

### 個別起動

```bash
# 1. PostgreSQL
sudo systemctl start postgresql

# 2. Pythonバックエンド
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# 3. Node.jsバックエンド
cd asterisk-backend
npm start

# 4. フロントエンド
npm run dev
```

### 停止

```bash
./stop-all-services.sh
```

---

## ✅ 動作確認

```bash
# 各サービスのヘルスチェック
curl http://localhost:8000/health    # Python
curl http://localhost:3001/health    # Node.js
curl http://localhost:3000           # Frontend

# Asterisk接続確認
curl http://localhost:3001/api/asterisk/status

# 通話テスト
# 内線から *88 をダイヤル
```

---

## 📚 ドキュメント

- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - 完全統合手順
- **[ASTERISK_SETUP.md](ASTERISK_SETUP.md)** - Asterisk/FreePBX設定
- **[PYTHON_BACKEND_API.md](PYTHON_BACKEND_API.md)** - Python API仕様
- **[asterisk-backend/README.md](asterisk-backend/README.md)** - Node.js詳細
- **[README.md](README.md)** - プロジェクト概要

---

**システム実装完了！** 🎉

