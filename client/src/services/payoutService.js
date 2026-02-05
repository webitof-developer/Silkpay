/**
 * Payout Service - Handles all payout-related API calls
 * Separates business logic from UI components
 */

import { api } from './api';

/**
 * Get all payouts with optional filters
 * @param {Object} filters - Filter parameters (status, date range, etc.)
 * @returns {Promise<{payouts: Array, total: number}>}
 */
export const getPayouts = async (filters = {}) => {
  const response = await api.get('/payouts', filters);
  return response.data || { payouts: [], total: 0 };
};

/**
 * Get single payout by ID
 * @param {string} id - Payout ID
 * @returns {Promise<Object>}
 */
export const getPayoutById = async (id) => {
  const response = await api.get(`/payouts/${id}`);
  return response.data;
};

/**
 * Create new payout
 * @param {Object} payoutData - Payout details (beneficiary, amount, etc.)
 * @returns {Promise<Object>}
 */
export const createPayout = async (payoutData) => {
  const response = await api.post('/payouts', payoutData);
  return response.data;
};

/**
 * Query payout status from SilkPay
 * @param {string} payOrderId - SilkPay order ID
 * @returns {Promise<Object>}
 */
export const queryPayoutStatus = async (payOrderId) => {
  const response = await api.post('/payouts/query', { payOrderId });
  console.log(response.data);
  return response.data;
};

/**
 * Export payouts to CSV
 * @param {Object} filters - Export filters
 * @returns {Promise<void>}
 */
export const exportPayouts = async (filters = {}) => {
  return api.exportData('/payouts/export', filters);
};
