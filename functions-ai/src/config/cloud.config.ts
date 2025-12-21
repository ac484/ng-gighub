import { GoogleAuthOptions } from 'google-auth-library';
import { ClientOptions } from 'google-gax';

import { AIPlatformConfig, CloudConfigError, CloudConfigErrorType, GoogleCloudConfig } from '../types/cloud.types';

const ENV_VARS = {
  PROJECT: 'GOOGLE_CLOUD_PROJECT',
  LOCATION: 'GOOGLE_CLOUD_LOCATION',
  API_ENDPOINT: 'GOOGLE_CLOUD_API_ENDPOINT',
  QUOTA_PROJECT: 'GOOGLE_CLOUD_QUOTA_PROJECT',
  TIMEOUT: 'GENAI_TIMEOUT'
};

const DEFAULTS = {
  location: 'us-central1',
  timeout: 60000
};

/**
 * Centralized environment configuration for Google Cloud AI clients
 */
export class GoogleCloudConfigManager {
  private static instance: GoogleCloudConfigManager;
  private readonly config: GoogleCloudConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): GoogleCloudConfigManager {
    if (!GoogleCloudConfigManager.instance) {
      GoogleCloudConfigManager.instance = new GoogleCloudConfigManager();
    }

    return GoogleCloudConfigManager.instance;
  }

  /**
   * Resolve configuration from environment variables with sane defaults
   */
  private loadConfig(): GoogleCloudConfig {
    const projectId = process.env[ENV_VARS.PROJECT] || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const location = process.env[ENV_VARS.LOCATION] || DEFAULTS.location;
    const apiEndpoint = process.env[ENV_VARS.API_ENDPOINT] || `${location}-aiplatform.googleapis.com`;
    const quotaProjectId = process.env[ENV_VARS.QUOTA_PROJECT];

    return {
      projectId,
      location,
      apiEndpoint,
      quotaProjectId,
      timeout: this.parseTimeout(process.env[ENV_VARS.TIMEOUT])
    };
  }

  private parseTimeout(value?: string): number {
    if (!value) return DEFAULTS.timeout;
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new CloudConfigError('GENAI_TIMEOUT must be a positive integer value in milliseconds', CloudConfigErrorType.INVALID_TIMEOUT);
    }

    return parsed;
  }

  public getConfig(): GoogleCloudConfig {
    return { ...this.config };
  }

  public getRequiredProjectId(): string {
    if (!this.config.projectId) {
      throw new CloudConfigError(
        'Google Cloud project is required. Set GOOGLE_CLOUD_PROJECT or configure your Functions runtime project.',
        CloudConfigErrorType.MISSING_PROJECT
      );
    }

    return this.config.projectId;
  }

  public getLocation(): string {
    return this.config.location;
  }

  public getApiEndpoint(): string {
    return this.config.apiEndpoint;
  }

  public getTimeout(): number {
    return this.config.timeout ?? DEFAULTS.timeout;
  }

  public getGoogleAuthOptions(): GoogleAuthOptions {
    const options: GoogleAuthOptions = { projectId: this.getRequiredProjectId() };

    return options;
  }

  public getClientOptions(): ClientOptions {
    return {
      projectId: this.getRequiredProjectId(),
      apiEndpoint: this.config.apiEndpoint
    };
  }

  public getAIPlatformConfig(): AIPlatformConfig {
    return {
      projectId: this.getRequiredProjectId(),
      location: this.config.location,
      apiEndpoint: this.config.apiEndpoint
    };
  }

  public getConfigSummary(): Record<string, unknown> {
    return {
      projectId: this.config.projectId,
      location: this.config.location,
      apiEndpoint: this.config.apiEndpoint,
      hasQuotaProject: !!this.config.quotaProjectId,
      timeout: this.getTimeout()
    };
  }
}

export const getGoogleCloudConfig = (): GoogleCloudConfigManager => GoogleCloudConfigManager.getInstance();
