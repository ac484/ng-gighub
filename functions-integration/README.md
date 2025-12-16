# Functions Integration Module

## 📋 概述

`functions-integration` 模組負責處理與外部服務和第三方 API 的整合。提供統一的介面來與各種外部系統進行通訊,包括通知服務、支付系統、文件管理系統等。

## 🎯 目標

- **服務整合**: 統一管理所有第三方服務整合
- **錯誤處理**: 提供統一的錯誤處理和重試機制
- **資料同步**: 確保與外部系統的資料一致性
- **效能監控**: 追蹤和記錄所有外部 API 呼叫

## 📦 核心功能

### 1. Email 通知整合 (Email Notifications)

```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { validateAuth } from '../functions-shared';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export const sendEmail = onCall<SendEmailRequest>({
  region: 'asia-east1',
  enforceAppCheck: true
}, async (request) => {
  validateAuth(request);

  const { to, subject, body, templateId, variables } = request.data;

  logger.info('發送郵件', { to, subject });

  try {
    // 使用 SendGrid / Mailgun / AWS SES 等服務
    const emailService = getEmailService();
    
    const result = await emailService.send({
      to,
      subject,
      html: templateId ? renderTemplate(templateId, variables) : body,
      from: 'noreply@gighub.com'
    });

    logger.info('郵件發送成功', { messageId: result.messageId });

    return { 
      success: true, 
      messageId: result.messageId 
    };
  } catch (error) {
    logger.error('郵件發送失敗', error);
    throw new HttpsError('internal', '郵件發送失敗');
  }
});
```

### 2. SMS 通知整合 (SMS Notifications)

```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

export interface SendSMSRequest {
  phoneNumber: string;
  message: string;
}

export const sendSMS = onCall<SendSMSRequest>({
  region: 'asia-east1'
}, async (request) => {
  validateAuth(request);

  const { phoneNumber, message } = request.data;

  logger.info('發送簡訊', { phoneNumber });

  try {
    // 使用 Twilio / AWS SNS 等服務
    const smsService = getSMSService();
    
    const result = await smsService.send({
      to: phoneNumber,
      body: message,
      from: '+886912345678'
    });

    logger.info('簡訊發送成功', { sid: result.sid });

    return { 
      success: true, 
      sid: result.sid 
    };
  } catch (error) {
    logger.error('簡訊發送失敗', error);
    throw new HttpsError('internal', '簡訊發送失敗');
  }
});
```

### 3. Push Notification 整合

```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

export interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = onCall<SendPushRequest>({
  region: 'asia-east1'
}, async (request) => {
  validateAuth(request);

  const { userId, title, body, data } = request.data;

  logger.info('發送推播通知', { userId, title });

  try {
    // 取得使用者的 FCM Token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      throw new HttpsError('not-found', '使用者未註冊推播通知');
    }

    // 發送 FCM 訊息
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token: fcmToken
    };

    const response = await admin.messaging().send(message);

    logger.info('推播通知發送成功', { messageId: response });

    return { 
      success: true, 
      messageId: response 
    };
  } catch (error) {
    logger.error('推播通知發送失敗', error);
    throw new HttpsError('internal', '推播通知發送失敗');
  }
});
```

### 4. Cloud Storage 整合

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as path from 'path';

export const processUploadedFile = onObjectFinalized({
  bucket: 'gighub-uploads',
  region: 'asia-east1'
}, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  
  logger.info('處理上傳檔案', {
    filePath,
    contentType,
    size: event.data.size
  });

  try {
    const bucket = admin.storage().bucket(event.data.bucket);
    const file = bucket.file(filePath);

    // 根據檔案類型處理
    if (contentType?.startsWith('image/')) {
      // 生成縮圖
      await generateThumbnail(file);
    } else if (contentType === 'application/pdf') {
      // 提取文字內容
      await extractPDFText(file);
    }

    // 更新 Firestore 中的檔案狀態
    await updateFileStatus(filePath, 'processed');

    logger.info('檔案處理完成', { filePath });

    return { processed: true };
  } catch (error) {
    logger.error('檔案處理失敗', error);
    throw error;
  }
});

async function generateThumbnail(file: any) {
  // 使用 Sharp 或其他圖片處理庫
  logger.info('生成縮圖', { fileName: file.name });
}

