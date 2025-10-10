import { WebSocketServer, WebSocket } from 'ws';
import config from './config.js';
import logger from './logger.js';

class WebSocketManager {
  constructor() {
    this.frontendConnections = new Set();
    this.pythonConnections = new Map(); // callId -> WebSocket
    this.server = null;
  }

  /**
   * WebSocketサーバーを初期化
   */
  initialize(httpServer) {
    this.server = new WebSocketServer({ server: httpServer });

    this.server.on('connection', (ws, req) => {
      logger.info('WebSocket接続確立', { url: req.url });

      // フロントエンドからの接続
      if (req.url.startsWith('/ws/frontend')) {
        this.handleFrontendConnection(ws, req);
      }
      // モニタリング用の接続
      else if (req.url.startsWith('/ws/monitor')) {
        this.handleMonitorConnection(ws, req);
      }
      else {
        logger.warn('不明なWebSocket接続', { url: req.url });
        ws.close();
      }
    });

    logger.info('WebSocketサーバー初期化完了');
  }

  /**
   * フロントエンド接続の処理
   */
  handleFrontendConnection(ws, req) {
    this.frontendConnections.add(ws);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleFrontendMessage(ws, data);
      } catch (error) {
        logger.error('フロントエンドメッセージ処理エラー', { error: error.message });
      }
    });

    ws.on('close', () => {
      this.frontendConnections.delete(ws);
      logger.info('フロントエンド接続クローズ');
    });

    ws.on('error', (error) => {
      logger.error('フロントエンドWebSocketエラー', { error: error.message });
      this.frontendConnections.delete(ws);
    });

    // 接続確認メッセージ
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
    }));

    logger.info('フロントエンド接続登録完了');
  }

  /**
   * モニタリング接続の処理
   */
  handleMonitorConnection(ws, req) {
    // モニタリング専用の処理
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.debug('モニタリングメッセージ受信', { data });
      } catch (error) {
        logger.error('モニタリングメッセージ処理エラー', { error: error.message });
      }
    });

    ws.on('close', () => {
      logger.info('モニタリング接続クローズ');
    });

    logger.info('モニタリング接続登録完了');
  }

  /**
   * フロントエンドからのメッセージ処理
   */
  handleFrontendMessage(ws, data) {
    logger.debug('フロントエンドメッセージ', { type: data.type });

    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'join_call':
        // オペレーターが通話に参加
        this.handleOperatorJoin(data.callId, ws);
        break;

      case 'leave_call':
        // オペレーターが通話から退出
        this.handleOperatorLeave(data.callId, ws);
        break;

      default:
        logger.warn('不明なメッセージタイプ', { type: data.type });
    }
  }

  /**
   * オペレーター参加処理
   */
  async handleOperatorJoin(callId, ws) {
    logger.info('オペレーター参加リクエスト', { callId });

    // Python WebSocketに転送
    const pythonWs = this.pythonConnections.get(callId);
    if (pythonWs && pythonWs.readyState === WebSocket.OPEN) {
      pythonWs.send(JSON.stringify({
        type: 'operator_joined',
        callId,
        timestamp: new Date().toISOString(),
      }));
    }

    // フロントエンドに確認
    ws.send(JSON.stringify({
      type: 'join_call_success',
      callId,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * オペレーター退出処理
   */
  async handleOperatorLeave(callId, ws) {
    logger.info('オペレーター退出リクエスト', { callId });

    // Python WebSocketに転送
    const pythonWs = this.pythonConnections.get(callId);
    if (pythonWs && pythonWs.readyState === WebSocket.OPEN) {
      pythonWs.send(JSON.stringify({
        type: 'operator_left',
        callId,
        timestamp: new Date().toISOString(),
      }));
    }

    // フロントエンドに確認
    ws.send(JSON.stringify({
      type: 'leave_call_success',
      callId,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * PythonバックエンドへのWebSocket接続
   */
  async connectToPythonBackend(callId, channelId) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${config.pythonBackend.wsUrl}/ws/call/${callId}`;
      logger.info('PythonバックエンドWebSocket接続試行', { wsUrl, callId });

      const ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Bearer ${config.auth.backendToken}`,
        },
      });

      ws.on('open', () => {
        logger.info('PythonバックエンドWebSocket接続成功', { callId });
        this.pythonConnections.set(callId, ws);
        resolve(ws);
      });

      ws.on('message', (message) => {
        try {
          // Pythonバックエンドからの音声データやメッセージをAsteriskに転送
          this.handlePythonMessage(callId, channelId, message);
        } catch (error) {
          logger.error('Pythonメッセージ処理エラー', { error: error.message });
        }
      });

      ws.on('close', () => {
        logger.info('PythonバックエンドWebSocket切断', { callId });
        this.pythonConnections.delete(callId);
      });

      ws.on('error', (error) => {
        logger.error('PythonバックエンドWebSocketエラー', {
          callId,
          error: error.message,
        });
        this.pythonConnections.delete(callId);
        reject(error);
      });

      // タイムアウト設定（10秒）
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Pythonバックエンドからのメッセージ処理
   */
  handlePythonMessage(callId, channelId, message) {
    // バイナリデータ（音声）の場合
    if (Buffer.isBuffer(message)) {
      logger.debug('Python音声データ受信', {
        callId,
        size: message.length,
      });

      // TODO: 音声データをAsteriskチャンネルに送信
      // これにはARIのExternal Mediaまたはカスタムストリーム処理が必要

      // フロントエンドにも転送（モニタリング用）
      this.broadcastToFrontend({
        type: 'audio_data',
        callId,
        channelId,
        dataSize: message.length,
        timestamp: new Date().toISOString(),
      });
    }
    // JSONメッセージの場合
    else {
      try {
        const data = JSON.parse(message);
        logger.debug('Pythonメッセージ受信', { callId, type: data.type });

        // フロントエンドに転送
        this.broadcastToFrontend({
          ...data,
          callId,
          channelId,
        });
      } catch (error) {
        logger.error('Pythonメッセージパースエラー', { error: error.message });
      }
    }
  }

  /**
   * フロントエンドへのブロードキャスト
   */
  broadcastToFrontend(data) {
    const message = JSON.stringify(data);
    let successCount = 0;

    this.frontendConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          successCount++;
        } catch (error) {
          logger.error('フロントエンド送信エラー', { error: error.message });
        }
      }
    });

    logger.info('フロントエンドブロードキャスト', {
      type: data.type,
      recipients: successCount,
      totalConnections: this.frontendConnections.size,
    });
  }

  /**
   * 特定の通話のWebSocket接続を切断
   */
  async disconnectCall(callId) {
    const ws = this.pythonConnections.get(callId);
    if (ws) {
      ws.close();
      this.pythonConnections.delete(callId);
      logger.info('通話WebSocket切断', { callId });
    }
  }

  /**
   * すべての接続を切断
   */
  closeAll() {
    // フロントエンド接続を閉じる
    this.frontendConnections.forEach((ws) => {
      ws.close();
    });
    this.frontendConnections.clear();

    // Pythonバックエンド接続を閉じる
    this.pythonConnections.forEach((ws) => {
      ws.close();
    });
    this.pythonConnections.clear();

    logger.info('すべてのWebSocket接続を切断しました');
  }
}

export default WebSocketManager;

