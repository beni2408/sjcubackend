import express from 'express';
import {
  getAuditions, getAudition, createAudition, updateAudition,
  extendDeadline, reorderAuditions, deleteAudition,
} from '../controllers/auditionController.js';
import { submitApplication, getApplications } from '../controllers/auditionApplicationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public
router.get('/', getAuditions);
router.get('/:id', getAudition);
router.post('/:id/apply', upload.single('photo'), submitApplication);

// Admin
router.get('/:id/applications', protect, adminOnly, getApplications);
router.post('/', protect, adminOnly, upload.single('featureImage'), createAudition);
router.put('/reorder', protect, adminOnly, reorderAuditions);
router.put('/:id', protect, adminOnly, upload.single('featureImage'), updateAudition);
router.patch('/:id/extend-deadline', protect, adminOnly, extendDeadline);
router.delete('/:id', protect, adminOnly, deleteAudition);

export default router;
