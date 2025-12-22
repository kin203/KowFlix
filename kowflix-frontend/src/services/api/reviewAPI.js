// src/services/api/reviewAPI.js
import api from './index.js';

/**
 * Review API endpoints
 */
export const reviewAPI = {
    /**
     * Get all reviews
     * @param {Object} params - Query parameters
     * @returns {Promise} List of reviews
     */
    getAll: (params) => api.get('/reviews', { params }),

    /**
     * Get reviews for a specific movie
     * @param {string} movieId - Movie ID
     * @returns {Promise} List of movie reviews
     */
    getByMovie: (movieId) => api.get(`/reviews/movie/${movieId}`),

    /**
     * Get movie reviews (alias for compatibility)
     * @param {string} movieId - Movie ID
     * @returns {Promise} List of movie reviews
     */
    getMovieReviews: (movieId) => api.get(`/reviews/movie/${movieId}`),

    /**
     * Create new review
     * @param {Object} data - Review data (movieId, rating, text)
     * @returns {Promise} Created review
     */
    create: (data) => api.post('/reviews', data),

    /**
     * Update review
     * @param {string} id - Review ID
     * @param {Object} data - Updated review data
     * @returns {Promise} Updated review
     */
    update: (id, data) => api.put(`/reviews/${id}`, data),

    /**
     * Delete review
     * @param {string} id - Review ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/reviews/${id}`),

    /**
     * Like a review
     * @param {string} id - Review ID
     * @returns {Promise} Updated review with like count
     */
    like: (id) => api.post(`/reviews/${id}/like`),

    /**
     * Dislike a review
     * @param {string} id - Review ID
     * @returns {Promise} Updated review with dislike count
     */
    dislike: (id) => api.post(`/reviews/${id}/dislike`)
};
