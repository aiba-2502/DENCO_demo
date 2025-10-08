# DENCOシステム - 3層アーキテクチャ構成

このドキュメントでは、DENCOシステムの3層アーキテクチャにおける各層のディレクトリ・ファイル構成を説明します。

## 概要

DENCOシステムは以下の3層で構成されています：

1. **🟢 Node.js Backend (Asterisk統合層)** - Port 3001
2. **🐍 Python Backend (AI処理層)** - Port 8000
3. **⚛️ Next.js Frontend (UI層)** - Port 3000

## 1. 🟢 Node.js Backend (Asterisk統合層)

### 配置場所
```
asterisk-backend/
```

### 責務
- Asterisk PBXとの通信（ARI経由）
- 通話制御とイベント処理
- WebSocketによるリアルタイム通信管理
- Python BackendとFrontendの橋渡し

### ディレクトリ構成

```
asterisk-backend/
├── server.js                    # Expressサーバーのエントリーポイント
├── ari-client.js                # Asterisk ARI接続管理
├── call-handler.js              # 通話制御ロジック
├── websocket-manager.js         # WebSocket通信管理（Python/Frontend）
├── config.js                    # 設定管理
├── logger.js                    # ログ機能
├── package.json                 # Node.js依存関係
├── package-lock.json            # 依存関係ロックファイル
├── env.template                 # 環境変数テンプレート
├── .env                         # 環境変数（実際の設定）
├── .gitignore                   # Git除外設定
└── README.md                    # Node.js Backend詳細ドキュメント
```

### 主要ファイルの役割

| ファイル | 役割 |
|---------|------|
| `server.js` | Expressサーバー起動、ルート定義、WebSocketサーバー初期化 |
| `ari-client.js` | ARI接続確立、再接続処理、イベント購読 |
| `call-handler.js` | 着信・発信処理、通話状態管理、Stasisアプリケーション制御 |
| `websocket-manager.js` | Python BackendとのWebSocket通信、Frontend通知管理 |
| `config.js` | 環境変数読み込み、設定値管理 |
| `logger.js` | 構造化ログ出力、ログレベル管理 |

### 起動方法

```bash
cd asterisk-backend
npm install
npm run dev
```

### 環境変数 (`.env`)

```env
# Asterisk ARI設定
ASTERISK_HOST=192.168.1.100
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=arisecret
ASTERISK_APP_NAME=denco_voiceai

# Python Backend連携
PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=your-secure-token

# サーバー設定
NODE_SERVER_PORT=3001
NODE_SERVER_HOST=0.0.0.0
```

### 依存パッケージ

```json
{
  "dependencies": {
    "ari-client": "^2.2.0",      // Asterisk ARI クライアント
    "axios": "^1.6.0",           // HTTP通信
    "dotenv": "^16.3.1",         // 環境変数管理
    "express": "^4.18.2",        // Webサーバー
    "ws": "^8.14.2",             // WebSocketサーバー
    "uuid": "^9.0.1",            // UUID生成
    "form-data": "^4.0.0"        // フォームデータ処理
  }
}
```

---

## 2. 🐍 Python Backend (AI処理層)

### 配置場所
```
/ (プロジェクトルート)
api/ (APIモジュール)
```

### 責務
- AI音声処理（Azure Speech Services）
- 対話AI制御（Dify AI）
- データベース管理（PostgreSQL）
- FAX処理・OCR
- ビジネスロジック実装
- REST API提供

### ディレクトリ構成

```
/ (ルートディレクトリ)
├── main.py                      # FastAPIメインアプリケーション
├── database.py                  # データベース接続・クエリ管理
├── database_extensions.py       # データベース拡張メソッド
├── models.py                    # Pydanticデータモデル定義
├── auth.py                      # 認証・認可処理
├── vad.py                       # 音声活動検出（Silero VAD）
├── dify_client.py               # Dify AI統合クライアント
├── setup_db.py                  # データベース初期化スクリプト
├── reset_db.py                  # データベースリセットスクリプト
├── requirements.txt             # Python依存パッケージ
├── .env                         # 環境変数（DB、Azure、Dify設定）
│
└── api/                         # APIモジュール（FastAPIルーター）
    ├── __init__.py
    ├── customers.py             # 顧客管理API
    ├── knowledge.py             # ナレッジデータベースAPI
    ├── campaigns.py             # AI架電キャンペーンAPI
    ├── settings.py              # システム設定API
    ├── tags.py                  # タグ管理API
    └── tenants.py               # テナント管理API
```

