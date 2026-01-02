// src/routes/progressRoutes.js
import express from 'express';
import {
    saveProgress,
    getProgress,
    getAllProgress,
    deleteProgress,
    getWatchHistory
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all user's watch progress (Continue Watching)
router.get('/', getAllProgress);

// Get watch history (all watched movies including completed)
// IMPORTANT: This must come BEFORE /:movieId to avoid conflict
router.get('/history', getWatchHistory);

// Save/update progress for a movie
router.post('/:movieId', saveProgress);

// Get progress for a specific movie
router.get('/:movieId', getProgress);

// Delete progress for a movie
router.delete('/:movieId', deleteProgress);

export default router;
