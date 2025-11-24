import Notification from '../models/Notification.js';

// Create new notification
export const createNotification = async (req, res) => {
    try {
        const { title, message, type, targetUsers, expiresAt } = req.body;

        const notification = new Notification({
            title,
            message,
            type: type || 'info',
            targetUsers: targetUsers || [], // Empty = broadcast to all
            expiresAt,
            createdBy: req.user.id
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

// Get all notifications (admin)
export const getAllNotifications = async (req, res) => {
    try {
        const { type, page = 1, limit = 20 } = req.query;

        const query = {};
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .populate('createdBy', 'email profile.name')
            .populate('targetUsers', 'email profile.name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Get notifications for specific user
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Get notifications targeted to this user OR broadcast notifications (empty targetUsers)
        const notifications = await Notification.find({
            $or: [
                { targetUsers: userId },
                { targetUsers: { $size: 0 } }
            ]
        })
            .populate('createdBy', 'email profile.name')
            .sort({ createdAt: -1 })
            .limit(50);

        // Mark which ones this user has read
        const notificationsWithReadStatus = notifications.map(notif => {
            const readByUser = notif.readBy.find(r => r.userId.toString() === userId);
            return {
                ...notif.toObject(),
                isReadByUser: !!readByUser,
                readAt: readByUser?.readAt
            };
        });

        res.json({
            success: true,
            data: notificationsWithReadStatus
        });
    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user notifications',
            error: error.message
        });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if already read by this user
        const alreadyRead = notification.readBy.some(r => r.userId.toString() === userId);
        if (!alreadyRead) {
            notification.readBy.push({ userId, readAt: new Date() });
            await notification.save();
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// Delete notification (admin only)
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Get notification stats (admin)
export const getNotificationStats = async (req, res) => {
    try {
        const total = await Notification.countDocuments();
        const byType = await Notification.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                total,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification stats',
            error: error.message
        });
    }
};
