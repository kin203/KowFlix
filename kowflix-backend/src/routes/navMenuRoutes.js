import express from 'express';
import {
    getAllMenuItems,
    getMenuItemsAdmin,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems
} from '../controllers/navMenuController.js';
import { protect } from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// Public route - get active menu items for navbar
router.get('/', getAllMenuItems);

// Admin routes
router.get('/admin/all', protect, isAdmin, getMenuItemsAdmin);
router.post('/', protect, isAdmin, createMenuItem);
router.put('/:id', protect, isAdmin, updateMenuItem);
router.delete('/:id', protect, isAdmin, deleteMenuItem);
router.post('/reorder', protect, isAdmin, reorderMenuItems);

export default router;
