import {VertexAI, VertexInit} from '@google-cloud/vertexai';
import * as logger from 'firebase-functions/logger';

import {getGoogleCloudConfig} from './cloud.config';

/**
 * Provider for configuring and instantiating @google-cloud/vertexai clients
 */
export class VertexAIConfigProvider {
  private static instance: VertexAIConfigProvider;
  private readonly cloudConfig = getGoogleCloudConfig();
  private client?: VertexAI;

  private constructor() {}

  public static getInstance(): VertexAIConfigProvider {
    if (!VertexAIConfigProvider.instance) {
      VertexAIConfigProvider.instance = new VertexAIConfigProvider();
    }

    return VertexAIConfigProvider.instance;
  }

  /**
   * Build the VertexInit object expected by the SDK
   */
  public getInitConfig(): VertexInit {
    return {
      project: this.cloudConfig.getRequiredProjectId(),
      location: this.cloudConfig.getLocation(),
      apiEndpoint: this.cloudConfig.getApiEndpoint(),
      googleAuthOptions: this.cloudConfig.getGoogleAuthOptions()
    };
  }

  /**
   * Lazy-create a singleton VertexAI client
   */
  public getClient(): VertexAI {
    if (!this.client) {
      const init = this.getInitConfig();
      this.client = new VertexAI(init);

      logger.info('Vertex AI client initialized', {
        provider: 'vertexai',
        config: this.cloudConfig.getConfigSummary()
      });
    }

    return this.client;
  }
}

export const getVertexAIProvider = (): VertexAIConfigProvider => VertexAIConfigProvider.getInstance();
export const getVertexAIClient = (): VertexAI => VertexAIConfigProvider.getInstance().getClient();
