import express from 'express';
import { getApplication, updateApplicationStatus, deleteApplication, getRecentApplications } from '../controllers/auditionApplicationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recent', protect, adminOnly, getRecentApplications);
router.get('/:appId', protect, adminOnly, getApplication);
router.put('/:appId/status', protect, adminOnly, updateApplicationStatus);
router.delete('/:appId', protect, adminOnly, deleteApplication);

export default router;
