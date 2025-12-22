// src/services/api/commentAPI.js
import api from './index.js';

/**
 * Comment API endpoints
 */
export const commentAPI = {
    /**
     * Get comments for a specific movie
     * @param {string} movieId - Movie ID
     * @returns {Promise} List of movie comments
     */
    getByMovie: (movieId) => api.get(`/comments/movie/${movieId}`),

    /**
     * Create new comment
     * @param {Object} data - Comment data (movieId, text, parentId)
     * @returns {Promise} Created comment
     */
    create: (data) => api.post('/comments', data),

    /**
     * Update comment
     * @param {string} id - Comment ID
     * @param {Object} data - Updated comment data
     * @returns {Promise} Updated comment
     */
    update: (id, data) => api.put(`/comments/${id}`, data),

    /**
     * Delete comment
     * @param {string} id - Comment ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/comments/${id}`),

    /**
     * Like a comment
     * @param {string} id - Comment ID
     * @returns {Promise} Updated comment with like count
     */
    like: (id) => api.post(`/comments/${id}/like`),

    /**
     * Dislike a comment
     * @param {string} id - Comment ID
     * @returns {Promise} Updated comment with dislike count
     */
    dislike: (id) => api.post(`/comments/${id}/dislike`),

    /**
     * Report a comment
     * @param {string} id - Comment ID
     * @param {string} reason - Report reason
     * @returns {Promise} Report confirmation
     */
    report: (id, reason) => api.post(`/comments/${id}/report`, { reason })
};
