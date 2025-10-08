# DENCOシステム - ディレクトリ構造リファクタリング計画

## 目的

現在のモノレポ構成を維持しながら、ディレクトリ構造を明確化し、各アプリケーションの境界を明示的にする。

## 現状の課題

- Python Backendファイルがルートディレクトリに散在
- `asterisk-backend/` と `app/` + `components/` で命名規則が不統一
- どのファイルがどのアプリに属するか分かりにくい
- IDEで各アプリを個別プロジェクトとして開きづらい

## 目標構造

```
DENCO_demo/
├── denco-asterisk-backend/     # 🟢 Node.js Backend
├── denco-python-backend/       # 🐍 Python Backend
├── denco-frontend/             # ⚛️ Next.js Frontend
├── denco-shared/               # 📦 共有資産
└── README.md                   # プロジェクト全体のREADME
```

## 詳細設計

### 1. denco-asterisk-backend/

```
denco-asterisk-backend/
├── src/
│   ├── server.js
│   ├── ari-client.js
│   ├── call-handler.js
│   ├── websocket-manager.js
│   ├── config.js
│   └── logger.js
├── package.json
├── package-lock.json
├── .env.template
├── .gitignore
└── README.md
```

**変更点:**
- `asterisk-backend/` → `denco-asterisk-backend/` にリネーム
- ソースコードを `src/` サブディレクトリに整理（オプション）
- 各アプリ専用の README.md を追加

### 2. denco-python-backend/

```
denco-python-backend/
├── src/                        # ソースコード
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── database_extensions.py
│   ├── models.py
│   ├── auth.py
│   ├── vad.py
│   ├── dify_client.py
│   └── api/
│       ├── __init__.py
│       ├── customers.py
│       ├── knowledge.py
│       ├── campaigns.py
│       ├── settings.py
│       ├── tags.py
│       └── tenants.py
├── migrations/                 # データベーススキーマ
│   ├── 20250429091156_ancient_snow.sql
│   ├── add_missing_tables.sql
│   └── add_frontend_features.sql
├── tests/                      # テスト（将来追加）
├── requirements.txt
├── .env.template
├── .gitignore
└── README.md
```

**変更点:**
- ルート散在のPythonファイルを `denco-python-backend/src/` に移動
- `migrations/` を Python Backend配下に移動（DBはPythonが管理）
- `api/` を `src/api/` に移動

**重要:** Python import文の変更が必要
```python
# 変更前
from database import Database
from models import CallSession

# 変更後（オプション1: src/をPYTHONPATHに追加）
from database import Database
from models import CallSession

# 変更後（オプション2: パッケージとして扱う）
from src.database import Database
from src.models import CallSession
```

### 3. denco-frontend/

```
denco-frontend/
├── app/                        # Next.js App Router
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── calls/
│   ├── fax/
│   ├── knowledge/
│   ├── users/
│   ├── settings/
│   └── notifications/
├── components/                 # Reactコンポーネント
│   ├── ui/
│   ├── calls/
│   ├── dashboard/
│   ├── fax/
│   ├── knowledge/
│   ├── users/
│   ├── settings/
│   ├── notifications/
│   ├── tenants/
│   └── layout/
├── lib/                        # ユーティリティ
│   └── utils.ts
├── public/                     # 静的ファイル
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .eslintrc.json
├── .env.local.template
├── .gitignore
└── README.md
```

**変更点:**
- `app/`、`components/`、`lib/` を `denco-frontend/` 配下に移動
- TypeScript/Next.js設定ファイルも移動
- パスエイリアス `@/*` の設定を調整

