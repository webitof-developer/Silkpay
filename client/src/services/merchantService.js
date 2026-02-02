/**
 * Merchant Service - Handles merchant profile and settings API calls
 */

import { api } from './api';

/**
 * Get merchant profile
 * @returns {Promise<Object>}
 */
export const getMerchantProfile = async () => {
  const response = await api.get('/merchant/profile');
  return response.data || {};
};

/**
 * Update merchant profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>}
 */
export const updateMerchantProfile = async (updates) => {
  // Filter out read-only fields that cause validation errors (e.g. id, email, balance)
  const allowedFields = ['name', 'mobile', 'avatar', 'username'];
  const filteredUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  const response = await api.put('/merchant/profile', filteredUpdates);
  return response.data;
};

/**
 * Get merchant API keys
 * @returns {Promise<Object>}
 */
export const getApiKeys = async () => {
  const response = await api.get('/merchant/api-keys');
  return response.data || {};
};

/**
 * Regenerate secret key
 * @returns {Promise<Object>}
 */
export const regenerateSecretKey = async () => {
  const response = await api.post('/merchant/api-keys/regenerate');
  return response.data;
};

/**
 * Update IP whitelist
 * @param {Array<string>} ips - Array of IP addresses
 * @returns {Promise<Object>}
 */
export const updateIpWhitelist = async (ips) => {
  const response = await api.put('/merchant/api-keys/whitelist', { ips });
  return response.data;
};

/**
 * Change password
 * @param {Object} passwordData - { currentPassword, newPassword }
 * @returns {Promise<Object>}
 */
export const changePassword = async (passwordData) => {
  const response = await api.post('/merchant/change-password', passwordData);
  return response.data;
};
