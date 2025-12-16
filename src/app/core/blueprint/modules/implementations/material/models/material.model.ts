/**
 * Material Models
 *
 * Data models for material management domain.
 *
 * @module MaterialModels
 * @author GigHub Development Team
 * @date 2025-12-13
 */

export enum MaterialStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  ORDERED = 'ordered'
}

export interface MaterialItem {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  status: MaterialStatus;
  location?: string;
  supplier?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialData {
  blueprintId: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  location?: string;
  supplier?: string;
  cost?: number;
  createdBy: string;
}

export interface UpdateMaterialData {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  status?: MaterialStatus;
  location?: string;
  supplier?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface MaterialQueryOptions {
  category?: string;
  status?: MaterialStatus;
  limit?: number;
}
