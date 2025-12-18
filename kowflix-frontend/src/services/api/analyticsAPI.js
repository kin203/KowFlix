// src/services/api/analyticsAPI.js
import api from './index.js';

/**
 * Analytics API endpoints (Admin only)
 */
export const analyticsAPI = {
    /**
     * Get dashboard statistics
     * @returns {Promise} Dashboard stats (total movies, users, views, etc.)
     */
    getStats: () => api.get('/analytics/stats'),

    /**
     * Get weekly views data
     * @returns {Promise} Weekly views chart data
     */
    getWeeklyViews: () => api.get('/analytics/weekly-views'),

    /**
     * Get top movies by views
     * @param {number} limit - Number of movies to return (default: 5)
     * @returns {Promise} Top movies list
     */
    getTopMovies: (limit = 5) => api.get('/analytics/top-movies', { params: { limit } }),

    /**
     * Get top rated movies
     * @param {number} limit - Number of movies to return (default: 5)
     * @returns {Promise} Top rated movies list
     */
    getTopRated: (limit = 5) => api.get('/analytics/top-rated', { params: { limit } }),

    /**
     * Get most active users
     * @param {number} limit - Number of users to return (default: 10)
     * @returns {Promise} Active users list
     */
    getActiveUsers: (limit = 10) => api.get('/analytics/active-users', { params: { limit } }),

    /**
     * Get user growth data
     * @returns {Promise} User growth chart data
     */
    getUserGrowth: () => api.get('/analytics/user-growth'),
};
