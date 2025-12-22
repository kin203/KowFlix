import express from 'express';
import {
    getAllJobs,
    getJob,
    createJob,
    updateJobProgress,
    deleteJob,
    cleanupOldJobs,
    getQueueStatus,
    cancelJob,
    cancelAllJobs
} from '../controllers/jobController.js';
import auth from '../middleware/auth.js';
import isAdmin from '../middleware/admin.js';

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(isAdmin);

// Job routes
router.get('/', getAllJobs);
router.get('/queue-status', getQueueStatus); // Queue status endpoint
router.post('/cancel-all', cancelAllJobs); // Cancel all jobs (must be before /:id routes)
router.get('/:id', getJob);
router.post('/', createJob);
router.put('/:id/progress', updateJobProgress);
router.post('/:id/cancel', cancelJob); // Cancel single job
router.delete('/:id', deleteJob);
router.post('/cleanup', cleanupOldJobs);

export default router;
