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
  // CWA API Key - 正式環境從 Firebase App Hosting secrets 載入
  // 參見 apphosting.yaml 中的 CWA_API_KEY secret 設定
  CWA_API_KEY: 'CWA-8055E55C-EBCB-40A2-92F4-8A84399F3A45'
} as Environment & { firebaseMessagingPublicKey: string; CWA_API_KEY: string };
