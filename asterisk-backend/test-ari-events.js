import ari from 'ari-client';
import config from './config.js';

const ariUrl = `http://${config.asterisk.host}:${config.asterisk.ariPort}`;
const username = config.asterisk.ariUsername;
const password = config.asterisk.ariPassword;
const appName = config.asterisk.appName;

console.log('=== ARI イベントテスト ===');
console.log(`接続先: ${ariUrl}`);
console.log(`ユーザー名: ${username}`);
console.log(`アプリ名: ${appName}`);
console.log('');

ari.connect(ariUrl, username, password)
  .then((client) => {
    console.log('✅ ARI接続成功');

    // すべてのイベントをログ出力
    client.on('*', (event, ...args) => {
      console.log('\n🔔 イベント受信:', event.type);
      console.log('イベント詳細:', JSON.stringify(event, null, 2));
      if (args.length > 0) {
        console.log('引数:', JSON.stringify(args, null, 2));
      }
    });

    // StasisStartイベント
    client.on('StasisStart', (event, channel) => {
      console.log('\n📞 StasisStart イベント!');
      console.log('  チャンネルID:', channel.id);
      console.log('  チャンネル名:', channel.name);
      console.log('  発信者番号:', channel.caller.number);
      console.log('  着信番号:', channel.dialplan ? channel.dialplan.exten : 'N/A');
    });

    // StasisEndイベント
    client.on('StasisEnd', (event, channel) => {
      console.log('\n📴 StasisEnd イベント');
      console.log('  チャンネルID:', channel.id);
    });

    // WebSocket接続イベント
    client.on('WebSocketConnected', () => {
      console.log('✅ ARI WebSocket接続成功');
    });

    client.on('WebSocketReconnecting', () => {
      console.log('⚠️ ARI WebSocket再接続中...');
    });

    // エラーイベント
    client.on('error', (error) => {
      console.error('❌ ARIエラー:', error.message);
    });

    // アプリケーション起動
    client.start(appName);
    console.log(`✅ Stasisアプリケーション起動: ${appName}`);
    console.log('\n待機中... (Ctrl+Cで終了)');
    console.log('Asteriskに電話をかけてください\n');
  })
  .catch((error) => {
    console.error('❌ ARI接続エラー:', error.message);
    process.exit(1);
  });

// 終了処理
process.on('SIGINT', () => {
  console.log('\n\nテスト終了');
  process.exit(0);
});
