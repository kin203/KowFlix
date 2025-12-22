// src/services/api/movieAPI.js
import api, { API_URL } from './index.js';

/**
 * Movie API endpoints
 */
export const movieAPI = {
    /**
     * Get all movies with optional filters
     * @param {Object} params - Query parameters (page, limit, category, etc.)
     * @returns {Promise} List of movies
     */
    getAll: (params) => api.get('/movies', { params }),

    /**
     * Get single movie by ID
     * @param {string} id - Movie ID
     * @returns {Promise} Movie details
     */
    getOne: (id) => api.get(`/movies/${id}`),

    /**
     * Get movie playback information
     * @param {string} id - Movie ID
     * @returns {Promise} Playback data (HLS URL, etc.)
     */
    play: (id) => api.get(`/movies/${id}/play`),

    /**
     * Create new movie (Admin only)
     * @param {FormData} formData - Movie data and files
     * @param {Object} config - Additional axios config (e.g., onUploadProgress)
     * @returns {Promise} Created movie
     */
    create: (formData, config = {}) => {
        return api.post('/movies', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...config
        });
    },

    /**
     * Update existing movie (Admin only)
     * @param {string} id - Movie ID
     * @param {FormData} formData - Updated movie data
     * @returns {Promise} Updated movie
     */
    update: (id, formData) => {
        return api.put(`/movies/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * Delete movie (Admin only)
     * @param {string} id - Movie ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/movies/${id}`),

    /**
     * Start encoding job for movie (Admin only)
     * @param {string} id - Movie ID
     * @returns {Promise} Encoding job details
     */
    startEncode: (id) => api.post(`/encode/${id}/start`),

    /**
     * Migrate HLS paths (Admin only)
     * @returns {Promise} Migration results
     */
    migrateHlsPaths: () => api.post('/movies/migrate-hls-paths'),

    /**
     * Search movies on TMDb
     * @param {string} query - Search query
     * @returns {Promise} TMDb search results
     */
    searchTMDb: (query) => api.get('/movies/search-tmdb', { params: { query } }),

    /**
     * Get movie details from TMDb
     * @param {string} tmdbId - TMDb movie ID
     * @returns {Promise} TMDb movie details
     */
    getTMDbDetails: (tmdbId) => api.get(`/movies/tmdb/${tmdbId}`),
};
