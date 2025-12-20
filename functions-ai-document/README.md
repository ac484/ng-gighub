# Firebase Document AI Functions

Enterprise-standard document processing using Google Cloud Document AI with Firebase Functions v2.

## Overview

This Firebase Cloud Function provides automated document processing capabilities using Google Cloud's Document AI service. It supports OCR, text extraction, entity recognition, and form field extraction for various document types.

### Features

- **Single Document Processing**: Process individual documents from Cloud Storage or raw content
- **Batch Document Processing**: Process multiple documents in a single operation
- **Multiple Document Types**: Support for PDF, images (JPEG, PNG, GIF, BMP, TIFF, WebP)
- **Comprehensive Extraction**:
  - Text extraction with OCR
  - Entity extraction (if processor supports it)
  - Form field extraction (if processor supports it)
  - Page-level information
- **Enterprise Standards**:
  - Structured logging and monitoring
  - Error handling with retries
  - Security validation
  - Audit trail in Firestore
  - Type-safe TypeScript implementation
- **Zero Configuration for Authentication**:
  - Automatic authentication via Application Default Credentials (ADC)
  - No service account setup required
  - Project ID automatically detected from Firebase runtime
  - Only 2 environment values needed: processor location and processor ID

## Prerequisites

1. **Google Cloud Project** with Document AI API enabled
2. **Document AI Processor** created in Cloud Console
3. **Firebase Project** with Cloud Functions enabled
4. **Cloud Storage bucket** for document storage (for batch processing)

**Note**: When deployed to Firebase Cloud Functions, authentication is automatic through Application Default Credentials (ADC). No service account configuration or project ID setup is needed - the Firebase runtime handles this automatically.

## Setup Instructions

### 1. Enable Document AI API

```bash
# Enable Document AI API in your Google Cloud project
gcloud services enable documentai.googleapis.com --project=YOUR_PROJECT_ID
```

### 2. Create a Document AI Processor

1. Go to [Document AI Console](https://console.cloud.google.com/ai/document-ai/processors)
2. Click "Create Processor"
3. Select processor type (e.g., "Form Parser", "OCR Processor", "Invoice Parser")
4. Choose your location (e.g., "us" or "eu")
5. Note the **Processor ID** and **Location** - you'll need these

### 3. Configure Environment Variables

Set the required values using Firebase runtime config or `.env` files. These are the **only** configuration values needed - authentication and project ID are handled automatically by Firebase Cloud Functions.

```bash
# Set processor location (e.g., 'us', 'eu', 'asia-east1')
firebase functions:config:set documentai.location="us"

# Set processor ID from Cloud Console
firebase functions:config:set documentai.processor_id="abc123def456"
```

**Important**: When prompted, enter the values you noted from step 2.

Example `.env` file (stored at `functions-ai-document/.env`):
```bash
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=abc123def456
```

**Authentication Note**: Firebase Cloud Functions automatically use Application Default Credentials (ADC) for Google Cloud API authentication. No service account keys, credentials files, or project ID environment variables need to be configured manually.

### 4. Verify Configuration

```bash
# List all runtime config values
firebase functions:config:get documentai
```

### 5. Deploy Functions

```bash
cd functions-ai-document
npm install
npm run build
firebase deploy --only functions:processDocumentFromStorage,functions:processDocumentFromContent,functions:batchProcessDocuments
```

## Usage

### 1. Process Document from Cloud Storage

Process a document stored in Cloud Storage.

#### Request Format

```typescript
interface ProcessDocumentFromStorageRequest {
  gcsUri: string;              // GCS URI (e.g., 'gs://bucket/path/file.pdf')
  mimeType: string;            // MIME type (e.g., 'application/pdf')
  skipHumanReview?: boolean;   // Optional, default: true
  fieldMask?: string;          // Optional, fields to return
}
```

#### Example: JavaScript/TypeScript

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const processDocument = httpsCallable(functions, 'processDocumentFromStorage');

const result = await processDocument({
  gcsUri: 'gs://my-bucket/documents/invoice.pdf',
  mimeType: 'application/pdf',
  skipHumanReview: true
});

console.log('Processing result:', result.data);
// {
//   success: true,
//   result: {
//     text: "Extracted text content...",
//     pages: [...],
//     entities: [...],
//     formFields: [...],
//     metadata: {
//       processorVersion: "...",
//       processingTime: 1234,
//       pageCount: 1,
//       mimeType: "application/pdf"
//     }
//   }
// }
```

#### Example: cURL

```bash
# Get your Firebase project URL
export PROJECT_ID="your-project-id"
export REGION="asia-east1"
export FUNCTION_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/processDocumentFromStorage"

# Get Firebase ID token (requires authentication)
export ID_TOKEN="your-firebase-id-token"

curl -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "data": {
      "gcsUri": "gs://my-bucket/documents/invoice.pdf",
      "mimeType": "application/pdf",
      "skipHumanReview": true
    }
  }'
```

#### Example: Python

```python
import requests
import json

