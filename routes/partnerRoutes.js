import express from 'express';
import { getPartners, getPartner, createPartner, updatePartner, deletePartner, reorderPartners } from '../controllers/partnerController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getPartners);
router.get('/:id', getPartner);
router.put('/reorder', protect, adminOnly, reorderPartners);
router.post('/', protect, adminOnly, upload.single('logo'), createPartner);
router.put('/:id', protect, adminOnly, upload.single('logo'), updatePartner);
router.delete('/:id', protect, adminOnly, deletePartner);

export default router;
