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
  cwa: {
    apiKey: 'CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // Replace with actual CWA API Key from environment variable
    baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
  }
} as Environment & { firebaseMessagingPublicKey: string; cwa: { apiKey: string; baseUrl: string } };