def process_document_from_storage(id_token, gcs_uri, mime_type):
    url = f"https://asia-east1-{PROJECT_ID}.cloudfunctions.net/processDocumentFromStorage"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {id_token}"
    }
    payload = {
        "data": {
            "gcsUri": gcs_uri,
            "mimeType": mime_type,
            "skipHumanReview": True
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()

# Usage
result = process_document_from_storage(
    id_token="your-firebase-id-token",
    gcs_uri="gs://my-bucket/documents/invoice.pdf",
    mime_type="application/pdf"
)
print(result)
```

### 2. Process Document from Raw Content

Process a document from base64-encoded content.

#### Request Format

```typescript
interface ProcessDocumentFromContentRequest {
  content: string;             // Base64 encoded document content
  mimeType: string;            // MIME type (e.g., 'application/pdf')
  skipHumanReview?: boolean;   // Optional, default: true
  fieldMask?: string;          // Optional, fields to return
}
```

#### Example: JavaScript/TypeScript

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { readFileSync } from 'fs';

const functions = getFunctions();
const processDocument = httpsCallable(functions, 'processDocumentFromContent');

// Read file and convert to base64
const fileBuffer = readFileSync('./invoice.pdf');
const base64Content = fileBuffer.toString('base64');

const result = await processDocument({
  content: base64Content,
  mimeType: 'application/pdf',
  skipHumanReview: true
});

console.log('Processing result:', result.data);
```

#### Example: Python

```python
import base64

def process_document_from_content(id_token, file_path, mime_type):
    url = f"https://asia-east1-{PROJECT_ID}.cloudfunctions.net/processDocumentFromContent"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {id_token}"
    }
    
    # Read file and encode to base64
    with open(file_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    payload = {
        "data": {
            "content": content,
            "mimeType": mime_type,
            "skipHumanReview": True
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()

# Usage
result = process_document_from_content(
    id_token="your-firebase-id-token",
    file_path="./invoice.pdf",
    mime_type="application/pdf"
)
print(result)
```

### 3. Batch Process Documents

Process multiple documents in a single batch operation.

#### Request Format

```typescript
interface BatchProcessDocumentsRequest {
  inputDocuments: Array<{
    gcsUri: string;
    mimeType: string;
  }>;
  outputGcsUri: string;        // GCS URI prefix for output (e.g., 'gs://bucket/output/')
  skipHumanReview?: boolean;   // Optional, default: true
}
```

#### Example: JavaScript/TypeScript

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const batchProcess = httpsCallable(functions, 'batchProcessDocuments');

const result = await batchProcess({
  inputDocuments: [
    {
      gcsUri: 'gs://my-bucket/documents/invoice1.pdf',
      mimeType: 'application/pdf'
    },
    {
      gcsUri: 'gs://my-bucket/documents/invoice2.pdf',
      mimeType: 'application/pdf'
    },
    {
      gcsUri: 'gs://my-bucket/images/receipt.jpg',
      mimeType: 'image/jpeg'
    }
  ],
  outputGcsUri: 'gs://my-bucket/output/',
  skipHumanReview: true
});

console.log('Batch operation started:', result.data);
// {
//   success: true,
//   result: {
//     operationName: "projects/.../operations/...",
//     status: "pending",
//     outputGcsUri: "gs://my-bucket/output/",
//     totalDocuments: 3,
//     metadata: {
//       startTime: "2024-01-15T10:00:00Z"
//     }
//   }
// }

// Results will be written to: gs://my-bucket/output/
// Each document's results will be in a separate JSON file
```

#### Example: Python

```python
def batch_process_documents(id_token, input_docs, output_uri):
    url = f"https://asia-east1-{PROJECT_ID}.cloudfunctions.net/batchProcessDocuments"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {id_token}"
    }
    payload = {
        "data": {
            "inputDocuments": input_docs,
            "outputGcsUri": output_uri,
            "skipHumanReview": True
        }
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    return response.json()

# Usage
result = batch_process_documents(
    id_token="your-firebase-id-token",
    input_docs=[
        {
            "gcsUri": "gs://my-bucket/documents/invoice1.pdf",
            "mimeType": "application/pdf"
        },
        {
            "gcsUri": "gs://my-bucket/documents/invoice2.pdf",
            "mimeType": "application/pdf"
        }
    ],
    output_uri="gs://my-bucket/output/"
)
print(result)
```

## Authentication

All functions require Firebase Authentication. You must include a valid Firebase ID token in the request.

### Getting an ID Token

#### Web/JavaScript

```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const idToken = await user.getIdToken();
  // Use idToken in your function calls
}
```

#### Python (using Firebase Admin SDK)

```python
from firebase_admin import auth

# Verify and decode ID token
decoded_token = auth.verify_id_token(id_token)
uid = decoded_token['uid']
```

#### cURL

```bash
# Get ID token using Firebase Auth REST API
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password",
    "returnSecureToken": true
  }' | jq -r '.idToken'
