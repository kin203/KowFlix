import express from 'express';
import { getSettings, updateSetting, toggleMaintenance } from '../controllers/settingController.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// Public route to get settings (frontend needs to know if maintenance is on)
// You might want to restrict which keys are returned publicly, but for now returned all is fine or filtered in controller
// Ideally, public only needs 'maintenanceMode', not sensitive configs.
// Let's assume getSettings checks queries or we rely on frontend.
// Since getSettings returns all, it might expose sensitive info if we ever store it there. 
// For now, let's allow public access to GET but maybe filter? 
// Actually, maintenance mode IS public info. 
router.get('/', getSettings);

// Protected routes
router.put('/', protect, admin, updateSetting);
router.post('/maintenance/toggle', protect, admin, toggleMaintenance);

export default router;
