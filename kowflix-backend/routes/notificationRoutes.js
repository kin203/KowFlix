const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// User routes (protected)
router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes (protected + admin check can be added)
router.get('/admin/all', protect, getAllNotifications);
router.post('/', protect, createNotification);

module.exports = router;
