# 外部着信をARIにルーティングする設定手順

## 設定概要

すべての外部着信を `incoming-ari` コンテキストに転送し、Node.jsバックエンドで処理できるようにします。

---

## 方法1: Asterisk設定ファイル編集（推奨）

### ステップ1: extensions_custom.conf を編集

Asteriskサーバー（192.168.1.140）にSSHでログインし、以下を実行：

```bash
sudo nano /etc/asterisk/extensions_custom.conf
```

ファイルの**末尾**に以下を追加：

```conf
[from-pstn-custom]
exten => _X.,1,NoOp(=== External call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)

[from-trunk-custom]
exten => _X.,1,NoOp(=== Trunk call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)
```

**説明**:
- `from-pstn-custom`: PSTN（一般電話回線）からの着信をフック
- `from-trunk-custom`: SIPトランク経由の着信をフック
- `_X.`: すべての番号にマッチ（1桁以上の数字）
- `Goto(incoming-ari,s,1)`: incoming-ariコンテキストに転送

### ステップ2: 設定を保存して反映

```bash
# ファイルを保存（Ctrl+O → Enter → Ctrl+X）

# Asteriskに設定を再読み込みさせる
sudo asterisk -rx "dialplan reload"
```

### ステップ3: 設定確認

```bash
# ダイヤルプランが正しく読み込まれたか確認
sudo asterisk -rx "dialplan show from-pstn-custom"
sudo asterisk -rx "dialplan show from-trunk-custom"
```

以下のような出力が表示されればOK:
```
[ Context 'from-pstn-custom' created by 'pbx_config' ]
  '_X.' =>          1. NoOp(=== External call routing to ARI ===)
                    2. NoOp(From: ${CALLERID(num)} To: ${EXTEN})
                    3. Goto(incoming-ari,s,1)
```

---

## 方法2: FreePBX Web UIで設定（GUIを使いたい場合）

### ステップ1: Custom Destination作成

1. FreePBX管理画面にアクセス: http://192.168.1.140/admin/
2. **Admin** → **Custom Destinations** を開く
3. **Add Custom Destination** をクリック
4. 以下を入力:
   - **Custom Destination**: `incoming-ari,s,1`
   - **Description**: `Voice AI ARI Handler`
   - **Notes**: `Send all calls to Node.js backend via ARI`
5. **Submit** → **Apply Config**

### ステップ2: Inbound Route変更

1. **Connectivity** → **Inbound Routes**
2. 既存のルートを編集、または新規作成:
   - **Description**: `All External to ARI`
   - **DID Number**: 空欄（すべてのDIDにマッチ）
   - **CID Number**: 空欄（すべての発信者にマッチ）
3. **Set Destination**:
   - **Destination**: `Custom Destinations` → `Voice AI ARI Handler`
4. **Submit** → **Apply Config**

---

## テスト手順

### 1. Node.jsサーバーが起動していることを確認

```bash
cd /home/user/DENCO_demo/asterisk-backend
npm run dev
```

サーバーログに以下が表示されていることを確認:
```
[INFO] ARI WebSocket接続成功
[INFO] Stasisアプリケーション起動: denco_voiceai
[INFO] サーバー起動完了
```

### 2. ブラウザでWebSocket接続

```
file://wsl.localhost/Ubuntu/home/user/DENCO_demo/asterisk-backend/websocket-test.html
```

「接続」ボタンをクリックして「✅ 接続中」になることを確認。

### 3. Asterisk CLIでリアルタイム監視

Asteriskサーバーで:
```bash
sudo asterisk -rvvv
```

### 4. 外部電話から着信テスト

外部の携帯電話などから、FreePBXの番号に電話をかけます。

### 5. 期待される動作

#### Asterisk CLI（192.168.1.140）
```
Executing [090XXXXXXXX@from-pstn-custom:1] NoOp("PJSIP/trunk-xxx", "=== External call routing to ARI ===")
Executing [090XXXXXXXX@from-pstn-custom:2] NoOp("PJSIP/trunk-xxx", "From: 090XXXXXXXX To: 0312345678")
Executing [090XXXXXXXX@from-pstn-custom:3] Goto("PJSIP/trunk-xxx", "incoming-ari,s,1")
Executing [s@incoming-ari:1] NoOp("PJSIP/trunk-xxx", "=== incoming via ARI entry ===")
Executing [s@incoming-ari:3] Stasis("PJSIP/trunk-xxx", "denco_voiceai,090XXXXXXXX,0312345678")
```

#### Node.jsサーバーログ
```
[INFO] Stasis開始 {"channelId":"1759998XXX.X","channelName":"PJSIP/trunk-xxx"}
[INFO] 着信処理開始 {"callerNumber":"090XXXXXXXX","calledNumber":"0312345678"}
[INFO] フロントエンドブロードキャスト {"type":"call_started","recipients":1}
[INFO] 着信通知送信完了
[WARN] Pythonバックエンド連携スキップ（起動していない可能性）
[INFO] 着信処理完了
```

#### ブラウザ（websocket-test.html）
```
[HH:MM:SS] 📞 着信！
発信者: 090XXXXXXXX
着信番号: 0312345678
通話ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## トラブルシューティング

### 問題1: Asterisk CLIに何も表示されない

**原因**: 外部着信がトランク経由で来ているが、`from-trunk-custom` が定義されていない

**対処**: 上記の設定で `from-trunk-custom` も追加してあるので、両方カバーされています

### 問題2: "No such context 'from-pstn-custom'"

**原因**: 設定ファイルの記述ミス、またはリロードされていない

**対処**:
```bash
# 設定ファイルの構文チェック
sudo asterisk -rx "dialplan reload"

# エラーがないか確認
sudo asterisk -rx "core show hints"
```

### 問題3: Node.jsに「Stasis開始」が届かない

**原因**: アプリ名の不一致

**確認**:
```bash
# .envファイルのアプリ名を確認
cat /home/user/DENCO_demo/asterisk-backend/.env | grep ASTERISK_APP_NAME

# extensions_custom.confのアプリ名を確認（Asteriskサーバー側）
sudo cat /etc/asterisk/extensions_custom.conf | grep Stasis
```

両方とも `denco_voiceai` になっているか確認。

### 問題4: 既存の内線電話が動かなくなった

**原因**: すべての着信をARIに転送しているため

**対処**: 特定の条件だけARIに転送するよう変更:

```conf
[from-pstn-custom]
; 特定のDIDだけARIに転送
exten => 0312345678,1,NoOp(=== DID for ARI ===)
 same => n,Goto(incoming-ari,s,1)

; その他はFreePBX標準処理
exten => _X.,1,Return()
```

---

## 次のステップ

1. **Asteriskサーバー（192.168.1.140）にSSH接続**
2. **上記の設定を `/etc/asterisk/extensions_custom.conf` に追加**
3. **`sudo asterisk -rx "dialplan reload"` を実行**
4. **外部電話から着信テスト**
5. **結果を報告してください**

設定がうまくいかない場合は、Asterisk CLIの出力とNode.jsサーバーのログを共有してください。
