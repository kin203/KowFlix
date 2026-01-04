import api from './index';

export const settingAPI = {
    // Get all settings (public)
    getAll: () => api.get('/settings'),

    // Update a setting (admin only)
    update: (key, value, description) => api.put('/settings', { key, value, description }),

    // Toggle maintenance mode (convenience)
    toggleMaintenance: () => api.post('/settings/maintenance/toggle')
};