### 主要ファイルの役割

| ファイル | 役割 |
|---------|------|
| `main.py` | FastAPIアプリ初期化、CORS設定、WebSocketエンドポイント、APIルーター統合 |
| `database.py` | PostgreSQL接続プール、全データベースクエリ、トランザクション管理 |
| `database_extensions.py` | 拡張データベース操作（統計、検索、集計） |
| `models.py` | Pydanticモデル（CallSession, Customer, FaxDocument等） |
| `auth.py` | Bearer Token認証、テナントID検証 |
| `vad.py` | Silero VADによる音声活動検出 |
| `dify_client.py` | Dify APIとの通信クライアント |

### APIモジュール詳細

| モジュール | エンドポイント | 機能 |
|-----------|--------------|------|
| `customers.py` | `/api/customers/*` | 顧客CRUD、検索、通話履歴 |
| `knowledge.py` | `/api/knowledge/*` | ナレッジ記事、お問い合わせ、カテゴリー管理 |
| `campaigns.py` | `/api/campaigns/*` | AI架電テンプレート、キャンペーン管理 |
| `settings.py` | `/api/settings/*` | Azure Speech、Asterisk、Dify設定 |
| `tags.py` | `/api/tags/*` | タグCRUD |
| `tenants.py` | `/api/tenants/*` | テナント管理 |

### 起動方法

```bash
# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\Activate.ps1  # Windows

# 依存パッケージインストール
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 環境変数 (`.env`)

```env
# データベース
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=your_password
POSTGRES_DB=voiceai

# Azure Speech Services
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=japaneast

# Dify AI
DIFY_API_KEY=your_dify_key
DIFY_ENDPOINT=https://api.dify.ai/v1

# Google Cloud Vision（FAX OCR）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# バックエンド間認証
BACKEND_AUTH_TOKEN=your-secure-token
```

### 主要依存パッケージ

```txt
fastapi==0.115.0                              # Webフレームワーク
uvicorn==0.32.0                               # ASGIサーバー
asyncpg>=0.30.0                               # PostgreSQL非同期ドライバー
azure-cognitiveservices-speech==1.40.0        # Azure Speech SDK
silero-vad==5.1.2                             # 音声活動検出
torch>=2.0.0                                  # PyTorch（VAD用）
google-cloud-vision==3.8.0                    # Google Cloud Vision OCR
httpx==0.27.2                                 # 非同期HTTPクライアント
pydantic==2.9.2                               # データバリデーション
python-jose[cryptography]==3.3.0              # JWT認証
```

---

## 3. ⚛️ Next.js Frontend (UI層)

### 配置場所
```
app/ (ページ)
components/ (コンポーネント)
```

### 責務
- ユーザーインターフェース表示
- リアルタイム通話モニタリング
- 顧客・FAX・ナレッジ管理画面
- システム設定画面
- WebSocketによるリアルタイム更新

### ディレクトリ構成

```
app/                            # Next.js App Router ページ
├── page.tsx                    # ダッシュボード（ルートページ）
├── layout.tsx                  # ルートレイアウト
├── globals.css                 # グローバルスタイル
│
├── calls/                      # 通話関連ページ
│   ├── monitor/
│   │   └── page.tsx           # 通話モニター
│   ├── ai/
│   │   └── page.tsx           # AI架電
│   └── history/
│       ├── page.tsx           # 通話履歴一覧
│       └── [id]/page.tsx      # 通話詳細
│
├── fax/
│   └── page.tsx               # FAX管理
│
├── knowledge/
│   └── page.tsx               # ナレッジデータベース
│
├── users/                      # 顧客管理
│   ├── page.tsx               # 顧客一覧
│   ├── loading.tsx            # ローディング状態
│   └── error.tsx              # エラー表示
│
├── settings/
│   └── page.tsx               # システム設定
│
└── notifications/
    └── page.tsx               # 通知設定

