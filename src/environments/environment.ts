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
  cwa: {
    apiKey: 'CWB-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // Replace with actual CWA API Key
    baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
  }
} as Environment & { firebaseMessagingPublicKey: string; cwa: { apiKey: string; baseUrl: string } };
