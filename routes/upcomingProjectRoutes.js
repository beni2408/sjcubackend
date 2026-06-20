import express from 'express';
import { getAll, getOne, createProject, updateProject, updateStage, deleteStageImage, deleteProject, reorderProjects } from '../controllers/upcomingProjectController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload, uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getOne);
router.put('/reorder', protect, adminOnly, reorderProjects);
router.post('/', protect, adminOnly, upload.single('featureImage'), createProject);
router.put('/:id', protect, adminOnly, upload.single('featureImage'), updateProject);
router.patch('/:id/stage', protect, adminOnly, uploadMultiple, updateStage);
router.delete('/:id/stage-image', protect, adminOnly, deleteStageImage);
router.delete('/:id', protect, adminOnly, deleteProject);

export default router;
