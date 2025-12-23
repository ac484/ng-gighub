## TODO

- [ ] Identify which Vertex AI client libraries to use per function: `@google-cloud/aiplatform`, `@google-cloud/vertexai`, or `@google/genai`.
- [ ] Define Cloud Functions surface (entrypoints) that will call Vertex AI — frontend MUST NOT call Vertex AI directly.
- [ ] Specify service account scopes, required IAM roles, and secret management (no keys in source; use env vars or Secret Manager).
- [ ] Document expected request/response schemas and validation for AI outputs (treat as untrusted input).
- [ ] Add integration tests and a minimal local emulation plan for Vertex AI calls.
- [ ] Note cost-control measures: rate limits, batching, and retry/backoff strategy.

Notes:
- Follow GigHub architecture: all AI calls via backend functions only. Ensure compliance with Firestore security rules and no frontend secrets.