components/                     # Reactコンポーネント
├── ui/                         # shadcn/ui UIコンポーネント（49個）
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── table.tsx
│   └── ... (他45個)
│
├── calls/                      # 通話関連コンポーネント
│   ├── monitor.tsx            # 通話モニター本体
│   ├── monitor-api.tsx        # モニターAPI統合
│   ├── call-list.tsx          # 通話リスト
│   ├── session-detail.tsx     # セッション詳細
│   ├── chat-interface.tsx     # チャットUI
│   ├── history.tsx            # 履歴表示
│   └── history-api.tsx        # 履歴API統合
│
├── dashboard/                  # ダッシュボードウィジェット
│   ├── overview.tsx
│   ├── recent-calls.tsx
│   ├── stats-card.tsx
│   └── ... (他5個)
│
├── fax/                        # FAX管理コンポーネント
│   └── fax-list.tsx
│
├── knowledge/                  # ナレッジDBコンポーネント
│   ├── article-list.tsx
│   └── inquiry-list.tsx
│
├── users/                      # 顧客管理コンポーネント
│   ├── customer-list.tsx
│   └── customer-form.tsx
│
├── settings/                   # 設定コンポーネント
│   ├── azure-settings.tsx
│   ├── asterisk-settings.tsx
│   ├── dify-settings.tsx
│   └── ... (他8個)
│
├── notifications/              # 通知コンポーネント
│   └── notification-settings.tsx
│
├── tenants/                    # テナント管理
│   └── tenant-list.tsx
│
└── layout/                     # レイアウトコンポーネント
    └── sidebar.tsx

lib/                            # ユーティリティ
└── utils.ts                    # cn()等のヘルパー関数
```

### 設定ファイル

```
/ (ルートディレクトリ)
├── package.json                # Node.js依存関係
├── package-lock.json           # 依存関係ロックファイル
├── tsconfig.json               # TypeScript設定
├── next.config.js              # Next.js設定
├── tailwind.config.ts          # Tailwind CSS設定
├── postcss.config.js           # PostCSS設定
├── .env.local                  # 環境変数（バックエンドURL）
└── .eslintrc.json              # ESLint設定
```

### 起動方法

```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build
npm run start
```

### 環境変数 (`.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 主要依存パッケージ

```json
{
  "dependencies": {
    "next": "13.5.1",                          // Next.jsフレームワーク
    "react": "18.2.0",                         // React
    "react-dom": "18.2.0",                     // React DOM
    "typescript": "5.2.2",                     // TypeScript

    // UI コンポーネント
    "@radix-ui/react-*": "^1.x.x",            // Radix UI primitives（20個）
    "lucide-react": "^0.446.0",               // アイコンライブラリ
    "class-variance-authority": "^0.7.0",      // バリアントスタイル管理
    "clsx": "^2.1.1",                         // クラス名ユーティリティ
    "tailwind-merge": "^2.5.2",               // Tailwind結合

    // フォーム
    "react-hook-form": "^7.53.0",             // フォーム管理
    "@hookform/resolvers": "^3.9.0",          // バリデーション
    "zod": "^3.23.8",                         // スキーマバリデーション

    // その他
    "date-fns": "^3.6.0",                     // 日付処理
    "recharts": "^2.12.7",                    // チャート描画
    "sonner": "^1.5.0",                       // トースト通知

    // スタイリング
    "tailwindcss": "3.3.3",                   // Tailwind CSS
    "tailwindcss-animate": "^1.0.7",          // アニメーション
    "autoprefixer": "10.4.15",                // CSSベンダープレフィックス
    "postcss": "8.4.30"                       // CSS処理
  }
}
```

