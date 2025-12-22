import api from './index';

export const authAPI = {
    // Login
    login: (credentials) => api.post('/auth/login', credentials),

    // Register
    register: (userData) => api.post('/auth/register', userData),

    // Get profile
    getProfile: () => api.get('/profile'),

    // Update profile
    updateProfile: (data) => api.put('/profile', data),

    // Upload avatar
    uploadAvatar: (formData) => api.post('/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // Delete avatar
    deleteAvatar: () => api.delete('/profile/avatar'),

    // Logout (optional - mainly client-side)
    logout: () => api.post('/auth/logout'),
};
