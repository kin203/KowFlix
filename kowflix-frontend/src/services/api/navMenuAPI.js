// src/services/api/navMenuAPI.js
import api from './index.js';

/**
 * Navigation Menu API endpoints
 */
export const navMenuAPI = {
    /**
     * Get all navigation menu items
     * @returns {Promise} List of menu items
     */
    getAll: () => api.get('/nav-menu'),

    /**
     * Get all navigation menu items (Admin)
     * @returns {Promise} List of all menu items
     */
    getAllAdmin: () => api.get('/nav-menu/admin/all'),

    /**
     * Create new menu item (Admin only)
     * @param {Object} data - Menu item data
     * @returns {Promise} Created menu item
     */
    create: (data) => api.post('/nav-menu', data),

    /**
     * Update menu item (Admin only)
     * @param {string} id - Menu item ID
     * @param {Object} data - Updated menu item data
     * @returns {Promise} Updated menu item
     */
    update: (id, data) => api.put(`/nav-menu/${id}`, data),

    /**
     * Delete menu item (Admin only)
     * @param {string} id - Menu item ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/nav-menu/${id}`),

    /**
     * Reorder menu items (Admin only)
     * @param {Array} items - Array of menu item IDs in new order
     * @returns {Promise} Updated menu items
     */
    reorder: (items) => api.post('/nav-menu/reorder', { items })
};
