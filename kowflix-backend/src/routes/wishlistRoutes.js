// src/routes/wishlistRoutes.js
import express from 'express';
import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    checkInWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user's wishlist
router.get('/', getWishlist);

// Check if movie is in wishlist
router.get('/check/:movieId', checkInWishlist);

// Add movie to wishlist
router.post('/:movieId', addToWishlist);

// Remove movie from wishlist
router.delete('/:movieId', removeFromWishlist);

export default router;
