// src/services/api/authAPI.js
import api, { API_URL } from './index.js';

/**
 * Authentication API endpoints
 */
export const authAPI = {
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Response with token and user data
     */
    login: (email, password) => api.post('/auth/login', { email, password }),

    /**
     * Register new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Response with token and user data
     */
    register: (email, password) => api.post('/auth/register', { email, password }),

    /**
     * Get current user profile
     * @returns {Promise} User profile data
     */
    getProfile: () => api.get('/profile'),

    /**
     * Update user profile
     * @param {Object} data - Profile data to update
     * @returns {Promise} Updated profile data
     */
    updateProfile: (data) => api.put('/profile', data),

    /**
     * Upload user avatar
     * @param {FormData} formData - Form data with avatar file
     * @returns {Promise} Updated profile with avatar URL
     */
    uploadAvatar: (formData) => {
        return api.post('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * Delete user avatar
     * @returns {Promise} Updated profile without avatar
     */
    deleteAvatar: () => api.delete('/profile/avatar'),
};
