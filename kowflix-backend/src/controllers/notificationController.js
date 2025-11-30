import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
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
export const markAsRead = async (req, res) => {
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
export const markAllAsRead = async (req, res) => {
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
export const deleteNotification = async (req, res) => {
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

// Delete notification (Admin)
export const deleteNotificationAdmin = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        // If it has a batchId, delete all in that batch
        if (notification.batchId) {
            await Notification.deleteMany({ batchId: notification.batchId });
            res.json({
                success: true,
                message: 'Đã xóa nhóm thông báo (Admin)'
            });
        } else {
            // Single deletion
            await Notification.findByIdAndDelete(req.params.id);
            res.json({
                success: true,
                message: 'Đã xóa thông báo (Admin)'
            });
        }
    } catch (error) {
        console.error('Admin delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thông báo'
        });
    }
};

// Create notification (for admin or system)
export const createNotification = async (req, res) => {
    try {
        const { userId, type, title, message, link, targetUsers, expiresAt } = req.body;
        let notificationsToCreate = [];
        const batchId = new mongoose.Types.ObjectId().toString(); // Generate unique batch ID

        // Case 1: Single user (legacy support or specific API call)
        if (userId) {
            notificationsToCreate.push({
                userId,
                type,
                title,
                message,
                link,
                expiresAt,
                batchId
            });
        }
        // Case 2: Specific target users
        else if (targetUsers && targetUsers.length > 0) {
            notificationsToCreate = targetUsers.map(uid => ({
                userId: uid,
                type,
                title,
                message,
                link,
                targetUsers, // Store metadata
                expiresAt,
                batchId
            }));
        }
        // Case 3: Broadcast (All users)
        else {
            const users = await User.find({}, '_id');
            notificationsToCreate = users.map(user => ({
                userId: user._id,
                type,
                title,
                message,
                link,
                targetUsers: [], // Metadata indicating broadcast
                expiresAt,
                batchId
            }));
        }

        if (notificationsToCreate.length > 0) {
            await Notification.insertMany(notificationsToCreate);
        }

        res.status(201).json({
            success: true,
            message: `Đã tạo ${notificationsToCreate.length} thông báo`,
            data: notificationsToCreate[0] // Return first one as sample
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
export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $ifNull: ["$batchId", false] },
                            then: "$batchId",
                            else: "$_id"
                        }
                    },
                    doc: { $first: "$$ROOT" },
                    count: { $sum: 1 },
                    readCount: { $sum: { $cond: ["$isRead", 1, 0] } }
                }
            },
            {
                $sort: { "doc.createdAt": -1 }
            },
            {
                $limit: 100
            }
        ]);

        // Populate userId manually since aggregate doesn't support populate directly easily
        await Notification.populate(notifications, { path: 'doc.userId', select: 'email username' });

        // Flatten the structure for frontend compatibility
        const formattedNotifications = notifications.map(item => ({
            ...item.doc,
            receiverCount: item.count,
            readCount: item.readCount,
            readBy: item.readCount ? [{ length: item.readCount }] : [] // Mock readBy for frontend
        }));

        // Fix: Count unique batches instead of all records
        const totalBatches = notifications.length; // This counts unique batches

        const byTypeResult = await Notification.aggregate([
            {
                $group: {
                    _id: {
                        type: '$type',
                        batchId: {
                            $cond: {
                                if: { $ifNull: ["$batchId", false] },
                                then: "$batchId",
                                else: "$_id"
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$_id.type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const byType = {};
        byTypeResult.forEach(item => {
            byType[item._id] = item.count;
        });

        res.json({
            success: true,
            data: formattedNotifications,
            stats: {
                total: totalBatches, // Now counts batches, not individual records
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
