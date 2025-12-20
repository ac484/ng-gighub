import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  // mock 已移除：不再注入 mockInterceptor
  firebaseMessagingPublicKey: 'BMfTfys7cErI2JVFmjkWSeCb7ClvFklQ4r69lWGIYT2dSq5VD2eguZlckvdq2QJhdGskeyUg0G6RcC8WmlBztFY'
} as Environment & { firebaseMessagingPublicKey: string };
