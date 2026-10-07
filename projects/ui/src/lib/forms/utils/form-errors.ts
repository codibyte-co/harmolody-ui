import { ValidationErrors } from '@angular/forms';

/**
 * Maps Angular validation errors to user-friendly error messages
 */
export function getErrorMessage(
  errors: ValidationErrors | null | undefined,
  fieldName?: string,
): string {
  if (!errors) {
    return '';
  }

  const field = fieldName || 'This field';

  // Required
  if (errors['required']) {
    return `${field} is required`;
  }

  // Email
  if (errors['email']) {
    return 'Please enter a valid email address';
  }

  // Min length
  if (errors['minlength']) {
    const requiredLength = errors['minlength'].requiredLength;
    return `${field} must be at least ${requiredLength} characters`;
  }

  // Max length
  if (errors['maxlength']) {
    const requiredLength = errors['maxlength'].requiredLength;
    return `${field} must not exceed ${requiredLength} characters`;
  }

  // Min value
  if (errors['min']) {
    const min = errors['min'].min;
    return `${field} must be at least ${min}`;
  }

  // Max value
  if (errors['max']) {
    const max = errors['max'].max;
    return `${field} must not exceed ${max}`;
  }

  // Pattern
  if (errors['pattern']) {
    return `${field} format is invalid`;
  }

  // Password mismatch (custom validator)
  if (errors['passwordMismatch']) {
    return 'Passwords do not match';
  }

  // URL validation
  if (errors['url']) {
    return 'Please enter a valid URL';
  }

  // Fallback for unknown errors
  return `${field} is invalid`;
}

/**
 * Gets all error messages for a control
 */
export function getErrorMessages(
  errors: ValidationErrors | null | undefined,
  fieldName?: string,
): string[] {
  if (!errors) {
    return [];
  }

  return Object.keys(errors).map((key) => {
    const error = { [key]: errors[key] };
    return getErrorMessage(error, fieldName);
  });
}
