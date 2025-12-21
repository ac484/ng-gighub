/**
 * Contract Module - Public API Interface
 *
 * Defines the public API contract that other modules will use
 * to interact with the Contract Module via Event Bus.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import type {
  Contract,
  ContractStatusHistory,
  ContractStatistics,
  ContractFilters,
  ContractStatus,
  FileAttachment
} from '../models/contract.model';
import type { CreateContractDto, UpdateContractDto, ContractStatusChangeDto } from '../models/dtos';
import type { ContractWorkItem, WorkItemProgress, CreateWorkItemDto, UpdateWorkItemDto } from '../models/work-item.model';

/**
 * Validation Result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors?: string[];
}

/**
 * File Upload DTO
 */
export interface FileUploadDto {
  /** File name */
  fileName: string;
  /** File type */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** Uploader ID */
  uploadedBy: string;
}

/**
 * Main Contract Module API
 * Provides access to all Contract Module capabilities
 */
export interface IContractModuleApi {
  /** Contract management (CRUD) */
  management: IContractManagementApi;
  /** Contract file upload */
  upload: IContractUploadApi;
  /** Contract status management */
  status: IContractStatusApi;
  /** Work items management */
  workItems: IContractWorkItemsApi;
  /** Contract events */
  events: IContractEventApi;
}

/**
 * Contract Management API (CRUD operations)
 */
export interface IContractManagementApi {
  /**
   * Create a new contract
   *
   * @param data Contract creation data
   * @returns Created contract
   */
  create(data: CreateContractDto): Promise<Contract>;

  /**
   * Get a contract by ID
   *
   * @param contractId Contract ID
   * @returns Contract or null if not found
   */
  getById(contractId: string): Promise<Contract | null>;

  /**
   * List contracts for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @param filters Optional filters
   * @returns List of contracts
   */
  list(blueprintId: string, filters?: ContractFilters): Promise<Contract[]>;

  /**
   * Get contract statistics for a blueprint
   *
   * @param blueprintId Blueprint ID
   * @returns Contract statistics
   */
  getStatistics(blueprintId: string): Promise<ContractStatistics>;

  /**
   * Update a contract
   *
   * @param contractId Contract ID
   * @param data Update data
   * @returns Updated contract
   */
  update(contractId: string, data: UpdateContractDto): Promise<Contract>;

  /**
   * Delete a contract (soft delete)
   *
   * @param contractId Contract ID
   */
  delete(contractId: string): Promise<void>;

  /**
   * Validate if a contract can be used for task creation
   *
   * @param contractId Contract ID
   * @returns Validation result
   */
  validateForTaskCreation(contractId: string): Promise<ValidationResult>;
}

/**
 * Contract Upload API (File upload and parsing)
 */
export interface IContractUploadApi {
  /**
   * Upload a contract file
   *
   * @param contractId Contract ID
   * @param file File to upload
   * @param metadata File metadata
   * @returns Uploaded file attachment
   */
  uploadFile(contractId: string, file: File, metadata: FileUploadDto): Promise<FileAttachment>;

  /**
   * Remove a contract file
   *
   * @param contractId Contract ID
   * @param fileId File ID to remove
   */
  removeFile(contractId: string, fileId: string): Promise<void>;

  /**
   * Trigger contract parsing (OCR/AI)
   * Note: First version - placeholder, implementation deferred
   *
   * @param contractId Contract ID
   */
  triggerParsing(contractId: string): Promise<void>;

  /**
   * Confirm parsed data
   * Note: First version - placeholder, implementation deferred
   *
   * @param contractId Contract ID
   * @param confirmedBy User who confirms
   */
  confirmParsedData(contractId: string, confirmedBy: string): Promise<void>;
}

/**
 * Contract Status API (Status management)
 */
export interface IContractStatusApi {
  /**
   * Change contract status
   *
   * @param contractId Contract ID
   * @param data Status change data
   * @returns Updated contract
   */
  changeStatus(contractId: string, data: ContractStatusChangeDto): Promise<Contract>;

  /**
   * Activate a contract (change to 'active' status)
   *
   * @param contractId Contract ID
   * @param activatedBy User who activates
   * @returns Updated contract
   */
  activate(contractId: string, activatedBy: string): Promise<Contract>;

  /**
   * Complete a contract
   *
   * @param contractId Contract ID
   * @param completedBy User who completes
   * @returns Updated contract
   */
  complete(contractId: string, completedBy: string): Promise<Contract>;

  /**
   * Terminate a contract
   *
   * @param contractId Contract ID
   * @param reason Termination reason
   * @param terminatedBy User who terminates
   * @returns Updated contract
   */
  terminate(contractId: string, reason: string, terminatedBy: string): Promise<Contract>;

  /**
   * Get status history
   *
   * @param contractId Contract ID
   * @returns Status history entries
   */
  getStatusHistory(contractId: string): Promise<ContractStatusHistory[]>;

  /**
   * Check if status transition is valid
   *
   * @param currentStatus Current contract status
   * @param targetStatus Target status
   * @returns True if transition is valid
   */
  canTransitionTo(currentStatus: ContractStatus, targetStatus: ContractStatus): boolean;

  /**
   * Get next possible statuses
   *
   * @param currentStatus Current contract status
   * @returns Array of valid next statuses
   */
  getNextPossibleStatuses(currentStatus: ContractStatus): ContractStatus[];
}

/**
 * Contract Work Items API (Work item management)
 */
export interface IContractWorkItemsApi {
  /**
   * Add a work item to a contract
   *
   * @param contractId Contract ID
   * @param data Work item data
   * @returns Created work item
   */
  add(contractId: string, data: CreateWorkItemDto): Promise<ContractWorkItem>;

  /**
   * Update a work item
   *
   * @param contractId Contract ID
   * @param workItemId Work item ID
   * @param data Update data
   * @returns Updated work item
   */
  update(contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem>;

  /**
   * Delete a work item
   *
   * @param contractId Contract ID
   * @param workItemId Work item ID
   */
  delete(contractId: string, workItemId: string): Promise<void>;

  /**
   * List work items for a contract
   *
   * @param contractId Contract ID
   * @returns List of work items
   */
  list(contractId: string): Promise<ContractWorkItem[]>;

  /**
   * Update work item progress
   *
   * @param contractId Contract ID
   * @param workItemId Work item ID
   * @param progress Progress data
   * @returns Updated work item
   */
  updateProgress(contractId: string, workItemId: string, progress: WorkItemProgress): Promise<ContractWorkItem>;

  /**
   * Link a task to a work item
   *
   * @param contractId Contract ID
   * @param workItemId Work item ID
   * @param taskId Task ID to link
   * @returns Updated work item
   */
  linkTask(contractId: string, workItemId: string, taskId: string): Promise<ContractWorkItem>;

  /**
   * Unlink a task from a work item
   *
   * @param contractId Contract ID
   * @param workItemId Work item ID
   * @param taskId Task ID to unlink
   * @returns Updated work item
   */
  unlinkTask(contractId: string, workItemId: string, taskId: string): Promise<ContractWorkItem>;
}

/**
 * Contract Event API (Event subscription and emission)
 */
export interface IContractEventApi {
  /**
   * Subscribe to a contract event
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on<T>(eventType: string, handler: (data: T) => void): () => void;

  /**
   * Subscribe to a contract event once
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  once<T>(eventType: string, handler: (data: T) => void): () => void;

  /**
   * Emit a contract event
   *
   * @param eventType Type of event to emit
   * @param data Event payload
   */
  emit(eventType: string, data: unknown): void;
}
