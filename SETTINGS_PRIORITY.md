# 設定の優先順位システム

## 📋 設定読み込みの優先順位

```
1. .env ファイル（最優先）
   ↓ なければ
2. データベース（Web画面で設定）
   ↓ なければ  
3. デフォルト値
```

---

## 🔧 設定項目

### Asterisk ARI設定

| 項目 | .env変数名 | DB列名 | デフォルト値 |
|------|-----------|--------|------------|
| ホスト | `ASTERISK_HOST` | `ari_host` | - |
| ポート | `ASTERISK_ARI_PORT` | `ari_port` | `8088` |
| ユーザー名 | `ASTERISK_ARI_USERNAME` | `ari_username` | - |
| パスワード | `ASTERISK_ARI_PASSWORD` | `ari_password` | - |
| アプリ名 | `ASTERISK_APP_NAME` | `ari_app_name` | `denco_voiceai` |

**優先順位例：**
```
ASTERISK_HOST=192.168.1.140 (.env)
  ↓ 優先
DB: ari_host=192.168.1.100
  ↓
最終値: 192.168.1.140 (.envが優先される)
```

---

### Azure Speech設定

| 項目 | .env変数名 | DB列名 | デフォルト値 |
|------|-----------|--------|------------|
| サブスクリプションキー | `AZURE_SPEECH_KEY` | `azure_speech_key` | - |
| リージョン | `AZURE_SPEECH_REGION` | `azure_speech_region` | `japaneast` |
| 言語 | - | `azure_speech_language` | `ja-JP` |
| 音声 | - | `azure_speech_voice` | `ja-JP-NanamiNeural` |

---

### Dify AI設定

| 項目 | .env変数名 | DB列名 | デフォルト値 |
|------|-----------|--------|------------|
| APIキー | `DIFY_API_KEY` | `dify_api_key` | - |
| エンドポイント | `DIFY_ENDPOINT` | `dify_endpoint` | `https://api.dify.ai/v1` |
| ナレッジAPIキー | - | `dify_knowledge_api_key` | - |
| ナレッジエンドポイント | - | `dify_knowledge_endpoint` | - |

---

### 応答メッセージ設定

| 項目 | DB列名 | デフォルト値 |
|------|--------|------------|
| 着信メッセージ | `greeting_message` | `お電話ありがとうございます。` |
| 着信音声URL | `greeting_audio_url` | - |
| 音声使用 | `use_audio_greeting` | `false` |
| 担当者呼び出し | `human_callout_message` | `担当者におつなぎしております。` |
| 担当者引継ぎ | `human_handover_message` | `担当者に代わります。` |
| 音声名 | `voice_name` | `ja-JP-NanamiNeural` |
| 話速 | `speech_rate` | `1.0` |
| 音量 | `volume` | `75` |

---

## 🔌 API仕様

### 全設定取得

```http
GET /api/settings
Authorization: Bearer {TENANT_ID}
```

**レスポンス：**
```json
{
  "status": "success",
  "settings": {
    "asterisk": {
      "ari_host": "192.168.1.140",
      "ari_port": "8088",
      "ari_username": "firstlaunch",
      "ari_password": "***",
      "ari_app_name": "denco_voiceai"
    },
    "azure_speech": {
      "subscription_key": "***",
      "region": "japaneast",
      "language": "ja-JP",
      "voice": "ja-JP-NanamiNeural"
    },
    "dify": {
      "api_key": "***",
      "endpoint": "https://api.dify.ai/v1"
    },
    "response": {
      "incoming_call_message": "お電話ありがとうございます。",
      "voice_name": "ja-JP-NanamiNeural",
      "speech_rate": 1.0,
      "volume": 75
    }
  },
  "source": {
    "asterisk": "env",
    "azure_speech": "env",
    "dify": "database"
  }
}
```

**`source`フィールド：** どこから設定を読み込んだかを示す
- `env` - .envファイルから
- `database` - データベースから
- `default` - デフォルト値

---

### 設定更新

```http
PUT /api/settings
Authorization: Bearer {TENANT_ID}
Content-Type: application/json
```

**リクエストボディ：**
```json
{
  "asterisk": {
    "ari_host": "192.168.1.140",
    "ari_port": "8088",
    "ari_username": "firstlaunch",
    "ari_password": "Firstlaunch4321"
  },
  "response": {
    "incoming_call_message": "カスタムメッセージ",
    "voice_name": "ja-JP-KeitaNeural"
  }
}
```

**レスポンス：**
```json
{
  "status": "success",
  "message": "Settings updated successfully"
}
```

---

## 🖥️ フロントエンド実装

```typescript
// 設定取得
const response = await api.settings.getAll();
console.log(response.settings);
console.log(response.source); // どこから読み込んだか

// 設定更新
await api.settings.update({
  asterisk: {
    ari_host: "192.168.1.140",
    ari_username: "firstlaunch"
  }
});
```

---

## 💡 使用例

### ケース1: .envに設定がある場合

**.env:**
```env
ASTERISK_HOST=192.168.1.140
ASTERISK_ARI_USERNAME=firstlaunch
ASTERISK_ARI_PASSWORD=Firstlaunch4321
```

**DB:**
```sql
ari_host = '192.168.1.100'
ari_username = 'olduser'
```

**結果：**
```
ari_host: 192.168.1.140 (.env優先)
ari_username: firstlaunch (.env優先)
ari_port: 8088 (DB値、.envに定義なし)
```

---

### ケース2: .envに定義なし

**.env:**
```env
(ASTERISK_HOSTの記載なし)
```

**DB:**
```sql
ari_host = '192.168.1.100'
ari_username = 'dbuser'
```

**結果：**
```
ari_host: 192.168.1.100 (DBから読み込み)
ari_username: dbuser (DBから読み込み)
```

---

## 🔄 設定反映の流れ

```
1. Web画面で設定変更
   ↓
2. PUT /api/settings → DBに保存
   ↓
3. サービス再起動時
   ↓
4. .env確認 → あればそれを使用
   ↓
5. .envなければDB読み込み
```

---

## ⚠️ 重要な注意

### .envの設定が優先される

Web画面で設定を変更しても、**.envに同じ項目があればWeb画面の設定は無視されます**。

**対処方法：**
1. .envから該当項目を削除
2. サービス再起動
3. Web画面の設定が有効になる

### 本番環境推奨

- **機密情報（パスワード、APIキー）**: .env
- **運用設定（メッセージ、音声）**: Web画面（DB）

---

**設定優先順位システム実装完了！** ✅

