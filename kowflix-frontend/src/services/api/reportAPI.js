
import api from './index.js';

export const reportAPI = {
    /**
     * Create a new report
     * @param {Object} data - Report data { movieId, reason, description }
     */
    create: (data) => api.post('/reports', data),

    /**
     * Get all reports (Admin)
     */
    getAll: () => api.get('/reports'),

    /**
     * Update report status (Admin)
     * @param {string} id - Report ID
     * @param {string} status - New status
     */
    updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status })
};
