import express from 'express';
import {
  getTestimonials, getAdminTestimonials, getPendingCount,
  submitTestimonial, createTestimonial, updateTestimonial,
  approveTestimonial, deleteTestimonial,
} from '../controllers/testimonialController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/',              getTestimonials);
router.get('/admin',         protect, adminOnly, getAdminTestimonials);
router.get('/pending-count', protect, adminOnly, getPendingCount);
router.post('/submit',       upload.single('photo'), submitTestimonial);
router.post('/',             protect, adminOnly, upload.single('photo'), createTestimonial);
router.put('/:id',           protect, adminOnly, upload.single('photo'), updateTestimonial);
router.patch('/:id/approve', protect, adminOnly, approveTestimonial);
router.delete('/:id',        protect, adminOnly, deleteTestimonial);

export default router;
