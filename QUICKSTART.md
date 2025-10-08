# クイックスタートガイド

5分でDENCO音声AIシステムを起動する最短手順です。

## ⚡ 最速セットアップ（開発環境）

### 前提条件の確認

```bash
# バージョン確認
node --version   # v18以上
python --version # 3.10〜3.12
psql --version   # 15以上

# なければインストール
# Node.js: https://nodejs.org/
# Python: https://www.python.org/
# PostgreSQL: https://www.postgresql.org/
```

---

### ステップ1: データベースセットアップ（2分）

```bash
# PostgreSQL起動確認
# Windows: サービス確認
# Linux: sudo systemctl status postgresql

# データベース作成
psql -U postgres
```

```sql
CREATE DATABASE voiceai;
CREATE USER voiceai WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE voiceai TO voiceai;
\q
```

```bash
# スキーマ初期化
psql -U voiceai -d voiceai -f supabase/migrations/20250429091156_ancient_snow.sql
psql -U voiceai -d voiceai -f migrations/add_missing_tables.sql
psql -U voiceai -d voiceai -f migrations/add_frontend_features.sql
```

---

### ステップ2: Pythonバックエンド起動（1分）

```bash
# 仮想環境作成・アクティベート
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

# 依存パッケージインストール
pip install -r requirements.txt

# 環境変数設定（最小限）
echo "POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=voiceai
BACKEND_AUTH_TOKEN=dev-token-123" > .env

# 起動
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**確認:** http://localhost:8000/health にアクセス → `{"status":"ok"}`

---

### ステップ3: Node.jsバックエンド起動（1分）

**新しいターミナルで:**

```bash
cd asterisk-backend

# 依存パッケージインストール
npm install

# 環境変数設定（開発用・Asterisk接続なし）
echo "ASTERISK_HOST=localhost
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=arisecret
ASTERISK_APP_NAME=denco_voiceai
NODE_SERVER_PORT=3001
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=dev-token-123
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000" > .env

# 起動
npm run dev
```

**注**: Asterisk接続なしでも起動します（エラーログは出ますが正常）

---

### ステップ4: フロントエンド起動（1分）

**新しいターミナルで:**

```bash
# プロジェクトルートに戻る
cd ..

# 依存パッケージインストール（初回のみ）
npm install

# 環境変数設定
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001" > .env.local

# 起動
npm run dev
```

---

## ✅ 起動確認

### すべてのサービスが起動しているか確認

```bash
# Pythonバックエンド
curl http://localhost:8000/health
# → {"status":"ok","service":"python-backend"}

# Node.jsバックエンド
curl http://localhost:3001/health
# → {"status":"ok","asterisk":{"connected":false}}
# ※ connected:false は Asterisk未設定のため正常

# フロントエンド
curl http://localhost:3000
# → HTMLが返ってくればOK
```

### ブラウザでアクセス

```
http://localhost:3000
```

以下の画面が表示されればOK：
- ダッシュボード
- 通話モニター（サンプルデータ）
- 顧客管理
- ナレッジデータベース

---

## 🎯 次のステップ

### Asterisk PBXと連携する場合

1. **Asterisk/FreePBXをセットアップ**
   - 詳細: [`ASTERISK_SETUP.md`](ASTERISK_SETUP.md)

2. **Node.jsバックエンドをAsteriskに接続**
   ```bash
   cd asterisk-backend
   nano .env
   ```
   
   ```env
   ASTERISK_HOST=192.168.1.100  # AsteriskサーバーのIP
   ASTERISK_ARI_USERNAME=ariuser
   ASTERISK_ARI_PASSWORD=arisecret
   ```

3. **サーバー再起動**
   ```bash
   npm run dev
   ```

4. **テスト通話**
   - 内線から `*88` をダイヤル
   - AI応答を確認

---

### Azure Speech + Dify AIを使う場合

1. **APIキーを取得**
   - Azure Speech Services: https://portal.azure.com/
   - Dify AI: https://dify.ai/

2. **環境変数に追加**
   ```bash
   nano .env
   ```
   
   ```env
   AZURE_SPEECH_KEY=your-key-here
   AZURE_SPEECH_REGION=japaneast
   DIFY_API_KEY=your-dify-key
   DIFY_ENDPOINT=https://api.dify.ai/v1
   ```

3. **Pythonバックエンド再起動**

---

## 🆘 トラブルシューティング

### Pythonバックエンドが起動しない

```bash
# 仮想環境確認
which python  # venv内のpythonか確認

# 依存関係を再インストール
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### フロントエンドが起動しない

```bash
# Node.jsバージョン確認
node --version  # v18以上必須

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

### ポート競合エラー

```bash
# ポート使用状況確認
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :8000
lsof -i :3001
lsof -i :3000

# プロセスを終了して再起動
```

---

## 🎉 起動完了！

すべてのサービスが起動したら、以下のURLにアクセスできます：

- **フロントエンド**: http://localhost:3000
- **Python API Docs**: http://localhost:8000/docs
- **Node.js Health**: http://localhost:3001/health

詳細な設定や本番環境への展開は [`README.md`](README.md) を参照してください。

