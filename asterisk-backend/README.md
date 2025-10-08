# DENCO Asterisk Backend - Node.js

AsteriskPBXと直接通信するNode.jsバックエンドサーバー。ARI (Asterisk REST Interface)を使用してリアルタイムで通話を制御し、Pythonバックエンドと連携してAI音声処理を実現します。

## 🎯 機能

- **ARI統合**: Asterisk PBXとのリアルタイム通信
- **通話制御**: 着信・発信・切断・転送などの完全な通話制御
- **WebSocket通信**:
  - Pythonバックエンドとの音声データ連携
  - フロントエンドへのリアルタイム通話状態配信
- **イベント処理**: Asteriskイベントのリアルタイムハンドリング
- **外部メディア対応**: カスタム音声ストリーム処理

## 📦 アーキテクチャ

```
┌──────────────────────────────────────────────────────────┐
│                  Asterisk PBX (FreePBX)                   │
│                                                            │
│  ┌─────────────┐         ┌─────────────┐                │
│  │ SIP通話     │         │ ARI         │                │
│  │ (電話回線)   │         │ (Port 8088) │                │
│  └─────────────┘         └──────┬──────┘                │
└─────────────────────────────────┼───────────────────────┘
                                   │ ARI REST + WebSocket
                                   │
┌──────────────────────────────────▼───────────────────────┐
│          Node.js Backend (Asterisk統合層)                │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ ARI Client  │  │ Call Handler │  │ WebSocket    │   │
│  │             │  │              │  │ Manager      │   │
│  └─────────────┘  └──────────────┘  └──────┬───────┘   │
│                                             │            │
│  REST API:                                  │            │
│  - GET  /health                             │            │
│  - GET  /api/calls/active                   │            │
│  - POST /api/calls/originate                │            │
│  - POST /api/calls/:id/disconnect           │            │
└─────────────────────────────────────────────┼───────────┘
                                              │
        ┌─────────────────────┬───────────────┘
        │                     │
        │ WebSocket           │ WebSocket
        │                     │
┌───────▼──────────┐  ┌───────▼──────────┐
│ Python Backend   │  │  Next.js         │
│ (AI処理)         │  │  Frontend        │
│                  │  │  (監視UI)        │
│ - STT/TTS        │  │                  │
│ - Dify AI        │  │  - 通話モニター   │
│ - VAD            │  │  - ダッシュボード │
└──────────────────┘  └──────────────────┘
```

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
cd asterisk-backend
npm install
```

### 2. 環境変数の設定

```bash
# env.templateをコピーして.envを作成
cp env.template .env

# .envを編集
nano .env
```

**必須の環境変数:**

```env
# Asterisk ARI接続情報
ASTERISK_HOST=192.168.1.100          # AsteriskサーバーのIP
ASTERISK_ARI_PORT=8088                # ARIポート（デフォルト: 8088）
ASTERISK_ARI_USERNAME=ariuser         # ARIユーザー名
ASTERISK_ARI_PASSWORD=arisecret       # ARIパスワード
ASTERISK_APP_NAME=denco_voiceai       # Stasisアプリケーション名

# Node.jsサーバー設定
NODE_SERVER_PORT=3001                 # このサーバーのポート
NODE_SERVER_HOST=0.0.0.0              # バインドアドレス

# Pythonバックエンド連携
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000

# 認証トークン
BACKEND_AUTH_TOKEN=your-secure-token  # PythonバックエンドとNode.js間の認証トークン
```

### 3. Asterisk側の設定

詳細な手順は [`../ASTERISK_SETUP.md`](../ASTERISK_SETUP.md) を参照してください。

**最小限の設定:**

1. **ARI有効化** (`/etc/asterisk/ari.conf`):
```ini
[general]
enabled = yes

[ariuser]
type = user
password = arisecret
```

2. **Stasisダイヤルプラン** (`/etc/asterisk/extensions_custom.conf`):
```ini
[denco-ai-inbound]
exten => _X.,1,NoOp(DENCO AI着信)
 same => n,Answer()
 same => n,Stasis(denco_voiceai,${EXTEN},${CALLERID(num)})
 same => n,Hangup()
```

3. **Asteriskリロード**:
```bash
asterisk -rx "module reload res_ari.so"
asterisk -rx "dialplan reload"
```

### 4. サーバー起動

#### 開発モード（自動リロード付き）

```bash
npm run dev
```

#### 本番モード

```bash
npm start
```

**起動成功ログ例:**
```
[2025-10-05T12:00:00.000Z] [INFO] Asterisk ARIに接続中... {"host":"192.168.1.100","port":8088}
[2025-10-05T12:00:01.000Z] [INFO] Asterisk ARIに接続成功
[2025-10-05T12:00:01.000Z] [INFO] Stasisアプリケーション起動: denco_voiceai
[2025-10-05T12:00:01.000Z] [INFO] WebSocketサーバー初期化完了
[2025-10-05T12:00:01.000Z] [INFO] サーバー起動完了 {"host":"0.0.0.0","port":3001}
```

## 🔌 API エンドポイント

### ヘルスチェック

```bash
GET /health
```

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "asterisk": {
    "connected": true
  },
  "activeCalls": 3
}
```

### アクティブな通話一覧

```bash
GET /api/calls/active
```

