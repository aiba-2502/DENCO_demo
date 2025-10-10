# 外部電話着信の問題調査

## 問題の特定

### ✅ 正常に動作するケース
**テストコマンド**: `channel originate Local/s@incoming-ari application Echo`
- Node.jsログに「Stasis開始」が表示される ✅
- ブラウザに通知が表示される ✅
- 処理フローが正常に動作する ✅

### ❌ 動作しないケース
**外部電話からの着信**:
- Node.jsログに「Stasis開始」が表示されない ❌
- ブラウザに通知が表示されない ❌
- **根本原因**: Asteriskから Node.js へイベントが届いていない

---

## 原因分析

外部電話からの着信は、FreePBXの**インバウンドルート（Inbound Route）**設定で処理されます。

現在の状態:
```
外部電話 → FreePBX → ??? → どこか別の場所へ
                     ↑
                     incoming-ari コンテキストを通っていない
```

正しい設定:
```
外部電話 → FreePBX → incoming-ari コンテキスト → Stasis(denco_voiceai) → Node.js
```

---

## 必要な設定確認

### 1. FreePBX Web UIでの確認

#### インバウンドルート設定
1. FreePBX管理画面にログイン: http://192.168.1.140/admin/
2. **Connectivity** → **Inbound Routes** を開く
3. 外部電話が着信するルートを見つける（DIDまたは「Any DID / Any CID」）
4. **Set Destination** セクションを確認

**現在の設定を教えてください**:
- Destination Type: ?（例：Extensions, IVR, Ring Group など）
- Destination: ?（例：内線番号、IVRメニューなど）

#### カスタムコンテキストの設定
FreePBXで `incoming-ari` コンテキストを使用するには、**Custom Destination** を作成する必要があります。

---

## 解決策

### 方法1: Custom Destination を作成（推奨）

#### ステップ1: Custom Destination作成
1. FreePBX管理画面で **Admin** → **Custom Destinations** を開く
2. **Add Custom Destination** をクリック
3. 以下を設定:
   - **Custom Destination**: `incoming-ari,s,1`
   - **Description**: `ARI Voice AI Incoming`
4. **Submit** → **Apply Config**

#### ステップ2: Inbound Routeを変更
1. **Connectivity** → **Inbound Routes** を開く
2. 外部着信用のルートを編集
3. **Set Destination** を以下に変更:
   - **Destination Type**: `Custom Destinations`
   - **Destination**: `ARI Voice AI Incoming`
4. **Submit** → **Apply Config**

---

### 方法2: ダイヤルプランで直接ルーティング

`/etc/asterisk/extensions_custom.conf` を編集（既に `incoming-ari` は定義済み）:

```conf
[from-pstn-custom]  ; または [from-trunk-custom]
exten => _X.,1,NoOp(=== External call to ARI ===)
 same => n,Goto(incoming-ari,s,1)
```

この設定により、すべての外部着信を `incoming-ari` にルーティングします。

---

### 方法3: 特定のDIDだけをARIに送る

特定の電話番号（DID）だけをARIに送りたい場合:

```conf
[from-pstn-custom]
exten => 0312345678,1,NoOp(=== DID 03-1234-5678 to ARI ===)
 same => n,Goto(incoming-ari,s,1)
```

---

## 設定後の確認手順

1. Asterisk設定をリロード:
   ```bash
   asterisk -rx "dialplan reload"
   ```

2. 外部電話から着信テスト

3. Node.jsサーバーログで以下を確認:
   ```
   [INFO] Stasis開始 {"channelId":"..."}
   [INFO] 着信処理開始
   [INFO] フロントエンドブロードキャスト {"recipients":1}
   [INFO] 着信通知送信完了
   ```

4. ブラウザに通知が表示されることを確認

---

## デバッグ方法

### Asterisk CLIでリアルタイム確認

```bash
asterisk -rvvv
```

外部電話から着信時、以下が表示されるはず:
```
Executing [s@incoming-ari:1] NoOp("PJSIP/xxx-xxx", "=== incoming via ARI entry ===")
Executing [s@incoming-ari:2] NoOp("PJSIP/xxx-xxx", "CID=090XXXXXXXX EXTEN=s DID=0312345678")
Executing [s@incoming-ari:3] Stasis("PJSIP/xxx-xxx", "denco_voiceai,090XXXXXXXX,0312345678")
```

もし `[from-pstn]` や `[ext-local]` などのコンテキストが表示される場合は、
`incoming-ari` にルーティングされていません。

---

## 次のステップ

1. 現在のFreePBX設定を教えてください（Inbound RouteのDestination）
2. 上記の方法から選択して設定を変更
3. 設定後、外部電話からテスト
4. Node.jsログとAsterisk CLIの出力を確認
