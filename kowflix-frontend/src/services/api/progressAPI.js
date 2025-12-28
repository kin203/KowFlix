// src/services/api/progressAPI.js
import api from './index.js';

/**
 * Watch Progress API endpoints
 */
export const progressAPI = {
    /**
     * Save watch progress for a movie
     * @param {string} movieId - Movie ID
     * @param {Object} data - Progress data (currentTime, duration, etc.)
     * @returns {Promise} Saved progress
     */
    save: (movieId, data) => api.post(`/progress/${movieId}`, data),

    /**
     * Get watch progress for a movie
     * @param {string} movieId - Movie ID
     * @returns {Promise} Progress data
     */
    get: (movieId) => api.get(`/progress/${movieId}`),

    /**
     * Get all watch progress for current user
     * @returns {Promise} List of all progress records
     */
    getAll: () => api.get('/progress'),

    /**
     * Delete watch progress for a movie
     * @param {string} movieId - Movie ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (movieId) => api.delete(`/progress/${movieId}`),

    /**
     * Get watch history (all watched movies including completed)
     * @returns {Promise} List of all watched movies with progress
     */
    getHistory: () => api.get('/progress/history'),
};
