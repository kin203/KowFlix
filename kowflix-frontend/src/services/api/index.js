// src/services/api/index.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to attach authentication token
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors
        if (error.response) {
            const { status, data } = error.response;

            // Unauthorized - redirect to login
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            // Log error for debugging
            console.error('API Error:', {
                status,
                message: data?.message || error.message,
                url: error.config?.url
            });
        } else if (error.request) {
            console.error('Network Error: No response received');
        } else {
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
export { API_URL };

// Export individual API modules
export { authAPI } from './authAPI.js';
export { analyticsAPI } from './analyticsAPI.js';
export { categoryAPI } from './categoryAPI.js';
export { commentAPI } from './commentAPI.js';
export { heroAPI } from './heroAPI.js';
export { jobAPI } from './jobAPI.js';
export { movieAPI } from './movieAPI.js';
export { navMenuAPI } from './navMenuAPI.js';
export { notificationAPI } from './notificationAPI.js';
export { progressAPI } from './progressAPI.js';
export { reviewAPI } from './reviewAPI.js';
export { settingAPI } from './settingAPI.js';
export { userAPI } from './userAPI.js';
export { wishlistAPI } from './wishlistAPI.js';
export { default as storageAPI } from './storageAPI.js';
