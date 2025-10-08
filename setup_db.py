import os
import sys
import subprocess
import platform
from pathlib import Path
import time
import glob
from dotenv import load_dotenv
import psycopg2

# .envファイルを読み込む
load_dotenv()

def run_command(command, shell=True):
    """コマンドを実行し、結果を返す"""
    try:
        # Windows環境での文字化けを防ぐため、UTF-8を使用
        startupinfo = None
        if platform.system() == 'Windows':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['PGCLIENTENCODING'] = 'UTF8'
        
        result = subprocess.run(
            command,
            shell=shell,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8',
            errors='replace',
            env=env,
            startupinfo=startupinfo
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def wait_for_postgres(max_attempts=30):
    """PostgreSQLサーバーが起動するのを待つ"""
    attempt = 0
    
    while attempt < max_attempts:
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user="postgres",
                password=os.getenv("POSTGRES_PASSWORD", "postgres"),
                host=os.getenv("POSTGRES_HOST", "localhost"),
                client_encoding='UTF8'
            )
            conn.close()
            return True
        except psycopg2.OperationalError:
            attempt += 1
            time.sleep(1)
    return False

def check_database_exists():
    """データベースが存在するかチェック"""
    db_name = os.getenv("POSTGRES_DB", "voiceai")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='UTF8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        return exists
    except Exception as e:
        print(f"データベース存在チェック中にエラーが発生: {e}")
        return False

def setup_database():
    """データベースとユーザーを設定"""
    # 環境変数から接続情報を取得
    db_name = os.getenv("POSTGRES_DB", "voiceai")
    db_user = os.getenv("POSTGRES_USER", "voiceai")
    db_password = os.getenv("POSTGRES_PASSWORD", "voiceai")
    
    # データベースが存在するかチェック
    if check_database_exists():
        print(f"データベース {db_name} はすでに存在します。スキップします。")
        return True
    
    try:
        # postgresデータベースに接続してデータベースとユーザーを作成
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='UTF8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # データベースとユーザーを作成
        cur.execute(f"CREATE DATABASE {db_name} ENCODING 'UTF8' TEMPLATE template0")
        cur.execute(f"CREATE USER {db_user} WITH PASSWORD %s", (db_password,))
        cur.execute(f"ALTER USER {db_user} WITH SUPERUSER")
        cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user}")
        
        cur.close()
        conn.close()
        
        # 新しいデータベースに接続して拡張機能とスキーマ権限を設定
        conn = psycopg2.connect(
            dbname=db_name,
            user="postgres",
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='UTF8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # 拡張機能とスキーマ権限を設定
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        cur.execute(f"GRANT ALL ON SCHEMA public TO {db_user}")
        cur.execute("CREATE ROLE authenticated NOLOGIN")
        cur.execute(f"GRANT authenticated TO {db_user}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"データベースのセットアップ中にエラーが発生: {e}")
        return False

def create_env_file():
    """環境変数ファイルを作成（既存の値があれば使用）"""
    env_content = f"""POSTGRES_USER={os.getenv("POSTGRES_USER", "voiceai")}
POSTGRES_PASSWORD={os.getenv("POSTGRES_PASSWORD", "voiceai")}
POSTGRES_DB={os.getenv("POSTGRES_DB", "voiceai")}
POSTGRES_HOST={os.getenv("POSTGRES_HOST", "localhost")}"""
    
    with open('.env', 'w', encoding='utf-8') as f:
        f.write(env_content)

def run_migrations():
    """すべてのマイグレーションファイルを実行"""
    migrations_dir = Path("supabase/migrations")
    if not migrations_dir.exists():
        print("マイグレーションディレクトリが見つかりません。")
        return False

    # マイグレーションファイルを名前順にソート
    migration_files = sorted(migrations_dir.glob("*.sql"))
    
    if not migration_files:
        print("マイグレーションファイルが見つかりません。")
        return False

    try:
        # データベースに接続
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB", "voiceai"),
            user=os.getenv("POSTGRES_USER", "voiceai"),
            password=os.getenv("POSTGRES_PASSWORD", "voiceai"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='UTF8'
        )
        conn.autocommit = True
        cur = conn.cursor()

        for migration_file in migration_files:
            print(f"マイグレーションを実行中: {migration_file.name}")
            
            # マイグレーションファイルを読み込んで実行
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql = f.read()
                
            try:
                cur.execute(sql)
                print(f"マイグレーション {migration_file.name} が完了しました。")
            except psycopg2.Error as e:
                print(f"マイグレーション {migration_file.name} の実行中にエラーが発生しました:")
                print(str(e))
                return False
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"マイグレーションの実行中にエラーが発生: {e}")
        return False

def main():
    print("データベースセットアップを開始します...")
    
    # PostgreSQLサーバーの起動を待つ
    print("PostgreSQLサーバーの起動を確認中...")
    if not wait_for_postgres():
        print("PostgreSQLサーバーに接続できません。サーバーが起動していることを確認してください。")
        return
    
    # データベースとユーザーの設定
    print("データベースとユーザーを設定中...")
    if not setup_database():
        print("データベースの設定中にエラーが発生しました。")
        return
    
    # 環境変数ファイルの作成
    print(".envファイルを作成中...")
    create_env_file()
    
    # マイグレーションの実行
    print("データベースマイグレーションを実行中...")
    if not run_migrations():
        print("マイグレーションの実行中にエラーが発生しました。")
        return
    
    print("\nデータベースのセットアップが完了しました!")
    print("以下の認証情報でデータベースに接続できます:")
    print(f"  データベース名: {os.getenv('POSTGRES_DB', 'voiceai')}")
    print(f"  ユーザー名: {os.getenv('POSTGRES_USER', 'voiceai')}")
    print(f"  パスワード: {os.getenv('POSTGRES_PASSWORD', 'voiceai')}")
    print(f"  ホスト: {os.getenv('POSTGRES_HOST', 'localhost')}")

if __name__ == "__main__":
    main()