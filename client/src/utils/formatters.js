/**
 * Shared formatting utilities for consistent data display across the application
 */

/**
 * Format amount as Indian Rupees
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "₹1,234.56")
 */
export const formatCurrency = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format date for Indian locale
 * @param {string|Date} date - Date to format
 * @param {string} format - 'short' | 'long' | 'full'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Guard against invalid dates
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (format) {
    case 'short':
      // Output: "Jan 29"
      return dateObj.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      });
    case 'long':
      // Output: "Jan 29, 10:30 AM"
      return dateObj.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    case 'full':
      // Output: "1/29/2026, 10:30:45 AM"
      return dateObj.toLocaleString('en-IN');
    default:
      return dateObj.toLocaleDateString('en-IN');
  }
};

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, 'short');
};

/**
 * Format account number with masking
 * @param {string} accountNumber - Full account number
 * @param {number} visibleDigits - Number of digits to show at end (default: 4)
 * @returns {string} Masked account number (e.g., "XXXX1234")
 */
export const formatAccountNumber = (accountNumber, visibleDigits = 4) => {
  if (!accountNumber) return '-';
  const visible = accountNumber.slice(-visibleDigits);
  const masked = 'X'.repeat(Math.max(0, accountNumber.length - visibleDigits));
  return masked + visible;
};

/**
 * Format status badge text
 * @param {string} status - Status value (SUCCESS, FAILED, PROCESSING, etc.)
 * @returns {string} Formatted status text
 */
export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0) + status.slice(1).toLowerCase();
};
