# Asterisk / FreePBX セットアップ手順

このドキュメントでは、DENCO音声AIシステムとAsterisk PBXを連携させるための詳細な設定手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [ARI（Asterisk REST Interface）の有効化](#ariasterisk-rest-interfaceの有効化)
3. [ARIユーザーの作成](#ariユーザーの作成)
4. [Stasisアプリケーションの設定](#stasisアプリケーションの設定)
5. [インバウンドルートの設定](#インバウンドルートの設定)
6. [カスタムコンテキストの作成](#カスタムコンテキストの作成)
7. [SIPトランクの設定](#sipトランクの設定)
8. [音声コーデックの設定](#音声コーデックの設定)
9. [動作確認](#動作確認)
10. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- **Asterisk**: 16.x 以上（推奨: 18.x または 20.x）
- **FreePBX**: 15.x 以上（推奨: 16.x または 17.x）
- **OS**: Linux (CentOS 7/8, Ubuntu 20.04/22.04, Debian 10/11)
- **ネットワーク**: Node.jsバックエンドからAsteriskサーバーへアクセス可能
- **ポート**: 8088 (ARI HTTP), 5060 (SIP), 10000-20000 (RTP)

---

## ARI（Asterisk REST Interface）の有効化

### 1. FreePBX GUIから設定

#### 方法1: Advanced Settings（推奨）

1. FreePBX管理画面にログイン
   ```
   http://[FreePBXのIP]/admin
   ```

2. **Admin** → **Advanced Settings** に移動

3. 検索ボックスで「**ARI**」を検索

4. 以下の設定を確認・変更：
   - **Enable ARI**: `Yes`
   - **ARI Enable HTTP**: `Yes`
   - **ARI Port**: `8088`（デフォルト）
   - **ARI Allowed Origins**: `*` または Node.jsバックエンドのIPアドレス

5. **Submit** をクリックして保存

6. **Apply Config** をクリックして設定を反映

#### 方法2: SSH経由で直接設定

FreePBX UIで設定できない場合、SSHで直接設定します。

1. AsteriskサーバーにSSH接続
   ```bash
   ssh root@[AsteriskサーバーのIP]
   ```

2. ARI設定ファイルを編集
   ```bash
   nano /etc/asterisk/ari.conf
   ```

3. 以下の内容を記述
   ```ini
   [general]
   enabled = yes
   pretty = yes
   allowed_origins = *
   
   ; Webサーバー設定
   [http]
   enabled = yes
   bindaddr = 0.0.0.0
   bindport = 8088
   tlsenable = no
   tlsbindaddr = 0.0.0.0:8089
   tlscertfile = /etc/asterisk/keys/asterisk.pem
   tlsprivatekey = /etc/asterisk/keys/asterisk.pem
   ```

4. ファイルを保存して終了（Ctrl+X, Y, Enter）

5. Asteriskをリロード
   ```bash
   asterisk -rx "module reload res_ari.so"
   asterisk -rx "ari show status"
   ```

---

## ARIユーザーの作成

### FreePBX GUIから作成

現在、FreePBXにはARIユーザー管理UIがないため、**SSH経由で設定**します。

### SSH経由での設定

1. ARI設定ファイルを編集
   ```bash
   nano /etc/asterisk/ari.conf
   ```

2. ファイル末尾に以下を追加
   ```ini
   ; DENCOシステム用ARIユーザー
   [ariuser]
   type = user
   read_only = no
   password = arisecret
   password_format = plain
   ```

   **セキュリティ重要**: `arisecret` は強力なパスワードに変更してください。

3. ファイルを保存して終了

4. Asteriskをリロード
   ```bash
   asterisk -rx "module reload res_ari.so"
   ```

5. ARIユーザーを確認
   ```bash
   asterisk -rx "ari show users"
   ```

   出力例:
   ```
   Username     Read Only
   ========     =========
   ariuser      No
   ```

---

## Stasisアプリケーションの設定

Stasisアプリケーションは、ARIを使用してAsteriskを制御するための仕組みです。

### 1. カスタムダイヤルプランの作成

1. FreePBX管理画面で **Admin** → **Config Edit** に移動

2. または、SSH経由で直接編集
   ```bash
   nano /etc/asterisk/extensions_custom.conf
   ```

3. 以下の内容を追加
   ```ini
   ; DENCOボイスAIシステム用コンテキスト
   [denco-ai-inbound]
   exten => _X.,1,NoOp(DENCO AI着信: ${CALLERID(num)} -> ${EXTEN})
    same => n,Answer()
    same => n,Stasis(denco_voiceai,${EXTEN},${CALLERID(num)})
    same => n,Hangup()

   ; AI対応用DID着信
   [from-pstn-denco-ai]
   exten => _X.,1,NoOp(外部着信からDENCP AI: ${EXTEN})
    same => n,Goto(denco-ai-inbound,${EXTEN},1)
   ```

   **説明:**
   - `Stasis(denco_voiceai,...)`: Node.jsバックエンドの `ASTERISK_APP_NAME` に対応
   - `${EXTEN}`: 着信番号（DID）
   - `${CALLERID(num)}`: 発信者番号

4. ファイルを保存して終了

5. ダイヤルプランをリロード
   ```bash
   asterisk -rx "dialplan reload"
   ```

6. ダイヤルプランを確認
   ```bash
   asterisk -rx "dialplan show denco-ai-inbound"
   ```

---

## インバウンドルートの設定

FreePBX UIを使用して、外部からの着信をAIシステムに振り分けます。

### 1. インバウンドルートの作成

1. FreePBX管理画面で **Connectivity** → **Inbound Routes** に移動

2. **Add Inbound Route** をクリック

3. **General** セクション:
   - **Description**: `DENCO AI Voice System`
   - **DID Number**: 着信させたいDID番号（例: `0312345678`）
     - 全ての番号で受ける場合は空欄
   - **Caller ID Number**: 空欄（全ての発信者を許可）

4. **Set Destination** セクション:
   - **Destination**: `Custom Destinations` を選択
   - **Custom Destination**: `denco-ai-inbound,s,1` を入力

   または、カスタムコンテキストを使用:
   - **Destination**: `Custom App`
   - **Custom Application**: `Goto(denco-ai-inbound,${DID},1)` を入力

5. **Submit** をクリックして保存

6. **Apply Config** をクリックして設定を反映

### 2. カスタムデスティネーションの作成（オプション）

1. FreePBX管理画面で **Admin** → **Custom Destinations** に移動

2. **Add Custom Destination** をクリック

3. 以下を入力:
   - **Description**: `DENCO AI System`
   - **Custom Destination**: `denco-ai-inbound,${EXTEN},1`
   - **Notes**: `Routes calls to DENCO Voice AI via ARI`

4. **Submit** → **Apply Config**

---

## カスタムコンテキストの作成

内線からAIシステムにダイヤルする場合のコンテキストを作成します。

### 1. 内線用ダイヤルプラン

1. `/etc/asterisk/extensions_custom.conf` を編集
   ```bash
   nano /etc/asterisk/extensions_custom.conf
   ```

2. 以下を追加
   ```ini
   ; 内線からのAI呼び出し（例: *88をダイヤル）
   [from-internal-custom]
   exten => *88,1,NoOp(内線からDENCO AIにアクセス: ${CALLERID(num)})
    same => n,Answer()
    same => n,Playback(beep)
    same => n,Stasis(denco_voiceai,internal,${CALLERID(num)})
    same => n,Hangup()
   ```

3. ファイルを保存してリロード
   ```bash
   asterisk -rx "dialplan reload"
   ```

4. 内線から `*88` をダイヤルしてテスト

---

## SIPトランクの設定

### 外部SIPトランクの設定（オプション）

外部キャリアやSIPプロバイダーからの着信をAIシステムに接続する場合。

1. FreePBX管理画面で **Connectivity** → **Trunks** に移動

2. 既存のトランクを編集、または新規作成

3. **Outbound Caller ID**: 発信者ID設定

4. **PEER Details**（PJSIP）:
   ```ini
   type=friend
   context=from-pstn-denco-ai
   host=[キャリアのSIPサーバー]
   secret=[パスワード]
   username=[ユーザー名]
   disallow=all
   allow=ulaw
   allow=alaw
   dtmfmode=rfc2833
   ```

5. **Submit** → **Apply Config**

---

## 音声コーデックの設定

AIシステムとの音声品質を最適化するため、コーデックを設定します。

### 推奨コーデック

- **slin16** (16kHz PCM): 最高品質、AI音声認識に最適
- **ulaw** (G.711): 標準的な品質、互換性が高い
- **opus**: 高品質・低帯域

### 1. SIP設定でコーデックを指定

1. FreePBX管理画面で **Settings** → **Asterisk SIP Settings** に移動

2. **SIP Settings [chan_pjsip]** タブ:
   - **Codecs**: 以下の順に設定
     1. `slin16`
     2. `ulaw`
     3. `alaw`
     4. `opus`

3. **Submit** → **Apply Config**

### 2. SSH経由での設定

```bash
nano /etc/asterisk/pjsip.conf
```

```ini
[global]
disallow=all
allow=slin16
allow=ulaw
allow=alaw
allow=opus
```

---

## 動作確認

### 1. Node.jsバックエンドの起動確認

Node.jsバックエンドが正しく起動しているか確認します。

```bash
cd asterisk-backend
npm start
```

ログ出力例:
```
[2025-10-05T12:00:00.000Z] [INFO] Asterisk ARIに接続中...
[2025-10-05T12:00:01.000Z] [INFO] Asterisk ARIに接続成功
[2025-10-05T12:00:01.000Z] [INFO] Stasisアプリケーション起動: denco_voiceai
[2025-10-05T12:00:01.000Z] [INFO] サーバー起動完了 {"host":"0.0.0.0","port":3001}
```

### 2. ARI接続テスト

```bash
curl -u ariuser:arisecret http://[AsteriskのIP]:8088/ari/asterisk/info
```

成功時の出力例:
```json
{
  "version": "18.20.0",
  "system": {
    "version": "Linux 4.18.0-425.el8.x86_64"
  }
}
```

### 3. テスト通話

#### 内線からのテスト

1. 内線電話から `*88` をダイヤル

2. Node.jsバックエンドのログを確認
   ```
   [INFO] Stasis開始 {"channelId":"...", "caller":"1001"}
   [INFO] 着信処理開始 {"channelId":"...", "callerNumber":"1001"}
   [INFO] 着信処理完了 {"callId":"...", "channelId":"..."}
   ```

3. Asterisk CLIでも確認
   ```bash
   asterisk -rvvvvv
   ```

   出力例:
   ```
   == Stasis denco_voiceai started on channel PJSIP/1001-00000001
   ```

#### 外部からのテスト

1. 外部電話からDID番号に発信

2. 同様にログとCLIで確認

---

## トラブルシューティング

### ❌ ARI接続エラー

**症状**: `ARI クライアントエラー: connect ECONNREFUSED`

**解決方法**:

1. ARIが有効化されているか確認
   ```bash
   asterisk -rx "ari show status"
   ```

2. ポート8088が開いているか確認
   ```bash
   netstat -tuln | grep 8088
   ```

3. ファイアウォール設定を確認
   ```bash
   # CentOS/RHEL
   firewall-cmd --add-port=8088/tcp --permanent
   firewall-cmd --reload

   # Ubuntu/Debian
   ufw allow 8088/tcp
   ```

---

### ❌ Stasisアプリケーションが起動しない

**症状**: 通話が接続されない、またはすぐに切断される

**解決方法**:

1. ダイヤルプランを確認
   ```bash
   asterisk -rx "dialplan show denco-ai-inbound"
   ```

2. Stasisアプリケーション名が一致しているか確認
   - Node.js: `config.asterisk.appName` = `denco_voiceai`
   - Asterisk: `Stasis(denco_voiceai,...)`

3. Asterisk CLIでログを確認
   ```bash
   asterisk -rvvvvv
   core set verbose 10
   ```

---

### ❌ 認証エラー

**症状**: `401 Unauthorized`

**解決方法**:

1. ARIユーザー名とパスワードを確認
   ```bash
   asterisk -rx "ari show users"
   ```

2. `.env` ファイルの認証情報を確認
   ```
   ASTERISK_ARI_USERNAME=ariuser
   ASTERISK_ARI_PASSWORD=arisecret
   ```

3. ARI設定ファイルを確認
   ```bash
   cat /etc/asterisk/ari.conf | grep -A5 "\[ariuser\]"
   ```

---

### ❌ 音声が聞こえない

**症状**: 通話は接続されるが音声が流れない

**解決方法**:

1. RTPポートが開いているか確認
   ```bash
   # CentOS/RHEL
   firewall-cmd --add-port=10000-20000/udp --permanent
   firewall-cmd --reload

   # Ubuntu/Debian
   ufw allow 10000:20000/udp
   ```

2. NATが正しく設定されているか確認
   ```bash
   nano /etc/asterisk/pjsip.conf
   ```

   ```ini
   [transport-udp]
   type=transport
   protocol=udp
   bind=0.0.0.0
   external_media_address=[外部IPアドレス]
   external_signaling_address=[外部IPアドレス]
   ```

3. コーデックが一致しているか確認
   ```bash
   asterisk -rx "pjsip show endpoints"
   ```

---

### 📊 ログの確認方法

#### Asterisk フルログ

```bash
tail -f /var/log/asterisk/full
```

#### ARI デバッグログ

```bash
asterisk -rx "ari set debug all on"
tail -f /var/log/asterisk/full | grep ARI
```

#### Node.jsバックエンドログ

```bash
cd asterisk-backend
npm run dev
```

---

## 📚 参考資料

- [Asterisk ARI Documentation](https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Interface)
- [FreePBX Documentation](https://wiki.freepbx.org/)
- [ARI Client for Node.js](https://github.com/asterisk/node-ari-client)
- [Stasis Application Guide](https://wiki.asterisk.org/wiki/display/AST/Getting+Started+with+ARI)

---

## ✅ 設定完了チェックリスト

- [ ] ARIが有効化されている (`ari show status`)
- [ ] ARIユーザーが作成されている (`ari show users`)
- [ ] ポート8088が開いている (`netstat -tuln | grep 8088`)
- [ ] Stasisアプリケーションのダイヤルプランが作成されている
- [ ] インバウンドルートが設定されている
- [ ] Node.jsバックエンドがAsteriskに接続できる
- [ ] テスト通話が成功する

---

**設定完了！** 🎉

これでAsterisk PBXとNode.jsバックエンドが正しく連携し、AI音声通話システムが動作します。

問題が発生した場合は、上記のトラブルシューティングセクションを参照してください。

