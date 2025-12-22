import api from './index';

export const heroAPI = {
    // Get all hero banners
    getAll: (activeOnly = false) => api.get('/hero', { params: { active: activeOnly } }),

    // Get hero banner by ID
    getById: (id) => api.get(`/hero/${id}`),
};
