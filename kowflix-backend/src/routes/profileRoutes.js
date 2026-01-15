// src/routes/profileRoutes.js
import express from 'express';
import { getStats, getProfile, updateProfile, uploadAvatar as uploadAvatarController, deleteAvatar } from '../controllers/profileController.js';
import auth from '../middleware/auth.js';
import { uploadAvatar } from '../utils/cloudinary.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/profile - Get current user profile
router.get('/', getProfile);

// PUT /api/profile - Update profile (name, bio)
router.put('/', updateProfile);

// Get user stats
router.get('/stats', getStats);

// POST /api/profile/avatar - Upload avatar
router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarController);

// DELETE /api/profile/avatar - Delete avatar
router.delete('/avatar', deleteAvatar);

export default router;