**tsconfig.json 変更:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]  // denco-frontend/をルートとする
    }
  }
}
```

### 4. denco-shared/

```
denco-shared/
├── docs/                       # 統合ドキュメント
│   ├── README.md              # 全体概要（現在のREADME.md）
│   ├── ARCHITECTURE_LAYERS.md
│   ├── MONOREPO_VS_POLYREPO.md
│   ├── CLAUDE.md
│   ├── SETUP_SUMMARY.md
│   ├── QUICKSTART_WINDOWS.md
│   ├── ASTERISK_SETUP.md
│   ├── INTEGRATION_GUIDE.md
│   ├── PYTHON_BACKEND_API.md
│   ├── SYSTEM_SUMMARY.md
│   └── WINDOWS_DEPLOYMENT.md
├── scripts/                    # 統合スクリプト
│   ├── start-all-services.ps1
│   ├── stop-all-services.ps1
│   ├── initialize-database.ps1
│   ├── check-database.ps1
│   └── reset-database.ps1
├── templates/                  # 環境変数テンプレート
│   ├── asterisk-backend.env.template
│   ├── python-backend.env.template
│   └── frontend.env.local.template
├── docker/                     # Docker設定（将来追加）
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
└── README.md                   # denco-sharedの説明
```

**変更点:**
- 全ドキュメントを `docs/` に集約
- PowerShellスクリプトを `scripts/` に集約
- 環境変数テンプレートを `templates/` に集約

### 5. ルートディレクトリ

```
DENCO_demo/
├── denco-asterisk-backend/
├── denco-python-backend/
├── denco-frontend/
├── denco-shared/
├── README.md                   # プロジェクト全体の概要
├── .gitignore                  # ルートのgitignore
└── LICENSE                     # ライセンス（存在する場合）
```

**ルート README.md:**
```markdown
# DENCO リアルタイム音声AI通話・FAXシステム

統合ドキュメントは [denco-shared/docs/](./denco-shared/docs/) を参照してください。

## クイックスタート

1. データベース初期化
   ```bash
   ./denco-shared/scripts/initialize-database.ps1
   ```

2. 全サービス起動
   ```bash
   ./denco-shared/scripts/start-all-services.ps1
   ```

## 構成

- [denco-asterisk-backend/](./denco-asterisk-backend/) - Node.js Asterisk統合層
- [denco-python-backend/](./denco-python-backend/) - Python AI処理層
- [denco-frontend/](./denco-frontend/) - Next.js UI層
- [denco-shared/](./denco-shared/) - 共有資産・ドキュメント
```

## 移行手順

### フェーズ1: 準備（作業前）

1. **Gitブランチ作成**
   ```bash
   git checkout -b refactor/directory-structure
   ```

2. **バックアップ作成**
   ```bash
   # 現在の状態を別ブランチに保存
   git branch backup/before-refactor
   ```

3. **テスト実行**
   ```bash
   # 移行前の動作確認
   ./start-all-services.ps1
   # すべてのサービスが正常起動することを確認
   ```

### フェーズ2: ディレクトリ移動

#### ステップ1: Node.js Backend

```bash
# asterisk-backend/ → denco-asterisk-backend/
git mv asterisk-backend denco-asterisk-backend

# README.md作成
# package.json の scripts を必要に応じて更新
```

#### ステップ2: Python Backend

```bash
# ディレクトリ作成
mkdir denco-python-backend
mkdir denco-python-backend/src

# Pythonファイル移動
git mv main.py denco-python-backend/src/
git mv database.py denco-python-backend/src/
git mv database_extensions.py denco-python-backend/src/
git mv models.py denco-python-backend/src/
git mv auth.py denco-python-backend/src/
git mv vad.py denco-python-backend/src/
git mv dify_client.py denco-python-backend/src/
git mv setup_db.py denco-python-backend/src/
git mv reset_db.py denco-python-backend/src/

# api/ ディレクトリ移動
git mv api denco-python-backend/src/

# migrations/ 移動
git mv migrations denco-python-backend/

