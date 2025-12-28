// src/services/api/wishlistAPI.js
import api from './index.js';

/**
 * Wishlist API endpoints
 */
export const wishlistAPI = {
    /**
     * Get user's wishlist
     * @returns {Promise} List of favorite movies
     */
    get: () => api.get('/wishlist'),

    /**
     * Add movie to wishlist
     * @param {string} movieId - Movie ID
     * @returns {Promise} Success confirmation
     */
    add: (movieId) => api.post(`/wishlist/${movieId}`),

    /**
     * Remove movie from wishlist
     * @param {string} movieId - Movie ID
     * @returns {Promise} Success confirmation
     */
    remove: (movieId) => api.delete(`/wishlist/${movieId}`),

    /**
     * Check if movie is in wishlist
     * @param {string} movieId - Movie ID
     * @returns {Promise} { inWishlist: boolean }
     */
    check: (movieId) => api.get(`/wishlist/check/${movieId}`)
};

export default wishlistAPI;
