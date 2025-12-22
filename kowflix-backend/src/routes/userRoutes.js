import express from 'express';
import {
    getAllUsers,
    getUser,
    updateUserRole,
    deleteUser
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// All routes require admin authentication
router.use(auth, isAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
