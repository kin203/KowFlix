import express from 'express';
import {
    getDashboardStats,
    getWeeklyViews,
    getTopMovies,
    getTopRatedMovies,
    getActiveUsers,
    getUserGrowth
} from '../controllers/analyticsController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// All analytics routes require admin authentication
router.get('/stats', auth, isAdmin, getDashboardStats);
router.get('/weekly-views', auth, isAdmin, getWeeklyViews);
router.get('/top-movies', auth, isAdmin, getTopMovies);
router.get('/top-rated', auth, isAdmin, getTopRatedMovies);
router.get('/active-users', auth, isAdmin, getActiveUsers);
router.get('/user-growth', auth, isAdmin, getUserGrowth);

export default router;
