/**
 * Shared utilities for the Needs-Matched Engagement Platform
 * Used by both web and mobile applications
 */

// Formatting utilities
export {
  formatRelativeTime,
  formatShortDate,
  formatFullDateTime,
  truncateText,
  formatCompactNumber,
  formatPercentage,
  formatScore,
  capitalize,
  slugToTitle,
  toSlug,
  formatRiskLevel,
  formatCTALevel,
  formatResponseStatus,
  formatPlatformName,
} from './formatting';

// Validation utilities
export {
  type ValidationResult,
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
} from './validation';
