# 外部着信デバッグ手順

## 現状確認

### 確認済み事項
✅ テストコマンド (`channel originate Local/s@incoming-ari application Echo`) は動作する
✅ ブラウザWebSocket接続は確立されている
✅ Node.jsサーバーは起動している
❌ 外部電話からの着信でブラウザに通知が表示されない

### ログ分析結果
- `/var/log/asterisk/full` に外部着信のイベントが記録されていない
- つまり、着信自体がAsteriskに届いていないか、別の場所で処理されている可能性

---

## デバッグ手順

### ステップ1: Asterisk CLIでリアルタイム監視

Asteriskサーバー（192.168.1.140）で以下を実行：

```bash
sudo asterisk -rvvvvv
```

このコンソールを開いたまま、外部から電話をかけてください。

**何が表示されるか確認してください：**

1. **何も表示されない場合**
   - 着信自体がAsteriskに届いていない（トランクやネットワークの問題）

2. **`from-pstn` や `from-trunk` コンテキストが表示される場合**
   - 例：`Executing [s@from-pstn:1] ...`
   - これは正常で、次に `from-pstn-custom` にジャンプするはず

3. **別のコンテキストが表示される場合**
   - 例：`Executing [s@from-did-direct:1] ...`
   - FreePBXが別のルートで処理している

---

### ステップ2: 設定ファイルの確認

#### extensions_custom.conf の内容確認

```bash
sudo cat /etc/asterisk/extensions_custom.conf
```

**以下が含まれているか確認：**
```conf
[from-pstn-custom]
exten => _X.,1,NoOp(=== External call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)

[from-trunk-custom]
exten => _X.,1,NoOp(=== Trunk call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)

[incoming-ari]
exten => s,1,NoOp(=== incoming via ARI entry ===)
 same => n,NoOp(CID=${CALLERID(num)}  EXTEN=${EXTEN}  DID=${FROM_DID})
 same => n,Stasis(denco_voiceai,${CALLERID(num)},${IF($[${ISNULL(${FROM_DID})}]?${EXTEN}:${FROM_DID})})
 same => n,Hangup()
```

#### ダイヤルプランがロードされているか確認

```bash
sudo asterisk -rx "dialplan show from-pstn-custom"
sudo asterisk -rx "dialplan show from-trunk-custom"
sudo asterisk -rx "dialplan show incoming-ari"
```

すべてが表示されない場合、設定がリロードされていません：
```bash
sudo asterisk -rx "dialplan reload"
```

---

### ステップ3: FreePBX Inbound Route確認

FreePBX Web UI（http://192.168.1.140/admin/）で確認：

1. **Connectivity** → **Inbound Routes** を開く
2. 外部着信用のルートを確認
3. **Destination** が何に設定されているか確認

**可能性のある設定：**
- Extensions（内線）
- Ring Groups（内線グループ）
- IVR（音声自動応答）
- Voicemail（ボイスメール）
- Terminate Call（切断）

**問題**: FreePBXのInbound Routeが優先され、`from-pstn-custom` が実行されていない可能性があります。

---

## 解決策

### 解決策A: FreePBXのInbound Routeを変更（推奨）

#### 方法1: Custom Destinationを作成

1. FreePBX Web UIで **Admin** → **Custom Destinations**
2. **Add Custom Destination** をクリック
3. 設定：
   - **Custom Destination**: `incoming-ari,s,1`
   - **Description**: `Voice AI Handler`
4. **Submit** → **Apply Config**

5. **Connectivity** → **Inbound Routes** を開く
6. 既存のルートを編集または新規作成
7. **Set Destination**:
   - Destination: `Custom Destinations` → `Voice AI Handler`
8. **Submit** → **Apply Config**

#### 方法2: すべてのInbound Routeを削除（テスト用）

⚠️ **警告**: この方法は既存の着信ルートをすべて削除します

1. **Connectivity** → **Inbound Routes**
2. すべてのルートを削除
3. **Apply Config**

これにより、FreePBXのルーティングをバイパスし、`from-pstn-custom` が実行されるようになります。

---

### 解決策B: ダイヤルプランの優先順位を変更

FreePBXのデフォルト動作を上書きする必要があります。

#### from-pstn コンテキストを直接編集（上級者向け）

⚠️ **警告**: この方法はFreePBXの自動生成ファイルを編集するため、FreePBXアップデート時に消える可能性があります

```bash
sudo nano /etc/asterisk/extensions.conf
```

`[from-pstn]` セクションを探し、**最初の行**に以下を追加：

```conf
[from-pstn]
include => from-pstn-custom  ; ← この行を追加（既に存在する場合は確認）
exten => s,1,NoOp(Entering from-pstn with DID == ${DID})
...
```

保存後：
```bash
sudo asterisk -rx "dialplan reload"
```

---

## 緊急デバッグコマンド

### 外部着信時にどのコンテキストが実行されているか確認

Asterisk CLIで以下を実行し、外部から着信：

```bash
sudo asterisk -rvvvvv
```

出力例を確認：
```
    -- Executing [05055303521@from-pstn:1] ...
```

この `@from-pstn` の部分（コンテキスト名）を教えてください。

---

## 次のステップ

1. **Asterisk CLIを起動したまま、外部から着信**
2. **どのコンテキストが実行されているか確認**
3. **その結果を教えてください**

例：
- `@from-pstn` が表示された場合
- `@from-trunk` が表示された場合
- `@from-did-direct` が表示された場合
- 何も表示されない場合

この情報があれば、正確な解決策を提示できます。
