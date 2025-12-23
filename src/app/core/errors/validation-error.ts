import { BlueprintError } from '@core/blueprint/errors';

/**
 * Validation error detail
 * 驗證錯誤細節
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation error
 * 驗證錯誤
 */
export class ValidationError extends BlueprintError {
  constructor(
    field: string,
    message: string,
    public errors: ValidationErrorDetail[]
  ) {
    super(`Validation failed for ${field}: ${message}`, 'VALIDATION_ERROR', 'low', true, { field, errors });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
