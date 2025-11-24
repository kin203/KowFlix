import express from 'express';
const router = express.Router();
import {
    createNotification,
    getAllNotifications,
    getUserNotifications,
    markAsRead,
    deleteNotification,
    getNotificationStats
} from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

// Admin routes
router.post('/', auth, isAdmin, createNotification);
router.get('/', auth, isAdmin, getAllNotifications);
router.get('/stats', auth, isAdmin, getNotificationStats);
router.delete('/:id', auth, isAdmin, deleteNotification);

// User routes
router.get('/user', auth, getUserNotifications);
router.get('/user/:userId', auth, getUserNotifications);
router.put('/:id/read', auth, markAsRead);

export default router;
