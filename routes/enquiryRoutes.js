import express from 'express';
import { getEnquiries, getEnquiry, createEnquiry, updateEnquiry, deleteEnquiry } from '../controllers/enquiryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getEnquiries);
router.get('/:id', protect, adminOnly, getEnquiry);
router.post('/', createEnquiry);
router.put('/:id', protect, adminOnly, updateEnquiry);
router.delete('/:id', protect, adminOnly, deleteEnquiry);

export default router;
