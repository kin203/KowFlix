import express from 'express';
import {
    getMovieComments,
    createComment,
    deleteComment,
    likeComment,
    dislikeComment,
    reportComment
} from '../controllers/commentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getMovieComments);

// Protected routes
router.post('/', auth, createComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, likeComment);
router.post('/:id/dislike', auth, dislikeComment);
router.put('/:id', auth, updateComment);
router.post('/:id/report', auth, reportComment);

export default router;
