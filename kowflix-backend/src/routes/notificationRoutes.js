import express from 'express';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getAllNotifications,
    deleteNotificationAdmin
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// User routes (protected)
router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes (protected + admin check can be added)
router.get('/admin/all', protect, getAllNotifications);
router.post('/', protect, createNotification);
router.delete('/admin/:id', protect, deleteNotificationAdmin); // Add missing admin delete route

export default router;

