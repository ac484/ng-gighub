/**
 * QA Module Configuration
 *
 * Default configuration for QA Domain features and settings.
 *
 * @module QA/Config
 * @author GigHub Development Team
 * @date 2025-12-19
 */

/**
 * QA Module Configuration Interface
 */
export interface IQAConfig {
  /** Feature flags */
  features: {
    /** Enable checklist management */
    enableChecklist: boolean;
    /** Enable defect management */
    enableDefectManagement: boolean;
    /** Enable defect lifecycle (SETC-041) */
    enableDefectLifecycle: boolean;
    /** Enable defect resolution (SETC-042) */
    enableDefectResolution: boolean;
    /** Enable defect reinspection (SETC-043) */
    enableDefectReinspection: boolean;
    /** Enable defect-issue integration (SETC-044) */
    enableDefectIssueIntegration: boolean;
    /** Enable field inspection */
    enableInspection: boolean;
    /** Enable QA report generation */
    enableQAReport: boolean;
    /** Enable photo annotation */
    enablePhotoAnnotation: boolean;
    /** Enable voice recording */
    enableVoiceRecording: boolean;
    /** Enable offline mode */
    enableOfflineMode: boolean;
  };

  /** Module settings */
  settings: {
    /** Defect number prefix */
    defectNumberPrefix: string;
    /** Defect number length */
    defectNumberLength: number;
    /** Auto-assign defects based on rules */
    autoAssignDefects: boolean;
    /** Auto-close defects after verification */
    defectAutoCloseAfterVerification: boolean;
    /** Auto-create issues from critical defects */
    autoCreateIssueFromCriticalDefect: boolean;
    /** Max photo size in bytes */
    maxPhotoSize: number;
    /** Enable photo compression */
    photoCompression: boolean;
    /** Enable GPS tracking */
    enableGPS: boolean;
    /** Enable weather tracking */
    enableWeatherTracking: boolean;
    /** Severity deadline days mapping */
    severityDeadlineDays: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };

  /** UI settings */
  ui: {
    /** Module icon */
    icon: string;
    /** Module color */
    color: string;
    /** Module position in menu */
    position: number;
    /** Module visibility */
    visibility: 'visible' | 'hidden';
  };

  /** Permission settings */
  permissions: {
    /** Required roles to access module */
    requiredRoles: string[];
    /** Allowed actions */
    allowedActions: string[];
  };

  /** Resource limits */
  limits: {
    /** Max items per blueprint */
    maxItems: number;
    /** Max storage in bytes */
    maxStorage: number;
    /** Max requests per minute */
    maxRequests: number;
  };
}

/**
 * Default QA Module Configuration
 */
export const DEFAULT_QA_CONFIG: IQAConfig = {
  features: {
    enableChecklist: true,
    enableDefectManagement: true,
    enableDefectLifecycle: true,
    enableDefectResolution: true,
    enableDefectReinspection: true,
    enableDefectIssueIntegration: true,
    enableInspection: true,
    enableQAReport: true,
    enablePhotoAnnotation: true,
    enableVoiceRecording: true,
    enableOfflineMode: false
  },
  settings: {
    defectNumberPrefix: 'QA',
    defectNumberLength: 4,
    autoAssignDefects: true,
    defectAutoCloseAfterVerification: true,
    autoCreateIssueFromCriticalDefect: true,
    maxPhotoSize: 5 * 1024 * 1024, // 5MB
    photoCompression: true,
    enableGPS: true,
    enableWeatherTracking: false,
    severityDeadlineDays: {
      critical: 3,
      high: 5,
      medium: 7,
      low: 14
    }
  },
  ui: {
    icon: 'safety-certificate',
    color: '#52c41a',
    position: 10,
    visibility: 'visible'
  },
  permissions: {
    requiredRoles: ['viewer'],
    allowedActions: [
      'qa.read',
      'qa.create',
      'qa.update',
      'qa.delete',
      'qa.checklist.read',
      'qa.checklist.create',
      'qa.checklist.execute',
      'qa.defect.read',
      'qa.defect.create',
      'qa.defect.update',
      'qa.defect.assign',
      'qa.defect.resolve',
      'qa.defect.verify',
      'qa.defect.close',
      'qa.inspection.read',
      'qa.inspection.create',
      'qa.inspection.execute',
      'qa.report.read',
      'qa.report.generate',
      'qa.report.export'
    ]
  },
  limits: {
    maxItems: 10000,
    maxStorage: 104857600, // 100MB
    maxRequests: 1000
  }
};