### TypeScript設定 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./*"]                          // パスエイリアス
    }
  }
}
```

---

## 4. 層間通信フロー

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│              📞 電話回線 / SIPトランク                   │
└────────────────────────┬────────────────────────────────┘
                         │ SIP/RTP
                         ▼
┌─────────────────────────────────────────────────────────┐
│          Asterisk PBX (通話制御)                         │
│          Port: 5060 (SIP), 8088 (ARI)                   │
└────────────────────────┬────────────────────────────────┘
                         │ ARI (WebSocket + REST)
                         ▼
┌─────────────────────────────────────────────────────────┐
│       🟢 Node.js Backend (Asterisk統合層)               │
│       Directory: asterisk-backend/                      │
│       Port: 3001                                        │
│                                                          │
│  ✅ ARI Client（通話制御）                              │
│  ✅ Call Handler（着信・発信処理）                      │
│  ✅ WebSocket Manager（Python/Frontend連携）            │
└──────────┬─────────────────────────┬────────────────────┘
           │ REST + WebSocket        │ WebSocket
           ▼                         ▼
┌──────────────────────┐    ┌──────────────────────┐
│ 🐍 Python Backend    │    │ ⚛️ Next.js Frontend  │
│   (AI処理層)         │    │   (UI層)             │
│                      │    │                      │
│ Directory:           │    │ Directory:           │
│ - / (ルート)         │    │ - app/               │
│ - api/               │    │ - components/        │
│                      │    │                      │
│ Port: 8000           │    │ Port: 3000           │
│                      │    │                      │
│ ✅ Azure STT/TTS     │    │ ✅ ダッシュボード    │
│ ✅ Dify AI統合      │    │ ✅ 通話モニター      │
│ ✅ VAD検出          │    │ ✅ 顧客管理          │
│ ✅ FAX処理          │    │ ✅ ナレッジDB        │
│ ✅ PostgreSQL       │    │ ✅ システム設定      │
└──────────┬───────────┘    └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  PostgreSQL 15+      │
│  - 通話ログ          │
│  - 顧客データ        │
│  - ナレッジDB        │
└──────────────────────┘
```

### 通信プロトコル

| 接続 | プロトコル | 用途 |
|-----|-----------|------|
| Asterisk ↔ Node.js | WebSocket + REST (ARI) | 通話制御、イベント受信 |
| Node.js ↔ Python | WebSocket + REST | 音声ストリーム、通話情報 |
| Node.js ↔ Frontend | WebSocket | リアルタイム通話状態通知 |
| Frontend ↔ Python | REST API | データ取得・更新 |
| Python ↔ PostgreSQL | asyncpg | データベースアクセス |

---

## 5. 開発ワークフロー

### 一括起動（推奨）

```bash
# PowerShell（Windows）
.\start-all-services.ps1

# Bash（macOS/Linux）
./start-all-services.sh
```

### 個別起動

```bash
# Terminal 1: Python Backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Node.js Backend
cd asterisk-backend
npm run dev

# Terminal 3: Frontend
npm run dev
```

### アクセスURL

- **Frontend**: http://localhost:3000
- **Python API Docs**: http://localhost:8000/docs
- **Node.js Health**: http://localhost:3001/health

---

## 6. ファイル数統計

| 層 | ディレクトリ | 主要ファイル数 | 設定ファイル数 |
|----|------------|--------------|--------------|
| 🟢 Node.js Backend | `asterisk-backend/` | 7個 | 4個 |
| 🐍 Python Backend | `/` + `api/` | 15個 | 2個 |
| ⚛️ Next.js Frontend | `app/` + `components/` | 80+個 | 6個 |

### UIコンポーネント詳細

- **shadcn/ui基本コンポーネント**: 49個（`components/ui/`）
- **ドメイン別コンポーネント**: 30+個
- **ページコンポーネント**: 15+個

---

## 7. まとめ

### 各層の特徴

| 層 | 言語/FW | 主な責務 | ポート |
|----|---------|----------|--------|
| **🟢 Node.js Backend** | Node.js + Express | Asterisk統合、通話制御 | 3001 |
| **🐍 Python Backend** | Python + FastAPI | AI処理、DB管理、ビジネスロジック | 8000 |
| **⚛️ Next.js Frontend** | TypeScript + Next.js + React | UI表示、ユーザー操作 | 3000 |

### ディレクトリの見分け方

1. **`asterisk-backend/`が存在** → Node.js Backend
2. **`main.py`がルートにある** → Python Backend
3. **`app/`と`components/`が並んでいる** → Next.js Frontend

### 開発時の注意点

- 各層は独立して起動・停止可能
- 環境変数（`.env`）は各層で個別に設定
- WebSocket接続が切れると機能が制限される
- マルチテナント対応のため、全APIリクエストに`tenant_id`が必要
