/**
 * Usage Examples for GigHub AI Functions
 * Demonstrates how to use the enterprise Google GenAI implementation
 */

// ============================================
// Example 1: Simple Text Generation (HTTP)
// ============================================

async function example1_simpleTextGeneration() {
  const response = await fetch('https://REGION-PROJECT.cloudfunctions.net/genai-generateText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Explain quantum computing in simple terms',
      config: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    })
  });

  const result = await response.json();
  console.log('Generated text:', result.data.text);
}

// ============================================
// Example 2: Authenticated Content Generation (Callable)
// ============================================

import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

async function example2_authenticatedGeneration() {
  // Ensure user is authenticated
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }

  const functions = getFunctions();
  const generateContent = httpsCallable(functions, 'genai-generateContent');

  const result = await generateContent({
    prompt: 'Write a professional email about project updates',
    model: 'gemini-2.5-flash',
    config: {
      maxOutputTokens: 500,
      temperature: 0.8
    }
  });

  if (result.data.success) {
    console.log('Generated content:', result.data.data.text);
    console.log('Tokens used:', result.data.data.usageMetadata.totalTokenCount);
  } else {
    console.error('Error:', result.data.error);
  }
}

// ============================================
// Example 3: Streaming Text Generation
// ============================================

async function example3_streamingGeneration() {
  const response = await fetch('https://REGION-PROJECT.cloudfunctions.net/genai-generateStream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Write a detailed story about space exploration',
      model: 'gemini-2.5-flash',
      config: {
        maxOutputTokens: 2000,
        temperature: 0.9
      }
    })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        if (data.text) {
          process.stdout.write(data.text);
        }

        if (data.done) {
          console.log('\n\nStreaming complete!');
        }

        if (data.error) {
          console.error('\nError:', data.error);
        }
      }
    }
  }
}

// ============================================
// Example 4: Health Check
// ============================================

async function example4_healthCheck() {
  const response = await fetch('https://REGION-PROJECT.cloudfunctions.net/genai-health');
  const result = await response.json();

  console.log('Service healthy:', result.success);
  console.log('API Type:', result.data.apiType);
  console.log('Timestamp:', result.data.timestamp);
}

// ============================================
// Example 5: List Available Models
// ============================================

async function example5_listModels() {
  const response = await fetch('https://REGION-PROJECT.cloudfunctions.net/genai-models');
  const result = await response.json();

  console.log('Default model:', result.data.defaultModel);
  console.log('Available models:', result.data.availableModels);
  console.log('API Type:', result.data.apiType);
}

// ============================================
// Example 6: Advanced Configuration
// ============================================

async function example6_advancedConfiguration() {
  const functions = getFunctions();
  const generateContent = httpsCallable(functions, 'genai-generateContent');

  const result = await generateContent({
    prompt: 'Analyze the following code for security issues: ...',
    model: 'gemini-2.5-flash',
    config: {
      maxOutputTokens: 1000,
      temperature: 0.3, // Lower temperature for more deterministic output
      topP: 0.95,
      topK: 40,
      stopSequences: ['END', '---']
    }
  });

  console.log(result.data.data.text);
}

// ============================================
// Example 7: Error Handling
// ============================================

async function example7_errorHandling() {
  try {
    const response = await fetch('https://REGION-PROJECT.cloudfunctions.net/genai-generateText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Generate text',
        config: {
          maxOutputTokens: 500
        }
      })
    });

    const result = await response.json();

    if (!result.success) {
      // Handle error
      console.error('Generation failed:');
      console.error('Error type:', result.error.type);
      console.error('Error message:', result.error.message);

      // Handle specific error types
      switch (result.error.type) {
        case 'RATE_LIMIT_EXCEEDED':
          console.log('Rate limit exceeded, retry after delay');
          break;
        case 'AUTHENTICATION_ERROR':
          console.log('Check API key configuration');
          break;
        case 'QUOTA_EXCEEDED':
          console.log('API quota exceeded');
          break;
        default:
          console.log('Unknown error occurred');
      }
    } else {
      console.log('Success:', result.data.text);
    }
  } catch (error) {
    console.error('Network or parsing error:', error);
  }
}

// ============================================
// Example 8: Angular Service Integration
// ============================================

// In your Angular service (e.g., ai.service.ts)
/*
import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from } from 'rxjs';

export interface GenerateTextRequest {
  prompt: string;
  model?: string;
  config?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

export interface GenerateTextResponse {
  success: boolean;
  data?: {
    text: string;
    usageMetadata?: {
      totalTokenCount: number;
    };
  };
  error?: {
    type: string;
    message: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AIService {
  private functions = inject(Functions);

  generateText(request: GenerateTextRequest): Observable<GenerateTextResponse> {
    const callable = httpsCallable<GenerateTextRequest, GenerateTextResponse>(
      this.functions,
      'genai-generateContent'
    );
    
    return from(callable(request).then(result => result.data));
  }
}
*/

// ============================================
// Example 9: React Hook Integration
// ============================================

/*
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState, useCallback } from 'react';

function useAIGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const generateText = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const functions = getFunctions();
      const generateContent = httpsCallable(functions, 'genai-generateContent');
      
      const response = await generateContent({ prompt });
      
      if (response.data.success) {
        setResult(response.data.data.text);
      } else {
        setError(response.data.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateText, loading, error, result };
}

// Usage in component:
function MyComponent() {
  const { generateText, loading, result } = useAIGeneration();

  const handleClick = () => {
    generateText('Write a poem about coding');
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
*/

// ============================================
// Example 10: Batch Processing
// ============================================

async function example10_batchProcessing() {
  const prompts = ['Summarize this text: ...', 'Translate to Spanish: ...', 'Extract key points from: ...'];

  const functions = getFunctions();
  const generateContent = httpsCallable(functions, 'genai-generateContent');

  // Process in parallel with limit
  const BATCH_SIZE = 3;
  const results = [];

  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(prompt => generateContent({ prompt })));
    results.push(...batchResults);
  }

  console.log('Batch processing complete:', results.length, 'results');
}

// ============================================
// Run Examples
// ============================================

// Uncomment to run specific examples:
// example1_simpleTextGeneration();
// example2_authenticatedGeneration();
// example3_streamingGeneration();
// example4_healthCheck();
// example5_listModels();
// example6_advancedConfiguration();
// example7_errorHandling();
// example10_batchProcessing();
