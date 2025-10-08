import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Asterisk ARI設定
  asterisk: {
    host: process.env.ASTERISK_HOST || '192.168.1.100',
    ariPort: parseInt(process.env.ASTERISK_ARI_PORT) || 8088,
    ariUsername: process.env.ASTERISK_ARI_USERNAME || 'ariuser',
    ariPassword: process.env.ASTERISK_ARI_PASSWORD || 'arisecret',
    appName: process.env.ASTERISK_APP_NAME || 'denco_voiceai',
  },

  // Node.jsサーバー設定
  server: {
    port: parseInt(process.env.NODE_SERVER_PORT) || 3001,
    host: process.env.NODE_SERVER_HOST || '0.0.0.0',
  },

  // Pythonバックエンド連携
  pythonBackend: {
    url: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
    wsUrl: process.env.PYTHON_BACKEND_WS_URL || 'ws://localhost:8000',
  },

  // フロントエンド連携
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  // 認証
  auth: {
    backendToken: process.env.BACKEND_AUTH_TOKEN || 'your-secure-backend-token-here',
  },

  // 音声設定
  audio: {
    format: process.env.AUDIO_FORMAT || 'slin16',
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE) || 16000,
  },

  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;

