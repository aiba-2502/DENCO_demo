# 着信通知テスト - 実行手順

## 現在の状態（2025-10-09 08:20:55時点）

✅ **修正完了項目**:
1. ari-client.js: `await client.start()` 追加 → Stasisアプリ登録が正常完了
2. call-handler.js: 通知送信を最優先に変更 → Pythonバックエンドなしでも動作

✅ **サーバー状態**:
- Node.jsサーバー: 起動中（port 3001）
- ARI WebSocket: 接続成功
- Stasisアプリケーション: 起動完了（denco_voiceai）
- ブラウザWebSocket: 待機中

⚠️ **重要**: 修正後のコードでまだテストを実施していません！

---

## テスト手順

### ステップ1: ブラウザでWebSocket接続

1. ブラウザで以下のURLを開く:
   ```
   file://wsl.localhost/Ubuntu/home/user/DENCO_demo/asterisk-backend/websocket-test.html
   ```

2. 「接続」ボタンをクリック

3. ステータスが「✅ 接続中」になることを確認

### ステップ2: Asterisk CLIでテスト通話を発信

Asterisk サーバー（192.168.1.140）で以下のコマンドを実行:

```bash
asterisk -rvvv
```

Asterisk CLI プロンプトで:
```
channel originate Local/s@incoming-ari application Echo
```

### ステップ3: 期待される動作

#### **ブラウザ画面** (websocket-test.html)
```
[HH:MM:SS] 📞 着信！
発信者: Unknown
着信番号: s
通話ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### **Node.jsサーバーログ**
```
[INFO] Stasis開始 {"channelId":"..."}
[INFO] 着信処理開始 {"channelId":"...","callerNumber":"Unknown","calledNumber":"s"}
[INFO] 着信通知送信完了 {"callId":"...","channelId":"..."}  ← NEW!
[INFO] フロントエンドブロードキャスト {"type":"call_started","recipients":1,"totalConnections":1}  ← NEW!
[WARN] Pythonバックエンド連携スキップ（起動していない可能性） ← これは正常
[INFO] 着信処理完了 {"callId":"...","channelId":"..."}
```

#### **Asterisk CLI**
以下のエラーが**出ないこと**:
```
WARNING: Stasis app 'denco_voiceai' doesn't exist  ← これが出たら失敗
```

---

## トラブルシューティング

### 問題1: ブラウザに通知が表示されない

**確認事項**:
1. Node.jsサーバーログに「着信通知送信完了」が表示されているか？
2. 「フロントエンドブロードキャスト」で recipients が 1 になっているか？
3. ブラウザの「接続」ボタンを押した状態か？

### 問題2: Stasis app doesn't exist エラー

**原因**: Stasisアプリ登録が失敗している
**対処**:
```bash
# サーバー再起動
cd /home/user/DENCO_demo/asterisk-backend
npm run dev
```

### 問題3: すぐに通話が切断される

**確認事項**:
- Node.jsサーバーログに「着信処理完了」が表示されているか？
- エラーログが表示されていないか？

---

## 成功の判定基準

✅ **成功**:
- ブラウザに「📞 着信！」通知が表示される
- Node.jsログに「着信通知送信完了」と「フロントエンドブロードキャスト」が表示される
- Pythonバックエンド連携エラーは「WARN」レベルで表示されるが、処理は継続する

❌ **失敗**:
- ブラウザに何も表示されない
- Node.jsログに「着信通知送信完了」が表示されない
- Asterisk CLIに「Stasis app doesn't exist」エラーが表示される

---

## 次のステップ

テストが成功したら:
1. 実際の電話機からの着信テストに進む
2. Python バックエンドとの連携を設定
3. 音声ストリーミング機能の実装

テストが失敗したら:
1. サーバーログをすべて確認
2. Asterisk CLI のエラーメッセージを確認
3. ブラウザのコンソールログを確認
