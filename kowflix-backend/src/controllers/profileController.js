import User from '../models/User.js';
import WatchProgress from '../models/WatchProgress.js';
import Comment from '../models/Comment.js';
import { deleteAvatar as deleteCloudinaryAvatar } from '../utils/cloudinary.js';

// ====================== GET PROFILE ======================
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ====================== UPDATE PROFILE ======================
export const updateProfile = async (req, res) => {
    try {
        const { name, bio } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update profile fields
        if (name !== undefined) user.profile.name = name;
        if (bio !== undefined) user.profile.bio = bio;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ====================== UPLOAD AVATAR ======================
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete old avatar from Cloudinary if exists
        if (user.profile.avatarPublicId) {
            await deleteCloudinaryAvatar(user.profile.avatarPublicId);
        }

        // Update user with new avatar
        user.profile.avatar = req.file.path; // Cloudinary URL
        user.profile.avatarPublicId = req.file.filename; // Cloudinary public ID

        await user.save();

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: user.profile.avatar,
                avatarPublicId: user.profile.avatarPublicId
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ====================== DELETE AVATAR ======================
export const deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete from Cloudinary if exists
        if (user.profile.avatarPublicId) {
            await deleteCloudinaryAvatar(user.profile.avatarPublicId);
        }

        // Clear avatar fields
        user.profile.avatar = '';
        user.profile.avatarPublicId = '';

        await user.save();

        res.json({
            success: true,
            message: 'Avatar deleted successfully'
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// ====================== GET STATS ======================
export const getStats = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to use req.user.id consistently

        // 1. Count Watch History (unique movies watched)
        const historyCount = await WatchProgress.countDocuments({ userId });

        // 2. Count Comments
        const commentCount = await Comment.countDocuments({ userId });

        // 3. Count Wishlist (Favorites) - stored in User model as 'wishlist' array
        const user = await User.findById(userId);
        const wishlistCount = user?.wishlist?.length || 0;

        res.json({
            success: true,
            data: {
                historyCount,
                commentCount,
                wishlistCount,
                debugUserId: userId // Debugging
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ====================== UPDATE MOBILE SETTINGS ======================
export const updateMobileSettings = async (req, res) => {
    try {
        const { theme } = req.body;

        if (!theme) {
            return res.status(400).json({ success: false, message: 'Missing theme setting' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize mobileSettings if disjoint
        if (!user.mobileSettings) {
            user.mobileSettings = {};
        }

        user.mobileSettings.theme = theme;
        await user.save();

        res.json({
            success: true,
            message: 'Settings updated',
            data: {
                mobileSettings: user.mobileSettings
            }
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
