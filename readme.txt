# リアルタイム音声AI通話ボットシステム セットアップ手順

## 前提条件

- Windows 11
- PostgreSQL 15以上
- Rust (Cargo)
- 各種APIキー
  - Azure Speech Services
  - Dify API
  - Vonage API

## 1. Python環境のセットアップ

1. Python 3.10、3.11、または3.12をインストール:
   - Python公式サイト(https://www.python.org/downloads/)にアクセス
   - "Download Python 3.x.x"をクリック（3.10、3.11、3.12のいずれか）
   - インストーラーをダウンロードして実行
   - インストール時に"Add Python to PATH"にチェックを入れる
   - "Install Now"をクリック

2. インストールの確認:
```powershell
python --version
```

## 2. Rustのセットアップ

1. Rustupをインストール:
   - https://rustup.rs/ にアクセス
   - インストーラーをダウンロード
   - インストーラーを実行
   - デフォルトのオプションを選択

2. インストール後、新しいPowerShellウィンドウを開いて確認:
```powershell
rustc --version
cargo --version
```

## 3. Node.jsのセットアップ

1. Node.js 18以上をインストール:
   - Node.js公式サイト(https://nodejs.org/)にアクセス
   - LTS版をダウンロード
   - インストーラーを実行

2. インストールの確認:
```powershell
node --version
npm --version
```

## 4. データベースのセットアップ

1. PostgreSQLをインストール:
   - PostgreSQL公式サイト(https://www.postgresql.org/download/windows/)にアクセス
   - インストーラーをダウンロードして実行
   - インストール時にパスワードを設定（メモしておく）
   - デフォルトのポート(5432)を使用

2. PostgreSQLデータベースを作成:
```bash
psql -U postgres
CREATE DATABASE voiceai;
CREATE USER voiceai WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE voiceai TO voiceai;
```

## 5. バックエンドのセットアップ

1. プロジェクトのクローン後、バックエンドディレクトリに移動

2. PowerShellを管理者として実行:
   - Windowsメニューで「PowerShell」を右クリック
   - 「管理者として実行」を選択

3. スクリプト実行ポリシーを変更:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope Process
```

4. Python仮想環境を作成してアクティベート:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

5. 依存関係のインストール:
```powershell
pip install -r requirements.txt
```

6. 環境変数の設定:
.env.exampleをコピーして.envを作成し、必要な情報を設定:
```
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=your_password
POSTGRES_DB=voiceai
POSTGRES_HOST=localhost
```

7. データベースマイグレーションの実行:
```bash
psql -U voiceai -d voiceai -f supabase/migrations/20250429075316_scarlet_spire.sql
```

8. バックエンドサーバーの起動:
```powershell
uvicorn main:app --reload
```

## 6. フロントエンドのセットアップ

1. フロントエンドディレクトリで依存関係をインストール:
```bash
npm install
```

2. 環境変数の設定:
.env.localファイルを作成し、必要な情報を設定:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 開発サーバーの起動:
```bash
npm run dev
```

## 7. 初期設定

1. 管理画面(http://localhost:3000)にアクセス

2. テナント管理画面で新規テナントを作成:
   - テナント名
   - Azure Speech ServicesのAPIキーとリージョン
   - Dify APIキーとエンドポイント
   - Vonage APIキー

3. ユーザー管理画面でユーザーを登録:
   - ユーザー名
   - 電話番号
   - メールアドレス
   - 所属テナント

## 8. 動作確認

1. すべてのサービスが起動していることを確認:
   - PostgreSQLサーバー
   - バックエンドサーバー (uvicorn)
   - フロントエンドサーバー (Next.js)

2. 管理画面の通話モニターにアクセスし、通話状況を確認

## トラブルシューティング

1. Pythonのインストール関連
   - "python not found"エラーが出る場合:
     - Windowsの環境変数でPythonのパスが正しく設定されているか確認
     - コントロールパネル > システム > システムの詳細設定 > 環境変数
     - PATHに以下が含まれているか確認:
       - C:\Users\[ユーザー名]\AppData\Local\Programs\Python\Python3x\
       - C:\Users\[ユーザー名]\AppData\Local\Programs\Python\Python3x\Scripts\
   - Python 3.13など開発版は使用しない:
     - 多くのライブラリが対応していないため、安定版（3.10、3.11、3.12）を使用

2. Rust/Cargoのインストール関連
   - "Cargo not found"エラーが出る場合:
     - Rustupが正しくインストールされているか確認
     - 新しいPowerShellウィンドウを開いて再試行
     - Windowsの環境変数でCargoのパスが設定されているか確認:
       - %USERPROFILE%\.cargo\bin がPATHに含まれているか確認

3. PowerShell実行ポリシーエラー
   - 管理者としてPowerShellを実行していることを確認
   - Set-ExecutionPolicyコマンドが正しく実行されているか確認

4. 仮想環境の作成エラー
   - Python本体が正しくインストールされているか確認
   - 管理者権限でPowerShellを実行しているか確認
   - プロジェクトディレクトリに書き込み権限があるか確認

5. データベース接続エラー
   - PostgreSQLサービスが起動していることを確認
   - .envの接続情報が正しいか確認

6. 音声認識/合成エラー
   - Azure Speech ServicesのAPIキーとリージョンを確認
   - ネットワーク接続を確認

7. Dify APIエラー
   - APIキーとエンドポイントの設定を確認
   - Difyサーバーの稼働状態を確認

8. WebSocket接続エラー
   - ブラウザのコンソールでエラーメッセージを確認
   - バックエンドサーバーの起動状態を確認