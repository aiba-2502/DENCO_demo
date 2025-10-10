#!/bin/bash
# 外部着信をARIにルーティングする設定スクリプト
# Asteriskサーバー（192.168.1.140）で実行してください

set -e

echo "=========================================="
echo "外部着信→ARI ルーティング設定スクリプト"
echo "=========================================="
echo ""

# 管理者権限チェック
if [ "$EUID" -ne 0 ]; then
  echo "❌ このスクリプトはroot権限で実行してください"
  echo "使用方法: sudo bash setup-routing.sh"
  exit 1
fi

# Asterisk動作確認
if ! systemctl is-active --quiet asterisk; then
  echo "❌ Asteriskが起動していません"
  echo "起動コマンド: systemctl start asterisk"
  exit 1
fi

echo "✅ Asterisk起動確認完了"
echo ""

# バックアップ作成
BACKUP_FILE="/etc/asterisk/extensions_custom.conf.backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 バックアップ作成中..."
cp /etc/asterisk/extensions_custom.conf "$BACKUP_FILE"
echo "✅ バックアップ: $BACKUP_FILE"
echo ""

# 既存設定の確認
if grep -q "\[from-pstn-custom\]" /etc/asterisk/extensions_custom.conf 2>/dev/null; then
  echo "⚠️  [from-pstn-custom] は既に存在します"
  echo "既存の設定を確認してください: /etc/asterisk/extensions_custom.conf"
  echo ""
  read -p "上書きしますか？ (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "処理を中断しました"
    exit 0
  fi
  # 既存のfrom-pstn-customとfrom-trunk-customを削除
  sed -i '/^\[from-pstn-custom\]/,/^$/d' /etc/asterisk/extensions_custom.conf
  sed -i '/^\[from-trunk-custom\]/,/^$/d' /etc/asterisk/extensions_custom.conf
fi

# 新しい設定を追加
echo "📝 設定を追加中..."
cat >> /etc/asterisk/extensions_custom.conf << 'EOF'

; ==============================================
; 外部着信をARIにルーティング
; すべての外部着信を incoming-ari コンテキストに転送
; ==============================================
[from-pstn-custom]
exten => _X.,1,NoOp(=== External call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)

[from-trunk-custom]
exten => _X.,1,NoOp(=== Trunk call routing to ARI ===)
 same => n,NoOp(From: ${CALLERID(num)} To: ${EXTEN})
 same => n,Goto(incoming-ari,s,1)

EOF

echo "✅ 設定追加完了"
echo ""

# 設定を再読み込み
echo "🔄 ダイヤルプラン再読み込み中..."
asterisk -rx "dialplan reload" > /dev/null 2>&1
sleep 1

# 設定確認
echo "🔍 設定確認中..."
echo ""
echo "--- from-pstn-custom ---"
asterisk -rx "dialplan show from-pstn-custom" | grep -A 5 "from-pstn-custom"
echo ""
echo "--- from-trunk-custom ---"
asterisk -rx "dialplan show from-trunk-custom" | grep -A 5 "from-trunk-custom"
echo ""

# incoming-ari確認
echo "--- incoming-ari ---"
asterisk -rx "dialplan show incoming-ari" | grep -A 5 "incoming-ari"
echo ""

echo "=========================================="
echo "✅ 設定完了！"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "1. Node.jsサーバーが起動していることを確認"
echo "   → cd /home/user/DENCO_demo/asterisk-backend && npm run dev"
echo ""
echo "2. ブラウザでWebSocket接続"
echo "   → file://wsl.localhost/Ubuntu/home/user/DENCO_demo/asterisk-backend/websocket-test.html"
echo ""
echo "3. Asterisk CLIでリアルタイム監視"
echo "   → asterisk -rvvv"
echo ""
echo "4. 外部電話から着信テスト"
echo ""
echo "バックアップファイル: $BACKUP_FILE"
echo "元に戻す場合: cp $BACKUP_FILE /etc/asterisk/extensions_custom.conf"
echo ""
