import os
import sys
import subprocess
import platform
from pathlib import Path
import time
import psycopg2
from dotenv import load_dotenv

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
        if platform.system() == 'Windows':
            env['PYTHONIOENCODING'] = 'utf-8'
        
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
        return False, e.stderr.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

def wait_for_postgres(max_attempts=30):
    """PostgreSQLサーバーが起動するのを待つ"""
    attempt = 0
    
    # 環境変数から接続情報を取得
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    
    while attempt < max_attempts:
        try:
            psycopg2.connect(
                dbname="postgres",
                user=db_user,
                password=db_password,
                host=db_host,
                client_encoding='utf8'
            )
            return True
        except psycopg2.OperationalError:
            attempt += 1
            time.sleep(1)
    return False

def terminate_connections():
    """データベースへの接続を強制終了"""
    try:
        # postgresデータベースに接続
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='utf8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        db_name = os.getenv("POSTGRES_DB", "voiceai")
        
        # アクティブな接続を終了
        cur.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{db_name}'
            AND pid <> pg_backend_pid();
        """)
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"接続の終了中にエラーが発生: {e}")
        return False

def drop_database():
    """データベースとロールを削除"""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_HOST", "localhost"),
            client_encoding='utf8'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        db_name = os.getenv("POSTGRES_DB", "voiceai")
        db_user = os.getenv("POSTGRES_USER", "voiceai")
        
        # データベースとユーザーを削除
        cur.execute(f"DROP DATABASE IF EXISTS {db_name}")
        cur.execute(f"DROP USER IF EXISTS {db_user}")
        
        # authenticatedロールを削除
        cur.execute("DROP ROLE IF EXISTS authenticated")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"データベースの削除中にエラーが発生: {e}")
        return False

def main():
    print("データベースの初期化を開始します...")
    
    # PostgreSQLサーバーの起動を待つ
    print("PostgreSQLサーバーの起動を確認中...")
    if not wait_for_postgres():
        print("PostgreSQLサーバーに接続できません。サーバーが起動していることを確認してください。")
        return
    
    # アクティブな接続を終了
    print("アクティブな接続を終了中...")
    if not terminate_connections():
        print("接続の終了中にエラーが発生しました。")
        return
    
    # データベースとユーザーを削除
    print("データベースとユーザーを削除中...")
    if not drop_database():
        print("データベースの削除中にエラーが発生しました。")
        return
    
    print("\nデータベースの初期化が完了しました!")
    print("setup_db.pyを実行して、データベースを再作成してください。")

if __name__ == "__main__":
    main()