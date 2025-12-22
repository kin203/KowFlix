import api from './index';

export const notificationAPI = {
    // Get all notifications for current user
    getAll: () => api.get('/notifications'),

    // Mark notification as read
    markAsRead: (id) => api.put(`/notifications/${id}/read`),

    // Mark all as read
    markAllAsRead: () => api.put('/notifications/read-all'),

    // Delete notification
    delete: (id) => api.delete(`/notifications/${id}`),
};
