import { BlueprintError } from './blueprint-error';

/**
 * Permission denied error
 * 權限拒絕錯誤
 */
export class PermissionDeniedError extends BlueprintError {
  constructor(resource: string, action: string) {
    super(`Permission denied: Cannot ${action} ${resource}`, 'PERMISSION_DENIED', 'high', false, { resource, action });
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}
