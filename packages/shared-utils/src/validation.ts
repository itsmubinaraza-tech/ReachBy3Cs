/**
 * Validation utilities shared across web and mobile apps
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return { valid: true, errors: [] };
}

/**
 * Create a failed validation result
 */
export function invalidResult(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * Validate an email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult();
}

/**
 * Validate a password
 */
export function validatePassword(password: string, options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options || {};

  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (requireNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult();
}

/**
 * Validate that a string is not empty
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return invalidResult([`${fieldName} is required`]);
  }
  return validResult();
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  fieldName: string,
  options: { min?: number; max?: number }
): ValidationResult {
  const errors: string[] = [];
  const { min, max } = options;

  if (min !== undefined && value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }
  if (max !== undefined && value.length > max) {
    errors.push(`${fieldName} must be at most ${max} characters`);
  }

  return errors.length > 0 ? invalidResult(errors) : validResult();
}

/**
 * Validate a URL
 */
export function validateUrl(url: string, options?: {
  requireHttps?: boolean;
  allowEmpty?: boolean;
}): ValidationResult {
  const { requireHttps = false, allowEmpty = false } = options || {};

  if (!url) {
    if (allowEmpty) {
      return validResult();
    }
    return invalidResult(['URL is required']);
  }

  try {
    const parsed = new URL(url);
    if (requireHttps && parsed.protocol !== 'https:') {
      return invalidResult(['URL must use HTTPS']);
    }
    return validResult();
  } catch {
    return invalidResult(['Invalid URL format']);
  }
}

/**
 * Validate a slug (URL-safe identifier)
 */
export function validateSlug(slug: string, fieldName = 'Slug'): ValidationResult {
  const errors: string[] = [];

  if (!slug) {
    errors.push(`${fieldName} is required`);
  } else {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push(`${fieldName} must contain only lowercase letters, numbers, and hyphens`);
    }
    if (slug.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters`);
    }
    if (slug.length > 50) {
      errors.push(`${fieldName} must be at most 50 characters`);
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult();
}

/**
 * Validate a UUID
 */
export function validateUuid(uuid: string, fieldName = 'ID'): ValidationResult {
  if (!uuid) {
    return invalidResult([`${fieldName} is required`]);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return invalidResult([`${fieldName} must be a valid UUID`]);
  }

  return validResult();
}

/**
 * Validate a number is within range
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  options: { min?: number; max?: number }
): ValidationResult {
  const errors: string[] = [];
  const { min, max } = options;

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
  } else {
    if (min !== undefined && value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      errors.push(`${fieldName} must be at most ${max}`);
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult();
}

/**
 * Validate CTS score (0.0 - 1.0)
 */
export function validateCtsScore(score: number): ValidationResult {
  return validateNumberRange(score, 'CTS score', { min: 0, max: 1 });
}

/**
 * Validate CTA level (0-3)
 */
export function validateCtaLevel(level: number): ValidationResult {
  if (!Number.isInteger(level)) {
    return invalidResult(['CTA level must be an integer']);
  }
  return validateNumberRange(level, 'CTA level', { min: 0, max: 3 });
}

/**
 * Validate risk level
 */
export function validateRiskLevel(level: string): ValidationResult {
  const validLevels = ['low', 'medium', 'high', 'blocked'];
  if (!validLevels.includes(level)) {
    return invalidResult([`Risk level must be one of: ${validLevels.join(', ')}`]);
  }
  return validResult();
}

/**
 * Validate response status
 */
export function validateResponseStatus(status: string): ValidationResult {
  const validStatuses = ['pending', 'approved', 'rejected', 'edited', 'posted', 'failed'];
  if (!validStatuses.includes(status)) {
    return invalidResult([`Status must be one of: ${validStatuses.join(', ')}`]);
  }
  return validResult();
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return allErrors.length > 0 ? invalidResult(allErrors) : validResult();
}

/**
 * Validate an object against a schema of validators
 */
export function validateObject<T extends Record<string, unknown>>(
  obj: T,
  validators: Partial<Record<keyof T, (value: unknown) => ValidationResult>>
): ValidationResult {
  const results: ValidationResult[] = [];

  for (const [key, validator] of Object.entries(validators)) {
    if (validator) {
      results.push(validator(obj[key as keyof T]));
    }
  }

  return combineValidations(...results);
}
