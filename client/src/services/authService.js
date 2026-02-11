/**
 * Authentication Service - Handles all auth-related operations
 * Note: This uses direct fetch instead of api.js since auth endpoints don't need tokens
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, merchant: Object}>}
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Login failed');
  }

  // Store auth data
  if (typeof window !== 'undefined') {
    if (data.data.token) {
      localStorage.setItem('authToken', data.data.token); // Keep original key for consistency with other functions
      if (data.data.user) { // Assuming 'user' is now returned instead of 'merchant'
        localStorage.setItem('user', JSON.stringify(data.data.user));
        // Also store role separately for quick access
        localStorage.setItem('role', data.data.user.role);
      }
    }
  }
  
  return data.data;
};

/**
 * Logout user
 */
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Password reset request failed');
  }

  return data;
};

/**
 * Reset password with token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<Object>}
 */
export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: newPassword })
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Password reset failed');
  }

  return data;
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
};

/**
 * Get current user info from localStorage
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get current user role from localStorage
 * @returns {string|null}
 */
export const getUserRole = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('role') || null;
};

/**
 * Check if the current user has an ADMIN role
 * @returns {boolean}
 */
export const isAdmin = () => {
  if (typeof window === 'undefined') return false;
  return getUserRole() === 'ADMIN';
};
