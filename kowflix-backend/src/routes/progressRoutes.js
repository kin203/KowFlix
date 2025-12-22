// src/routes/progressRoutes.js
import express from 'express';
import {
    saveProgress,
    getProgress,
    getAllProgress,
    deleteProgress
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Save/update progress for a movie
router.post('/:movieId', saveProgress);

// Get progress for a specific movie
router.get('/:movieId', getProgress);

// Get all user's watch progress
router.get('/', getAllProgress);

// Delete progress for a movie
router.delete('/:movieId', deleteProgress);

export default router;
