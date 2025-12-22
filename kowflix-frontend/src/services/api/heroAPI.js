// src/services/api/heroAPI.js
import api from './index.js';

/**
 * Hero Banner API endpoints (Admin only)
 */
export const heroAPI = {
    /**
     * Get all hero banners
     * @param {boolean} activeOnly - Get only active banners
     * @returns {Promise} List of hero banners
     */
    getAll: (activeOnly = false) => api.get('/hero', { params: { active: activeOnly } }),

    /**
     * Create new hero banner
     * @param {Object} data - Banner data
     * @returns {Promise} Created banner
     */
    create: (data) => api.post('/hero', data),

    /**
     * Update hero banner
     * @param {string} id - Banner ID
     * @param {Object} data - Updated banner data
     * @returns {Promise} Updated banner
     */
    update: (id, data) => api.put(`/hero/${id}`, data),

    /**
     * Delete hero banner
     * @param {string} id - Banner ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/hero/${id}`),

    /**
     * Reorder hero banners
     * @param {Array} banners - Array of banner IDs in new order
     * @returns {Promise} Updated banners
     */
    reorder: (banners) => api.post('/hero/reorder', { banners }),
};
