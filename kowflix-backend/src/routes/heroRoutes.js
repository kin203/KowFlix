import express from 'express';
import {
    getHeroBanners,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    reorderHeroBanners
} from '../controllers/heroController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/', getHeroBanners);

// Admin routes
router.post('/', auth, isAdmin, createHeroBanner);
router.put('/:id', auth, isAdmin, updateHeroBanner);
router.delete('/:id', auth, isAdmin, deleteHeroBanner);
router.post('/reorder', auth, isAdmin, reorderHeroBanners);

export default router;
