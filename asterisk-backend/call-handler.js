import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import config from './config.js';
import logger from './logger.js';

class CallHandler {
  constructor(ariClient, wsManager) {
    this.ariClient = ariClient;
    this.wsManager = wsManager;
    this.activeCalls = new Map();
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーのセットアップ
   */
  setupEventHandlers() {
    // 通話開始イベント
    this.ariClient.on('stasisStart', async (event, channel) => {
      await this.handleIncomingCall(event, channel);
    });

    // 通話終了イベント
    this.ariClient.on('stasisEnd', async (event, channel) => {
      await this.handleCallEnd(event, channel);
    });

    // チャンネル破棄イベント
    this.ariClient.on('channelDestroyed', async (event, channel) => {
      await this.handleCallEnd(event, channel);
    });

    // DTMFイベント
    this.ariClient.on('dtmfReceived', async (event, channel) => {
      await this.handleDtmf(event, channel);
    });
  }

  /**
   * 着信処理
   */
  async handleIncomingCall(event, channel) {
    const channelId = channel.id;
    const callerNumber = channel.caller.number || 'Unknown';
    const calledNumber = channel.dialplan?.exten || 'unknown';

    logger.info('着信処理開始', {
      channelId,
      callerNumber,
      calledNumber,
    });

    // 通話セッションIDの生成
    const callId = uuidv4();

    // まず通話情報を保存（Pythonバックエンドなしでも動作）
    this.activeCalls.set(channelId, {
      callId,
      channelId,
      callerNumber,
      calledNumber,
      startTime: new Date(),
      sessionData: null,
      status: 'ringing',
    });

    // フロントエンドに通話開始を通知（最優先）
    this.wsManager.broadcastToFrontend({
      type: 'call_started',
      callId,
      channelId,
      callerNumber,
      calledNumber,
      timestamp: new Date().toISOString(),
    });

    logger.info('着信通知送信完了', { callId, channelId });

    try {
      // チャンネルに応答
      await this.ariClient.answerChannel(channelId);

      // ステータスを更新
      const callInfo = this.activeCalls.get(channelId);
      callInfo.status = 'answered';
      this.activeCalls.set(channelId, callInfo);

      // Pythonバックエンドに通話セッション作成リクエスト（オプショナル）
      try {
        const sessionData = await this.createCallSession(callId, callerNumber, calledNumber);
        callInfo.sessionData = sessionData;
        this.activeCalls.set(channelId, callInfo);

        // WebSocket接続をPythonバックエンドに確立
        await this.establishPythonWebSocket(callId, channelId);

        logger.info('Pythonバックエンド連携成功', { callId, channelId });
      } catch (backendError) {
        logger.warn('Pythonバックエンド連携スキップ（起動していない可能性）', {
          callId,
          channelId,
          error: backendError.message,
        });
        // Pythonバックエンドのエラーは致命的ではないので続行
      }

      logger.info('着信処理完了', { callId, channelId });
    } catch (error) {
      logger.error('着信処理エラー', {
        channelId,
        error: error.message,
        stack: error.stack,
      });

      // エラー時はチャンネルを切断
      try {
        await this.ariClient.hangupChannel(channelId, 'congestion');
      } catch (hangupError) {
        logger.error('チャンネル切断エラー', { channelId, error: hangupError.message });
      }
    }
  }

  /**
   * Pythonバックエンドに通話セッションを作成
   */
  async createCallSession(callId, fromNumber, toNumber) {
    try {
      const response = await axios.post(
        `${config.pythonBackend.url}/api/calls`,
        {
          call_id: callId,
          from_number: fromNumber,
          to_number: toNumber,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.auth.backendToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('通話セッション作成成功', { callId });
      return response.data;
    } catch (error) {
      logger.error('通話セッション作成エラー', {
        callId,
        error: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * PythonバックエンドとのWebSocket接続を確立
   */
  async establishPythonWebSocket(callId, channelId) {
    try {
      // WebSocketマネージャーを通じてPythonバックエンドに接続
      await this.wsManager.connectToPythonBackend(callId, channelId);
      logger.info('PythonバックエンドWebSocket接続成功', { callId, channelId });
    } catch (error) {
      logger.error('PythonバックエンドWebSocket接続エラー', {
        callId,
        channelId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 挨拶メッセージの再生
   */
  async playGreeting(channelId, tenantId) {
    try {
      // Pythonバックエンドから挨拶メッセージを取得
      const response = await axios.get(
        `${config.pythonBackend.url}/api/tenants/${tenantId}/greeting`,
        {
          headers: {
            'Authorization': `Bearer ${config.auth.backendToken}`,
          },
        }
      );

      const greetingUri = response.data.greeting_uri;

      if (greetingUri) {
        await this.ariClient.playAudio(channelId, greetingUri);
        logger.info('挨拶メッセージ再生', { channelId, greetingUri });
      }
    } catch (error) {
      logger.warn('挨拶メッセージ再生スキップ', { channelId, error: error.message });
      // 挨拶メッセージのエラーは致命的ではないので続行
    }
  }

  /**
   * 通話終了処理
   */
  async handleCallEnd(event, channel) {
    const channelId = channel.id;
    const callInfo = this.activeCalls.get(channelId);

    if (!callInfo) {
      logger.debug('通話情報が見つかりません', { channelId });
      return;
    }

    logger.info('通話終了処理開始', {
      callId: callInfo.callId,
      channelId,
      duration: new Date() - callInfo.startTime,
    });

    try {
      // WebSocket接続をクローズ
      await this.wsManager.disconnectCall(callInfo.callId);

      // Pythonバックエンドに通話終了を通知
      await this.notifyCallEnd(callInfo);

      // フロントエンドに通話終了を通知
      this.wsManager.broadcastToFrontend({
        type: 'call_ended',
        callId: callInfo.callId,
        channelId,
        duration: new Date() - callInfo.startTime,
        timestamp: new Date().toISOString(),
      });

      // 通話情報を削除
      this.activeCalls.delete(channelId);

      logger.info('通話終了処理完了', { callId: callInfo.callId, channelId });
    } catch (error) {
      logger.error('通話終了処理エラー', {
        channelId,
        error: error.message,
      });
    }
  }

  /**
   * Pythonバックエンドに通話終了を通知
   */
  async notifyCallEnd(callInfo) {
    try {
      await axios.post(
        `${config.pythonBackend.url}/api/calls/${callInfo.callId}/end`,
        {
          end_time: new Date().toISOString(),
          duration: new Date() - callInfo.startTime,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.auth.backendToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('通話終了通知成功', { callId: callInfo.callId });
    } catch (error) {
      logger.error('通話終了通知エラー', {
        callId: callInfo.callId,
        error: error.message,
      });
    }
  }

  /**
   * DTMF処理
   */
  async handleDtmf(event, channel) {
    const channelId = channel.id;
    const digit = event.digit;
    const callInfo = this.activeCalls.get(channelId);

    if (!callInfo) {
      return;
    }

    logger.info('DTMF受信', {
      callId: callInfo.callId,
      channelId,
      digit,
    });

    // DTMFをPythonバックエンドに転送
    try {
      await axios.post(
        `${config.pythonBackend.url}/api/calls/${callInfo.callId}/dtmf`,
        { digit },
        {
          headers: {
            'Authorization': `Bearer ${config.auth.backendToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      logger.error('DTMF転送エラー', { error: error.message });
    }

    // フロントエンドにも通知
    this.wsManager.broadcastToFrontend({
      type: 'dtmf_received',
      callId: callInfo.callId,
      channelId,
      digit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * アクティブな通話一覧を取得
   */
  getActiveCalls() {
    const calls = [];
    this.activeCalls.forEach((callInfo) => {
      calls.push({
        callId: callInfo.callId,
        channelId: callInfo.channelId,
        callerNumber: callInfo.callerNumber,
        calledNumber: callInfo.calledNumber,
        status: callInfo.status,
        startTime: callInfo.startTime,
        duration: new Date() - callInfo.startTime,
      });
    });
    return calls;
  }

  /**
   * 特定の通話を切断
   */
  async disconnectCall(callId) {
    // callIdから通話情報を検索
    let targetChannelId = null;
    this.activeCalls.forEach((callInfo, channelId) => {
      if (callInfo.callId === callId) {
        targetChannelId = channelId;
      }
    });

    if (!targetChannelId) {
      throw new Error(`Call not found: ${callId}`);
    }

    logger.info('通話切断リクエスト', { callId, channelId: targetChannelId });
    await this.ariClient.hangupChannel(targetChannelId, 'normal');
  }
}

export default CallHandler;

