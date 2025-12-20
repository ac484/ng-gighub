/**
 * Enterprise configuration module for Google GenAI
 * Supports both Gemini Developer API and Vertex AI with environment-based auto-configuration
 */

import {getGoogleCloudConfig} from './cloud.config';
import {GenAIConfig, GenAIError, GenAIErrorType} from '../types/genai.types';

/**
 * Environment variables for GenAI configuration
 */
const ENV_VARS = {
  // Gemini Developer API
  GEMINI_API_KEY: 'GOOGLE_API_KEY',
  GEMINI_API_VERSION: 'GOOGLE_API_VERSION',

  // Vertex AI
  VERTEXAI_ENABLED: 'GOOGLE_GENAI_USE_VERTEXAI',

  // Common
  GENAI_TIMEOUT: 'GENAI_TIMEOUT'
};

/**
 * Default configuration values
 */
const DEFAULTS = {
  apiVersion: 'v1beta', // Latest stable API
  model: 'gemini-2.5-flash' // Latest and fastest model
};

/**
 * Configuration manager for Google GenAI
 * Implements enterprise best practices:
 * - Environment variable support
 * - Validation
 * - Secure credential handling
 * - Auto-detection of API type
 */
export class GenAIConfigManager {
  private static instance: GenAIConfigManager;
  private readonly cloudConfig = getGoogleCloudConfig();
  private config: GenAIConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GenAIConfigManager {
    if (!GenAIConfigManager.instance) {
      GenAIConfigManager.instance = new GenAIConfigManager();
    }
    return GenAIConfigManager.instance;
  }

  /**
   * Load configuration from environment variables
   * Follows SDK auto-detection pattern
   */
  private loadConfig(): GenAIConfig {
    const useVertexAI = this.parseBoolean(process.env[ENV_VARS.VERTEXAI_ENABLED]);
    const timeout = this.cloudConfig.getTimeout();
    const apiVersion = process.env[ENV_VARS.GEMINI_API_VERSION] || DEFAULTS.apiVersion;

    if (useVertexAI) {
      // Vertex AI configuration
      return {
        vertexai: true,
        project: this.cloudConfig.getRequiredProjectId(),
        location: this.cloudConfig.getLocation(),
        apiVersion,
        timeout
      };
    }

    // Gemini Developer API configuration
    return {
      vertexai: false,
      apiKey: process.env[ENV_VARS.GEMINI_API_KEY],
      apiVersion,
      timeout
    };
  }

  /**
   * Validate configuration based on API type
   */
  private validateConfig(): void {
    if (this.config.vertexai) {
      // Vertex AI requires project and location
      if (!this.config.project) {
        throw new GenAIError(
          `Vertex AI requires GOOGLE_CLOUD_PROJECT environment variable`,
          GenAIErrorType.AUTHENTICATION_ERROR
        );
      }
      if (!this.config.location) {
        throw new GenAIError(
          `Vertex AI requires GOOGLE_CLOUD_LOCATION environment variable`,
          GenAIErrorType.AUTHENTICATION_ERROR
        );
      }
    } else {
      // Gemini API requires API key
      if (!this.config.apiKey) {
        throw new GenAIError(
          `Gemini API requires GOOGLE_API_KEY environment variable`,
          GenAIErrorType.AUTHENTICATION_ERROR
        );
      }
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): GenAIConfig {
    return {...this.config};
  }

  /**
   * Get configuration for SDK initialization
   * Returns format compatible with GoogleGenAI constructor
   */
  public getSDKConfig(): any {
    const sdkConfig: any = {
      apiVersion: this.config.apiVersion,
      httpOptions: {
        timeout: this.config.timeout
      }
    };

    if (this.config.vertexai) {
      sdkConfig.vertexai = true;
      sdkConfig.project = this.config.project;
      sdkConfig.location = this.config.location;
      sdkConfig.googleAuthOptions = this.cloudConfig.getGoogleAuthOptions();
    } else {
      sdkConfig.apiKey = this.config.apiKey;
    }

    return sdkConfig;
  }

  /**
   * Check if using Vertex AI
   */
  public isVertexAI(): boolean {
    return this.config.vertexai === true;
  }

  /**
   * Get default model for current configuration
   */
  public getDefaultModel(): string {
    return DEFAULTS.model;
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value?: string): boolean {
    if (!value) return false;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  /**
   * Get configuration summary for logging (without sensitive data)
   */
  public getConfigSummary(): Record<string, any> {
    return {
      apiType: this.config.vertexai ? 'Vertex AI' : 'Gemini Developer API',
      apiVersion: this.config.apiVersion,
      project: this.config.vertexai ? this.config.project : undefined,
      location: this.config.vertexai ? this.config.location : undefined,
      timeout: this.config.timeout,
      hasApiKey: this.config.vertexai ? undefined : !!this.config.apiKey
    };
  }
}

/**
 * Export singleton instance getter
 */
export const getGenAIConfig = (): GenAIConfigManager => {
  return GenAIConfigManager.getInstance();
};
