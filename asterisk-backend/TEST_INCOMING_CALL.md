# 着信テスト手順

## 現在の状態
- ✅ Node.jsサーバー起動中 (port 3001)
- ✅ ARI WebSocket接続成功
- ✅ Stasisアプリケーション起動: myapp
- ✅ ブラウザWebSocket接続済み

## テスト方法

### 方法1: Asterisk CLIから直接テスト
Asterisk側で以下のコマンドを実行してください:

```
channel originate Local/s@incoming-ari application Echo
```

### 期待される動作

**Node.jsサーバー側**:
```
[INFO] Stasis開始 {"channelId":"xxxxx","channelName":"Local/s@incoming-ari-xxxxx","caller":"Unknown"}
[INFO] 着信処理開始 {"channelId":"xxxxx","callerNumber":"Unknown","calledNumber":"s"}
[INFO] 着信処理完了 {"callId":"xxxxx","channelId":"xxxxx"}
```

**ブラウザ (websocket-test.html) 側**:
```
[timestamp] 📞 着信！
発信者: Unknown
着信番号: s
通話ID: xxxxx
```

**Asterisk CLI側**:
- ⚠️ 以前のエラー (Stasis app 'myapp' doesn't exist) が**出ないこと**
- ✅ StasisStart イベントが正常に処理されること

## トラブルシューティング

もし Asterisk CLI で以下のエラーが出る場合:
```
WARNING: Stasis app 'myapp' doesn't exist
```

これは WebSocket 接続が Asterisk に正しく登録されていないことを意味します。

### 確認事項:
1. Node.jsサーバーログで "ARI WebSocket接続成功" が "Stasisアプリケーション起動" **より前**に表示されているか
2. Asterisk と Node.js 間のネットワーク接続が正常か
3. ari-client ライブラリが正しく WebSocket URL を構築しているか

## 次のステップ

このテストが成功したら、実際の電話機からの着信テストに進みます。
