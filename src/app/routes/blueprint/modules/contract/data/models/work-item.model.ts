/**
 * Contract Work Item Models
 *
 * Models for managing work items within contracts.
 *
 * @author GigHub Development Team
 * @date 2025-12-18
 */

/**
 * Contract Work Item (合約工項)
 * Represents a work item within a contract
 */
export interface ContractWorkItem {
  /** Unique identifier */
  id: string;
  /** Contract this work item belongs to */
  contractId: string;
  /** Work item code */
  code: string;
  /** Work item name */
  name: string;
  /** Work item description */
  description?: string;
  /** Work item category */
  category?: string;
  /** Unit of measurement */
  unit: string;
  /** Quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Total price (quantity × unitPrice) */
  totalPrice: number;
  /** Linked task IDs */
  linkedTaskIds: string[];
  /** Completed quantity */
  completedQuantity: number;
  /** Completed amount */
  completedAmount: number;
  /** Completion percentage (0-100) */
  completionPercentage: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Work Item Progress
 * Tracks completion progress of a work item
 */
export interface WorkItemProgress {
  /** Completed quantity */
  completedQuantity: number;
  /** Completed amount */
  completedAmount: number;
}

/**
 * Create Work Item DTO
 */
export interface CreateWorkItemDto {
  /** Work item code */
  code: string;
  /** Work item name */
  name: string;
  /** Work item description */
  description?: string;
  /** Work item category */
  category?: string;
  /** Unit of measurement */
  unit: string;
  /** Quantity */
  quantity: number;
  /** Unit price */
  unitPrice: number;
}

/**
 * Update Work Item DTO
 */
export interface UpdateWorkItemDto {
  /** Work item code */
  code?: string;
  /** Work item name */
  name?: string;
  /** Work item description */
  description?: string;
  /** Work item category */
  category?: string;
  /** Unit of measurement */
  unit?: string;
  /** Quantity */
  quantity?: number;
  /** Unit price */
  unitPrice?: number;
}
