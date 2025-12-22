// src/services/api/notificationAPI.js
import api from './index.js';

/**
 * Notification API endpoints
 */
export const notificationAPI = {
    /**
     * Get user notifications
     * @returns {Promise} List of user notifications
     */
    getAll: () => api.get('/notifications'),

    /**
     * Get all notifications (Admin only)
     * @returns {Promise} List of all notifications
     */
    getAllAdmin: () => api.get('/notifications/admin/all'),

    /**
     * Mark notification as read
     * @param {string} id - Notification ID
     * @returns {Promise} Updated notification
     */
    markAsRead: (id) => api.put(`/notifications/${id}/read`),

    /**
     * Mark all notifications as read
     * @returns {Promise} Update confirmation
     */
    markAllAsRead: () => api.put('/notifications/read-all'),

    /**
     * Delete notification
     * @param {string} id - Notification ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/notifications/${id}`),

    /**
     * Delete notification (Admin)
     * @param {string} id - Notification ID
     * @returns {Promise} Deletion confirmation
     */
    deleteAdmin: (id) => api.delete(`/notifications/admin/${id}`),

    /**
     * Create notification (Admin only)
     * @param {Object} data - Notification data
     * @returns {Promise} Created notification
     */
    create: (data) => api.post('/notifications', data),
};
