/**
 * Utility functions for file validation and processing
 * Enterprise-standard validation and security checks
 */

import { ALLOWED_CONTENT_TYPES, BLOCKED_EXTENSIONS, MAX_FILE_SIZE, FileValidationResult, FileCategory } from '../types';

import * as path from 'path';

/**
 * Validates file based on content type, size, and extension
 *
 * @param contentType - File MIME type
 * @param fileSize - File size in bytes
 * @param fileName - File name with extension
 * @returns Validation result with reason if invalid
 */
export function validateFile(contentType: string | undefined, fileSize: number, fileName: string): FileValidationResult {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  // Check file extension
  const fileExtension = path.extname(fileName).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(fileExtension as any)) {
    return {
      valid: false,
      reason: `File extension ${fileExtension} is not allowed for security reasons`
    };
  }

  // Check content type
  if (!contentType) {
    return {
      valid: false,
      reason: 'File content type is missing'
    };
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType as any)) {
    return {
      valid: false,
      reason: `Content type ${contentType} is not allowed`
    };
  }

  return { valid: true };
}

/**
 * Determines file category based on content type
 *
 * @param contentType - File MIME type
 * @returns File category
 */
export function getFileCategory(contentType: string | undefined): FileCategory {
  if (!contentType) return 'other';

  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('text/')) return 'text';

  // Documents
  if (
    contentType === 'application/pdf' ||
    contentType === 'application/msword' ||
    contentType.includes('wordprocessingml') ||
    contentType.includes('spreadsheetml') ||
    contentType.includes('presentationml')
  ) {
    return 'document';
  }

  // Archives
  if (contentType === 'application/zip' || contentType.includes('compressed') || contentType.includes('archive')) {
    return 'archive';
  }

  return 'other';
}

/**
 * Checks if file is an image
 *
 * @param contentType - File MIME type
 * @returns True if file is an image
 */
export function isImageFile(contentType: string | undefined): boolean {
  return contentType?.startsWith('image/') || false;
}

/**
 * Checks if file is a document
 *
 * @param contentType - File MIME type
 * @param fileExtension - File extension (e.g., '.pdf')
 * @returns True if file is a document
 */
export function isDocumentFile(contentType: string | undefined, fileExtension: string): boolean {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

  return (contentType && docTypes.includes(contentType)) || docExtensions.includes(fileExtension.toLowerCase());
}

/**
 * Checks if file requires thumbnail generation
 *
 * @param contentType - File MIME type
 * @returns True if thumbnail should be generated
 */
export function requiresThumbnail(contentType: string | undefined): boolean {
  return isImageFile(contentType);
}

/**
 * Sanitizes file name to prevent path traversal and other security issues
 *
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');

  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');

  // Replace unsafe characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  return sanitized;
}

/**
 * Generates thumbnail path from original file path
 *
 * @param filePath - Original file path
 * @returns Thumbnail file path
 */
export function getThumbnailPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const nameWithoutExt = path.basename(fileName, ext);

  return path.join(dir, 'thumbnails', `thumb_${nameWithoutExt}${ext}`);
}

/**
 * Formats file size for human-readable display
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extracts bucket name from storage event
 *
 * @param bucketName - Full bucket name from event
 * @returns Bucket name without project prefix
 */
export function extractBucketName(bucketName: string): string {
  // Remove project prefix if present (e.g., "project-id.appspot.com" -> "appspot.com")
  return bucketName.split('.').slice(-2).join('.');
}

/**
 * Checks if file should be processed based on path
 *
 * @param filePath - File path in storage
 * @returns True if file should be processed
 */
export function shouldProcessFile(filePath: string): boolean {
  // Skip already processed files
  if (filePath.includes('/thumbnails/')) return false;
  if (filePath.includes('/temp/')) return false;
  if (filePath.includes('/backup/')) return false;

  // Skip system files
  if (path.basename(filePath).startsWith('.')) return false;

  return true;
}
