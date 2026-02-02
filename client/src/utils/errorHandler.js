/**
 * Centralized error handling utilities
 */

import { toast } from 'sonner';

/**
 * Handle API errors consistently across the app
 * @param {Error} error - Error object
 * @param {string} context - User-friendly context (e.g., "fetching transactions")
 * @param {boolean} showToast - Show toast notification (default: true)
 */
export const handleApiError = (error, context = 'processing request', showToast = true) => {
  // Log to console for debugging
  console.error(`Error ${context}:`, error);
  
  // Extract user-friendly message
  const message = error?.message || 'An unexpected error occurred';
  
  // Show toast notification
  if (showToast) {
    toast.error(`Failed ${context}`, {
      description: message
    });
  }
};

/**
 * Wrapper for async operations with automatic error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {string} errorContext - Context for error messages
 * @param {boolean} showToast - Show error toast (default: true)
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const safeAsync = async (asyncFn, errorContext = 'operation', showToast = true) => {
  try {
    const data = await asyncFn();
    return { data, error: null };
  } catch (error) {
    handleApiError(error, errorContext, showToast);
    return { data: null, error };
  }
};

/**
 * Validate form data and return errors
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules { field: { required, minLength, pattern, etc }}
 * @returns {Object} Validation errors { field: errorMessage }
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const rule = rules[field];
    
    // Required check
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      return;
    }
    
    // Skip other validations if empty and not required
    if (!value) return;
    
    // Min length check
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
    }
    
    // Max length check
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} must be less than ${rule.maxLength} characters`;
    }
    
    // Pattern check (regex)
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${field} format is invalid`;
    }
    
    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      errors[field] = rule.validatorMessage || `${field} is invalid`;
    }
  });
  
  return errors;
};
