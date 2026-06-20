import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getRecentApplications, getApplication,
  updateApplicationStatus, deleteApplication,
} from '../controllers/auditionApplicationController.js';

const router = express.Router();

router.get('/recent', protect, adminOnly, getRecentApplications);
router.get('/:id', protect, adminOnly, getApplication);
router.put('/:id/status', protect, adminOnly, updateApplicationStatus);
router.delete('/:id', protect, adminOnly, deleteApplication);

export default router;
