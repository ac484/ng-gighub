/**
 * Firebase Functions Integration Types
 *
 * Type definitions for calling Firebase Functions from Contract Module
 *
 * Functions modules:
 * - functions-ai-document: Document AI processing
 * - functions-storage: Storage operations
 * - functions-firestore: Firestore operations
 * - functions-ai: AI generation
 */

// ============================================
// functions-ai-document Types
// ============================================

export interface ProcessDocumentFromStorageRequest {
  gcsUri: string;
  mimeType: string;
  skipHumanReview?: boolean;
  fieldMask?: string;
}

export interface ProcessDocumentFromContentRequest {
  content: string; // base64 encoded
  mimeType: string;
  skipHumanReview?: boolean;
  fieldMask?: string;
}

export interface BatchProcessDocumentsRequest {
  inputDocuments: Array<{
    gcsUri: string;
    mimeType: string;
  }>;
  outputGcsUri: string;
  skipHumanReview?: boolean;
}

export interface DocumentProcessingResult {
  text: string;
  pages?: Array<{
    pageNumber: number;
    width: number;
    height: number;
    paragraphs?: string[];
  }>;
  entities?: Array<{
    type: string;
    mentionText: string;
    confidence?: number;
    normalizedValue?: string;
  }>;
  formFields?: Array<{
    fieldName: string;
    fieldValue: string;
    confidence?: number;
  }>;
  metadata: {
    processorVersion: string;
    processingTime: number;
    pageCount: number;
    mimeType: string;
  };
}

export interface ProcessDocumentResponse {
  success: boolean;
  result?: DocumentProcessingResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BatchProcessResponse {
  success: boolean;
  result?: {
    operationName: string;
    status: string;
    outputGcsUri: string;
    totalDocuments: number;
    metadata: {
      startTime: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// functions-storage Types
// ============================================

export interface UpdateFileMetadataRequest {
  filePath: string;
  metadata: {
    description?: string;
    tags?: string[];
    category?: string;
    [key: string]: any;
  };
}

export interface UpdateFileMetadataResponse {
  success: boolean;
  message?: string;
}

export interface FileMetadata {
  processed: string;
  validationStatus: 'success' | 'failed';
  processedAt: string;
  originalName: string;
  fileType: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'text' | 'other';
  requiresThumbnail: string;
  requiresProcessing: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  validationReason?: string;
}

// ============================================
// functions-firestore Types
// ============================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in-progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  [key: string]: any;
}

export interface UpdateTaskRequest {
  taskId: string;
  updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in-progress' | 'completed';
    assignee?: string;
    dueDate?: string;
    [key: string]: any;
  };
}

export interface DeleteTaskRequest {
  taskId: string;
  hardDelete?: boolean;
}

export interface ListTasksRequest {
  status?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface FirestoreOperationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// functions-ai Types
// ============================================

export interface GenerateContentRequest {
  prompt?: string;
  contents?: string | any[];
  model?: string;
  config?: {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
}

export interface GenerateContentResponse {
  success: boolean;
  data?: {
    text?: string;
    usageMetadata?: {
      promptTokenCount: number;
      candidatesTokenCount: number;
      totalTokenCount: number;
    };
    finishReason?: string;
  };
  error?: {
    type: string;
    message: string;
    code?: string;
  };
}

export interface GenerateTextRequest {
  prompt: string;
  model?: string;
  config?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

export interface GenerateTextResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Common Types
// ============================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: any;
}
