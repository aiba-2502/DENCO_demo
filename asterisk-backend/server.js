import express from 'express';
import http from 'http';
import config from './config.js';
import logger from './logger.js';
import AriClient from './ari-client.js';
import CallHandler from './call-handler.js';
import WebSocketManager from './websocket-manager.js';

// Expressアプリケーション
const app = express();
app.use(express.json());

// CORSミドルウェア
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (config.frontend.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// HTTPサーバー
const httpServer = http.createServer(app);

// コンポーネント初期化
const ariClient = new AriClient();
const wsManager = new WebSocketManager();
const callHandler = new CallHandler(ariClient, wsManager);

// WebSocketサーバー初期化
wsManager.initialize(httpServer);

// ==================== REST API エンドポイント ====================

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    asterisk: {
      connected: ariClient.connected,
    },
    activeCalls: callHandler.getActiveCalls().length,
  });
});

/**
 * アクティブな通話一覧
 */
app.get('/api/calls/active', (req, res) => {
  try {
    const calls = callHandler.getActiveCalls();
    res.json({
      status: 'success',
      calls,
      count: calls.length,
    });
  } catch (error) {
    logger.error('アクティブ通話取得エラー', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * 通話を切断
 */
app.post('/api/calls/:callId/disconnect', async (req, res) => {
  const { callId } = req.params;

  try {
    await callHandler.disconnectCall(callId);
    res.json({
      status: 'success',
      message: 'Call disconnected',
      callId,
    });
  } catch (error) {
    logger.error('通話切断エラー', { callId, error: error.message });
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * 発信（アウトバウンド通話）
 */
app.post('/api/calls/originate', async (req, res) => {
  const { phoneNumber, callerId, context = 'from-internal', variables = {} } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'phoneNumber is required',
    });
  }

  try {
    // ARI経由で発信
    const channel = await ariClient.client.channels.originate({
      endpoint: `PJSIP/${phoneNumber}`,
      app: config.asterisk.appName,
      callerId: callerId || 'Unknown',
      variables,
    });

    logger.info('発信成功', { phoneNumber, channelId: channel.id });

    res.json({
      status: 'success',
      message: 'Call originated',
      channelId: channel.id,
      phoneNumber,
    });
  } catch (error) {
    logger.error('発信エラー', { phoneNumber, error: error.message });
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * Asterisk接続状態
 */
app.get('/api/asterisk/status', (req, res) => {
  res.json({
    status: 'success',
    connected: ariClient.connected,
    host: config.asterisk.host,
    ariPort: config.asterisk.ariPort,
    appName: config.asterisk.appName,
  });
});

// ==================== サーバー起動 ====================

/**
 * アプリケーション起動
 */
async function startServer() {
  try {
    // Asterisk ARIに接続
    logger.info('Asterisk ARIに接続中...');
    await ariClient.connect();

    // Stasisアプリケーションを起動
    await ariClient.startApplication();

    // HTTPサーバーを起動
    httpServer.listen(config.server.port, config.server.host, () => {
      logger.info(`サーバー起動完了`, {
        host: config.server.host,
        port: config.server.port,
        asteriskHost: config.asterisk.host,
        asteriskApp: config.asterisk.appName,
      });
    });
  } catch (error) {
    logger.error('サーバー起動エラー', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * グレースフルシャットダウン
 */
async function shutdown() {
  logger.info('シャットダウン処理開始...');

  try {
    // WebSocket接続をすべて閉じる
    wsManager.closeAll();

    // ARI接続を切断
    ariClient.disconnect();

    // HTTPサーバーを閉じる
    httpServer.close(() => {
      logger.info('HTTPサーバー停止完了');
      process.exit(0);
    });

    // 強制終了のタイムアウト
    setTimeout(() => {
      logger.warn('強制終了タイムアウト');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('シャットダウンエラー', { error: error.message });
    process.exit(1);
  }
}

// シグナルハンドラー
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 未処理エラーハンドラー
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  shutdown();
});

// サーバー起動
startServer();

