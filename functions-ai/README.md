# GigHub AI Functions - Enterprise Google GenAI Integration

Enterprise-grade Google GenAI implementation using the latest `@google/genai` v1.34.0 SDK with best practices for production deployment.

## 🌟 Features

- **Dual API Support**: Works with both Gemini Developer API and Vertex AI
- **Auto-Configuration**: Environment variable-based setup with intelligent defaults
- **Streaming Responses**: Real-time content generation with `generateContentStream`
- **Function Calling**: Tool integration for extended functionality (ready for implementation)
- **Enterprise Error Handling**: Comprehensive error management with automatic exponential backoff retry
- **Type Safety**: Full TypeScript support with detailed interfaces
- **Monitoring**: Built-in usage metrics and performance tracking
- **Security**: Proper authentication, rate limiting, and credential management
- **Cost Control**: Configurable instance limits and timeouts

## 🏗️ Architecture

```
functions-ai/
├── src/
│   ├── config/              # Configuration management
│   │   └── genai.config.ts  # Auto-config from environment
│   ├── services/            # Business logic
│   │   └── genai.service.ts # Core GenAI service
│   ├── functions/           # Cloud Functions
│   │   └── genai.functions.ts # HTTP/Callable endpoints
│   ├── types/               # TypeScript types
│   │   └── genai.types.ts   # Type definitions
│   ├── utils/               # Utilities
│   │   └── genai.utils.ts   # Error handling, retry, metrics
│   └── index.ts             # Function exports
├── lib/                     # Compiled output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22
- Firebase CLI
- Google Cloud Project (for Vertex AI) or Gemini API Key

### Installation

```bash
cd functions-ai
npm install
```

### Configuration

Choose one of two authentication methods:

#### Option 1: Gemini Developer API (Development)

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set environment variable:

```bash
export GOOGLE_API_KEY='your-api-key-here'
```

#### Option 2: Vertex AI (Production)

1. Enable Vertex AI API in Google Cloud Console
2. Authenticate:

```bash
gcloud auth application-default login
```

3. Set environment variables:

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT='your-project-id'
export GOOGLE_CLOUD_LOCATION='us-central1'
```

### Local Development

```bash
# Build TypeScript
npm run build

# Start Firebase Emulators
firebase emulators:start --only functions

# Test endpoint
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/genai-generateText \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!"}'
```

### Deployment

```bash
# Deploy all functions
firebase deploy --only functions:genai

# Deploy specific function
firebase deploy --only functions:genai-generateContent
```

## 📡 Available Cloud Functions

### 1. `genai-generateContent` (Callable)

Authenticated endpoint for content generation with full control.

```typescript
// Client SDK
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateContent = httpsCallable(functions, 'genai-generateContent');

const result = await generateContent({
  prompt: "Write a poem about the ocean",
  model: "gemini-2.5-flash",
  config: {
    maxOutputTokens: 500,
    temperature: 0.9
  }
});

console.log(result.data.data.text);
```

### 2. `genai-generateText` (HTTP)

Simple text generation endpoint.

```bash
curl -X POST https://REGION-PROJECT.cloudfunctions.net/genai-generateText \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "config": { "maxOutputTokens": 200 }
  }'
```

### 3. `genai-generateStream` (HTTP)

Streaming generation with Server-Sent Events.

```javascript
const eventSource = new EventSource(/* POST to streaming endpoint */);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.text) console.log(data.text);
  if (data.done) eventSource.close();
};
```

### 4. `genai-health` (HTTP)

Health check endpoint.

```bash
curl https://REGION-PROJECT.cloudfunctions.net/genai-health
```

### 5. `genai-models` (HTTP)

List available models and configuration.

```bash
curl https://REGION-PROJECT.cloudfunctions.net/genai-models
```

## 🔧 Environment Variables

### Required (Gemini API)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Gemini API key | `AIzaSy...` |

### Required (Vertex AI)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_GENAI_USE_VERTEXAI` | Enable Vertex AI | `true` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | `my-project-123` |
| `GOOGLE_CLOUD_LOCATION` | GCP Region | `us-central1` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_VERSION` | API version | `v1beta` |
| `GENAI_TIMEOUT` | Timeout (ms) | `60000` |

## 💡 Key Implementation Details

### Auto-Configuration

The service automatically detects whether to use Gemini API or Vertex AI based on environment variables:

```typescript
// Automatically initialized from environment
const service = GenAIService.getInstance();

// Or get configuration details
const config = getGenAIConfig();
console.log(config.getConfigSummary());
```

### Error Handling with Retry

All operations include automatic retry with exponential backoff:

```typescript
// Automatically retries transient errors
try {
  const response = await service.generateContent(request);
} catch (error) {
  // Only non-retryable errors are thrown
  console.error(error.type, error.message);
}
```

### Metrics and Monitoring

Every operation is logged with comprehensive metrics:

```javascript
// Automatic logging includes:
// - Request ID for tracing
// - Model and operation type
// - Duration and token usage
// - Success/failure status

firebase functions:log  // View all logs
```

## 🛡️ Security Best Practices

1. **API Keys**: Never commit keys to source control
2. **Authentication**: Enable Firebase Auth for callable functions
3. **Rate Limiting**: Configure `maxInstances` to prevent abuse
4. **Input Validation**: All inputs validated before processing
5. **Error Sanitization**: Sensitive data removed from logs

## 💰 Cost Optimization

1. **Model Selection**: Use `gemini-2.5-flash` (fastest, cheapest)
2. **Token Limits**: Set `maxOutputTokens` appropriately
3. **Instance Limits**: Configure `maxInstances` to cap costs
4. **Monitoring**: Track usage with built-in metrics

## 🔍 Troubleshooting

### "API key not found"

```bash
export GOOGLE_API_KEY='your-key'
echo $GOOGLE_API_KEY  # Verify
```

### "Permission denied" (Vertex AI)

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### "Function not found"

```bash
npm run build
firebase deploy --only functions
```

## 📚 API Reference

### GenAIService Methods

```typescript
class GenAIService {
  generateContent(request): Promise<GenerateContentResponse>
  generateContentStream(request): AsyncGenerator<StreamChunk>
  generateText(prompt, model?, config?): Promise<string>
  healthCheck(): Promise<HealthStatus>
  isVertexAI(): boolean
  getDefaultModel(): string
}
```

### Key Types

```typescript
interface GenerateContentRequest {
  model: string;
  contents: string | any[];
  config?: {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
}

interface GenerateContentResponse {
  text?: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  finishReason?: string;
}
```

## 📖 Documentation

- [Google GenAI SDK](https://github.com/googleapis/js-genai)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)
- [Firebase Functions](https://firebase.google.com/docs/functions)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Follow existing code structure

## 📄 License

MIT

---

**Version**: 1.0.0  
**SDK Version**: @google/genai v1.34.0  
**Last Updated**: 2024-12-18  
**Maintainer**: GigHub Development Team
