import { api } from './api';

/**
 * User Service - handles all user management operations
 */

/**
 * Get all users for the current merchant
 * @returns {Promise<Array>}
 */
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Get a single user by ID
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Create a new user
 * @param {Object} userData - {name, email, password, role, merchant_id}
 * @returns {Promise<Object>}
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

/**
 * Update an existing user
 * @param {string} userId
 * @param {Object} userData - Fields to update
 * @returns {Promise<Object>}
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

/**
 * Delete a user  
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response;
};
