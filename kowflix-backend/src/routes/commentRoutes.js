import express from 'express';
import {
    getMovieComments,
    createComment,
    deleteComment
} from '../controllers/commentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieComments);

// Protected routes
router.post('/', auth, createComment);
router.delete('/:id', auth, deleteComment);

export default router;
