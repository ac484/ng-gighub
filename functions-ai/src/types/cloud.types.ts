/**
 * Shared Google Cloud configuration contracts for AI platform clients
 */

/**
 * Base configuration resolved from the environment
 */
export interface GoogleCloudConfig {
  projectId?: string;
  location: string;
  apiEndpoint: string;
  quotaProjectId?: string;
  timeout?: number;
}

/**
 * Configuration required by @google-cloud/aiplatform clients
 */
export interface AIPlatformConfig {
  projectId: string;
  location: string;
  apiEndpoint: string;
}

/**
 * Error categories for cloud configuration resolution
 */
export enum CloudConfigErrorType {
  MISSING_PROJECT = 'MISSING_PROJECT',
  INVALID_TIMEOUT = 'INVALID_TIMEOUT'
}

/**
 * Custom error for configuration issues
 */
export class CloudConfigError extends Error {
  constructor(
    message: string,
    public readonly type: CloudConfigErrorType
  ) {
    super(message);
    this.name = 'CloudConfigError';
  }
}
