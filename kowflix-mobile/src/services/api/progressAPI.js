import api from './index';

export const progressAPI = {
    // Get watch progress for a movie
    get: (movieId) => api.get(`/progress/${movieId}`),

    // Save watch progress
    save: (movieId, data) => api.post(`/progress/${movieId}`, data),

    // Get all user progress
    getAll: () => api.get('/progress'),
};
