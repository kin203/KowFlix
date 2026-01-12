
import express from 'express';
import { createReport, getAllReports, updateReportStatus } from '../controllers/reportController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create report (Protected)
router.post('/', auth, createReport);

// Admin routes (Protected + Admin check usually, but for now just auth + role check inside or rely on basic auth if not strictly separated)
// Assuming auth middleware adds user to req.user. You might want an 'admin' middleware later.
router.get('/', auth, getAllReports);
router.patch('/:id/status', auth, updateReportStatus);

export default router;
