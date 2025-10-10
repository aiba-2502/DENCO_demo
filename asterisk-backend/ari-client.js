import ari from 'ari-client';
import config from './config.js';
import logger from './logger.js';
import EventEmitter from 'events';

class AriClient extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
  }

  /**
   * Asterisk ARIに接続
   */
  async connect() {
    try {
      const ariUrl = `http://${config.asterisk.host}:${config.asterisk.ariPort}`;
      const username = config.asterisk.ariUsername;
      const password = config.asterisk.ariPassword;
      
      logger.info('Asterisk ARIに接続中...', {
        url: ariUrl,
        username: username,
        passwordLength: password ? password.length : 0,
        appName: config.asterisk.appName,
      });

      this.client = await ari.connect(
        ariUrl,
        username,
        password
      );

      this.connected = true;
      this.reconnectAttempts = 0;

      logger.info('Asterisk ARIに接続成功');
      this.emit('connected', this.client);

      // イベントハンドラーの登録
      this.setupEventHandlers();

      return this.client;
    } catch (error) {
      logger.error('Asterisk ARI接続エラー', { 
        error: error.message,
        stack: error.stack,
        code: error.code,
        host: config.asterisk.host,
        port: config.asterisk.ariPort,
        username: config.asterisk.ariUsername
      });
      this.connected = false;
      this.emit('error', error);

      // 再接続試行
      await this.attemptReconnect();
      throw error;
    }
  }

  /**
   * 再接続を試行
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('最大再接続試行回数に達しました');
      return;
    }

    this.reconnectAttempts++;
    logger.warn(`${this.reconnectDelay / 1000}秒後に再接続を試行します (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // エラーは既にログ出力済み
      }
    }, this.reconnectDelay);
  }

  /**
   * ARIイベントハンドラーのセットアップ
   */
  setupEventHandlers() {
    if (!this.client) return;

    // Stasisアプリケーション起動イベント
    this.client.on('StasisStart', (event, channel) => {
      logger.info('Stasis開始', {
        channelId: channel.id,
        channelName: channel.name,
        caller: channel.caller.number,
      });
      this.emit('stasisStart', event, channel);
    });

    // Stasisアプリケーション終了イベント
    this.client.on('StasisEnd', (event, channel) => {
      logger.info('Stasis終了', {
        channelId: channel.id,
        channelName: channel.name,
      });
      this.emit('stasisEnd', event, channel);
    });

    // チャンネル状態変更イベント
    this.client.on('ChannelStateChange', (event, channel) => {
      logger.debug('チャンネル状態変更', {
        channelId: channel.id,
        state: channel.state,
      });
      this.emit('channelStateChange', event, channel);
    });

    // チャンネル破棄イベント
    this.client.on('ChannelDestroyed', (event, channel) => {
      logger.info('チャンネル破棄', {
        channelId: channel.id,
        cause: event.cause,
      });
      this.emit('channelDestroyed', event, channel);
    });

    // DTMFイベント
    this.client.on('ChannelDtmfReceived', (event, channel) => {
      logger.debug('DTMF受信', {
        channelId: channel.id,
        digit: event.digit,
      });
      this.emit('dtmfReceived', event, channel);
    });

    // 通話録音開始イベント
    this.client.on('RecordingStarted', (event, recording) => {
      logger.info('録音開始', {
        recordingName: recording.name,
      });
      this.emit('recordingStarted', event, recording);
    });

    // 通話録音終了イベント
    this.client.on('RecordingFinished', (event, recording) => {
      logger.info('録音終了', {
        recordingName: recording.name,
      });
      this.emit('recordingFinished', event, recording);
    });

    // エラーイベント
    this.client.on('error', (error) => {
      logger.error('ARI クライアントエラー', { error: error.message });
      this.connected = false;
      this.emit('error', error);
    });

    // WebSocket接続クローズイベント
    this.client.on('WebSocketReconnecting', () => {
      logger.warn('ARI WebSocket再接続中...');
      this.connected = false;
    });

    this.client.on('WebSocketConnected', () => {
      logger.info('ARI WebSocket接続成功');
      this.connected = true;
    });
  }

  /**
   * Stasisアプリケーションの開始
   */
  async startApplication() {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      // アプリケーションを起動（WebSocketサブスクリプション）
      // start()はPromiseを返すので、awaitで完了を待つ
      await this.client.start(config.asterisk.appName);
      logger.info(`Stasisアプリケーション起動: ${config.asterisk.appName}`);
    } catch (error) {
      logger.error('Stasisアプリケーション起動エラー', { error: error.message });
      throw error;
    }
  }

  /**
   * 接続を切断
   */
  disconnect() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
      this.connected = false;
      logger.info('ARI接続を切断しました');
    }
  }

  /**
   * チャンネルに応答
   */
  async answerChannel(channelId) {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const channel = this.client.Channel();
      await channel.answer({ channelId });
      logger.info('チャンネルに応答しました', { channelId });
      return true;
    } catch (error) {
      logger.error('チャンネル応答エラー', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * チャンネルを切断
   */
  async hangupChannel(channelId, reason = 'normal') {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const channel = this.client.Channel();
      await channel.hangup({ channelId, reason });
      logger.info('チャンネルを切断しました', { channelId, reason });
      return true;
    } catch (error) {
      logger.error('チャンネル切断エラー', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * 外部メディアチャンネルの作成（音声ストリーム用）
   */
  async createExternalMediaChannel(channelId, format = 'slin16') {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const channels = this.client.channels;
      const externalMedia = await channels.externalMedia({
        app: config.asterisk.appName,
        external_host: `${config.server.host}:${config.server.port}`,
        format: format,
        channelId: channelId,
      });

      logger.info('外部メディアチャンネル作成', {
        channelId,
        format,
      });

      return externalMedia;
    } catch (error) {
      logger.error('外部メディアチャンネル作成エラー', {
        channelId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 音声再生
   */
  async playAudio(channelId, mediaUri) {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const channel = this.client.Channel();
      const playback = await channel.play({
        channelId,
        media: mediaUri,
      });

      logger.info('音声再生開始', { channelId, mediaUri });
      return playback;
    } catch (error) {
      logger.error('音声再生エラー', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * 通話録音開始
   */
  async startRecording(channelId, recordingName, format = 'wav') {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const channel = this.client.Channel();
      const recording = await channel.record({
        channelId,
        name: recordingName,
        format,
        maxDurationSeconds: 3600,
        maxSilenceSeconds: 10,
        ifExists: 'overwrite',
        beep: false,
        terminateOn: 'none',
      });

      logger.info('録音開始', { channelId, recordingName, format });
      return recording;
    } catch (error) {
      logger.error('録音開始エラー', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * 通話録音停止
   */
  async stopRecording(recordingName) {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const recording = this.client.LiveRecording();
      await recording.stop({ recordingName });
      logger.info('録音停止', { recordingName });
      return true;
    } catch (error) {
      logger.error('録音停止エラー', { recordingName, error: error.message });
      throw error;
    }
  }

  /**
   * ブリッジの作成
   */
  async createBridge(bridgeId, type = 'mixing') {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const bridges = this.client.bridges;
      const bridge = await bridges.create({
        type,
        bridgeId,
      });

      logger.info('ブリッジ作成', { bridgeId, type });
      return bridge;
    } catch (error) {
      logger.error('ブリッジ作成エラー', { bridgeId, error: error.message });
      throw error;
    }
  }

  /**
   * チャンネルをブリッジに追加
   */
  async addChannelToBridge(bridgeId, channelId) {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const bridge = this.client.Bridge();
      await bridge.addChannel({ bridgeId, channel: channelId });
      logger.info('チャンネルをブリッジに追加', { bridgeId, channelId });
      return true;
    } catch (error) {
      logger.error('ブリッジ追加エラー', { bridgeId, channelId, error: error.message });
      throw error;
    }
  }

  /**
   * チャンネルをブリッジから削除
   */
  async removeChannelFromBridge(bridgeId, channelId) {
    if (!this.client) {
      throw new Error('ARI クライアントが初期化されていません');
    }

    try {
      const bridge = this.client.Bridge();
      await bridge.removeChannel({ bridgeId, channel: channelId });
      logger.info('チャンネルをブリッジから削除', { bridgeId, channelId });
      return true;
    } catch (error) {
      logger.error('ブリッジ削除エラー', { bridgeId, channelId, error: error.message });
      throw error;
    }
  }
}

export default AriClient;

