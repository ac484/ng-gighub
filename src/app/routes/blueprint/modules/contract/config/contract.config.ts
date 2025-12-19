/**
 * Contract Module Configuration
 *
 * Module-specific configuration settings
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import type { ContractStatus } from '../models';

/**
 * Contract Module Configuration Interface
 */
export interface ContractModuleConfig {
  /** Enable manual contract creation */
  enableManualCreation: boolean;
  /** Enable file upload functionality */
  enableFileUpload: boolean;
  /** Enable work items management */
  enableWorkItems: boolean;
  /** Enable OCR parsing (deferred) */
  enableOcrParsing: boolean;
  /** Enable AI parsing (deferred) */
  enableAiParsing: boolean;

  /** Prefix for contract numbers (e.g., 'CON') */
  contractNumberPrefix: string;
  /** Length of numeric part in contract number */
  contractNumberLength: number;

  /** Default currency code */
  defaultCurrency: string;

  /** Require signed date before activation */
  requireSignedDateBeforeActivation: boolean;
  /** Require at least one work item before activation */
  requireWorkItemsBeforeActivation: boolean;

  /** Notify on contract created */
  notifyOnContractCreated: boolean;
  /** Notify on contract activated */
  notifyOnContractActivated: boolean;
  /** Notify on contract completed */
  notifyOnContractCompleted: boolean;
  /** Notify on contract terminated */
  notifyOnContractTerminated: boolean;
}

/**
 * Default Contract Module Configuration
 */
export const DEFAULT_CONTRACT_MODULE_CONFIG: Readonly<ContractModuleConfig> = {
  // Features
  enableManualCreation: true,
  enableFileUpload: true,
  enableWorkItems: true,
  enableOcrParsing: true, // Enabled - OCR parsing via Cloud Functions
  enableAiParsing: true, // Enabled - AI parsing via Cloud Functions

  // Contract numbering format: CON-0001
  contractNumberPrefix: 'CON',
  contractNumberLength: 4,

  // Defaults
  defaultCurrency: 'TWD',

  // Workflow requirements
  requireSignedDateBeforeActivation: false,
  requireWorkItemsBeforeActivation: true,

  // Notifications enabled
  notifyOnContractCreated: true,
  notifyOnContractActivated: true,
  notifyOnContractCompleted: true,
  notifyOnContractTerminated: true
} as const;

/**
 * Contract Status Transition Rules
 *
 * Defines valid status transitions for contracts.
 */
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_activation', 'terminated'],
  pending_activation: ['active', 'draft', 'terminated'],
  active: ['completed', 'terminated'],
  completed: [], // Terminal state
  terminated: [] // Terminal state
} as const;

/**
 * Contract Status Labels (Chinese)
 */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: '草稿',
  pending_activation: '待生效',
  active: '已生效',
  completed: '已完成',
  terminated: '已終止'
} as const;

/**
 * Contract Status Colors (for UI)
 */
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'default',
  pending_activation: 'processing',
  active: 'success',
  completed: 'geekblue',
  terminated: 'error'
} as const;
