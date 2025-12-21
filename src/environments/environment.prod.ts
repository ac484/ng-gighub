import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  firebaseMessagingPublicKey: 'BMfTfys7cErI2JVFmjkWSeCb7ClvFklQ4r69lWGIYT2dSq5VD2eguZlckvdq2QJhdGskeyUg0G6RcC8WmlBztFY',
  CWA_API_KEY: '' // 中央氣象署 API 授權碼 (從環境變數注入)
} as Environment & { firebaseMessagingPublicKey: string; CWA_API_KEY: string };
