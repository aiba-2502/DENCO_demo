# Python Backend API ドキュメント

DENCO音声AIシステムのPythonバックエンドAPI仕様書。

## 📋 目次

1. [概要](#概要)
2. [認証](#認証)
3. [Node.jsバックエンド連携API](#nodejsバックエンド連携api)
4. [フロントエンドAPI](#フロントエンドapi)
5. [WebSocket API](#websocket-api)
6. [FAX Webhook API](#fax-webhook-api)

---

## 概要

**ベースURL**: `http://localhost:8000`

**Content-Type**: `application/json`

**認証**: Bearer Token (テナントID)

---

## 認証

すべてのAPIエンドポイント（一部のWebhookを除く）は認証が必要です。

### リクエストヘッダー

```http
Authorization: Bearer {TENANT_ID}
```

---

## Node.jsバックエンド連携API

Node.jsバックエンド（Asterisk統合層）から呼ばれるAPI。

### 1. 通話セッション作成

```http
POST /api/calls
Authorization: Bearer {BACKEND_AUTH_TOKEN}
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "call_id": "uuid-1234-5678",
  "from_number": "09012345678",
  "to_number": "0312345678",
  "tenant_id": "tenant-uuid"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "call_id": "uuid-1234-5678",
  "tenant_id": "tenant-uuid",
  "session": {
    "id": "uuid-1234-5678",
    "tenant_id": "tenant-uuid",
    "from_number": "09012345678",
    "to_number": "0312345678",
    "start_time": "2025-10-05T12:00:00.000Z",
    "status": "ringing"
  }
}
```

---

### 2. 通話終了

```http
POST /api/calls/{call_id}/end
Authorization: Bearer {BACKEND_AUTH_TOKEN}
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "end_time": "2025-10-05T12:05:30.000Z",
  "duration": 330,
  "status": "completed"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "call_id": "uuid-1234-5678",
  "end_time": "2025-10-05T12:05:30.000Z"
}
```

---

### 3. DTMF入力記録

```http
POST /api/calls/{call_id}/dtmf
Authorization: Bearer {BACKEND_AUTH_TOKEN}
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "digit": "1",
  "timestamp": "2025-10-05T12:02:00.000Z"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "call_id": "uuid-1234-5678",
  "digit": "1"
}
```

---

### 4. テナント挨拶メッセージ取得

```http
GET /api/tenants/{tenant_id}/greeting
Authorization: Bearer {BACKEND_AUTH_TOKEN}
```

**レスポンス:**
```json
{
  "status": "success",
  "greeting_message": "お電話ありがとうございます。",
  "greeting_uri": "sound:greeting-ja",
  "use_audio": false
}
```

---

## フロントエンドAPI

Next.jsフロントエンドから呼ばれるAPI。

### 1. ヘルスチェック

```http
GET /health
```

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "service": "python-backend",
  "database": "connected"
}
```

---

### 2. 通話履歴一覧

```http
GET /api/calls?limit=50&offset=0
Authorization: Bearer {TENANT_ID}
```

**クエリパラメータ:**
- `limit` (int, optional): 取得件数（デフォルト: 50）
- `offset` (int, optional): オフセット（デフォルト: 0）

**レスポンス:**
```json
{
  "status": "success",
  "calls": [
    {
      "id": "uuid-1234",
      "tenant_id": "tenant-uuid",
      "from_number": "09012345678",
      "to_number": "0312345678",
      "start_time": "2025-10-05T12:00:00.000Z",
      "end_time": "2025-10-05T12:05:30.000Z",
      "status": "completed"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

### 3. アクティブな通話一覧

```http
GET /api/calls/active
Authorization: Bearer {TENANT_ID}
```

**レスポンス:**
```json
{
  "status": "success",
  "calls": [
    {
      "id": "uuid-5678",
      "tenant_id": "tenant-uuid",
      "from_number": "09012345678",
      "to_number": "0312345678",
      "start_time": "2025-10-05T12:10:00.000Z",
      "status": "answered",
      "is_connected": true,
      "has_ai_session": true
    }
  ],
  "count": 1
}
```

---

### 4. 通話詳細

```http
GET /api/calls/{call_id}
Authorization: Bearer {TENANT_ID}
```

**レスポンス:**
```json
{
  "status": "success",
  "session": {
    "id": "uuid-1234",
    "tenant_id": "tenant-uuid",
    "from_number": "09012345678",
    "to_number": "0312345678",
    "start_time": "2025-10-05T12:00:00.000Z",
    "end_time": "2025-10-05T12:05:30.000Z",
    "status": "completed"
  },
  "messages": [
    {
      "id": "msg-1",
      "call_id": "uuid-1234",
      "content": "こんにちは",
      "type": "user",
      "created_at": "2025-10-05T12:00:30.000Z"
    },
    {
      "id": "msg-2",
      "call_id": "uuid-1234",
      "content": "お電話ありがとうございます。",
      "type": "ai",
      "created_at": "2025-10-05T12:00:32.000Z"
    }
  ]
}
```

---

### 5. 通話メッセージ履歴

```http
GET /api/calls/{call_id}/messages
Authorization: Bearer {TENANT_ID}
```

**レスポンス:**
```json
{
  "status": "success",
  "call_id": "uuid-1234",
  "messages": [
    {
      "id": "msg-1",
      "call_id": "uuid-1234",
      "content": "こんにちは",
      "type": "user",
      "created_at": "2025-10-05T12:00:30.000Z"
    }
  ]
}
```

---

### 6. 通話統計

```http
GET /api/statistics?start_date=2025-10-01T00:00:00Z&end_date=2025-10-31T23:59:59Z
Authorization: Bearer {TENANT_ID}
```

**クエリパラメータ:**
- `start_date` (ISO 8601, optional): 開始日時
- `end_date` (ISO 8601, optional): 終了日時

**レスポンス:**
```json
{
  "status": "success",
  "statistics": {
    "total_calls": 150,
    "completed_calls": 140,
    "failed_calls": 10,
    "avg_duration": 325.5
  }
}
```

---

## WebSocket API

### 通話音声ストリーム

```
ws://localhost:8000/ws/call/{call_id}
Authorization: Bearer {TENANT_ID}
```

**接続パラメータ:**
- `call_id`: 通話セッションID

**送信データ（バイナリ）:**
- 音声データ（16-bit PCM, 16kHz）

**受信データ（バイナリ）:**
- AI応答音声データ（16-bit PCM, 16kHz）

**接続フロー:**
1. クライアントが接続
2. セッション初期化（Azure Speech + Dify設定）
3. 音声データストリーム開始
4. VAD検出 → STT → AI処理 → TTS → 応答送信
5. 切断時にクリーンアップ

---

## FAX Webhook API

### 受信FAX処理

```http
POST /api/fax/webhook/inbound
Authorization: Bearer {API_KEY}
Content-Type: multipart/form-data
```

**フォームデータ:**
- `fax_id` (string): FAX ID
- `sender_number` (string): 送信元番号
- `receiver_number` (string): 受信番号
- `pages` (int): ページ数
- `timestamp` (string): 受信日時
- `tiff_file` (file): TIFFファイル

**レスポンス:**
```json
{
  "status": "success",
  "message": "FAX received successfully",
  "document_id": "doc-uuid"
}
```

---

### FAX送信ステータス更新

```http
POST /api/fax/webhook/status
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "fax_id": "fax-uuid",
  "job_id": "job-123",
  "status": "completed",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "error_message": null
}
```

**レスポンス:**
```json
{
  "status": "success",
  "message": "Status updated successfully"
}
```

---

## エラーレスポンス

### 一般的なエラー

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**404 Not Found:**
```json
{
  "detail": "Call session not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Failed to create call session: [error details]"
}
```

---

## 使用例

### Node.jsバックエンドからの通話セッション作成

```javascript
const axios = require('axios');

async function createCallSession(callId, fromNumber, toNumber) {
  try {
    const response = await axios.post(
      'http://localhost:8000/api/calls',
      {
        call_id: callId,
        from_number: fromNumber,
        to_number: toNumber,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Call session created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create call session:', error.response?.data);
    throw error;
  }
}
```

---

### フロントエンドからの通話履歴取得

```typescript
async function fetchCallHistory(tenantId: string, limit = 50, offset = 0) {
  const response = await fetch(
    `http://localhost:8000/api/calls?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${tenantId}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch call history');
  }
  
  const data = await response.json();
  return data.calls;
}
```

---

### WebSocket接続（Python側）

```typescript
const ws = new WebSocket(`ws://localhost:8000/ws/call/${callId}`, {
  headers: {
    'Authorization': `Bearer ${tenantId}`,
  },
});

ws.on('open', () => {
  console.log('WebSocket connected');
  
  // 音声データを送信
  const audioBuffer = getAudioBuffer();
  ws.send(audioBuffer);
});

ws.on('message', (data) => {
  // AI応答音声を受信
  playAudioResponse(data);
});
```

---

## データモデル

### CallSession

```python
{
  "id": "uuid",
  "tenant_id": "uuid",
  "from_number": "string",
  "to_number": "string",
  "start_time": "datetime",
  "end_time": "datetime | null",
  "status": "ringing | answered | in_progress | completed | failed"
}
```

### Message

```python
{
  "id": "uuid",
  "call_id": "uuid",
  "content": "string",
  "type": "user | ai",
  "created_at": "datetime"
}
```

### DtmfEvent

```python
{
  "id": "uuid",
  "call_id": "uuid",
  "digit": "string",
  "created_at": "datetime"
}
```

---

## 環境変数

```env
# データベース
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=password
POSTGRES_DB=voiceai

# Azure Speech Services
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=japaneast

# Dify AI
DIFY_API_KEY=your-key
DIFY_ENDPOINT=https://api.dify.ai/v1

# Google Cloud Vision (FAX OCR)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# 認証
BACKEND_AUTH_TOKEN=your-secure-token
```

---

## 起動方法

```bash
# 仮想環境アクティベート
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\Activate.ps1  # Windows

# 依存パッケージインストール
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## テスト

### APIテスト（curl）

```bash
# ヘルスチェック
curl http://localhost:8000/health

# 通話履歴取得
curl -H "Authorization: Bearer tenant-id" \
  http://localhost:8000/api/calls

# 通話セッション作成
curl -X POST http://localhost:8000/api/calls \
  -H "Authorization: Bearer backend-token" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-123",
    "from_number": "09012345678",
    "to_number": "0312345678"
  }'
```

---

**Last Updated**: 2025-10-05

