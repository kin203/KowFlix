// src/services/api/categoryAPI.js
import api from './index.js';

/**
 * Category API endpoints
 */
export const categoryAPI = {
    /**
     * Get all categories
     * @returns {Promise} List of all categories
     */
    getAll: () => api.get('/categories'),

    /**
     * Get only active categories
     * @returns {Promise} List of active categories
     */
    getActive: () => api.get('/categories/active'),

    /**
     * Get single category by ID
     * @param {string} id - Category ID
     * @returns {Promise} Category details
     */
    getOne: (id) => api.get(`/categories/${id}`),

    /**
     * Create new category (Admin only)
     * @param {Object} data - Category data
     * @returns {Promise} Created category
     */
    create: (data) => api.post('/categories', data),

    /**
     * Update category (Admin only)
     * @param {string} id - Category ID
     * @param {Object} data - Updated category data
     * @returns {Promise} Updated category
     */
    update: (id, data) => api.put(`/categories/${id}`, data),

    /**
     * Delete category (Admin only)
     * @param {string} id - Category ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/categories/${id}`),

    /**
     * Reorder categories (Admin only)
     * @param {Array} categories - Array of category IDs in new order
     * @returns {Promise} Updated categories
     */
    reorder: (categories) => api.post('/categories/reorder', { categories }),

    /**
     * Get movies by category slug
     * @param {string} slug - Category slug
     * @returns {Promise} List of movies in category
     */
    getMoviesBySlug: (slug) => api.get(`/categories/${slug}/movies`),
};
