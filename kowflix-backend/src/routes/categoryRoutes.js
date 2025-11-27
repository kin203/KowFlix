import express from 'express';
import {
    getAllCategories,
    getActiveCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryMovies
} from '../controllers/categoryController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveCategories);
router.get('/:slug/movies', getCategoryMovies);

// Admin routes
router.get('/', auth, isAdmin, getAllCategories);
router.get('/:id', auth, isAdmin, getCategory);
router.post('/', auth, isAdmin, createCategory);
router.put('/:id', auth, isAdmin, updateCategory);
router.delete('/:id', auth, isAdmin, deleteCategory);
router.post('/reorder', auth, isAdmin, reorderCategories);

export default router;
