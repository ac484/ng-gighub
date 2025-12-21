// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  interceptorFns: [mockInterceptor],
  firebaseMessagingPublicKey: 'BMfTfys7cErI2JVFmjkWSeCb7ClvFklQ4r69lWGIYT2dSq5VD2eguZlckvdq2QJhdGskeyUg0G6RcC8WmlBztFY',
  // CWA API Key - 開發環境請設定實際 API Key
  // 正式環境將從 Firebase App Hosting secrets 載入
  CWA_API_KEY: 'CWA-8055E55C-EBCB-40A2-92F4-8A84399F3A45' // 中央氣象署 API 授權碼
} as Environment & { firebaseMessagingPublicKey: string; CWA_API_KEY: string };
