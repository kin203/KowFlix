import express from 'express';
import {
    createComment,
    getCommentsByMovie,
    likeComment,
    dislikeComment,
    updateComment,
    deleteComment,
    reportComment
} from '../controllers/commentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/movie/:movieId', getCommentsByMovie);

// Protected routes
router.post('/', auth, createComment);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);
router.post('/:id/like', auth, likeComment);
router.post('/:id/dislike', auth, dislikeComment);
router.post('/:id/report', auth, reportComment);

export default router;
