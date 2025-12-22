export type ContractType =
  | 'main_contract'
  | 'sub_contract'
  | 'supplement'
  | 'change_order'
  | 'other';

export type ContractStatus =
  | 'draft'
  | 'under_review'
  | 'active'
  | 'completed'
  | 'terminated'
  | 'suspended';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ContractParty {
  id: string;
  name: string;
  type: 'organization' | 'individual';
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ContractAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  downloadUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface WorkItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface ParsedContractData {
  extractedFields: Record<string, unknown>;
  workItems: WorkItem[];
  keyTerms: string[];
  confidence: number;
  parsedAt: Date;
  parserVersion: string;
}

export interface ApprovalRecord {
  id: string;
  approverUserId: string;
  approverName: string;
  action: ApprovalStatus;
  comment?: string;
  timestamp: Date;
  level: number;
}

export interface Contract {
  id?: string;
  blueprintId: string;
  title: string;
  contractNumber: string;
  contractType: ContractType;
  description?: string;
  partyA: ContractParty;
  partyB: ContractParty;
  partyC?: ContractParty;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  paymentTerms?: string;
  startDate: Date;
  endDate: Date;
  effectiveDate?: Date;
  signedDate?: Date;
  status: ContractStatus;
  version: number;
  previousVersionId?: string;
  attachments: ContractAttachment[];
  originalFileUrl?: string;
  parsedData?: ParsedContractData;
  approvalStatus?: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateContractRequest {
  blueprintId: string;
  title: string;
  contractNumber: string;
  contractType: ContractType;
  partyA: ContractParty;
  partyB: ContractParty;
  partyC?: ContractParty;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
  paymentTerms?: string;
  startDate: Date;
  endDate: Date;
  effectiveDate?: Date;
  signedDate?: Date;
  description?: string;
  attachments?: ContractAttachment[];
  originalFileUrl?: string;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  status?: ContractStatus;
  version?: number;
  previousVersionId?: string;
  parsedData?: ParsedContractData;
  approvalStatus?: ApprovalStatus;
  approvalHistory?: ApprovalRecord[];
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date | null;
}

