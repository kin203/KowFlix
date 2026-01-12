import express from 'express';
import {
    getAllReviews,
    getMovieReviews,
    createReview,
    deleteReview,
    updateReview,
    likeReview,
    dislikeReview
} from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// Public routes (but might need auth to post)
router.get('/movie/:movieId', getMovieReviews);

// Protected routes
router.post('/', auth, createReview);
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview); // Controller handles admin/owner check
router.post('/:id/like', auth, likeReview);
router.post('/:id/dislike', auth, dislikeReview);

// Admin routes
router.get('/', auth, isAdmin, getAllReviews);

export default router;
