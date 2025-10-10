# 現在のステータス（2025-10-09 18:48時点）

## ✅ 確認済み動作状況

### Node.jsサーバー
- **起動時刻**: 2025-10-09 08:20:55
- **Stasisアプリ名**: `denco_voiceai`
- **ARI WebSocket**: ✅ 接続中
- **ステータス**: ✅ 正常動作中

### テストコマンド結果
- **最終成功**: 2025-10-09 08:25:39
- **コマンド**: `channel originate Local/s@incoming-ari application Echo`
- **結果**: ✅ ブラウザ通知表示成功

```
[2025-10-09T08:25:39.537Z] [INFO] Stasis開始 {"channelId":"1759998339.1"}
[2025-10-09T08:25:39.538Z] [INFO] フロントエンドブロードキャスト {"type":"call_started","recipients":1}
[2025-10-09T08:25:39.538Z] [INFO] 着信通知送信完了
```

### ブラウザWebSocket
- **最新接続**: 2025-10-09 09:48:11
- **接続状態**: ✅ 4つのフロントエンド接続アクティブ

## ❌ 問題点

### 外部電話からの着信
- **症状**: ブラウザ通知が表示されない
- **Asterisk CLI**: Stasis(denco_voiceai)が実行されている（ユーザー提供のログより）
- **Node.jsログ**: 08:25:39以降、Stasis開始イベントが記録されていない

## 🔍 調査が必要な点

### 1. Asteriskダイヤルプランの現在の状態
現在Asteriskサーバー（192.168.1.140）で以下のどのコンテキストが実際に使用されているか：

```bash
asterisk -rx "dialplan show incoming-ari"
```

確認事項：
- `Stasis(denco_voiceai)` または `Stasis(myapp)` のどちらが設定されているか？
- 外部着信時にこのコンテキストが実行されているか？

### 2. 外部着信の実際のルーティング
ユーザーが提供したAsterisk CLIログ（タイムスタンプなし）：
```
Executing [55303521@from-pstn:1] NoOp("PJSIP/Rakuten-1-00000001", "=== External call routing to ARI ===")
Executing [s@incoming-ari:3] Stasis("PJSIP/Rakuten-1-00000001", "denco_voiceai,08018556903,s")
```

**重要な確認**: このログは**いつ**記録されたものか？
- 08:25:39以降のものか？
- それ以前のものか？

### 3. タイムギャップの原因
- サーバー起動: 08:20:55
- テスト成功: 08:25:39
- 最終ログ: 09:48:11（フロントエンド接続のみ）
- **Stasis開始イベント**: 08:25:39以降、一度も記録されていない

## 📋 次に実行すべきテスト

### テスト1: 現在の設定確認（Asteriskサーバー側）
```bash
ssh user@192.168.1.140
asterisk -rx "dialplan show incoming-ari"
asterisk -rx "dialplan show from-pstn-custom"
```

### テスト2: リアルタイム監視しながら外部着信
```bash
# ターミナル1（Asteriskサーバー）
asterisk -rvvvvv

# ターミナル2（開発マシン）
tail -f /home/user/DENCO_demo/asterisk-backend/server.log

# 外部電話から着信
# → Asterisk CLIとNode.jsログの両方を同時に確認
```

### テスト3: テストコマンド再実行
```bash
# Asteriskサーバーで
asterisk -rx "channel originate Local/s@incoming-ari application Echo"
```

期待される結果：
- Node.jsログに「Stasis開始」が表示される
- ブラウザに通知が表示される

### テスト4: ARI接続の確認
```bash
# 開発マシンで
cd /home/user/DENCO_demo/asterisk-backend
node test-ari-events.js
```

## 🎯 推測される問題

### 仮説1: Asteriskダイヤルプラン設定が古い
- `/etc/asterisk/extensions_custom.conf` に `Stasis(myapp)` と記載されている
- Node.jsは `denco_voiceai` を待っている
- → アプリ名の不一致でイベントが届かない

**検証方法**:
```bash
ssh user@192.168.1.140
sudo cat /etc/asterisk/extensions_custom.conf | grep Stasis
```

### 仮説2: 外部着信が別のルートを通っている
- FreePBXの設定変更後、ダイヤルプランがリロードされていない
- → 外部着信が `incoming-ari` を通っていない

**検証方法**:
```bash
asterisk -rx "dialplan reload"
```

### 仮説3: ARI WebSocketの部分的な切断
- 接続は確立しているが、特定のイベントタイプが届かない
- → サーバー再起動で解決する可能性

**検証方法**:
```bash
cd /home/user/DENCO_demo/asterisk-backend
# Ctrl+Cでサーバー停止
npm run dev
```

## 💡 推奨される対応順序

1. **まず**: Asteriskサーバーで `dialplan show incoming-ari` を実行
   - `Stasis(myapp)` か `Stasis(denco_voiceai)` かを確認

2. **次に**: テストコマンドを再実行
   - 現在も正常に動作するか確認

3. **その後**: Asterisk CLIでリアルタイム監視しながら外部着信
   - Asterisk側とNode.js側の両方のログを比較

4. **最後**: 必要に応じてサーバー再起動またはアプリ名統一