**レスポンス:**
```json
{
  "status": "success",
  "calls": [
    {
      "callId": "uuid-1234",
      "channelId": "PJSIP/1001-00000001",
      "callerNumber": "09012345678",
      "calledNumber": "0312345678",
      "status": "answered",
      "startTime": "2025-10-05T12:00:00.000Z",
      "duration": 45000
    }
  ],
  "count": 1
}
```

### 発信（アウトバウンド通話）

```bash
POST /api/calls/originate
Content-Type: application/json

{
  "phoneNumber": "09012345678",
  "callerId": "0312345678",
  "variables": {
    "campaign": "sales"
  }
}
```

**レスポンス:**
```json
{
  "status": "success",
  "message": "Call originated",
  "channelId": "PJSIP/09012345678-00000002",
  "phoneNumber": "09012345678"
}
```

### 通話切断

```bash
POST /api/calls/{callId}/disconnect
```

**レスポンス:**
```json
{
  "status": "success",
  "message": "Call disconnected",
  "callId": "uuid-1234"
}
```

### Asterisk接続状態

```bash
GET /api/asterisk/status
```

**レスポンス:**
```json
{
  "status": "success",
  "connected": true,
  "host": "192.168.1.100",
  "ariPort": 8088,
  "appName": "denco_voiceai"
}
```

## 🔌 WebSocket エンドポイント

### フロントエンド用WebSocket

```
ws://localhost:3001/ws/frontend
```

**受信メッセージ例:**
```json
{
  "type": "call_started",
  "callId": "uuid-1234",
  "channelId": "PJSIP/1001-00000001",
  "callerNumber": "09012345678",
  "calledNumber": "0312345678",
  "timestamp": "2025-10-05T12:00:00.000Z"
}
```

**送信メッセージ例:**
```json
{
  "type": "join_call",
  "callId": "uuid-1234"
}
```

### モニタリング用WebSocket

```
ws://localhost:3001/ws/monitor
```

リアルタイム通話監視用の専用WebSocket接続。

## 📂 プロジェクト構造

```
asterisk-backend/
├── server.js                 # メインサーバー（Express + WebSocket）
├── ari-client.js            # ARI接続管理クライアント
├── call-handler.js          # 通話制御ロジック
├── websocket-manager.js     # WebSocket管理
├── config.js                # 設定管理
├── logger.js                # ロガー
├── package.json             # 依存関係
├── env.template             # 環境変数テンプレート
└── README.md                # このファイル
```

## 🔧 開発

### ログレベルの変更

`.env`ファイルで設定:

```env
LOG_LEVEL=debug  # error, warn, info, debug
```

### デバッグモード

```bash
NODE_ENV=development LOG_LEVEL=debug npm run dev
```

### Asterisk ARIのデバッグ

Asterisk CLI:
```bash
asterisk -rvvvvv
ari set debug all on
```

## 🐛 トラブルシューティング

### ARI接続エラー

**症状:** `ARI クライアントエラー: connect ECONNREFUSED`

**解決策:**
1. Asteriskが起動しているか確認
2. ARIが有効か確認: `asterisk -rx "ari show status"`
3. ポート8088が開いているか確認: `netstat -tuln | grep 8088`
4. ファイアウォール設定を確認

### 認証エラー (401 Unauthorized)

**症状:** `401 Unauthorized`

**解決策:**
1. ARIユーザー名・パスワードを確認
2. `/etc/asterisk/ari.conf`のユーザー設定を確認
3. Asteriskをリロード: `asterisk -rx "module reload res_ari.so"`

### 通話が接続されない

**症状:** 着信しても通話が確立しない

**解決策:**
1. Stasisダイヤルプランを確認: `asterisk -rx "dialplan show denco-ai-inbound"`
2. アプリケーション名が一致しているか確認（`denco_voiceai`）
3. Asterisk CLIでログ確認: `asterisk -rvvvvv`

### WebSocket接続エラー

**症状:** フロントエンドがWebSocketに接続できない

**解決策:**
1. Node.jsサーバーが起動しているか確認
2. CORS設定を確認（`CORS_ORIGINS`）
3. ネットワーク接続を確認

## 📊 監視とメトリクス

### ヘルスチェック

```bash
# 定期的なヘルスチェック
watch -n 5 'curl -s http://localhost:3001/health | jq'
```

### アクティブ通話監視

```bash
# アクティブな通話をリアルタイム監視
watch -n 2 'curl -s http://localhost:3001/api/calls/active | jq'
```

### ログ監視

```bash
# リアルタイムログ
tail -f logs/asterisk-backend.log
```

## 🚀 本番デプロイ

### PM2を使用したデプロイ

```bash
# PM2インストール
npm install -g pm2

# アプリケーション起動
pm2 start server.js --name asterisk-backend

# 自動起動設定
pm2 startup
pm2 save

# ログ確認
pm2 logs asterisk-backend
```

### Dockerを使用したデプロイ

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

```bash
docker build -t denco-asterisk-backend .
docker run -d -p 3001:3001 --env-file .env denco-asterisk-backend
```

## 📄 ライセンス

MIT License

## 🤝 サポート

問題が発生した場合は、[ASTERISK_SETUP.md](../ASTERISK_SETUP.md)のトラブルシューティングセクションを参照してください。

