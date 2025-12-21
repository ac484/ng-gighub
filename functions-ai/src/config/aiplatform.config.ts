import { ClientOptions } from 'google-gax';

import { getGoogleCloudConfig } from './cloud.config';
import { AIPlatformConfig } from '../types/cloud.types';

/**
 * Provider for base configuration shared by @google-cloud/aiplatform clients
 */
export class AIPlatformConfigProvider {
  private static instance: AIPlatformConfigProvider;
  private readonly cloudConfig = getGoogleCloudConfig();
  private readonly config: AIPlatformConfig;
  private readonly clientOptions: ClientOptions;

  private constructor() {
    this.config = this.cloudConfig.getAIPlatformConfig();
    this.clientOptions = this.cloudConfig.getClientOptions();
  }

  public static getInstance(): AIPlatformConfigProvider {
    if (!AIPlatformConfigProvider.instance) {
      AIPlatformConfigProvider.instance = new AIPlatformConfigProvider();
    }

    return AIPlatformConfigProvider.instance;
  }

  public getConfig(): AIPlatformConfig {
    return { ...this.config };
  }

  public getClientOptions(): ClientOptions {
    return { ...this.clientOptions };
  }

  public getApiEndpoint(): string {
    return this.config.apiEndpoint;
  }
}

export const getAIPlatformConfig = (): AIPlatformConfigProvider => AIPlatformConfigProvider.getInstance();
