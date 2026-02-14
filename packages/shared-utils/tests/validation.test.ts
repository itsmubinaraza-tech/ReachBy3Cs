import { describe, it, expect } from 'vitest';
import {
  validResult,
  invalidResult,
  validateEmail,
  validatePassword,
  validateRequired,
  validateLength,
  validateUrl,
  validateSlug,
  validateUuid,
  validateNumberRange,
  validateCtsScore,
  validateCtaLevel,
  validateRiskLevel,
  validateResponseStatus,
  combineValidations,
  validateObject,
} from '../src/validation';

describe('validResult', () => {
  it('returns valid result', () => {
    expect(validResult()).toEqual({ valid: true, errors: [] });
  });
});

describe('invalidResult', () => {
  it('returns invalid result with errors', () => {
    expect(invalidResult(['Error 1', 'Error 2'])).toEqual({
      valid: false,
      errors: ['Error 1', 'Error 2'],
    });
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('test@example.com').valid).toBe(true);
    expect(validateEmail('user.name@domain.co.uk').valid).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('rejects invalid format', () => {
    expect(validateEmail('invalid').valid).toBe(false);
    expect(validateEmail('invalid@').valid).toBe(false);
    expect(validateEmail('@domain.com').valid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts valid passwords', () => {
    expect(validatePassword('Password1').valid).toBe(true);
  });

  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('rejects short passwords', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at least 8 characters');
  });

  it('rejects missing uppercase', () => {
    const result = validatePassword('password1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects missing lowercase', () => {
    const result = validatePassword('PASSWORD1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('rejects missing number', () => {
    const result = validatePassword('Password');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('respects custom options', () => {
    const result = validatePassword('short', { minLength: 3, requireUppercase: false, requireNumber: false });
    expect(result.valid).toBe(true);
  });

  it('validates special characters when required', () => {
    const result = validatePassword('Password1', { requireSpecial: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });
});

describe('validateRequired', () => {
  it('accepts non-empty strings', () => {
    expect(validateRequired('hello', 'Name').valid).toBe(true);
  });

  it('rejects empty strings', () => {
    const result = validateRequired('', 'Name');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('rejects whitespace-only strings', () => {
    const result = validateRequired('   ', 'Name');
    expect(result.valid).toBe(false);
  });
});

describe('validateLength', () => {
  it('accepts valid lengths', () => {
    expect(validateLength('hello', 'Name', { min: 3, max: 10 }).valid).toBe(true);
  });

  it('rejects too short', () => {
    const result = validateLength('hi', 'Name', { min: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at least 3 characters');
  });

  it('rejects too long', () => {
    const result = validateLength('hello world', 'Name', { max: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at most 5 characters');
  });
});

describe('validateUrl', () => {
  it('accepts valid URLs', () => {
    expect(validateUrl('https://example.com').valid).toBe(true);
    expect(validateUrl('http://example.com/path').valid).toBe(true);
  });

  it('rejects empty URL by default', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
  });

  it('allows empty when configured', () => {
    expect(validateUrl('', { allowEmpty: true }).valid).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(validateUrl('not a url').valid).toBe(false);
  });

  it('rejects HTTP when HTTPS required', () => {
    const result = validateUrl('http://example.com', { requireHttps: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL must use HTTPS');
  });
});

describe('validateSlug', () => {
  it('accepts valid slugs', () => {
    expect(validateSlug('my-slug').valid).toBe(true);
    expect(validateSlug('slug123').valid).toBe(true);
  });

  it('rejects empty slug', () => {
    expect(validateSlug('').valid).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(validateSlug('My Slug').valid).toBe(false);
    expect(validateSlug('my_slug').valid).toBe(false);
  });

  it('rejects too short', () => {
    expect(validateSlug('a').valid).toBe(false);
  });
});

describe('validateUuid', () => {
  it('accepts valid UUIDs', () => {
    expect(validateUuid('123e4567-e89b-12d3-a456-426614174000').valid).toBe(true);
  });

  it('rejects empty', () => {
    expect(validateUuid('').valid).toBe(false);
  });

  it('rejects invalid format', () => {
    expect(validateUuid('not-a-uuid').valid).toBe(false);
    expect(validateUuid('123e4567-e89b-12d3-a456').valid).toBe(false);
  });
});

describe('validateNumberRange', () => {
  it('accepts values in range', () => {
    expect(validateNumberRange(5, 'Value', { min: 0, max: 10 }).valid).toBe(true);
  });

  it('rejects below min', () => {
    const result = validateNumberRange(-1, 'Value', { min: 0 });
    expect(result.valid).toBe(false);
  });

  it('rejects above max', () => {
    const result = validateNumberRange(11, 'Value', { max: 10 });
    expect(result.valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateNumberRange(NaN, 'Value', {}).valid).toBe(false);
  });
});

describe('validateCtsScore', () => {
  it('accepts valid scores', () => {
    expect(validateCtsScore(0).valid).toBe(true);
    expect(validateCtsScore(0.5).valid).toBe(true);
    expect(validateCtsScore(1).valid).toBe(true);
  });

  it('rejects out of range', () => {
    expect(validateCtsScore(-0.1).valid).toBe(false);
    expect(validateCtsScore(1.1).valid).toBe(false);
  });
});

describe('validateCtaLevel', () => {
  it('accepts valid levels', () => {
    expect(validateCtaLevel(0).valid).toBe(true);
    expect(validateCtaLevel(3).valid).toBe(true);
  });

  it('rejects non-integers', () => {
    expect(validateCtaLevel(1.5).valid).toBe(false);
  });

  it('rejects out of range', () => {
    expect(validateCtaLevel(-1).valid).toBe(false);
    expect(validateCtaLevel(4).valid).toBe(false);
  });
});

describe('validateRiskLevel', () => {
  it('accepts valid levels', () => {
    expect(validateRiskLevel('low').valid).toBe(true);
    expect(validateRiskLevel('medium').valid).toBe(true);
    expect(validateRiskLevel('high').valid).toBe(true);
    expect(validateRiskLevel('blocked').valid).toBe(true);
  });

  it('rejects invalid levels', () => {
    expect(validateRiskLevel('invalid').valid).toBe(false);
  });
});

describe('validateResponseStatus', () => {
  it('accepts valid statuses', () => {
    expect(validateResponseStatus('pending').valid).toBe(true);
    expect(validateResponseStatus('approved').valid).toBe(true);
    expect(validateResponseStatus('rejected').valid).toBe(true);
    expect(validateResponseStatus('posted').valid).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(validateResponseStatus('invalid').valid).toBe(false);
  });
});

describe('combineValidations', () => {
  it('returns valid when all valid', () => {
    const result = combineValidations(validResult(), validResult());
    expect(result.valid).toBe(true);
  });

  it('returns invalid with combined errors', () => {
    const result = combineValidations(
      invalidResult(['Error 1']),
      validResult(),
      invalidResult(['Error 2', 'Error 3'])
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
  });
});

describe('validateObject', () => {
  it('validates object against schema', () => {
    const obj = { email: 'test@example.com', name: 'John' };
    const result = validateObject(obj, {
      email: (v) => validateEmail(v as string),
      name: (v) => validateRequired(v as string, 'Name'),
    });
    expect(result.valid).toBe(true);
  });

  it('returns combined errors', () => {
    const obj = { email: 'invalid', name: '' };
    const result = validateObject(obj, {
      email: (v) => validateEmail(v as string),
      name: (v) => validateRequired(v as string, 'Name'),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});
