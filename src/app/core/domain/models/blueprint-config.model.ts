/**
 * Blueprint Configuration Data Models
 *
 * Firestore persistence models for Blueprint Configuration.
 * Configuration documents store detailed blueprint settings.
 *
 * Collection path: blueprint-configs/{configId}
 */

import { Timestamp } from '@angular/fire/firestore';

/**
 * Blueprint Configuration Document (Firestore)
 *
 * Stores complete configuration for a blueprint instance.
 * Separate document to keep main blueprint document lean.
 */
export interface BlueprintConfigDocument {
  /** Document ID */
  readonly id?: string;

  /** Associated blueprint ID */
  blueprintId: string;

  /** Configuration version (semantic versioning) */
  version: string;

  /** Configuration name/label */
  name: string;

  /** Configuration description */
  description?: string;

  /** Global feature flags */
  featureFlags: FeatureFlags;

  /** Theme customization */
  theme?: ThemeConfig;

  /** Permission configuration */
  permissions: PermissionConfig;

  /** Notification settings */
  notifications?: NotificationConfig;

  /** Integration settings */
  integrations?: IntegrationConfig;

  /** Environment-specific settings */
  environment?: EnvironmentConfig;

  /** Custom settings (extensible) */
  custom?: Record<string, unknown>;

  // Audit fields
  /** Created by user ID */
  createdBy: string;

  /** Creation timestamp */
  createdAt: Timestamp | Date;

  /** Last update timestamp */
  updatedAt: Timestamp | Date;

  /** Configuration status */
  status: ConfigStatus;

  /** Version history reference */
  previousVersion?: string;
}

/**
 * Configuration Status
 */
export enum ConfigStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated'
}

/**
 * Feature Flags Configuration
 *
 * Global feature toggles for the blueprint.
 */
export interface FeatureFlags {
  /** Enable real-time updates */
  enableRealtime?: boolean;

  /** Enable module hot-reload */
  enableHotReload?: boolean;

  /** Enable debug mode */
  enableDebugMode?: boolean;

  /** Enable analytics */
  enableAnalytics?: boolean;

  /** Enable audit logging */
  enableAuditLog?: boolean;

  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;

  /** Enable experimental features */
  enableExperimentalFeatures?: boolean;

  /** Custom feature flags (extensible) */
  [key: string]: boolean | undefined;
}

/**
 * Theme Configuration
 *
 * Visual customization settings.
 */
export interface ThemeConfig {
  /** Primary color (hex) */
  primaryColor: string;

  /** Accent color (hex) */
  accentColor?: string;

  /** Layout mode */
  layout: 'fixed' | 'fluid' | 'boxed';

  /** Dark mode */
  darkMode: boolean;

  /** Color scheme preset */
  colorScheme?: 'default' | 'blue' | 'green' | 'purple' | 'orange';

  /** Custom CSS class */
  customClass?: string;

  /** Font family */
  fontFamily?: string;
}

/**
 * Permission Configuration
 *
 * Role-based access control settings.
 */
export interface PermissionConfig {
  /** Role definitions */
  roles: Record<string, RoleDefinition>;

  /** Default role for new members */
  defaultRole: string;

  /** Permission inheritance */
  inheritPermissions: boolean;

  /** Resource-level permissions */
  resources?: Record<string, ResourcePermission>;
}

/**
 * Role Definition
 */
export interface RoleDefinition {
  /** Role name */
  name: string;

  /** Role description */
  description?: string;

  /** Granted permissions */
  permissions: string[];

  /** Role hierarchy level */
  level: number;

  /** Whether this is a system role */
  isSystem: boolean;
}

/**
 * Resource Permission
 */
export interface ResourcePermission {
  /** Resource identifier */
  resource: string;

  /** Allowed actions */
  actions: string[];

  /** Conditions for access */
  conditions?: Record<string, unknown>;
}

/**
 * Notification Configuration
 */
export interface NotificationConfig {
  /** Enable email notifications */
  enableEmail: boolean;

  /** Enable in-app notifications */
  enableInApp: boolean;

  /** Enable push notifications */
  enablePush: boolean;

  /** Notification channels */
  channels?: string[];

  /** Notification preferences by event type */
  preferences?: Record<string, boolean>;
}

/**
 * Integration Configuration
 */
export interface IntegrationConfig {
  /** Webhook endpoints */
  webhooks?: WebhookConfig[];

  /** External service integrations */
  services?: Record<string, ServiceIntegration>;

  /** API keys (encrypted) */
  apiKeys?: Record<string, string>;
}

/**
 * Webhook Configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;

  /** Event types to trigger */
  events: string[];

  /** Authentication method */
  auth?: {
    type: 'bearer' | 'basic' | 'apiKey';
    credentials: string; // Encrypted
  };

  /** Whether the webhook is active */
  active: boolean;
}

/**
 * Service Integration
 */
export interface ServiceIntegration {
  /** Service name */
  name: string;

  /** Whether integration is enabled */
  enabled: boolean;

  /** Service-specific configuration */
  config: Record<string, unknown>;
}

/**
 * Environment Configuration
 */
export interface EnvironmentConfig {
  /** Environment name */
  environment: 'development' | 'staging' | 'production';

  /** Debug mode */
  debug: boolean;

  /** Log level */
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';

  /** Cache TTL (seconds) */
  cacheTTL: number;

  /** Rate limits */
  rateLimits?: Record<string, number>;
}

/**
 * Create Config Data
 */
export interface CreateConfigData {
  blueprintId: string;
  version: string;
  name: string;
  description?: string;
  featureFlags?: Partial<FeatureFlags>;
  theme?: ThemeConfig;
  permissions: PermissionConfig;
  notifications?: NotificationConfig;
  integrations?: IntegrationConfig;
  environment?: EnvironmentConfig;
  custom?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Update Config Data
 */
export type UpdateConfigData = Partial<Omit<BlueprintConfigDocument, 'id' | 'blueprintId' | 'createdAt' | 'createdBy'>>;