# supabase/migrations/ も移動（存在する場合）
git mv supabase/migrations/* denco-python-backend/migrations/

# requirements.txt 移動
git mv requirements.txt denco-python-backend/

# .env.template 作成
cp .env denco-python-backend/.env.template
# 実際の値を削除してテンプレート化
```

#### ステップ3: Frontend

```bash
# ディレクトリ作成
mkdir denco-frontend

# Next.js関連ディレクトリ移動
git mv app denco-frontend/
git mv components denco-frontend/
git mv lib denco-frontend/
git mv public denco-frontend/

# 設定ファイル移動
git mv package.json denco-frontend/
git mv package-lock.json denco-frontend/
git mv tsconfig.json denco-frontend/
git mv next.config.js denco-frontend/
git mv tailwind.config.ts denco-frontend/
git mv postcss.config.js denco-frontend/
git mv .eslintrc.json denco-frontend/

# 環境変数テンプレート作成
cp .env.local denco-frontend/.env.local.template
```

#### ステップ4: Shared

```bash
# ディレクトリ作成
mkdir -p denco-shared/{docs,scripts,templates,docker}

# ドキュメント移動
git mv README.md denco-shared/docs/
git mv ARCHITECTURE_LAYERS.md denco-shared/docs/
git mv MONOREPO_VS_POLYREPO.md denco-shared/docs/
git mv CLAUDE.md denco-shared/docs/
git mv SETUP_SUMMARY.md denco-shared/docs/
git mv QUICKSTART_WINDOWS.md denco-shared/docs/
git mv ASTERISK_SETUP.md denco-shared/docs/
git mv INTEGRATION_GUIDE.md denco-shared/docs/
git mv PYTHON_BACKEND_API.md denco-shared/docs/
git mv SYSTEM_SUMMARY.md denco-shared/docs/
git mv WINDOWS_DEPLOYMENT.md denco-shared/docs/
# 他のドキュメントも同様に

# スクリプト移動
git mv start-all-services.ps1 denco-shared/scripts/
git mv stop-all-services.ps1 denco-shared/scripts/
git mv initialize-database.ps1 denco-shared/scripts/
git mv check-database.ps1 denco-shared/scripts/
git mv reset-database.ps1 denco-shared/scripts/

# 環境変数テンプレート作成
cp denco-asterisk-backend/.env.template denco-shared/templates/asterisk-backend.env.template
cp denco-python-backend/.env.template denco-shared/templates/python-backend.env.template
cp denco-frontend/.env.local.template denco-shared/templates/frontend.env.local.template

# denco-shared/README.md 作成
```

#### ステップ5: ルートREADME作成

```bash
# 新しいルートREADME.md作成（シンプルなエントリーポイント）
cat > README.md << 'EOF'
# DENCO リアルタイム音声AI通話・FAXシステム

詳細なドキュメントは [denco-shared/docs/](./denco-shared/docs/) を参照してください。

## クイックスタート

\`\`\`bash
./denco-shared/scripts/initialize-database.ps1
./denco-shared/scripts/start-all-services.ps1
\`\`\`

## 構成

- [denco-asterisk-backend/](./denco-asterisk-backend/) - Node.js Backend
- [denco-python-backend/](./denco-python-backend/) - Python Backend
- [denco-frontend/](./denco-frontend/) - Next.js Frontend
- [denco-shared/](./denco-shared/) - 共有資産
EOF
```

### フェーズ3: コード修正

#### 1. Python Backend - Import文修正

**オプションA: PYTHONPATHを使用（推奨）**

`denco-python-backend/` をPYTHONPATHに追加し、import文は変更不要。

起動スクリプト修正:
```bash
# 変更前
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 変更後
cd denco-python-backend
PYTHONPATH=src uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

**オプションB: 相対importに変更**

```python
# src/main.py
# 変更前
from database import Database
from models import CallSession
from api import customers, tags

# 変更後
from .database import Database
from .models import CallSession
from .api import customers, tags
```

#### 2. Node.js Backend - パス修正

`denco-asterisk-backend/` 内のrequire文は変更不要（相対パス）。

環境変数の修正:
```javascript
// config.js
// PYTHON_BACKEND_URLは環境変数のままでOK
```

#### 3. Frontend - パスエイリアス修正

`denco-frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]  // denco-frontend/ がルート
    }
  }
}
```

import文は変更不要:
```typescript
import { Button } from "@/components/ui/button"  // OK
```

#### 4. スクリプト修正

**start-all-services.ps1:**
```powershell
# 変更前
cd asterisk-backend
npm run dev

# 変更後
cd denco-asterisk-backend
npm run dev
```

**initialize-database.ps1:**
```powershell
# migrations/のパス変更
$migrationFiles = @(
    "denco-python-backend/migrations/20250429091156_ancient_snow.sql",
    "denco-python-backend/migrations/add_missing_tables.sql",
    "denco-python-backend/migrations/add_frontend_features.sql"
)
```

### フェーズ4: 各アプリのREADME作成

#### denco-asterisk-backend/README.md

```markdown
# DENCO Asterisk Backend

Node.js Asterisk統合層 - ARI経由でAsterisk PBXを制御

## 起動

\`\`\`bash
npm install
npm run dev
\`\`\`

## 環境変数

\`.env.template\` を \`.env\` にコピーして設定してください。
```

#### denco-python-backend/README.md

```markdown
# DENCO Python Backend

Python AI処理層 - Azure Speech、Dify AI、PostgreSQL

## 起動

\`\`\`bash
pip install -r requirements.txt
PYTHONPATH=src uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

## 環境変数

\`.env.template\` を \`.env\` にコピーして設定してください。
```

#### denco-frontend/README.md

```markdown
# DENCO Frontend

Next.js UI層 - React、TypeScript、Tailwind CSS

## 起動

\`\`\`bash
npm install
npm run dev
\`\`\`

## 環境変数

\`.env.local.template\` を \`.env.local\` にコピーして設定してください。
```

#### denco-shared/README.md

```markdown
# DENCO Shared

共有資産・ドキュメント・スクリプト

## 構成

- \`docs/\` - 統合ドキュメント
- \`scripts/\` - 統合起動・セットアップスクリプト
- \`templates/\` - 環境変数テンプレート
- \`docker/\` - Docker設定（将来追加）
```

### フェーズ5: テストと検証

```bash
# 1. データベース初期化
./denco-shared/scripts/initialize-database.ps1

# 2. 各サービス個別起動テスト
cd denco-python-backend
PYTHONPATH=src uvicorn src.main:app --reload  # 起動確認
# Ctrl+C で停止

cd ../denco-asterisk-backend
npm run dev  # 起動確認
# Ctrl+C で停止

cd ../denco-frontend
npm run dev  # 起動確認
# Ctrl+C で停止

# 3. 統合起動テスト
cd ..
./denco-shared/scripts/start-all-services.ps1

# 4. 動作確認
curl http://localhost:8000/health
curl http://localhost:3001/health
curl http://localhost:3000
```

### フェーズ6: コミット

```bash
# ステージング
git add -A

# コミット
git commit -m "refactor: ディレクトリ構造をdenco-*形式に再編成

- asterisk-backend → denco-asterisk-backend
- Python関連ファイル → denco-python-backend/src
- app/components → denco-frontend
- docs/scripts → denco-shared

各アプリの境界を明確化し、モノレポツール導入準備を完了"

# プッシュ
git push origin refactor/directory-structure
```

## 移行後の利点

### 1. **明確な境界**
- 各アプリが独立したディレクトリ
- どのファイルがどこに属するか一目瞭然

### 2. **IDE最適化**
```
VSCode Workspaceの例:
{
  "folders": [
    { "path": "denco-asterisk-backend", "name": "Node.js Backend" },
    { "path": "denco-python-backend", "name": "Python Backend" },
    { "path": "denco-frontend", "name": "Frontend" }
  ]
}
```

### 3. **モノレポツール導入準備**

**Turborepo導入例:**
```json
// turbo.json (ルート)
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

**pnpm Workspaces導入例:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'denco-asterisk-backend'
  - 'denco-frontend'
```

### 4. **将来的なポリレポ移行**

各ディレクトリを独立リポジトリに分割する際、git filter-branchで簡単に分離可能:

```bash
# denco-asterisk-backendを独立リポジトリに
git filter-branch --subdirectory-filter denco-asterisk-backend -- --all
```

## 移行時の注意点

### 1. **Git履歴の保持**

`git mv` を使用すれば履歴は保持されます。

### 2. **一括移行の推奨**

段階的移行は複雑化するため、1つのPRで一括実施を推奨。

### 3. **チーム通知**

大規模な構造変更のため、チーム全体に事前通知が必要。

### 4. **バックアップ**

```bash
git branch backup/before-refactor
```

### 5. **CI/CD更新**

CI/CDパイプラインがある場合、パス更新が必要。

## まとめ

この リファクタリングにより:

- ✅ モノレポの利点を維持
- ✅ ポリレポの明確さを獲得
- ✅ モノレポツール導入準備完了
- ✅ IDE最適化
- ✅ 将来的な選択肢を保持

**推奨**: このリファクタリングを実施することを強く推奨します。