```

## Response Format

### Success Response

```typescript
{
  success: true,
  result: {
    text: string;                    // Extracted text from the document
    pages?: Array<{
      pageNumber: number;
      width: number;
      height: number;
      paragraphs?: string[];
    }>;
    entities?: Array<{              // Extracted entities (if processor supports)
      type: string;
      mentionText: string;
      confidence?: number;
      normalizedValue?: string;
    }>;
    formFields?: Array<{            // Form fields (if processor supports)
      fieldName: string;
      fieldValue: string;
      confidence?: number;
    }>;
    metadata: {
      processorVersion: string;
      processingTime: number;       // In milliseconds
      pageCount: number;
      mimeType: string;
    }
  }
}
```

### Error Response

```typescript
{
  error: {
    code: string;                   // Error code (e.g., 'invalid-argument')
    message: string;                // Human-readable error message
    details?: any;                  // Additional error details
  }
}
```

## Supported Document Types

| MIME Type | Extension | Description |
|-----------|-----------|-------------|
| `application/pdf` | .pdf | PDF documents |
| `image/jpeg` | .jpg, .jpeg | JPEG images |
| `image/png` | .png | PNG images |
| `image/gif` | .gif | GIF images |
| `image/bmp` | .bmp | BMP images |
| `image/tiff` | .tiff, .tif | TIFF images |
| `image/webp` | .webp | WebP images |

## Limitations

- **Document Size**: Maximum 32MB per document (Document AI limit)
- **Batch Processing**: Maximum 500 documents per batch
- **Processing Time**: Functions have a 540-second (9 minutes) timeout
- **Concurrent Requests**: Limited by Firebase Functions quotas
- **Storage**: Documents must be in Cloud Storage for batch processing

## Monitoring and Logging

### Audit Trail

All document processing operations are logged to Firestore in the `documentai_events` collection:

```typescript
{
  eventType: 'process_document' | 'batch_process',
  documentPath: string,
  mimeType: string,
  status: 'success' | 'failed' | 'pending',
  timestamp: Timestamp,
  errorMessage?: string,
  userId?: string,
  duration?: number,
  metadata?: object,
  processorInfo: {
    processorId: string,
    location: string,
    projectId: string
  }
}
```

### Cloud Functions Logs

View function logs in Firebase Console:
```bash
firebase functions:log --only processDocumentFromStorage
```

Or in Google Cloud Console:
```
https://console.cloud.google.com/logs/query
```

### Performance Metrics

Monitor function performance:
- Execution time
- Memory usage
- Error rate
- Success rate

## Error Handling

The functions implement comprehensive error handling:

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `invalid-argument` | Invalid request parameters | Check request format and values |
| `failed-precondition` | Missing configuration values | Ensure required environment variables are set |
| `permission-denied` | Authentication failure | Provide valid Firebase ID token |
| `not-found` | Document or resource not found | Verify GCS URI exists |
| `resource-exhausted` | Rate limit exceeded | Implement retry with exponential backoff |
| `internal` | Internal server error | Check function logs for details |

## Security Best Practices

1. **Authentication**: Always require Firebase Authentication
2. **Configuration Management**: Use Firebase Functions runtime config or `.env` files for non-sensitive settings; reserve Secrets for sensitive data
3. **Access Control**: Implement proper IAM roles and permissions
4. **Input Validation**: Validate all input parameters
5. **Audit Logging**: Monitor all processing operations
6. **Rate Limiting**: Implement rate limiting for production use

## Cost Optimization

1. **Use Batch Processing**: Process multiple documents together
2. **Enable Caching**: Cache processing results when appropriate
3. **Optimize Document Size**: Compress documents before processing
4. **Use Field Masks**: Request only needed fields
5. **Monitor Usage**: Track Document AI API usage and costs

## Troubleshooting

### Common Issues

**Issue**: "Missing required environment variable: DOCUMENTAI_LOCATION"
```bash
# Solution: Set the value using runtime config or .env
firebase functions:config:set documentai.location="us"
```

**Issue**: "Invalid GCS URI format"
```bash
# Solution: Ensure URI starts with 'gs://'
# Correct: gs://my-bucket/path/to/file.pdf
# Incorrect: my-bucket/path/to/file.pdf
```

**Issue**: "Unsupported MIME type"
```bash
# Solution: Use supported MIME types listed above
# Example: 'application/pdf' for PDF files
```

**Issue**: "Document size exceeds maximum"
```bash
# Solution: Compress document or split into smaller files
# Maximum size: 32MB
```

**Issue**: "Authentication or permissions error"
```bash
# Solution: Firebase Cloud Functions automatically use Application Default 
# Credentials (ADC). If you encounter auth errors:
# 1. Ensure Document AI API is enabled in your Google Cloud project
# 2. Verify your Firebase project has billing enabled
# 3. Check that the processor exists and is in the correct location
# No manual service account or credential configuration is needed
```

## Support

For issues and questions:
- Check [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- Review [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- Open an issue in the repository

## License

Copyright © 2024. All rights reserved.
