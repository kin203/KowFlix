// src/services/api/userAPI.js
import api from './index.js';

/**
 * User Management API endpoints (Admin only)
 */
export const userAPI = {
    /**
     * Get all users
     * @param {Object} params - Query parameters (page, limit, role, etc.)
     * @returns {Promise} List of users
     */
    getAll: (params) => api.get('/users', { params }),

    /**
     * Get single user by ID
     * @param {string} id - User ID
     * @returns {Promise} User details
     */
    getOne: (id) => api.get(`/users/${id}`),

    /**
     * Update user role
     * @param {string} id - User ID
     * @param {string} role - New role ('user' or 'admin')
     * @returns {Promise} Updated user
     */
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),

    /**
     * Delete user
     * @param {string} id - User ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/users/${id}`),
};
