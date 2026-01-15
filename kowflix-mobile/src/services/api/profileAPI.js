import api from './index';

export const profileAPI = {
    // Get user profile
    getProfile: () => api.get('/profile'),

    // Update user profile
    updateProfile: (data) => api.put('/profile', data),

    // Upload avatar
    uploadAvatar: (formData) => api.post('/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // Get user statistics (history, comments, wishlist)
    getStats: () => api.get('/profile/stats'),
};
