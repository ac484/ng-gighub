/**
 * GigHub AI Functions
 * Enterprise-standard Google GenAI integration
 *
 * Based on @google/genai v1.34.0 SDK best practices
 * Supports both Gemini Developer API and Vertex AI
 */

import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options for all functions
// Optimized for enterprise workloads with cost control
setGlobalOptions({
  maxInstances: 10, // Limit concurrent instances for cost control
  region: 'us-central1', // Default region (can be overridden per function)
  memory: '512MiB', // Sufficient for AI operations
  timeoutSeconds: 60 // Default timeout
});

// Export GenAI functions
export { generateContent, generateText, generateStream, health, models } from './functions/genai.functions';
