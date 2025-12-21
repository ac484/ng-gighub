/**
 * CWA API HTTP Client
 *
 * HTTP client with retry logic, error handling, and request/response logging.
 * Uses native fetch API with exponential backoff retry strategy.
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

import * as logger from 'firebase-functions/logger';

import { CwaApiError, CwaApiResponse } from '../types';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Retry policy
 */
interface RetryPolicy {
  attempts: number;
  delay: number;
  maxDelay: number;
  shouldRetry: (error: Error, attempt: number) => boolean;
}

/**
 * CWA API HTTP Client
 */
export class CwaHttpClient {
  private readonly config: Required<HttpClientConfig>;
  private readonly retryPolicy: RetryPolicy;

  constructor(config: HttpClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      maxRetryDelay: config.maxRetryDelay ?? 10000
    };

    this.retryPolicy = {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay,
      maxDelay: this.config.maxRetryDelay,
      shouldRetry: this.isRetryableError.bind(this)
    };
  }

  /**
   * Execute HTTP GET request
   */
  async get<T>(path: string, options: HttpRequestOptions = {}): Promise<CwaApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Execute HTTP POST request
   */
  async post<T>(path: string, body: unknown, options: HttpRequestOptions = {}): Promise<CwaApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async request<T>(path: string, options: HttpRequestOptions): Promise<CwaApiResponse<T>> {
    const startTime = Date.now();
    const method = options.method ?? 'GET';
    const url = this.buildUrl(path, options.params);

    logger.info(`[CwaHttpClient] ${method} ${url}`, {
      params: options.params
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryPolicy.attempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(url, options);
        const duration = Date.now() - startTime;

        logger.info(`[CwaHttpClient] Request succeeded`, {
          method,
          url,
          attempt,
          duration,
          statusCode: 200
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;

        logger.warn(`[CwaHttpClient] Request failed (attempt ${attempt}/${this.retryPolicy.attempts})`, {
          method,
          url,
          attempt,
          duration,
          error: lastError.message
        });

        // Check if we should retry
        if (attempt < this.retryPolicy.attempts && this.retryPolicy.shouldRetry(lastError, attempt)) {
          const delay = this.calculateRetryDelay(attempt);
          logger.info(`[CwaHttpClient] Retrying in ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        // Max retries reached or non-retryable error
        break;
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    logger.error(`[CwaHttpClient] Request failed after ${this.retryPolicy.attempts} attempts`, {
      method,
      url,
      duration,
      error: lastError?.message
    });

    return {
      success: false,
      error: this.buildApiError(lastError!)
    };
  }

  /**
   * Execute single HTTP request
   */
  private async executeRequest<T>(url: string, options: HttpRequestOptions): Promise<CwaApiResponse<T>> {
    const controller = new AbortController();
    const timeout = options.timeout ?? this.config.timeout;

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'GigHub/1.0',
        ...options.headers
      };

      const fetchOptions: RequestInit = {
        method: options.method ?? 'GET',
        headers,
        signal: controller.signal
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check CWA API response structure
      if (data.success === false) {
        throw new Error(data.error?.message ?? 'CWA API returned error');
      }

      return {
        success: true,
        result: data.records ?? data.result ?? data
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.config.baseUrl);

    // Add API key
    url.searchParams.set('Authorization', this.config.apiKey);

    // Add additional parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, attempt: number): boolean {
    const message = error.message.toLowerCase();

    // Network errors are retryable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('etimedout')
    ) {
      return true;
    }

    // HTTP 5xx errors are retryable
    if (message.includes('http 5')) {
      return true;
    }

    // HTTP 429 (Too Many Requests) is retryable
    if (message.includes('http 429')) {
      return true;
    }

    // HTTP 503 (Service Unavailable) is retryable
    if (message.includes('http 503')) {
      return true;
    }

    // Client errors (4xx) are not retryable
    if (message.includes('http 4')) {
      return false;
    }

    // Default: do not retry
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: delay * (2 ^ attempt) + random jitter
    const exponentialDelay = this.retryPolicy.delay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    const delay = Math.min(exponentialDelay + jitter, this.retryPolicy.maxDelay);
    return Math.floor(delay);
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build API error from caught error
   */
  private buildApiError(error: Error): CwaApiError {
    const message = error.message;

    // Extract HTTP status code if present
    const statusMatch = message.match(/HTTP (\d+)/);
    const statusCode = statusMatch ? statusMatch[1] : 'UNKNOWN';

    return {
      code: `CWA_API_ERROR_${statusCode}`,
      message: message,
      details: {
        originalError: error.name,
        stack: error.stack
      }
    };
  }

  /**
   * Get client configuration
   */
  getConfig(): Readonly<HttpClientConfig> {
    return { ...this.config };
  }
}

/**
 * Create CWA HTTP client instance
 */
export function createCwaHttpClient(config: HttpClientConfig): CwaHttpClient {
  return new CwaHttpClient(config);
}