async function extractPDFText(file: any) {
  // 使用 PDF 解析庫
  logger.info('提取 PDF 文字', { fileName: file.name });
}

async function updateFileStatus(filePath: string, status: string) {
  await admin.firestore()
    .collection('files')
    .doc(filePath)
    .update({ status, updatedAt: new Date() });
}
```

### 5. Webhook 接收整合

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const webhookReceiver = onRequest({
  region: 'asia-east1',
  cors: true
}, async (request, response) => {
  // 驗證 Webhook 簽名
  const signature = request.headers['x-webhook-signature'];
  
  if (!verifyWebhookSignature(request.body, signature as string)) {
    logger.warn('無效的 Webhook 簽名');
    response.status(401).send('Unauthorized');
    return;
  }

  const eventType = request.body.type;
  const data = request.body.data;

  logger.info('收到 Webhook 事件', { eventType });

  try {
    switch (eventType) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      default:
        logger.warn('未處理的事件類型', { eventType });
    }

    response.json({ received: true });
  } catch (error) {
    logger.error('Webhook 處理失敗', error);
    response.status(500).json({ error: 'Processing failed' });
  }
});

function verifyWebhookSignature(body: any, signature: string): boolean {
  // 實作簽名驗證邏輯
  return true;
}

async function handlePaymentSucceeded(data: any) {
  logger.info('處理支付成功事件', data);
  // 更新訂單狀態
}

async function handleUserUpdated(data: any) {
  logger.info('處理使用者更新事件', data);
  // 同步使用者資料
}
```

## 📂 目錄結構

```
functions-integration/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── notifications/        # 通知服務
│   │   ├── email.ts
│   │   ├── sms.ts
│   │   └── push.ts
│   ├── storage/              # 檔案處理
│   │   ├── image-processor.ts
│   │   └── pdf-processor.ts
│   ├── webhooks/             # Webhook 接收
│   │   └── webhook-handler.ts
│   └── services/             # 外部服務客戶端
│       ├── email-service.ts
│       ├── sms-service.ts
│       └── payment-service.ts
└── tests/
    └── integration.test.ts
```

## 🚀 設定與部署

### 1. 環境變數設定

```bash
# 設定第三方服務 API Keys
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set STRIPE_SECRET_KEY
```

### 2. 本地測試

```bash
cd functions-integration
npm install
npm run build
npm run serve
```

### 3. 部署

```bash
firebase deploy --only functions:integration
```

## 🔐 安全性配置

### API Key 管理

```typescript
import { defineSecret } from 'firebase-functions/params';

const sendgridKey = defineSecret('SENDGRID_API_KEY');
const twilioToken = defineSecret('TWILIO_AUTH_TOKEN');

export const secureFunction = onCall({
  secrets: [sendgridKey, twilioToken]
}, async (request) => {
  const apiKey = sendgridKey.value();
  // 使用 API Key
});
```

### Webhook 簽名驗證

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 🧪 測試

### 單元測試

```bash
npm test
```

### Webhook 測試

```bash
# 使用 ngrok 建立測試通道
ngrok http 5001

# 使用 curl 測試 Webhook
curl -X POST http://localhost:5001/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature" \
  -d '{"type": "payment.succeeded", "data": {}}'
```

## 📊 監控與日誌

### 追蹤外部 API 呼叫

```typescript
async function trackAPICall(
  service: string,
  endpoint: string,
  duration: number,
  success: boolean
) {
  await admin.firestore()
    .collection('api_metrics')
    .add({
      service,
      endpoint,
      duration,
      success,
      timestamp: new Date()
    });
}
```

## 🔧 故障排除

### 常見問題

1. **API 呼叫失敗**
   - 檢查 API Key 是否正確
   - 驗證網路連線
   - 查看外部服務狀態

2. **Webhook 未收到**
   - 確認 Webhook URL 正確
   - 檢查防火牆設定
   - 驗證簽名配置

3. **檔案處理逾時**
   - 增加函式逾時時間
   - 使用非同步處理
   - 實作重試機制

## 📚 參考資源

- [Firebase Cloud Functions 文檔](https://firebase.google.com/docs/functions)
- [SendGrid API 文檔](https://docs.sendgrid.com/)
- [Twilio API 文檔](https://www.twilio.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎整合功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
