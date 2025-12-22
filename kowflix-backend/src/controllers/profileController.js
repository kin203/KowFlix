// src/controllers/profileController.js
import User from '../models/User.js';
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
