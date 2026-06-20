import express from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getAuditions, getAudition, createAudition, updateAudition,
  extendDeadline, reorderAuditions, deleteAudition,
  getAuditionApplications, applyToAudition,
} from '../controllers/auditionController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAuditions);
router.post('/', protect, adminOnly, upload.single('featureImage'), createAudition);
router.put('/reorder', protect, adminOnly, reorderAuditions);
router.get('/:id', getAudition);
router.put('/:id', protect, adminOnly, upload.single('featureImage'), updateAudition);
router.patch('/:id/extend-deadline', protect, adminOnly, extendDeadline);
router.delete('/:id', protect, adminOnly, deleteAudition);

router.get('/:id/applications', protect, adminOnly, getAuditionApplications);
router.post('/:id/apply', upload.single('photo'), applyToAudition);

export default router;
