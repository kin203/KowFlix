const Notification = require('../models/Notification');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false
        });

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo'
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu đã đọc'
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả là đã đọc'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu tất cả đã đọc'
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa thông báo'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thông báo'
        });
    }
};

// Create notification (for admin or system)
exports.createNotification = async (req, res) => {
    try {
        const { userId, type, title, message, link } = req.body;

        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            link
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo'
        });
    }
};

// Get all notifications (admin only)
exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('userId', 'email username')
            .sort({ createdAt: -1 })
            .limit(100);

        const total = await Notification.countDocuments();

        const byTypeResult = await Notification.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const byType = {};
        byTypeResult.forEach(item => {
            byType[item._id] = item.count;
        });

        res.json({
            success: true,
            data: notifications,
            stats: {
                total,
                byType
            }
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thông báo'
        });
    }
};

