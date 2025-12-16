/**
 * Issue Module Configuration
 *
 * Module-specific configuration settings
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

/**
 * Issue Module Configuration Interface
 */
export interface IssueModuleConfig {
  /** Enable manual issue creation by users */
  enableManualCreation: boolean;
  /** Enable auto-creation from acceptance failures */
  enableAutoCreationFromAcceptance: boolean;
  /** Enable auto-creation from QC failures */
  enableAutoCreationFromQC: boolean;
  /** Enable auto-creation from warranty defects */
  enableAutoCreationFromWarranty: boolean;
  /** Enable auto-creation from safety incidents */
  enableAutoCreationFromSafety: boolean;

  /** Prefix for issue numbers (e.g., 'ISS') */
  issueNumberPrefix: string;
  /** Length of numeric part in issue number */
  issueNumberLength: number;

  /** Default issue category */
  defaultCategory: string;
  /** Default issue severity */
  defaultSeverity: string;

  /** Require resolution before verification */
  requireResolutionBeforeVerification: boolean;
  /** Require verification before closure */
  requireVerificationBeforeClose: boolean;

  /** Notify on issue created */
  notifyOnIssueCreated: boolean;
  /** Notify on issue resolved */
  notifyOnIssueResolved: boolean;
  /** Notify on issue closed */
  notifyOnIssueClosed: boolean;
}

/**
 * Default Issue Module Configuration
 */
export const DEFAULT_ISSUE_MODULE_CONFIG: Readonly<IssueModuleConfig> = {
  // All sources enabled by default
  enableManualCreation: true,
  enableAutoCreationFromAcceptance: true,
  enableAutoCreationFromQC: true,
  enableAutoCreationFromWarranty: true,
  enableAutoCreationFromSafety: true,

  // Issue numbering format: ISS-0001
  issueNumberPrefix: 'ISS',
  issueNumberLength: 4,

  // Defaults
  defaultCategory: 'quality',
  defaultSeverity: 'minor',

  // Workflow enforcement
  requireResolutionBeforeVerification: true,
  requireVerificationBeforeClose: true,

  // Notifications enabled
  notifyOnIssueCreated: true,
  notifyOnIssueResolved: true,
  notifyOnIssueClosed: true
} as const;
